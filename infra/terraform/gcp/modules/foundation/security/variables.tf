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
