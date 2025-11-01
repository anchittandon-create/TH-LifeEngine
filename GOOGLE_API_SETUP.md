# Google API Key Setup & Quota Management

## Issue: API Quota Exceeded

The current Google API key has exceeded its quota, causing plan generation to fail with:
```
[429 Too Many Requests] You exceeded your current quota
```

## Solutions:

### Option 1: Create New Google API Key (Recommended)

1. **Go to Google AI Studio**: https://ai.google.dev/
2. **Sign in** with a different Google account (or same account if you want to upgrade)
3. **Click "Get API Key"**
4. **Create new project** or select existing one
5. **Generate API key**
6. **Copy the new API key**

### Option 2: Upgrade Current API Plan

1. Visit: https://ai.dev/usage?tab=rate-limit
2. Check current usage and quota
3. Upgrade billing plan if needed

## Updating the API Key

### For Local Development:
```bash
# Update .env file
GOOGLE_API_KEY=YOUR_NEW_API_KEY_HERE
```

### For Vercel Deployment:
1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: TH-LifeEngine
3. **Go to Settings > Environment Variables**
4. **Update GOOGLE_API_KEY** with the new key
5. **Redeploy** the application

## Temporary Workaround

The application now uses a **mock plan generation** system when AI quota is exceeded:
- Frontend automatically uses `/api/lifeengine/plan/generate` (mock endpoint)
- Provides realistic plan structure
- No AI costs
- Immediate response

## Quota Management Tips

1. **Enable billing** on Google Cloud Console for higher quotas
2. **Monitor usage** at https://ai.dev/usage
3. **Set up alerts** for approaching quota limits
4. **Use caching** (already implemented - 24hr cache)
5. **Limit requests per user** (already implemented - 3/day/profile)

## Model Information

Current working models (as of Nov 2024):
- `models/gemini-2.5-flash` ✅ Working
- `models/gemini-2.5-pro` ✅ Working  
- `models/gemini-2.0-flash` ✅ Working

Deprecated models:
- `gemini-pro` ❌ Not found
- `gemini-1.5-pro` ❌ Not found
- `gemini-1.5-flash-8b` ❌ Not found