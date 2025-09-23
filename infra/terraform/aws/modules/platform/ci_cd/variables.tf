variable "enable_codebuild" {
  description = "Whether to create CodeBuild resources"
  type        = bool
}

variable "enable_codepipeline" {
  description = "Whether to create CodePipeline resources"
  type        = bool
}

variable "name_prefix" {
  description = "Prefix applied to CI/CD resources"
  type        = string
}

variable "tags" {
  description = "Base tags applied to CI/CD resources"
  type        = map(string)
  default     = {}
}

variable "aws_region" {
  description = "AWS region, used in environment variables"
  type        = string
}

variable "codebuild_project_name" {
  description = "Name of the CodeBuild project"
  type        = string
}

variable "codebuild_environment_image" {
  description = "Docker image used by CodeBuild"
  type        = string
}

variable "codebuild_compute_type" {
  description = "Compute type for CodeBuild"
  type        = string
}

variable "codebuild_timeout_minutes" {
  description = "Build timeout in minutes"
  type        = number
}

variable "codebuild_buildspec_path" {
  description = "Path to the buildspec file"
  type        = string
}

variable "codebuild_image_repo_name" {
  description = "Repository name pushed by CodeBuild"
  type        = string
}

variable "codebuild_image_tag" {
  description = "Default image tag used by CodeBuild"
  type        = string
}

variable "codepipeline_name" {
  description = "Name of the CodePipeline"
  type        = string
}

variable "codepipeline_artifact_bucket_name" {
  description = "S3 bucket name for pipeline artifacts"
  type        = string
}

variable "codepipeline_codestar_connection_arn" {
  description = "ARN of the CodeStar connection"
  type        = string
  default     = null
}

variable "codepipeline_source_repo_owner" {
  description = "Source repository owner"
  type        = string
  default     = null
}

variable "codepipeline_source_repo_name" {
  description = "Source repository name"
  type        = string
  default     = null
}

variable "codepipeline_source_branch" {
  description = "Source branch tracked by the pipeline"
  type        = string
  default     = "main"
}

variable "cluster_name" {
  description = "ECS cluster name used by deployment scripts"
  type        = string
}

variable "service_name" {
  description = "ECS service name used by deployment scripts"
  type        = string
}

variable "log_group_name" {
  description = "CloudWatch log group for CodeBuild logs"
  type        = string
}
