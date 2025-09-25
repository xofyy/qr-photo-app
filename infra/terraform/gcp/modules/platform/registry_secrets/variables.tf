# Degiskenler: platform/registry_secrets modulunde kullanilan girdiler.

# Kaynak adlari icin kullanilan prefix degerini tanimlar.
variable "name_prefix" {
  description = "Registry ve secret kaynaklari icin prefix"
  type        = string
  validation {
    condition     = length(trimspace(var.name_prefix)) > 0
    error_message = "name_prefix bos birakilamaz."
  }
}

# Kaynaklara eklenecek etiketleri tutar.
variable "labels" {
  description = "Kaynak etiketleri"
  type        = map(string)
  default     = {}
}

# Kaynaklarin olusturulacagi proje kimligini belirtir.
variable "project_id" {
  description = "GCP proje kimligi"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,29}$", var.project_id))
    error_message = "project_id gecerli bir GCP proje kimligi olmalidir."
  }
}

# Artifact Registry deposunun bulunacagi lokasyonu tanimlar.
variable "location" {
  description = "Artifact Registry lokasyonu"
  type        = string
  validation {
    condition     = can(regex("^[a-z]+(-[a-z0-9]+[0-9])?$", var.location))
    error_message = "location us, europe veya us-central1 gibi gecerli bir Artifact Registry lokasyonu olmalidir."
  }
}

# Artifact Registry deposu icin benzersiz kimlik.
variable "repository_id" {
  description = "Artifact Repository kimligi"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-_]{2,62}$", var.repository_id))
    error_message = "repository_id kucuk harf ile baslamali ve 3-63 karakter araliginda kucuk harf/rakam/tire/altcizgi icermelidir."
  }
}

# Secret Manager icine yazilacak gizli deger mapini tutar.
variable "secrets" {
  description = "Secret Manager icin gizli deger map"
  type        = map(string)
  default     = {}
}
