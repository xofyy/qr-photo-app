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

resource "aws_secretsmanager_secret" "this" {
  for_each = var.service_secrets

  name = "${var.name_prefix}-${each.key}"

  tags = var.tags
}

resource "aws_secretsmanager_secret_version" "this" {
  for_each = var.service_secrets

  secret_id     = aws_secretsmanager_secret.this[each.key].id
  secret_string = each.value
}

locals {
  container_secrets = [
    for name, secret in aws_secretsmanager_secret_version.this : {
      name      = name
      valueFrom = secret.arn
    }
  ]
}
