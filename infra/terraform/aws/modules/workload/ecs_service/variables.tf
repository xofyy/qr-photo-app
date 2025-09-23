variable "name_prefix" {
  description = "Prefix used for ECS resources"
  type        = string
}

variable "tags" {
  description = "Common tags applied to ECS resources"
  type        = map(string)
  default     = {}
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "task_cpu" {
  description = "CPU units allocated to the task"
  type        = number
}

variable "task_memory" {
  description = "Memory (MiB) allocated to the task"
  type        = number
}

variable "container_name" {
  description = "Name of the container definition"
  type        = string
}

variable "container_port" {
  description = "Container port exposed"
  type        = number
}

variable "container_image" {
  description = "Full container image (repository:tag)"
  type        = string
}

variable "log_group_name" {
  description = "CloudWatch log group name"
  type        = string
}

variable "aws_region" {
  description = "AWS region for log configuration"
  type        = string
}

variable "container_environment" {
  description = "List of plain environment variables"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "container_secrets" {
  description = "List of secret environment variables"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
}

variable "enable_execute_command" {
  description = "Enable ECS execute command"
  type        = bool
  default     = false
}

variable "subnet_ids" {
  description = "Subnets for ECS tasks"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security groups applied to ECS tasks"
  type        = list(string)
}

variable "assign_public_ip" {
  description = "Assign public IP to Fargate tasks"
  type        = bool
  default     = true
}

variable "target_group_arn" {
  description = "Target group ARN for the service load balancer"
  type        = string
}

variable "autoscaling_min_capacity" {
  description = "Minimum desired count for autoscaling"
  type        = number
}

variable "autoscaling_max_capacity" {
  description = "Maximum desired count for autoscaling"
  type        = number
}

variable "autoscaling_cpu_target" {
  description = "Target CPU utilization for autoscaling"
  type        = number
}

variable "task_execution_role_arn" {
  description = "IAM role ARN used for ECS task execution"
  type        = string
}

variable "task_role_arn" {
  description = "IAM role ARN used by the task"
  type        = string
}
