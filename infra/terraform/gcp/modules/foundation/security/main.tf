# Foundation Security modulunde temel firewall kurallari tanimlanir.

locals {
  sanitized_prefix_raw = lower(trimspace(var.name_prefix))
  sanitized_prefix_tmp = replace(replace(local.sanitized_prefix_raw, " ", "-"), "_", "-")
  sanitized_prefix     = trim(local.sanitized_prefix_tmp, "-")
  effective_prefix     = length(local.sanitized_prefix) > 0 ? local.sanitized_prefix : "app"
  internal_ranges      = length(var.internal_source_ranges) > 0 ? var.internal_source_ranges : ["10.0.0.0/8"]
}

# VPC icindeki instancelar arasinda ic trafik izni verir.
resource "google_compute_firewall" "internal" {
  name    = "${local.effective_prefix}-allow-internal"
  network = var.network_id
  project = var.project_id

  direction = "INGRESS"
  priority  = 65534

  source_ranges = local.internal_ranges

  allow {
    protocol = "all"
  }

  description = "VPC icindeki kaynaklarin birbirleri ile iletisime izin verir"

  dynamic "log_config" {
    for_each = var.enable_firewall_logging ? [1] : []
    content {
      metadata = var.firewall_logging_metadata
    }
  }
}

# IAP uzerinden gelen SSH erisimi icin izin kuralidir.
resource "google_compute_firewall" "iap_ssh" {
  name    = "${local.effective_prefix}-allow-iap-ssh"
  network = var.network_id
  project = var.project_id

  direction = "INGRESS"
  priority  = 1000

  source_ranges = ["35.235.240.0/20"]

  target_tags = ["allow-iap-ssh"]

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  description = "IAP IP araligindan gelen SSH baglantilarina izin verir"

  dynamic "log_config" {
    for_each = var.enable_firewall_logging ? [1] : []
    content {
      metadata = var.firewall_logging_metadata
    }
  }
}

resource "google_compute_firewall" "health_checks" {
  name    = "${local.effective_prefix}-allow-health-check"
  network = var.network_id
  project = var.project_id

  direction = "INGRESS"
  priority  = 1000

  source_ranges = [
    "130.211.0.0/22",
    "35.191.0.0/16"
  ]

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  description = "Google load balancer health check IP lerinden gelen trafik icin izin"

  dynamic "log_config" {
    for_each = var.enable_firewall_logging ? [1] : []
    content {
      metadata = var.firewall_logging_metadata
    }
  }
}
