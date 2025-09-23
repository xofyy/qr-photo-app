output "codebuild_project_name" {
  description = "Name of the CodeBuild project (if created)"
  value       = try(aws_codebuild_project.backend[0].name, null)
}

output "codepipeline_name" {
  description = "Name of the CodePipeline (if created)"
  value       = try(aws_codepipeline.backend[0].name, null)
}

output "artifact_bucket_name" {
  description = "Name of the artifact S3 bucket"
  value       = try(aws_s3_bucket.codepipeline_artifacts[0].bucket, null)
}
