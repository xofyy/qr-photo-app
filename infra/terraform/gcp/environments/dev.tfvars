# Development ortamı için örnek değerler

gcp_project_id = "my-gcp-dev"
gcp_region     = "us-central1"
project_name   = "qr-photo"
environment    = "dev"

default_labels = {
  owner       = "platform"
  environment = "dev"
  cost_center = "rnd"
}

vpc_subnet_cidr        = "10.20.0.0/24"
vpc_secondary_pods     = "10.21.0.0/20"
vpc_secondary_services = "10.22.0.0/24"

gke_release_channel             = "REGULAR"
gke_master_authorized_networks  = ["192.168.10.0/24"]
firewall_internal_source_ranges = ["192.168.10.0/24"]

enable_vpc_flow_logs               = true
vpc_flow_logs_sampling             = 0.5
vpc_flow_logs_aggregation_interval = "INTERVAL_10_MIN"
vpc_flow_logs_metadata             = "INCLUDE_ALL_METADATA"

enable_nat_logging = true
nat_logging_filter = "ALL"

enable_firewall_logging   = true
firewall_logging_metadata = "INCLUDE_ALL_METADATA"

artifact_location      = "us-central1"
artifact_repository_id = "qr-photo-backend"

initial_secrets = {
  "database_url" = "postgres://dev-user:dev-pass@dev-host:5432/devdb"
}

workload_image          = "us-central1-docker.pkg.dev/my-gcp-dev/qr-photo-backend/app:latest"
workload_container_port = 8080
workload_service_port   = 80

workload_env = [
  {
    name  = "APP_ENV"
    value = "dev"
  }
]

workload_hpa_min = 2
workload_hpa_max = 4
workload_hpa_cpu = 60

github_owner               = "example-org"
github_repo                = "qr-photo-app"
github_branch              = "main"
cloudbuild_location        = "us-central1"
cloudbuild_service_account = null
