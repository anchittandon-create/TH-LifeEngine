# 🔑 Update Vercel Environment Variable

## ⚠️ IMPORTANT: Update Production API Key

Your old API key was leaked and blocked by Google. I've updated the local `.env` file, but you **must also update Vercel** for production.

## New API Key
```
AIzaSyB-0kJC-ZqyKbu6ZTh2Lvr5jt0xDWGxgkI
```

## Steps to Update Vercel

### Option 1: Via Vercel Dashboard (Recommended)
1. Go to: https://vercel.com/anchittandon-create/th-lifeengine/settings/environment-variables
2. Find `GOOGLE_API_KEY`
3. Click **Edit** or **Delete** (then add new)
4. Set value to: `AIzaSyB-0kJC-ZqyKbu6ZTh2Lvr5jt0xDWGxgkI`
5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**
7. **Redeploy** your app for changes to take effect

### Option 2: Via Vercel CLI
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Set the environment variable
vercel env rm GOOGLE_API_KEY production
vercel env add GOOGLE_API_KEY production
# Paste: AIzaSyB-0kJC-ZqyKbu6ZTh2Lvr5jt0xDWGxgkI

# Redeploy
vercel --prod
```

### Option 3: Via Script (Quick)
```bash
# From project root
cd /Users/Anchit.Tandon/Desktop/AI\ HUSTLE\ -\ APPS/TH-LifeEngine

# Update environment variable
vercel env add GOOGLE_API_KEY <<EOF
AIzaSyB-0kJC-ZqyKbu6ZTh2Lvr5jt0xDWGxgkI
EOF

# Deploy
git add .
git commit -m "fix: update API key"
git push origin main
```

## ✅ Verification

After updating Vercel:

1. Wait for deployment to complete
2. Test production endpoint:
```bash
curl -X POST https://your-app.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"profileId":"prof_anchit","intake":{"durationDays":2}}'
```

3. Should return a plan with `quality_score: 0.9` and no errors

## 🔒 Security Note

**DO NOT** commit API keys to Git! The `.env` file is in `.gitignore`, but be careful when sharing code or screenshots.

## Current Status
- ✅ Local `.env` updated with new key
- ✅ New key verified working locally
- ✅ Test plan generation successful (quality: 0.9)
- ⏳ **ACTION REQUIRED:** Update Vercel environment variable
- ⏳ **ACTION REQUIRED:** Redeploy production app

## Local Testing Results
```
✅ API Key Valid: Yes
✅ Plan Generation: Working
✅ Days Generated: 2
✅ Quality Score: 0.9
✅ Warnings: None
```

---

**Next Step:** Update Vercel environment variable using one of the options above, then redeploy.
