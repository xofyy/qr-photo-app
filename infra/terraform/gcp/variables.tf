# -----------------------------------------------------------------------------
# GCP Terraform degisken tanimlari
# Bu dosyada GCP altyapisi icin gerekli tum degiskenler ASCII aciklamalar ile yer alir.
# -----------------------------------------------------------------------------

# GCP proje kimligini belirtir.
variable "gcp_project_id" {
  description = "GCP proje kimligi"
  type        = string
}

# Kaynaklarin olusacagi ana bolgeyi tanimlar.
variable "gcp_region" {
  description = "GCP bolge adi"
  type        = string
  default     = "europe-west1"
}

# Ortak isimlendirme icin proje adini belirtir.
variable "project_name" {
  description = "Kaynak adlandirmasi icin temel proje adi"
  type        = string
}

# Ortam bilgisi (dev, stage, prod gibi) icin kullanilir.
variable "environment" {
  description = "Ortam kimligi"
  type        = string
  default     = "dev"
}

# Kaynaklara eklenecek etiketleri map olarak saglar.
variable "default_labels" {
  description = "Kaynak etiketleri icin map"
  type        = map(string)
  default     = {}
}

# VPC icin ana CIDR blogu.
variable "vpc_subnet_cidr" {
  description = "Subnet icin CIDR blogu"
  type        = string
  default     = "10.20.0.0/24"
}

# Pod IP dagilimi icin ikinci aralik.
variable "vpc_secondary_pods" {
  description = "Pod IP ikincil araligi"
  type        = string
  default     = "10.21.0.0/20"
}

# Servis IP dagilimi icin ikinci aralik.
variable "vpc_secondary_services" {
  description = "Servis IP ikincil araligi"
  type        = string
  default     = "10.22.0.0/24"
}

# GKE release channel tercihi.
variable "gke_release_channel" {
  description = "GKE release channel"
  type        = string
  default     = "REGULAR"
}

# Master API erisimine izin verilen CIDR araligi.
variable "gke_master_authorized_range" {
  description = "GKE master erisim CIDR"
  type        = string
  default     = "0.0.0.0/0"
}

# Artifact Registry lokasyonu.
variable "artifact_location" {
  description = "Artifact Registry bolgesi"
  type        = string
  default     = "europe"
}

# Artifact Registry depo kimligi.
variable "artifact_repository_id" {
  description = "Artifact Repository kimligi"
  type        = string
  default     = "qr-photo-backend"
}

# Secret Manager icine yazilacak gizli degerler.
variable "initial_secrets" {
  description = "Gizli deger map"
  type        = map(string)
  default     = {}
}

# Kubernetes workload icin container imaj referansi.
variable "workload_image" {
  description = "Kubernetes workload imaj referansi"
  type        = string
  default     = "europe-docker.pkg.dev/example/example/app:latest"
}

# Kubernetes container portu.
variable "workload_container_port" {
  description = "Kubernetes container portu"
  type        = number
  default     = 8080
}

# Kubernetes servis portu.
variable "workload_service_port" {
  description = "Kubernetes servis portu"
  type        = number
  default     = 80
}

# Kubernetes ortam degiskenleri.
variable "workload_env" {
  description = "Kubernetes ortam degisken listesi"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

# Minimal HPA replica degeri.
variable "workload_hpa_min" {
  description = "HPA minimum replica"
  type        = number
  default     = 2
}

# Maksimum HPA replica degeri.
variable "workload_hpa_max" {
  description = "HPA maksimum replica"
  type        = number
  default     = 5
}

# HPA hedef CPU yuzdesi.
variable "workload_hpa_cpu" {
  description = "HPA hedef CPU yuzdesi"
  type        = number
  default     = 60
}

# Cloud Build tetikleyicisi icin GitHub owner bilgisi.
variable "github_owner" {
  description = "GitHub repository sahibi"
  type        = string
}

# Cloud Build tetikleyicisi icin repository adi.
variable "github_repo" {
  description = "GitHub repository adi"
  type        = string
}

# Cloud Build tetikleyicisi icin branch paterni.
variable "github_branch" {
  description = "GitHub branch paterni"
  type        = string
  default     = "main"
}

# Cloud Build tetikleyicisinin olusacagi bolge.
variable "cloudbuild_location" {
  description = "Cloud Build tetikleyici lokasyonu"
  type        = string
  default     = "europe-west1"
}

# Cloud Build isinleri icin hizmet hesabini belirtir.
variable "cloudbuild_service_account" {
  description = "Cloud Build service account mail"
  type        = string
  default     = null
}
