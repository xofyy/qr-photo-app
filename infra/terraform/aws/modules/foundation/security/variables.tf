variable "name_prefix" {
  description = "Prefix appended to security group names"
  type        = string
}

variable "tags" {
  description = "Base tags applied to security groups"
  type        = map(string)
  default     = {}
}

variable "vpc_id" {
  description = "VPC identifier where security groups reside"
  type        = string
}

variable "lb_listener_port" {
  description = "Port exposed on the load balancer"
  type        = number
}

variable "alb_ingress_cidrs" {
  description = "CIDR blocks allowed to reach the load balancer"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "container_port" {
  description = "ECS container port allowed from the ALB"
  type        = number
}
