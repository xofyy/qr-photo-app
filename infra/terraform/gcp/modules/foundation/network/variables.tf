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
