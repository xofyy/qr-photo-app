# Cikti Degerleri: platform/ci_cd modulunden gelen bilgiler.

# Olusturulan CodeBuild projesinin adini saglar.
output "codebuild_project_name" {
  description = "Name of the CodeBuild project (if created)"
  value       = try(aws_codebuild_project.backend[0].name, null)
}

# Olusturulan CodePipeline adini saglar.
output "codepipeline_name" {
  description = "Name of the CodePipeline (if created)"
  value       = try(aws_codepipeline.backend[0].name, null)
}

# Pipeline artifact bucket adini dondurur.
output "artifact_bucket_name" {
  description = "Name of the artifact S3 bucket"
  value       = try(aws_s3_bucket.codepipeline_artifacts[0].bucket, null)
}
