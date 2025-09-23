# Degiskenler: workload/ecs_service modulunde kullanilan girdiler.

# ECS kaynaklarinin adlandirmasi icin prefix degerini belirler.
variable "name_prefix" {
  description = "ECS kaynaklari icin kullanilan prefix"
  type        = string
}

# ECS kaynaklarina uygulanacak ortak tag haritasini saglar.
variable "tags" {
  description = "ECS kaynaklari icin ortak tag haritasi"
  type        = map(string)
  default     = {}
}

# CloudWatch Container Insights ozelligini acip kapatir.
variable "enable_container_insights" {
  description = "CloudWatch Container Insights ozelligi"
  type        = bool
  default     = true
}

# Her gorev icin ayrilacak CPU birimini tanimlar.
variable "task_cpu" {
  description = "Gorev basina CPU birimi"
  type        = number
}

# Her gorev icin ayrilacak bellek miktarini (MiB) belirler.
variable "task_memory" {
  description = "Gorev basina bellek (MiB)"
  type        = number
}

# Task definition icindeki konteyner adini ayarlar.
variable "container_name" {
  description = "ECS konteyner adi"
  type        = string
}

# Konteyner tarafindan disari acilan portu tanimlar.
variable "container_port" {
  description = "Konteyner portu"
  type        = number
}

# Tam container imaji (repo:tag) bilgisini saglar.
variable "container_image" {
  description = "Konteyner imaji (depo:tag)"
  type        = string
}

# Log yazilacak CloudWatch log grubunun adini belirtir.
variable "log_group_name" {
  description = "CloudWatch log grubu adi"
  type        = string
}

# Log konfigurasyonu icin AWS bolgesini tanimlar.
variable "aws_region" {
  description = "Log konfigurasyonu icin AWS bolgesi"
  type        = string
}

# Plain ortam degiskenleri listesini tutar.
variable "container_environment" {
  description = "Plain ortam degiskenleri listesi"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

# Secret tabanli ortam degiskenleri listesini tutar.
variable "container_secrets" {
  description = "Secret tabanli ortam degiskenleri listesi"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

# ECS servisinin calistiracagi gorev sayisini belirler.
variable "desired_count" {
  description = "Calisacak gorev sayisi"
  type        = number
}

# ECS execute-command ozelligini acip kapatir.
variable "enable_execute_command" {
  description = "ECS execute-command ozelligi"
  type        = bool
  default     = false
}

# ECS gorevlerinin calisacagi subnet ID listesini belirtir.
variable "subnet_ids" {
  description = "ECS gorevleri icin subnet ID listesi"
  type        = list(string)
}

# ECS gorevlerine uygulanacak security group listesini tanimlar.
variable "security_group_ids" {
  description = "ECS gorevleri icin security group ID listesi"
  type        = list(string)
}

# Fargate gorevlerine public IP atanip atanmayacagini belirler.
variable "assign_public_ip" {
  description = "Fargate gorevlerine public IP ata"
  type        = bool
  default     = true
}

# Load balancer hedef grubu ARN degerini saglar.
variable "target_group_arn" {
  description = "Servisin hedef grubu ARN degeri"
  type        = string
}

# Autoscaling icin minimum gorev sayisini ayarlar.
variable "autoscaling_min_capacity" {
  description = "Autoscaling minimum gorev sayisi"
  type        = number
}

# Autoscaling icin maksimum gorev sayisini ayarlar.
variable "autoscaling_max_capacity" {
  description = "Autoscaling maksimum gorev sayisi"
  type        = number
}

# Autoscaling icin hedef CPU yuzdesini tanimlar.
variable "autoscaling_cpu_target" {
  description = "Autoscaling hedef CPU yuzdesi"
  type        = number
}

# ECS task execution rolunun ARN degerini belirtir.
variable "task_execution_role_arn" {
  description = "ECS task execution rol ARN degeri"
  type        = string
}

# Uygulama konteynerinin kullanacagi IAM rol ARN degerini saglar.
variable "task_role_arn" {
  description = "ECS uygulama rol ARN degeri"
  type        = string
}
