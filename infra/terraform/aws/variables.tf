# -----------------------------------------------------------------------------
# Değişken Tanımları (AWS)
# Her değişken için kullanım amacı, örnek değerler/seçenekler ve zorunluluk bilgisi
# verilmiştir. Varsayılan değeri olan değişkenler isteğe bağlıdır.
# -----------------------------------------------------------------------------

# Zorunlu: Hayır — Kaynakların konuşlandırılacağı AWS bölgesi.
# Seçenekler: "eu-west-1", "us-east-1", "ap-southeast-1" vb.
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-central-1"
}

# Zorunlu: Evet — Kaynak isimlendirmesinde baz alınacak uygulama adı.
# Seçenekler: Küçük harf, tire kullanılabilir (örn. "qr-photo", "backend-api").
variable "project_name" {
  description = "Base name for AWS resources"
  type        = string
}

# Zorunlu: Hayır — Ortam etiketi; adlandırma ve tag'lerde kullanılır.
# Seçenekler: "prod", "staging", "dev" gibi kısa stringler.
variable "environment" {
  description = "Deployment environment identifier (e.g. prod, staging)"
  type        = string
  default     = "prod"
}

# Zorunlu: Hayır — Oluşturulacak VPC'nin CIDR bloğu.
# Seçenekler: RFC1918 aralıkları (örn. "10.10.0.0/16", "172.16.0.0/16").
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.10.0.0/16"
}

# Zorunlu: Hayır — Public subnet'ler için CIDR listesi.
# Seçenekler: Her biri farklı AZ'de olacak şekilde /24 veya uygun bloklar.
variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.10.0.0/24", "10.10.1.0/24"]
}

# Zorunlu: Hayır — Backend container'ın expose ettiği port.
# Seçenekler: HTTP 80, 443 veya uygulamanızın portu (örn. 8000).
variable "container_port" {
  description = "Container port exposed by the backend service"
  type        = number
  default     = 8000
}

# Zorunlu: Hayır — Application Load Balancer listener portu.
# Seçenekler: 80 (HTTP), 443 (HTTPS) veya özel portlar.
variable "lb_listener_port" {
  description = "Port that the load balancer listens on"
  type        = number
  default     = 80
}

# Zorunlu: Hayır — ECS task definition içindeki container adı.
# Seçenekler: Harf/rakam ile sınırlı (örn. "backend", "web").
variable "container_name" {
  description = "Container name in the ECS task definition"
  type        = string
  default     = "backend"
}

# Zorunlu: Hayır — Fargate görevine ayrılacak CPU (unit cinsinden).
# Seçenekler: 256, 512, 1024, 2048, 4096 vb. (AWS Fargate kombinasyonlarına uygun).
variable "task_cpu" {
  description = "CPU units for the ECS task (e.g. 512, 1024)"
  type        = number
  default     = 512
}

# Zorunlu: Hayır — Fargate görevine ayrılacak bellek (MiB cinsinden).
# Seçenekler: 512, 1024, 2048, 3072, 4096 vb. (seçilen CPU değerine uyumlu olmalı).
variable "task_memory" {
  description = "Memory (in MiB) for the ECS task"
  type        = number
  default     = 1024
}

# Zorunlu: Hayır — ECS servisinin başlangıçta kaç görev çalıştıracağı.
# Seçenekler: 1+; yüksek erişilebilirlik için 2 veya daha fazla önerilir.
variable "desired_count" {
  description = "Desired number of running ECS tasks"
  type        = number
  default     = 1
}

# Zorunlu: Hayır — Terraform state'te plaintext saklanmasında sakınca olmayan environment değişkenleri.
# Seçenekler: KEY => VALUE map'i (örn. { "ENV" = "prod" }).
variable "service_env_vars" {
  description = "Plain environment variables for the ECS container"
  type        = map(string)
  default     = {}
}

# Zorunlu: Duruma göre — AWS Secrets Manager'a kaydedilecek gizli değerler.
# Seçenekler: KEY => VALUE map'i; KEY, ECS container'ında environment adı olacak.
variable "service_secrets" {
  description = "Secrets to store in AWS Secrets Manager (key = logical name, value = secret string)"
  type        = map(string)
  default     = {}
}

# Zorunlu: Hayır — ECS servisinin kullanacağı Docker imaj tag'i.
# Seçenekler: "latest", sürüm numarı, commit SHA vb.
variable "image_tag" {
  description = "Container image tag to deploy"
  type        = string
  default     = "latest"
}

# Zorunlu: Hayır — CloudWatch Container Insights metriklerini açma.
# Seçenekler: `true` (metrik toplar, ek maliyet), `false` (devre dışı).
variable "enable_container_insights" {
  description = "Enable ECS Container Insights monitoring"
  type        = bool
  default     = true
}

# Zorunlu: Hayır — `aws ecs execute-command` kullanımını etkinleştirir.
# Seçenekler: `true` (ek yetki/kms gerektirir), `false` (varsayılan).
variable "enable_execute_command" {
  description = "Allow ECS exec into running tasks"
  type        = bool
  default     = false
}

# Zorunlu: Hayır — CloudWatch loglarının kaç gün saklanacağı.
# Seçenekler: 1–3653 gün arası (AWS limiti), 0 => sonsuz.
variable "log_retention_days" {
  description = "Retention period for CloudWatch Logs"
  type        = number
  default     = 30
}

# Zorunlu: Hayır — ALB health check için kullanılacak HTTP path'i.
# Seçenekler: "/", "/healthz", "/status" vb.
variable "health_check_path" {
  description = "HTTP path ALB uses for health checks"
  type        = string
  default     = "/"
}

# Zorunlu: Hayır — Tüm kaynaklara uygulanacak ortak tagler.
# Seçenekler: KEY => VALUE map'i (örn. { Application = "qr-photo", Owner = "infra" }).
variable "default_tags" {
  description = "Tags applied to AWS resources"
  type        = map(string)
  default     = {}
}

# Zorunlu: Hayır — AutoScaling alt sınırı.
# Seçenekler: 1+; gece düşük trafikte bile minimum kapasiteyi belirler.
variable "autoscaling_min_capacity" {
  description = "Minimum number of ECS tasks for auto scaling"
  type        = number
  default     = 1
}

# Zorunlu: Hayır — AutoScaling üst sınırı.
# Seçenekler: 1 üzeri; trafik artışında çıkılacak maksimum görev sayısı.
variable "autoscaling_max_capacity" {
  description = "Maximum number of ECS tasks for auto scaling"
  type        = number
  default     = 4
}

# Zorunlu: Hayır — CPU hedef yüzdesi.
# Seçenekler: 10–100 arası; değer yükseldikçe AutoScaling daha geç devreye girer.
variable "autoscaling_cpu_target" {
  description = "Target CPU utilisation percentage for auto scaling"
  type        = number
  default     = 60
}
# -----------------------------------------------------------------------------
# CI/CD degiskenleri (CodeBuild & CodePipeline)
# Bu degiskenler otomatik Docker build/push ve ECS deploy zincirini etkinlestirmek
# icin kullanilir. enable_* false ise ilgili kaynaklar olusturulmaz.
# -----------------------------------------------------------------------------

variable "enable_codebuild" {
  description = "CodeBuild kaynaklari olusturulsun mu? true yapmadan pipeline calismaz"
  type        = bool
  default     = false
}

variable "enable_codepipeline" {
  description = "CodePipeline kurulsun mu? true ise enable_codebuild de true olmalidir"
  type        = bool
  default     = false

  validation {
    condition     = var.enable_codepipeline == false || var.enable_codebuild == true
    error_message = "CodePipeline'i etkinlestirmeden once enable_codebuild degiskenini true yapmalisiniz."
  }
}

variable "codebuild_project_name" {
  description = "CodeBuild projesinin adi (enable_codebuild=true ise gerekli)"
  type        = string
  default     = "qr-photo-backend-build"
}

variable "codebuild_environment_image" {
  description = "CodeBuild Linux ortam imgasi (Docker build icin aws/codebuild/standard:7.0 onerilir)"
  type        = string
  default     = "aws/codebuild/standard:7.0"
}

variable "codebuild_compute_type" {
  description = "CodeBuild compute tipi (BUILD_GENERAL1_SMALL/2/4)"
  type        = string
  default     = "BUILD_GENERAL1_SMALL"
}

variable "codebuild_timeout_minutes" {
  description = "CodeBuild calisma zaman asimi (dakika)"
  type        = number
  default     = 60
}

variable "codebuild_buildspec_path" {
  description = "Repo icindeki buildspec dosyasinin yolu"
  type        = string
  default     = "infra/terraform/aws/buildspec.backend.yml"
}

variable "codebuild_image_repo_name" {
  description = "CodeBuild'in push edecegi ECR repo adi (Terraform ile olusan repo ile eslesmeli)"
  type        = string
  default     = "qr-photo-prod-backend"
}

variable "codebuild_image_tag" {
  description = "CodeBuild'in kullanacagi varsayilan imaj tag'i (CI pipeline'inda override edilebilir)"
  type        = string
  default     = "latest"
}

variable "codepipeline_name" {
  description = "CodePipeline adi (enable_codepipeline=true ise gerekli)"
  type        = string
  default     = "qr-photo-backend-pipeline"
}

variable "codepipeline_artifact_bucket_name" {
  description = "CodePipeline artifact'lerini tutacak benzersiz S3 bucket adi"
  type        = string
  default     = null
}

variable "codepipeline_codestar_connection_arn" {
  description = "GitHub/Bitbucket icin onceden olusturulmus CodeStar Connection ARN'i"
  type        = string
  default     = null

  validation {
    condition     = var.enable_codepipeline == false || try(length(var.codepipeline_codestar_connection_arn) > 0, false)
    error_message = "CodePipeline aktifken CodeStar Connection ARN degeri zorunludur."
  }
}

variable "codepipeline_source_repo_owner" {
  description = "Kaynak repository sahibi (GitHub org veya kullanici)"
  type        = string
  default     = null

  validation {
    condition     = var.enable_codepipeline == false || try(length(trimspace(var.codepipeline_source_repo_owner)) > 0, false)
    error_message = "CodePipeline etkinse repository sahibini (org/kullanici) belirtmelisiniz."
  }
}

variable "codepipeline_source_repo_name" {
  description = "Kaynak repository adi"
  type        = string
  default     = null

  validation {
    condition     = var.enable_codepipeline == false || try(length(trimspace(var.codepipeline_source_repo_name)) > 0, false)
    error_message = "CodePipeline icin repository adini bos birakmayin."
  }
}

variable "codepipeline_source_branch" {
  description = "Pipeline'in takip edecegi branch (ornegin main)"
  type        = string
  default     = "main"
}





