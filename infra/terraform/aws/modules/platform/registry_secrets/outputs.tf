# Cikti Degerleri: platform/registry_secrets modulunden gelen bilgiler.

# Olusturulan ECR deposunun URL bilgisini saglar.
output "repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.this.repository_url
}

# ECR depot adini dondurur.
output "repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.this.name
}

# ECR depo ARN degerini saglar.
output "repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.this.arn
}

# Olusturulan her secret icin ARN map degeri dondurur.
output "secret_arns" {
  description = "Map of Secrets Manager secret ARNs"
  value       = { for name, secret in aws_secretsmanager_secret.this : name => secret.arn }
}

# Secret version ARN degerlerini map olarak saglar.
output "secret_version_arns" {
  description = "Map of Secrets Manager secret version ARNs"
  value       = { for name, secret in aws_secretsmanager_secret_version.this : name => secret.arn }
}

# ECS container icin hazirlanmis secret objelerini dondurur.
output "container_secrets" {
  description = "List of container secrets objects (name/valueFrom)"
  value       = local.container_secrets
}
