# -----------------------------------------------------------------------------
# Degisken Tanimlari (AWS)
# Her degisken icin kullanim amaci ASCII karakterlerle aciklanmistir.
# Varsayilan degeri olan degiskenler ihtiyaca gore override edilebilir.
# -----------------------------------------------------------------------------

# Tum kaynaklar icin kullanilacak AWS bolgesini belirler.
variable "aws_region" {
  description = "Tum kaynaklar icin kullanilacak AWS bolgesi"
  type        = string
  default     = "eu-central-1"
}

# Kaynak adlandirmasinda kullanilacak proje kisaltmasini gir.
variable "project_name" {
  description = "Kaynak adlandirmasi icin temel proje adi"
  type        = string
}

# Kaynak etiketleri ve isimleri icin ortam kimligini ayarlar.
variable "environment" {
  description = "Isim ve etiketlerde kullanilan ortam kimligi"
  type        = string
  default     = "prod"
}

# Yeni VPC icin kullanilacak CIDR blogunu tanimlar.
variable "vpc_cidr" {
  description = "Olusturulacak VPC icin CIDR blogu"
  type        = string
  default     = "10.10.0.0/16"
}

# Her public subnet icin CIDR listesi saglar.
variable "public_subnet_cidrs" {
  description = "Her public subnet icin CIDR listesi"
  type        = list(string)
  default     = ["10.10.0.0/24", "10.10.1.0/24"]
}

# ECS konteynerinin dinleyecegi port numarasini belirler.
variable "container_port" {
  description = "ECS container tarafindan disari acilan port"
  type        = number
  default     = 8000
}

# ALB listener port numarasini tanimlar.
variable "lb_listener_port" {
  description = "Application Load Balancer listener portu"
  type        = number
  default     = 80
}

# ECS task definition icindeki konteyner adini ayarlar.
variable "container_name" {
  description = "ECS task definition icindeki container adi"
  type        = string
  default     = "backend"
}

# Her Fargate gorevi icin ayrilacak CPU birimini belirler.
variable "task_cpu" {
  description = "Her ECS gorevi icin ayrilacak CPU birimi"
  type        = number
  default     = 512
}

# Her Fargate gorevi icin ayrilacak bellek miktarini (MiB) belirler.
variable "task_memory" {
  description = "Her ECS gorevi icin ayrilacak bellek (MiB)"
  type        = number
  default     = 1024
}

# ECS servisinin calistiracagi gorev sayisini belirler.
variable "desired_count" {
  description = "Baslangicta calisacak ECS gorev sayisi"
  type        = number
  default     = 1
}

# Plain ortam degiskenlerini key-value olarak tanimlar.
variable "service_env_vars" {
  description = "Plain ortam degiskenlerini tasiyan map"
  type        = map(string)
  default     = {}
}

# Secrets Manager icine yazilacak gizli degerleri belirtir.
variable "service_secrets" {
  description = "AWS Secrets Manager icine yazilacak gizli veriler"
  type        = map(string)
  default     = {}
}

# Dagitimda kullanilacak konteyner imaj tagini belirler.
variable "image_tag" {
  description = "Dagitim icin kullanilacak container imaj tagi"
  type        = string
  default     = "latest"
}


# Container Insights metrik toplamasini acip kapatir.
variable "enable_container_insights" {
  description = "CloudWatch Container Insights metriklerini ac"
  type        = bool
  default     = true
}

# ECS execute-command ozelligini acip kapatir.
variable "enable_execute_command" {
  description = "ECS execute-command ozelligini etkinlestir"
  type        = bool
  default     = false
}

# CloudWatch log grubunun kac gun saklanacagini belirler.
variable "log_retention_days" {
  description = "CloudWatch log grubunun saklama suresi (gun)"
  type        = number
  default     = 30
}

# ALB saglik kontrolu icin HTTP path degerini tanimlar.
variable "health_check_path" {
  description = "ALB saglik kontrolu icin HTTP yolu"
  type        = string
  default     = "/"
}

# Tum kaynaklara uygulanacak varsayilan tag ciftlerini tutar.
variable "default_tags" {
  description = "Tum kaynaklara uygulanacak varsayilan tagler"
  type        = map(string)
  default     = {}
}

# ECS autoscaling icin minimum gorev sayisini ayarlar.
variable "autoscaling_min_capacity" {
  description = "ECS autoscaling icin minimum gorev sayisi"
  type        = number
  default     = 1
}

# ECS autoscaling icin maksimum gorev sayisini ayarlar.
variable "autoscaling_max_capacity" {
  description = "ECS autoscaling icin maksimum gorev sayisi"
  type        = number
  default     = 4
}


# Autoscaling icin hedef CPU yuzdesini belirler.
variable "autoscaling_cpu_target" {
  description = "Autoscaling icin hedef CPU yuzdesi"
  type        = number
  default     = 60
}

# CodeBuild kaynaklarini olusturup olusturmayacagini belirler.
variable "enable_codebuild" {
  description = "CodeBuild kaynaklarini olustur"
  type        = bool
  default     = false
}

# CodePipeline kaynaklarini olusturup olusturmayacagini belirler.
variable "enable_codepipeline" {
  description = "CodePipeline kaynaklarini olustur"
  type        = bool
  default     = false

  validation {
    condition     = var.enable_codepipeline == false || var.enable_codebuild == true
    error_message = "CodePipeline'i etkinlestirmeden once enable_codebuild degiskenini true yapmalisiniz."
  }
}

# -----------------------------------------------------------------------------
# CI/CD Ilgili Degiskenler
# -----------------------------------------------------------------------------

# Olusturulacak CodeBuild projesinin adini tanimlar.
variable "codebuild_project_name" {
  description = "CodeBuild projesinin adi"
  type        = string
  default     = "qr-photo-backend-build"
}

# CodeBuild calisma ortami icin base imaji belirtir.
variable "codebuild_environment_image" {
  description = "CodeBuild calisma ortami icin container imaji"
  type        = string
  default     = "aws/codebuild/standard:7.0"
}

# CodeBuild isleri icin compute tipini sec.
variable "codebuild_compute_type" {
  description = "CodeBuild compute tipi (instance boyutu)"
  type        = string
  default     = "BUILD_GENERAL1_SMALL"
}

# CodeBuild islerinin zaman asimini dakika olarak ayarlar.
variable "codebuild_timeout_minutes" {
  description = "CodeBuild calisma zaman asimi (dakika)"
  type        = number
  default     = 60
}

# CodeBuild buildspec dosyasinin yolunu tanimlar.
variable "codebuild_buildspec_path" {
  description = "CodeBuild icin buildspec dosya yolu"
  type        = string
  default     = "infra/terraform/aws/buildspec.backend.yml"
}

# CodeBuild tarafindan push edilecek ECR depo adini belirler.
variable "codebuild_image_repo_name" {
  description = "CodeBuild tarafindan push edilecek ECR repo adi"
  type        = string
  default     = "qr-photo-prod-backend"
}

# CodeBuild icin varsayilan imaj tagini tanimlar.
variable "codebuild_image_tag" {
  description = "CodeBuild icin varsayilan imaj tagi"
  type        = string
  default     = "latest"
}

# Olusturulacak CodePipeline kaynagina isim verir.
variable "codepipeline_name" {
  description = "CodePipeline kaynagi icin isim"
  type        = string
  default     = "qr-photo-backend-pipeline"
}

# CodePipeline artifact bucket adini override eder.
variable "codepipeline_artifact_bucket_name" {
  description = "CodePipeline artifact bucket adi (bos ise uretilir)"
  type        = string
  default     = null
}

# Kaynak deposuna baglanmak icin CodeStar ARN saglar.
variable "codepipeline_codestar_connection_arn" {
  description = "Kaynak repo baglantisi icin CodeStar Connection ARN"
  type        = string
  default     = null

  validation {
    condition     = var.enable_codepipeline == false || try(length(var.codepipeline_codestar_connection_arn) > 0, false)
    error_message = "CodePipeline aktifken CodeStar Connection ARN degeri zorunludur."
  }
}

# Kaynak deposunun sahibi olan org veya kullaniciyi belirtir.
variable "codepipeline_source_repo_owner" {
  description = "Kaynak repository sahibi (org veya kullanici)"
  type        = string
  default     = null

  validation {
    condition     = var.enable_codepipeline == false || try(length(trimspace(var.codepipeline_source_repo_owner)) > 0, false)
    error_message = "CodePipeline etkinse repository sahibini (org/kullanici) belirtmelisiniz."
  }
}

# Kaynak repository adini tanimlar.
variable "codepipeline_source_repo_name" {
  description = "Kaynak repository adi"
  type        = string
  default     = null

  validation {
    condition     = var.enable_codepipeline == false || try(length(trimspace(var.codepipeline_source_repo_name)) > 0, false)
    error_message = "CodePipeline icin repository adini bos birakmayin."
  }
}

# Pipeline tarafindan izlenecek branch adini belirler.
variable "codepipeline_source_branch" {
  description = "Pipeline tarafindan izlenecek branch adi"
  type        = string
  default     = "main"
}

# -----------------------------------------------------------------------------
# VM Instance Degiskenleri
# -----------------------------------------------------------------------------

# Ek bir EC2 instance calistirilip calistirilmayacagini belirler.
variable "enable_vm_instance" {
  description = "Ek bir EC2 instance calistirmayi etkinlestir"
  type        = bool
  default     = false
}

# EC2 instance icin kullanilacak AMI kimligini gir.
variable "vm_ami_id" {
  description = "VM icin kullanilacak AMI kimligi"
  type        = string
  default     = null

  validation {
    condition     = var.enable_vm_instance == false || try(length(trimspace(var.vm_ami_id)) > 0, false)
    error_message = "vm_ami_id must be set when enable_vm_instance is true."
  }
}

# EC2 instance tipi secimini yapar.
variable "vm_instance_type" {
  description = "VM icin secilecek EC2 instance tipi"
  type        = string
  default     = "t3.micro"
}

# Instance icin public IP atanip atanmayacagini belirler.
variable "vm_assign_public_ip" {
  description = "VM icin public IP atanip atanmayacagini belirler"
  type        = bool
  default     = true
}

# Opsiyonel SSH key pair adini belirtir.
variable "vm_key_name" {
  description = "SSH erisimi icin opsiyonel key pair adi"
  type        = string
  default     = null
}

# Instance bootstrap icin user data betigini tanimlar.
variable "vm_user_data" {
  description = "VM bootstrap islemleri icin user data betigi"
  type        = string
  default     = null
}

# Instance icin IAM instance profile adini saglar.
variable "vm_iam_instance_profile" {
  description = "VM icin opsiyonel IAM instance profile adi"
  type        = string
  default     = null
}

# Instance icin eklenecek mevcut SG ID listesini gir.
variable "vm_additional_security_group_ids" {
  description = "VM icin eklenecek mevcut security group ID listesi"
  type        = list(string)
  default     = []
}

# Olusturulan SG icin ingress kurallarini tanimlar.
variable "vm_security_group_ingress" {
  description = "VM icin olusturulan SG ingress kurallari"
  type = list(object({
    description      = optional(string, null)
    from_port        = number
    to_port          = number
    protocol         = string
    cidr_blocks      = optional(list(string), [])
    ipv6_cidr_blocks = optional(list(string), [])
    security_groups  = optional(list(string), [])
  }))
  default = []
}

# Instance root EBS disk boyutunu GiB olarak ayarlar.
variable "vm_root_volume_size" {
  description = "VM root EBS disk boyutu (GiB)"
  type        = number
  default     = 20
}

# Instance root EBS disk tipini belirler.
variable "vm_root_volume_type" {
  description = "VM root EBS disk tipi"
  type        = string
  default     = "gp3"
}
