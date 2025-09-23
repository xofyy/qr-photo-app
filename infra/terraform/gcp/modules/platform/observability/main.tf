# Platform observability modulunde Cloud Logging ve Monitoring konfigurasyonu yapilir.

# K8s uygulama loglarindan hata sayisini cikaracak metrik.
resource "google_logging_metric" "error_count" {
  name        = "${var.name_prefix}-error-count"
  project     = var.project_id
  description = "Uygulama loglarindaki hata sayisini toplar"

  filter = "resource.type=\"k8s_container\" AND severity>=ERROR AND resource.labels.namespace_name=\"${var.namespace}\""

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
  }

  label_extractors = {
    pod = "EXTRACT(resource.labels.pod_name)"
  }
}

# CPU kullanimini izleyen Monitoring alarmi.
resource "google_monitoring_alert_policy" "cpu" {
  project      = var.project_id
  display_name = "${var.name_prefix}-cpu-alert"
  combiner     = "OR"

  conditions {
    display_name = "CPU Utilization"

    condition_threshold {
      filter          = "metric.type=\"kubernetes.io/node/cpu/core_usage_time\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.cpu_threshold / 100

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_DELTA"
      }
    }
  }

  notification_channels = var.notification_channels
  user_labels           = var.labels
}
