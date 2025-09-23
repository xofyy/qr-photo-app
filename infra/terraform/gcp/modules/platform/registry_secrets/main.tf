# Platform registry_secrets modulunde Artifact Registry ve Secret Manager kaynaklari olusur.

# Container imajlari icin Artifact Registry deposu olusturulur.
resource "google_artifact_registry_repository" "main" {
  location      = var.location
  repository_id = var.repository_id
  description   = "Uygulama container imajlari"
  format        = "DOCKER"
  project       = var.project_id

  labels = var.labels
}

# Secret Manager icinde gizli degerler icin secret kaydi acilir.
resource "google_secret_manager_secret" "this" {
  for_each = var.secrets

  project   = var.project_id
  secret_id = "${var.name_prefix}-${each.key}"

  replication {
    auto {}
  }

  labels = var.labels
}

# Gizli degerlerin versiyon bilgileri eklenir.
resource "google_secret_manager_secret_version" "this" {
  for_each = var.secrets

  secret      = google_secret_manager_secret.this[each.key].id
  secret_data = each.value
}

# K8s icin hazirlanan secret referans listesi.
locals {
  secret_refs = [
    for name, secret in google_secret_manager_secret.this : {
      name = name
      id   = secret.id
    }
  ]
}
