# TH+ LifeEngine — PRO Starter Kit (Gemini-first, ChatGPT-mini optional)
**Last updated:** 2025-10-17

This starter is opinionated and production-lean. It includes:
- Full `/lifeengine` surface with modular components
- Strict Zod schemas for the Plan JSON and logs
- Gemini planner + verifier stubs with JSON-mode guidance
- Optional ChatGPT mini coach (feature-flagged)
- API routes (Next.js App Router compatible) using classic `/pages/api` stubs
- Sample catalogs for yoga flows and foods
- Prompt blueprints

## Domain Configuration
This application is configured to run on `anchit-ai-hustle.work.gd` with the path structure `/application/TH_LifeEngine/`.

**Production URL:** `https://anchit-ai-hustle.work.gd/application/TH_LifeEngine/`

The configuration includes:
- `basePath` set to `/application/TH_LifeEngine` in `next.config.js`
- Environment variable `NEXT_PUBLIC_BASE_URL` for external links
- Automatic path handling for all internal navigation and API routes

## Quickstart
1) Create app & install deps
```bash
npx create-next-app@latest th-lifeengine --ts --eslint --src-dir --app
cd th-lifeengine
npm i zod axios @google/generative-ai firebase firebase-admin swr pdf-lib formidable
# Optional (coach mini):
npm i openai
```
2) Unzip this kit into the repo root (merge folders).
3) Copy `.env.example` to `.env.local` and fill keys.
4) `npm run dev`

## Feature Flags (env or Denmark)
- LIFEENGINE_ENABLED=true
- LIFEENGINE_ROLLOUT_PERCENT=10
- LIFEENGINE_COACH_MINI_ENABLED=false
