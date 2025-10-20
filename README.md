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

## Feature Flags (env or Denmark)

- LIFEENGINE_ENABLED=true
- LIFEENGINE_ROLLOUT_PERCENT=10
- LIFEENGINE_COACH_MINI_ENABLED=false
