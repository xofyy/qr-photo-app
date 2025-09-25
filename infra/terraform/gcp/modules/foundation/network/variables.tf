# Degiskenler: foundation/network modulunde kullanilan girdiler.

# Kaynak adlarina eklenecek prefix degerini belirler.
variable "name_prefix" {
  description = "VPC kaynaklari icin kullanilan prefix"
  type        = string
  validation {
    condition     = length(trimspace(var.name_prefix)) > 0
    error_message = "name_prefix bos birakilamaz."
  }
}

# Tum kaynaklara uygulanacak etiketleri tasiyan harita.
variable "labels" {
  description = "Kaynak etiketleri icin map"
  type        = map(string)
  default     = {}
}

# Kaynaklarin olusacagi GCP projesini belirtir.
variable "project_id" {
  description = "GCP proje kimligi"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,29}$", var.project_id))
    error_message = "project_id gecerli bir GCP proje kimligi olmalidir."
  }
}

# Kaynaklarin olusacagi bolgeyi tanimlar.
variable "region" {
  description = "GCP bolge adi"
  type        = string
  validation {
    condition     = can(regex("^[a-z]+-[a-z0-9]+[0-9]$", var.region))
    error_message = "region us-central1 veya europe-west4 gibi GCP bolge formatinda olmalidir."
  }
}

# Subnet icin kullanilacak CIDR blogunu belirler.
variable "subnet_cidr_range" {
  description = "Subnet icin ana CIDR blogu"
  type        = string
  validation {
    condition     = can(cidrhost(var.subnet_cidr_range, 0))
    error_message = "subnet_cidr_range gecerli bir CIDR blogu olmalidir."
  }
}

# Pod IP atamalari icin ikincil CIDR blogu.
variable "secondary_range_pods" {
  description = "Pod IP atamalari icin ikinci CIDR"
  type        = string
  validation {
    condition     = can(cidrhost(var.secondary_range_pods, 0))
    error_message = "secondary_range_pods gecerli bir CIDR blogu olmalidir."
  }
}

# Servis IP atamalari icin ikincil CIDR blogu.
variable "secondary_range_services" {
  description = "Servis IP atamalari icin ikinci CIDR"
  type        = string
  validation {
    condition     = can(cidrhost(var.secondary_range_services, 0))
    error_message = "secondary_range_services gecerli bir CIDR blogu olmalidir."
  }
}

# VPC Flow Logs ozelligi.
variable "enable_flow_logs" {
  description = "Subnet icin flow loglarini etkinlestir"
  type        = bool
  default     = true
}

# Flow Logs toplama araligi.
variable "flow_logs_aggregation_interval" {
  description = "Flow Logs toplama araligi"
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
    ], var.flow_logs_aggregation_interval)
    error_message = "flow_logs_aggregation_interval desteklenen bir deger olmalidir."
  }
}

# Flow Logs ornekleme oranini belirler.
variable "flow_logs_sampling" {
  description = "Flow Logs ornekleme orani"
  type        = number
  default     = 0.5
  validation {
    condition     = var.flow_logs_sampling >= 0 && var.flow_logs_sampling <= 1
    error_message = "flow_logs_sampling 0 ile 1 arasinda bir deger olmalidir."
  }
}

# Flow Logs metadata modunu tanimlar.
variable "flow_logs_metadata" {
  description = "Flow Logs metadata modu"
  type        = string
  default     = "INCLUDE_ALL_METADATA"
  validation {
    condition     = contains(["INCLUDE_ALL_METADATA", "EXCLUDE_ALL_METADATA", "CUSTOM_METADATA"], var.flow_logs_metadata)
    error_message = "flow_logs_metadata yalnizca INCLUDE_ALL_METADATA, EXCLUDE_ALL_METADATA veya CUSTOM_METADATA olabilir."
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
