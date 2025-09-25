terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.25"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "state_backend" {
  source                          = "../../modules/bootstrap/state_backend"
  project_id                      = var.project_id
  bucket_name                     = var.bucket_name
  bucket_location                 = var.bucket_location
  bucket_storage_class            = var.bucket_storage_class
  bucket_force_destroy            = var.bucket_force_destroy
  enable_versioning               = var.enable_versioning
  retention_period_days           = var.retention_period_days
  delete_redundant_versions_after = var.delete_redundant_versions_after
  state_prefix                    = var.state_prefix
  labels                          = var.labels
  log_bucket                      = var.log_bucket
  log_object_prefix               = var.log_object_prefix
  admin_principals                = var.admin_principals
  writer_principals               = var.writer_principals
  reader_principals               = var.reader_principals
}
