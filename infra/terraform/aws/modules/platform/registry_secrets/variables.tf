# Degiskenler: platform/registry_secrets modulunde kullanilan girdiler.

# Olusacak registry ve secret kaynaklari icin prefix belirler.
variable "name_prefix" {
  description = "Registry ve secret kaynaklari icin kullanilan prefix"
  type        = string
}

# Tum kaynaklara uygulanacak tag haritasini saglar.
variable "tags" {
  description = "Olusturulan kaynaklar icin tag haritasi"
  type        = map(string)
  default     = {}
}

# Secrets Manager icine eklenecek anahtar deger mapini tutar.
variable "service_secrets" {
  description = "Secrets Manager icine yazilacak gizli degerler mapi"
  type        = map(string)
  default     = {}
}

# ECR imaj etiketlerinin degistirilebilir olup olmayacagini belirler.
variable "image_tag_mutability" {
  description = "ECR imaj tag mutability ayari"
  type        = string
  default     = "MUTABLE"
}

# ECR push islemlerinde guvenlik taramasini acip kapatir.
variable "enable_image_scanning" {
  description = "ECR push sirasinda guvenlik taramasini etkinlestirir"
  type        = bool
  default     = true
}
