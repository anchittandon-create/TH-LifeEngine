# OpenAI API Setup Guide

## 🎯 Goal
Add OpenAI support to the "Use Custom GPT" feature so it can use either OpenAI (ChatGPT) or Google Gemini for plan generation.

## 📋 Step-by-Step Setup

### Step 1: Get Your OpenAI API Key

1. **Go to OpenAI Platform**: https://platform.openai.com/
2. **Sign up or Log in** to your account
3. **Navigate to API Keys**: 
   - Click on your profile (top right)
   - Select "View API keys" or go to: https://platform.openai.com/api-keys
4. **Create a New Secret Key**:
   - Click "+ Create new secret key"
   - Give it a name (e.g., "TH-LifeEngine")
   - **IMPORTANT**: Copy the key immediately! You won't see it again
   - It will look like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Add the API Key to Your .env File

Open your `.env` file and replace the placeholder:

```bash
# BEFORE:
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY

# AFTER (use your actual key):
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Configure the Model (Optional)

The app is currently configured to use GPT-4o. You can change this based on your needs:

**Current Configuration:**
```bash
NEXT_PUBLIC_LIFEENGINE_GPT_ID=g-690630c1dfe48191b63fc09f8f024ccb
```

**Model Options:**

| Model | Best For | Cost | Speed |
|-------|----------|------|-------|
| `gpt-4o` | Highest quality, detailed plans | $$$ | Slow |
| `gpt-4o-mini` | Good quality, balanced | $$ | Medium |
| `gpt-3.5-turbo` | Quick, basic plans | $ | Fast |

**To change model**, update in `.env`:
```bash
# For GPT-4o (Recommended for best quality)
NEXT_PUBLIC_LIFEENGINE_GPT_ID=gpt-4o

# For GPT-4o-mini (Recommended for cost savings)
NEXT_PUBLIC_LIFEENGINE_GPT_ID=gpt-4o-mini

# For GPT-3.5 Turbo (Cheapest option)
NEXT_PUBLIC_LIFEENGINE_GPT_ID=gpt-3.5-turbo
```

### Step 4: Add Billing to Your OpenAI Account

⚠️ **IMPORTANT**: OpenAI requires a paid account with billing set up:

1. Go to: https://platform.openai.com/settings/organization/billing/overview
2. Click "Add payment method"
3. Add your credit card
4. Set a **monthly usage limit** (recommended: $10-$50/month for hobby projects)
5. Enable billing

**Pricing Reference (as of Nov 2025):**

- **GPT-4o**: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
- **GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **GPT-3.5-turbo**: ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens

**Estimated cost per plan generation:**
- GPT-4o: ~$0.05 - $0.15 per plan
- GPT-4o-mini: ~$0.005 - $0.02 per plan
- GPT-3.5-turbo: ~$0.01 - $0.03 per plan

### Step 5: Restart Your Development Server

After updating `.env`, restart the dev server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 6: Test OpenAI Integration

1. Go to: http://localhost:3001/use-custom-gpt
2. Select a profile and configure plan settings
3. Click "Generate with Custom GPT"
4. Check the terminal logs - you should see:
   ```
   ✅ Using OpenAI provider
   📊 Model: gpt-4o (or your chosen model)
   ```

If OpenAI fails, the app will automatically fall back to Gemini.

## 🔄 How the AI Provider Selection Works

The app uses **intelligent fallback logic**:

```
1. Try OpenAI (if OPENAI_API_KEY is set)
   ↓
2. If OpenAI fails OR key not set → Fall back to Gemini
   ↓
3. If both fail → Show error message
```

### Provider Priority Code:
```typescript
// From: app/api/lifeengine/custom-gpt-generate/route.ts

if (openAiKey) {
  try {
    return await generateWithOpenAI(...);
  } catch (error) {
    console.warn("⚠️ Falling back to Gemini due to OpenAI error.");
  }
}

if (googleKey) {
  return await generateWithGemini(...);
}
```

## 🎛️ Advanced Configuration

### Option 1: Force Use of Specific Provider

To **always use OpenAI** (disable fallback), you can modify the API route:

```typescript
// In app/api/lifeengine/custom-gpt-generate/route.ts
// Remove the try-catch wrapper around generateWithOpenAI
// This will throw errors instead of falling back
```

### Option 2: Cost Optimization

Add usage limits to your `.env`:

```bash
# Maximum output tokens (reduces cost)
MAX_OUTPUT_TOKENS=3000

# Enable cost logging
ENABLE_COST_LOGGING=true
```

### Option 3: Use Both Providers Strategically

**Gemini** (current default):
- ✅ Cheaper (4x less than OpenAI)
- ✅ Good for testing
- ❌ May have less detailed output

**OpenAI** (with this setup):
- ✅ Better quality and detail
- ✅ More reliable JSON formatting
- ❌ More expensive

**Recommendation**: Use Gemini for testing, OpenAI for production plans.

## 🐛 Troubleshooting

### Error: "Invalid API Key"
- ✅ Double-check your API key in `.env`
- ✅ Make sure you copied the full key (starts with `sk-`)
- ✅ Verify key is active on OpenAI platform

### Error: "Insufficient Credits"
- ✅ Add billing to your OpenAI account
- ✅ Add funds or payment method

### Error: "Rate Limited"
- ✅ OpenAI free tier has rate limits
- ✅ Wait a few minutes and try again
- ✅ Consider upgrading to paid tier

### OpenAI Not Being Used (Falls Back to Gemini)
- ✅ Check `.env` file has `OPENAI_API_KEY=sk-...`
- ✅ Restart dev server after updating `.env`
- ✅ Check terminal logs for error messages
- ✅ Verify API key has not expired

### Plan Quality Issues
- ✅ Try upgrading to `gpt-4o` model
- ✅ Check prompt in `lib/lifeengine/promptBuilder.ts`
- ✅ Ensure step-by-step instructions are in prompt

## 📊 Monitoring API Usage

### View OpenAI Usage:
1. Go to: https://platform.openai.com/usage
2. See tokens used, costs, and request counts
3. Set up usage alerts

### View Gemini Usage:
1. Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com
2. Click "Metrics" to see API usage

### Check Terminal Logs:
The app logs token usage and costs:
```
[COST TRACKING] Tokens - Input: 2500, Output: 1800, Total: 4300
[COST TRACKING] Estimated cost: $0.025 (Input: $0.008, Output: $0.017)
```

## ✅ Verification Checklist

After setup, verify:

- [ ] OpenAI API key added to `.env`
- [ ] Billing set up on OpenAI account
- [ ] Model configured in `.env` (default: gpt-4o)
- [ ] Dev server restarted
- [ ] Test generation at `/use-custom-gpt`
- [ ] Check terminal shows "Using OpenAI provider"
- [ ] Generated plan has detailed step-by-step instructions
- [ ] Generated plan has complete nutrition data

## 🔐 Security Notes

- ✅ `.env` is in `.gitignore` (never commit API keys!)
- ✅ Keep API keys secret
- ✅ Set usage limits on both OpenAI and Google Cloud
- ✅ Rotate keys if exposed
- ✅ Use environment variables in production (Vercel)

## 📚 Additional Resources

- **OpenAI API Docs**: https://platform.openai.com/docs
- **OpenAI Pricing**: https://openai.com/pricing
- **OpenAI Playground**: https://platform.openai.com/playground (test prompts)
- **API Key Management**: https://platform.openai.com/api-keys

---

**Last Updated**: November 8, 2025  
**Status**: Ready for setup  
**Next Steps**: Get OpenAI API key and add to `.env`
