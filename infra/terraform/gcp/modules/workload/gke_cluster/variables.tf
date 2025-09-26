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

# [DEPRECATED] Onceki surumle uyum icin master CIDR listesi degiskeni.
variable "master_authorized_networks" {
  description = "[DEPRECATED] Master API erisimi icin yetkili CIDR listesi"
  type        = list(string)
  default     = null
  nullable    = true
}

# Master yetkili aglar icin yeni CIDR listesi girdisi.
variable "master_authorized_network_cidrs" {
  description = "Master API erisimi icin yetkili CIDR listesi"
  type        = list(string)
  default     = null
  nullable    = true
}

# Autopilot modu yerine standart node toreni secmek icin kullanilir.
variable "enable_autopilot" {
  description = "Autopilot modu etkin mi"
  type        = bool
  default     = false
}

# Standart node havuzu icin makine tipi.
variable "node_machine_type" {
  description = "Standart node havuzu makine tipi"
  type        = string
  default     = "e2-small"
}

# Standart node havuzu disk boyutu.
variable "node_disk_size_gb" {
  description = "Node disk boyutu (GB)"
  type        = number
  default     = 20
}

# Standart node havuzu disk tipi.
variable "node_disk_type" {
  description = "Node disk tipi"
  type        = string
  default     = "pd-standard"
}

# Node'larin preemptible (spot) olmasi.
variable "node_preemptible" {
  description = "Node'lar preemptible olsun mu"
  type        = bool
  default     = false
}

# Otomatik olcekleme icin minimum node sayisi.
variable "node_min_count" {
  description = "Node havuzu minimum node sayisi"
  type        = number
  default     = 1
}

# Otomatik olcekleme icin maksimum node sayisi.
variable "node_max_count" {
  description = "Node havuzu maksimum node sayisi"
  type        = number
  default     = 2
}

# Cluster location (zone or region).
variable "cluster_location" {
  description = "GKE cluster location (zone or region)"
  type        = string
}

# Optional node locations for regional clusters.
variable "node_locations" {
  description = "Additional node locations"
  type        = list(string)
  default     = []
}
