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

# local degiskenler: kaynak isimlendirmesi icin prefix, public subnetlerin AZ
# atamalari ve ECS icin environment/secrets listeleri. Subnet sayisini artirmak
# isterseniz public_subnet_cidrs listesini genisletmeniz yeterli.
locals {
  name_prefix    = "${var.project_name}-${var.environment}"
  public_subnets = module.foundation_network.public_subnets
  container_env = [
    for name, value in var.service_env_vars : {
      name  = name
      value = value
    }
  ]
  container_secrets    = module.platform_registry_secrets.container_secrets
  container_image      = "${module.platform_registry_secrets.repository_url}:${var.image_tag}"
  lb_listener_port     = var.lb_listener_port
  codebuild_enabled    = var.enable_codepipeline ? true : var.enable_codebuild
  codepipeline_enabled = var.enable_codepipeline
  codepipeline_artifact_bucket_name = coalesce(
    var.codepipeline_artifact_bucket_name,
    "${replace(lower(local.name_prefix), "_", "-")}-codepipeline-${data.aws_caller_identity.current.account_id}"
  )
}




# --------------------------- Ag Katmani --------------------------------------

module "foundation_network" {
  source              = "./modules/foundation/network"
  name_prefix         = local.name_prefix
  tags                = var.default_tags
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
}
# ------------------------- Guvenlik Gruplari ---------------------------------

module "foundation_security" {
  source           = "./modules/foundation/security"
  name_prefix      = local.name_prefix
  tags             = var.default_tags
  vpc_id           = module.foundation_network.vpc_id
  lb_listener_port = var.lb_listener_port
  container_port   = var.container_port
}
# --------------------------- Registry ve Secrets ------------------------------

module "platform_registry_secrets" {
  source          = "./modules/platform/registry_secrets"
  name_prefix     = local.name_prefix
  tags            = var.default_tags
  service_secrets = var.service_secrets
}

# --------------------------- Gozlenebilirlik -------------------------------

module "platform_observability" {
  source            = "./modules/platform/observability"
  name_prefix       = local.name_prefix
  tags              = var.default_tags
  retention_in_days = var.log_retention_days
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
        Resource = values(module.platform_registry_secrets.secret_arns)
      }
    ]
  })
}


# --------------------------- Uygulama Katmani ---------------------------------

# --------------------------- ALB Katmani --------------------------------------

module "network_edge_alb" {
  source            = "./modules/network_edge/alb"
  name_prefix       = local.name_prefix
  tags              = var.default_tags
  subnet_ids        = module.foundation_network.public_subnet_ids
  security_group_id = module.foundation_security.alb_security_group_id
  vpc_id            = module.foundation_network.vpc_id
  container_port    = var.container_port
  health_check_path = var.health_check_path
  listener_port     = local.lb_listener_port
}

# --------------------------- ECS Calisma Ortami ------------------------------

module "workload_ecs_service" {
  source                    = "./modules/workload/ecs_service"
  name_prefix               = local.name_prefix
  tags                      = var.default_tags
  enable_container_insights = var.enable_container_insights
  task_cpu                  = var.task_cpu
  task_memory               = var.task_memory
  container_name            = var.container_name
  container_port            = var.container_port
  container_image           = local.container_image
  log_group_name            = module.platform_observability.log_group_name
  aws_region                = var.aws_region
  container_environment     = local.container_env
  container_secrets         = local.container_secrets
  desired_count             = var.desired_count
  enable_execute_command    = var.enable_execute_command
  subnet_ids                = module.foundation_network.public_subnet_ids
  security_group_ids        = [module.foundation_security.service_security_group_id]
  assign_public_ip          = true
  target_group_arn          = module.network_edge_alb.target_group_arn
  autoscaling_min_capacity  = var.autoscaling_min_capacity
  autoscaling_max_capacity  = var.autoscaling_max_capacity
  autoscaling_cpu_target    = var.autoscaling_cpu_target
  task_execution_role_arn   = aws_iam_role.ecs_task_execution.arn
  task_role_arn             = aws_iam_role.ecs_task.arn
}

# --------------------------- CI/CD (CodeBuild & CodePipeline) ---------------

module "platform_ci_cd" {
  source                               = "./modules/platform/ci_cd"
  enable_codebuild                     = local.codebuild_enabled
  enable_codepipeline                  = local.codepipeline_enabled
  name_prefix                          = local.name_prefix
  tags                                 = var.default_tags
  aws_region                           = var.aws_region
  codebuild_project_name               = var.codebuild_project_name
  codebuild_environment_image          = var.codebuild_environment_image
  codebuild_compute_type               = var.codebuild_compute_type
  codebuild_timeout_minutes            = var.codebuild_timeout_minutes
  codebuild_buildspec_path             = var.codebuild_buildspec_path
  codebuild_image_repo_name            = var.codebuild_image_repo_name
  codebuild_image_tag                  = var.codebuild_image_tag
  codepipeline_name                    = var.codepipeline_name
  codepipeline_artifact_bucket_name    = local.codepipeline_artifact_bucket_name
  codepipeline_codestar_connection_arn = var.codepipeline_codestar_connection_arn
  codepipeline_source_repo_owner       = var.codepipeline_source_repo_owner
  codepipeline_source_repo_name        = var.codepipeline_source_repo_name
  codepipeline_source_branch           = var.codepipeline_source_branch
  cluster_name                         = module.workload_ecs_service.cluster_name
  service_name                         = module.workload_ecs_service.service_name
  log_group_name                       = module.platform_observability.log_group_name
}

output "codebuild_project_name" {
  description = "CodeBuild projesi (etkinse)"
  value       = module.platform_ci_cd.codebuild_project_name
}



output "codepipeline_name" {
  description = "CodePipeline adi (etkinse)"
  value       = module.platform_ci_cd.codepipeline_name
}



# --------------------------- Ciktilar ----------------------------------------

output "alb_dns_name" {
  description = "DNS name of the public Application Load Balancer"
  value       = module.network_edge_alb.load_balancer_dns_name
}

output "ecr_repository_url" {
  description = "ECR repository URI for pushing container images"
  value       = module.platform_registry_secrets.repository_url
}

output "ecs_service_name" {
  description = "ECS service handling the backend"
  value       = module.workload_ecs_service.service_name
}
























