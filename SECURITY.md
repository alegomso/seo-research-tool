# Security Guide

## 🔐 Repository Protection Setup

### Branch Protection Rules

1. **Go to GitHub → Settings → Branches → Add rule**

2. **Configure main branch protection**:
   ```
   Branch name pattern: main

   ✅ Restrict pushes that create files larger than 100MB
   ✅ Require a pull request before merging
     ✅ Require approvals: 1
     ✅ Dismiss stale reviews when new commits are pushed
     ✅ Require review from code owners
   ✅ Require status checks to pass before merging
     ✅ Require branches to be up to date before merging
     ✅ Status checks: build-test (from CI)
   ✅ Require conversation resolution before merging
   ✅ Restrict pushes that create files larger than 100MB
   ✅ Do not allow bypassing the above settings
   ```

### Required Secrets Configuration

**GitHub → Settings → Secrets and variables → Actions → New repository secret**

Add these secrets for CI/CD and deployment:

#### API Keys (Required for CI)
```
DATAFORSEO_LOGIN          # Your DataForSEO username
DATAFORSEO_PASSWORD       # Your DataForSEO password
OPENAI_API_KEY           # Your OpenAI API key (sk-...)
```

#### Authentication Secrets
```
JWT_SECRET               # Generate: openssl rand -base64 32
NEXTAUTH_SECRET          # Generate: openssl rand -base64 32
```

#### Optional: Google OAuth
```
GOOGLE_CLIENT_ID         # From Google Cloud Console
GOOGLE_CLIENT_SECRET     # From Google Cloud Console
```

#### Deployment Secrets (Platform-specific)
```
RAILWAY_TOKEN            # For Railway deployment
RENDER_API_KEY           # For Render deployment
VERCEL_TOKEN            # For Vercel deployment
```

## 🛡️ Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files
- ✅ Keep `.env.example` updated
- ✅ Use strong, unique secrets in production
- ✅ Rotate API keys regularly

### Development Workflow
- ✅ Always work in feature branches
- ✅ Require PR reviews before merging
- ✅ Run security checks in CI
- ✅ Keep dependencies updated

### API Security
- ✅ Rate limiting enabled
- ✅ Input validation on all endpoints
- ✅ JWT token expiration
- ✅ CORS properly configured

## 🚨 Incident Response

If you suspect a security issue:

1. **Immediately rotate affected API keys**
2. **Check access logs for unusual activity**
3. **Update secrets in GitHub and deployment platform**
4. **Redeploy application with new secrets**
5. **Monitor for continued suspicious activity**

## 📊 Security Monitoring

Enable these GitHub features:

- **Dependabot alerts** (Settings → Security → Code security)
- **Secret scanning** (automatically enabled for public repos)
- **Code scanning** (Security → Code security → Set up)

## 🔄 Regular Maintenance

### Monthly Tasks
- [ ] Review and rotate API keys
- [ ] Update dependencies (`pnpm update`)
- [ ] Review access logs
- [ ] Check for security advisories

### Quarterly Tasks
- [ ] Full security audit
- [ ] Review user access permissions
- [ ] Update security documentation
- [ ] Test incident response procedures