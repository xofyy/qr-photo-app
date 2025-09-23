# Degiskenler: platform/ci_cd modulunde kullanilan girdiler.

# CodeBuild kaynaklarinin olusturulup olusturulmayacagini belirler.
variable "enable_codebuild" {
  description = "CodeBuild kaynaklarini olusturup olusturmayacagini belirler"
  type        = bool
}

# CodePipeline kaynaklarinin olusturulup olusturulmayacagini belirler.
variable "enable_codepipeline" {
  description = "CodePipeline kaynaklarini olusturup olusturmayacagini belirler"
  type        = bool
}

# CI/CD kaynaklari icin kullanilacak prefix degerini tanimlar.
variable "name_prefix" {
  description = "CI/CD kaynaklari icin kullanilan prefix"
  type        = string
}

# CI/CD kaynaklari icin ortak tag haritasini saglar.
variable "tags" {
  description = "CI/CD kaynaklari icin ortak tag haritasi"
  type        = map(string)
  default     = {}
}

# CI/CD islemlerinde kullanilacak AWS bolgesini belirtir.
variable "aws_region" {
  description = "CI/CD isleri icin kullanilacak AWS bolgesi"
  type        = string
}

# Olusacak CodeBuild projesinin adini tanimlar.
variable "codebuild_project_name" {
  description = "CodeBuild projesinin adi"
  type        = string
}

# CodeBuild icin temel container imajini belirler.
variable "codebuild_environment_image" {
  description = "CodeBuild calisma ortami icin container imaji"
  type        = string
}

# CodeBuild calismalari icin compute tipini ayarlar.
variable "codebuild_compute_type" {
  description = "CodeBuild compute tipi"
  type        = string
}

# CodeBuild calisma zaman asimini dakika olarak tanimlar.
variable "codebuild_timeout_minutes" {
  description = "CodeBuild isleri icin timeout (dakika)"
  type        = number
}

# CodeBuild buildspec dosyasinin yolunu belirtir.
variable "codebuild_buildspec_path" {
  description = "CodeBuild buildspec dosyasinin yolu"
  type        = string
}

# CodeBuild tarafindan push edilecek ECR depo adini tanimlar.
variable "codebuild_image_repo_name" {
  description = "CodeBuild tarafindan push edilecek ECR repo adi"
  type        = string
}

# CodeBuild icin varsayilan imaj tagini belirler.
variable "codebuild_image_tag" {
  description = "CodeBuild icin varsayilan imaj tagi"
  type        = string
}

# Olusacak CodePipeline kaynagina isim verir.
variable "codepipeline_name" {
  description = "CodePipeline kaynagi icin isim"
  type        = string
}

# Pipeline artifact bucket adini override eder.
variable "codepipeline_artifact_bucket_name" {
  description = "CodePipeline artifact bucket adi"
  type        = string
}

# Kaynak repo baglantisi icin CodeStar Connection ARN degerini saglar.
variable "codepipeline_codestar_connection_arn" {
  description = "CodeStar Connection ARN degeri"
  type        = string
  default     = null
}

# Kaynak repository sahibini (org veya kullanici) belirtir.
variable "codepipeline_source_repo_owner" {
  description = "Kaynak repository sahibi"
  type        = string
  default     = null
}

# Kaynak repository adini tanimlar.
variable "codepipeline_source_repo_name" {
  description = "Kaynak repository adi"
  type        = string
  default     = null
}

# Pipeline tarafindan izlenecek branch adini belirtir.
variable "codepipeline_source_branch" {
  description = "Pipeline tarafindan izlenecek branch"
  type        = string
  default     = "main"
}

# Dagitim betikleri icin ECS cluster adini saglar.
variable "cluster_name" {
  description = "ECS cluster adi"
  type        = string
}

# Dagitim betikleri icin ECS servis adini saglar.
variable "service_name" {
  description = "ECS servis adi"
  type        = string
}

# CodeBuild log verilerinin yazilacagi CloudWatch log grubunu belirtir.
variable "log_group_name" {
  description = "CodeBuild log grubu adi"
  type        = string
}
