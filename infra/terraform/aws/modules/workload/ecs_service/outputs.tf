# Cikti Degerleri: workload/ecs_service modulunden gelen bilgiler.

# ECS cluster adini disari aktarir.
output "cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.this.name
}

# ECS cluster ARN degerini saglar.
output "cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.this.arn
}

# ECS servis adini dondurur.
output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.this.name
}

# ECS servis ARN degerini saglar.
output "service_arn" {
  description = "ARN of the ECS service"
  value       = aws_ecs_service.this.id
}

# Task definition ARN degerini paylasir.
output "task_definition_arn" {
  description = "ARN of the task definition"
  value       = aws_ecs_task_definition.this.arn
}
