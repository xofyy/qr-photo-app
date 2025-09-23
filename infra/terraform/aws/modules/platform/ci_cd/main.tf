resource "aws_iam_role" "codebuild" {
  count = var.enable_codebuild ? 1 : 0

  name = "${var.name_prefix}-codebuild"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "codebuild.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "codebuild_ecr" {
  count = var.enable_codebuild ? 1 : 0

  role       = aws_iam_role.codebuild[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

resource "aws_iam_role_policy_attachment" "codebuild_ecs" {
  count = var.enable_codebuild ? 1 : 0

  role       = aws_iam_role.codebuild[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
}

resource "aws_iam_role_policy_attachment" "codebuild_logs" {
  count = var.enable_codebuild ? 1 : 0

  role       = aws_iam_role.codebuild[0].name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

resource "aws_iam_role_policy" "codebuild_inline" {
  count = var.enable_codepipeline ? 1 : 0

  name = "${var.name_prefix}-codebuild-inline"
  role = aws_iam_role.codebuild[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject", "s3:GetObjectVersion"]
        Resource = [
          "${aws_s3_bucket.codepipeline_artifacts[0].arn}/*"
        ]
      }
    ]
  })

  depends_on = [aws_s3_bucket.codepipeline_artifacts]
}

resource "aws_codebuild_project" "backend" {
  count = var.enable_codebuild ? 1 : 0

  name          = var.codebuild_project_name
  description   = "Builds backend Docker image and deploys to ECS via CodeBuild"
  service_role  = aws_iam_role.codebuild[0].arn
  build_timeout = var.codebuild_timeout_minutes

  artifacts {
    type = var.enable_codepipeline ? "CODEPIPELINE" : "NO_ARTIFACTS"
  }

  environment {
    compute_type                = var.codebuild_compute_type
    image                       = var.codebuild_environment_image
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }
    environment_variable {
      name  = "CLUSTER_NAME"
      value = var.cluster_name
    }
    environment_variable {
      name  = "SERVICE_NAME"
      value = var.service_name
    }
    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = var.codebuild_image_repo_name
    }
    environment_variable {
      name  = "IMAGE_TAG"
      value = var.codebuild_image_tag
    }
  }

  source {
    type      = var.enable_codepipeline ? "CODEPIPELINE" : "NO_SOURCE"
    buildspec = var.codebuild_buildspec_path
  }

  logs_config {
    cloudwatch_logs {
      group_name  = var.log_group_name
      stream_name = "codebuild"
      status      = "ENABLED"
    }
  }

  tags = merge(var.tags, {
    Component = "ci-build"
  })
}

resource "aws_s3_bucket" "codepipeline_artifacts" {
  count = var.enable_codepipeline ? 1 : 0

  bucket        = var.codepipeline_artifact_bucket_name
  force_destroy = true

  lifecycle {
    prevent_destroy = false
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-pipeline-artifacts"
  })
}

resource "aws_s3_bucket_versioning" "codepipeline" {
  count = var.enable_codepipeline ? 1 : 0

  bucket = aws_s3_bucket.codepipeline_artifacts[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "codepipeline" {
  count = var.enable_codepipeline ? 1 : 0

  bucket = aws_s3_bucket.codepipeline_artifacts[0].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "codepipeline" {
  count = var.enable_codepipeline ? 1 : 0

  bucket                  = aws_s3_bucket.codepipeline_artifacts[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_role" "codepipeline" {
  count = var.enable_codepipeline ? 1 : 0

  name = "${var.name_prefix}-codepipeline"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "codepipeline.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "codepipeline_inline" {
  count = var.enable_codepipeline ? 1 : 0

  name = "${var.name_prefix}-codepipeline-inline"
  role = aws_iam_role.codepipeline[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:GetObjectVersion", "s3:PutObject"]
        Resource = [
          "${aws_s3_bucket.codepipeline_artifacts[0].arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["codebuild:BatchGetBuilds", "codebuild:StartBuild"]
        Resource = [aws_codebuild_project.backend[0].arn]
      },
      {
        Effect   = "Allow"
        Action   = ["codestar-connections:UseConnection"]
        Resource = var.codepipeline_codestar_connection_arn
      }
    ]
  })
}

resource "aws_codepipeline" "backend" {
  count = var.enable_codepipeline ? 1 : 0

  name     = var.codepipeline_name
  role_arn = aws_iam_role.codepipeline[0].arn

  artifact_store {
    location = aws_s3_bucket.codepipeline_artifacts[0].bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["SourceOutput"]
      configuration = {
        ConnectionArn    = var.codepipeline_codestar_connection_arn
        FullRepositoryId = "${var.codepipeline_source_repo_owner}/${var.codepipeline_source_repo_name}"
        BranchName       = var.codepipeline_source_branch
        DetectChanges    = "true"
      }
    }
  }

  stage {
    name = "Build"

    action {
      name             = "Build"
      category         = "Build"
      owner            = "AWS"
      provider         = "CodeBuild"
      version          = "1"
      input_artifacts  = ["SourceOutput"]
      output_artifacts = []
      configuration = {
        ProjectName = aws_codebuild_project.backend[0].name
      }
    }
  }

  tags = merge(var.tags, {
    Component = "ci-pipeline"
  })

  depends_on = [aws_iam_role_policy.codepipeline_inline]
}
