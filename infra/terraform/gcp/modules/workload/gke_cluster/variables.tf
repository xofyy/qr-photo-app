# Degiskenler: workload/gke_cluster modulunde kullanilan girdiler.

# Cluster adlandirmasi icin kullanilacak prefix.
variable "name_prefix" {
  description = "GKE cluster kaynak prefixi"
  type        = string
}

# Kaynaklarin olusacagi proje kimligi.
variable "project_id" {
  description = "GCP proje kimligi"
  type        = string
}

# Cluster bolgesini tanimlar.
variable "region" {
  description = "GKE cluster bolgesi"
  type        = string
}

# Clusterin baglanacagi VPC kimligi.
variable "network_id" {
  description = "GKE icin VPC kimligi"
  type        = string
}

# Clusterin baglanacagi subnet kimligi.
variable "subnet_id" {
  description = "GKE icin subnet kimligi"
  type        = string
}

# Pod IP dagilimi icin ikinci aralik adi.
variable "pods_secondary_range" {
  description = "Pod IP ikincil aralik adi"
  type        = string
}

# Servis IP dagilimi icin ikinci aralik adi.
variable "services_secondary_range" {
  description = "Servis IP ikincil aralik adi"
  type        = string
}

# GKE release channel secimi.
variable "release_channel" {
  description = "GKE release channel degeri"
  type        = string
  default     = "REGULAR"
}

# GERİYE DONUK UYUMLULUK: Tek bir CIDR icin eski degisken.
variable "master_authorized_range" {
  description = "[DEPRECATED] Master API erisimi icin tek CIDR"
  type        = string
  default     = null
  nullable    = true
}

# Master yetkili aglar icin CIDR listesi.
variable "master_authorized_networks" {
  description = "Master API erisimi icin yetkili CIDR listesi"
  type        = list(string)
  default     = null
  nullable    = true
}
