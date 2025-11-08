# 🔧 Custom GPT API Fix - CRITICAL

**Date**: November 9, 2025  
**Status**: ✅ CODE FIXED - ACTION REQUIRED  
**Priority**: 🚨 HIGH - Requires API Key Rotation

---

## 🐛 Problem Summary

The Custom GPT feature was failing with two critical errors:

### Error 1: Invalid Model ID
```
[404 Not Found] models/g-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx is not found for API version v1beta
```

**Root Cause**: The code was attempting to use a **Custom GPT ID** (`g-xxxxx`) with the OpenAI API. Custom GPT IDs only work in the ChatGPT web interface, NOT via API calls.

### Error 2: Leaked Google API Key
```
[403 Forbidden] Your API key was reported as leaked. Please use another API key.
```

**Root Cause**: The Google API key `AIzaSyA3VncwHTUdilIbn-LuR4mRV1R1boGU0NY` was exposed in git history and reported as compromised by Google.

---

## ✅ Code Fix Applied

### 1. Fixed OpenAI Integration (`app/api/lifeengine/custom-gpt-generate/route.ts`)

**Before** (BROKEN):
```typescript
// Was trying to use OpenAI Responses API with Custom GPT ID
const responsesClient = (client as any).responses;
const response = await responsesClient.create({
  model: "g-690630c1dfe48191b63fc09f8f024ccb", // ❌ This doesn't work!
  input: prompt,
});
```

**After** (FIXED):
```typescript
// Now uses standard Chat Completions API with OpenAI models
const response = await client.chat.completions.create({
  model: "gpt-4o-mini", // ✅ Correct model format
  messages: [
    { role: "system", content: "You are TH_LifeEngine..." },
    { role: "user", content: prompt }
  ],
  response_format: { type: "json_object" }
});
```

### 2. Added Model Validation
```typescript
// Prevent accidental use of Custom GPT IDs
if (model.startsWith('g-')) {
  throw new Error(
    `Invalid model "${model}". Custom GPT IDs (g-xxxxx) cannot be used via API.`
  );
}
```

### 3. Added Cost Tracking
```typescript
// Logs token usage and estimated cost for each API call
console.log(`[COST TRACKING] Tokens - Input: ${inputTokens}, Output: ${outputTokens}`);
console.log(`[COST TRACKING] Estimated cost: $${totalCost.toFixed(6)}`);
```

---

## 🚨 ACTION REQUIRED

### Step 1: Rotate Google API Key (CRITICAL)

Your current Google API key is **compromised and blocked by Google**.

1. **Visit**: https://aistudio.google.com/app/apikey (or https://makersuite.google.com/app/apikey)

2. **Delete the old key**:
   - Find key: `AIzaSyA3VncwHTUdilIbn-LuR4mRV1R1boGU0NY`
   - Click the trash icon to delete it

3. **Create a new key**:
   - Click "Create API Key"
   - Select your Google Cloud project (or create new)
   - Copy the new key (starts with `AIzaSy...`)

4. **Update local .env file**:
   ```bash
   GOOGLE_API_KEY=YOUR_NEW_KEY_HERE
   ```

5. **Update Vercel environment variables**:
   ```bash
   vercel env rm GOOGLE_API_KEY production
   vercel env add GOOGLE_API_KEY production
   # Paste your new key when prompted
   ```

6. **Redeploy**:
   ```bash
   vercel --prod
   ```

### Step 2: Verify OpenAI Configuration

Your `.env` file should have:

```bash
# OpenAI API Key (already set - no change needed)
OPENAI_API_KEY=sk-proj-UepP92Uw...

# OpenAI Model - Standard model, NOT Custom GPT ID
NEXT_PUBLIC_LIFEENGINE_GPT_ID=gpt-4o-mini  # ✅ Correct

# Custom GPT ID - Only for web link button
LIFEENGINE_CUSTOM_GPT_ID=g-690630c1dfe48191b63fc09f8f024ccb  # ✅ Used for button only
```

### Step 3: Test After Deployment

1. Go to: https://th-life-engine.vercel.app/use-custom-gpt
2. Fill out the form and click "Generate with Custom GPT"
3. Should now work with OpenAI (primary) or Gemini (fallback)

---

## 📊 How It Works Now

### API Flow

```
User clicks "Generate with Custom GPT"
    ↓
Frontend calls /api/lifeengine/custom-gpt-generate
    ↓
Backend tries OpenAI first (gpt-4o-mini)
    ↓
If OpenAI fails → Falls back to Gemini
    ↓
Returns JSON plan to frontend
```

### Model Configuration

| Environment Variable | Purpose | Example Value |
|---------------------|---------|---------------|
| `OPENAI_API_KEY` | OpenAI authentication | `sk-proj-xxxxx` |
| `NEXT_PUBLIC_LIFEENGINE_GPT_ID` | **API model name** | `gpt-4o-mini` ✅ |
| `LIFEENGINE_CUSTOM_GPT_ID` | Web link only | `g-690630...` (not used in API) |
| `GOOGLE_API_KEY` | Gemini fallback | `AIzaSy...` (needs rotation) |
| `GEMINI_MODEL` | Gemini model name | `gemini-1.5-flash-8b` |

---

## 💰 Cost Implications

### With gpt-4o-mini (Current Setting)
- **Input**: $0.15 per 1M tokens
- **Output**: $0.60 per 1M tokens
- **Typical 7-day plan**: ~$0.01-$0.02
- **Monthly budget**: $10 = ~500-1000 plans

### Alternative Models

| Model | Cost per Plan | Quality | Speed | Recommendation |
|-------|---------------|---------|-------|----------------|
| `gpt-4o-mini` | $0.01-$0.02 | ⭐⭐⭐⭐ | Fast | ✅ **Best Balance** |
| `gpt-4o` | $0.05-$0.15 | ⭐⭐⭐⭐⭐ | Medium | Premium quality |
| `gemini-1.5-flash-8b` | $0.001-$0.005 | ⭐⭐⭐ | Fast | 🔄 Fallback only |

---

## 🔍 Debugging Tips

### Check Logs in Vercel

1. Visit: https://vercel.com/anchittandon-3589s-projects/th-life-engine
2. Click "Logs" tab
3. Look for:
   ```
   [OpenAI] Generating plan with model: gpt-4o-mini
   [COST TRACKING] Tokens - Input: 1234, Output: 5678
   ```

### Common Errors

#### Error: "Custom GPT IDs (g-xxxxx) cannot be used via API"
**Fix**: Change `NEXT_PUBLIC_LIFEENGINE_GPT_ID` to a standard model like `gpt-4o-mini`

#### Error: "Your API key was reported as leaked"
**Fix**: Follow Step 1 above to rotate your Google API key

#### Error: "OpenAI API key not found"
**Fix**: Verify `OPENAI_API_KEY` is set in Vercel:
```bash
vercel env ls
```

---

## 📝 Summary

### What Changed
- ✅ Switched from OpenAI Responses API → Chat Completions API
- ✅ Added validation to prevent Custom GPT ID mistakes
- ✅ Added cost tracking and logging
- ✅ Improved error messages
- ✅ Updated .env with correct configuration

### What You Need To Do
1. 🔑 **Rotate Google API key** (CRITICAL - current key is blocked)
2. ✅ Commit and deploy the code changes
3. 🧪 Test the Custom GPT feature

### Expected Behavior
- OpenAI (gpt-4o-mini) generates plans successfully
- If OpenAI fails, Gemini fallback works (after key rotation)
- Cost tracking appears in logs
- Plans include detailed step-by-step instructions

---

*Fix documentation created by GitHub Copilot on November 9, 2025*
