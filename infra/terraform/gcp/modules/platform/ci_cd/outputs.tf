# Cikti Degerleri: platform/ci_cd modulunden gelen bilgiler.

# Olusan Cloud Build tetikleyici kimligini saglar.
output "trigger_id" {
  description = "Cloud Build tetikleyici kimligi"
  value       = google_cloudbuild_trigger.github.id
}

# Olusan tetikleyici adini dondurur.
output "trigger_name" {
  description = "Cloud Build tetikleyici adi"
  value       = google_cloudbuild_trigger.github.name
}
