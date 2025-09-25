# Degiskenler: platform/observability modulunde kullanilan girdiler.

# Kaynak adlandirmasi icin prefix saglar.
variable "name_prefix" {
  description = "Observability kaynak prefixi"
  type        = string
  validation {
    condition     = length(trimspace(var.name_prefix)) > 0
    error_message = "name_prefix bos birakilamaz."
  }
}

# Etiket haritasini tutar.
variable "labels" {
  description = "Observability etiket haritasi"
  type        = map(string)
  default     = {}
}

# Kaynaklarin bagli oldugu proje kimligini belirtir.
variable "project_id" {
  description = "GCP proje kimligi"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,29}$", var.project_id))
    error_message = "project_id gecerli bir GCP proje kimligi olmalidir."
  }
}

# Alarm bildirimlerini gonderecek notification channel listesi.
variable "notification_channels" {
  description = "Monitoring notification channel listesi"
  type        = list(string)
  default     = []
}

# CPU alarmi icin yuzde esik degeri.
variable "cpu_threshold" {
  description = "CPU alarm esik yuzdesi"
  type        = number
  default     = 70
  validation {
    condition     = var.cpu_threshold > 0 && var.cpu_threshold <= 100
    error_message = "cpu_threshold 1 ile 100 arasinda bir deger olmalidir."
  }
}

# Deployment namespace bilgisini log filtrelerinde kullanmak icin.
variable "namespace" {
  description = "Log filtrelerinde kullanilacak namespace"
  type        = string
  default     = "default"
  validation {
    condition     = can(regex("^[a-z0-9]([-a-z0-9]*[a-z0-9])?$", var.namespace))
    error_message = "namespace Kubernetes isimlendirme standartlari ile uyumlu olmalidir."
  }
}
