variable "name_prefix" {
  description = "Prefix for observability resources"
  type        = string
}

variable "tags" {
  description = "Base tags for observability resources"
  type        = map(string)
  default     = {}
}

variable "log_group_name" {
  description = "Optional override for the log group name"
  type        = string
  default     = null
}

variable "retention_in_days" {
  description = "Log retention period"
  type        = number
  default     = 30
}

variable "kms_key_arn" {
  description = "Optional KMS key ARN for log encryption"
  type        = string
  default     = null
}
