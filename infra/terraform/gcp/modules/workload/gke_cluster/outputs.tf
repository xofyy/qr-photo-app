# Cikti Degerleri: workload/gke_cluster modulunden gelen bilgiler.

# Olusan clusterin adini dondurur.
output "cluster_name" {
  description = "GKE cluster adi"
  value       = google_container_cluster.main.name
}

# API endpoint adresini saglar.
output "endpoint" {
  description = "GKE API endpoint adresi"
  value       = google_container_cluster.main.endpoint
}

# Cluster sertifikasini base64 formatinda verir.
output "cluster_ca_certificate" {
  description = "GKE cluster CA sertifikasi"
  value       = google_container_cluster.main.master_auth[0].cluster_ca_certificate
}

# Clusterin bolgesini bildirir.
output "location" {
  description = "GKE cluster bolgesi"
  value       = google_container_cluster.main.location
}
