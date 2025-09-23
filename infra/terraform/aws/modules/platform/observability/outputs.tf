# Cikti Degerleri: platform/observability modulunun sagladigi bilgiler.

# CloudWatch log grubu adini disari verir.
output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.name
}

# Log grubu ARN degerini saglar.
output "log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.ecs.arn
}
