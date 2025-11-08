# OpenAI Setup - Quick Start

## ✅ What's Been Configured

Your app is now **ready** for OpenAI integration! Here's what's set up:

### 1. Environment Variables (`.env`)
- ✅ `OPENAI_API_KEY` placeholder added (needs your actual key)
- ✅ `NEXT_PUBLIC_LIFEENGINE_GPT_ID` set to `gpt-4o-mini` (recommended model)
- ✅ Cost control settings configured
- ✅ Fallback to Gemini configured

### 2. AI Provider Priority
```
1st Choice: OpenAI (gpt-4o-mini) 
    ↓ (if fails or no key)
2nd Choice: Google Gemini (gemini-1.5-flash-8b)
    ↓ (if both fail)
Error Message
```

### 3. Cost Settings
- **Max output tokens**: 3000 (controls cost)
- **Model**: gpt-4o-mini (balanced quality/cost)
- **Estimated cost**: $0.005-$0.02 per plan

## 🚀 Next Steps (5 minutes)

### Step 1: Get OpenAI API Key

1. Go to: **https://platform.openai.com/api-keys**
2. Sign up or log in
3. Click "**+ Create new secret key**"
4. Name it "TH-LifeEngine"
5. **Copy the key** (starts with `sk-proj-...`)

### Step 2: Add Billing to OpenAI

⚠️ **REQUIRED** - OpenAI needs a payment method:

1. Go to: **https://platform.openai.com/settings/organization/billing/overview**
2. Click "**Add payment method**"
3. Add your credit card
4. Set **usage limit**: $10-$50/month
5. Enable billing

### Step 3: Update Your .env File

Open `.env` and replace:

```bash
# BEFORE:
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY

# AFTER (paste your actual key):
OPENAI_API_KEY=sk-proj-abc123xyz789...
```

### Step 4: Restart Dev Server

```bash
# Press Ctrl+C to stop current server
npm run dev
```

### Step 5: Test It!

1. Go to: **http://localhost:3001/use-custom-gpt**
2. Select a profile
3. Click "**Generate with Custom GPT**"
4. Check terminal - should see: `✅ Using OpenAI provider`

## 📊 Model Comparison

| Model | Cost/Plan | Quality | Speed | Recommendation |
|-------|-----------|---------|-------|----------------|
| **gpt-4o-mini** ⭐ | $0.005-$0.02 | ⭐⭐⭐⭐ | Fast | **Default (best balance)** |
| gpt-4o | $0.05-$0.15 | ⭐⭐⭐⭐⭐ | Medium | Premium clients |
| gpt-3.5-turbo | $0.01-$0.03 | ⭐⭐⭐ | Fast | Quick tests |
| gemini-flash-8b | $0.002-$0.005 | ⭐⭐⭐ | Fast | Budget (current fallback) |

## 🎛️ Change Model (Optional)

Edit `.env` to change model:

```bash
# For best quality (more expensive):
NEXT_PUBLIC_LIFEENGINE_GPT_ID=gpt-4o

# For balanced (recommended - already set):
NEXT_PUBLIC_LIFEENGINE_GPT_ID=gpt-4o-mini

# For cheapest:
NEXT_PUBLIC_LIFEENGINE_GPT_ID=gpt-3.5-turbo
```

## 🐛 Troubleshooting

### Still using Gemini instead of OpenAI?

**Check:**
1. ✅ API key starts with `sk-proj-` or `sk-`
2. ✅ No quotes around the key in `.env`
3. ✅ Dev server was restarted after editing `.env`
4. ✅ Billing is set up on OpenAI account

**Terminal should show:**
```
✅ Using OpenAI provider
📊 Model: gpt-4o-mini
```

### Error: "Invalid API Key"

- Double-check you copied the full key
- Verify key is active at: https://platform.openai.com/api-keys

### Error: "Insufficient Credits"

- Add payment method at: https://platform.openai.com/settings/organization/billing/overview

### Want to use ONLY Gemini?

Comment out OpenAI key in `.env`:
```bash
# OPENAI_API_KEY=sk-proj-abc123...
```

## 📚 Resources

- **OpenAI Dashboard**: https://platform.openai.com/
- **Usage & Billing**: https://platform.openai.com/usage
- **API Keys**: https://platform.openai.com/api-keys
- **Pricing**: https://openai.com/pricing
- **Full Setup Guide**: See `OPENAI_SETUP_GUIDE.md`

## 💡 Pro Tips

1. **Start with gpt-4o-mini** - Great quality, low cost
2. **Set usage limits** - Protect your wallet
3. **Monitor usage** - Check OpenAI dashboard weekly
4. **Keep Gemini fallback** - Free backup option
5. **Test in dev first** - Don't test in production

## ✅ Checklist

- [ ] Get OpenAI API key
- [ ] Add billing to OpenAI account
- [ ] Set monthly usage limit
- [ ] Update `.env` with real key
- [ ] Restart dev server
- [ ] Test at `/use-custom-gpt`
- [ ] Verify "Using OpenAI provider" in logs
- [ ] Check plan has detailed instructions

---

**Ready to go?** Just add your API key and restart! 🚀
