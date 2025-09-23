# Degiskenler: foundation/network modulunde kullanilan girdiler.

# Kaynak isimlerine eklenecek prefix degerini belirler.
variable "name_prefix" {
  description = "Kaynak adlarina eklenecek prefix degeri"
  type        = string
}

# Tum kaynaklara uygulanacak temel tag ciftlerini iletir.
variable "tags" {
  description = "Tum kaynaklara uygulanacak temel tag haritasi"
  type        = map(string)
  default     = {}
}

# Olusturulacak VPC icin kullanilacak CIDR blogunu tanimlar.
variable "vpc_cidr" {
  description = "Olusturulacak VPC icin CIDR blogu"
  type        = string
}

# Public subnetler icin CIDR listesi saglar.
variable "public_subnet_cidrs" {
  description = "Public subnetler icin CIDR bloklari listesi"
  type        = list(string)
}

# Opsiyonel olarak siralanmis AZ isimlerini belirler.
variable "availability_zones" {
  description = "Opsiyonel sirali AZ isimleri listesi"
  type        = list(string)
  default     = []
}

# Public subnet icin otomatik public IP ata secenegi.
variable "enable_public_ip_on_launch" {
  description = "Public subnet icinde baslatilan instancelara public IP ata"
  type        = bool
  default     = true
}
