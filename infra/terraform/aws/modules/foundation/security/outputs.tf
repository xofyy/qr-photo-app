# Cikti Degerleri: foundation/security modulunden gelen bilgiler.

# ALB icin olusturulan security group ID degerini dondurur.
output "alb_security_group_id" {
  description = "Security group ID for the load balancer"
  value       = aws_security_group.alb.id
}

# ECS servisinin kullandigi security group ID degerini dondurur.
output "service_security_group_id" {
  description = "Security group ID for the ECS service"
  value       = aws_security_group.service.id
}

# ALB security group ARN degerini saglar.
output "alb_security_group_arn" {
  description = "Security group ARN for the load balancer"
  value       = aws_security_group.alb.arn
}

# Servis security group ARN degerini saglar.
output "service_security_group_arn" {
  description = "Security group ARN for the ECS service"
  value       = aws_security_group.service.arn
}
