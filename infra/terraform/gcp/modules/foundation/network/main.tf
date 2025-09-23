# Foundation Network modulunde VPC ve subnet yapisi olusturulur.

locals {
  sanitized_prefix_raw = lower(trimspace(var.name_prefix))
  sanitized_prefix_tmp = replace(replace(local.sanitized_prefix_raw, " ", "-"), "_", "-")
  sanitized_prefix     = trim(local.sanitized_prefix_tmp, "-")
  effective_prefix     = length(local.sanitized_prefix) > 0 ? local.sanitized_prefix : "app"
}

# VPC kaynaklari icin gerekli ayarlamalar burada yapilir.
resource "google_compute_network" "main" {
  name                    = "${local.effective_prefix}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  project                 = var.project_id

  timeouts {
    create = "10m"
    delete = "10m"
  }
}

# Secili bolgedeki public subnet yapilandirmasi.
resource "google_compute_subnetwork" "public" {
  name                     = "${local.effective_prefix}-public"
  ip_cidr_range            = var.subnet_cidr_range
  region                   = var.region
  network                  = google_compute_network.main.id
  project                  = var.project_id
  stack_type               = "IPV4_ONLY"
  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "${local.effective_prefix}-pods"
    ip_cidr_range = var.secondary_range_pods
  }

  secondary_ip_range {
    range_name    = "${local.effective_prefix}-services"
    ip_cidr_range = var.secondary_range_services
  }
}

# Cloud Router olusturarak NAT icin temel saglar.
resource "google_compute_router" "main" {
  name    = "${local.effective_prefix}-router"
  region  = var.region
  network = google_compute_network.main.id
  project = var.project_id

  bgp {
    asn = 64514
  }
}

# Internet cikisi icin Cloud NAT kurulumu.
resource "google_compute_router_nat" "main" {
  name                                = "${local.effective_prefix}-nat"
  router                              = google_compute_router.main.name
  region                              = var.region
  project                             = var.project_id
  nat_ip_allocate_option              = "AUTO_ONLY"
  enable_endpoint_independent_mapping = true

  subnetwork {
    name                              = google_compute_subnetwork.public.name
    source_ip_ranges_to_nat           = ["ALL_IP_RANGES"]
  }
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}


