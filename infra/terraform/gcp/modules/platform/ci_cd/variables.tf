# Degiskenler: platform/ci_cd modulunde kullanilan girdiler.

# Kaynak isimlendirmesi icin kullanilacak prefix.
variable "name_prefix" {
  description = "CI/CD kaynak prefixi"
  type        = string
}

# GCP proje kimligini belirtir.
variable "project_id" {
  description = "GCP proje kimligi"
  type        = string
}

# Cloud Build trigger lokasyonunu tanimlar.
variable "location" {
  description = "Cloud Build tetikleyici bolgesi"
  type        = string
}

# Ortam bilgisini etiketlemek icin kullanilir.
variable "environment" {
  description = "Ortam etiketi"
  type        = string
  default     = "dev"
}

# Build islemlerinde kullanilacak GitHub sahibi.
variable "github_owner" {
  description = "GitHub owner bilgisi"
  type        = string
}

# Build islemlerinde kullanilacak repo adi.
variable "github_repo" {
  description = "GitHub repository adi"
  type        = string
}

# Tetiklenecek branch paterni.
variable "github_branch" {
  description = "GitHub branch paterni"
  type        = string
  default     = "main"
}

# Cloud Build betik dosyasi.
variable "build_filename" {
  description = "cloudbuild betik dosyasi"
  type        = string
  default     = "cloudbuild.yaml"
}

# Build icine dahil edilecek dosya kaliplari.
variable "included_files" {
  description = "Cloud Build iceren dosya kaliplari"
  type        = list(string)
  default     = ["**"]
}

# Build icinde yok sayilacak dosya kaliplari.
variable "ignored_files" {
  description = "Cloud Build ignore dosya kaliplari"
  type        = list(string)
  default     = []
}

# Substitution anahtar degerleri.
variable "substitutions" {
  description = "Cloud Build substitution map"
  type        = map(string)
  default     = {}
}

# Build islemleri icin kullanilacak service account.
variable "service_account" {
  description = "Cloud Build service account"
  type        = string
  default     = null
}
