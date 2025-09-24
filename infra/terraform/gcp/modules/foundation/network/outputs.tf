# Cikti Degerleri: foundation/network modulunden saglanan bilgiler.

# VPC kimligini disari aktarir.
output "network_id" {
  description = "VPC kaynak kimligi"
  value       = google_compute_network.main.id
}

# Subnet kimligini saglar.
output "subnet_id" {
  description = "Public subnet kimligi"
  value       = google_compute_subnetwork.public.id
}

# Podlar icin tanimlanan ikinci IP araliginin adi.
output "pods_secondary_range" {
  description = "Pod IP ikincil aralik adi"
  value       = google_compute_subnetwork.public.secondary_ip_range[0].range_name
}

# Servisler icin tanimlanan ikinci IP araliginin adi.
output "services_secondary_range" {
  description = "Servis IP ikincil aralik adi"
  value       = google_compute_subnetwork.public.secondary_ip_range[1].range_name
}

# Cloud NAT kaynagini dondurur.
output "nat_name" {
  description = "Cloud NAT adi"
  value       = google_compute_router_nat.main.name
}

# Subnetin ana CIDR blogu.
output "subnet_cidr_range" {
  description = "Subnet icin ana CIDR"
  value       = var.subnet_cidr_range
}
