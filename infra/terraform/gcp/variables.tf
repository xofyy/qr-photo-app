# -----------------------------------------------------------------------------
# GCP Terraform degisken tanimlari
# Bu dosyada GCP altyapisi icin gerekli tum degiskenler ASCII aciklamalar ile yer alir.
# -----------------------------------------------------------------------------

# GCP proje kimligini belirtir.
variable "gcp_project_id" {
  description = "GCP proje kimligi"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,29}$", var.gcp_project_id))
    error_message = "gcp_project_id kucuk harf ile baslamali, yalnizca kucuk harf/rakam/tire icermeli ve 5-30 karakter uzunlugunda olmalidir."
  }
}

# Kaynaklarin olusacagi ana bolgeyi tanimlar.
variable "gcp_region" {
  description = "GCP bolge adi"
  type        = string
  default     = "us-central1"
  validation {
    condition     = can(regex("^[a-z]+-[a-z0-9]+[0-9]$", var.gcp_region))
    error_message = "gcp_region degeri us-central1 veya europe-west4 gibi GCP bolge formatinda olmalidir."
  }
}

# Ortak isimlendirme icin proje adini belirtir.
variable "project_name" {
  description = "Kaynak adlandirmasi icin temel proje adi"
  type        = string
  validation {
    condition     = length(trimspace(var.project_name)) > 0
    error_message = "project_name bos birakilamaz."
  }
}

# Ortam bilgisi (dev, stage, prod gibi) icin kullanilir.
variable "environment" {
  description = "Ortam kimligi"
  type        = string
  default     = "dev"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,15}$", var.environment))
    error_message = "environment degeri kucuk harf ile baslamali ve 2-16 karakter araliginda kucuk harf/rakam/tire icermelidir."
  }
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
  validation {
    condition     = can(cidrhost(var.vpc_subnet_cidr, 0))
    error_message = "vpc_subnet_cidr gecerli bir CIDR blogu olmalidir."
  }
}

# Pod IP dagilimi icin ikinci aralik.
variable "vpc_secondary_pods" {
  description = "Pod IP ikincil araligi"
  type        = string
  default     = "10.21.0.0/20"
  validation {
    condition     = can(cidrhost(var.vpc_secondary_pods, 0))
    error_message = "vpc_secondary_pods gecerli bir CIDR blogu olmalidir."
  }
}

# Servis IP dagilimi icin ikinci aralik.
variable "vpc_secondary_services" {
  description = "Servis IP ikincil araligi"
  type        = string
  default     = "10.22.0.0/24"
  validation {
    condition     = can(cidrhost(var.vpc_secondary_services, 0))
    error_message = "vpc_secondary_services gecerli bir CIDR blogu olmalidir."
  }
}

# GKE release channel tercihi.
variable "gke_release_channel" {
  description = "GKE release channel"
  type        = string
  default     = "REGULAR"
  validation {
    condition     = contains(["RAPID", "REGULAR", "STABLE"], var.gke_release_channel)
    error_message = "gke_release_channel yalnizca RAPID, REGULAR veya STABLE olabilir."
  }
}

# GERÄ°YE DONUK UYUMLULUK: Tek bir CIDR icin eski degisken.
variable "gke_master_authorized_range" {
  description = "[DEPRECATED] GKE master erisimi icin tek CIDR"
  type        = string
  default     = null
  nullable    = true
  validation {
    condition     = var.gke_master_authorized_range == null ? true : can(cidrhost(var.gke_master_authorized_range, 0))
    error_message = "gke_master_authorized_range gecerli bir CIDR blogu olmalidir."
  }
}

# Master API erisimine izin verilen CIDR listesi.
variable "gke_master_authorized_networks" {
  description = "GKE master erisimi icin yetkili CIDR listesi"
  type        = list(string)
  default     = null
  nullable    = true
  validation {
    condition = (
      var.gke_master_authorized_networks == null ? true : alltrue([
        for cidr in var.gke_master_authorized_networks : can(cidrhost(cidr, 0))
      ])
    )
    error_message = "gke_master_authorized_networks icindeki tum degerler gecerli CIDR bloglari olmalidir."
  }
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
  validation {
    condition = contains([
      "INTERVAL_5_SEC",
      "INTERVAL_30_SEC",
      "INTERVAL_1_MIN",
      "INTERVAL_5_MIN",
      "INTERVAL_10_MIN",
      "INTERVAL_15_MIN"
    ], var.vpc_flow_logs_aggregation_interval)
    error_message = "vpc_flow_logs_aggregation_interval desteklenen bir deger olmalidir."
  }
}

# VPC Flow Logs icin ornekleme orani.
variable "vpc_flow_logs_sampling" {
  description = "VPC Flow Logs ornekleme orani"
  type        = number
  default     = 0.5
  validation {
    condition     = var.vpc_flow_logs_sampling >= 0 && var.vpc_flow_logs_sampling <= 1
    error_message = "vpc_flow_logs_sampling 0 ile 1 arasinda bir deger olmalidir."
  }
}

# VPC Flow Logs icin metadata secimi.
variable "vpc_flow_logs_metadata" {
  description = "VPC Flow Logs metadata modu"
  type        = string
  default     = "INCLUDE_ALL_METADATA"
  validation {
    condition     = contains(["INCLUDE_ALL_METADATA", "EXCLUDE_ALL_METADATA", "CUSTOM_METADATA"], var.vpc_flow_logs_metadata)
    error_message = "vpc_flow_logs_metadata yalnizca INCLUDE_ALL_METADATA, EXCLUDE_ALL_METADATA veya CUSTOM_METADATA olabilir."
  }
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
  validation {
    condition     = contains(["ALL", "ERRORS_ONLY", "TRANSLATIONS_ONLY"], var.nat_logging_filter)
    error_message = "nat_logging_filter yalnizca ALL, ERRORS_ONLY veya TRANSLATIONS_ONLY olabilir."
  }
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
  validation {
    condition     = contains(["INCLUDE_ALL_METADATA", "EXCLUDE_ALL_METADATA", "CUSTOM_METADATA"], var.firewall_logging_metadata)
    error_message = "firewall_logging_metadata yalnizca INCLUDE_ALL_METADATA, EXCLUDE_ALL_METADATA veya CUSTOM_METADATA olabilir."
  }
}

# Internal firewall icin izin verilecek CIDR listesi.
variable "firewall_internal_source_ranges" {
  description = "Internal firewall kurali icin CIDR listesi"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for cidr in var.firewall_internal_source_ranges : can(cidrhost(cidr, 0))
    ])
    error_message = "firewall_internal_source_ranges icindeki tum degerler gecerli CIDR bloglari olmalidir."
  }
}

# Artifact Registry lokasyonu.
variable "artifact_location" {
  description = "Artifact Registry bolgesi"
  type        = string
  default     = "europe"
  validation {
    condition     = can(regex("^[a-z]+(-[a-z0-9]+[0-9])?$", var.artifact_location))
    error_message = "artifact_location us, europe veya us-central1 gibi gecerli bir Artifact Registry lokasyonu olmalidir."
  }
}

# Artifact Registry depo kimligi.
variable "artifact_repository_id" {
  description = "Artifact Repository kimligi"
  type        = string
  default     = "qr-photo-backend"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-_]{2,62}$", var.artifact_repository_id))
    error_message = "artifact_repository_id kucuk harf ile baslamali ve 3-63 karakter araliginda kucuk harf/rakam/tire/altcizgi icermelidir."
  }
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
  validation {
    condition     = length(trimspace(var.workload_image)) > 0
    error_message = "workload_image bos birakilamaz."
  }
}

# Kubernetes container portu.
variable "workload_container_port" {
  description = "Kubernetes container portu"
  type        = number
  default     = 8080
  validation {
    condition     = var.workload_container_port > 0 && var.workload_container_port <= 65535
    error_message = "workload_container_port 1 ile 65535 arasinda olmali."
  }
}

# Kubernetes servis portu.
variable "workload_service_port" {
  description = "Kubernetes servis portu"
  type        = number
  default     = 80
  validation {
    condition     = var.workload_service_port > 0 && var.workload_service_port <= 65535
    error_message = "workload_service_port 1 ile 65535 arasinda olmali."
  }
}

# Kubernetes ortam degiskenleri.
variable "workload_env" {
  description = "Kubernetes ortam degisken listesi"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
  validation {
    condition = alltrue([
      for env in var.workload_env : length(trimspace(env.name)) > 0
      ]) && length(var.workload_env) == length(distinct([
        for env in var.workload_env : env.name
    ]))
    error_message = "workload_env icindeki tum degiskenler benzersiz ve bos olmayan isimlere sahip olmalidir."
  }
}

# Minimal HPA replica degeri.
variable "workload_hpa_min" {
  description = "HPA minimum replica"
  type        = number
  default     = 2
  validation {
    condition     = var.workload_hpa_min >= 1
    error_message = "workload_hpa_min en az 1 olmalidir."
  }
}

# Maksimum HPA replica degeri.
variable "workload_hpa_max" {
  description = "HPA maksimum replica"
  type        = number
  default     = 5
  validation {
    condition     = var.workload_hpa_max >= 1
    error_message = "workload_hpa_max en az 1 olmalidir."
  }
}

# HPA hedef CPU yuzdesi.
variable "workload_hpa_cpu" {
  description = "HPA hedef CPU yuzdesi"
  type        = number
  default     = 60
  validation {
    condition     = var.workload_hpa_cpu >= 1 && var.workload_hpa_cpu <= 100
    error_message = "workload_hpa_cpu 1 ile 100 arasinda bir deger olmalidir."
  }
}

# Cloud Build tetikleyicisi icin GitHub owner bilgisi.
variable "github_owner" {
  description = "GitHub repository sahibi"
  type        = string
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]{1,39}$", var.github_owner))
    error_message = "github_owner GitHub kullanici/organizasyon adlama kurallarina uymali."
  }
}

# Cloud Build tetikleyicisi icin repository adi.
variable "github_repo" {
  description = "GitHub repository adi"
  type        = string
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]{1,100}$", var.github_repo))
    error_message = "github_repo yalnizca harf, rakam, tire, alt cizgi ve nokta icerebilir."
  }
}

# Cloud Build tetikleyicisi icin branch paterni.
variable "github_branch" {
  description = "GitHub branch paterni"
  type        = string
  default     = "main"
  validation {
    condition     = length(trimspace(var.github_branch)) > 0
    error_message = "github_branch bos olamaz."
  }
}

# Cloud Build tetikleyicisinin olusacagi bolge.
variable "cloudbuild_location" {
  description = "Cloud Build tetikleyici lokasyonu"
  type        = string
  default     = "us-central1"
  validation {
    condition     = can(regex("^[a-z]+-[a-z0-9]+[0-9]$", var.cloudbuild_location))
    error_message = "cloudbuild_location us-central1 veya europe-west4 gibi GCP bolge formatinda olmalidir."
  }
}

# Cloud Build isinleri icin hizmet hesabini belirtir.
variable "cloudbuild_service_account" {
  description = "Cloud Build service account mail"
  type        = string
  default     = null
  validation {
    condition     = var.cloudbuild_service_account == null ? true : can(regex("^[a-z][a-z0-9-]{5,30}@[a-z0-9-]+[.]iam[.]gserviceaccount[.]com$", var.cloudbuild_service_account))
    error_message = "cloudbuild_service_account g-serviceaccount formatinda gecerli bir e-posta olmali veya null birakilmalidir."
  }
}
# Terraform remote state bucket adi.
variable "tf_state_bucket" {
  description = "Terraform remote state bucket adi"
  type        = string
  validation {
    condition     = length(trimspace(var.tf_state_bucket)) > 0
    error_message = "tf_state_bucket bos birakilamaz."
  }
}

# Terraform remote state prefix degeri.
variable "tf_state_prefix" {
  description = "Terraform remote state prefix degeri"
  type        = string
  validation {
    condition     = length(trimspace(var.tf_state_prefix)) > 0
    error_message = "tf_state_prefix bos birakilamaz."
  }
}

# Cloud Build substitutions map (pipeline-specific). 
variable "ci_cd_substitutions" {
  description = "Cloud Build tetikleyicisine aktarilacak substitutions"
  type        = map(string)
  default     = {}
}
# GKE cluster icin Autopilot modu.
variable "gke_enable_autopilot" {
  description = "GKE Autopilot modu etkin mi"
  type        = bool
  default     = false
}

# GKE node makine tipi.
variable "gke_node_machine_type" {
  description = "Standart node havuzu makine tipi"
  type        = string
  default     = "e2-small"
}

# GKE node disk boyutu (GB).
variable "gke_node_disk_size_gb" {
  description = "Standart node disk boyutu"
  type        = number
  default     = 30
}

# GKE node disk tipi.
variable "gke_node_disk_type" {
  description = "Standart node disk tipi"
  type        = string
  default     = "pd-standard"
}

# GKE node preemptible ayari.
variable "gke_node_preemptible" {
  description = "Node'lar preemptible olsun mu"
  type        = bool
  default     = false
}

# GKE node havuzu minimum node sayisi.
variable "gke_node_min_count" {
  description = "Node havuzu minimum node sayisi"
  type        = number
  default     = 1
}

# GKE node havuzu maksimum node sayisi.
variable "gke_node_max_count" {
  description = "Node havuzu maksimum node sayisi"
  type        = number
  default     = 2
}
# GKE cluster location override.
variable "gke_cluster_location" {
  description = "GKE cluster location (zone or region). Bos birakilirsa gcp_region kullanilir"
  type        = string
  default     = null
}

# GKE node locations (ek zonelar). Boþ býrakýlýrsa cluster lokasyonu kullanýlýr.
variable "gke_node_locations" {
  description = "GKE node locations listesi"
  type        = list(string)
  default     = []
}
