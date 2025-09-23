# Cikti Degerleri: foundation/security modulunden saglanan bilgiler.

# VPC ic trafik firewall kuralinin adini dondurur.
output "internal_firewall_name" {
  description = "Ic trafik firewall kural adi"
  value       = google_compute_firewall.internal.name
}

# IAP uzerinden SSH erisimi icin olusturulan firewall kural adi.
output "iap_firewall_name" {
  description = "IAP SSH firewall kural adi"
  value       = google_compute_firewall.iap_ssh.name
}

# Health check firewall kuralinin adini saglar.
output "health_check_firewall_name" {
  description = "Health check firewall kural adi"
  value       = google_compute_firewall.health_checks.name
}
