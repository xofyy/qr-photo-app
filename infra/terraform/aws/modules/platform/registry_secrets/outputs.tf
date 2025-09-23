output "repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.this.repository_url
}

output "repository_name" {
  description = "ECR repository name"
  value       = aws_ecr_repository.this.name
}

output "repository_arn" {
  description = "ECR repository ARN"
  value       = aws_ecr_repository.this.arn
}

output "secret_arns" {
  description = "Map of Secrets Manager secret ARNs"
  value       = { for name, secret in aws_secretsmanager_secret.this : name => secret.arn }
}

output "secret_version_arns" {
  description = "Map of Secrets Manager secret version ARNs"
  value       = { for name, secret in aws_secretsmanager_secret_version.this : name => secret.arn }
}

output "container_secrets" {
  description = "List of container secrets objects (name/valueFrom)"
  value       = local.container_secrets
}
