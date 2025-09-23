# Cikti Degerleri: workload/ec2_instance modulunden gelen bilgiler.

# Opsiyonel EC2 instance kimligini dondurur.
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.this.id
}

# Instance in private IP adresini saglar.
output "private_ip" {
  description = "Private IP address"
  value       = aws_instance.this.private_ip
}

# Instance in public IP adresini saglar.
output "public_ip" {
  description = "Public IP address"
  value       = aws_instance.this.public_ip
}

# Instance a bagli security group ID listesini dondurur.
output "security_group_ids" {
  description = "Security groups attached to the instance"
  value       = aws_instance.this.vpc_security_group_ids
}
