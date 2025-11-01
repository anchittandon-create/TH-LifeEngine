# 🚀 Vercel Environment Variables Update Guide

## After getting your new Google API key, update Vercel:

### Method 1: Vercel Dashboard (GUI)
1. **Go to**: https://vercel.com/dashboard
2. **Find**: TH-LifeEngine project
3. **Click**: Settings → Environment Variables
4. **Find**: GOOGLE_API_KEY
5. **Click**: Edit (pencil icon)
6. **Paste**: Your new API key
7. **Click**: Save
8. **Wait**: 2-3 minutes for auto-deployment

### Method 2: Vercel CLI (Terminal)
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variable
vercel env add GOOGLE_API_KEY
# Paste your API key when prompted
# Select: Production

# Trigger deployment
vercel --prod
```

### Method 3: Environment Variables File
```bash
# For local development, update .env:
echo "GOOGLE_API_KEY=your_new_api_key_here" > .env.local

# Test locally:
npm run dev
curl "http://localhost:3000/api/quota-test"
```

## 🧪 Test After Update

### Test Production Deployment:
```bash
curl -s "https://th-life-engine.vercel.app/api/quota-test" | jq .quotaStatus
# Expected: "✅ Available"
```

### Test Plan Generation:
```bash
curl -s "https://th-life-engine.vercel.app/api/lifeengine/generate" \
  -H "Content-Type: application/json" \
  -X POST \
  -d '{"profileId": "prof_anchit", "intake": {"primaryPlanType": "weight_loss"}}' \
  | jq .planId
# Expected: "plan_xxxxxxx"
```

## 🎯 Success Indicators

✅ **Quota Test**: Returns "Available" status  
✅ **Plan Generation**: Returns actual plan ID  
✅ **Frontend**: Plan creation works without errors  
✅ **Cost Monitor**: Shows $0.00 current spend  

## 📊 Monitor Costs

### Google AI Studio Dashboard:
- **Usage**: https://ai.dev/usage
- **Billing**: Check daily/monthly spend
- **Alerts**: Set up cost alerts

### TH_LifeEngine Cost Monitor:
- **Local**: http://localhost:3000/api/cost-estimates
- **Production**: https://th-life-engine.vercel.app/api/cost-estimates

## 🚨 Troubleshooting

### If quota test still fails:
1. **Wait 5-10 minutes** after Vercel update
2. **Check API key** is correctly pasted (no extra spaces)
3. **Verify billing** is enabled in Google Cloud Console
4. **Clear Vercel cache**: Go to Functions tab → Clear cache

### If costs seem high:
1. **Check usage**: https://ai.dev/usage
2. **Verify caching** is working (24h cache implemented)
3. **Monitor daily limits** (3 requests per profile per day)
4. **Set billing alerts** in Google Cloud Console