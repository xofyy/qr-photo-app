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
locals {
  default_admin_cidr = "35.235.240.0/20"

  effective_master_authorized_cidrs = (
    var.master_authorized_network_cidrs != null ? var.master_authorized_network_cidrs :
    var.master_authorized_networks != null ? var.master_authorized_networks :
    var.master_authorized_range != null ? [var.master_authorized_range] :
    [local.default_admin_cidr]
  )
}

resource "google_container_cluster" "main" {
  name     = "${var.name_prefix}-cluster"
  project  = var.project_id
  location = var.cluster_location

  enable_autopilot    = var.enable_autopilot
  deletion_protection = false
  network             = var.network_id
  subnetwork          = var.subnet_id
  initial_node_count  = var.enable_autopilot ? null : 1
  node_locations      = var.node_locations

  dynamic "release_channel" {
    for_each = var.release_channel != null ? [var.release_channel] : []
    content {
      channel = release_channel.value
    }
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = var.pods_secondary_range
    services_secondary_range_name = var.services_secondary_range
  }

  dynamic "master_authorized_networks_config" {
    for_each = length(local.effective_master_authorized_cidrs) > 0 ? [1] : []
    content {
      dynamic "cidr_blocks" {
        for_each = { for idx, cidr in local.effective_master_authorized_cidrs : idx => cidr }
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
resource "google_container_node_pool" "primary" {
  count    = var.enable_autopilot ? 0 : 1
  project  = var.project_id
  location = var.cluster_location
  cluster  = google_container_cluster.main.name

  autoscaling {
    min_node_count = var.node_min_count
    max_node_count = var.node_max_count
  }

  node_config {
    machine_type = var.node_machine_type
    disk_size_gb = var.node_disk_size_gb
    disk_type    = var.node_disk_type
    preemptible  = var.node_preemptible
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}





