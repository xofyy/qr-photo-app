variable "name_prefix" {
  description = "Prefix appended to resource names"
  type        = string
}

variable "tags" {
  description = "Base tags applied to all resources"
  type        = map(string)
  default     = {}
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
}

variable "availability_zones" {
  description = "Optional ordered list of availability zone names"
  type        = list(string)
  default     = []
}

variable "enable_public_ip_on_launch" {
  description = "Assign public IPs to instances launched in public subnets"
  type        = bool
  default     = true
}
