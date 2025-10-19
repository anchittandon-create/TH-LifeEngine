# Deployment Guide for TH+ LifeEngine

## Quick Deploy Options

### 1. Vercel (Recommended) 🚀

**Steps:**
1. Create account at [vercel.com](https://vercel.com)
2. Run in terminal:
   ```bash
   cd "/Users/Anchit.Tandon/Desktop/AI HUSTLE - APPS/TH_LifeEngine_Starter_Kit_Pro"
   vercel login
   vercel --prod
   ```
3. Follow prompts to deploy
4. Your app will be available at: `https://your-project-name.vercel.app/application/TH_LifeEngine/`

**Custom Domain Setup:**
1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add your custom domain (you'll need a working domain, not `anchit-ai-hustle.work.gd`)
4. Configure DNS records as instructed

### 2. Netlify 🌐

**Steps:**
1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop the `.next` folder to Netlify
3. Or connect your GitHub repo for auto-deployment
4. Configuration is already set up in `netlify.toml`

### 3. GitHub Pages (Static) 📄

**For static deployment:**
1. Replace `next.config.js` with `next.config.static.js`:
   ```bash
   mv next.config.js next.config.dynamic.js
   mv next.config.static.js next.config.js
   ```
2. Build for static export:
   ```bash
   npm run build
   ```
3. Deploy the `out` folder to any static hosting

### 4. Custom Server Deployment 🖥️

**Requirements:**
- Node.js server
- Domain with proper DNS
- SSL certificate

**Steps:**
1. Upload your project to server
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Start: `npm start`
5. Configure reverse proxy (nginx/apache) for your domain

## Environment Variables for Production

Make sure to set these in your hosting platform:

```bash
GOOGLE_API_KEY=your_actual_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
LIFEENGINE_ENABLED=true
LIFEENGINE_ROLLOUT_PERCENT=100
NEXT_PUBLIC_BASE_URL=https://your-actual-domain.com/application/TH_LifeEngine
```

## Domain Considerations

⚠️ **Important:** The domain `anchit-ai-hustle.work.gd` appears to be flagged as suspicious. Consider:

1. **Use a reputable domain provider** (GoDaddy, Namecheap, etc.)
2. **Choose a professional domain name**
3. **Verify domain ownership** with hosting provider
4. **Set up proper DNS records**

## Testing Your Deployment

Once deployed, test these URLs:
- `/application/TH_LifeEngine/` - Main app
- `/application/TH_LifeEngine/lifeengine/profiles` - Profiles page
- `/application/TH_LifeEngine/api/lifeengine/profiles/list` - API endpoint

## Troubleshooting

**Issue: 404 on API routes**
- Ensure your hosting supports Next.js API routes
- Vercel and Netlify handle this automatically

**Issue: Assets not loading**
- Check that `basePath` and `assetPrefix` are configured correctly
- Verify `NEXT_PUBLIC_BASE_URL` environment variable

**Issue: Domain flagged as suspicious**
- Contact domain provider
- Use a different, reputable domain
- Check domain reputation online