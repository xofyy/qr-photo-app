# Cikti Degerleri: platform/registry_secrets modulunden gelen bilgiler.

# Artifact Registry deposunun tam adini dondurur.
output "repository_name" {
  description = "Artifact Registry depo adi"
  value       = google_artifact_registry_repository.main.name
}

# Secret kayitlarina ait kimlik ve id listesi.
output "secret_ids" {
  description = "Secret Manager kayit listesi"
  value       = { for name, secret in google_secret_manager_secret.this : name => secret.id }
}

# Secret versiyonlarinin kimligini dondurur.
output "secret_version_ids" {
  description = "Secret version kimlikleri"
  value       = { for name, version in google_secret_manager_secret_version.this : name => version.name }
}

# K8s tarafinda kullanilacak referans listesini saglar.
output "secret_references" {
  description = "K8s icin secret referans yapisi"
  value       = local.secret_refs
}
