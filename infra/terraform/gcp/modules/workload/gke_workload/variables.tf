# Degiskenler: workload/gke_workload modulunde kullanilan girdiler.

# Kubernetes kaynaklari icin prefix degerini tanimlar.
variable "name_prefix" {
  description = "Kubernetes kaynak prefixi"
  type        = string
}

# Namespace adini belirtir.
variable "namespace" {
  description = "Kubernetes namespace adi"
  type        = string
}

# Kaynaklara eklenecek etiketleri tutar.
variable "labels" {
  description = "Kubernetes etiket haritasi"
  type        = map(string)
  default     = {}
}

# Container imaj referansini saglar.
variable "image" {
  description = "Container imaj referansi"
  type        = string
}

# Container icin port numarasini tanimlar.
variable "container_port" {
  description = "Container port numarasi"
  type        = number
}

# Servisin disari acacagi port degeri.
variable "service_port" {
  description = "Servis port numarasi"
  type        = number
  default     = 80
}

# Kubernetes servis tipi.
variable "service_type" {
  description = "Kubernetes servis tipi"
  type        = string
  default     = "LoadBalancer"
}

# Deployment icin baslangic replica sayisi.
variable "replicas" {
  description = "Deployment replica sayisi"
  type        = number
  default     = 2
}

# Container kaynak isteklerini tanimlar.
variable "resource_requests" {
  description = "Container kaynak istek haritasi"
  type        = map(string)
  default = {
    cpu    = "250m"
    memory = "256Mi"
  }
}

# Container kaynak limitlerini tanimlar.
variable "resource_limits" {
  description = "Container kaynak limit haritasi"
  type        = map(string)
  default = {
    cpu    = "500m"
    memory = "512Mi"
  }
}

# Ortam degiskenlerini name/value listesi olarak alir.
variable "environment_variables" {
  description = "Kubernetes ortam degisken listesi"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

# HPA icin minimum replica sayisi.
variable "hpa_min_replicas" {
  description = "HPA minimum replica"
  type        = number
  default     = 2
}

# HPA icin maksimum replica sayisi.
variable "hpa_max_replicas" {
  description = "HPA maksimum replica"
  type        = number
  default     = 5
}

# Hedef CPU yuzdesi.
variable "hpa_cpu_target" {
  description = "HPA hedef CPU yuzdesi"
  type        = number
  default     = 60
}
