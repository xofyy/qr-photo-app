# Terraform Infrastructure

Bu dizin QR Photo uygulamasi icin Google Cloud Platform (GCP) ve Amazon Web Services (AWS) altyapisini Terraform ile olusturmak uzere hazirlanmis dosyalari icerir. Klasorlerin icindeki yorumlar kaynaklarin neden ve nasil olusturuldugunu satir satir aciklar.

## Dizin Yapisi

- `gcp/`: Cloud Run, Artifact Registry, Secret Manager ve GitHub tabanli Cloud Build tetikleyicisi tanimlari.
- `aws/`: ECR, ECS Fargate, Application Load Balancer, VPC ve App AutoScaling kapsayan dagitim konfigurasyonu.

## Genel Kullanım Akisi

1. Terraform 1.6 veya ustu bir surume sahip oldugunuzdan emin olun (`terraform version`).
2. Her dizinde `terraform.tfvars.example` dosyasini `terraform.tfvars` olarak kopyalayip kendi ortam degerlerinizi yazin.
3. Kimlik dogrulama icin:
   - GCP: `gcloud auth application-default login` komutu veya servis hesabini `GOOGLE_APPLICATION_CREDENTIALS` ile belirtin.
   - AWS: `aws configure` ile profil olusturun veya `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` ortam degiskenlerini tanimlayin.
4. GCP icin `infra/terraform/gcp`, AWS icin `infra/terraform/aws` dizinine girerek sirasiyla `terraform init`, `terraform plan` ve `terraform apply` komutlarini calistirin.

## Zorunlu Değişkenler

Değerler terraform.tfvars dosyalarinda girilmelidir. Varsayilan olmayan degiskenler zorunludur; yorum satirlari olasi secenekleri listeler.

### GCP

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `project_id` | Kaynaklarin olusturulacagi GCP proje kimligi | `my-gcp-project` |
| `github_owner` | Cloud Build tetikleyicisinin baglanacagi GitHub org/kullanici | `my-org` |
| `github_repo` | Tetikleyici tarafindan izlenen repo adi | `qr-photo-app` |
| `run_service_secret_values`* | Secret Manager'a yazilacak sirlar (istenirse bos map) | `{ "qr-photo-secret-key" = "..." }` |

Yeni surumle birlikte GCP altyapisinda standart olarak VPC Flow Logs, Cloud NAT loglari ve firewall loglari acik gelir. GKE cluster
API erisimi artik 0.0.0.0/0 yerine varsayilan olarak IAP IP araligi (35.235.240.0/20) ile sinirlanmistir. Bu davranislari
degistirmek icin `infra/terraform/gcp/variables.tf` dosyasindaki asagidaki parametreleri override edebilirsiniz:

- `enable_vpc_flow_logs`, `vpc_flow_logs_sampling`, `vpc_flow_logs_aggregation_interval`, `vpc_flow_logs_metadata`
- `enable_nat_logging`, `nat_logging_filter`
- `enable_firewall_logging`, `firewall_logging_metadata`, `firewall_internal_source_ranges`
- `gke_master_authorized_networks`

### AWS

| Değişken | Açıklama | Örnek |
|----------|----------|-------|
| `project_name` | Kaynak isimlendirmesinde kullanilacak uygulama adi | `qr-photo` |
| `service_secrets`* | Secrets Manager'da saklanacak gizli degerler | `{ "django-secret-key" = "..." }` |

\* Secret map'lerini bos bırakabilirsiniz; ancak production ortaminda gercek degerler gereklidir. Opsiyonel degiskenlerin tumu icin `variables.tf` dosyalarindaki tablolaştırılmış yorumlar ne ise yaradigini, olasi deger araliklarini ve ne zaman override edilmesi gerektigini detaylandirir.

## Ek Notlar

- `variables.tf` dosyalari tum parametreler icin secenekleri ve ornekleri anlatir; terraform.tfvars.example dosyalari bunlari nasil dolduracaginiza dair sablon sunar.
- `cloudbuild.yaml` dosyasindaki yorumlar build/push/deploy adimlarinda ve substitution degiskenlerinde hangi degerlerin kullanilabilecegini aciklar.
- AWS tarafinda olusturulan ECR deposuna CI/CD pipeline'iniz Docker imajini push ettikten sonra `aws ecs update-service --force-new-deployment` komutuyla yeni versiyonu yayina alabilirsiniz.
- Production ortaminda Terraform state'ini paylasmak icin GCP'de Cloud Storage + state lock, AWS'de S3 + DynamoDB kullanmayi dusunun.
- Sırlar Terraform state dosyasına düz metin olarak yazıldığından, kritik bilgileri uzun vadede Secret Manager/Secrets Manager üzerinde elle veya ayrı otomasyonla güncellemek daha güvenlidir.
- AWS dizinindeki `buildspec.backend.yml` dosyasi CodeBuild icin hazirlandı; pipeline etkinlestiginde Docker imaji build + push edip ECS servisini yeniden baslatir.
- CodeBuild/CodePipeline'i Terraform ile kurmak icin `enable_codebuild` ve `enable_codepipeline` degiskenlerini `true` yapin; CodePipeline kullanilacaksa CodeStar Connection ARN, repo sahibi/adi ve opsiyonel bucket adi gibi degerleri `terraform.tfvars` icinde doldurun.
- Pipeline asamalari: Source (CodeStar Connection -> GitHub), Build (CodeBuild). Build adimi `aws ecs update-service` komutunu calistirir, bu nedenle ekstra deploy aksiyonuna gerek yoktur.
- Ilk Terraform apply sonrasinda CodeStar Connection dogrulamasini AWS Console uzerinden tamamlamayi unutmayin; aksi halde pipeline Source asamasinda beklemede kalir.
