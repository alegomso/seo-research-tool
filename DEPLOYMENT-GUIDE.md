# 🚀 SEO Portal Deployment Guide

Welcome! This guide will help you deploy the SEO Portal for your team. We've designed multiple deployment options to match your technical comfort level and requirements.

## 📋 Prerequisites

Before you start, make sure you have:

- **DataForSEO Account** - [Sign up here](https://dataforseo.com) ($20/month minimum)
- **OpenAI API Account** - [Get API key here](https://platform.openai.com) (~$10-50/month depending on usage)
- **Google Account** (for optional SSO) - [Google Cloud Console](https://console.cloud.google.com)

## 🎯 Choose Your Deployment Path

### 🟢 **Beginner**: One-Click Cloud Deployment (15-30 minutes)
**Perfect for**: Marketing teams, non-technical users
- ✅ No coding or server management required
- ✅ Automatic scaling and backups
- ✅ Built-in security and SSL
- 💰 **Cost**: $20-50/month

**Options**:
- [Railway Deployment](#railway-deployment) - Easiest option
- [Render Deployment](#render-deployment) - Good alternative

### 🟡 **Intermediate**: Managed Platform (1-2 hours)
**Perfect for**: Teams with basic technical knowledge
- ✅ More control over configuration
- ✅ Docker-based deployment
- ✅ Managed databases
- 💰 **Cost**: $35-80/month

**Options**:
- [DigitalOcean App Platform](#digitalocean-deployment)
- [Google Cloud Run](#google-cloud-deployment)

### 🔴 **Advanced**: Self-Hosted (3-5 hours)
**Perfect for**: Teams with technical resources or budget constraints
- ✅ Full control and customization
- ✅ Lowest cost option
- ⚠️ Requires server management
- 💰 **Cost**: $15-40/month

**Options**:
- [VPS with Docker](#vps-deployment)
- [AWS/Azure/GCP](#cloud-vps-deployment)

---

## 🚄 Railway Deployment (Recommended for Beginners)

Railway offers the simplest deployment experience with automatic environment detection.

### Step 1: Prepare Your Repository

1. **Fork or clone** this repository to your GitHub account
2. **Run the setup wizard** to configure your environment:
   ```bash
   npm install -g tsx
   tsx scripts/setup-wizard.ts
   ```
3. **Validate your configuration**:
   ```bash
   tsx scripts/validate-env.ts
   ```

### Step 2: Deploy to Railway

1. **Sign up** at [railway.app](https://railway.app) using your GitHub account
2. **Create a new project** → "Deploy from GitHub repo"
3. **Select** your forked SEO Portal repository
4. **Railway will automatically**:
   - Detect the `railway.toml` configuration
   - Set up PostgreSQL and Redis databases
   - Deploy your frontend and backend
5. **Configure environment variables** in Railway dashboard:
   - Go to your project → Variables tab
   - Add all variables from your `.env` file
   - **Important**: Don't add `DATABASE_URL` and `REDIS_URL` (Railway provides these)

### Step 3: Run Database Migrations

1. **Open Railway dashboard** → Your project
2. **Go to server service** → Deploy logs
3. **Wait for deployment** to complete
4. **Open terminal** in Railway dashboard
5. **Run migrations**:
   ```bash
   pnpm db:migrate
   ```

### Step 4: Access Your Application

1. **Find your frontend URL** in Railway dashboard (usually `something.railway.app`)
2. **Visit the URL** and create your first admin account
3. **Configure your team** in the admin panel

### 💰 Railway Pricing
- **Hobby Plan**: $5/month (perfect for small teams)
- **Pro Plan**: $20/month (recommended for growing teams)
- **Database add-ons**: ~$5-15/month

---

## 🎨 Render Deployment

Render provides a reliable alternative to Railway with similar ease of use.

### Step 1: Prepare Your Repository

1. **Follow the same steps** as Railway preparation above
2. **Ensure** you have the `render.yaml` file in your repository

### Step 2: Deploy to Render

1. **Sign up** at [render.com](https://render.com)
2. **Create Blueprint** → Connect GitHub → Select your repository
3. **Render will automatically**:
   - Use the `render.yaml` configuration
   - Set up PostgreSQL and Redis
   - Deploy all services
4. **Configure environment variables**:
   - Each service will have an Environment tab
   - Add variables as needed (Render auto-connects databases)

### Step 3: Complete Setup

1. **Wait for all services** to deploy (5-10 minutes)
2. **Run database migrations** via Render shell
3. **Access your application** via the provided URL

### 💰 Render Pricing
- **Static Sites**: Free
- **Web Services**: $7/month each
- **Databases**: $7/month each
- **Total**: ~$35-50/month

---

## 🌊 DigitalOcean App Platform

For teams wanting more control with managed infrastructure.

### Step 1: Prepare Docker Configuration

1. **Use our production Docker setup**:
   ```bash
   # Test locally first
   docker-compose -f infra/docker/docker-compose.prod.yml up -d
   ```
2. **Validate everything works** before deploying

### Step 2: Deploy to DigitalOcean

1. **Sign up** at [digitalocean.com](https://digitalocean.com)
2. **Create App** → GitHub repository
3. **Configure services**:
   - **Web Service**: apps/web (Dockerfile.web)
   - **API Service**: apps/server (Dockerfile.server)
   - **Database**: Managed PostgreSQL
   - **Cache**: Managed Redis
4. **Set environment variables** for each service

### 💰 DigitalOcean Pricing
- **Basic App**: $12/month
- **Pro App**: $25/month
- **Managed DB**: $15/month
- **Total**: ~$40-80/month

---

## 🐳 VPS Deployment (Advanced)

For teams comfortable with server management.

### Step 1: Provision Your Server

**Recommended specs**:
- **CPU**: 2 cores minimum
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 40GB SSD minimum
- **OS**: Ubuntu 22.04 LTS

**Providers** (choose one):
- [DigitalOcean Droplets](https://digitalocean.com) - $24/month
- [Linode](https://linode.com) - $24/month
- [Vultr](https://vultr.com) - $24/month
- [Hetzner](https://hetzner.com) - $15/month (Europe)

### Step 2: Server Setup

1. **Connect to your server**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Install Docker and Docker Compose**:
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   apt install docker-compose-plugin -y

   # Start Docker
   systemctl enable docker
   systemctl start docker
   ```

3. **Clone your repository**:
   ```bash
   git clone https://github.com/yourusername/seo-portal.git
   cd seo-portal
   ```

4. **Configure environment**:
   ```bash
   cp .env.production .env
   # Edit .env with your actual values
   nano .env
   ```

### Step 3: Deploy

1. **Start the application**:
   ```bash
   docker-compose -f infra/docker/docker-compose.prod.yml up -d
   ```

2. **Run migrations**:
   ```bash
   docker exec -it seo-portal-server-prod pnpm db:migrate
   ```

3. **Set up SSL** (recommended):
   ```bash
   # Install Certbot
   apt install certbot python3-certbot-nginx -y

   # Get SSL certificate
   certbot --nginx -d your-domain.com
   ```

### Step 4: Monitoring and Maintenance

1. **Set up automatic backups**:
   ```bash
   # Add to crontab
   crontab -e

   # Backup database daily at 2 AM
   0 2 * * * docker exec seo-portal-postgres-prod pg_dump -U postgres seo_portal > /backups/seo_portal_$(date +%Y%m%d).sql
   ```

2. **Monitor logs**:
   ```bash
   # View all services
   docker-compose -f infra/docker/docker-compose.prod.yml logs -f

   # View specific service
   docker logs seo-portal-server-prod -f
   ```

### 💰 VPS Pricing
- **Server**: $15-40/month
- **Domain**: $10-15/year
- **SSL**: Free (Let's Encrypt)
- **Total**: ~$15-45/month

---

## 🔧 Post-Deployment Configuration

### Initial Admin Setup

1. **Visit your deployed application**
2. **Create first admin account**:
   - Use your work email
   - Set strong password
   - Enable 2FA if available

3. **Configure team settings**:
   - Add team members
   - Set usage limits
   - Configure API budgets

### API Configuration

1. **Test DataForSEO connection**:
   - Go to Settings → API Configuration
   - Test connection button
   - Verify available credits

2. **Test OpenAI integration**:
   - Go to Settings → AI Configuration
   - Run test prompt
   - Check usage limits

### Security Checklist

- [ ] **SSL certificate** is active (https://)
- [ ] **Admin account** has strong password
- [ ] **API keys** are stored securely
- [ ] **Database** has strong password
- [ ] **Backups** are configured
- [ ] **Team access** is properly configured

---

## 🆘 Troubleshooting

### Common Issues

**❌ "Database connection failed"**
- Check `DATABASE_URL` format
- Verify database is running
- Check firewall settings

**❌ "DataForSEO API authentication failed"**
- Verify login/password are correct
- Check API credits available
- Confirm account is active

**❌ "OpenAI API rate limit exceeded"**
- Check OpenAI billing status
- Verify API key permissions
- Review usage limits

**❌ "Application won't start"**
- Check environment variables
- Review application logs
- Verify all required services are running

### Getting Help

1. **Check logs first**:
   ```bash
   # For Docker deployments
   docker-compose logs -f

   # For cloud deployments
   # Check platform-specific logging
   ```

2. **Run validation**:
   ```bash
   tsx scripts/validate-env.ts
   ```

3. **Community support**:
   - GitHub Issues
   - Documentation
   - Community Discord

---

## 📈 Scaling and Maintenance

### Monitoring Your Deployment

1. **Set up alerts** for:
   - Application downtime
   - Database issues
   - API rate limits
   - High usage costs

2. **Regular maintenance**:
   - Weekly backup verification
   - Monthly security updates
   - Quarterly cost optimization

### Cost Optimization

1. **Monitor API usage**:
   - Set budget alerts
   - Review query patterns
   - Optimize frequent requests

2. **Database optimization**:
   - Regular cleanup of old data
   - Index optimization
   - Connection pooling

3. **Caching optimization**:
   - Monitor Redis usage
   - Optimize TTL settings
   - Review cache hit rates

---

## 🎉 You're All Set!

Your SEO Portal is now deployed and ready for your team to use. Here are some next steps:

1. **📚 Train your team** on using the portal
2. **📊 Set up regular reporting** and usage reviews
3. **🔄 Plan for scaling** as your team grows
4. **🛡️ Implement security best practices**

### Need Help?

- 📖 **Documentation**: Check our detailed docs
- 🐛 **Found a bug?**: Open an issue on GitHub
- 💡 **Feature request?**: Let us know what you need
- 💬 **Questions?**: Join our community discussions

**Happy researching!** 🚀