# Cost Optimization Guide - Gemini API

## 🔍 Investigation Summary

**Date:** October 24, 2025  
**Issue:** High API costs for Gemini API usage  
**Root Cause:** Automatic retry logic was doubling API calls on parse failures

---

## ✅ Fixes Implemented

### 1. **Removed Automatic Retry (MAJOR COST SAVER)**
**Before:**
```typescript
try {
  planJson = JSON.parse(response.text());
} catch {
  // Retry - THIS DOUBLES YOUR COST!
  const retryResult = await model.generateContent(prompt);
  planJson = JSON.parse(retryResponse.text());
}
```

**After:**
```typescript
try {
  planJson = JSON.parse(responseText);
} catch (parseError) {
  // Return error instead of retrying
  return NextResponse.json({ 
    error: 'Failed to generate valid plan. Please try again.'
  }, { status: 500 });
}
```

**Impact:** Saves 50% of API costs when JSON parsing fails

---

### 2. **Added Request Throttling**
Prevents duplicate API calls within 5 seconds:

```typescript
const requestCache = new Map<string, { timestamp: number; response: any }>();
const THROTTLE_MS = 5000;

// Check cache before making API call
const cacheKey = `${profileId}-${planType}-${goals}`;
const cached = requestCache.get(cacheKey);
if (cached && (Date.now() - cached.timestamp) < THROTTLE_MS) {
  return NextResponse.json(cached.response); // Return cached result
}
```

**Impact:** Prevents accidental duplicate submissions (e.g., double-clicks)

---

### 3. **Improved JSON Parsing**
Automatically strips markdown code blocks:

```typescript
let responseText = response.text().trim();
if (responseText.startsWith('```json')) {
  responseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
}
```

**Impact:** Reduces parse failures, improves reliability

---

### 4. **Enhanced Logging**
Now tracks:
- Request throttling events
- Parse failures with response preview
- API call duration
- Cache hits/misses

---

## 💰 Cost Breakdown

### Gemini 1.5 Flash Pricing:
- **Input:** $0.075 per 1M tokens (~$0.000075 per 1K tokens)
- **Output:** $0.30 per 1M tokens (~$0.0003 per 1K tokens)

### Typical Plan Generation:
- **System Prompt:** ~200 tokens
- **User Prompt (with profile + catalogs):** ~1,500-2,000 tokens
- **Generated Plan:** ~2,000-3,000 tokens

**Cost per request:**
- Input: 1,700 tokens × $0.000075 = **$0.00013**
- Output: 2,500 tokens × $0.0003 = **$0.00075**
- **Total: ~$0.00088 per plan** (~0.088 cents)

### If Retry Was Triggered (OLD):
- **Double the cost:** ~$0.00176 per failed plan
- **If 50% of requests failed:** Average cost = $0.00132 per plan

### With New Fix:
- **No retries:** $0.00088 per plan (consistent)
- **50% cost reduction on previously failing requests**

---

## 📊 Expected Savings

### Scenario 1: Low Failure Rate (10% parse failures)
- **Old cost:** 900 requests × $0.00088 + 100 retries × $0.00088 = **$0.88**
- **New cost:** 1000 requests × $0.00088 = **$0.88** (same, but faster)
- **Savings:** Mainly in response time and reliability

### Scenario 2: High Failure Rate (50% parse failures)
- **Old cost:** 500 requests × $0.00088 + 500 retries × $0.00176 = **$1.32**
- **New cost:** 1000 requests × $0.00088 = **$0.88**
- **Savings:** **$0.44 per 1000 requests (33% reduction)**

### Scenario 3: With Throttling Benefits
If throttling prevents 100 duplicate calls per day:
- **Daily savings:** 100 × $0.00088 = **$0.088** (~9 cents)
- **Monthly savings:** $0.088 × 30 = **$2.64**

---

## 🛡️ Best Practices Going Forward

### 1. Monitor API Usage
Check your logs regularly:
```bash
# View recent API calls
GET /api/logs?limit=100

# Filter by action
GET /api/logs?action=plan_generation
```

### 2. Optimize Prompts
- Remove unnecessary data from `profileSnapshot`
- Use shorter catalog descriptions
- Consider summarizing medical flags instead of sending full text

### 3. Implement Rate Limiting (Future)
For production, add per-user rate limits:
```typescript
const userRequestCount = new Map<string, number>();
if ((userRequestCount.get(userId) || 0) > 10) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### 4. Use Caching for Similar Requests
If a user regenerates with the same profile/goals:
```typescript
const planCache = new Map<string, any>();
const cacheKey = hashObject({ profileId, goals, duration });
if (planCache.has(cacheKey)) {
  return planCache.get(cacheKey);
}
```

---

## 🔧 Testing the Changes

### Test 1: Normal Plan Generation
```bash
POST /api/lifeengine/generate
{
  "profileId": "test-123",
  "plan_type": { "primary": "yoga", "secondary": [] },
  "goals": [{ "name": "flexibility", "priority": 1 }],
  # ... rest of profile
}
```

**Expected:** Single API call, successful response

### Test 2: Duplicate Request (Within 5 Seconds)
Submit the same request twice quickly.

**Expected:** 
- First call: New plan generated
- Second call: Cached response returned (check logs for "Request throttled")

### Test 3: Invalid Profile Data
Send invalid data to trigger parse error.

**Expected:** Error response without retry (check logs for "JSON parse failed")

---

## 📈 Monitoring Checklist

- [ ] Check daily API costs in Google Cloud Console
- [ ] Review logs for throttled requests
- [ ] Monitor parse failure rate
- [ ] Track average plan generation time
- [ ] Set up alerts for cost spikes (>$5/day)

---

## 🚨 Cost Alerts

**Recommended Budget Alerts:**
- **Warning:** $10/month ($0.33/day)
- **Critical:** $50/month ($1.67/day)

**At 1000 plans/month:**
- Expected cost: ~$0.88/month
- With 20% buffer: ~$1.05/month

**At 10,000 plans/month:**
- Expected cost: ~$8.80/month
- With 20% buffer: ~$10.56/month

---

## ✅ Action Items Completed

- [x] Removed automatic retry logic
- [x] Added request throttling (5-second window)
- [x] Improved JSON parsing with markdown stripping
- [x] Enhanced logging for cost tracking
- [x] Created cost monitoring documentation

---

**Built by GitHub Copilot**  
**Project:** TH+ LifeEngine  
**Repository:** github.com/AT-2803/TH_LifeEngine
