locals {
  sanitized_prefix  = lower(replace(replace(trimspace(var.state_prefix), " ", "-"), "_", "-"))
  trimmed_prefix    = trim(local.sanitized_prefix, "/-")
  effective_prefix  = length(local.trimmed_prefix) > 0 ? local.trimmed_prefix : "terraform/state"
  retention_enabled = var.retention_period_days != null && var.retention_period_days > 0
}

resource "google_storage_bucket" "state" {
  project       = var.project_id
  name          = var.bucket_name
  location      = var.bucket_location
  storage_class = var.bucket_storage_class
  force_destroy = var.bucket_force_destroy

  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  labels                      = var.labels

  versioning {
    enabled = var.enable_versioning
  }

  dynamic "retention_policy" {
    for_each = local.retention_enabled ? [1] : []
    content {
      retention_period = var.retention_period_days * 86400
    }
  }

  dynamic "logging" {
    for_each = var.log_bucket != null ? [1] : []
    content {
      log_bucket        = var.log_bucket
      log_object_prefix = coalesce(var.log_object_prefix, local.effective_prefix)
    }
  }

  lifecycle_rule {
    condition {
      num_newer_versions = var.delete_redundant_versions_after
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_storage_bucket_iam_binding" "admins" {
  count  = length(var.admin_principals) > 0 ? 1 : 0
  bucket = google_storage_bucket.state.name
  role   = "roles/storage.admin"
  members = [
    for principal in sort(var.admin_principals) : principal
  ]
}

resource "google_storage_bucket_iam_binding" "writers" {
  count  = length(var.writer_principals) > 0 ? 1 : 0
  bucket = google_storage_bucket.state.name
  role   = "roles/storage.objectAdmin"
  members = [
    for principal in sort(var.writer_principals) : principal
  ]
}

resource "google_storage_bucket_iam_binding" "readers" {
  count  = length(var.reader_principals) > 0 ? 1 : 0
  bucket = google_storage_bucket.state.name
  role   = "roles/storage.objectViewer"
  members = [
    for principal in sort(var.reader_principals) : principal
  ]
}

output "bucket_name" {
  description = "Olusturulan Terraform state bucket adi"
  value       = google_storage_bucket.state.name
}

output "bucket_location" {
  description = "Bucket'in fiziksel lokasyonu"
  value       = google_storage_bucket.state.location
}

output "state_prefix" {
  description = "Terraform backend prefix degeri"
  value       = local.effective_prefix
}

output "backend_config" {
  description = "`terraform init` icin backend konfigrasyonu"
  value = {
    bucket = google_storage_bucket.state.name
    prefix = local.effective_prefix
  }
}
