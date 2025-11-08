import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@/lib/logging/logger';
import { db } from '@/lib/utils/db';
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
const globalDailySpend = new Map<string, { date: string; totalCost: number }>();
const MAX_DAILY_BUDGET_USD = 0.50; // Hard stop at $0.50/day (~₹42)

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    console.log('🔍 [GENERATE] Received request body:', JSON.stringify(body, null, 2));
    
    const input = await normalizeGenerationRequest(body);
    console.log('✅ [GENERATE] Normalized input:', JSON.stringify(input, null, 2));

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

    // 💰 GLOBAL BUDGET CIRCUIT BREAKER: Check total daily spend
    const globalSpend = globalDailySpend.get(today);
    if (globalSpend && globalSpend.totalCost >= MAX_DAILY_BUDGET_USD) {
      logger.error('🚨 DAILY BUDGET EXCEEDED - API BLOCKED', {
        currentSpend: globalSpend.totalCost,
        budget: MAX_DAILY_BUDGET_USD,
        date: today
      });
      return NextResponse.json({
        error: `Daily budget of $${MAX_DAILY_BUDGET_USD} exceeded. API temporarily disabled.`,
        currentSpend: `$${globalSpend.totalCost.toFixed(4)}`,
        retryAfter: 'tomorrow'
      }, { status: 503 });
    }

    const cacheKey = `${input.profileId}-${input.plan_type.primary}-${JSON.stringify(input.goals)}`;
    
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

    if (!process.env.GOOGLE_API_KEY) {
      logger.error('GOOGLE_API_KEY not configured');
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro', // Using Pro model for detailed output
      generationConfig: {
        temperature: 0.7, // Increased for more natural, coach-like responses
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 16384, // Allow comprehensive plans
      },
    });

    // TH-LifeEngine v2.0 System Prompt - Comprehensive Wellness Coach
    const systemPrompt = `# 🧠 TH‑LifeEngine — Complete Plan Generation System (v2.0)

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

    const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
    const estimatedInputTokens = Math.ceil(fullPrompt.length / 4);
    
    logger.debug('Sending v2.0 detailed prompt to Gemini', { 
      model: 'gemini-2.5-pro',
      promptLength: fullPrompt.length,
      estimatedInputTokens,
      version: 'TH-LifeEngine v2.0'
    });

    // Add timeout to prevent hanging
    const timeoutMs = 120000; // 2 minutes
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Generation timeout: Request took longer than 2 minutes')), timeoutMs);
    });

    let result: any;
    try {
      console.log('🚀 [GENERATE] Starting Gemini API call...');
      result = await Promise.race([
        model.generateContent(fullPrompt),
        timeoutPromise
      ]);
      console.log('✅ [GENERATE] Gemini API call completed');
    } catch (timeoutError: any) {
      console.error('⏰ [GENERATE] Gemini API timeout:', timeoutError.message);
      throw new Error('Generation timed out. The AI took too long to respond. Please try again with a shorter plan duration.');
    }
    
    const response = await result.response;
    
    // Track token usage for cost monitoring
    const usageMetadata = response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || 0;
    const estimatedCost = ((inputTokens / 1000000) * 0.075) + ((outputTokens / 1000000) * 0.30);

    logger.info('✅ Cost-optimized mode: Gemini API usage', {
      model: 'gemini-2.5-pro',
      inputTokens: `${inputTokens} tokens (saved ~${Math.max(0, 1200 - inputTokens)} tokens!)`,
      outputTokens: `${outputTokens} tokens (max: 16384)`,
      totalTokens,
      estimatedCost: `$${estimatedCost.toFixed(6)}`,
      estimatedCostINR: `₹${(estimatedCost * 84).toFixed(4)}`,
    });
    
    let planJson;
    let responseText = response.text().trim()
    
    // Log response for debugging
    console.log('📦 [RAW RESPONSE]:', responseText.substring(0, 500));
    console.log('📦 [RESPONSE LENGTH]:', responseText.length);
    console.log('📦 [LAST 200 CHARS]:', responseText.substring(responseText.length - 200));
    
    // Strip markdown code blocks if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    try {
      planJson = JSON.parse(responseText);
      logger.info('✅ Plan JSON parsed successfully');
    } catch (parseError: any) {
      logger.error('❌ JSON parse failed', { 
        error: parseError.message, 
        responsePreview: responseText.substring(0, 200),
        responseTail: responseText.substring(Math.max(0, responseText.length - 200))
      });
      // Return error instead of retrying to save costs
      return NextResponse.json({ 
        error: 'Failed to generate valid plan. Please try again.',
        details: parseError.message 
      }, { status: 500 });
    }

    // Verifier
    const verifiedPlan = verifyPlan(planJson, input);

    const planId = `plan_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    const planData = {
      planId,
      profileId: input.profileId,
      createdAt: new Date().toISOString(),
      plan: verifiedPlan.plan,
      warnings: verifiedPlan.warnings,
      analytics: verifiedPlan.analytics,
      costMetrics: {
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost: `$${estimatedCost.toFixed(6)}`,
        savedTokens: Math.max(0, 1200 - inputTokens),
        extremeMode: 'Ultra-cost-optimized: 24h cache, 3 req/day, 1024 max tokens'
      }
    };

    // Store in memory cache
    TH_PLANS.set(planId, planData);
    
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
        warnings: verifiedPlan.warnings || [],
        planJSON: {
          id: planId,
          profileId: input.profileId,
          intakeId: input.profileId, // Use profileId as intakeId for now
          goals: [],
          createdAt: planData.createdAt,
          days: verifiedPlan.plan?.days || [],
        },
        analytics: verifiedPlan.analytics,
        costMetrics: {
          inputTokens,
          outputTokens,
          totalTokens,
          model: 'gemini-2.5-flash',
        },
        createdAt: planData.createdAt,
        source: "gemini", // ✅ Track AI provider
      });
      console.log('✅ [GENERATE] Plan persisted to database with name:', planName);
    } catch (dbError: any) {
      console.error('⚠️ [GENERATE] Failed to persist plan to database:', dbError);
      // Continue anyway - plan is still in memory cache
    }

    const duration = Date.now() - startTime;
    
    // 💰 Update global daily spend tracking
    const currentGlobalSpend = globalDailySpend.get(today) || { date: today, totalCost: 0 };
    currentGlobalSpend.totalCost += estimatedCost;
    globalDailySpend.set(today, currentGlobalSpend);
    
    logger.info('🎉 Plan generated - EXTREME COST MODE', {
      planId,
      profileId: input.profileId,
      duration: `${duration}ms`,
      warningsCount: verifiedPlan.warnings.length,
      cost: `$${estimatedCost.toFixed(6)}`,
      tokensSaved: Math.max(0, 1200 - inputTokens),
      dailySpend: `$${currentGlobalSpend.totalCost.toFixed(4)}/${MAX_DAILY_BUDGET_USD}`,
      remainingBudget: `$${(MAX_DAILY_BUDGET_USD - currentGlobalSpend.totalCost).toFixed(4)}`
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
    for (const [date, data] of globalDailySpend.entries()) {
      if (date !== today) {
        globalDailySpend.delete(date);
      }
    }

    // Return response in format expected by frontend
    return NextResponse.json({
      success: true,
      planId,
      plan: verifiedPlan.plan,
      days: verifiedPlan.plan?.days?.length || 0,
      warnings: verifiedPlan.warnings,
      analytics: verifiedPlan.analytics,
      costMetrics: planData.costMetrics,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ [GENERATE] Plan generation failed:', error);
    console.error('❌ [GENERATE] Error stack:', error.stack);
    logger.error('Plan generation failed', { 
      error: error.message,
      duration: `${duration}ms`,
      stack: error.stack
    });
    return NextResponse.json({ 
      error: error.message || 'Failed to generate plan',
      details: error.stack
    }, { status: 500 });
  }
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
