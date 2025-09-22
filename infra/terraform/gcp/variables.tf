# -----------------------------------------------------------------------------
# Değişken Tanımları (GCP)
# Her değişken için:
#   • Kullanım amacı
#   • Örnek değerler / seçenekler
#   • Zorunluluk durumu
# bilgileri açıklanmaktadır. Varsayılanı olan değişkenler isteğe bağlıdır.
# -----------------------------------------------------------------------------

# Zorunlu: Evet — Kaynakların oluşturulacağı GCP proje kimliği.
# Seçenekler: Konsolda gördüğünüz proje ID (örn. "my-gcp-project", "company-prod").
variable "project_id" {
  description = "GCP project ID where resources will be created"
  type        = string
}

# Zorunlu: Hayır — Cloud Run, Secret Manager ve Cloud Build gibi bölgesel servislerin çalışacağı bölge.
# Seçenekler: GCP bölge kodları (örn. "europe-west1", "us-central1").
variable "region" {
  description = "Primary region for regional resources"
  type        = string
  default     = "europe-west1"
}

# Zorunlu: Hayır — Artifact Registry deposunun konumu. Cloud Build aynı bölgede olmalı.
# Seçenekler: Artifact Registry destekli bölgeler (örn. "europe-west1", "us" çok bölgeli).
variable "artifact_registry_location" {
  description = "GCP region for Artifact Registry (must match region for Cloud Run builds)"
  type        = string
  default     = "europe-west1"
}

# Zorunlu: Hayır — Artifact Registry depo adı.
# Seçenekler: Küçük harf, sayı ve tire içerebilir (örn. "qr-photo-repo").
variable "artifact_registry_repository" {
  description = "Name of the Artifact Registry repository"
  type        = string
  default     = "qr-photo-repo"
}

# Zorunlu: Hayır — Terraform apply öncesi açılması gereken API listesi.
# Seçenekler: Listeyi genişletebilirsiniz (örn. "cloudresourcemanager.googleapis.com").
variable "required_apis" {
  description = "List of Google Cloud APIs that must be enabled"
  type        = list(string)
  default = [
    "artifactregistry.googleapis.com",
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "secretmanager.googleapis.com"
  ]
}

# Zorunlu: Hayır — Cloud Run servisine verilecek isim.
# Seçenekler: DNS uyumlu karakterler (örn. "qr-photo-backend", "api-service").
variable "run_service_name" {
  description = "Name of the Cloud Run service"
  type        = string
  default     = "qr-photo-backend"
}

# Zorunlu: Hayır — Artifact Registry içindeki imaj adı.
# Seçenekler: Docker image repository isim formatı (örn. "qr-photo-backend").
variable "run_image_name" {
  description = "Container image name stored in Artifact Registry"
  type        = string
  default     = "qr-photo-backend"
}

# Zorunlu: Hayır — Terraform apply sırasında kullanılacak tag.
# Seçenekler: "latest", sürüm numarası ("v1.2.0"), veya commit SHA.
variable "run_image_tag" {
  description = "Container image tag to deploy when Terraform runs"
  type        = string
  default     = "latest"
}

# Zorunlu: Hayır — Artifact Registry dışında özel bir imaj referansı kullanmak için.
# Seçenekler: Tam Docker URL'si (örn. "us-docker.pkg.dev/proje/repo/image:tag", "gcr.io/..." ).
variable "run_container_image_override" {
  description = "Full container image reference to deploy (overrides computed Artifact Registry URL)"
  type        = string
  default     = null
}

# Zorunlu: Hayır — Container içinde dinlenen port.
# Seçenekler: HTTP servisiniz hangi portu kullanıyorsa (örn. 8080, 5000, 8000).
variable "run_container_port" {
  description = "Container port exposed by the service"
  type        = number
  default     = 8000
}

# Zorunlu: Hayır — Cloud Run CPU limiti.
# Seçenekler: "1000m" (1 vCPU), "2000m" (2 vCPU) gibi millicpu değerleri.
variable "run_container_cpu" {
  description = "CPU limit for the Cloud Run container (e.g. 1000m)"
  type        = string
  default     = "1000m"
}

# Zorunlu: Hayır — Cloud Run bellek limiti.
# Seçenekler: "512Mi", "1Gi" gibi Kubernetes uyumlu RAM değerleri.
variable "run_container_memory" {
  description = "Memory limit for the Cloud Run container"
  type        = string
  default     = "512Mi"
}

# Zorunlu: Hayır — Minimum Cloud Run instance sayısı.
# Seçenekler: 0 (cold start kabul), 1+ (her zaman sıcak instance).
variable "run_min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

# Zorunlu: Hayır — Trafik artışında çıkılabilecek üst sınır.
# Seçenekler: 1-1000 arasında ihtiyaca göre.
variable "run_max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 3
}

# Zorunlu: Hayır — HTTP isteği başına zaman aşımı.
# Seçenekler: 1–3600 saniye arası (Cloud Run limiti).
variable "run_timeout_seconds" {
  description = "Timeout for incoming requests"
  type        = number
  default     = 60
}

# Zorunlu: Hayır — Tek instance'ın aynı anda bakacağı istek sayısı.
# Seçenekler: 1–1000 arası; 0 değeri Cloud Run varsayılanını kullanır.
variable "run_max_request_concurrency" {
  description = "Maximum requests handled per Cloud Run instance"
  type        = number
  default     = 80
}

# Zorunlu: Hayır — Session affinity (sticky sessions) gerekip gerekmediği.
# Seçenekler: `false` (varsayılan, round-robin) veya `true` (Cloud Run session cookie).
variable "run_session_affinity" {
  description = "Whether to enable session affinity on Cloud Run"
  type        = bool
  default     = false
}

# Zorunlu: Hayır — Terraform state'te saklanmasında sorun olmayan ortam değişkenleri.
# Seçenekler: KEY => VALUE map'i (örn. { "ENV" = "prod" }).
variable "run_service_env_vars" {
  description = "Plaintext environment variables for the Cloud Run service"
  type        = map(string)
  default     = {}
}

# Zorunlu: Duruma göre — Secret Manager'a yazılacak hassas değerler.
# Seçenekler: KEY => VALUE map'i; KEY sekmesi Cloud Run env adına dönüşür.
variable "run_service_secret_values" {
  description = "Secrets to create in Secret Manager and mount into the service (key = secret name, value = secret data)"
  type        = map(string)
  default     = {}
}

# Zorunlu: Hayır — Cloud Run'a hangi ağlardan erişileceği.
# Seçenekler: "INGRESS_TRAFFIC_ALL", "INGRESS_TRAFFIC_INTERNAL_ONLY", "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER".
variable "cloud_run_ingress" {
  description = "Ingress setting for Cloud Run (e.g. INGRESS_TRAFFIC_INTERNAL_ONLY, INGRESS_TRAFFIC_ALL)"
  type        = string
  default     = "INGRESS_TRAFFIC_ALL"
}

# Zorunlu: Hayır — Cloud Run servisini çağırabilecek IAM üyeleri.
# Seçenekler: `allUsers` (public), `allAuthenticatedUsers`, `serviceAccount:...`, `group:...` vb.
variable "cloud_run_invoker_members" {
  description = "Members allowed to invoke the Cloud Run service"
  type        = list(string)
  default     = ["allUsers"]
}

# Zorunlu: Hayır — Cloud Build tetikleyicisinin görünen adı.
# Seçenekler: Özgür metin (örn. "qr-photo-build").
variable "cloud_build_trigger_name" {
  description = "Display name for the Cloud Build trigger"
  type        = string
  default     = "qr-photo-build"
}

# Zorunlu: Hayır — Tetikleyiciyi geçici olarak devre dışı bırakmak için.
# Seçenekler: `true` (tetikleyici çalışmaz) veya `false`.
variable "cloud_build_trigger_disabled" {
  description = "Disable the Cloud Build trigger without deleting it"
  type        = bool
  default     = false
}

# Zorunlu: Hayır — Cloud Build YAML dosyasının repo içindeki yolu.
# Seçenekler: Varsayılan dosya veya alternatif pipeline yolu (örn. "cloudbuild.yaml").
variable "cloud_build_filename" {
  description = "Path to the Cloud Build configuration file relative to the repository root"
  type        = string
  default     = "infra/terraform/gcp/cloudbuild.yaml"
}

# Zorunlu: Hayır — Cloud Build'de ek substitution değişkenleri göndermek için.
# Seçenekler: Örn. { "_FRONTEND_IMAGE" = "qr-photo-frontend" }.
variable "cloud_build_substitutions" {
  description = "Additional substitution variables for Cloud Build"
  type        = map(string)
  default     = {}
}

# Zorunlu: Evet — GitHub organizasyonu veya kullanıcı adı.
# Seçenekler: GitHub'da görünen kullanıcı/organizasyon (örn. "my-org", "username").
variable "github_owner" {
  description = "GitHub organisation or user that owns the repository"
  type        = string
}

# Zorunlu: Evet — Referans verilen repository adı.
# Seçenekler: GitHub repo ismi (örn. "qr-photo-app").
variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

# Zorunlu: Hayır — Cloud Build tetikleyicisinin izleyeceği branch regex'i.
# Seçenekler: `^main$`, `^release/.*$`, `.*` vb. Regex formatında olmalıdır.
variable "github_branch" {
  description = "Git branch that triggers Cloud Build"
  type        = string
  default     = "^main$"
}
