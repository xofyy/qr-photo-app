# Cikti Degerleri: foundation/network modulunden saglanan bilgiler.

# Olusacak VPC kimligini disari aktarir.
output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.this.id
}

# VPC ARN degerini paylasir.
output "vpc_arn" {
  description = "ARN of the created VPC"
  value       = aws_vpc.this.arn
}

# Public subnet ID listesini verir.
output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = [for subnet in aws_subnet.public : subnet.id]
}

# Public subnetlere ait ayrintili bilgiyi (id, az, cidr) dondurur.
output "public_subnets" {
  description = "Detailed map of public subnets including AZ and CIDR"
  value = {
    for key, subnet in aws_subnet.public :
    key => {
      id   = subnet.id
      az   = subnet.availability_zone
      cidr = subnet.cidr_block
    }
  }
}

# Public route table kimligini dondurur.
output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

# Internet gateway kimligini saglar.
output "internet_gateway_id" {
  description = "ID of the internet gateway"
  value       = aws_internet_gateway.this.id
}
