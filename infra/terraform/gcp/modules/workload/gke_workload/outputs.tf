# Cikti Degerleri: workload/gke_workload modulunden gelen bilgiler.

# Olusan deployment adini dondurur.
output "deployment_name" {
  description = "Kubernetes deployment adi"
  value       = kubernetes_deployment.this.metadata[0].name
}

# Olusan servis adini saglar.
output "service_name" {
  description = "Kubernetes servis adi"
  value       = kubernetes_service.this.metadata[0].name
}

# Servisin IP adresini verir (LoadBalancer ise public IP). Bos olabilir.
output "service_ip" {
  description = "Kubernetes servis IP degeri"
  value       = try(kubernetes_service.this.status[0].load_balancer[0].ingress[0].ip, null)
}

# Namespace adini dondurur.
output "namespace" {
  description = "Kullanilan namespace adi"
  value       = kubernetes_namespace.this.metadata[0].name
}
