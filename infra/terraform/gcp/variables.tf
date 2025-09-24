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
  default     = "us-central1"
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

# GERİYE DONUK UYUMLULUK: Tek bir CIDR icin eski degisken.
variable "gke_master_authorized_range" {
  description = "[DEPRECATED] GKE master erisimi icin tek CIDR"
  type        = string
  default     = null
  nullable    = true
}

# Master API erisimine izin verilen CIDR listesi.
variable "gke_master_authorized_networks" {
  description = "GKE master erisimi icin yetkili CIDR listesi"
  type        = list(string)
  default     = null
  nullable    = true
}

# VPC Flow Logs icin aktivasyon.
variable "enable_vpc_flow_logs" {
  description = "VPC Flow Logs ozelligini ac/kapa"
  type        = bool
  default     = true
}

# VPC Flow Logs icin toplama araligi.
variable "vpc_flow_logs_aggregation_interval" {
  description = "VPC Flow Logs toplama araligi"
  type        = string
  default     = "INTERVAL_10_MIN"
}

# VPC Flow Logs icin ornekleme orani.
variable "vpc_flow_logs_sampling" {
  description = "VPC Flow Logs ornekleme orani"
  type        = number
  default     = 0.5
}

# VPC Flow Logs icin metadata secimi.
variable "vpc_flow_logs_metadata" {
  description = "VPC Flow Logs metadata modu"
  type        = string
  default     = "INCLUDE_ALL_METADATA"
}

# Cloud NAT loglama ozelligi.
variable "enable_nat_logging" {
  description = "Cloud NAT loglarini etkinlestir"
  type        = bool
  default     = true
}

# Cloud NAT log filtresi.
variable "nat_logging_filter" {
  description = "Cloud NAT log filtresi"
  type        = string
  default     = "ALL"
}

# Firewall loglarini ac/kapa.
variable "enable_firewall_logging" {
  description = "Firewall loglarini etkinlestir"
  type        = bool
  default     = true
}

# Firewall loglari metadata modu.
variable "firewall_logging_metadata" {
  description = "Firewall log metadata modu"
  type        = string
  default     = "INCLUDE_ALL_METADATA"
}

# Internal firewall icin izin verilecek CIDR listesi.
variable "firewall_internal_source_ranges" {
  description = "Internal firewall kurali icin CIDR listesi"
  type        = list(string)
  default     = []
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
  default     = "us-central1"
}

# Cloud Build isinleri icin hizmet hesabini belirtir.
variable "cloudbuild_service_account" {
  description = "Cloud Build service account mail"
  type        = string
  default     = null
}
