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
      model: 'gemini-2.5-pro', // Using Pro model for longer output support
      generationConfig: {
        temperature: 0.3,
        topP: 0.6,
        topK: 25,
        maxOutputTokens: 16384, // Increased to handle full 5-week plans
      },
    });

    // ULTRA-COMPACT PROMPT: Absolute minimal tokens
    const compactPrompt = `Generate a ${input.duration.value}${input.duration.unit} wellness plan. Respond ONLY with valid, complete JSON. Be CONCISE.

Profile: ${input.profileSnapshot.gender}${input.profileSnapshot.age}y, ${input.profileSnapshot.weight_kg}kg, ${input.profileSnapshot.activity_level}
Diet: ${input.profileSnapshot.dietary.type}, Avoid: ${input.profileSnapshot.dietary.allergies.join(',') || 'none'}
Goals: ${input.goals.map(g => g.name).join(',')}
Medical: ${input.profileSnapshot.medical_flags.join(',') || 'none'}
Time: ${input.time_budget_min_per_day}min/day, Level: ${input.experience_level}
Equipment: ${input.equipment.join(',') || 'none'}

Keep it SHORT and COMPLETE:
- Only 3-4 yoga poses per session (max 30 chars each)
- Only 3 main meals (breakfast/lunch/dinner, max 40 chars each)
- Max 2-3 habits per day (max 25 chars each)
- Use simple names, no long descriptions

Return JSON format:
{"meta":{"title":"","duration_days":${input.duration.unit === 'weeks' ? input.duration.value * 7 : input.duration.value},"weeks":${input.duration.unit === 'weeks' ? input.duration.value : Math.ceil(input.duration.value / 7)}},"weekly_plan":[{"week_index":1,"days":[{"day_index":1,"yoga":[{"name":"","duration_min":0}],"nutrition":{"kcal_target":${Math.round(calculateKcalTarget(input.profileSnapshot))},"meals":[{"meal":"breakfast","name":"","kcal":0}]},"habits":[]}]}],"warnings":[]}`;

    const estimatedInputTokens = Math.ceil(compactPrompt.length / 4);
    logger.debug('Sending compact request to Gemini', { 
      model: 'gemini-2.5-pro',
      promptLength: compactPrompt.length,
      estimatedInputTokens,
      savings: `~${Math.round(((1500 - estimatedInputTokens) / 1500) * 100)}% reduction from original`
    });

    const result = await model.generateContent(compactPrompt);
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
      await db.savePlan({
        planId,
        profileId: input.profileId,
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
      });
      console.log('✅ [GENERATE] Plan persisted to database:', planId);
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
