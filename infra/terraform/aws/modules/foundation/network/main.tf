# Foundation Network modulunde VPC ve public subnet yapisi olusturulur.

terraform {
  required_version = ">= 1.6.0"
}

# Mevcut AWS availability zone listesini ceker.
data "aws_availability_zones" "available" {
  state = "available"
}

# Local hesaplamalar: tercih edilen AZ secimi ve subnet haritalari.
locals {
  selected_azs = length(var.availability_zones) > 0 ? var.availability_zones : data.aws_availability_zones.available.names
  public_subnets = {
    for idx, cidr in var.public_subnet_cidrs : idx => {
      cidr = cidr
      az   = element(local.selected_azs, idx)
    }
  }
}

# VPC kaynagini olusturarak temel ag sinirlarini belirler.
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-vpc"
  })
}

# Internet gateway ile VPC nin dis dunyaya cikisini saglar.
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-igw"
  })
}

# Public subnetleri cift halde olusturur ve istege bagli public IP atamasini etkinlestirir.
resource "aws_subnet" "public" {
  for_each = local.public_subnets

  vpc_id                  = aws_vpc.this.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = var.enable_public_ip_on_launch

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-${each.key}"
  })
}

# Public route table ile internet cikisini tanimlar.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-public-rt"
  })
}

# Default route kaydi ile tum trafigi internet gateway e yonlendirir.
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

# Her public subneti ilgili route table ile eslestirir.
resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}
