output "alb_security_group_id" {
  description = "Security group ID for the load balancer"
  value       = aws_security_group.alb.id
}

output "service_security_group_id" {
  description = "Security group ID for the ECS service"
  value       = aws_security_group.service.id
}

output "alb_security_group_arn" {
  description = "Security group ARN for the load balancer"
  value       = aws_security_group.alb.arn
}

output "service_security_group_arn" {
  description = "Security group ARN for the ECS service"
  value       = aws_security_group.service.arn
}
