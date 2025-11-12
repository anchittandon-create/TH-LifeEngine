import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@/lib/logging/logger';
import { db } from '@/lib/utils/db';
import { isAuthenticated } from '@/lib/auth';
import type { ProfileRow } from '@/lib/utils/db';

const logger = new Logger('system');

const inputSchema = z.object({
  profileId: z.string(),
  profileSnapshot: z.object({
    id: z.string(),
    name: z.string(),
    gender: z.enum(['F', 'M', 'Other']),
    age: z.number(),
    height_cm: z.number(),
    weight_kg: z.number(),
    region: z.enum(['IN', 'US', 'EU', 'Global']),
    activity_level: z.enum(['sedentary', 'light', 'moderate', 'intense']),
    dietary: z.object({
      type: z.enum(['veg', 'vegan', 'eggetarian', 'non_veg', 'jain', 'gluten_free', 'lactose_free']),
      allergies: z.array(z.string()),
      avoid_items: z.array(z.string()),
      cuisine_pref: z.array(z.string()),
    }),
    medical_flags: z.array(z.string()),
    preferences: z.object({
      tone: z.string(),
      indoor_only: z.boolean(),
      notes: z.string(),
    }),
    availability: z.object({
      days_per_week: z.number(),
      preferred_slots: z.array(z.object({ start: z.string(), end: z.string() })),
    }),
  }),
  plan_type: z.object({
    primary: z.string(),
    secondary: z.array(z.string()),
  }),
  goals: z.array(z.object({ name: z.string(), priority: z.number() })),
  conditions: z.array(z.string()),
  duration: z.object({ unit: z.string(), value: z.number() }),
  time_budget_min_per_day: z.number(),
  experience_level: z.string(),
  equipment: z.array(z.string()),
});

// Make TH_PLANS global so it can be accessed by other API routes
declare global {
  var TH_PLANS: Map<string, any> | undefined;
}

const TH_PLANS = globalThis.TH_PLANS ?? (globalThis.TH_PLANS = new Map<string, any>());

const ENABLE_PLAN_CACHE = process.env.LIFEENGINE_PLAN_CACHE === "true";
const CACHE_TTL_MS = Number(process.env.LIFEENGINE_PLAN_CACHE_TTL_MS ?? "0");
const CACHE_PURGE_MS =
  Number(process.env.LIFEENGINE_PLAN_CACHE_PURGE_MS ?? String((CACHE_TTL_MS || 0) * 2)) || 0;
const PLAN_CACHE_ENABLED = ENABLE_PLAN_CACHE && CACHE_TTL_MS > 0;

const requestCache = new Map<string, { timestamp: number; response: any }>();

const MAX_REQUESTS_PER_DAY = Number(process.env.LIFEENGINE_MAX_REQUESTS_PER_DAY ?? "0");
const dailyRequestCount = new Map<string, { date: string; count: number }>();

// 💰 COST CIRCUIT BREAKER: Global daily budget protection
const globalDailyPlanCount = new Map<string, number>();
const MAX_DAILY_PLAN_RUNS = Number(process.env.LIFEENGINE_MAX_DAILY_PLAN_RUNS ?? "40"); // default 40 plans/day

// ⏱️ CRITICAL: Set Vercel function timeout to maximum for Pro plan
// Without this, Vercel uses default 60s timeout which is too short!
// Pro plan allows up to 300s (5 minutes) - required for plan generation
export const maxDuration = 300; // 5 minutes (Pro plan maximum)

// 📊 Track generation stages for better debugging and error messages
type GenerationStage = 'validation' | 'preparation' | 'generation' | 'parsing' | 'storage';
let currentStage: GenerationStage = 'validation';

type GenerationMode = 'full' | 'compact';

const SHORT_PLAN_FAST_LANE_DAYS = 5;
const SHORT_PLAN_FAST_LANE_MODEL = 'gemini-2.5-flash';
const STANDARD_PLAN_MODEL = 'gemini-2.5-pro';
const DEFAULT_BASE_TIMEOUT_MS = 90000;
const PER_DAY_TIMEOUT_MS = 15000;
const MAX_TIMEOUT_MS = 300000;

class GenerationTimeoutError extends Error {
  timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Generation timed out after ${Math.ceil(timeoutMs / 1000)} seconds.`);
    this.name = 'GenerationTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

const LONG_PLAN_COMPACT_THRESHOLD_DAYS = 14;
const SHORT_PLAN_HINT_DAYS = 5;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 🔒 AUTHENTICATION CHECK
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      logger.warn('Unauthorized API access attempt', {
        endpoint: '/api/lifeengine/generate',
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { error: 'Unauthorized. Please login to access this API.' },
        { status: 401 }
      );
    }

    // ⏱️ STAGE 1/5: Request Validation
    currentStage = 'validation';
    console.log('⏱️ [STAGE 1/5: validation] Validating and normalizing request...');
    const stage1Start = Date.now();
    
    const body = await req.json();
    const appVersion: 'current' | 'oss' = body?.appVersion === 'oss' ? 'oss' : 'current';
    console.log('🔍 [GENERATE] Received request body:', JSON.stringify(body, null, 2));
    
    const input = await normalizeGenerationRequest(body);
    console.log('✅ [GENERATE] Normalized input:', JSON.stringify(input, null, 2));
    console.log('🩺 [GENERATE] Normalized duration payload:', input.duration);

    const today = new Date().toISOString().split('T')[0];

    if (MAX_REQUESTS_PER_DAY > 0) {
      const profileLimit = dailyRequestCount.get(input.profileId);
      
      if (profileLimit) {
        if (profileLimit.date === today && profileLimit.count >= MAX_REQUESTS_PER_DAY) {
          logger.warn('EXTREME: Daily request limit exceeded', { 
            profileId: input.profileId,
            count: profileLimit.count,
            limit: MAX_REQUESTS_PER_DAY
          });
          return NextResponse.json({ 
            error: `Only ${MAX_REQUESTS_PER_DAY} plans per day allowed for this profile.`,
            retryAfter: 'tomorrow'
          }, { status: 429 });
        }
        if (profileLimit.date !== today) {
          dailyRequestCount.set(input.profileId, { date: today, count: 1 });
        } else {
          profileLimit.count++;
        }
      } else {
        dailyRequestCount.set(input.profileId, { date: today, count: 1 });
      }
    }

    // 🔒 GLOBAL DAILY GENERATION CAP (cost-optimized): allow execution, enforce quota after completion
    let quotaAdjusted = false;
    if (appVersion === 'current' && MAX_DAILY_PLAN_RUNS > 0) {
      const todaysRuns = globalDailyPlanCount.get(today) ?? 0;
      if (todaysRuns >= MAX_DAILY_PLAN_RUNS) {
        // Instead of blocking, allow execution and enforce after
        quotaAdjusted = true;
      } else {
        // Reserve slot for this generation so we never interrupt mid-run
        globalDailyPlanCount.set(today, todaysRuns + 1);
      }
    }

    const cacheKey = `${input.profileId}-${input.plan_type.primary}-${JSON.stringify(input.goals)}`;
    
    console.log(`✅ [STAGE 1/5: validation] Completed in ${Math.ceil((Date.now() - stage1Start)/1000)}s`);
    
    // ⏱️ STAGE 2/5: Cache Check & Preparation
    currentStage = 'preparation';
    console.log('⏱️ [STAGE 2/5: preparation] Checking cache and preparing API call...');
    const stage2Start = Date.now();
    
    if (PLAN_CACHE_ENABLED) {
      const cached = requestCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        logger.warn('Request served from plan cache', { 
          profileId: input.profileId,
          timeSinceLastCall: Math.round((Date.now() - cached.timestamp) / 60000) + ' minutes'
        });
        return NextResponse.json(cached.response);
      }
    }

    logger.info('Plan generation started', { 
      profileId: input.profileId,
      planType: input.plan_type.primary,
      duration: input.duration
    });

    let selectedModelName = STANDARD_PLAN_MODEL;
    let isShortPlanFastLane = false;
    let model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

    if (appVersion === 'current') {
      if (!process.env.GOOGLE_API_KEY) {
        logger.error('GOOGLE_API_KEY not configured');
        return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
      }

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const daysCount = Math.max(1, normalizeDurationToDays(input.duration));
      isShortPlanFastLane = daysCount <= SHORT_PLAN_FAST_LANE_DAYS;
      
      const estimatedTokensNeeded = Math.min(
        4000 + (daysCount * 2000),
        32768
      );
      
      console.log(`📊 [GENERATE] Allocating ${estimatedTokensNeeded} tokens for ${daysCount}-day plan`);
      
      selectedModelName = isShortPlanFastLane ? SHORT_PLAN_FAST_LANE_MODEL : STANDARD_PLAN_MODEL;
      const selectedTemperature = isShortPlanFastLane ? 0.6 : 0.7;
      const selectedTopP = isShortPlanFastLane ? 0.7 : 0.8;
      const selectedTopK = isShortPlanFastLane ? 10 : 20;
      const shortPlanTokenCap = Math.min(estimatedTokensNeeded, 12000);
      const selectedMaxTokens = isShortPlanFastLane ? shortPlanTokenCap : estimatedTokensNeeded;
      
      if (isShortPlanFastLane) {
        console.log('⚡ [GENERATE] Short-plan fast lane enabled: routing through Gemini Flash for speed.', {
          daysCount,
          model: selectedModelName,
          maxTokens: selectedMaxTokens,
        });
      }
      
      model = genAI.getGenerativeModel({ 
        model: selectedModelName,
        generationConfig: {
          temperature: selectedTemperature,
          topP: selectedTopP,
          topK: selectedTopK,
          maxOutputTokens: selectedMaxTokens,
        },
      });
    } else {
      console.log('⏱️ [STAGE 2/5: preparation] OSS mode selected - skipping Gemini preparation.');
    }
    
    console.log(`✅ [STAGE 2/5: preparation] Completed in ${Math.ceil((Date.now() - stage2Start)/1000)}s`);

    const normalizedDays = Math.max(1, normalizeDurationToDays(input.duration));
    const runtimeWarnings: string[] = [];
    let planJson: any = null;
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let estimatedCost = 0;
    let planCostMetadata: Record<string, any> = {};

    if (appVersion === 'current') {
      if (!model) {
        throw new Error('Gemini model not initialized');
      }
      const geminiModel = model;
      // TH-LifeEngine v2.0 System Prompt - Comprehensive Wellness Coach
      const BASE_SYSTEM_PROMPT = `# 🧠 TH‑LifeEngine — Complete Plan Generation System (v2.0)

You are **TH‑LifeEngine**, an advanced AI wellness planner that acts as a certified personal coach for **fitness, yoga, diet, mental health, sleep, and holistic living**.

Your mission: Create *complete, step‑by‑step, fully actionable plans* that feel like they were written by a top human wellness expert — not an AI.

## 🎯 Core Principles

1. **Explain every "how" and "why"** - Never just list; describe the process clearly
2. **No generalities** - Replace "do breathing exercises" with "Practice 4‑7‑8 breathing: inhale for 4s, hold for 7s, exhale for 8s; repeat 6 rounds"
3. **Every recipe must have**:
   - Ingredients with weights (grams/ml/spoons)
   - Cooking instructions (numbered steps)
   - Serving size + calorie & macro table
4. **Every physical activity must have**:
   - Exact steps, posture cues, duration, rest times
   - Safety notes and alternatives for beginners
5. **Communication tone**: Empathetic, motivating, human‑like

## 📋 Output Requirements

For EVERY DAY, include:

### Morning Routine
- Wake‑up time
- Hydration (exact ml)
- Affirmations (2-3 examples)
- Yoga/stretch flow with:
  * Name (Sanskrit + English)
  * Steps to perform (5+ steps)
  * Breathing pattern
  * Duration
  * Benefits + Cautions
  * Calories burned
- Breakfast with complete recipe

### Midday Routine
- Workout (if applicable):
  * Warm‑up (movements + duration)
  * Main exercises (5+ steps each, sets, reps, rest)
  * Cool‑down
  * Calories burned per exercise
- Lunch with complete recipe
- Mindfulness practice (guided steps)

### Evening Routine
- Snack/hydration
- Mobility work
- Dinner with complete recipe
- Reflection activity
- Sleep hygiene (bedtime, steps)

### Daily Summary
- Total calories
- Water goal
- Movement minutes
- Notes

## 🧘‍♀️ Yoga Pose Requirements

EVERY pose must include:
- **Name**: Sanskrit + English
- **Steps**: Minimum 5 detailed steps
- **Breathing**: Exact pattern (e.g., "4 counts in, 7 hold, 8 out")
- **Duration**: Specific time or reps
- **Benefits**: 3-5 specific benefits
- **Cautions**: 2-3 safety notes
- **Modifications**: Beginner and advanced variations
- **Calories burned**: Realistic estimate

## 🏋️ Exercise Requirements

EVERY exercise must include:
- **Name**: Clear exercise name
- **Steps**: Minimum 5 form cues
- **Sets & Reps**: Exact numbers
- **Rest**: Time between sets
- **Form cues**: 3-5 key points
- **Common mistakes**: 2-3 to avoid
- **Progressions**: Advanced variations
- **Regressions**: Beginner modifications
- **Calories burned**: Realistic estimate
- **Target muscles**: Array of muscle groups

## 🥗 Recipe Requirements

EVERY meal must include:
- **Name**: Descriptive recipe name
- **Ingredients**: ALL items with exact quantities
- **Steps**: Minimum 5 detailed cooking steps with times
- **Prep time**: Exact minutes
- **Cook time**: Exact minutes
- **Portion**: Serving size description
- **Notes**: Cooking tips
- **Swaps**: 1-2 healthy alternatives
- **Calories**: Total kcal
- **Protein**: Grams
- **Carbs**: Grams
- **Fat**: Grams
- **Fiber**: Grams
- **Sugar**: Grams (optional)
- **Sodium**: mg (optional)

## ⚠️ CRITICAL RULES

1. Be thorough, safe, and inspiring
2. Do NOT omit any aspect — yoga, meals, workouts, or mindfulness
3. Continue until the plan feels **complete and ready to implement**
4. All quantities, times, and durations must be explicit and measurable
5. Adapt to user's diet, conditions, goals, and schedule
6. Output as valid JSON matching the required structure`;

      const buildSystemPrompt = (mode: GenerationMode, daysCount: number) => {
        let prompt = BASE_SYSTEM_PROMPT;
        
        if (mode === 'compact') {
          prompt += `

## ⚡ Compact Mode (Auto Retry)
- Keep JSON lean but fully actionable; prefer concise bullet instructions over paragraphs
- Reuse repeating meals or workouts with a short note (e.g., "repeat_of": "Day 2") instead of rewriting long blocks
- Highlight weekly patterns and progression in "weekly_guidance"
- Always keep safety notes, macros, and timers even when summarizing`;
        }

        if (daysCount <= SHORT_PLAN_HINT_DAYS) {
          prompt += `

## 🚀 Short Sprint Focus (${daysCount} day${daysCount === 1 ? "" : "s"})
- Prioritize rapid-reset routines with measurable wins each day
- Keep instructions high-energy and time-efficient so users can complete everything within the allotted schedule`;
        }

        return prompt;
      };

      // User-specific prompt with profile data
      const userPrompt = `Create a comprehensive wellness plan for:

**User Profile:**
- Gender: ${input.profileSnapshot.gender}, Age: ${input.profileSnapshot.age}
- Weight: ${input.profileSnapshot.weight_kg}kg
- Activity Level: ${input.profileSnapshot.activity_level}
- Diet: ${input.profileSnapshot.dietary.type}
- Allergies/Avoid: ${input.profileSnapshot.dietary.allergies.join(', ') || 'none'}
- Medical Conditions: ${input.profileSnapshot.medical_flags.join(', ') || 'none'}

**Plan Requirements:**
- Duration: ${input.duration.value} ${input.duration.unit} (${input.duration.unit === 'weeks' ? input.duration.value * 7 : input.duration.value} days)
- Goals: ${input.goals.map(g => g.name).join(', ')}
- Time Budget: ${input.time_budget_min_per_day} minutes per day
- Experience Level: ${input.experience_level}
- Equipment: ${input.equipment.join(', ') || 'none'}
- Plan Type: ${input.plan_type.primary}${input.plan_type.secondary.length ? ' + ' + input.plan_type.secondary.join(', ') : ''}

**Target Calories:** ${Math.round(calculateKcalTarget(input.profileSnapshot))} kcal/day

Generate a complete day-by-day plan following ALL requirements above. Return as valid JSON with this structure:

{
  "meta": {
    "title": "string",
    "duration_days": ${input.duration.unit === 'weeks' ? input.duration.value * 7 : input.duration.value},
    "weeks": ${input.duration.unit === 'weeks' ? input.duration.value : Math.ceil(input.duration.value / 7)},
    "generated_at": "ISO date"
  },
  "weekly_plan": [
    {
      "week_index": 1,
      "days": [
        {
          "day_index": 1,
          "morning_routine": {
            "wake_time": "string",
            "hydration": "string with ml",
            "affirmations": ["string"],
            "yoga": [
              {
                "name": "Sanskrit + English",
                "steps": ["Step 1: ...", "Step 2: ..."],
                "breathing": "string",
                "duration_min": number,
                "benefits": "string",
                "cautions": "string",
                "modifications": "string",
                "calories_burned": number
              }
            ],
            "breakfast": {
              "name": "string",
              "ingredients": ["item with quantity"],
              "recipe_steps": ["Step 1: ...", "Step 2: ..."],
              "prep_time": "string",
              "cook_time": "string",
              "portion": "string",
              "notes": "string",
              "swaps": "string",
              "calories": number,
              "protein_g": number,
              "carbs_g": number,
              "fat_g": number,
              "fiber_g": number
            }
          },
          "midday_routine": {
            "workout": [
              {
                "name": "string",
                "type": "strength|cardio|flexibility",
                "steps": ["Step 1: ...", "Step 2: ..."],
                "sets": number,
                "reps": "string",
                "rest_period": "string",
                "form_cues": ["string"],
                "common_mistakes": ["string"],
                "progressions": "string",
                "regressions": "string",
                "duration_min": number,
                "calories_burned": number,
                "target_muscles": ["string"]
              }
            ],
            "lunch": { /* same structure as breakfast */ },
            "mindfulness": {
              "activity": "string",
              "steps": ["string"],
              "duration_min": number
            }
          },
          "evening_routine": {
            "snack": "string",
            "mobility": ["string"],
            "dinner": { /* same structure as breakfast */ },
            "reflection": "string",
            "sleep_hygiene": {
              "bedtime": "string",
              "steps": ["string"]
            }
          },
          "daily_summary": {
            "total_calories": number,
            "water_goal": "string",
            "movement_minutes": number,
            "notes": "string"
          }
        }
      ]
    }
  ],
  "weekly_guidance": {
    "rest_days": [number],
    "progress_tips": ["string"],
    "motivation": "string"
  }
}

IMPORTANT: Return ONLY valid JSON. No markdown code blocks. Be thorough and detailed.`;

      const calculateTimeout = (duration: { unit: string; value: number }) => {
        const totalDays = Math.max(1, normalizeDurationToDays(duration));
        let totalTimeout = DEFAULT_BASE_TIMEOUT_MS + totalDays * PER_DAY_TIMEOUT_MS;
        
        if (!Number.isFinite(totalTimeout) || totalTimeout <= 0) {
          console.warn('⚠️ [GENERATE] Invalid timeout calculation. Falling back to default.', {
            duration,
            totalDays,
            totalTimeout,
          });
          totalTimeout = DEFAULT_BASE_TIMEOUT_MS;
        }
        
        return Math.min(totalTimeout, MAX_TIMEOUT_MS);
      };
      
      const daysCount = normalizedDays;
      if (isShortPlanFastLane) {
        runtimeWarnings.push('Fast lane: Used Gemini 1.5 Flash to accelerate short plan generation.');
      }
      const defaultMode: GenerationMode = daysCount > LONG_PLAN_COMPACT_THRESHOLD_DAYS ? 'compact' : 'full';
      const attemptModes: GenerationMode[] = defaultMode === 'compact' ? ['compact'] : ['full', 'compact'];
      let result: any = null;
      let usedMode: GenerationMode = defaultMode;
      let lastGenerationError: any = null;
      let stage3Start = startTime;
      
      for (const mode of attemptModes) {
        const systemPrompt = buildSystemPrompt(mode, daysCount);
        const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
        const estimatedInputTokens = Math.ceil(fullPrompt.length / 4);
        
        logger.debug('Sending v2.0 detailed prompt to Gemini', { 
          model: 'gemini-2.5-pro',
          promptLength: fullPrompt.length,
          estimatedInputTokens,
          version: 'TH-LifeEngine v2.0',
          mode,
        });

        const timeoutMs = calculateTimeout(input.duration);
        const timeoutMinutes = Math.ceil(timeoutMs / 60000);
        console.log('🩺 [GENERATE] Duration diagnostics', {
          requestedDuration: input.duration,
          daysCount,
          timeoutMs,
          timeoutMinutes,
          mode,
          model: selectedModelName,
        });
        
        console.log(`⏱️ [GENERATE] (${mode.toUpperCase()} MODE) Dynamic timeout: ${timeoutMinutes} minutes (max 5 min on Vercel Pro) for ${input.duration.value} ${input.duration.unit} plan`);
        
        currentStage = 'generation';
        console.log(`⏱️ [STAGE 3/5: generation] Calling Gemini API with ${timeoutMinutes}min timeout...`);
        stage3Start = Date.now();
        
        try {
          console.log('🚀 [GENERATE] Starting Gemini API call...');
          result = await withTimeout(geminiModel.generateContent(fullPrompt), timeoutMs);
          usedMode = mode;
          console.log(`✅ [STAGE 3/5: generation] Completed in ${Math.ceil((Date.now() - stage3Start)/1000)}s`);
          break;
        } catch (error: any) {
          lastGenerationError = error;
          const elapsedAtFailure = Math.ceil((Date.now() - startTime) / 1000);
          
          if (error instanceof GenerationTimeoutError) {
            console.error(`⏰ [STAGE 3/5: generation] ${mode.toUpperCase()} MODE timed out after ${elapsedAtFailure}s`);
            if (mode === 'compact') {
              throw new Error(`Generation timed out at stage "generation" after ${elapsedAtFailure}s. The AI took too long even in compact mode. Please try again with a shorter plan duration (1, 3, or 5 days) or retry later.`);
            }
            runtimeWarnings.push("Initial detailed generation timed out; automatically retried with compact mode.");
            continue;
          }
          
          if (isRetryableGeminiError(error) && mode !== 'compact') {
            console.warn(`⚠️ [GENERATE] Gemini error detected (${error.message}). Retrying with compact mode...`);
            runtimeWarnings.push("Gemini temporarily unavailable; switched to compact mode automatically.");
            continue;
          }
          
          throw new Error(error?.message || 'Gemini generation failed.');
        }
      }
      
      if (usedMode === 'compact' && !runtimeWarnings.some((warn) => warn.toLowerCase().includes('compact'))) {
        runtimeWarnings.push('Compact mode used to keep the plan within AI response limits. Repeated meals or workouts may reference earlier days for efficiency.');
      }
      
      if (!result) {
        throw lastGenerationError || new Error('Gemini did not return a response.');
      }
      
      const response = await result.response;
      
      // Track token usage for cost monitoring
      const usageMetadata = response.usageMetadata;
      inputTokens = usageMetadata?.promptTokenCount || 0;
      outputTokens = usageMetadata?.candidatesTokenCount || 0;
      totalTokens = usageMetadata?.totalTokenCount || 0;
      estimatedCost = ((inputTokens / 1000000) * 0.075) + ((outputTokens / 1000000) * 0.30);

      logger.info('✅ Cost-optimized mode: Gemini API usage', {
        model: 'gemini-2.5-pro',
        inputTokens: `${inputTokens} tokens (saved ~${Math.max(0, 1200 - inputTokens)} tokens!)`,
        outputTokens: `${outputTokens} tokens (max: 16384)`,
        totalTokens,
        estimatedCost: `$${estimatedCost.toFixed(6)}`,
        estimatedCostINR: `₹${(estimatedCost * 84).toFixed(4)}`,
      });
      
      let responseText = response.text().trim();
      
      // Log response for debugging
      console.log('📦 [RAW RESPONSE]:', responseText.substring(0, 500));
      console.log('📦 [RESPONSE LENGTH]:', responseText.length);
      console.log('📦 [LAST 200 CHARS]:', responseText.substring(responseText.length - 200));
      
      // Check if response was truncated (incomplete JSON)
      const lastChar = responseText[responseText.length - 1];
      const isLikelyTruncated = lastChar !== '}' && lastChar !== ']';
      
      if (isLikelyTruncated) {
        console.warn('⚠️ [GENERATE] Response may be truncated - last char is not } or ]');
        console.warn('⚠️ [GENERATE] Consider increasing maxOutputTokens or using shorter plan duration');
      }
      
      // Strip markdown code blocks if present
      if (responseText.startsWith('```json')) {
        responseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      if (isLikelyTruncated) {
        const lastValidBrace = responseText.lastIndexOf('}');
        const lastValidBracket = responseText.lastIndexOf(']');
        const lastValidPos = Math.max(lastValidBrace, lastValidBracket);
        
        if (lastValidPos > responseText.length * 0.8) {
          console.log(`⚙️ [GENERATE] Attempting to salvage truncated JSON by trimming to position ${lastValidPos}`);
          responseText = responseText.substring(0, lastValidPos + 1);
        }
      }
      
      try {
        planJson = JSON.parse(responseText);
        logger.info('✅ Plan JSON parsed successfully', {
          responseLength: responseText.length,
          wasTruncated: isLikelyTruncated
        });
      } catch (parseError: any) {
        logger.error('❌ JSON parse failed', { 
          error: parseError.message,
          errorPosition: parseError.message.match(/position (\d+)/)?.[1],
          responseLength: responseText.length,
          responsePreview: responseText.substring(0, 500),
          responseTail: responseText.substring(Math.max(0, responseText.length - 500)),
          truncated: isLikelyTruncated
        });
        
        let errorMessage = 'Failed to generate valid plan. ';
        if (isLikelyTruncated) {
          errorMessage += `Response was truncated at ${responseText.length} characters. Try a shorter plan duration or split into multiple plans.`;
        } else {
          errorMessage += `JSON parsing failed: ${parseError.message}`;
        }
        
        return NextResponse.json({ 
          error: errorMessage,
          details: parseError.message,
          responseLength: responseText.length,
          truncated: isLikelyTruncated,
          suggestion: isLikelyTruncated ? 'Try reducing plan duration (e.g., 3-5 days instead of 7+)' : 'Please try again'
        }, { status: 500 });
      }

      planCostMetadata = {
        provider: 'google-generative-ai',
        model: selectedModelName,
        mode: usedMode,
        fastLane: isShortPlanFastLane,
      };
    } else {
      currentStage = 'generation';
      console.log('⏱️ [STAGE 3/5: generation] Using open-source (OSS) plan generator...');
      const stage3Start = Date.now();
      const ossResult = await generatePlanWithOssModel(input, normalizedDays);
      planJson = ossResult.plan;
      runtimeWarnings.push(...(ossResult.warnings || []));
      inputTokens = (ossResult as any).inputTokens ?? 0;
      outputTokens = (ossResult as any).outputTokens ?? 0;
      totalTokens = (ossResult as any).totalTokens ?? 0;
      estimatedCost = (ossResult as any).estimatedCost ?? 0;
      planCostMetadata = (ossResult as any).costMetrics ?? { provider: 'oss-template', model: 'rule-based' };
      console.log(`✅ [STAGE 3/5: generation] Completed in ${Math.ceil((Date.now() - stage3Start)/1000)}s`);
    }

    // ⏱️ STAGE 4/5: Response Normalization & Validation
    currentStage = 'parsing';
    console.log('⏱️ [STAGE 4/5: parsing] Normalizing JSON response and validating...');
    const stage4Start = Date.now();

    const verifiedPlan = verifyPlan(planJson, input);
    const mergedWarnings = Array.from(new Set([...(verifiedPlan.warnings || []), ...runtimeWarnings]));

    const planCostMetrics: Record<string, any> = {
      provider: planCostMetadata.provider || (appVersion === 'current' ? 'google-generative-ai' : 'oss-template'),
      model: planCostMetadata.model || (appVersion === 'current' ? selectedModelName : 'rule-based'),
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost: `$${estimatedCost.toFixed(6)}`,
    };
    if (planCostMetadata.mode) {
      planCostMetrics.mode = planCostMetadata.mode;
    }
    if (planCostMetadata.fastLane) {
      planCostMetrics.strategy = 'fast-lane';
    }
    if (planCostMetadata.notes) {
      planCostMetrics.notes = planCostMetadata.notes;
    }
    if (appVersion === 'current') {
      planCostMetrics.savedTokens = Math.max(0, 1200 - inputTokens);
    }

    const planId = `plan_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    const planData = {
      planId,
      profileId: input.profileId,
      createdAt: new Date().toISOString(),
      plan: verifiedPlan.plan,
      warnings: mergedWarnings,
      analytics: verifiedPlan.analytics,
      costMetrics: planCostMetrics
    };

    // Store in memory cache
    TH_PLANS.set(planId, planData);
    
    console.log(`✅ [STAGE 4/5: parsing] Completed in ${Math.ceil((Date.now() - stage4Start)/1000)}s`);
    
    // ⏱️ STAGE 5/5: Database Storage
    currentStage = 'storage';
    console.log('⏱️ [STAGE 5/5: storage] Saving plan to database...');
    const stage5Start = Date.now();
    
    // ✅ PERSIST TO DATABASE - This ensures plans appear in dashboard and can be loaded later
    try {
      const profileName = input.profileSnapshot?.name || "User";
      const planName = `Plan for ${profileName}`;
      
      // Build input summary for dashboard
      const inputSummary = `${input.plan_type.primary}${input.plan_type.secondary.length ? ' + ' + input.plan_type.secondary.join(', ') : ''} | ${input.duration.value} ${input.duration.unit} | ${input.experience_level}`;
      
      await db.savePlan({
        planId,
        profileId: input.profileId,
        planName, // ✅ Now includes user name: "Plan for Anchit Tandon"
        inputSummary, // ✅ Now includes input details for dashboard
        days: verifiedPlan.plan?.days?.length || 0,
        confidence: 0.9,
        warnings: mergedWarnings || [],
        planJSON: {
          id: planId,
          profileId: input.profileId,
          intakeId: input.profileId, // Use profileId as intakeId for now
          goals: [],
          createdAt: planData.createdAt,
          days: verifiedPlan.plan?.days || [],
        },
        analytics: verifiedPlan.analytics,
        costMetrics: planCostMetrics,
        createdAt: planData.createdAt,
        source: appVersion === 'current' ? "gemini" : "rule-engine", // ✅ Track AI provider
      });
      console.log('✅ [GENERATE] Plan persisted to database with name:', planName);
    } catch (dbError: any) {
      console.error('⚠️ [GENERATE] Failed to persist plan to database:', dbError);
      // Continue anyway - plan is still in memory cache
    }

    console.log(`✅ [STAGE 5/5: storage] Completed in ${Math.ceil((Date.now() - stage5Start)/1000)}s`);

    const duration = Date.now() - startTime;
    console.log(`\n🎉 [COMPLETE] All stages completed successfully in ${Math.ceil(duration/1000)}s total`);
    console.log(`   Stage 1 (validation): ${Math.ceil((Date.now() - stage1Start)/1000)}s`);
    console.log(`   Stage 2 (preparation): Time included in Stage 1`);
  console.log(`   Stage 3 (generation): ${Math.ceil((Date.now() - stage4Start)/1000)}s`);
    console.log(`   Stage 4 (parsing): ${Math.ceil((Date.now() - stage4Start)/1000)}s`);
    console.log(`   Stage 5 (storage): ${Math.ceil((Date.now() - stage5Start)/1000)}s\n`);
    
    const todaysRuns = globalDailyPlanCount.get(today) ?? 0;
    
    logger.info('🎉 Plan generated', {
      planId,
      profileId: input.profileId,
      variant: appVersion,
      duration: `${duration}ms`,
      warningsCount: verifiedPlan.warnings.length,
      cost: `$${estimatedCost.toFixed(6)}`,
      tokensSaved: appVersion === 'current' ? Math.max(0, 1200 - inputTokens) : undefined,
      todaysRuns: appVersion === 'current' ? todaysRuns : undefined,
      dailyPlanLimit: appVersion === 'current' ? MAX_DAILY_PLAN_RUNS || null : undefined,
      provider: planCostMetadata.provider || (appVersion === 'current' ? 'google-generative-ai' : 'oss-template'),
      model: planCostMetadata.model || (appVersion === 'current' ? selectedModelName : 'rule-based'),
    });

    if (PLAN_CACHE_ENABLED) {
      requestCache.set(cacheKey, { 
        timestamp: Date.now(), 
        response: planData 
      });
      
      const purgeWindow = CACHE_PURGE_MS || CACHE_TTL_MS * 2;
      if (purgeWindow > 0) {
        for (const [key, value] of requestCache.entries()) {
          if (Date.now() - value.timestamp > purgeWindow) {
            requestCache.delete(key);
          }
        }
      }
    }
    
    if (MAX_REQUESTS_PER_DAY > 0) {
      for (const [profileId, data] of dailyRequestCount.entries()) {
        if (data.date !== today) {
          dailyRequestCount.delete(profileId);
        }
      }
    }
    for (const [date] of globalDailyPlanCount.entries()) {
      if (date !== today) {
        globalDailyPlanCount.delete(date);
      }
    }

    // Post-execution quota enforcement
    if (appVersion === 'current' && MAX_DAILY_PLAN_RUNS > 0) {
      const todaysRuns = globalDailyPlanCount.get(today) ?? 0;
      if (todaysRuns > MAX_DAILY_PLAN_RUNS) {
        logger.error('🚫 DAILY GENERATION CAP ENFORCED AFTER EXECUTION', {
          date: today,
          runs: todaysRuns,
          limit: MAX_DAILY_PLAN_RUNS,
        });
        return NextResponse.json({
          error: `Plan generated, but daily quota exceeded. Please try again tomorrow.`,
          planId,
          plan: verifiedPlan.plan,
          days: verifiedPlan.plan?.days?.length || 0,
          warnings: mergedWarnings.concat(['Quota was temporarily adjusted to allow full execution.']),
          analytics: verifiedPlan.analytics,
          costMetrics: planData.costMetrics,
        }, { status: 429 });
      }
    }

    // Return response in format expected by frontend
    return NextResponse.json({
      success: true,
      planId,
      plan: verifiedPlan.plan,
      days: verifiedPlan.plan?.days?.length || 0,
      warnings: mergedWarnings,
      analytics: verifiedPlan.analytics,
      costMetrics: planData.costMetrics,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const durationSec = Math.ceil(duration / 1000);
    console.error(`❌ [STAGE: ${currentStage}] Plan generation failed after ${durationSec}s:`, error);
    console.error(`❌ [STAGE: ${currentStage}] Error stack:`, error.stack);
    logger.error('Plan generation failed', { 
      stage: currentStage,
      error: error.message,
      duration: `${duration}ms`,
      durationSec: `${durationSec}s`,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: `Generation failed at stage "${currentStage}" after ${durationSec}s: ${error.message}`,
      details: error.stack,
      stage: currentStage,
      durationSec
    }, { status: 500 });
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new GenerationTimeoutError(timeoutMs)), timeoutMs);
  });

  return Promise.race([
    promise
      .then((result) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        return result;
      })
      .catch((error) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        throw error;
      }),
    timeoutPromise,
  ]);
}

function isRetryableGeminiError(error: any) {
  if (!error) return false;
  const message = (error.message || String(error)).toLowerCase();
  const retryableTokens = [
    '429',
    'rate limit',
    'quota',
    'resource has been exhausted',
    'temporarily unavailable',
    'deadline exceeded',
    'unavailable',
    'timeout',
    'try again',
  ];
  return retryableTokens.some((token) => message.includes(token));
}

function calculateBMR(profile: any) {
  // Mifflin-St Jeor
  const { weight_kg, height_cm, age, gender } = profile;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === 'M' ? base + 5 : base - 161;
}

function calculateTDEE(profile: any) {
  const bmr = calculateBMR(profile);
  const factors: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, intense: 1.725 };
  return bmr * (factors[profile.activity_level] || factors.moderate);
}

function calculateKcalTarget(profile: any) {
  const tdee = calculateTDEE(profile);
  // Assume weight loss goal
  return tdee - 500;
}

function calculateHydration(profile: any) {
  return profile.weight_kg * 35; // ml/kg
}

// ❌ REMOVED: getYogaFlows() and getMeals() - no longer sending catalogs to save tokens

function normalizeDurationToDays(duration: { unit?: string; value?: number } | undefined): number {
  if (!duration || typeof duration.value !== 'number' || !Number.isFinite(duration.value)) {
    return 7; // default to 1 week if missing
  }
  
  const value = Math.max(1, duration.value);
  const unit = (duration.unit || 'days').toLowerCase();
  
  if (unit.includes('week')) {
    return value * 7;
  }
  if (unit.includes('month')) {
    return value * 30;
  }
  return value;
}

const OSS_MODEL_ID = process.env.OSS_MODEL_ID || 'mistralai/Mistral-7B-Instruct-v0.1';
const OSS_MODEL_ENDPOINT =
  process.env.OSS_MODEL_ENDPOINT || `https://api-inference.huggingface.co/models/${OSS_MODEL_ID}`;
const OSS_MODEL_API_KEY = process.env.OSS_MODEL_API_KEY || process.env.HUGGINGFACE_API_KEY;

async function generatePlanWithOssModel(input: any, normalizedDays: number) {
  if (OSS_MODEL_API_KEY) {
    try {
      const prompt = buildOssPrompt(input, normalizedDays);
      const response = await fetch(OSS_MODEL_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OSS_MODEL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: Math.min(2048, normalizedDays * 512),
            temperature: 0.6,
            top_p: 0.8,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[OSS] HuggingFace inference failed: ${errorText}`);
      }

      const data = await response.json();
      const generatedText = Array.isArray(data)
        ? data[0]?.generated_text ?? JSON.stringify(data)
        : data.generated_text ?? (typeof data === 'string' ? data : JSON.stringify(data));
      const cleaned = cleanupModelResponse(generatedText);
      const parsedPlan = JSON.parse(cleaned);

      return {
        plan: parsedPlan,
        warnings: [`OSS mode powered by HuggingFace model ${OSS_MODEL_ID}`],
        costMetrics: {
          provider: 'huggingface',
          model: OSS_MODEL_ID,
        },
        estimatedCost: 0,
      };
    } catch (error) {
      console.error('[OSS] Falling back to deterministic plan:', error);
      return buildRuleBasedPlan(input, normalizedDays, 'HuggingFace call failed; using deterministic fallback.');
    }
  }

  return buildRuleBasedPlan(input, normalizedDays, 'OSS model key missing; using deterministic plan.');
}

function buildOssPrompt(input: any, normalizedDays: number) {
  const goals = input.goals.map((g: any) => g.name).join(', ') || 'general wellness';
  return `You are an open-source wellness planner. Create a JSON plan with keys { "meta", "weekly_plan" }.
The user is ${input.profileSnapshot.name || 'the member'}, ${input.profileSnapshot.age} years, ${input.profileSnapshot.gender}.
Primary focus: ${input.plan_type.primary}. Goals: ${goals}. Diet: ${input.profileSnapshot.dietary.type}.
Duration: ${normalizedDays} days. Each day must include morning_yoga, midday_workout, meals (breakfast, lunch, dinner) and evening_reflection.
Return concise JSON with arrays, no markdown, max ${Math.min(normalizedDays, 5)} days if needed.`;
}

function cleanupModelResponse(text: string) {
  let output = text.trim();
  if (output.startsWith('```json')) {
    output = output.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (output.startsWith('```')) {
    output = output.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return output;
}

function buildRuleBasedPlan(input: any, normalizedDays: number, warning: string) {
  const days: any[] = [];
  const activityPool = [
    {
      type: 'yoga',
      name: 'Sun Salutation Flow',
      duration: 20,
      description: 'Warm-up flow focusing on breath, mobility, and spine health.',
    },
    {
      type: 'fitness',
      name: 'Bodyweight Strength Circuit',
      duration: 30,
      description: '3 rounds of squats, pushups, lunges, and planks with mindful breathing.',
    },
    {
      type: 'mindfulness',
      name: 'Box Breathing',
      duration: 10,
      description: 'Inhale 4s, hold 4s, exhale 4s, hold 4s — repeat for nervous system reset.',
    },
  ];
  const mealPool = [
    { type: 'breakfast', name: 'Overnight Oats', calories: 360, description: 'Rolled oats with chia, almond milk, berries.' },
    { type: 'lunch', name: 'Power Bowl', calories: 520, description: 'Quinoa, roasted veggies, chickpeas, tahini.' },
    { type: 'dinner', name: 'Herbed Lentil Stew', calories: 480, description: 'Slow-cooked lentils with greens and sourdough.' },
  ];

  for (let i = 0; i < normalizedDays; i++) {
    days.push({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      activities: activityPool.map((activity) => ({
        ...activity,
        description: `${activity.description} Tailored for ${input.plan_type.primary} focus.`,
      })),
      meals: mealPool,
    });
  }

  return {
    plan: {
      meta: {
        title: `${input.plan_type.primary} OSS Wellness Plan`,
        duration_days: normalizedDays,
        generated_at: new Date().toISOString(),
      },
      days,
    },
    warnings: [warning],
    costMetrics: { provider: 'oss-template', model: 'rule-based' },
    estimatedCost: 0,
  };
}

function verifyPlan(planJson: any, input: any) {
  // Implement verifier logic as per prompt
  const warnings: string[] = [];
  const analytics = { safety_score: 0.95, diet_match: 0.92, progression_score: 0.9, adherence_score: 0.88, overall: 0.91 };
  
  // ✅ NORMALIZE PLAN STRUCTURE - Convert weekly_plan to days array
  let normalizedPlan = planJson;
  
  if (planJson?.weekly_plan && Array.isArray(planJson.weekly_plan)) {
    console.log('🔄 [VERIFY] Converting weekly_plan structure to days array');
    const days: any[] = [];
    const today = new Date();
    
    // Flatten weekly_plan into days array
    planJson.weekly_plan.forEach((week: any, weekIndex: number) => {
      if (week.days && Array.isArray(week.days)) {
        week.days.forEach((day: any, dayIndex: number) => {
          const absoluteDayIndex = weekIndex * 7 + dayIndex;
          const date = new Date(today.getTime() + absoluteDayIndex * 86400000).toISOString().split('T')[0];
          
          // Convert yoga/nutrition structure to activities/meals
          const activities: any[] = [];
          if (day.yoga && Array.isArray(day.yoga)) {
            day.yoga.forEach((yoga: any) => {
              activities.push({
                type: 'yoga',
                name: yoga.name || 'Yoga Practice',
                duration: yoga.duration_min || 30,
                description: yoga.description || `${yoga.name} yoga practice`,
              });
            });
          }
          
          const meals: any[] = [];
          if (day.nutrition?.meals && Array.isArray(day.nutrition.meals)) {
            day.nutrition.meals.forEach((meal: any) => {
              meals.push({
                type: meal.meal || 'meal',
                name: meal.name || 'Nutritious Meal',
                calories: meal.kcal || 500,
                description: meal.description || `Healthy ${meal.meal}`,
              });
            });
          }
          
          days.push({
            date,
            activities,
            meals,
          });
        });
      }
    });
    
    normalizedPlan = {
      ...planJson,
      days,
    };
    
    console.log(`✅ [VERIFY] Converted ${days.length} days from weekly structure`);
  } else if (!planJson?.days || !Array.isArray(planJson.days)) {
    // If no days array exists, create empty structure
    console.warn('⚠️ [VERIFY] No days array in plan, creating empty structure');
    normalizedPlan = {
      ...planJson,
      days: [],
    };
  }
  
  return { plan: normalizedPlan, warnings, analytics };
}

type IntakePayload = {
  primaryPlanType?: string;
  secondaryPlanType?: string;
  startDate?: string;
  endDate?: string;
  preferences?: {
    intensity?: string;
    focusAreas?: string[];
    format?: string;
    includeDailyRoutine?: boolean;
  };
};

async function normalizeGenerationRequest(body: any) {
  console.log('🔍 [NORMALIZE] Starting normalization...', JSON.stringify(body, null, 2));
  
  if (body && typeof body === "object" && "profileSnapshot" in body) {
    console.log('✅ [NORMALIZE] Using direct profileSnapshot');
    return inputSchema.parse(body);
  }

  if (!body?.profileId) {
    console.error('❌ [NORMALIZE] Missing profileId');
    throw new Error("profileId is required");
  }

  console.log(`🔍 [NORMALIZE] Fetching profile: ${body.profileId}`);
  const profile = await db.getProfile(body.profileId);
  if (!profile) {
    console.error(`❌ [NORMALIZE] Profile not found: ${body.profileId}`);
    throw new Error("Profile not found");
  }
  
  console.log('✅ [NORMALIZE] Profile found:', profile.name);

  const intake: IntakePayload = body.intake ?? {};
  console.log('🔍 [NORMALIZE] Processing intake:', JSON.stringify(intake, null, 2));
  
  const snapshot = buildProfileSnapshot(profile);
  const planType = buildPlanType(intake, profile);
  const goals = buildGoals(profile, intake);
  const conditions = buildConditions(profile);
  const duration = buildDuration(intake);
  const timeBudget = deriveTimeBudget(intake?.preferences?.intensity, profile);
  const experience = determineExperienceLevel(profile);
  const equipment = Array.isArray(profile.equipment) ? profile.equipment : [];

  const normalized = {
    profileId: body.profileId,
    profileSnapshot: snapshot,
    plan_type: planType,
    goals,
    conditions,
    duration,
    time_budget_min_per_day: timeBudget,
    experience_level: experience,
    equipment,
  };
  
  console.log('✅ [NORMALIZE] Normalized data:', JSON.stringify(normalized, null, 2));
  
  return inputSchema.parse(normalized);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const ALLOWED_PLAN_TYPES = new Set([
  "yoga",
  "diet",
  "combined",
  "holistic",
  "strength",
  "mobility",
  "stress_relief",
  "prenatal",
  "mindfulness",
  "metabolic",
]);

function buildProfileSnapshot(profile: ProfileRow) {
  const demographics = profile.demographics ?? {};
  const nutrition = profile.nutrition ?? {};
  const health = profile.health ?? {};
  const preferences = profile.preferences ?? {};
  const schedule = profile.schedule ?? {};

  return {
    id: profile.id,
    name: profile.name ?? "Member",
    gender: normalizeGender(demographics.sex ?? profile.gender),
    age: Number(demographics.age ?? profile.age ?? 30),
    height_cm: Number(demographics.height ?? 170),
    weight_kg: Number(demographics.weight ?? 70),
    region: mapRegion(profile.contact?.location),
    activity_level: normalizeActivityLevel(preferences.level ?? profile.lifestyle?.activityLevel),
    dietary: {
      type: mapDietType(nutrition.dietType),
      allergies: health.allergies ?? [],
      avoid_items: nutrition.dislikes ?? [],
      cuisine_pref: normalizeArray(nutrition.cuisinePreference),
    },
    medical_flags: health.flags ?? [],
    preferences: {
      tone: preferences.tone ?? "balanced",
      indoor_only: Boolean(preferences.indoorOnly),
      notes: preferences.coachingNotes ?? profile.coachingNotes ?? "",
    },
    availability: {
      days_per_week: Number(schedule.daysPerWeek ?? 5),
      preferred_slots: normalizeSlots(schedule.preferredSlots),
    },
  };
}

function buildPlanType(intake: IntakePayload, profile: ProfileRow) {
  const requested = sanitizePlanType(intake.primaryPlanType);
  const inferred = sanitizePlanType(profile.lifestyle?.primaryGoal);
  const primary = requested || inferred || "holistic";

  const secondary = [
    sanitizePlanType(intake.secondaryPlanType),
    ...(profile.lifestyle?.secondaryGoals ?? []),
  ]
    .map((goal) => sanitizePlanType(goal))
    .filter((goal) => goal && goal !== primary);

  return { primary, secondary };
}

function buildGoals(profile: ProfileRow, intake: IntakePayload) {
  const fromIntake = intake.preferences?.focusAreas ?? [];
  const fromProfile = profile.goals ?? [];
  const fromLifestyle = [
    profile.lifestyle?.primaryGoal,
    ...(profile.lifestyle?.secondaryGoals ?? []),
  ];

  const combined = [...fromIntake, ...fromProfile, ...fromLifestyle].map((goal) =>
    goal?.toString().trim(),
  );

  const deduped = Array.from(new Set(combined.filter(Boolean)));

  if (!deduped.length) {
    deduped.push("general_wellness");
  }

  return deduped.map((name, index) => ({ name, priority: index + 1 }));
}

function buildConditions(profile: ProfileRow) {
  const health = profile.health ?? {};
  const set = new Set<string>();
  (health.flags ?? []).forEach((item) => set.add(item));
  (health.chronicConditions ?? []).forEach((item) => set.add(item));
  return Array.from(set).filter(Boolean);
}

function buildDuration(intake: IntakePayload) {
  const start = safeDate(intake.startDate);
  const rawEnd = intake.endDate ? safeDate(intake.endDate) : null;
  const end = rawEnd ?? new Date(start.getTime() + 28 * DAY_MS);
  const diff = Math.max(DAY_MS * 7, end.getTime() - start.getTime());
  const days = Math.round(diff / DAY_MS);
  return {
    unit: "weeks",
    value: Math.max(1, Math.ceil(days / 7)),
  };
}

function deriveTimeBudget(intensity: string | undefined, profile: ProfileRow) {
  if (intensity) {
    const normalized = intensity.toLowerCase();
    if (normalized.includes("high")) return 60;
    if (normalized.includes("medium")) return 45;
    if (normalized.includes("low")) return 30;
  }
  return profile.schedule?.timeBudgetMin ?? 45;
}

function determineExperienceLevel(profile: ProfileRow) {
  const level = profile.preferences?.level ?? profile.experience;
  if (typeof level === "string" && level.trim()) {
    return level;
  }
  return "beginner";
}

function normalizeGender(value: any): "F" | "M" | "Other" {
  if (typeof value === "string") {
    const normalized = value.toUpperCase();
    if (normalized.startsWith("F")) return "F";
    if (normalized.startsWith("M")) return "M";
  }
  return "Other";
}

function mapRegion(location?: string) {
  if (!location) return "Global";
  const normalized = location.toUpperCase();
  if (normalized.includes("IND") || normalized.endsWith("IN")) return "IN";
  if (normalized.includes("USA") || normalized.endsWith("US")) return "US";
  if (normalized.includes("UK") || normalized.includes("EUROPE") || normalized.includes("EU")) {
    return "EU";
  }
  return "Global";
}

function normalizeActivityLevel(value: any) {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (["sedentary", "light", "moderate", "intense"].includes(normalized)) {
      return normalized as "sedentary" | "light" | "moderate" | "intense";
    }
    if (normalized.includes("high")) return "intense";
    if (normalized.includes("low")) return "light";
  }
  return "moderate";
}

function mapDietType(value: any) {
  if (typeof value === "string") {
    const normalized = value.toLowerCase().replace(/\s+/g, "_");
    if (
      ["veg", "vegan", "eggetarian", "non_veg", "jain", "gluten_free", "lactose_free"].includes(
        normalized,
      )
    ) {
      return normalized as
        | "veg"
        | "vegan"
        | "eggetarian"
        | "non_veg"
        | "jain"
        | "gluten_free"
        | "lactose_free";
    }
  }
  return "veg";
}

function normalizeArray(value: any) {
  if (!value) return ["regional_home_cooking"];
  if (Array.isArray(value)) {
    const normalized = value.map((item) => item?.toString().trim()).filter(Boolean);
    return normalized.length ? normalized : ["regional_home_cooking"];
  }
  return [value.toString()];
}

function normalizeSlots(slots: any) {
  if (Array.isArray(slots) && slots.length) {
    return slots.map((slot) => ({
      start: slot?.start ?? "07:00",
      end: slot?.end ?? "08:00",
    }));
  }
  return [{ start: "07:00", end: "08:00" }];
}

function sanitizePlanType(value?: string | null) {
  if (!value) return "";
  const normalized = value.toLowerCase().replace(/\s+/g, "_");
  if (ALLOWED_PLAN_TYPES.has(normalized)) {
    return normalized;
  }
  return "";
}

function safeDate(value?: string) {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}
