# -----------------------------------------------------------------------------
# Terraform infrastructure for QR Photo backend on Amazon Web Services.
# Bu dosya Fargate tabanli dagitim icin ag (VPC, subnet, SG), container registry
# (ECR), calistirma ortami (ECS Fargate) ve Application Load Balancer kaynaklarini
# oluşturur. Yorumlar her blokta hangi ayarlarin mevcut oldugunu ve nasil
# ozellestirilebilecegini aciklar.
# -----------------------------------------------------------------------------
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

# provider "aws": region degiskeni terraform.tfvars ile kontrol edilir. Ayrica
# farklı hesaplara dagitim yapacaksaniz profile veya assume_role parametreleri
# ekleyebilirsiniz.
provider "aws" {
  region = var.aws_region
}

# Mevcut AWS hesap bilgileri: caller identity (account ID), partition (aws, aws-cn)
# ve kullanilabilir availability zone listesi. Zone sayisi public_subnet_cidrs
# uzunlugu ile uyumlu olmali.
data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# local degiskenler: kaynak isimlendirmesi icin prefix, public subnetlerin AZ
# atamalari ve ECS icin environment/secrets listeleri. Subnet sayisini artirmak
# isterseniz public_subnet_cidrs listesini genisletmeniz yeterli.
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  public_subnets = {
    for idx, cidr in var.public_subnet_cidrs : idx => {
      cidr = cidr
      az   = element(data.aws_availability_zones.available.names, idx)
    }
  }
  container_env = [
    for name, value in var.service_env_vars : {
      name  = name
      value = value
    }
  ]
  container_secrets = [
    for name, secret in aws_secretsmanager_secret_version.service : {
      name      = name
      valueFrom = secret.arn
    }
  ]
  lb_listener_port     = var.lb_listener_port
  codebuild_enabled    = var.enable_codepipeline ? true : var.enable_codebuild
  codepipeline_enabled = var.enable_codepipeline
  codepipeline_artifact_bucket_name = coalesce(
    var.codepipeline_artifact_bucket_name,
    "${replace(lower(local.name_prefix), "_", "-")}-codepipeline-${data.aws_caller_identity.current.account_id}"
  )
}

# --------------------------- Ag Katmani --------------------------------------

# Uygulamaya ayri bir IP uzayi saglamak icin yeni bir VPC olusturuyoruz.
# vpc_cidr degerini mevcut network topolojinize gore ayarlayabilirsiniz.
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(var.default_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

# Internet gateway VPC'nin dis dunya ile iletisime acilmasini saglar. NAT
# senaryolarinda ek olarak NAT Gateway de tanimlayabilirsiniz.
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.default_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

# Public subnetler Fargate task'larina public IP atamak ve ALB'yi barindirmak icin
# kullanilir. map_public_ip_on_launch true oldugunda ECS task'lari public IP alir.
resource "aws_subnet" "public" {
  for_each = local.public_subnets

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  tags = merge(var.default_tags, {
    Name = "${local.name_prefix}-public-${each.key}"
  })
}

# Public subnetlerin yonlendirme tablosu; tum trafik internet gateway'e gider.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(var.default_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

# ------------------------- Guvenlik Gruplari ---------------------------------

# ALB guvenlik grubu. lb_listener_port degiskenini 443 yaparsaniz burada da
# uygun portu acmaniz gerekir; HTTPS icin ekstra TLS sertifika ve listener ekleyin.
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb"
  description = "Allow HTTP ingress to ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = var.lb_listener_port
    to_port     = var.lb_listener_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.default_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# Servis guvenlik grubu yalnizca ALB'den gelen trafige izin verir. Fargate task'lari
# VPC ici baska servislerle konusacaksa ek ingress kurallari ekleyebilirsiniz.
resource "aws_security_group" "service" {
  name        = "${local.name_prefix}-service"
  description = "Allow traffic from ALB to ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.default_tags, {
    Name = "${local.name_prefix}-service-sg"
  })
}

# --------------------------- Registry ve Loglar ------------------------------

# Docker imajlarinin saklandigi ECR repository. image_tag_mutability "IMMUTABLE"
# yapilirsa ayni tag ile push engellenir (CI politikalarina gore secilebilir).
resource "aws_ecr_repository" "app" {
  name                 = "${local.name_prefix}-backend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(var.default_tags, {
    Name = "${local.name_prefix}-ecr"
  })
}

# CloudWatch log grubu ECS task loglarini tutar. log_retention_days degiskeni ile
# saklama suresini ayarlayabilirsiniz.
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/${local.name_prefix}-backend"
  retention_in_days = var.log_retention_days

  tags = var.default_tags
}

# --------------------------- IAM Roller --------------------------------------

# ECS task execution rolu: ECR'den imaj cekmek ve CloudWatch'a log yazmak icin
# AmazonECSTaskExecutionRolePolicy eklenir. Ek servisler gerekiyorsa ekstra policy
# attach edebilirsiniz.
resource "aws_iam_role" "ecs_task_execution" {
  name               = "${local.name_prefix}-exec"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json

  tags = var.default_tags
}

data "aws_iam_policy_document" "ecs_task_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Uygulama konteynerinin AWS servislerine erisim ihtiyaci varsa (sekillerde SQS,
# DynamoDB vb.) bu task rolu icin ek custom policy tanimlayabilirsiniz.
resource "aws_iam_role" "ecs_task" {
  name               = "${local.name_prefix}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume.json

  tags = var.default_tags
}

# Secrets Manager'da saklanacak gizli degerler. replication gereksinimi varsa
# multi-region replication config ekleyebilirsiniz.
# Execution role needs explicit access to Secrets Manager values injected into containers.
resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  count = length(var.service_secrets) > 0 ? 1 : 0

  name = "${local.name_prefix}-exec-secrets"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
        Resource = [for s in aws_secretsmanager_secret.service : s.arn]
      }
    ]
  })
}

resource "aws_secretsmanager_secret" "service" {
  for_each = var.service_secrets

  name = "${local.name_prefix}-${each.key}"

  tags = var.default_tags
}

resource "aws_secretsmanager_secret_version" "service" {
  for_each = var.service_secrets

  secret_id     = aws_secretsmanager_secret.service[each.key].id
  secret_string = each.value
}

# --------------------------- ECS ve ALB --------------------------------------

# ECS cluster Fargate gorevlerinin mantiksal gruplanmasini saglar. containerInsights
# true yapilirsa CloudWatch metrikleri otomatik toplanir (ek maliyet olabilir).
resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = var.enable_container_insights ? "enabled" : "disabled"
  }

  tags = var.default_tags
}

# ECS task definition container imajini, port mapping'i ve log/secret ayarlarini tutar.
# image_tag degiskeni CI/CD pipeline tarafindan commit SHA olarak override edilebilir.
resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name_prefix}-backend"
  cpu                      = tostring(var.task_cpu)    # 512, 1024 gibi degerler Fargate kombinasyonlariyla uyumlu olmali.
  memory                   = tostring(var.task_memory) # 1024, 2048 vb. secenekler icin AWS belgelemesine bakiniz.
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = var.container_name
      image     = "${aws_ecr_repository.app.repository_url}:${var.image_tag}"
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = var.container_name
        }
      }
      environment = local.container_env
      secrets     = local.container_secrets
    }
  ])

  tags = var.default_tags
}

# Application Load Balancer gelen HTTP trafigini ECS servisindeki gorevlere yonlendirir.
# internal=true yaparak sadece VPC ici erisilebilir hale getirebilirsiniz.
resource "aws_lb" "public" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = [for s in aws_subnet.public : s.id]

  tags = merge(var.default_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

# Target group ALB'nin yonlendirdigi hedefleri tanimlar. target_type="ip" Fargate
# icin zorunludur; EC2 kullansaydik "instance" secilebilirdi. health_check.path
# degiskeni variables.tf'da ayarlanir.
resource "aws_lb_target_group" "backend" {
  name        = "${local.name_prefix}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  health_check {
    path                = var.health_check_path
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200-399"
  }

  tags = var.default_tags
}

# HTTP listener 80 portunu dinler ve tum trafigi backend target group'a yollar.
# HTTPS destegi icin ek bir listener ve ACM sertifikasi tanimlamaniz gerekir.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.public.arn
  port              = local.lb_listener_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ECS servisi Fargate gorevlerini calistirir. assign_public_ip=true oldugunda task'lar
# dogrudan internet erisimi saglar; eger NAT arkasinda calismasini isterseniz
# private subnet + NAT Gateway kurmaniz gerekir.
resource "aws_ecs_service" "backend" {
  name                               = "${local.name_prefix}-service"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.backend.arn
  desired_count                      = var.desired_count
  launch_type                        = "FARGATE"
  enable_execute_command             = var.enable_execute_command
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50

  network_configuration {
    subnets          = [for s in aws_subnet.public : s.id]
    security_groups  = [aws_security_group.service.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = var.container_name
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.http]

  tags = var.default_tags
}

# --------------------------- Otomatik Olcekleme ------------------------------

# App AutoScaling hedefi, ECS servisindeki desired_count degerini dinamik olarak
# yonetir. autoscaling_min_capacity / max_capacity degiskenleri araliginda calisir.
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.autoscaling_max_capacity
  min_capacity       = var.autoscaling_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU bazli hedef izleme politikasi. CPU yuzdesi autoscaling_cpu_target'i asarsa
# yeni task'lar eklenir; altina dusunce task sayisi azaltilir. Farkli metrikler
# (NetworkIn vb.) kullanmak icin predefined_metric_type degistirebilirsiniz.
resource "aws_appautoscaling_policy" "cpu" {
  name               = "${local.name_prefix}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.autoscaling_cpu_target
    scale_in_cooldown  = 60
    scale_out_cooldown = 60
  }
}

# --------------------------- CI/CD (CodeBuild & CodePipeline) ---------------

# CodeBuild servis rolu: Docker build/push ve ECS update icin gerekli yetkiler
resource "aws_iam_role" "codebuild" {
  count = local.codebuild_enabled ? 1 : 0

  name = "${local.name_prefix}-codebuild"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "codebuild.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = var.default_tags
}

resource "aws_iam_role_policy_attachment" "codebuild_ecr" {
  count = local.codebuild_enabled ? 1 : 0

  role       = aws_iam_role.codebuild[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser"
}

resource "aws_iam_role_policy_attachment" "codebuild_ecs" {
  count = local.codebuild_enabled ? 1 : 0

  role       = aws_iam_role.codebuild[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
}

resource "aws_iam_role_policy_attachment" "codebuild_logs" {
  count = local.codebuild_enabled ? 1 : 0

  role       = aws_iam_role.codebuild[0].name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

resource "aws_iam_role_policy" "codebuild_inline" {
  count = local.codepipeline_enabled ? 1 : 0

  name = "${local.name_prefix}-codebuild-inline"
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
  count = local.codebuild_enabled ? 1 : 0

  name          = var.codebuild_project_name
  description   = "Builds backend Docker image and deploys to ECS via CodeBuild"
  service_role  = aws_iam_role.codebuild[0].arn
  build_timeout = var.codebuild_timeout_minutes

  artifacts {
    type = local.codepipeline_enabled ? "CODEPIPELINE" : "NO_ARTIFACTS"
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
      value = aws_ecs_cluster.main.name
    }
    environment_variable {
      name  = "SERVICE_NAME"
      value = aws_ecs_service.backend.name
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
    type      = local.codepipeline_enabled ? "CODEPIPELINE" : "NO_SOURCE"
    buildspec = var.codebuild_buildspec_path
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.backend.name
      stream_name = "codebuild"
      status      = "ENABLED"
    }
  }

  tags = merge(var.default_tags, {
    Component = "ci-build"
  })
}

# CodePipeline artifact S3 bucket: pipeline asamalarinin ciktisini tutar.
resource "aws_s3_bucket" "codepipeline_artifacts" {
  count = local.codepipeline_enabled ? 1 : 0

  bucket        = local.codepipeline_artifact_bucket_name
  force_destroy = true

  lifecycle {
    prevent_destroy = false
  }

  tags = merge(var.default_tags, {
    Name = "${local.name_prefix}-pipeline-artifacts"
  })
}

resource "aws_s3_bucket_versioning" "codepipeline" {
  count = local.codepipeline_enabled ? 1 : 0

  bucket = aws_s3_bucket.codepipeline_artifacts[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "codepipeline" {
  count = local.codepipeline_enabled ? 1 : 0

  bucket = aws_s3_bucket.codepipeline_artifacts[0].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "codepipeline" {
  count = local.codepipeline_enabled ? 1 : 0

  bucket                  = aws_s3_bucket.codepipeline_artifacts[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CodePipeline servis rolü: kaynak çekme, CodeBuild tetikleme ve S3'e yazma yetkileri.
resource "aws_iam_role" "codepipeline" {
  count = local.codepipeline_enabled ? 1 : 0

  name = "${local.name_prefix}-codepipeline"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "codepipeline.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = var.default_tags
}

resource "aws_iam_role_policy" "codepipeline_inline" {
  count = local.codepipeline_enabled ? 1 : 0

  name = "${local.name_prefix}-codepipeline-inline"
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
  count = local.codepipeline_enabled ? 1 : 0

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

  tags = merge(var.default_tags, {
    Component = "ci-pipeline"
  })

  depends_on = [aws_iam_role_policy.codepipeline_inline]
}

output "codebuild_project_name" {
  description = "CodeBuild projesi (etkinse)"
  value       = length(aws_codebuild_project.backend) > 0 ? aws_codebuild_project.backend[0].name : null
}

output "codepipeline_name" {
  description = "CodePipeline adi (etkinse)"
  value       = length(aws_codepipeline.backend) > 0 ? aws_codepipeline.backend[0].name : null
}

# --------------------------- Ciktilar ----------------------------------------

output "alb_dns_name" {
  description = "DNS name of the public Application Load Balancer"
  value       = aws_lb.public.dns_name
}

output "ecr_repository_url" {
  description = "ECR repository URI for pushing container images"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_service_name" {
  description = "ECS service handling the backend"
  value       = aws_ecs_service.backend.name
}











