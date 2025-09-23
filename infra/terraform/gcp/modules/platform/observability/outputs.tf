# Cikti Degerleri: platform/observability modulunden alinacak bilgiler.

# Olusturulan log metrik adini saglar.
output "log_metric_name" {
  description = "Log metrik adi"
  value       = google_logging_metric.error_count.name
}

# CPU alarm politikasinin id degerini dondurur.
output "cpu_alert_id" {
  description = "CPU alarm politika kimligi"
  value       = google_monitoring_alert_policy.cpu.name
}
