# Degiskenler: platform/observability modulunde kullanilan girdiler.

# Gozlenebilirlik kaynaklari icin prefix degerini belirler.
variable "name_prefix" {
  description = "Gozlenebilirlik kaynaklari icin prefix"
  type        = string
}

# Gozlenebilirlik kaynaklarina uygulanacak tagleri tanimlar.
variable "tags" {
  description = "Gozlenebilirlik kaynaklari icin tag haritasi"
  type        = map(string)
  default     = {}
}

# CloudWatch log grubunun adini override etmek icin kullanilir.
variable "log_group_name" {
  description = "Log grubu adini override eden opsiyonel deger"
  type        = string
  default     = null
}

# Log verisinin kac gun saklanacagini belirler.
variable "retention_in_days" {
  description = "Log saklama suresi (gun)"
  type        = number
  default     = 30
}

# Log sifrelemesi icin opsiyonel KMS anahti ARN degerini saglar.
variable "kms_key_arn" {
  description = "Log sifrelemesi icin opsiyonel KMS anahti ARN"
  type        = string
  default     = null
}
