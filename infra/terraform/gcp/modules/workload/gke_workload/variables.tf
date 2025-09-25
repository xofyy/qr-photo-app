# Degiskenler: workload/gke_workload modulunde kullanilan girdiler.

# Kubernetes kaynaklari icin prefix degerini tanimlar.
variable "name_prefix" {
  description = "Kubernetes kaynak prefixi"
  type        = string
  validation {
    condition     = length(trimspace(var.name_prefix)) > 0
    error_message = "name_prefix bos birakilamaz."
  }
}

# Namespace adini belirtir.
variable "namespace" {
  description = "Kubernetes namespace adi"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$", var.namespace))
    error_message = "namespace Kubernetes isimlendirme standartlari ile uyumlu olmalidir."
  }
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
  validation {
    condition     = length(trimspace(var.image)) > 0
    error_message = "image bos birakilamaz."
  }
}

# Container icin port numarasini tanimlar.
variable "container_port" {
  description = "Container port numarasi"
  type        = number
  validation {
    condition     = var.container_port > 0 && var.container_port <= 65535
    error_message = "container_port 1 ile 65535 arasinda olmali."
  }
}

# Servisin disari acacagi port degeri.
variable "service_port" {
  description = "Servis port numarasi"
  type        = number
  default     = 80
  validation {
    condition     = var.service_port > 0 && var.service_port <= 65535
    error_message = "service_port 1 ile 65535 arasinda olmali."
  }
}

# Kubernetes servis tipi.
variable "service_type" {
  description = "Kubernetes servis tipi"
  type        = string
  default     = "LoadBalancer"
  validation {
    condition     = contains(["ClusterIP", "LoadBalancer", "NodePort"], var.service_type)
    error_message = "service_type yalnizca ClusterIP, LoadBalancer veya NodePort olabilir."
  }
}

# Deployment icin baslangic replica sayisi.
variable "replicas" {
  description = "Deployment replica sayisi"
  type        = number
  default     = 2
  validation {
    condition     = var.replicas >= 1
    error_message = "replicas en az 1 olmalidir."
  }
}

# Container kaynak isteklerini tanimlar.
variable "resource_requests" {
  description = "Container kaynak istek haritasi"
  type        = map(string)
  default = {
    cpu    = "250m"
    memory = "256Mi"
  }
  validation {
    condition = alltrue([
      for value in values(var.resource_requests) : length(trimspace(value)) > 0
    ])
    error_message = "resource_requests icindeki tum degerler bos olmayan stringler olmalidir."
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
  validation {
    condition = alltrue([
      for value in values(var.resource_limits) : length(trimspace(value)) > 0
    ])
    error_message = "resource_limits icindeki tum degerler bos olmayan stringler olmalidir."
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
  validation {
    condition = alltrue([
      for env in var.environment_variables : length(trimspace(env.name)) > 0
      ]) && length(var.environment_variables) == length(distinct([
        for env in var.environment_variables : env.name
    ]))
    error_message = "environment_variables icindeki tum degiskenler benzersiz ve bos olmayan isimlere sahip olmalidir."
  }
}

# HPA icin minimum replica sayisi.
variable "hpa_min_replicas" {
  description = "HPA minimum replica"
  type        = number
  default     = 2
  validation {
    condition     = var.hpa_min_replicas >= 1
    error_message = "hpa_min_replicas en az 1 olmalidir."
  }
}

# HPA icin maksimum replica sayisi.
variable "hpa_max_replicas" {
  description = "HPA maksimum replica"
  type        = number
  default     = 5
  validation {
    condition     = var.hpa_max_replicas >= 1
    error_message = "hpa_max_replicas en az 1 olmalidir."
  }
}

# Hedef CPU yuzdesi.
variable "hpa_cpu_target" {
  description = "HPA hedef CPU yuzdesi"
  type        = number
  default     = 60
  validation {
    condition     = var.hpa_cpu_target >= 1 && var.hpa_cpu_target <= 100
    error_message = "hpa_cpu_target 1 ile 100 arasinda bir deger olmalidir."
  }
}

# Sensitive environment variables that will be mounted via Kubernetes secrets.
variable "secret_environment_variables" {
  description = "Sensitive environment variables injected via Kubernetes secret"
  type        = map(string)
  default     = {}
  validation {
    condition = alltrue([
      for value in values(var.secret_environment_variables) : length(value) > 0
    ])
    error_message = "secret_environment_variables icindeki tum degerler bos olmayan stringler olmalidir."
  }
}
