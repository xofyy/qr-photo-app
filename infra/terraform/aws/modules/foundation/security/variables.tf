# Degiskenler: foundation/security modulunde kullanilan girdiler.

# Guvenlik grubu isimlerine eklenecek prefix degerini belirler.
variable "name_prefix" {
  description = "Guvenlik grubu adlarina eklenecek prefix"
  type        = string
}

# Guvenlik gruplarina uygulanacak temel tag haritasini saglar.
variable "tags" {
  description = "Guvenlik gruplarina uygulanacak temel tag haritasi"
  type        = map(string)
  default     = {}
}

# Guvenlik gruplarinin olusacagi VPC kimligini belirtir.
variable "vpc_id" {
  description = "Guvenlik gruplarinin bagli oldugu VPC kimligi"
  type        = string
}

# ALB uzerinde acik olan listener portunu tanimlar.
variable "lb_listener_port" {
  description = "Load balancer tarafindan acilan port"
  type        = number
}

# ALB giris trafigine izin verilen CIDR bloklarini listeler.
variable "alb_ingress_cidrs" {
  description = "Load balancer icin izin verilen CIDR bloklari"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# ALB nin ECS konteynerine iletecegi port numarasini belirtir.
variable "container_port" {
  description = "ALB nin ECS konteynerine yonlendirecegi port"
  type        = number
}
