resource "google_cloudbuild_trigger" "github" {
  name     = "${var.name_prefix}-trigger"
  project  = var.project_id
  location = var.location

  description = "GitHub push ile otomatik build"
  filename    = var.build_filename

  # Eski github formatını kaldırın
  # github {
  #   owner = var.github_owner
  #   name  = var.github_repo
  #   push {
  #     branch = var.github_branch
  #   }
  # }

  # Yeni repository_event_config formatını kullanın
  repository_event_config {
    repository = "projects/${var.project_id}/locations/${var.location}/connections/qr-photo-connection/repositories/xofyy-qr-photo-app"
    push {
      branch = var.github_branch
    }
  }

  included_files = var.included_files
  ignored_files  = var.ignored_files
  substitutions = var.substitutions

  service_account = "projects/${var.project_id}/serviceAccounts/305617730642-compute@developer.gserviceaccount.com"

  tags = ["terraform", "cloud-build", var.environment]
}