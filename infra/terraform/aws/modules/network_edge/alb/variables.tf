# Degiskenler: network_edge/alb modulunde kullanilan girdiler.

# ALB kaynaklari icin kullanilacak prefix degerini belirler.
variable "name_prefix" {
  description = "ALB kaynaklari icin kullanilan prefix"
  type        = string
}

# ALB kaynaklarina uygulanacak ortak tag haritasini saglar.
variable "tags" {
  description = "ALB kaynaklarina uygulanacak ortak tag haritasi"
  type        = map(string)
  default     = {}
}

# ALB nin dagitilacagi subnet ID listesini tanimlar.
variable "subnet_ids" {
  description = "ALB nin yerlestirilecegi subnet ID listesi"
  type        = list(string)
}

# ALB ye atanacak security group kimligini belirtir.
variable "security_group_id" {
  description = "ALB ye atanacak security group ID degeri"
  type        = string
}

# ALB nin bulundugu VPC kimligini tanimlar.
variable "vpc_id" {
  description = "ALB nin bagli oldugu VPC kimligi"
  type        = string
}

# Hedef grupta dinlenecek container portunu belirler.
variable "container_port" {
  description = "Target group tarafindan dinlenen container portu"
  type        = number
}

# Saglik kontrolu icin kullanilacak HTTP path degerini ayarlar.
variable "health_check_path" {
  description = "Saglik kontrolu icin kullanilacak HTTP yolu"
  type        = string
  default     = "/"
}

# ALB listener port numarasini belirler.
variable "listener_port" {
  description = "ALB listener port degeri"
  type        = number
  default     = 80
}

# ALB listener protokolunu tanimlar.
variable "listener_protocol" {
  description = "ALB listener protokolu"
  type        = string
  default     = "HTTP"
}

# Target group icin protokol secimini yapar.
variable "target_group_protocol" {
  description = "Target group protokolu"
  type        = string
  default     = "HTTP"
}

# ALB nin internal calisip calismayacagini belirler.
variable "internal" {
  description = "ALB nin internal olarak calisip calismayacagi"
  type        = bool
  default     = false
}

# ALB uzerinde silme korumasini acip kapatir.
variable "enable_deletion_protection" {
  description = "ALB icin silme korumasini etkinlestirir"
  type        = bool
  default     = false
}
