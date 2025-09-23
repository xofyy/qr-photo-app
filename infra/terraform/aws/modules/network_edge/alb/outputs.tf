# Cikti Degerleri: network_edge/alb modulunun sagladigi bilgiler.

# Application Load Balancer ARN degerini saglar.
output "load_balancer_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.this.arn
}

# ALB nin DNS adresini dondurur.
output "load_balancer_dns_name" {
  description = "DNS name of the ALB"
  value       = aws_lb.this.dns_name
}

# Route53 icin kullanilabilecek hosted zone ID degerini verir.
output "load_balancer_zone_id" {
  description = "Hosted zone ID for the ALB"
  value       = aws_lb.this.zone_id
}

# Varsayilan target group ARN degerini saglar.
output "target_group_arn" {
  description = "ARN of the default target group"
  value       = aws_lb_target_group.this.arn
}

# HTTP listener ARN degerini dondurur.
output "listener_arn" {
  description = "ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}
