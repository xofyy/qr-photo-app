# Degiskenler: workload/ec2_instance modulunde kullanilan girdiler.

# EC2 kaynaklarini adlandirmak icin prefix degerini belirler.
variable "name_prefix" {
  description = "EC2 kaynaklari icin kullanilan prefix"
  type        = string
}

# Olusacak tum kaynaklar icin tag haritasini sunar.
variable "tags" {
  description = "Olusacak kaynaklar icin tag haritasi"
  type        = map(string)
  default     = {}
}

# Instance in baslatilacagi subnet ID degerini tanimlar.
variable "subnet_id" {
  description = "Instance in baslatilacagi subnet ID"
  type        = string
}

# Kullanilacak AMI kimligini belirtir.
variable "ami_id" {
  description = "Instance icin kullanilacak AMI kimligi"
  type        = string
}

# EC2 instance tipini belirler.
variable "instance_type" {
  description = "EC2 instance tipi"
  type        = string
  default     = "t3.micro"
}

# Ilk ag arabirimine public IP atanip atanmayacagini belirler.
variable "assign_public_ip" {
  description = "Public IP atanma durumu"
  type        = bool
  default     = true
}

# Opsiyonel IAM instance profile adini saglar.
variable "iam_instance_profile" {
  description = "Opsiyonel IAM instance profile adi"
  type        = string
  default     = null
}

# SSH erisimi icin opsiyonel key pair adini belirtir.
variable "key_name" {
  description = "Opsiyonel SSH key pair adi"
  type        = string
  default     = null
}

# Instance bootstrap icin user data betigini tanimlar.
variable "user_data" {
  description = "Opsiyonel user data betigi"
  type        = string
  default     = null
}

# Instance a eklenecek mevcut security group ID listesi.
variable "security_group_ids" {
  description = "Instance a baglanacak mevcut security group ID listesi"
  type        = list(string)
  default     = []
}

# Yonetilen yeni bir security group olusturulup olusturulmayacagini belirler.
variable "create_security_group" {
  description = "Yonetilen SG olusturma secenegi"
  type        = bool
  default     = true
}

# Olusacak security group icin ingress kurallarini tanimlar.
variable "security_group_ingress" {
  description = "Yonetilen SG icin ingress kurallari"
  type = list(object({
    description      = optional(string, null)
    from_port        = number
    to_port          = number
    protocol         = string
    cidr_blocks      = optional(list(string), [])
    ipv6_cidr_blocks = optional(list(string), [])
    security_groups  = optional(list(string), [])
  }))
  default = []
}

# Root EBS disk boyutunu GiB olarak ayarlar.
variable "root_volume_size" {
  description = "Root EBS disk boyutu (GiB)"
  type        = number
  default     = 20
}

# Root EBS disk tipini belirler.
variable "root_volume_type" {
  description = "Root EBS disk tipi"
  type        = string
  default     = "gp3"
}
