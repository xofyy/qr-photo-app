# Degiskenler: platform/observability modulunde kullanilan girdiler.

# Kaynak adlandirmasi icin prefix saglar.
variable "name_prefix" {
  description = "Observability kaynak prefixi"
  type        = string
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
}

# Deployment namespace bilgisini log filtrelerinde kullanmak icin.
variable "namespace" {
  description = "Log filtrelerinde kullanilacak namespace"
  type        = string
  default     = "default"
}
