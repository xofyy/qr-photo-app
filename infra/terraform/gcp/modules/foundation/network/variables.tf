# Degiskenler: foundation/network modulunde kullanilan girdiler.

# Kaynak adlarina eklenecek prefix degerini belirler.
variable "name_prefix" {
  description = "VPC kaynaklari icin kullanilan prefix"
  type        = string
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
}

# Kaynaklarin olusacagi bolgeyi tanimlar.
variable "region" {
  description = "GCP bolge adi"
  type        = string
}

# Subnet icin kullanilacak CIDR blogunu belirler.
variable "subnet_cidr_range" {
  description = "Subnet icin ana CIDR blogu"
  type        = string
}

# Pod IP atamalari icin ikincil CIDR blogu.
variable "secondary_range_pods" {
  description = "Pod IP atamalari icin ikinci CIDR"
  type        = string
}

# Servis IP atamalari icin ikincil CIDR blogu.
variable "secondary_range_services" {
  description = "Servis IP atamalari icin ikinci CIDR"
  type        = string
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
}

# Flow Logs ornekleme oranini belirler.
variable "flow_logs_sampling" {
  description = "Flow Logs ornekleme orani"
  type        = number
  default     = 0.5
}

# Flow Logs metadata modunu tanimlar.
variable "flow_logs_metadata" {
  description = "Flow Logs metadata modu"
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
