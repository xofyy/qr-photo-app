# Terraform Remote State Backend Bootstrap

Bu dizin, GCP uzerinde paylasimli Terraform state'i saklamak icin gerekli Cloud Storage bucket'ini ve IAM yetkilerini olusturur. Kaynaklar main altyapi kodundan ayrilidir; boylece backend bucket'i olusmadan once Terraform konfigurasyonlarini calistirabilirsiniz.

## Kullanım Adımları

1. Gerekli degiskenleri `terraform.tfvars` veya CLI parametreleriyle saglayin. Minimum olarak `project_id` ve benzersiz bir `bucket_name` gereklidir.
2. Kimlik dogrulama icin `gcloud auth application-default login` veya ilgili servis hesabini kullanin.
3. Dizine girip Terraform komutlarini calistirin:

   ```bash
   cd infra/terraform/gcp/bootstrap/state_backend
   terraform init
   terraform plan -var='project_id=my-project' -var='bucket_name=my-tf-state-bucket'
   terraform apply -var='project_id=my-project' -var='bucket_name=my-tf-state-bucket'
   ```

4. `terraform output backend_config` komutuyla bucket ve prefix degerlerini alin. Ana altyapi dizininde `terraform init` calistirirken bu degerleri `-backend-config` bayraklariyla iletin:

   ```bash
   terraform -chdir=../../.. init \
     -backend-config="bucket=my-tf-state-bucket" \
     -backend-config="prefix=qr-photo/terraform/dev"
   ```

> ⚠️ Backend bucket'i silmek gerekiyorsa `terraform destroy` calistirmadan once bucket'in bos oldugundan emin olun ya da `bucket_force_destroy` degiskenini `true` yapin.

## Degiskenler

Bu dizin icin kullanilabilir degiskenlerin tam listesi `variables.tf` dosyasinda bulunur. En onemli parametreler:

- `project_id`: Kaynaklarin olusturulacagi proje.
- `bucket_name`: Global olarak benzersiz bucket adi.
- `bucket_location`: (Varsayilan `us-central1`) Bucket bolgesi.
- `admin_principals`, `writer_principals`, `reader_principals`: IAM yetkileri.
- `state_prefix`: Terraform backend dosyalarinizin klasor yapisi.

## Cikti Değerleri

`outputs.tf` dosyasinda bulunan ciktilar, ana Terraform dizininde backend konfigurasyonu yaparken tekrar kullanilabilir.
