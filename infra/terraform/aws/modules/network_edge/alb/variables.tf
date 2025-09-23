variable "name_prefix" {
  description = "Prefix used for ALB resources"
  type        = string
}

variable "tags" {
  description = "Common tags applied to ALB resources"
  type        = map(string)
  default     = {}
}

variable "subnet_ids" {
  description = "Subnets where the ALB should be deployed"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group assigned to the ALB"
  type        = string
}

variable "vpc_id" {
  description = "Target VPC identifier"
  type        = string
}

variable "container_port" {
  description = "Port exposed by the target group"
  type        = number
}

variable "health_check_path" {
  description = "HTTP path used for health checks"
  type        = string
  default     = "/"
}

variable "listener_port" {
  description = "Listener port for the ALB"
  type        = number
  default     = 80
}

variable "listener_protocol" {
  description = "Listener protocol"
  type        = string
  default     = "HTTP"
}

variable "target_group_protocol" {
  description = "Target group protocol"
  type        = string
  default     = "HTTP"
}

variable "internal" {
  description = "Whether the ALB is internal"
  type        = bool
  default     = false
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection on the ALB"
  type        = bool
  default     = false
}
