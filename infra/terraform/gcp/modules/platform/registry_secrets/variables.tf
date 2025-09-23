# Degiskenler: platform/registry_secrets modulunde kullanilan girdiler.

# Kaynak adlari icin kullanilan prefix degerini tanimlar.
variable "name_prefix" {
  description = "Registry ve secret kaynaklari icin prefix"
  type        = string
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
}

# Artifact Registry deposunun bulunacagi lokasyonu tanimlar.
variable "location" {
  description = "Artifact Registry lokasyonu"
  type        = string
}

# Artifact Registry deposu icin benzersiz kimlik.
variable "repository_id" {
  description = "Artifact Repository kimligi"
  type        = string
}

# Secret Manager icine yazilacak gizli deger mapini tutar.
variable "secrets" {
  description = "Secret Manager icin gizli deger map"
  type        = map(string)
  default     = {}
}
