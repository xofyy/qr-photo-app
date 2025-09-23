# Workload EC2 Instance modulunde opsiyonel sanal makine kaynaklari tanimlanir.

# Yonetilen security group ID listelerini hesaplar.
locals {
  managed_security_group_ids = var.create_security_group ? [aws_security_group.this[0].id] : []
  merged_security_group_ids  = concat(var.security_group_ids, local.managed_security_group_ids)
}

# Opsiyonel olarak olusturulan security group kurallarini tanimlar.
resource "aws_security_group" "this" {
  count = var.create_security_group ? 1 : 0

  name_prefix = "${var.name_prefix}-vm-"
  description = "Managed security group for ${var.name_prefix} instance"
  vpc_id      = data.aws_subnet.selected.vpc_id

  dynamic "ingress" {
    for_each = var.security_group_ingress

    content {
      description      = ingress.value.description
      from_port        = ingress.value.from_port
      to_port          = ingress.value.to_port
      protocol         = ingress.value.protocol
      cidr_blocks      = lookup(ingress.value, "cidr_blocks", [])
      ipv6_cidr_blocks = lookup(ingress.value, "ipv6_cidr_blocks", [])
      security_groups  = lookup(ingress.value, "security_groups", [])
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vm-sg"
  })
}

# Instance in baglanacagi subnet bilgisini getirir.
data "aws_subnet" "selected" {
  id = var.subnet_id
}

# EC2 instance kaynagini baslatarak VM ihtiyacini karsilar.
resource "aws_instance" "this" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  associate_public_ip_address = var.assign_public_ip
  iam_instance_profile        = var.iam_instance_profile
  key_name                    = var.key_name
  user_data                   = var.user_data
  vpc_security_group_ids      = local.merged_security_group_ids

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = var.root_volume_type
    delete_on_termination = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vm"
  })
}
