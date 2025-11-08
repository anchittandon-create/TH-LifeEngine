# 🎉 Custom GPT Feature - Quick Start Guide# TH_LifeEngine Custom GPT Integration - Quick Reference



## What You Just Got## 🎯 What Was Built



A complete **"Use Your Custom GPT"** feature that lets users generate personalized health plans using OpenAI's GPT-4 API, with a beautiful notebook-style interface and PDF export.A complete **Custom GPT integration** that allows users to generate wellness plans through ChatGPT without using OpenAI API in your app.



## 🚀 Get Started in 3 Steps---



### 1️⃣ Get Your OpenAI API Key## 📁 Files Created



Visit: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)### TypeScript Types

- `app/types/lifeengine.ts` - Complete type definitions matching GPT schema

- Click "Create new secret key"

- Copy the key (starts with `sk-proj-...`)### API Endpoints (v1)

- `app/api/v1/profiles/[id]/route.ts` - GET demo profiles

### 2️⃣ Add to .env File- `app/api/v1/plans/route.ts` - POST store plans from GPT

- `app/api/v1/plans/latest/route.ts` - GET latest plan by profile_id

```bash

OPENAI_API_KEY=sk-proj-your_actual_key_here### UI Components

```- `app/components/PlanPreview.tsx` - Beautiful plan renderer with emojis

- `app/use-custom-gpt/page.tsx` - Main UI page with controls

### 3️⃣ Start the Server- `app/privacy/page.tsx` - Privacy policy (required for GPT Actions)



```bash### Configuration

npm run dev- `middleware.ts` - Updated with rate limiting (15 req/15sec)

```- `.env.local.example` - Environment variable template

- `CUSTOM_GPT_SETUP.md` - Comprehensive setup guide

Visit: [http://localhost:3000/custom-gpt/create](http://localhost:3000/custom-gpt/create)

---

## 💰 Billing Setup (Required)

## 🚀 Quick Start

OpenAI requires a payment method even for testing:

### 1. Local Testing (Already Working!)

1. Go to: [https://platform.openai.com/settings/organization/billing/overview](https://platform.openai.com/settings/organization/billing/overview)```bash

2. Add payment method# Server is running on http://localhost:3000

3. Set usage limit: **$10/month** (plenty for testing)# All tests passed ✅

4. Add initial credit: **$5** (will last months)

# Test endpoints:

**Cost per plan**: ~$0.005-$0.02 (half a cent to 2 cents with gpt-4o-mini)curl http://localhost:3000/api/v1/profiles/ritika-001

curl http://localhost:3000/api/v1/plans/latest?profile_id=ritika-001

## ✨ Features```



### 📝 Form Page (`/custom-gpt/create`)### 2. Create Your Custom GPT

Follow `CUSTOM_GPT_SETUP.md` sections:

- Reuses existing PlanForm component- Part 1: Create GPT in ChatGPT (copy/paste all configs)

- Animated loading overlay- Part 2: Deploy app and update GPT Actions URL

- Error handling for API issues- Part 3: Test end-to-end

- GPT-4 branding and styling

### 3. Deploy to Production

### 📖 Notebook Viewer (`/custom-gpt/plan/[id]`)```bash

# Set env var

- Day-by-day navigationecho 'NEXT_PUBLIC_LIFEENGINE_GPT_URL="https://chatgpt.com/g/YOUR_GPT_ID"' > .env.local

- Sidebar with day index and checkboxes

- Beautiful card-based layout# Deploy

- Responsive design (mobile + desktop)git add .

git commit -m "feat: add Custom GPT integration"

### 📥 PDF Exportgit push



- **Download Selected**: Export checked days only# Update GPT Actions with your Vercel URL

- **Download All**: Export entire plan```

- High-quality rendering with html2canvas

- Auto-named files: `CustomGPT_Plan_[Name]_[Date].pdf`---



### 📊 Metadata Display## 🧪 Test Results (All Passing ✅)



- Model used (gpt-4o or gpt-4o-mini)### TypeScript Compilation

- Token usage (input + output)```bash

- Estimated costnpx tsc --noEmit

- Generation time# ✅ No errors

```

## 🎯 User Journey

### API Endpoints

``````bash

1. User fills form → 2. Clicks "Generate Plan"# ✅ GET Profile: Returns ritika-001 JSON

                   ↓# ✅ POST Plan: Returns plan_id

3. Loading overlay (15-30 seconds)# ✅ GET Latest: Returns stored plan

                   ↓# ✅ 404 Handling: Returns error for missing profiles

4. GPT-4 generates plan# ✅ Rate Limiting: Returns 429 after 15 requests

                   ↓```

5. Saved to localStorage

                   ↓### UI

6. Redirects to plan viewer```bash

                   ↓# ✅ Page loads at /use-custom-gpt

7. User reads plan, selects days# ✅ Privacy page loads at /privacy

                   ↓```

8. Downloads as PDF

```---



## 🔧 Technical Stack## 🔑 Key Features



- **Frontend**: Next.js 14, React, TypeScript### Security

- **AI**: OpenAI GPT-4o-mini (default) or GPT-4o- ✅ Rate limiting (15 req per 15 sec per IP)

- **PDF**: jspdf + html2canvas- ✅ Input validation on all endpoints

- **Storage**: localStorage (client-side)- ✅ CORS-ready for GPT Actions

- **Styling**: Tailwind CSS- ✅ Security headers in middleware



## 📁 New Files Created### User Experience

- ✅ Beautiful gradient UI with Tailwind

```- ✅ Emoji-rich plan preview component

lib/openai/- ✅ Loading states and error handling

  ├── client.ts              # OpenAI API wrapper- ✅ Empty state messages

  └── promptBuilder.ts       # Prompt generation

### Architecture

app/api/openai/- ✅ Clean separation: API (v1) vs UI

  └── generate-plan/- ✅ TypeScript-first with strict types

      └── route.ts           # Backend API endpoint- ✅ In-memory storage (upgrade to DB later)

- ✅ RESTful API design

app/custom-gpt/

  ├── create/---

  │   └── page.tsx           # Form page

  └── plan/[id]/## 📊 Available Demo Profiles

      └── page.tsx           # Plan viewer

### ritika-001

app/globals.css              # Added .page-break-after- 34F, Mumbai

```- Goal: Weight loss + anxiety reduction

- PCOS, low sleep (5h), high stress

## 🐛 Common Issues- Vegetarian, evening workouts



### "Invalid API Key"### demo-002

- 28M, Bangalore

```bash- Goal: Core strength + flexibility

# Check your .env file has the real key- Active, motivated, has equipment

OPENAI_API_KEY=sk-proj-your_actual_key_here- 7h sleep, medium stress



# Restart dev server---

npm run dev

```## 🔗 User Flow



### "Insufficient Quota"```

1. User visits: /use-custom-gpt

- Add billing at: [https://platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing)2. Clicks: "Open Custom GPT" → ChatGPT opens

- Add at least $5 credit3. Says: "Use profile_id ritika-001 and generate a combined plan"

4. GPT:

### "Rate Limit Exceeded"   ├─ GET /api/v1/profiles/ritika-001

   ├─ Generates plan with AI

- Free tier: 3 requests/minute   └─ POST /api/v1/plans (stores plan)

- Wait 60 seconds and retry5. User clicks: "Refresh Latest Plan"

- Or upgrade to paid tier (500 req/min)6. App:

   └─ GET /api/v1/plans/latest?profile_id=ritika-001

### Plans Not Saving7. Beautiful plan displays! 🎉

```

```javascript

// Check localStorage in browser console---

localStorage.getItem("custom_gpt_plans");

## 📝 Next Steps

// Clear and retry

localStorage.clear();### Before Creating GPT:

```1. ✅ Deploy app to Vercel

2. ✅ Get production URL

## 💡 Pro Tips3. ✅ Test endpoints are publicly accessible



1. **Use gpt-4o-mini** for development (20x cheaper)### In ChatGPT GPT Builder:

2. **Set usage limits** to avoid surprise bills1. ✅ Copy/paste all configs from `CUSTOM_GPT_SETUP.md`

3. **Check console logs** for debugging (shows tokens + cost)2. ✅ Update OpenAPI schema with your production URL

4. **Test with short plans** first (1 week = fewer tokens)3. ✅ Add privacy policy URL: `https://your-url.vercel.app/privacy`

4. ✅ Test GPT in preview mode

## 📊 Cost Comparison

### After Creating GPT:

| Model | Input | Output | Per Plan | Quality |1. ✅ Copy GPT share URL

|-------|-------|--------|----------|---------|2. ✅ Add to `.env.local` as `NEXT_PUBLIC_LIFEENGINE_GPT_URL`

| gpt-4o-mini | $0.15/1M | $0.60/1M | ~$0.01 | Good |3. ✅ Test end-to-end flow

| gpt-4o | $2.50/1M | $10.00/1M | ~$0.10 | Excellent |4. ✅ Share GPT with users!



**Recommendation**: Start with `gpt-4o-mini`, upgrade to `gpt-4o` if quality isn't sufficient.---



## 🎨 Customization Ideas## 🛠️ Production Upgrades (Future)



### Change Model1. **Database**: Replace `globalThis.__PLANS__` with Supabase/Postgres

2. **Auth**: Add API key authentication for GPT Actions

In `.env`:3. **Real Profiles**: Connect to your existing user profiles

4. **Analytics**: Track plan generation metrics

```bash5. **Rate Limiting**: Move to Redis for distributed apps

# Budget option

OPENAI_MODEL=gpt-4o-mini---



# Best quality## 📚 Documentation Files

OPENAI_MODEL=gpt-4o

- `CUSTOM_GPT_SETUP.md` - Complete setup guide (500+ lines)

# Cheapest (older model)- `.env.local.example` - Environment variable template

OPENAI_MODEL=gpt-3.5-turbo- This file - Quick reference

```

---

### Adjust Token Limit

## ✅ Testing Checklist

In `app/api/openai/generate-plan/route.ts`:

- [x] TypeScript compiles without errors

```typescript- [x] GET /api/v1/profiles/{id} returns profile

max_tokens: 4000,  // More content (higher cost)- [x] POST /api/v1/plans stores and returns plan_id

max_tokens: 2000,  // Less content (lower cost)- [x] GET /api/v1/plans/latest returns latest plan

```- [x] Rate limiting works (429 after 15 req)

- [x] UI page loads at /use-custom-gpt

### Customize Prompt- [x] Privacy page loads at /privacy

- [ ] Deploy to production

In `lib/openai/promptBuilder.ts`:- [ ] Create Custom GPT in ChatGPT

- [ ] Test GPT Actions with production URL

- Edit `buildSystemMessage()` for AI behavior- [ ] End-to-end flow test

- Edit `buildCustomGPTPrompt()` for output format

---

## 🚀 Next Steps (Optional)

## 🎨 UI Preview

1. **Dashboard Page** - Show all saved plans in a table

2. **ZIP Export** - Batch download all days as ZIPVisit: `http://localhost:3000/use-custom-gpt`

3. **Plan Sharing** - Generate shareable URLs

4. **Print Styling** - Better `@media print` CSSFeatures:

5. **Plan Editing** - Let users edit generated content- Gradient background (purple → pink)

- Profile ID input with suggestions

## 📝 Notes- Two action buttons (Open GPT / Refresh Plan)

- Beautiful plan preview with:

- Plans stored locally (not on server)  - Category tags

- API calls happen server-side (secure)  - Daily schedules (yoga/diet/holistic)

- No database required  - Emoji-coded days (🌟 Monday, 💪 Tuesday, etc.)

- Privacy-first design  - Collapsible sections

  - Recovery tips and hydration goals

## ✅ Testing Checklist  - Disclaimer warnings



- [ ] Add OpenAI API key to `.env`---

- [ ] Add billing to OpenAI account

- [ ] Start dev server: `npm run dev`## 🐛 Known Issues

- [ ] Visit `/custom-gpt/create`

- [ ] Fill out form and submitNone! All functionality working as expected. 🎉

- [ ] Wait for generation (~15-30 seconds)

- [ ] View plan in notebook interface---

- [ ] Select days with checkboxes

- [ ] Download as PDF## 💡 Tips

- [ ] Check PDF quality

1. **Custom GPT**: Make sure to replace placeholder URLs before deploying

## 🎉 You're Done!2. **Privacy**: Update email in privacy policy to real contact

3. **Profiles**: Add more demo profiles in `app/api/v1/profiles/[id]/route.ts`

The Custom GPT feature is **fully functional**. Just add your API key and start generating plans!4. **Styling**: All components use Tailwind - easy to customize



For detailed documentation, see: `CUSTOM_GPT_COMPLETE.md`---


## 📞 Support

Check `CUSTOM_GPT_SETUP.md` for detailed troubleshooting guide.

**Ready to deploy! 🚀**
