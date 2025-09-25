output "bucket_name" {
  value       = module.state_backend.bucket_name
  description = "Olusturulan Terraform state bucket adi"
}

output "state_prefix" {
  value       = module.state_backend.state_prefix
  description = "Terraform backend prefix"
}

output "backend_config" {
  value       = module.state_backend.backend_config
  description = "terraform init icin bucket/prefix degerleri"
}
