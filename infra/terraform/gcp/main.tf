# -----------------------------------------------------------------------------
# Terraform altyapisi: GCP uzerinde GKE tabanli portfolyo ortami
# Temel ag, guvenlik, platform servisleri ve Kubernetes workloadlarini
# moduler bir yapiyla olusturur. Tum yorumlar ASCII olarak hazirlanmistir.
# -----------------------------------------------------------------------------
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.25"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.25"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.25"
    }
  }
  backend "gcs" {}
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "google-beta" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

locals {
  raw_prefix       = lower(format("%s-%s", trimspace(var.project_name), trimspace(var.environment)))
  hyphen_prefix    = replace(replace(local.raw_prefix, " ", "-"), "_", "-")
  trimmed_prefix   = trim(local.hyphen_prefix, "-")
  effective_prefix = length(local.trimmed_prefix) > 0 ? local.trimmed_prefix : "app-env"
  name_prefix      = substr(local.effective_prefix, 0, 32)

  default_labels = merge({
    project     = var.project_name,
    environment = var.environment
  }, var.default_labels)

  internal_source_ranges = length(var.firewall_internal_source_ranges) > 0 ? var.firewall_internal_source_ranges : [var.vpc_subnet_cidr]

  gke_master_authorized_networks = var.gke_master_authorized_networks != null ? var.gke_master_authorized_networks : (
    var.gke_master_authorized_range != null ? [var.gke_master_authorized_range] : null
  )

  artifact_repository_tokens       = regexall("[a-z0-9]+", lower(trimspace(var.artifact_repository_id)))
  artifact_repository_component    = length(local.artifact_repository_tokens) > 0 ? join("-", local.artifact_repository_tokens) : "registry"
  artifact_repository_needs_prefix = !startswith(local.artifact_repository_component, local.name_prefix)

  naming = {
    artifact_registry = substr(local.artifact_repository_needs_prefix ? format("%s-%s", local.name_prefix, local.artifact_repository_component) : local.artifact_repository_component, 0, 63)
    ci_cd_app         = format("%s-app", local.name_prefix)
    ci_cd_tf          = format("%s-tf", local.name_prefix)
  }
}

# Foundation: VPC ve subnet yapisi.
module "foundation_network" {
  source                         = "./modules/foundation/network"
  name_prefix                    = local.name_prefix
  labels                         = local.default_labels
  project_id                     = var.gcp_project_id
  region                         = var.gcp_region
  subnet_cidr_range              = var.vpc_subnet_cidr
  secondary_range_pods           = var.vpc_secondary_pods
  secondary_range_services       = var.vpc_secondary_services
  enable_flow_logs               = var.enable_vpc_flow_logs
  flow_logs_sampling             = var.vpc_flow_logs_sampling
  flow_logs_aggregation_interval = var.vpc_flow_logs_aggregation_interval
  flow_logs_metadata             = var.vpc_flow_logs_metadata
  enable_nat_logging             = var.enable_nat_logging
  nat_logging_filter             = var.nat_logging_filter
}

# Foundation: Firewall kurallari.
module "foundation_security" {
  source                    = "./modules/foundation/security"
  name_prefix               = local.name_prefix
  labels                    = local.default_labels
  project_id                = var.gcp_project_id
  network_id                = module.foundation_network.network_id
  internal_source_ranges    = local.internal_source_ranges
  enable_firewall_logging   = var.enable_firewall_logging
  firewall_logging_metadata = var.firewall_logging_metadata
}

# Platform: Artifact Registry ve Secret Manager.
module "platform_registry_secrets" {
  source        = "./modules/platform/registry_secrets"
  name_prefix   = local.name_prefix
  labels        = local.default_labels
  project_id    = var.gcp_project_id
  location      = var.artifact_location
  repository_id = var.artifact_repository_id
  secrets       = var.initial_secrets
}

# Platform: Observability ayarlari.
module "platform_observability" {
  source                = "./modules/platform/observability"
  name_prefix           = local.name_prefix
  labels                = local.default_labels
  project_id            = var.gcp_project_id
  namespace             = "app-namespace"
  notification_channels = []
  cpu_threshold         = 70
}

# Workload: Autopilot GKE cluster.
module "workload_gke_cluster" {
  source                          = "./modules/workload/gke_cluster"
  name_prefix                     = local.name_prefix
  project_id                      = var.gcp_project_id
  region                          = var.gcp_region
  cluster_location                = coalesce(var.gke_cluster_location, var.gcp_region)
  node_locations                  = var.gke_node_locations
  network_id                      = module.foundation_network.network_id
  subnet_id                       = module.foundation_network.subnet_id
  pods_secondary_range            = module.foundation_network.pods_secondary_range
  services_secondary_range        = module.foundation_network.services_secondary_range
  release_channel                 = var.gke_release_channel
  master_authorized_network_cidrs = local.gke_master_authorized_networks
  master_authorized_range         = var.gke_master_authorized_range
  enable_autopilot                = var.gke_enable_autopilot
  node_machine_type               = var.gke_node_machine_type
  node_disk_size_gb               = var.gke_node_disk_size_gb
  node_disk_type                  = var.gke_node_disk_type
  node_preemptible                = var.gke_node_preemptible
  node_min_count                  = var.gke_node_min_count
  node_max_count                  = var.gke_node_max_count
}

data "google_client_config" "default" {}

provider "kubernetes" {
  alias                  = "gke"
  host                   = "https://${module.workload_gke_cluster.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(module.workload_gke_cluster.cluster_ca_certificate)

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "gcloud"
    args        = ["container", "clusters", "get-credentials", "${local.name_prefix}-cluster", "--region", var.gcp_region, "--project", var.gcp_project_id]
  }
}

# Workload: Kubernetes namespace, deployment ve servis.
module "workload_gke_workload" {
  source = "./modules/workload/gke_workload"
  providers = {
    kubernetes = kubernetes.gke
  }
  depends_on                   = [module.workload_gke_cluster]
  name_prefix                  = local.name_prefix
  namespace                    = "app-namespace"
  labels                       = local.default_labels
  image                        = var.workload_image
  container_port               = var.workload_container_port
  service_port                 = var.workload_service_port
  environment_variables        = var.workload_env
  secret_environment_variables = var.initial_secrets
  hpa_min_replicas             = var.workload_hpa_min
  hpa_max_replicas             = var.workload_hpa_max
  hpa_cpu_target               = var.workload_hpa_cpu
}

# Platform: Cloud Build tetikleyicisi.
module "platform_ci_cd" {
  source          = "./modules/platform/ci_cd"
  name_prefix     = local.naming.ci_cd_app
  project_id      = var.gcp_project_id
  location        = var.cloudbuild_location
  environment     = var.environment
  github_owner    = var.github_owner
  github_repo     = var.github_repo
  github_branch   = var.github_branch
  build_filename  = "infra/terraform/gcp/cloudbuild.yaml"
  included_files  = ["**"]
  ignored_files   = []
  substitutions   = var.ci_cd_substitutions
  service_account = var.cloudbuild_service_account
}

module "platform_ci_cd_terraform" {
  source         = "./modules/platform/ci_cd"
  name_prefix    = local.naming.ci_cd_tf
  project_id     = var.gcp_project_id
  location       = var.cloudbuild_location
  environment    = var.environment
  github_owner   = var.github_owner
  github_repo    = var.github_repo
  github_branch  = var.github_branch
  build_filename = "infra/terraform/gcp/cloudbuild.terraform.yaml"
  included_files = ["infra/terraform/gcp/**"]
  ignored_files  = []
  substitutions = {
    _ENV          = var.environment
    _TFVARS       = format("infra/terraform/gcp/environments/%s.tfvars", var.environment)
    _STATE_BUCKET = var.tf_state_bucket
    _STATE_PREFIX = var.tf_state_prefix
  }
  service_account = var.cloudbuild_service_account
}



