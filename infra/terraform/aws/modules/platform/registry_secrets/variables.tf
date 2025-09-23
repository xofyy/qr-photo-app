variable "name_prefix" {
  description = "Prefix applied to registry and secret resources"
  type        = string
}

variable "tags" {
  description = "Base tags for created resources"
  type        = map(string)
  default     = {}
}

variable "service_secrets" {
  description = "Map of secret keys to values"
  type        = map(string)
  default     = {}
}

variable "image_tag_mutability" {
  description = "ECR image tag mutability (MUTABLE or IMMUTABLE)"
  type        = string
  default     = "MUTABLE"
}

variable "enable_image_scanning" {
  description = "Enable on-push vulnerability scanning"
  type        = bool
  default     = true
}
