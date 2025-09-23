# Platform ci_cd modulunde GitHub tetikleyicili Cloud Build kaynagi olusturulur.

resource "google_cloudbuild_trigger" "github" {
  name     = "-trigger"
  project  = var.project_id
  location = var.location

  description = "GitHub push ile otomatik build"
  filename    = var.build_filename

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch = var.github_branch
    }
  }

  included_files = var.included_files
  ignored_files  = var.ignored_files

  substitutions = var.substitutions

  service_account = var.service_account

  tags = ["terraform", "cloud-build", var.environment]
}
