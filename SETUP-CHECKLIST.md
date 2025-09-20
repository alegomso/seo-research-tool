# 🚀 Repository Setup Checklist

Quick validation guide for your SEO Research Tool repository.

## ✅ GitHub Repository Setup

### 1. Actions Status
- [ ] **Check CI Status**: Go to [Actions tab](https://github.com/alegomso/seo-research-tool/actions)
- [ ] **Verify build-test passes**: Should show green ✅ for latest commit
- [ ] **Fix any failures**: Check logs if red ❌

### 2. Branch Protection
- [ ] **Go to Settings → Branches → Add rule**
- [ ] **Branch name pattern**: `main`
- [ ] **Enable these options**:
  ```
  ✅ Require a pull request before merging
    ✅ Require approvals: 1
    ✅ Dismiss stale reviews when new commits are pushed
    ✅ Require review from code owners
  ✅ Require status checks to pass before merging
    ✅ Require branches to be up to date before merging
    ✅ Status checks: build-test
  ✅ Require conversation resolution before merging
  ✅ Do not allow bypassing the above settings
  ```

### 3. Repository Secrets
**Go to Settings → Secrets and variables → Actions → New repository secret**

**Required secrets:**
- [ ] `DATAFORSEO_LOGIN` - Your DataForSEO username
- [ ] `DATAFORSEO_PASSWORD` - Your DataForSEO password
- [ ] `OPENAI_API_KEY` - Your OpenAI API key (sk-...)
- [ ] `JWT_SECRET` - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] `NEXTAUTH_SECRET` - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**Optional secrets:**
- [ ] `GOOGLE_CLIENT_ID` - For Google OAuth SSO
- [ ] `GOOGLE_CLIENT_SECRET` - For Google OAuth SSO

### 4. Repository Settings
- [ ] **Add description**: "SEO Research Portal with DataForSEO APIs and AI analysis"
- [ ] **Add topics**: `seo`, `dataforseo`, `openai`, `nextjs`, `fastify`, `research-tool`
- [ ] **Enable Discussions** (optional): For community Q&A

### 5. Security Features
- [ ] **Enable Dependabot**: Settings → Security → Code security → Dependabot alerts ✅
- [ ] **Enable Secret scanning**: Settings → Security → Code security → Secret scanning ✅
- [ ] **Enable Code scanning**: Settings → Security → Code security → CodeQL analysis ✅

## 🔧 Development Workflow

### Working with PRs (Recommended)
```bash
# Create feature branch
git checkout -b feature/awesome-feature

# Make your changes
git add .
git commit -m "feat: add awesome feature"

# Push and create PR
git push -u origin feature/awesome-feature
# Go to GitHub and create PR
```

### Local Development Commands
```bash
# Start development environment
pnpm docker:dev
pnpm db:migrate
pnpm dev

# Before pushing
pnpm lint
pnpm typecheck
pnpm build
pnpm health-check
```

## 🎯 Next Steps

### Immediate (5 minutes)
1. ✅ Verify Actions are green
2. ✅ Set up branch protection
3. ✅ Add required secrets

### This Week
- [ ] Create your first feature branch and PR
- [ ] Test the full development workflow
- [ ] Set up your DataForSEO and OpenAI accounts
- [ ] Deploy to your preferred platform (see DEPLOYMENT-GUIDE.md)

### This Month
- [ ] Customize the AI prompts for your use case
- [ ] Add team members and configure permissions
- [ ] Set up monitoring and alerting
- [ ] Create your first release (v0.1.0)

## 🆘 Troubleshooting

### Actions Failing?
- Check if secrets are properly set
- Verify Docker services are starting correctly
- Review error logs in Actions tab

### Can't Push to Main?
- Branch protection is working! ✅
- Create a PR instead of pushing directly
- Ensure CI passes before merging

### Missing Dependencies?
- Run `pnpm install` to update lockfile
- Check Node.js version (requires 18+)
- Verify Docker Desktop is running

---

**🎉 Congratulations!** Your repository is now production-ready with professional CI/CD, security, and collaboration features.