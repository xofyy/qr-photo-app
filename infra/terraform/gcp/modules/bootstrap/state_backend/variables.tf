variable "project_id" {
  description = "Terraform state bucket'in olusturulacagi GCP proje kimligi"
  type        = string
  nullable    = false
  validation {
    condition     = length(trimspace(var.project_id)) >= 4 && length(trimspace(var.project_id)) <= 30
    error_message = "project_id 4-30 karakter araliginda olmali."
  }
}

variable "bucket_name" {
  description = "Olusturulacak Cloud Storage bucket adi"
  type        = string
  nullable    = false
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$", var.bucket_name)) && !startswith(var.bucket_name, "goog")
    error_message = "Bucket adi 3-63 karakter araliginda, kucuk harf/rakam/nokta/alt tire/tire icermeli ve goog ile baslamamalidir."
  }
}

variable "bucket_location" {
  description = "Bucket'in fiziksel bolgesi (ornegin europe-west1)"
  type        = string
  nullable    = false
  validation {
    condition     = can(regex("^[a-z]+(-[a-z0-9]+)+$", var.bucket_location))
    error_message = "Gecerli bir GCP bolgesi belirtin (orn. europe-west1)."
  }
}

variable "bucket_storage_class" {
  description = "Cloud Storage bucket'inin storage class degeri"
  type        = string
  default     = "STANDARD"
  validation {
    condition = contains([
      "STANDARD",
      "NEARLINE",
      "COLDLINE",
      "ARCHIVE",
    ], upper(var.bucket_storage_class))
    error_message = "Storage class STANDARD, NEARLINE, COLDLINE veya ARCHIVE olabilir."
  }
}

variable "bucket_force_destroy" {
  description = "Bucket silinirken icerigin zorla temizlenip temizlenmeyecegi"
  type        = bool
  default     = false
}

variable "enable_versioning" {
  description = "State bucket icin obje versiyonlamasini etkinlestir"
  type        = bool
  default     = true
}

variable "retention_period_days" {
  description = "Bucket icin objelerin minimum saklama suresi (gun). 0 veya null ise retention uygulanmaz."
  type        = number
  default     = 30
  validation {
    condition     = var.retention_period_days == null || var.retention_period_days >= 0
    error_message = "Retention gun sayisi negatif olamaz."
  }
}

variable "delete_redundant_versions_after" {
  description = "Kaç adet daha yeni versiyon tutulduktan sonra eski versiyonlar silinecek"
  type        = number
  default     = 20
  validation {
    condition     = var.delete_redundant_versions_after >= 1
    error_message = "En az bir versiyon saklanmalidir."
  }
}

variable "state_prefix" {
  description = "Terraform backend prefix degeri"
  type        = string
  default     = "qr-photo/terraform"
  validation {
    condition     = length(trimspace(var.state_prefix)) > 0
    error_message = "state_prefix bos birakilamaz."
  }
}

variable "labels" {
  description = "Cloud Storage bucket'i icin etiketler"
  type        = map(string)
  default     = {}
}

variable "log_bucket" {
  description = "Erisim loglarinin yazilacagi bucket adi (opsiyonel)"
  type        = string
  default     = null
}

variable "log_object_prefix" {
  description = "Log nesneleri icin kullanilacak prefix"
  type        = string
  default     = null
}

variable "admin_principals" {
  description = "roles/storage.admin yetkisi verilecek principal listesi"
  type        = set(string)
  default     = []
}

variable "writer_principals" {
  description = "roles/storage.objectAdmin yetkisi verilecek principal listesi"
  type        = set(string)
  default     = []
}

variable "reader_principals" {
  description = "roles/storage.objectViewer yetkisi verilecek principal listesi"
  type        = set(string)
  default     = []
}
