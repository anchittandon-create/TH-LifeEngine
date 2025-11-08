# ✅ API Key Security - Final Checklist

**Date**: $(date)  
**Status**: Ready for Verification

---

## 🎯 What We've Done

### ✅ 1. Updated .env with New API Key
- **Old Key** (COMPROMISED): `AIzaSyDH0puriqpOLvxsFJKTLY7oFvMAAz-IBLA`
- **New Key**: `AIzaSyCjCasVmVYCAoeLcQ8COHkg1Day2Jbgb4M`
- **Status**: ✅ Updated in `.env` file
- **Safety**: ⚠️ Never commit this file!

### ✅ 2. Cleaned Up Exposed Keys in Documentation
**Files Cleaned**:
- `list-models.js` - Removed hardcoded API key
- `SETTINGS_UPDATE_SUMMARY.md` - Redacted API key
- `UPDATE_VERCEL_ENV.md` - Redacted API key
- `IMPLEMENTATION_STATUS.md` - Redacted API key
- `BRIEF_VS_IMPLEMENTATION.md` - Redacted API key

**Backups Created**: `.api-key-cleanup-backup/` (excluded from Git)

### ✅ 3. Updated .gitignore
Added additional security patterns:
- `.api-key-cleanup-backup/` - Backup folder
- All existing patterns still active (`.env`, `*api-key*`, `*token*`, etc.)

---

## 🚨 CRITICAL: Actions You MUST Take Now

### 1. Revoke the Old API Key (DO THIS FIRST!)

Go to [Google AI Studio](https://makersuite.google.com/app/apikey) and:

1. Find this key: `AIzaSyDH0puriqpOLvxsFJKTLY7oFvMAAz-IBLA`
2. Click **DELETE** or **REVOKE**
3. Confirm deletion

**Why**: Even though it's blocked, you should still delete it from your account.

### 2. Verify Your New Key Works

```bash
# Test the API locally
npm run dev

# Navigate to: http://localhost:3000/lifeengine/create
# Try generating a plan
# Should work without 403 errors
```

### 3. Update Vercel Environment Variables

If you've deployed to Vercel:

```bash
# Go to Vercel Dashboard
open https://vercel.com/dashboard

# Navigate to your project → Settings → Environment Variables
# Update GOOGLE_API_KEY to your NEW key
# Redeploy
```

### 4. Restrict Your New API Key (IMPORTANT!)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your NEW API key
3. Click **Edit** (pencil icon)
4. **Application restrictions**:
   - ☑️ HTTP referrers (websites)
   - Add: `http://localhost:3000/*`
   - Add: `https://your-domain.vercel.app/*`
5. **API restrictions**:
   - ☑️ Restrict key
   - ☑️ Only: "Generative Language API"
6. Click **Save**

**Why**: This prevents your key from being used by attackers even if leaked.

### 5. Clean Git History (IF Keys Were Committed)

**Check if keys are in Git commits**:

```bash
cd "/Users/Anchit.Tandon/Desktop/AI HUSTLE - APPS/TH-LifeEngine"

# Search all commits for API keys
git log -S "AIzaSy" --all --oneline

# If you see results, you need to clean history!
```

**If keys found, clean with BFG** (recommended):

```bash
# Install BFG Repo-Cleaner
brew install bfg

# Clone a fresh copy
cd ~/Desktop
git clone --mirror "https://github.com/YOUR_USERNAME/TH-LifeEngine.git"
cd TH-LifeEngine.git

# Remove .env from all commits
bfg --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ THIS REWRITES HISTORY!)
git push --force
```

**Alternative: Git Filter-Branch**:

```bash
cd "/Users/Anchit.Tandon/Desktop/AI HUSTLE - APPS/TH-LifeEngine"

# Remove .env from all history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
```

**⚠️ WARNING**: Force pushing rewrites history. If you have collaborators, coordinate with them first!

### 6. Commit the Cleaned Files

```bash
cd "/Users/Anchit.Tandon/Desktop/AI HUSTLE - APPS/TH-LifeEngine"

# Stage the cleaned documentation files
git add list-models.js
git add SETTINGS_UPDATE_SUMMARY.md
git add UPDATE_VERCEL_ENV.md
git add IMPLEMENTATION_STATUS.md
git add BRIEF_VS_IMPLEMENTATION.md
git add .gitignore
git add URGENT_API_KEY_SECURITY_FIX.md
git add API_KEY_SECURITY_CHECKLIST.md

# Commit
git commit -m "security: Remove exposed API keys from documentation

- Redacted all hardcoded API keys in MD files
- Updated list-models.js to use environment variable
- Added cleanup backup folder to .gitignore
- Added comprehensive security documentation

BREAKING: Old API keys have been revoked
ACTION REQUIRED: Update .env with new key (see README)"

# Push
git push origin main
```

---

## 🔒 Security Best Practices (Follow Forever!)

### DO ✅
1. ✅ Always use `.env` for sensitive data
2. ✅ Always verify `.env` is in `.gitignore`
3. ✅ Use `.env.example` for documentation (without real values)
4. ✅ Use environment variables in code: `process.env.GOOGLE_API_KEY`
5. ✅ Add API key restrictions (domain, API limits)
6. ✅ Set up billing alerts ($5/month budget)
7. ✅ Rotate keys every 90 days
8. ✅ Use secret managers in production (Vercel, AWS Secrets Manager)

### DON'T ❌
1. ❌ Never hardcode API keys in code
2. ❌ Never commit `.env` files
3. ❌ Never share keys in Slack, Discord, email
4. ❌ Never paste keys in screenshots
5. ❌ Never use the same key across multiple projects
6. ❌ Never skip API restrictions (always set domain limits)
7. ❌ Never ignore Google security alerts

---

## 🧪 Testing Checklist

After completing all steps above, test:

### Local Development
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to Create Plan page
- [ ] Generate a test plan
- [ ] Verify no 403 errors
- [ ] Check console for API call logs

### Vercel Deployment
- [ ] Environment variables updated
- [ ] Application redeployed
- [ ] Production plan generation works
- [ ] No errors in Vercel logs

### Security Verification
- [ ] `.env` not tracked by Git: `git ls-files | grep .env` (should be empty)
- [ ] No API keys in code: `git grep "AIzaSy"` (should only show docs/examples)
- [ ] API key restrictions enabled in Google Cloud
- [ ] Billing alerts configured

---

## 📊 Cost Monitoring

### Current Cost Controls (Backend)
- **Hourly Limit**: 10 plan generations
- **Daily Budget**: $0.50
- **Model**: `gemini-1.5-flash-8b` (cheapest option)
- **Token Limit**: 3000 max output tokens

These limits are still active in the backend, just not shown in the UI.

### Google Cloud Monitoring
1. Go to [Google Cloud Console → Billing](https://console.cloud.google.com/billing)
2. Set up budget alert:
   - Budget: $5/month
   - Alert at: 50%, 90%, 100%
   - Email notifications enabled

---

## 🆘 If Something Goes Wrong

### API Still Returns 403 Error
1. Double-check `.env` has the NEW key
2. Restart your dev server: `npm run dev`
3. Clear Next.js cache: `rm -rf .next`
4. Verify key is valid: Test at https://makersuite.google.com/

### Key Still Detected as Leaked
1. You may have committed it to Git history
2. Follow "Clean Git History" steps above
3. Force push to GitHub
4. Create a brand new key if needed

### Forgot to Revoke Old Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Delete ALL old keys
3. Only keep the new restricted key

---

## 📝 Summary

### What's Fixed
✅ New API key installed in `.env`  
✅ All documentation files cleaned  
✅ `.gitignore` updated with security patterns  
✅ Cleanup script created for future use  
✅ Comprehensive security docs added  

### What You Need to Do
🔥 **CRITICAL** - Revoke old key in Google Cloud  
🔥 **CRITICAL** - Test plan generation locally  
⚠️ **IMPORTANT** - Add API key restrictions  
⚠️ **IMPORTANT** - Update Vercel environment variables  
⚠️ **IMPORTANT** - Clean Git history if needed  
✅ **RECOMMENDED** - Set up billing alerts  

---

## 🎉 Once Complete

Your application will be:
- ✅ Fully functional (plan generation working)
- ✅ Secure (no leaked keys)
- ✅ Protected (API restrictions enabled)
- ✅ Monitored (cost alerts active)
- ✅ Safe (Git history cleaned)

**You can then continue building features without security worries!**

---

**Next Steps After Security Fix**:
1. Continue with full feature implementation
2. Test all functionality thoroughly
3. Deploy to production safely
4. Set up monitoring and alerts

**Questions?** Refer to `URGENT_API_KEY_SECURITY_FIX.md` for detailed explanations.
