# Foundation Security modulunde temel firewall kurallari tanimlanir.

# VPC icindeki instancelar arasinda ic trafik izni verir.
resource "google_compute_firewall" "internal" {
  name    = "allow-internal"
  network = var.network_id
  project = var.project_id

  direction = "INGRESS"
  priority  = 65534

  source_ranges = [
    "10.0.0.0/8",
    "172.16.0.0/12",
    "192.168.0.0/16"
  ]

  allow {
    protocol = "all"
  }

  description = "VPC icindeki tum kaynaklarin birbiri ile iletisime izin verir"
}

# IAP uzerinden gelen SSH erisimi icin izin kuralidir.
resource "google_compute_firewall" "iap_ssh" {
  name    = "allow-iap-ssh"
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
}
resource "google_compute_firewall" "health_checks" {
  name    = "allow-health-check"
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
}
