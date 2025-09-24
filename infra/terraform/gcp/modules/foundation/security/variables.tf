# Degiskenler: foundation/security modulunde kullanilan girdiler.

# Kaynak adlarina eklenecek prefix degerini belirler.
variable "name_prefix" {
  description = "Security kaynaklari icin kullanilan prefix"
  type        = string
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
}

# Firewall kurallarinin uygulanacagi VPC kimligi.
variable "network_id" {
  description = "VPC kaynak kimligi"
  type        = string
}

# Internal firewall icin izin verilecek CIDR listesi.
variable "internal_source_ranges" {
  description = "Internal firewall kurali icin izinli CIDR listesi"
  type        = list(string)
  default     = []
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
}
