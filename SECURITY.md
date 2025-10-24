# 🔒 TH-LifeEngine Security Guide

## 🚨 Critical Security Information

### API Keys & Environment Variables

**NEVER commit these to Git:**
- `.env` file (already in .gitignore)
- Google API keys
- Database credentials
- Authentication tokens

### Current Security Status ✅

1. **Environment Variables**: Properly secured in `.env` (gitignored)
2. **API Key Protection**: Google API key removed from tracked files
3. **Git History**: Sensitive data identified in commits (see warning below)
4. **Profile Persistence**: Fixed to use persistent storage
5. **Authentication**: Optional middleware available

---

## ⚠️ IMPORTANT: Git History Warning

API keys were previously committed to git history in these commits:
- `2fed736` - Contains Google API key
- `6cb76bd` - Initial commit

**For production use, you should:**
1. Regenerate your Google API key
2. Consider using `git filter-branch` to clean history (destructive)
3. Use separate API keys for development/production

---

## 🔧 Setup Instructions

### 1. Environment Setup
```bash
# Run the security setup script
./setup-security.sh

# Edit your environment variables
nano .env

# Add your Google API key
GOOGLE_API_KEY=your_actual_api_key_here
```

### 2. Enable Authentication (Optional)
To enable API authentication:
```bash
# Rename the auth middleware
mv middleware-auth.ts middleware.ts

# Set your API key
echo "API_KEY=your-secure-api-key-here" >> .env
```

### 3. Testing with Authentication
```bash
# Test API call with authentication
curl -H "x-api-key: lifeengine-dev-key-2025" \
     http://localhost:3000/api/lifeengine/profiles
```

---

## 🛡️ Security Features

### Cost Protection
- ✅ 24-hour caching prevents duplicates
- ✅ 3 requests per profile per day limit
- ✅ $0.50 daily budget circuit breaker
- ✅ Real-time cost monitoring

### Data Protection
- ✅ Profiles stored in persistent storage
- ✅ No sensitive data in public files
- ✅ Secure environment variable handling

### API Security
- ✅ Optional API key authentication
- ✅ Request validation and sanitization
- ✅ Error handling without data leaks

---

## 📋 Security Checklist

- [x] Remove API keys from tracked files
- [x] Add comprehensive .gitignore rules
- [x] Create secure environment setup
- [x] Fix profile persistence
- [x] Add authentication middleware
- [x] Document security procedures
- [ ] **TODO: Regenerate API keys for production**
- [ ] **TODO: Set up proper authentication in production**

---

## 🚀 Production Deployment

### Environment Variables (Required)
Set these in your hosting platform:

```bash
GOOGLE_API_KEY=your_production_api_key
API_KEY=your_secure_api_key
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
NEXT_TELEMETRY_DISABLED=1
```

### Vercel Deployment
```bash
# Set environment variables
vercel env add GOOGLE_API_KEY
vercel env add API_KEY

# Deploy
vercel --prod
```

---

## 📞 Security Contact

If you discover security issues:
1. DO NOT commit sensitive data
2. Regenerate any exposed keys immediately
3. Review git history for sensitive data
4. Use environment variables for all secrets

**Your API costs are now protected and secure! 🛡️**