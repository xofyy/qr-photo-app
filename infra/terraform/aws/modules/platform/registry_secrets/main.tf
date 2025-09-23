# Platform registry_secrets modulunde ECR deposu ve Secrets Manager girdileri olusturulur.

# Uygulama container imajlarini saklamak icin ECR deposu kurar.
resource "aws_ecr_repository" "this" {
  name                 = "${var.name_prefix}-backend"
  image_tag_mutability = var.image_tag_mutability

  image_scanning_configuration {
    scan_on_push = var.enable_image_scanning
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-ecr"
  })
}

# Secrets Manager icinde her gizli deger icin secret kaydi olusturur.
resource "aws_secretsmanager_secret" "this" {
  for_each = var.service_secrets

  name = "${var.name_prefix}-${each.key}"

  tags = var.tags
}

# Secret icine gercek degerleri version olarak yazar.
resource "aws_secretsmanager_secret_version" "this" {
  for_each = var.service_secrets

  secret_id     = aws_secretsmanager_secret.this[each.key].id
  secret_string = each.value
}

# ECS icin hazirlanan secret referanslarini liste seklinde toparlar.
locals {
  container_secrets = [
    for name, secret in aws_secretsmanager_secret_version.this : {
      name      = name
      valueFrom = secret.arn
    }
  ]
}
