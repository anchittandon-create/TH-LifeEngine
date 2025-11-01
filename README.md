# TH+ LifeEngine — PRO Starter Kit (Gemini-first, ChatGPT-mini optional)
**Last updated:** 2025-10-20

This starter is opinionated and production-lean. It includes:
- Full `/lifeengine` surface with modular components
- Strict Zod schemas for the Plan JSON and logs
- Gemini planner + verifier stubs with JSON-mode guidance
- Optional ChatGPT mini coach (feature-flagged)
- API routes (Next.js App Router compatible) using classic `/pages/api` stubs
- Sample catalogs for yoga flows and foods
- Prompt blueprints
- **🚀 Auto-deployment pipeline** with Vercel integration

## Domain Configuration
This application is configured to run on `anchit-ai-hustle.work.gd` with the path structure `/application/TH_LifeEngine/`.

**Production URL:** `https://anchit-ai-hustle.work.gd/application/TH_LifeEngine/`

The configuration includes:
- `basePath` set to `/application/TH_LifeEngine` in `next.config.js`
- Environment variable `NEXT_PUBLIC_BASE_URL` for external links
- Automatic path handling for all internal navigation and API routes

## 🚀 Auto-Deployment Setup

This project includes automatic git deployment that triggers Vercel builds on every change.

### Initial Setup

```bash
# Run the setup script to configure auto-deployment
./setup-deployment.sh
```

### Available Commands

#### Development with Auto-Deployment

```bash
# Start dev server with automatic deployment on changes
npm run dev:auto
```

This runs the Next.js dev server and automatically commits/pushes changes every 5 seconds when files are modified.

#### Manual Deployment

```bash
# Build and deploy automatically
npm run build:deploy

# Deploy current changes only
npm run deploy
```

#### Standard Commands (with auto-deploy after build)

```bash
npm run build  # Automatically deploys after successful build
npm run dev    # Standard dev server (no auto-deploy)
```

### How It Works

1. **File Changes Detected**: The system monitors for changes every 5 seconds
2. **Automatic Commit**: Changes are staged, committed with timestamp
3. **Git Push**: Pushed to the configured remote branch
4. **Vercel Trigger**: Git push automatically triggers Vercel deployment
5. **Live Updates**: Your app updates automatically on Vercel

### Requirements

- Git repository initialized and linked to GitHub
- Vercel project connected to your GitHub repo
- SSH keys configured for git push (no password prompts)

## Quickstart

1. Create app & install deps

   ```bash
   npx create-next-app@latest th-lifeengine --ts --eslint --src-dir --app
   cd th-lifeengine
   npm i zod axios @google/generative-ai firebase firebase-admin swr pdf-lib formidable
   # Optional (coach mini):
   npm i openai
   ```

2. Unzip this kit into the repo root (merge folders).
3. Copy `.env.example` to `.env.local` and fill keys.
4. Run setup script: `./setup-deployment.sh`
5. Start with auto-deployment: `npm run dev:auto`

## 🤖 Custom GPT Integration (NEW!)

Generate personalized wellness plans using ChatGPT's Custom GPT - **no OpenAI API costs in your app!**

### Features
- ✨ Beautiful plan generation through ChatGPT interface
- 🎯 No API usage charges (GPT calls your endpoints)
- 🔒 Rate limiting & security built-in (15 req/15sec)
- 📊 Store plans in-memory (upgrade to DB later)
- 🎨 Beautiful UI with gradient backgrounds

### Quick Start

1. **Visit the interface:**
   ```
   http://localhost:3000/use-custom-gpt
   ```

2. **Create your Custom GPT** (5 minutes):
   - Follow the complete guide in `CUSTOM_GPT_SETUP.md`
   - Copy/paste all configurations (system prompt, schema, etc.)
   - Update OpenAPI server URL with your deployment URL

3. **Set environment variable:**
   ```bash
   cp .env.local.example .env.local
   # Add your GPT share URL:
   NEXT_PUBLIC_LIFEENGINE_GPT_URL="https://chatgpt.com/g/YOUR_GPT_ID"
   ```

4. **Deploy and test:**
   ```bash
   npm run build:deploy
   # Visit /use-custom-gpt and test the flow!
   ```

### API Endpoints (v1)
- `GET /api/v1/profiles/[id]` - Fetch demo profiles (ritika-001, demo-002)
- `POST /api/v1/plans` - Store GPT-generated plans
- `GET /api/v1/plans/latest?profile_id=X` - Get latest plan by profile

### Documentation
- `CUSTOM_GPT_SETUP.md` - Complete setup guide (600+ lines)
- `CUSTOM_GPT_QUICK_START.md` - Quick reference
- `IMPLEMENTATION_COMPLETE.md` - Implementation summary

### Demo Profiles Available
- `ritika-001` - 34F, Mumbai, weight loss + PCOS, high stress
- `demo-002` - 28M, Bangalore, core strength, motivated

### User Flow
```
1. User opens /use-custom-gpt
2. Clicks "Open Custom GPT" → ChatGPT opens
3. Says: "Use profile_id ritika-001 and generate a combined plan"
4. GPT fetches profile → generates plan → stores it
5. User clicks "Refresh Latest Plan"
6. Beautiful plan preview appears! 🎉
```

---

## Feature Flags (env or Denmark)

- LIFEENGINE_ENABLED=true
- LIFEENGINE_ROLLOUT_PERCENT=10
- LIFEENGINE_COACH_MINI_ENABLED=false
- NEXT_PUBLIC_LIFEENGINE_GPT_URL=""  # Your Custom GPT share link
