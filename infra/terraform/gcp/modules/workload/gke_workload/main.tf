terraform {
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.26"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.25"
    }
  }
}

# Get Google Cloud client configuration
data "google_client_config" "default" {}
# Workload gke_workload modulunde Kubernetes uzerinde uygulama nesneleri olusturulur.

# Namespace olusturarak kaynaklari izole eder.
resource "kubernetes_namespace" "this" {
  metadata {
    name   = var.namespace
    labels = var.labels
  }

  timeouts {
    delete = "20m"
  }
}

# Kubernetes secret olusturarak environment degiskenlerini saklar.
resource "kubernetes_secret" "env" {
  metadata {
    name      = "${var.name_prefix}-env"
    namespace = kubernetes_namespace.this.metadata[0].name
    labels    = var.labels
  }

  type = "Opaque"
  data = var.secret_environment_variables
}

# Deployment ile uygulama podlarini konfigure eder.
resource "kubernetes_deployment" "this" {
  metadata {
    name      = "app-deployment"
    namespace = kubernetes_namespace.this.metadata[0].name
    labels    = var.labels
  }

  spec {
    replicas = var.replicas

    selector {
      match_labels = {
        app = var.name_prefix
      }
    }

    template {
      metadata {
        labels = merge(var.labels, {
          app = var.name_prefix
        })
      }

      spec {
        container {
          name  = "app"
          image = var.image

          port {
            container_port = var.container_port
          }

          resources {
            limits   = var.resource_limits
            requests = var.resource_requests
          }

          # Normal environment variables
          dynamic "env" {
            for_each = var.environment_variables
            content {
              name  = env.value.name
              value = env.value.value
            }
          }

          # Secret'tan environment variables
          env_from {
            secret_ref {
              name = kubernetes_secret.env.metadata[0].name
            }
          }
        }
      }
    }
  }
}

# Servis ile load balancer IP sine yonlendirme yapar.
resource "kubernetes_service" "this" {
  metadata {
    name      = "${var.name_prefix}-service"
    namespace = kubernetes_namespace.this.metadata[0].name
    labels = merge(var.labels, {
      app = var.name_prefix
    })
  }

  spec {
    selector = {
      app = var.name_prefix
    }

    port {
      port        = var.service_port
      target_port = var.container_port
    }

    type = var.service_type
  }
}

# Otomatik yatay pod olceklendirmesini ayarlar.
resource "kubernetes_horizontal_pod_autoscaler_v2" "this" {
  metadata {
    name      = "app-hpa"
    namespace = kubernetes_namespace.this.metadata[0].name
    labels    = var.labels
  }

  spec {
    min_replicas = var.hpa_min_replicas
    max_replicas = var.hpa_max_replicas

    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.this.metadata[0].name
    }

    metric {
      type = "Resource"

      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = var.hpa_cpu_target
        }
      }
    }
  }
}

