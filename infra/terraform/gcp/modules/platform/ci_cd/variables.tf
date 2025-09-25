# Degiskenler: platform/ci_cd modulunde kullanilan girdiler.

# Kaynak isimlendirmesi icin kullanilacak prefix.
variable "name_prefix" {
  description = "CI/CD kaynak prefixi"
  type        = string
  validation {
    condition     = length(trimspace(var.name_prefix)) > 0
    error_message = "name_prefix bos birakilamaz."
  }
}

# GCP proje kimligini belirtir.
variable "project_id" {
  description = "GCP proje kimligi"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,29}$", var.project_id))
    error_message = "project_id gecerli bir GCP proje kimligi olmalidir."
  }
}

# Cloud Build trigger lokasyonunu tanimlar.
variable "location" {
  description = "Cloud Build tetikleyici bolgesi"
  type        = string
  validation {
    condition     = can(regex("^[a-z]+-[a-z0-9]+[0-9]$", var.location))
    error_message = "location us-central1 veya europe-west4 gibi GCP bolge formatinda olmalidir."
  }
}

# Ortam bilgisini etiketlemek icin kullanilir.
variable "environment" {
  description = "Ortam etiketi"
  type        = string
  default     = "dev"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,15}$", var.environment))
    error_message = "environment etiketi kucuk harf ile baslamali ve 2-16 karakter araliginda kucuk harf/rakam/tire icermelidir."
  }
}

# Build islemlerinde kullanilacak GitHub sahibi.
variable "github_owner" {
  description = "GitHub owner bilgisi"
  type        = string
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]{1,39}$", var.github_owner))
    error_message = "github_owner GitHub kullanici/organizasyon adlama kurallarina uymali."
  }
}

# Build islemlerinde kullanilacak repo adi.
variable "github_repo" {
  description = "GitHub repository adi"
  type        = string
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]{1,100}$", var.github_repo))
    error_message = "github_repo yalnizca harf, rakam, tire, alt cizgi ve nokta icermelidir."
  }
}

# Tetiklenecek branch paterni.
variable "github_branch" {
  description = "GitHub branch paterni"
  type        = string
  default     = "main"
  validation {
    condition     = length(trimspace(var.github_branch)) > 0
    error_message = "github_branch bos olamaz."
  }
}

# Cloud Build betik dosyasi.
variable "build_filename" {
  description = "cloudbuild betik dosyasi"
  type        = string
  default     = "cloudbuild.yaml"
  validation {
    condition     = length(trimspace(var.build_filename)) > 0
    error_message = "build_filename bos olamaz."
  }
}

# Build icine dahil edilecek dosya kaliplari.
variable "included_files" {
  description = "Cloud Build iceren dosya kaliplari"
  type        = list(string)
  default     = ["**"]
  validation {
    condition     = length(var.included_files) > 0
    error_message = "included_files en az bir glob icermelidir."
  }
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
  validation {
    condition     = var.service_account == null ? true : can(regex("^[a-z][a-z0-9-]{5,30}@[a-z0-9-]+[.]iam[.]gserviceaccount[.]com$", var.service_account))
    error_message = "service_account gecerli bir service account e-postasi olmali veya null birakilmalidir."
  }
}
