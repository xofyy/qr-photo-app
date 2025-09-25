variable "project_id" {
  description = "Terraform state kaynaklarinin olusturulacagi proje kimligi"
  type        = string
  nullable    = false
}

variable "region" {
  description = "Default API bolgesi (gcloud icin)"
  type        = string
  default     = "us-central1"
}

variable "bucket_name" {
  description = "Olusturulacak Cloud Storage bucket adi"
  type        = string
}

variable "bucket_location" {
  description = "Bucket'in fiziksel lokasyonu"
  type        = string
  default     = "us-central1"
}

variable "bucket_storage_class" {
  description = "Cloud Storage storage class"
  type        = string
  default     = "STANDARD"
}

variable "bucket_force_destroy" {
  description = "Bucket silinirken icerigin zorla temizlenmesi"
  type        = bool
  default     = false
}

variable "enable_versioning" {
  description = "State icin versiyonlama"
  type        = bool
  default     = true
}

variable "retention_period_days" {
  description = "Obje retention suresi"
  type        = number
  default     = 30
}

variable "delete_redundant_versions_after" {
  description = "Yeni versiyon sayisi bu degere ulastiginda eski versiyonlar silinir"
  type        = number
  default     = 20
}

variable "state_prefix" {
  description = "Terraform backend prefix"
  type        = string
  default     = "qr-photo/terraform"
}

variable "labels" {
  description = "Bucket etiketleri"
  type        = map(string)
  default     = {}
}

variable "log_bucket" {
  description = "Access loglari icin hedef bucket"
  type        = string
  default     = null
}

variable "log_object_prefix" {
  description = "Log objeleri icin prefix"
  type        = string
  default     = null
}

variable "admin_principals" {
  description = "roles/storage.admin yetkisi verilecek principal seti"
  type        = set(string)
  default     = []
}

variable "writer_principals" {
  description = "roles/storage.objectAdmin yetkisi verilecek principal seti"
  type        = set(string)
  default     = []
}

variable "reader_principals" {
  description = "roles/storage.objectViewer yetkisi verilecek principal seti"
  type        = set(string)
  default     = []
}
