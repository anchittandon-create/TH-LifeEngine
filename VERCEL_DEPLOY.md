# Manual Vercel Deployment Instructions

## Step 1: Authentication
Open terminal and run:
```bash
cd "/Users/Anchit.Tandon/Desktop/AI HUSTLE - APPS/TH_LifeEngine_Starter_Kit_Pro"
vercel login
```

Follow the prompts to:
1. Choose your preferred login method (GitHub, GitLab, Bitbucket, or Email)
2. Complete authentication in your browser
3. Return to terminal when authenticated

## Step 2: Deploy to Vercel
Run the deployment command:
```bash
vercel --prod
```

You'll be prompted to configure:
- **Project name**: Accept default or enter custom name
- **Framework**: Should detect "Next.js" automatically
- **Build command**: Should be "npm run build" (default)
- **Output directory**: Should be ".next" (default)
- **Development command**: Should be "npm run dev" (default)

## Step 3: Environment Variables Setup
After deployment, set up environment variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
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

## Step 4: Redeploy with Environment Variables
After setting environment variables, redeploy:
```bash
vercel --prod
```

## Expected Results
- Your app will be deployed to: `https://[project-name].vercel.app`
- Access your LifeEngine at: `https://[project-name].vercel.app/application/TH_LifeEngine/`

## Custom Domain Setup (Optional)
1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Update NEXT_PUBLIC_BASE_URL to your custom domain

## Troubleshooting
- If build fails, check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- API routes should work automatically with Vercel