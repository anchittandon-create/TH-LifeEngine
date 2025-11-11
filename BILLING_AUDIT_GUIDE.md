# 🚨 URGENT: Unexpected Billing Investigation Guide

**Date**: November 11, 2025  
**Issue**: Getting billed even when not using the app

## 🔍 Potential Causes & How to Check

### 1. **Exposed API Endpoints (MOST LIKELY)**

Your AI generation endpoints might be publicly accessible, allowing anyone to call them!

#### Check This Immediately:

**Endpoint 1: Gemini Generation**
```bash
curl https://th-life-engine.vercel.app/api/lifeengine/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": "unauthorized"}'
```

**Endpoint 2: Custom GPT Generation**
```bash
curl https://th-life-engine.vercel.app/api/lifeengine/custom-gpt-generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": "unauthorized"}'
```

**What to look for**:
- ❌ If it returns data or processes → **EXPOSED! This is the problem!**
- ✅ If it returns 401/403 → Protected (not the issue)

### 2. **Check Vercel Logs for Unauthorized Access**

1. Go to: https://vercel.com/anchittandon-create/th-life-engine
2. Click "Analytics" → "Logs"
3. Filter by date range (last 7 days)
4. Look for:
   - `/api/lifeengine/generate` calls
   - `/api/lifeengine/custom-gpt-generate` calls
   - Unusual IP addresses
   - High request counts

**Signs of attack**:
- Multiple requests from same IP
- Requests at odd hours (when you're not using it)
- Requests from foreign countries
- Pattern of automated calls

### 3. **Check Google AI Studio Usage**

1. Go to: https://aistudio.google.com/app/apikey
2. Click on your API key
3. Check "Usage" tab
4. Look for:
   - API calls when you weren't using the app
   - Sudden spikes in usage
   - Total tokens consumed

**Current Model**: `gemini-2.5-pro`  
**Typical Cost**: $0.075 per 1M input tokens, $0.30 per 1M output tokens

### 4. **Check OpenAI Usage** (if enabled)

1. Go to: https://platform.openai.com/usage
2. Check activity for last 30 days
3. Look for:
   - API calls you didn't make
   - Unexpected model usage (gpt-4, gpt-3.5-turbo)

### 5. **Check Vercel Function Invocations**

1. Vercel Dashboard → Project Settings → Usage
2. Check "Function Invocations" graph
3. Look for:
   - Spikes when you weren't using the app
   - Consistent baseline usage (shouldn't be happening)

## 🛡️ IMMEDIATE FIXES

### Fix #1: Add Rate Limiting (Highest Priority)

Create file: `app/api/lifeengine/generate/route.ts`

Add at the top:
```typescript
// Rate limiting per IP
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);
  
  if (!limit || now > limit.resetAt) {
    // New window: allow 5 requests per hour
    rateLimits.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  
  if (limit.count >= 5) {
    return false; // Rate limit exceeded
  }
  
  limit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // Get client IP
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  // Check rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again in 1 hour.' },
      { status: 429 }
    );
  }
  
  // ... rest of your code
}
```

### Fix #2: Add Simple Authentication

Create file: `lib/utils/auth.ts`
```typescript
export function requireAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const validToken = process.env.API_SECRET_TOKEN; // Set in Vercel env vars
  
  if (!validToken) {
    console.warn('⚠️ API_SECRET_TOKEN not set - API is unprotected!');
    return true; // Allow if not configured (backward compatible)
  }
  
  return authHeader === `Bearer ${validToken}`;
}
```

Add to your API routes:
```typescript
import { requireAuth } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
  // Check authentication
  if (!requireAuth(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // ... rest of your code
}
```

### Fix #3: Disable Public Access Temporarily

In Vercel Dashboard:
1. Go to Settings → Environment Variables
2. Add new variable:
   - Key: `MAINTENANCE_MODE`
   - Value: `true`
   - Environments: Production

Then in your API routes:
```typescript
export async function POST(req: NextRequest) {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return NextResponse.json(
      { error: 'API temporarily disabled for maintenance' },
      { status: 503 }
    );
  }
  
  // ... rest of your code
}
```

### Fix #4: Rotate ALL API Keys IMMEDIATELY

**Google AI API Key** (CRITICAL):
1. Go to: https://aistudio.google.com/app/apikey
2. Delete current key
3. Create new key
4. Update in Vercel: Settings → Environment Variables
5. Redeploy

**OpenAI API Key** (if used):
1. Go to: https://platform.openai.com/api-keys
2. Revoke current key
3. Create new key
4. Update in Vercel

## 📊 Cost Analysis

### Current Setup Costs

| Service | Model | Cost Per Request | Risk Level |
|---------|-------|------------------|------------|
| Google Gemini | gemini-2.5-pro | $0.01-0.05 | 🔴 HIGH |
| OpenAI | gpt-4 | $0.50-2.00 | 🔴 CRITICAL |
| Vercel | Function calls | $0.00001 | 🟢 LOW |

**If someone is abusing your API**:
- 100 Gemini calls/day = $1-5/day = $30-150/month
- 100 OpenAI calls/day = $50-200/day = $1,500-6,000/month 💸

## 🔒 Long-Term Security Fixes

### 1. Implement Proper Authentication

Use NextAuth.js or Clerk:
```bash
npm install next-auth
```

### 2. Use Vercel Firewall

Enable in: Vercel Dashboard → Security → Firewall
- Block IPs from suspicious countries
- Set up rate limiting rules
- Enable DDoS protection

### 3. Add Request Logging

```typescript
import { Logger } from '@/lib/logging/logger';

const logger = new Logger('api-security');

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  logger.info('API Request', {
    ip,
    userAgent,
    path: req.nextUrl.pathname,
    timestamp: new Date().toISOString(),
  });
  
  // ... rest of your code
}
```

### 4. Set Up Billing Alerts

**Google Cloud Console**:
1. Go to: https://console.cloud.google.com/billing
2. Click "Budgets & alerts"
3. Create budget alert:
   - Budget: $10/month
   - Alert at: 50%, 90%, 100%
   - Send email notifications

**OpenAI**:
1. Go to: https://platform.openai.com/account/limits
2. Set hard limit: $10/month
3. Set up usage alerts

**Vercel**:
1. Go to: Settings → Usage Alerts
2. Set alert at: 80% of plan limit

## 🕵️ Investigation Checklist

- [ ] Check Vercel logs for unauthorized requests
- [ ] Check Google AI Studio usage graph
- [ ] Check OpenAI usage dashboard
- [ ] Test if API endpoints are publicly accessible
- [ ] Check for unusual IP addresses in logs
- [ ] Review all API calls in last 7 days
- [ ] Check if API keys are exposed in client code
- [ ] Verify environment variables are set correctly
- [ ] Check for any scheduled/cron jobs
- [ ] Review middleware.ts for issues

## 🚨 Emergency Actions

If you confirm unauthorized access:

### Immediate (Do Now):
1. ✅ **Disable API** - Set `MAINTENANCE_MODE=true` in Vercel
2. ✅ **Rotate all API keys** - Google + OpenAI + any others
3. ✅ **Check current costs** - Google Cloud billing + OpenAI
4. ✅ **Set spending limits** - Google Cloud ($5) + OpenAI ($10)
5. ✅ **Enable rate limiting** - 5 requests/hour per IP

### Short Term (Next 24h):
6. ✅ Add authentication to API routes
7. ✅ Review and clean up logs
8. ✅ Block suspicious IPs in Vercel
9. ✅ Add request logging
10. ✅ Set up billing alerts

### Long Term (Next Week):
11. ✅ Implement proper user authentication (NextAuth)
12. ✅ Add API key management system
13. ✅ Set up monitoring dashboard
14. ✅ Add automated security scans
15. ✅ Document security procedures

## 📝 Quick Diagnostic Commands

### Check if API is accessible:
```bash
# Test Gemini endpoint
curl -X POST https://th-life-engine.vercel.app/api/lifeengine/generate \
  -H "Content-Type: application/json" \
  -d '{"profileId":"test","duration":{"unit":"days","value":1}}'

# Test Custom GPT endpoint  
curl -X POST https://th-life-engine.vercel.app/api/lifeengine/custom-gpt-generate \
  -H "Content-Type: application/json" \
  -d '{"profileId":"test","planType":"wellness"}'
```

### Check environment variables:
```bash
vercel env ls --environment production
```

### Check recent deployments:
```bash
vercel list --environment production --limit 10
```

## 💡 Common Billing Issues

### 1. **Exposed API Keys**
- ❌ API keys hardcoded in client code
- ❌ API keys in GitHub (public repo)
- ❌ API keys in browser DevTools

### 2. **No Rate Limiting**
- ❌ Unlimited requests allowed
- ❌ No per-IP restrictions
- ❌ No authentication required

### 3. **Expensive Models**
- ❌ Using gpt-4 instead of gpt-3.5-turbo
- ❌ Using gemini-2.5-pro instead of flash
- ❌ Large token limits (32,768)

### 4. **Automated Attacks**
- ❌ Bots discovering your API
- ❌ Credential stuffing attempts
- ❌ DDoS attacks

### 5. **Forgotten Services**
- ❌ Old API keys still active
- ❌ Test environments running
- ❌ Background jobs/crons

## 🎯 Next Steps

1. **IMMEDIATELY**: Test if your API endpoints are publicly accessible (run curl commands above)
2. **URGENT**: Check Vercel logs for unauthorized access
3. **URGENT**: Rotate all API keys
4. **HIGH**: Add rate limiting to API routes
5. **HIGH**: Set spending limits on Google Cloud and OpenAI
6. **MEDIUM**: Implement proper authentication
7. **MEDIUM**: Set up billing alerts

## 📞 Need Help?

If you find unauthorized access:
1. Document evidence (screenshots of logs, billing)
2. Report to platform (Google Cloud support, OpenAI support)
3. Consider filing abuse report
4. Change ALL credentials immediately

---

## 🔐 Security Checklist Going Forward

- [ ] API keys never in client code
- [ ] All API routes require authentication
- [ ] Rate limiting on all expensive endpoints
- [ ] Spending limits set on all AI providers
- [ ] Billing alerts configured
- [ ] Regular security audits (monthly)
- [ ] Logs reviewed weekly for suspicious activity
- [ ] API keys rotated quarterly
- [ ] Firewall rules enabled
- [ ] DDoS protection active

**Remember**: Even a single unauthorized API call with GPT-4 can cost $1-2. If someone found your endpoint and is hitting it 100 times/day, that's $100-200/day = $3,000-6,000/month! 💸

**Act fast and secure your endpoints immediately!** 🚨
