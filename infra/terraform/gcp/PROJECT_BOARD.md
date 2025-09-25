# Terraform GCP Iyilestirme Proje Tahtasi

## Milestone: Faz 1 – Temel Sertlestirme (Hedef: 2 Hafta)

| Issue ID | Baslik | Tanım | Acceptance Criteria | Durum |
| --- | --- | --- | --- | --- |
| TF-01 | Giris Degeri Dogrulamalari | Kapsamdaki tum modul ve kok degiskenleri icin validation ve sane default guvenlikleri ekle. | <ul><li>Tum kritik degiskenler icin `validation` bloklari veya tip kisitlari eklendi.</li><li>`terraform validate` calistiginda hatali inputlar icin acik mesajlar donuyor.</li><li>`terraform.tfvars.example` guncel validation kosullariyla uyumlu.</li></ul> | ✅ Tamamlandi |
| TF-02 | Remote State Backend | GCS bucket, IAM ve `backend` konfigurasyonunu modulize ederek remote state'i aktif et. | <ul><li>Terraform backend konfigrasyonu versiyonlama + kilitleme ile calisiyor.</li><li>State bucket'i ve IAM rolleri Terraform ile olusuyor.</li><li>Dokumantasyonda apply adimlari guncellendi.</li></ul> | ✅ Tamamlandi |
| TF-03 | Ortam Bazli Konfigurasyon | Ortam tfvars dosyalari ve pipeline matrix'i ile dev/stage/prod ayristirmasi sagla. | <ul><li>Her ortam icin ayri tfvars dosyalari mevcut.</li><li>CI pipeline'inda ortam bazli plan/adimlar tanimli.</li><li>README ortamları nasil yonetecegini acikliyor.</li></ul> | ✅ Tamamlandi |

## Milestone: Faz 2 – Guvenlik ve Gozlemlenebilirlik (Hedef: 2 Hafta)

| Issue ID | Baslik | Tanım | Acceptance Criteria |
| --- | --- | --- | --- |
| TF-04 | Modul Dokumantasyonu | Her modul icin README/terraform-docs entegrasyonu ekle. | <ul><li>Modul klasorlerinde giris/cikti tablolari olustu.</li><li>Dokumantasyon pipeline'i otomatik calisiyor.</li><li>README'ler versiyon kontrolunde.</li></ul> |
| TF-05 | Terraform CI Pipeline'i | fmt/validate/tflint/checkov calistiran CI workflow'u olustur. | <ul><li>PR acildiginda pipeline calisiyor.</li><li>Tum kontroller basarisiz olursa PR bloklaniyor.</li><li>Makefile/komutlarla lokal calisma destekleniyor.</li></ul> |
| TF-06 | IAM Least Privilege | Terraform ve Cloud Build SA'lari icin kisitli IAM rolleri tanimla. | <ul><li>Gereken roller listelenip Terraform ile atandi.</li><li>Gereksiz owner/editor yetkileri kaldirildi.</li><li>Access review dokumani guncel.</li></ul> |
| TF-07 | Network Sertlestirme | Firewall kurallarini parametrize ederek micro-segmentation sagla. | <ul><li>Ingress/egress kurallar modul input'u haline getirildi.</li><li>Default olarak yalnizca gerekli trafik acik.</li><li>Firewall loglari etkin ve analiz edilebilir.</li></ul> |
| TF-08 | Secret ve KMS Entegrasyonu | Secret Manager icin rotation ve KMS sifreleme politikasi tanimla. | <ul><li>KMS key olusturuldu ve secret'lar CMK ile sifreleniyor.</li><li>Rotation period'lari ayarlanmis.</li><li>Dokumantasyon uygulama tarafinin secret'a erisimini acikliyor.</li></ul> |
| TF-09 | Alerting Setleri | Uygulama ve cluster icin ek metric/alert politikalarini modulize et. | <ul><li>Latency, error rate ve HPA event alert'leri eklendi.</li><li>Notification channel parametreleri dinamize edildi.</li><li>Runbook referanslari README'de mevcut.</li></ul> |
| TF-10 | Log Metric Testleri | Log bazli metric'ler icin test pipeline'i ekle. | <ul><li>CI pipeline'i log metric konfiglerini syntax/permissions acisindan test ediyor.</li><li>Hatalar acik sekilde raporlanıyor.</li><li>Manual test adimlari dokumante edildi.</li></ul> |

## Milestone: Faz 3 – Optimizasyon ve Dayaniklilik (Hedef: 2 Hafta)

| Issue ID | Baslik | Tanım | Acceptance Criteria |
| --- | --- | --- | --- |
| TF-11 | DR & Backup Stratejisi | GKE yedekleme, Artifact Registry replikasyonu ve restore runbook'u ekle. | <ul><li>GKE backup planlari Terraform ile olustu.</li><li>Artifact Registry co-region replikasyon aktif.</li><li>DR runbook'u repo'da bulunuyor.</li></ul> |
| TF-12 | Maliyet Raporlama | Billing BigQuery export + Looker Studio template ekle. | <ul><li>Billing export dataset'i Terraform ile olustu.</li><li>Looker Studio linki/dosyasi dokumante.</li><li>Masraf raporu pipeline'a entegre.</li></ul> |
| TF-13 | Autoscaling Optimizasyonu | HPA/cluster release politikalarini SLO tabanli hale getir. | <ul><li>HPA hedefleri SLO input'una gore hesaplanıyor.</li><li>Release channel guncelleme proseduru belgeli.</li><li>Performans metrikleri izlenebilir.</li></ul> |
| TF-14 | Infracost Entegrasyonu | PR bazli maliyet raporu saglayan Infracost kurulumu. | <ul><li>CI pipeline'i Infracost raporu uretip PR'a yorum atiyor.</li><li>Threshold asimlarinda pipeline uyari veriyor.</li><li>Takip icin maliyet dashboard'u guncel.</li></ul> |

