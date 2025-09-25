# Degiskenler: foundation/security modulunde kullanilan girdiler.

# Kaynak adlarina eklenecek prefix degerini belirler.
variable "name_prefix" {
  description = "Security kaynaklari icin kullanilan prefix"
  type        = string
  validation {
    condition     = length(trimspace(var.name_prefix)) > 0
    error_message = "name_prefix bos birakilamaz."
  }
}

# Firewall kurallarina eklenecek etiketleri tasir.
variable "labels" {
  description = "Security kaynaklari icin etiket haritasi"
  type        = map(string)
  default     = {}
}

# Kurulacak kaynaklarin bagli oldugu proje kimligi.
variable "project_id" {
  description = "GCP proje kimligi"
  type        = string
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,29}$", var.project_id))
    error_message = "project_id gecerli bir GCP proje kimligi olmalidir."
  }
}

# Firewall kurallarinin uygulanacagi VPC kimligi.
variable "network_id" {
  description = "VPC kaynak kimligi"
  type        = string
  validation {
    condition     = length(trimspace(var.network_id)) > 0
    error_message = "network_id bos birakilamaz."
  }
}

# Internal firewall icin izin verilecek CIDR listesi.
variable "internal_source_ranges" {
  description = "Internal firewall kurali icin izinli CIDR listesi"
  type        = list(string)
  default     = []
  validation {
    condition = alltrue([
      for cidr in var.internal_source_ranges : can(cidrhost(cidr, 0))
    ])
    error_message = "internal_source_ranges icindeki tum degerler gecerli CIDR bloglari olmalidir."
  }
}

# Firewall loglarini etkinlestir.
variable "enable_firewall_logging" {
  description = "Firewall loglarini etkinlestir"
  type        = bool
  default     = true
}

# Firewall log metadata modu.
variable "firewall_logging_metadata" {
  description = "Firewall log metadata modu"
  type        = string
  default     = "INCLUDE_ALL_METADATA"
  validation {
    condition     = contains(["INCLUDE_ALL_METADATA", "EXCLUDE_ALL_METADATA", "CUSTOM_METADATA"], var.firewall_logging_metadata)
    error_message = "firewall_logging_metadata yalnizca INCLUDE_ALL_METADATA, EXCLUDE_ALL_METADATA veya CUSTOM_METADATA olabilir."
  }
}
