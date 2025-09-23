locals {
  log_group_name = coalesce(var.log_group_name, "/ecs/${var.name_prefix}-backend")
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = local.log_group_name
  retention_in_days = var.retention_in_days
  kms_key_id        = var.kms_key_arn

  tags = var.tags
}
