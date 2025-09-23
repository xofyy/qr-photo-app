# Foundation Security modulunde ALB ve servis security gruplari tanimlanir.

# ALB icin gelen ve giden trafik kurallarini belirler.
resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb"
  description = "Load balancer ingress"
  vpc_id      = var.vpc_id

  ingress {
    description = "ALB listener"
    from_port   = var.lb_listener_port
    to_port     = var.lb_listener_port
    protocol    = "tcp"
    cidr_blocks = var.alb_ingress_cidrs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb-sg"
  })
}

# ECS servis tasklarinin yalnizca ALB uzerinden erisilmesini saglar.
resource "aws_security_group" "service" {
  name        = "${var.name_prefix}-service"
  description = "ECS service ingress from ALB"
  vpc_id      = var.vpc_id

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

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-service-sg"
  })
}
