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
  # backend "gcs" {
  #   bucket = "gcp-terraform-state"
  #   prefix = "qr-photo/terraform"
  # }
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
}

# Foundation: VPC ve subnet yapisi.
module "foundation_network" {
  source                   = "./modules/foundation/network"
  name_prefix              = local.name_prefix
  labels                   = local.default_labels
  project_id               = var.gcp_project_id
  region                   = var.gcp_region
  subnet_cidr_range        = var.vpc_subnet_cidr
  secondary_range_pods     = var.vpc_secondary_pods
  secondary_range_services = var.vpc_secondary_services
}

# Foundation: Firewall kurallari.
module "foundation_security" {
  source      = "./modules/foundation/security"
  name_prefix = local.name_prefix
  labels      = local.default_labels
  project_id  = var.gcp_project_id
  network_id  = module.foundation_network.network_id
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
  namespace             = "-namespace"
  notification_channels = []
  cpu_threshold         = 70
}

# Workload: Autopilot GKE cluster.
module "workload_gke_cluster" {
  source                   = "./modules/workload/gke_cluster"
  name_prefix              = local.name_prefix
  project_id               = var.gcp_project_id
  region                   = var.gcp_region
  network_id               = module.foundation_network.network_id
  subnet_id                = module.foundation_network.subnet_id
  pods_secondary_range     = module.foundation_network.pods_secondary_range
  services_secondary_range = module.foundation_network.services_secondary_range
  release_channel          = var.gke_release_channel
  master_authorized_range  = var.gke_master_authorized_range
}

data "google_client_config" "default" {}

provider "kubernetes" {
  alias                  = "gke"
  host                   = module.workload_gke_cluster.endpoint
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(module.workload_gke_cluster.cluster_ca_certificate)
}

# Workload: Kubernetes namespace, deployment ve servis.
module "workload_gke_workload" {
  source = "./modules/workload/gke_workload"
  providers = {
    kubernetes = kubernetes.gke
  }
  name_prefix           = local.name_prefix
  namespace             = "app-namespace"
  labels                = local.default_labels
  image                 = var.workload_image
  container_port        = var.workload_container_port
  service_port          = var.workload_service_port
  environment_variables = var.workload_env
  hpa_min_replicas      = var.workload_hpa_min
  hpa_max_replicas      = var.workload_hpa_max
  hpa_cpu_target        = var.workload_hpa_cpu
}

# Platform: Cloud Build tetikleyicisi.
module "platform_ci_cd" {
  source         = "./modules/platform/ci_cd"
  name_prefix    = local.name_prefix
  project_id     = var.gcp_project_id
  location       = var.cloudbuild_location
  environment    = var.environment
  github_owner   = var.github_owner
  github_repo    = var.github_repo
  github_branch  = var.github_branch
  build_filename = "cloudbuild.yaml"
  included_files = ["**"]
  ignored_files  = []
  substitutions = {
    _IMAGE = var.workload_image
  }
  service_account = var.cloudbuild_service_account
}

