# GitHub Repository Creation and Vercel Deployment Guide

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in to your account
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `TH_LifeEngine`
   - **Description**: `TH+ LifeEngine - AI-powered wellness planning application`
   - **Visibility**: Public (or Private if preferred)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 2: Push Your Code to GitHub

After creating the repository, GitHub will show you the commands. Run these in your terminal:

```bash
cd "/Users/Anchit.Tandon/Desktop/AI HUSTLE - APPS/TH_LifeEngine_Starter_Kit_Pro"
git remote add origin https://github.com/yourusername/TH_LifeEngine.git
git branch -M main
git push -u origin main
```

**Replace `yourusername` with your actual GitHub username!**

## Step 3: Deploy to Vercel via GitHub Integration

1. Go to [vercel.com](https://vercel.com)
2. Sign in/Sign up (preferably with your GitHub account)
3. Click "New Project"
4. Click "Import" next to your `TH_LifeEngine` repository
5. Configure the project:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
6. Click "Deploy"

## Step 4: Configure Environment Variables

After deployment, set up environment variables in Vercel:

1. Go to your project dashboard in Vercel
2. Click "Settings" tab
3. Click "Environment Variables" in the sidebar
4. Add these variables:

```
GOOGLE_API_KEY=AIzaSyA4f6eF6qyBUwxcO4Lb5HyyClbafB8ojD8
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
LIFEENGINE_ENABLED=true
LIFEENGINE_ROLLOUT_PERCENT=100
NEXT_PUBLIC_BASE_URL=https://your-vercel-url.vercel.app/application/TH_LifeEngine
```

5. Click "Save" for each variable
6. Redeploy the project (it should auto-deploy after adding env vars)

## Step 5: Access Your Deployed Application

Your app will be available at:
`https://your-project-name.vercel.app/application/TH_LifeEngine/`

## Alternative: CLI Deployment (if you prefer)

If you want to use Vercel CLI instead:

```bash
vercel login
vercel --prod
```

Follow the prompts to link to your GitHub repository.