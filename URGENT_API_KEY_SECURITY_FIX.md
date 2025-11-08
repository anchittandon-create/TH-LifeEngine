# 🚨 URGENT: API Key Security Fix

**Date**: November 8, 2025  
**Issue**: Google API key was leaked and flagged by Google  
**Status**: IMMEDIATE ACTION REQUIRED

---

## ⚠️ The Problem

Your Google API key was detected as leaked, likely because it was:
1. Committed to Git repository
2. Pushed to GitHub (public or private)
3. Detected by Google's automatic scanning

**Error Message**:
```
[403 Forbidden] Your API key was reported as leaked. 
Please use another API key.
```

---

## 🔥 IMMEDIATE STEPS (Do These NOW!)

### Step 1: Revoke the Leaked Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Find any leaked keys in your account
3. Click **DELETE** or **REVOKE** on those keys
4. **Do NOT use old keys anywhere - they're compromised!**

### Step 2: Create a New API Key

1. In [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Create API Key"**
3. Select your Google Cloud project (or create new)
4. **Copy the new key** (you'll only see it once!)
5. **DO NOT share, commit, or post this key anywhere!**

### Step 3: Update Your Local .env File

1. Open your `.env` file
2. Replace the old key with your new key:

```bash
# OLD (COMPROMISED - DELETE THIS)
GOOGLE_API_KEY=AIzaSy***-OLD-REVOKED-KEY-***

# NEW (Replace with your actual new key)
GOOGLE_API_KEY=YOUR_NEW_KEY_HERE
```

3. **NEVER commit this file to Git!**

### Step 4: Clean Git History (CRITICAL!)

The leaked key is likely in your Git history. You MUST remove it:

```bash
# Navigate to your project
cd /Users/Anchit.Tandon/Desktop/AI\ HUSTLE\ -\ APPS/TH-LifeEngine

# Check if .env was committed
git log --all --full-history -- .env

# If it shows commits, you need to remove them from history
# WARNING: This rewrites Git history - backup first!

# Option A: Remove .env from entire history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Option B: Use BFG Repo-Cleaner (easier, recommended)
# Install: brew install bfg
bfg --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push to GitHub (if already pushed)
git push origin --force --all
git push origin --force --tags
```

### Step 5: Update Vercel (If Deployed)

If you've deployed to Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `TH-LifeEngine`
3. Go to **Settings** → **Environment Variables**
4. Update `GOOGLE_API_KEY` with your **NEW key**
5. Redeploy your application

---

## ✅ Security Best Practices (FOLLOW THESE!)

### 1. Never Commit Sensitive Files

**Already Protected** (in `.gitignore`):
```
.env
.env.local
.env.development.local
.env.production.local
*api-key*
*token*
*secret*
*.key
```

**Verify Protection**:
```bash
# Check if .env is ignored
git check-ignore .env
# Should output: .env

# Verify .env is not tracked
git ls-files | grep .env
# Should output: nothing
```

### 2. Use Environment Variables Properly

**✅ CORRECT**:
```typescript
// In your code
const apiKey = process.env.GOOGLE_API_KEY;
```

**❌ NEVER DO THIS**:
```typescript
// DON'T hardcode keys!
const apiKey = "AIzaSyCjCasVmVYCAoeLcQ8COHkg1Day2Jbgb4M";
```

### 3. Use .env.example for Documentation

Create a template file that CAN be committed:

```bash
# Create .env.example
cat > .env.example << 'EOF'
# Google Gemini AI API Key
# Get yours at: https://makersuite.google.com/app/apikey
GOOGLE_API_KEY=your_key_here

# OpenAI API Key (optional)
OPENAI_API_KEY=your_key_here

# Gemini Model Configuration
GEMINI_MODEL=gemini-1.5-flash-8b

# Cost Control Settings
MAX_OUTPUT_TOKENS=3000
MAX_PLAN_DURATION_DAYS=14
ENABLE_COST_LOGGING=true
EOF

# Commit this template (safe to share)
git add .env.example
git commit -m "Add environment variables template"
```

### 4. Add API Key Restrictions (Google Cloud)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your **new API key**
3. Click **Edit**
4. **Application restrictions**:
   - Select "HTTP referrers (web sites)"
   - Add: `http://localhost:3000/*`
   - Add: `https://your-production-domain.com/*`
5. **API restrictions**:
   - Select "Restrict key"
   - Choose only: "Generative Language API"
6. Save

### 5. Monitor API Usage

1. Set up alerts in [Google Cloud Console](https://console.cloud.google.com/billing)
2. Create budget alerts:
   - Budget: $5/month
   - Alert threshold: 50%, 90%, 100%
   - Email notifications to your email

---

## 🔍 How to Check if Keys Are Exposed

### Check Current Repository

```bash
# Search for potential API keys in files
git grep -i "api[_-]key"
git grep -E "AIza[0-9A-Za-z\\-_]{35}"  # Google API key pattern
git grep -E "sk-[a-zA-Z0-9]{48}"       # OpenAI key pattern

# Search in Git history
git log -S "AIzaSy" --all --pretty=format:"%h %an %ad %s"

# Check what files are tracked
git ls-tree -r HEAD --name-only
```

### Scan with Tools

```bash
# Install gitleaks (security scanner)
brew install gitleaks

# Scan repository
cd /Users/Anchit.Tandon/Desktop/AI\ HUSTLE\ -\ APPS/TH-LifeEngine
gitleaks detect --verbose

# Scan Git history
gitleaks detect --verbose --log-opts="--all"
```

---

## 📋 Post-Fix Checklist

After implementing all fixes, verify:

- [ ] Old API key revoked in Google Cloud
- [ ] New API key created and copied
- [ ] `.env` file updated with new key
- [ ] `.env` is in `.gitignore`
- [ ] `.env` removed from Git history
- [ ] Changes force-pushed to GitHub
- [ ] Vercel environment variables updated
- [ ] API key restrictions enabled
- [ ] Budget alerts configured
- [ ] `.env.example` created and committed
- [ ] Application tested with new key
- [ ] No keys visible in GitHub repository
- [ ] Team members informed (if applicable)

---

## 🧪 Test the Fix

### 1. Test Locally

```bash
# Start development server
npm run dev

# Try generating a plan
# Should work without 403 errors
```

### 2. Verify Environment Variable

```bash
# Check if .env is loaded
node -e "require('dotenv').config(); console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? '✅ Loaded' : '❌ Missing');"
```

### 3. Test API Call

Create a test script:

```typescript
// test-api.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testAPI() {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.error("❌ API key not found");
    return;
  }
  
  console.log("✅ API key loaded");
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
    
    const result = await model.generateContent("Say hello");
    const text = result.response.text();
    
    console.log("✅ API call successful!");
    console.log("Response:", text);
  } catch (error) {
    console.error("❌ API call failed:", error.message);
  }
}

testAPI();
```

Run test:
```bash
npx tsx test-api.ts
```

---

## 🛡️ Prevent Future Leaks

### 1. Pre-Commit Hook

Create `.husky/pre-commit`:

```bash
#!/bin/sh
# Prevent committing sensitive files

# Check for .env files
if git diff --cached --name-only | grep -q "^\.env$"; then
  echo "❌ ERROR: Attempting to commit .env file!"
  echo "Remove it from staging: git reset HEAD .env"
  exit 1
fi

# Scan for API keys
if git diff --cached | grep -qE "(AIza[0-9A-Za-z\\-_]{35}|sk-[a-zA-Z0-9]{48})"; then
  echo "❌ ERROR: Potential API key detected in commit!"
  echo "Remove sensitive data before committing."
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

Make it executable:
```bash
chmod +x .husky/pre-commit
```

### 2. GitHub Secret Scanning

If your repository is on GitHub:

1. Go to **Settings** → **Code security and analysis**
2. Enable **Secret scanning**
3. Enable **Push protection**
4. This will block pushes containing secrets

---

## 📞 If You Need Help

### Google Cloud Support
- [API Key Management](https://console.cloud.google.com/apis/credentials)
- [Billing Dashboard](https://console.cloud.google.com/billing)
- [Support](https://cloud.google.com/support)

### GitHub Support
- [Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)

---

## 🎯 Summary

### What Happened
Your Google API key was committed to Git, pushed to GitHub, and detected by Google's scanning system.

### What You Must Do
1. ✅ Revoke the leaked key immediately
2. ✅ Create a new API key
3. ✅ Update `.env` with new key
4. ✅ Remove key from Git history
5. ✅ Add API key restrictions
6. ✅ Set up monitoring alerts

### Prevention
- Never commit `.env` files
- Use `.env.example` for templates
- Set up pre-commit hooks
- Enable GitHub secret scanning
- Use API key restrictions
- Monitor usage regularly

---

**This is a critical security issue. Please complete all steps immediately!**

**Status**: ⚠️ REQUIRES IMMEDIATE ACTION  
**Priority**: 🔥 HIGHEST  
**Impact**: 🚨 Application is currently broken

---

**Once fixed, your application will work again with the new secure API key!**
