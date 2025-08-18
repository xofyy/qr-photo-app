# 🚀 GitLab Deployment Checklist

## ✅ Ready Components
- [x] CI/CD Pipeline (`.gitlab-ci.yml`)
- [x] Docker Setup (Frontend & Backend Dockerfiles)
- [x] Production Configs (`docker-compose.production.yml`)
- [x] Environment Management (`.env.example`, `.env.production`)
- [x] Health Checks (`/health`, `/health/detailed`)
- [x] Monitoring Setup (Prometheus, Grafana)
- [x] Security Enhancements

## 🔧 Required Before GitLab Push

### 1. GitLab CI/CD Variables
**Project Settings → CI/CD → Variables:**

#### Production Environment
```
MONGODB_URL = mongodb+srv://username:password@cluster.mongodb.net/qr_photo_app?retryWrites=true&w=majority
DATABASE_NAME = qr_photo_app
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
JWT_SECRET = your-super-secret-jwt-key-256-bits
GOOGLE_CLIENT_ID = your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = your-google-client-secret
FRONTEND_URL = https://your-domain.com
BACKEND_URL = https://api.your-domain.com
CORS_ORIGINS = https://your-domain.com
```

#### Deployment Variables
```
PRODUCTION_HOST = your.server.ip.address
PRODUCTION_USER = deploy
PRODUCTION_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----...
STAGING_HOST = staging.server.ip.address
STAGING_USER = deploy
STAGING_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----...
```

#### Frontend Variables
```
REACT_APP_API_URL = https://api.your-domain.com
REACT_APP_WS_URL = wss://api.your-domain.com
REACT_APP_GA_TRACKING_ID = GA-XXXXXXXXX (optional)
```

#### Monitoring Variables
```
GRAFANA_PASSWORD = your-grafana-password
```

### 2. Server Setup Requirements

#### On Production Server:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deploy user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# Setup SSH key for deployment
sudo mkdir -p /home/deploy/.ssh
sudo echo "your-public-key" >> /home/deploy/.ssh/authorized_keys
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### 3. Domain & SSL Setup
- [ ] Domain DNS pointing to server IP
- [ ] SSL certificate (Let's Encrypt recommended)
- [ ] Firewall configuration (ports 80, 443, 22)

### 4. Environment Files Cleanup
**Remove from .env files before commit:**
- Real database URLs
- Real API keys
- Real secrets
- Keep only placeholder values

## 🚦 GitLab Push Steps

### 1. Final Commit
```bash
git add .
git commit -m "feat: complete DevOps setup with CI/CD, Docker, monitoring, and security

🚀 Production-ready infrastructure:
- GitLab CI/CD pipeline with automated testing
- Multi-stage Docker builds for frontend/backend  
- Prometheus + Grafana monitoring stack
- Comprehensive health checks
- Security enhancements and scanning
- Environment-specific configurations

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 2. Push to GitLab
```bash
git remote add origin https://gitlab.com/your-username/qr-photo-app.git
git push -u origin main
```

### 3. Configure CI/CD Variables
- Go to GitLab Project → Settings → CI/CD → Variables
- Add all variables from list above
- Mark sensitive variables as "Protected" and "Masked"

### 4. Monitor First Pipeline
- Check GitLab → CI/CD → Pipelines
- Monitor test, build, and deploy stages
- Check logs for any issues

## 📊 Post-Deployment Verification

### Health Checks
- [ ] Frontend: `https://your-domain.com/health.html`
- [ ] Backend: `https://api.your-domain.com/health`
- [ ] Detailed: `https://api.your-domain.com/health/detailed`

### Monitoring
- [ ] Prometheus: `https://your-domain.com:9090`
- [ ] Grafana: `https://your-domain.com:3000`

### Functionality
- [ ] Create QR session
- [ ] Upload photos
- [ ] WebSocket notifications
- [ ] User authentication

## 🔒 Security Verification

### Run Security Scan
```bash
python security/secrets-scanner.py
```

### Check Security Headers
```bash
curl -I https://your-domain.com
```

### Verify HTTPS
- [ ] All HTTP redirects to HTTPS
- [ ] Valid SSL certificate
- [ ] Security headers present

## 📞 Support

If deployment fails:
1. Check GitLab pipeline logs
2. Verify all CI/CD variables
3. Check server Docker logs: `docker logs qr-backend-service`
4. Review monitoring dashboard

---

**Status: 🟢 READY FOR GITLAB DEPLOYMENT**

All infrastructure components are configured and ready for production deployment!