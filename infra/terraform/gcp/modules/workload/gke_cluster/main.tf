# Workload gke_cluster modulunde Autopilot Kubernetes ortami hazirlanir.

# Gerekli API servislerini etkinlestirir.
resource "google_project_service" "required" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_on_destroy = false
}

# Autopilot modu ile GKE cluster olusturur.
resource "google_container_cluster" "main" {
  name     = "${var.name_prefix}-cluster"
  project  = var.project_id
  location = var.region

  enable_autopilot    = true
  deletion_protection = false
  network             = var.network_id
  subnetwork          = var.subnet_id
  release_channel {
    channel = var.release_channel
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = var.pods_secondary_range
    services_secondary_range_name = var.services_secondary_range
  }

  vertical_pod_autoscaling {
    enabled = true
  }

  dynamic "master_authorized_networks_config" {
    for_each = length(var.master_authorized_networks) > 0 ? [1] : []
    content {
      dynamic "cidr_blocks" {
        for_each = { for idx, cidr in var.master_authorized_networks : idx => cidr }
        content {
          display_name = "admin-${cidr_blocks.key}"
          cidr_block   = cidr_blocks.value
        }
      }
    }
  }

  logging_config {
    enable_components = ["SYSTEM_COMPONENTS", "WORKLOADS"]
  }

  monitoring_config {
    enable_components = ["SYSTEM_COMPONENTS"]
  }

  timeouts {
    create = "30m"
    update = "30m"
  }

  depends_on = [google_project_service.required]
}
