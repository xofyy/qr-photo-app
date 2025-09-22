# -----------------------------------------------------------------------------
# Root Terraform configuration for QR Photo on Google Cloud Platform.
# Bu dosya Cloud Run tabanli konteyner dagitimi icin gerekli tum GCP kaynaklarini
# (API aktivasyonlari, Artifact Registry, Secret Manager entegrasyonu, Cloud Run
# servisi ve Cloud Build tetikleyicisi) tanimlar. Yorumlar her kaynagin hangi
# ayarlari barindirdigini ve farkli ortamlara gore nasil uyarlanabilecegini aciklar.
# -----------------------------------------------------------------------------
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.30"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.30"
    }
  }
}

# provider "google": GA (genel kullanima acik) kaynaklar icin temel baglanti.
# project ve region degerleri terraform.tfvars icinden gelir; multi-region
# senaryolarinda farkli alias kullanarak ek provider tanimlayabilirsiniz.
provider "google" {
  project = var.project_id
  region  = var.region
}

# provider "google-beta": Cloud Run v2 gibi yalnizca beta API ile erisilebilen
# kaynaklari olusturmak icin ayni proje/bolge ayarlariyla ayrica tanimlandi.
provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Proje numarasina ihtiyac duyan kaynaklar (Cloud Build default SA gibi) icin
# data kaynagi. project_id degiskeni degistiginde otomatik uyarlanir.
data "google_project" "current" {
  project_id = var.project_id
}

# local degiskenler tekrar eden stringleri merkezilestirir. Burada build sirasinda
# kullanilan Cloud Build servis hesabini ve varsayilan container imaj referansini
# hesapliyoruz. Imaj yolu Artifact Registry bolgesi ve repository adina gore uyar.
locals {
  cloud_build_service_account = "${data.google_project.current.number}@cloudbuild.gserviceaccount.com"
  default_image               = "${var.artifact_registry_location}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.app.repository_id}/${var.run_image_name}:${var.run_image_tag}"
}

# Gerekli Google API'larini acmadan Cloud Run/Artifact Registry vb kaynaklar yaratilamaz.
# required_apis listesine yeni servisler (or. cloudresourcemanager.googleapis.com) ekleyebilirsiniz.
resource "google_project_service" "required" {
  for_each = toset(var.required_apis)

  project = var.project_id
  service = each.key
}

# Docker imajlarini barindiran Artifact Registry deposu. location degeri bolgesel
# veya cok bolgeli (multi-region) olabilir. format=DOCKER disinda (OCI gibi)
# formatlara ihtiyac varsa degistirilebilir.
resource "google_artifact_registry_repository" "app" {
  location      = var.artifact_registry_location
  repository_id = var.artifact_registry_repository
  format        = "DOCKER"
  description   = "Container images for the QR Photo application"
}

# Cloud Run calisma zamani icin ayrilmis servis hesabi. account_id olusturulurken
# Cloud Run servis adindaki alt tireler tireye donusturulur (IAM kisitlamalari).
resource "google_service_account" "cloud_run" {
  account_id   = replace("${var.run_service_name}-sa", "_", "-")
  display_name = "Cloud Run runtime for ${var.run_service_name}"
}

# Cloud Build pipeline'inin Artifact Registry'ye push ve Cloud Run'a deploy yapabilmesi
# icin gereken rol atamalari. Gerekiyorsa burada ek IAM rollerini listeye ekleyin.
resource "google_project_iam_member" "cloud_build_roles" {
  for_each = {
    run_admin       = "roles/run.admin"
    artifact_writer = "roles/artifactregistry.writer"
    sa_user         = "roles/iam.serviceAccountUser"
  }

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${locals.cloud_build_service_account}"
}

# Secret Manager'da Cloud Run ortamina aktarilacak gizli degerlerin tanimi.
# replication otomatik secenegi cok bolgeli dagitim icin ideal; spesifik bolge
# replikasyonu gerekiyorsa ilgili bloklari burada degistirin.
resource "google_secret_manager_secret" "runtime" {
  for_each = var.run_service_secret_values

  secret_id = each.key
  replication {
    auto {}
  }
}

# Her secret icin olusturulan ilk versiyon. Uzun vadede secret rotasyonu yapmak
# isterseniz Terraform disinda yeni versiyonlar ekleyebilir ve burada referansi
# "latest" olarak tutabilirsiniz.
resource "google_secret_manager_secret_version" "runtime" {
  for_each = var.run_service_secret_values

  secret      = google_secret_manager_secret.runtime[each.key].name
  secret_data = each.value
}

# Cloud Run servis hesabinin Secret Manager icerigini okuma yetkisi. Yeni secret
# eklediginizde Terraform bu listeyi otomatik genisletir.
resource "google_secret_manager_secret_iam_member" "runtime" {
  for_each = google_secret_manager_secret.runtime

  secret_id = each.value.name
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Run v2 servisi uygulanacak konteyner, cevre degiskenleri ve olcekleme
# politikalarini tanimlar. provider olarak google-beta kullanilir cunku v2 API
# henuz beta kanalinda.
resource "google_cloud_run_v2_service" "service" {
  provider = google-beta

  name     = var.run_service_name
  location = var.region
  ingress  = var.cloud_run_ingress  # INGRESS_TRAFFIC_ALL / INTERNAL_ONLY gibi opsiyonlar icin variables.tf'a bakiniz.

  template {
    service_account = google_service_account.cloud_run.email

    containers {
      name  = var.run_service_name
      image = coalesce(var.run_container_image_override, locals.default_image)  # Harici registry'den deploy etmek icin override kullanin.

      ports {
        container_port = var.run_container_port
      }

      # Duz metin ortam degiskenleri (kritik olmayan degerler) run_service_env_vars map'inden gelir.
      dynamic "env" {
        for_each = var.run_service_env_vars

        content {
          name  = env.key
          value = env.value
        }
      }

      # Gizli degerler Secret Manager'dan cekilir. Her anahtar hem secret adi
      # hem de Cloud Run ortam degiskeni adi olarak kullanilir.
      dynamic "env" {
        for_each = var.run_service_secret_values

        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.runtime[env.key].name
              version = "latest"
            }
          }
        }
      }

      # CPU ve bellek limitleri autoscaling davranisini belirler. Gerektiginde
      # variables.tf uzerinden degistirin (ornegin 2 vCPU icin "2000m").
      resources {
        limits = {
          cpu    = var.run_container_cpu
          memory = var.run_container_memory
        }
      }
    }

    # Minimum ve maksimum instance sayilari soguk baslatma ve maliyet arasinda
    # denge kurmanizi saglar. 0 -> tamamen serverless, 1+ -> sicak instance.
    scaling {
      min_instance_count = var.run_min_instances
      max_instance_count = var.run_max_instances
    }

    # Timeout, session affinity ve concurrency ayarlari yine variables.tf uzerinden
    # override edilebilir; burada sadece degisken degerleri kullaniliyor.
    timeout                        = "${var.run_timeout_seconds}s"
    session_affinity               = var.run_session_affinity
    max_instance_request_concurrency = var.run_max_request_concurrency
  }

  # En son versiyona tum trafigi yonlendiriyoruz; canary ihtiyaci varsa ikinci
  # bir traffic blogu ekleyerek yuzdeleri dagitabilirsiniz.
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  # Cloud Build her deployda yeni image digesti push eder. ignore_changes ile
  # Terraform planlarinin surekli fark gostermesini engelliyoruz.
  lifecycle {
    ignore_changes = [template[0].containers[0].image]
  }
}

# Cloud Run invoke yetkisi. Public erisim icin `allUsers`; iceriden cagri icin
# belirli servis hesaplari veya VPC Connector ile sinirlandirilabilir.
resource "google_cloud_run_v2_service_iam_binding" "invoker" {
  provider = google-beta

  name     = google_cloud_run_v2_service.service.name
  location = var.region
  role     = "roles/run.invoker"
  members  = var.cloud_run_invoker_members
}

# Cloud Build tetikleyicisi GitHub uzerindeki branch push olaylarini dinler.
# Gerekirse bitbucket/trigger tipi icin diger bloklari (trigger_template vb.)
# kullanabilirsiniz. substitutions haritasinda pipeline parametrelerini yonetin.
resource "google_cloudbuild_trigger" "deploy" {
  name        = var.cloud_build_trigger_name
  description = "Build and deploy ${var.run_service_name} to Cloud Run"
  disabled    = var.cloud_build_trigger_disabled
  filename    = var.cloud_build_filename

  github {
    owner = var.github_owner
    name  = var.github_repo
    push {
      branch       = var.github_branch
      invert_regex = false
    }
  }

  substitutions = merge({
    "_REGION"      = var.region,
    "_REPOSITORY"  = google_artifact_registry_repository.app.repository_id,
    "_SERVICE"     = var.run_service_name,
    "_IMAGE_NAME"  = var.run_image_name
  }, var.cloud_build_substitutions)
}

# Cloud Build pipeline'inin Cloud Run servis hesabini impersonate etmesi gerekir;
# aksi halde deploy adimi IAM hatasi ile sonlanir. Ek servis hesaplari icin
# ayni iliskiyi tekrar tanimlayabilirsiniz.
resource "google_service_account_iam_member" "cloud_build_act_as" {
  service_account_id = google_service_account.cloud_run.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${locals.cloud_build_service_account}"
}

# -----------------------------------------------------------------------------
# Cikti degerleri: uygulama URL'si ve tekrar kullanilacak kayitlar.
# Bu degerleri terraform output komutu ile gorup CI/CD pipeline'larinda kullanabilirsiniz.
# -----------------------------------------------------------------------------
output "cloud_run_uri" {
  description = "Public URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.service.uri
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository resource"
  value       = google_artifact_registry_repository.app.id
}

output "cloud_run_service_account" {
  description = "Service account used by Cloud Run runtime"
  value       = google_service_account.cloud_run.email
}

output "cloud_build_trigger_id" {
  description = "Identifier of the Cloud Build trigger"
  value       = google_cloudbuild_trigger.deploy.id
}
