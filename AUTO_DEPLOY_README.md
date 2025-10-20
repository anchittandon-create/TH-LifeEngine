# TH+ LifeEngine - Auto-Deploy Setup

## 🚀 Automatic Deployment Setup

This project is configured for **automatic commits, pushes, and deployments** to Vercel.

### ✅ What's Already Set Up

1. **GitHub Actions Workflow** (`.github/workflows/nextjs.yml`)
   - Triggers on every push to `main` branch
   - Builds the Next.js project
   - Auto-deploys to Vercel

2. **Auto-Commit Script** (`auto-commit.sh`)
   - Quickly commit and push all changes
   - Usage: `./auto-commit.sh "your commit message"`

### 🔧 One-Time Setup Required

#### 1. Configure GitHub Secrets

Run the setup script to get your Vercel credentials:

```bash
./setup-vercel-github.sh
```

Then add these secrets to your GitHub repository:

1. Go to: https://github.com/AT-2803/TH_LifeEngine/settings/secrets/actions
2. Add these secrets:
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

#### 2. Get Vercel Credentials

**VERCEL_TOKEN:**
- Visit: https://vercel.com/account/tokens
- Create a new token
- Copy the token value

**VERCEL_ORG_ID:**
```bash
vercel whoami
```
Copy the `id` field from the output.

**VERCEL_PROJECT_ID:**
```bash
cat .vercel/project.json
```
Copy the `projectId` field.

### 📝 How to Use Auto-Commit & Deploy

#### Method 1: Auto-Commit Script
```bash
# Commit and push all changes
./auto-commit.sh "Updated UI components"

# Or with a custom message
./auto-commit.sh "Fixed profile validation bug"
```

#### Method 2: Manual Git Commands
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### 🔄 Auto-Deployment Flow

1. **Make Changes** → Edit files in your project
2. **Auto-Commit** → Run `./auto-commit.sh "message"`
3. **Auto-Push** → Changes pushed to GitHub `main` branch
4. **Auto-Build** → GitHub Actions builds the project
5. **Auto-Deploy** → Vercel deploys the new version
6. **Live!** → https://th-lifeengine.vercel.app/ updated automatically

### 📊 Current Project Info

- **Repository**: https://github.com/AT-2803/TH_LifeEngine
- **Production URL**: https://th-lifeengine.vercel.app/
- **Framework**: Next.js 14 with App Router
- **Deployment**: Vercel with automatic deployments

### 🛠️ Troubleshooting

**Deployment not triggering?**
- Check GitHub Actions tab in your repository
- Ensure secrets are properly configured
- Verify you're pushing to the `main` branch

**Build failing?**
- Check the GitHub Actions logs
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

**Need to deploy manually?**
```bash
vercel --prod
```

### 🎯 Benefits

- ✅ **Zero manual deployment steps**
- ✅ **Every change automatically deployed**
- ✅ **Build verification on every push**
- ✅ **Instant rollbacks via Git**
- ✅ **Production-ready deployments**

---

**Ready to develop!** Every change you commit will be automatically deployed to production. 🚀