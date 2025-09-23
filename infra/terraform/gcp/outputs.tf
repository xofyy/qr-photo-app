# -----------------------------------------------------------------------------
# Cikti Degerleri: GCP altyapisindan elde edilen temel bilgiler
# -----------------------------------------------------------------------------

# GKE cluster adi.
output "gke_cluster_name" {
  description = "Olusan GKE cluster adi"
  value       = module.workload_gke_cluster.cluster_name
}

# GKE API endpoint adresi.
output "gke_endpoint" {
  description = "GKE API endpoint"
  value       = module.workload_gke_cluster.endpoint
}

# Kubernetes servis adi.
output "kubernetes_service_name" {
  description = "Kubernetes servis adi"
  value       = module.workload_gke_workload.service_name
}

# Kubernetes servis IP (load balancer varsa).
output "kubernetes_service_ip" {
  description = "Kubernetes servis IP"
  value       = module.workload_gke_workload.service_ip
}

# Artifact Registry deposu adi.
output "artifact_repository" {
  description = "Artifact Registry depo adi"
  value       = module.platform_registry_secrets.repository_name
}

# Cloud Build tetikleyici kimligi.
output "cloudbuild_trigger_id" {
  description = "Cloud Build tetikleyici kimligi"
  value       = module.platform_ci_cd.trigger_id
}

# Log metrik adi.
output "log_metric_name" {
  description = "Olusmus log metrik adi"
  value       = module.platform_observability.log_metric_name
}
