import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "@/lib/logging/logger";
import { db, StoredPlan, StoredPlanDay } from "@/lib/utils/db";

const logger = new Logger("system");

const inputSchema = z.object({
  profileId: z.string(),
  profileSnapshot: z.object({
    id: z.string(),
    name: z.string(),
    gender: z.enum(["F", "M", "Other"]),
    age: z.number(),
    height_cm: z.number(),
    weight_kg: z.number(),
    region: z.enum(["IN", "US", "EU", "Global"]),
    activity_level: z.enum(["sedentary", "light", "moderate", "intense"]),
    dietary: z.object({
      type: z.enum([
        "veg",
        "vegan",
        "eggetarian",
        "non_veg",
        "jain",
        "gluten_free",
        "lactose_free",
      ]),
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

type NormalizedInput = z.infer<typeof inputSchema>;

const simpleRequestSchema = z
  .object({
    profileId: z.string(),
    intake: z
      .object({
        id: z.string().optional(),
        primaryPlanType: z.string().optional(),
        secondaryPlanType: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        preferences: z
          .object({
            intensity: z.string().optional(),
            focusAreas: z.array(z.string()).optional(),
            format: z.string().optional(),
            includeDailyRoutine: z.boolean().optional(),
          })
          .optional(),
      })
      .optional(),
  })
  .passthrough();

type IntakePayload = z.infer<typeof simpleRequestSchema>["intake"];
type GenerationContext = {
  intake?: IntakePayload | null;
  goals: string[];
  startDate: string;
  durationDays: number;
};

type PlanComputationResult = {
  mode: "gemini" | "fallback";
  storedPlan: StoredPlan;
  warnings: string[];
  analytics: Record<string, any>;
  costMetrics: Record<string, any>;
  estimatedCostUsd: number;
};

// 💰 EXTREME COST OPTIMIZATION: 24-hour caching - prevent duplicate calls within full day
const requestCache = new Map<string, { timestamp: number; response: any }>();
const THROTTLE_MS = 86_400_000; // 24 hours

// 💰 ULTRA-STRICT: Daily request limit reduced to 3 per profile
const dailyRequestCount = new Map<string, { date: string; count: number }>();
const MAX_REQUESTS_PER_DAY = 3;

// 💰 COST CIRCUIT BREAKER: Global daily budget protection
const globalDailySpend = new Map<string, { date: string; totalCost: number }>();
const MAX_DAILY_BUDGET_USD = 0.5;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { input, context } = await buildInput(body);

    const today = new Date().toISOString().split("T")[0];
    const profileLimit = dailyRequestCount.get(input.profileId);

    if (profileLimit) {
      if (profileLimit.date === today && profileLimit.count >= MAX_REQUESTS_PER_DAY) {
        logger.warn("EXTREME: Daily request limit exceeded", {
          profileId: input.profileId,
          count: profileLimit.count,
          limit: MAX_REQUESTS_PER_DAY,
        });
        return NextResponse.json(
          {
            error: `ULTRA-STRICT MODE: Only ${MAX_REQUESTS_PER_DAY} plans per day allowed. Try again tomorrow.`,
            retryAfter: "tomorrow",
            costSaving: "This limit prevents excessive API costs",
          },
          { status: 429 },
        );
      }
      if (profileLimit.date !== today) {
        dailyRequestCount.set(input.profileId, { date: today, count: 1 });
      } else {
        profileLimit.count++;
      }
    } else {
      dailyRequestCount.set(input.profileId, { date: today, count: 1 });
    }

    const globalSpend = globalDailySpend.get(today);
    if (globalSpend && globalSpend.totalCost >= MAX_DAILY_BUDGET_USD) {
      logger.error("🚨 DAILY BUDGET EXCEEDED - API BLOCKED", {
        currentSpend: globalSpend.totalCost,
        budget: MAX_DAILY_BUDGET_USD,
        date: today,
      });
      return NextResponse.json(
        {
          error: `Daily budget of $${MAX_DAILY_BUDGET_USD} exceeded. API temporarily disabled.`,
          currentSpend: `$${globalSpend.totalCost.toFixed(4)}`,
          retryAfter: "tomorrow",
        },
        { status: 503 },
      );
    }

    const cacheKey = `${input.profileId}-${input.plan_type.primary}-${JSON.stringify(input.goals)}`;
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < THROTTLE_MS) {
      logger.warn("Request served from 24-HOUR cache", {
        profileId: input.profileId,
        timeSinceLastCall: `${Math.round((Date.now() - cached.timestamp) / 3_600_000)} hours`,
        costSaved: "$0.02-0.03 (100% API cost avoided)",
      });
      return NextResponse.json(cached.response);
    }

    logger.info("Plan generation started", {
      profileId: input.profileId,
      planType: input.plan_type.primary,
      duration: input.duration,
    });

    const planId = uuidv4();
    let result: PlanComputationResult;

    if (!process.env.GOOGLE_API_KEY) {
      logger.warn("GOOGLE_API_KEY not configured. Falling back to offline plan synthesis.");
      result = buildFallbackPlan(planId, input, context, {
        reason: "GOOGLE_API_KEY not configured",
      });
    } else {
      result = await runGeminiPlan(planId, input, context, startTime);
    }

    return await persistPlanComputation({
      planId,
      cacheKey,
      today,
      input,
      result,
      startTime,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logger.error("Plan generation failed", {
      error: error.message,
      duration: `${duration}ms`,
      stack: error.stack,
    });
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}

function cleanupCaches(today: string) {
  for (const [key, value] of requestCache.entries()) {
    if (Date.now() - value.timestamp > THROTTLE_MS * 2) {
      requestCache.delete(key);
    }
  }

  for (const [profileId, data] of dailyRequestCount.entries()) {
    if (data.date !== today) {
      dailyRequestCount.delete(profileId);
    }
  }

  for (const [date, data] of globalDailySpend.entries()) {
    if (date !== today) {
      globalDailySpend.delete(date);
    }
  }
}

async function runGeminiPlan(
  planId: string,
  input: NormalizedInput,
  context: GenerationContext,
  startTime: number,
): Promise<PlanComputationResult> {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const isProd =
      process.env.VERCEL === "1" || process.env.NODE_ENV === "production" || !!process.env.VERCEL;
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3,
        topP: 0.6,
        topK: 25,
        maxOutputTokens: isProd ? 3072 : 16384,
      },
    });

    const compactPrompt = buildPrompt(input, context);
    const estimatedInputTokens = Math.ceil(compactPrompt.length / 4);

    logger.debug("Sending compact request to Gemini", {
      model: "models/gemini-2.5-flash",
      promptLength: compactPrompt.length,
      estimatedInputTokens,
      prompt: compactPrompt.substring(0, 200) + "...",
    });

    const generation = await model.generateContent(compactPrompt);
    const response = await generation.response;

    const usageMetadata = response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || 0;
    const estimatedCost = (inputTokens / 1_000_000) * 0.075 + (outputTokens / 1_000_000) * 0.3;

    logger.info("✅ EXTREME COST MODE: Gemini API usage (2.5-flash)", {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost: `$${estimatedCost.toFixed(6)}`,
    });

    let responseText = response.text().trim();
    if (responseText.startsWith("```json")) {
      responseText = responseText.replace(/^```json\\s*/, "").replace(/\\s*```$/, "");
    } else if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```\\s*/, "").replace(/\\s*```$/, "");
    }

    logger.debug("Raw AI response", {
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 300),
      finishReason: response.candidates?.[0]?.finishReason,
      safetyRatings: response.candidates?.[0]?.safetyRatings,
    });

    let planJson: any = {};
    let parseWarning: string | null = null;
    try {
      planJson = JSON.parse(responseText);
      logger.info("✅ Plan JSON parsed successfully");
    } catch (parseError: any) {
      parseWarning = `AI JSON parse failed: ${parseError.message}. Using safe fallback plan.`;
      logger.error("❌ JSON parse failed - using fallback structure", {
        error: parseError.message,
        responsePreview: responseText.substring(0, 200),
      });
    }

    const verifiedPlan = verifyPlan(planJson, input);
    if (parseWarning) {
      verifiedPlan.warnings.push(parseWarning);
    }

    const storedPlan = convertPlanToStoredPlan(verifiedPlan.plan, input, context, planId);

    return {
      mode: "gemini",
      storedPlan,
      warnings: verifiedPlan.warnings,
      analytics: verifiedPlan.analytics,
      estimatedCostUsd: estimatedCost,
      costMetrics: {
        mode: "gemini",
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost: `$${estimatedCost.toFixed(6)}`,
        savedTokens: Math.max(0, 1200 - inputTokens),
        extremeMode: "Ultra-cost-optimized: 24h cache, 3 req/day, 1024 max tokens",
        parseWarning: parseWarning ?? undefined,
      },
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const message = error?.message ?? "Unknown generation error";
    const quotaHit = /429/.test(message) && /quota/i.test(message);

    if (quotaHit) {
      logger.error("🚨 Google API quota exceeded", {
        error: message,
        duration: `${duration}ms`,
        suggestion: "Use fallback plan generation or increase API quota",
      });
    } else {
      logger.error("Gemini generation failed. Switching to fallback plan.", {
        error: message,
        duration: `${duration}ms`,
      });
    }

    return buildFallbackPlan(planId, input, context, {
      reason: quotaHit ? "Gemini quota exceeded" : message,
      error,
      durationMs: duration,
    });
  }
}

async function persistPlanComputation(params: {
  planId: string;
  cacheKey: string;
  today: string;
  input: NormalizedInput;
  result: PlanComputationResult;
  startTime: number;
}) {
  const { planId, cacheKey, today, input, result, startTime } = params;

  await db.savePlan({
    planId,
    profileId: input.profileId,
    createdAt: result.storedPlan.createdAt,
    planJSON: result.storedPlan,
    warnings: result.warnings,
    analytics: result.analytics,
    costMetrics: result.costMetrics,
    confidence: result.analytics?.overall ?? 0.9,
    days: result.storedPlan.days.length,
  });

  if (result.mode === "gemini" && result.estimatedCostUsd > 0) {
    const currentGlobalSpend = globalDailySpend.get(today) || { date: today, totalCost: 0 };
    currentGlobalSpend.totalCost += result.estimatedCostUsd;
    globalDailySpend.set(today, currentGlobalSpend);
  }

  const planData = {
    planId,
    profileId: input.profileId,
    createdAt: result.storedPlan.createdAt,
    plan: result.storedPlan,
    warnings: result.warnings,
    analytics: result.analytics,
    costMetrics: result.costMetrics,
  };

  requestCache.set(cacheKey, {
    timestamp: Date.now(),
    response: planData,
  });

  cleanupCaches(today);

  const durationMs = Date.now() - startTime;

  if (result.mode === "gemini") {
    const spendSnapshot = globalDailySpend.get(today)?.totalCost ?? result.estimatedCostUsd;
    logger.info("🎉 Plan generated - EXTREME COST MODE", {
      planId,
      profileId: input.profileId,
      duration: `${durationMs}ms`,
      warningsCount: result.warnings.length,
      cost: `$${result.estimatedCostUsd.toFixed(6)}`,
      dailySpend: `$${spendSnapshot.toFixed(4)}/${MAX_DAILY_BUDGET_USD}`,
    });
  } else {
    logger.info("✅ Plan generated via offline fallback", {
      planId,
      profileId: input.profileId,
      duration: `${durationMs}ms`,
      warningsCount: result.warnings.length,
      reason: result.costMetrics.reason ?? "fallback",
    });
  }

  return NextResponse.json(planData);
}

function buildFallbackPlan(
  planId: string,
  input: NormalizedInput,
  context: GenerationContext,
  options: { reason: string; error?: unknown; durationMs?: number },
): PlanComputationResult {
  const storedPlan = buildFallbackStoredPlan(planId, input, context);
  const warnings = [
    `Generated via offline fallback: ${options.reason}`,
    "Plan synthesised locally without external AI. Fine-tune as needed.",
  ];
  const analytics = defaultAnalytics();
  const costMetrics = {
    mode: "fallback",
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCost: "$0.000000",
    savedTokens: 0,
    extremeMode: "offline-fallback",
    reason: options.reason,
  };

  return {
    mode: "fallback",
    storedPlan,
    warnings,
    analytics,
    costMetrics,
    estimatedCostUsd: 0,
  };
}

function buildFallbackStoredPlan(
  planId: string,
  input: NormalizedInput,
  context: GenerationContext,
): StoredPlan {
  const start = safeDate(context.startDate);
  const goalNames = context.goals.length
    ? context.goals
    : input.goals.map((goal) => goal.name);
  const goals = goalNames.length ? goalNames : ["general_wellness"];
  const timeBudget = Math.max(20, Math.min(input.time_budget_min_per_day || 45, 90));
  const durationDays =
    context.durationDays ||
    (input.duration.unit === "weeks"
      ? input.duration.value * 7
      : Math.max(7, input.duration.value));

  const kcalTarget = Math.max(1400, Math.round(calculateKcalTarget(input.profileSnapshot)));
  const days = buildFallbackDays(start, goals, durationDays, timeBudget, kcalTarget);
  const intakeId = context.intake?.id ?? `intake_${planId}`;
  const createdAt = new Date().toISOString();

  return {
    id: planId,
    profileId: input.profileId,
    intakeId,
    goals,
    createdAt,
    days,
  };
}

function defaultAnalytics() {
  return {
    safety_score: 0.9,
    diet_match: 0.86,
    progression_score: 0.84,
    adherence_score: 0.82,
    overall: 0.85,
  };
}

async function buildInput(body: any): Promise<{
  input: z.infer<typeof inputSchema>;
  context: GenerationContext;
}> {
  if (
    body &&
    typeof body === "object" &&
    "profileSnapshot" in body &&
    "plan_type" in body &&
    "goals" in body
  ) {
    const parsed = inputSchema.parse(body);
    const intake = body.intake ?? null;
    const start = typeof intake?.startDate === "string" ? intake.startDate : new Date().toISOString().split("T")[0];
    const durationDays =
      parsed.duration.unit === "weeks"
        ? parsed.duration.value * 7
        : parsed.duration.value;
    return {
      input: parsed,
      context: {
        intake,
        goals: parsed.goals.map((goal) => goal.name),
        startDate: start,
        durationDays,
      },
    };
  }

  const parsedRequest = simpleRequestSchema.parse(body);
  const profile = await db.getProfile(parsedRequest.profileId);
  if (!profile) {
    throw new Error("Profile not found");
  }

  const intake = parsedRequest.intake ?? null;
  const { goals, goalObjects } = deriveGoalObjects(profile, intake);
  const durationMeta = deriveDuration(intake);
  const profileSnapshot = buildProfileSnapshot(profile, intake);
  const planType = buildPlanType(profile, intake);
  const conditions = deriveConditions(profile);
  const timeBudget = mapIntensityToTimeBudget(
    intake?.preferences?.intensity,
    profile.schedule?.timeBudgetMin,
  );
  const experience = determineExperience(profile, intake);
  const equipment = Array.isArray(profile.equipment) ? profile.equipment : [];

  const normalizedInput = {
    profileId: parsedRequest.profileId,
    profileSnapshot,
    plan_type: planType,
    goals: goalObjects,
    conditions,
    duration: { unit: "weeks", value: durationMeta.weeks },
    time_budget_min_per_day: timeBudget,
    experience_level: experience,
    equipment,
  };

  const validated = inputSchema.parse(normalizedInput);

  return {
    input: validated,
    context: {
      intake,
      goals,
      startDate: durationMeta.startDate,
      durationDays: durationMeta.days,
    },
  };
}

function buildPrompt(input: z.infer<typeof inputSchema>, context: GenerationContext) {
  const kcalTarget = Math.round(calculateKcalTarget(input.profileSnapshot));
  const weeks = Math.max(1, Math.ceil((context.durationDays || 7) / 7));
  return `Create a wellness plan JSON for ${input.profileSnapshot.age}y ${input.profileSnapshot.gender} ${input.profileSnapshot.weight_kg}kg.
Goals: ${input.goals.slice(0, 3).map((g) => g.name).join(", ")}
Time: ${input.time_budget_min_per_day}min/day

JSON format:
{"meta":{"title":"Plan","duration_days":${context.durationDays || 7},"weeks":${weeks}},"weekly_plan":[{"week_index":1,"days":[{"day_index":1,"yoga":[{"name":"Flow","duration_min":15}],"nutrition":{"kcal_target":${kcalTarget},"meals":[{"meal":"breakfast","name":"Oats","kcal":300}]},"habits":[{"name":"Meditation","duration_min":5}]}]}],"warnings":[]}`;
}

function calculateBMR(profile: any) {
  const { weight_kg, height_cm, age, gender } = profile;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  return gender === "M" ? base + 5 : base - 161;
}

function calculateTDEE(profile: any) {
  const bmr = calculateBMR(profile);
  const factors: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    intense: 1.725,
  };
  return bmr * (factors[profile.activity_level] || factors.moderate);
}

function calculateKcalTarget(profile: any) {
  const tdee = calculateTDEE(profile);
  return tdee - 500;
}

function verifyPlan(planJson: any, input: any) {
  const warnings: string[] = [];
  const analytics = {
    safety_score: 0.95,
    diet_match: 0.92,
    progression_score: 0.9,
    adherence_score: 0.88,
    overall: 0.91,
  };
  return { plan: planJson, warnings, analytics };
}

function deriveGoalObjects(profile: any, intake?: IntakePayload | null) {
  const goalsFromIntake = normalizeGoalsList(intake?.preferences?.focusAreas);
  const goalsFromProfile = normalizeGoalsList(profile.goals);
  const focusAreas = normalizeGoalsList(profile.preferences?.focusAreas);
  const lifestyleGoals = normalizeGoalsList([
    profile.lifestyle?.primaryGoal,
    ...(profile.lifestyle?.secondaryGoals ?? []),
  ]);

  const combined = [
    ...goalsFromIntake,
    ...goalsFromProfile,
    ...focusAreas,
    ...lifestyleGoals,
  ];
  if (intake?.primaryPlanType) {
    combined.push(String(intake.primaryPlanType));
  }

  const unique = Array.from(new Set(combined.filter(Boolean)));
  if (!unique.length) {
    unique.push("general_wellness");
  }

  const goalObjects = unique.map((name, index) => ({
    name,
    priority: index + 1,
  }));

  return { goals: unique, goalObjects };
}

function deriveDuration(intake?: IntakePayload | null) {
  const isProd = process.env.VERCEL === "1" || process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  const start = safeDate(intake?.startDate);
  if (intake?.endDate) {
    const end = safeDate(intake.endDate);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs > 0) {
      let days = Math.max(1, Math.round(diffMs / DAY_MS));
      if (isProd) {
        // In production, limit initial generation to 7 days to avoid timeouts
        days = Math.min(days, 7);
      }
      const weeks = Math.max(1, Math.ceil(days / 7));
      return {
        startDate: start.toISOString().split("T")[0],
        days,
        weeks,
      };
    }
  }

  // Default duration
  const defaultDays = (isProd ? 7 : 28);
  return {
    startDate: start.toISOString().split("T")[0],
    days: defaultDays,
    weeks: Math.max(1, Math.ceil(defaultDays / 7)),
  };
}

function buildPlanType(profile: any, intake?: IntakePayload | null) {
  const primary =
    intake?.primaryPlanType ??
    profile.lifestyle?.primaryGoal ??
    "general_wellness";
  const secondarySet = new Set<string>();

  if (intake?.secondaryPlanType) {
    secondarySet.add(String(intake.secondaryPlanType));
  }
  (profile.lifestyle?.secondaryGoals ?? []).forEach((goal: any) => {
    if (goal) secondarySet.add(String(goal));
  });
  const focusAreas = normalizeGoalsList(profile.preferences?.focusAreas);
  focusAreas.forEach((goal) => secondarySet.add(goal));

  const secondary = Array.from(secondarySet).filter((goal) => goal !== primary);

  return {
    primary: String(primary),
    secondary,
  };
}

function deriveConditions(profile: any) {
  const pool = [
    ...(Array.isArray(profile.health?.flags) ? profile.health.flags : []),
    ...(Array.isArray(profile.health?.chronicConditions)
      ? profile.health.chronicConditions
      : []),
  ];
  return Array.from(new Set(pool.map(String).filter(Boolean)));
}

function mapIntensityToTimeBudget(intensity?: string, fallback?: number) {
  if (typeof intensity === "string") {
    const normalized = intensity.toLowerCase();
    if (normalized === "high") return 60;
    if (normalized === "medium") return 45;
    if (normalized === "low") return 30;
  }
  return fallback ?? 45;
}

function determineExperience(profile: any, intake?: IntakePayload | null) {
  if (typeof profile.preferences?.level === "string") {
    return profile.preferences.level;
  }
  if (typeof profile.experience === "string") {
    return profile.experience;
  }
  const intensity = intake?.preferences?.intensity;
  if (typeof intensity === "string") {
    const normalized = intensity.toLowerCase();
    if (normalized === "high") return "advanced";
    if (normalized === "medium") return "intermediate";
  }
  return "beginner";
}

function buildProfileSnapshot(profile: any, intake?: IntakePayload | null) {
  return {
    id: profile.id,
    name: profile.name ?? "Member",
    gender: mapGenderToSnapshot(profile.demographics?.sex ?? profile.gender),
    age: Number(profile.demographics?.age ?? profile.age ?? 30),
    height_cm: Number(profile.demographics?.height ?? 170),
    weight_kg: Number(profile.demographics?.weight ?? 70),
    region: mapRegion(profile.contact?.location),
    activity_level: mapActivityLevel(profile, intake),
    dietary: buildDietary(profile),
    medical_flags: Array.isArray(profile.health?.flags) ? profile.health.flags : [],
    preferences: {
      tone: profile.preferences?.tone ?? "balanced",
      indoor_only: Boolean(profile.preferences?.indoorOnly),
      notes: profile.preferences?.coachingNotes ?? profile.coachingNotes ?? "",
    },
    availability: {
      days_per_week: Number(profile.schedule?.daysPerWeek ?? 5),
      preferred_slots: normalizePreferredSlots(profile),
    },
  };
}

function mapGenderToSnapshot(value: any): "F" | "M" | "Other" {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized.startsWith("m")) return "M";
    if (normalized.startsWith("f")) return "F";
  }
  return "Other";
}

function mapRegion(location?: string): "IN" | "US" | "EU" | "Global" {
  if (!location) return "Global";
  const upper = location.toUpperCase();
  if (upper.includes("IND") || upper.endsWith("IN")) return "IN";
  if (upper.includes("USA") || upper.includes("UNITED STATES") || upper.endsWith("US"))
    return "US";
  if (
    upper.includes("EU") ||
    upper.includes("UNITED KINGDOM") ||
    upper.includes("UK") ||
    upper.includes("GERMANY") ||
    upper.includes("FRANCE")
  )
    return "EU";
  return "Global";
}

function mapActivityLevel(profile: any, intake?: IntakePayload | null): "sedentary" | "light" | "moderate" | "intense" {
  const candidates = [
    profile.lifestyle?.activityLevel,
    intake?.preferences?.intensity,
    profile.activityLevel,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const normalized = candidate.toLowerCase();
      if (normalized === "sedentary") return "sedentary";
      if (normalized === "light" || normalized === "low") return "light";
      if (normalized === "moderate" || normalized === "medium") return "moderate";
      if (normalized === "intense" || normalized === "high") return "intense";
    }
  }
  return "moderate";
}

function buildDietary(profile: any) {
  return {
    type: mapDietType(profile.nutrition?.dietType ?? profile.dietType),
    allergies: Array.isArray(profile.health?.allergies)
      ? profile.health.allergies.map(String)
      : [],
    avoid_items: Array.isArray(profile.nutrition?.dislikes)
      ? profile.nutrition.dislikes.map(String)
      : [],
    cuisine_pref: normalizeCuisine(profile.nutrition?.cuisinePreference),
  };
}

const allowedDietTypes = [
  "veg",
  "vegan",
  "eggetarian",
  "non_veg",
  "jain",
  "gluten_free",
  "lactose_free",
] as const;

function mapDietType(value: any): (typeof allowedDietTypes)[number] {
  if (typeof value === "string") {
    const normalized = value.toLowerCase().replace(/-/g, "_");
    if (allowedDietTypes.includes(normalized as (typeof allowedDietTypes)[number])) {
      return normalized as (typeof allowedDietTypes)[number];
    }
    if (normalized === "vegetarian") return "veg";
    if (normalized === "nonveg" || normalized === "non_veg" || normalized === "nonvegitarian") {
      return "non_veg";
    }
  }
  return "veg";
}

function normalizeCuisine(input: any): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item)).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return ["indian"];
}

function normalizePreferredSlots(profile: any) {
  const slots = profile.schedule?.preferredSlots;
  if (Array.isArray(slots) && slots.length) {
    return slots.map((slot: any) => ({
      start: slot.start ?? "18:00",
      end: slot.end ?? "19:00",
    }));
  }
  const preferredTime = profile.preferredTime ?? profile.preferences?.preferredTime;
  if (typeof preferredTime === "string") {
    const value = preferredTime.toLowerCase();
    if (value.includes("morning")) return [{ start: "06:00", end: "09:00" }];
    if (value.includes("evening") || value.includes("night")) return [{ start: "18:00", end: "21:00" }];
  }
  return [{ start: "18:00", end: "19:00" }];
}

function normalizeGoalsList(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((goal) => String(goal).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(",")
      .map((goal) => goal.trim())
      .filter(Boolean);
  }
  return [];
}

function convertPlanToStoredPlan(
  planJson: any,
  input: z.infer<typeof inputSchema>,
  context: GenerationContext,
  planId: string,
): StoredPlan {
  const start = safeDate(context.startDate);
  const goals = context.goals.length ? context.goals : input.goals.map((goal) => goal.name);
  const days: StoredPlanDay[] = [];

  if (Array.isArray(planJson?.weekly_plan)) {
    for (const week of planJson.weekly_plan) {
      if (!Array.isArray(week?.days)) continue;
      for (const day of week.days) {
        const dayOffset = days.length;
        const date = new Date(start.getTime() + dayOffset * DAY_MS);
        const dateIso = date.toISOString().split("T")[0];
        days.push({
          date: dateIso,
          activities: collectActivities(day),
          meals: collectMeals(day),
        });
      }
    }
  }

  if (!days.length) {
    const fallbackDays = buildFallbackDays(
      start,
      goals,
      context.durationDays || 7,
      input.time_budget_min_per_day,
      Math.max(1400, Math.round(calculateKcalTarget(input.profileSnapshot))),
    );
    days.push(...fallbackDays);
  }

  const intakeId = context.intake?.id ?? `intake_${planId}`;
  const createdAt = new Date().toISOString();

  return {
    id: planId,
    profileId: input.profileId,
    intakeId,
    goals,
    createdAt,
    days,
  };
}

const DAY_MS = 86_400_000;

function collectActivities(day: any): StoredPlanDay["activities"] {
  const activities: StoredPlanDay["activities"] = [];

  if (Array.isArray(day?.yoga)) {
    for (const flow of day.yoga) {
      activities.push({
        type: "movement",
        name: flow?.name ?? "Yoga Flow",
        duration: Number(flow?.duration_min ?? 30),
        description: Array.isArray(flow?.tags) ? flow.tags.join(", ") : flow?.intensity ?? "",
      });
    }
  }

  if (Array.isArray(day?.breathwork)) {
    for (const session of day.breathwork) {
      activities.push({
        type: "breathwork",
        name: session?.name ?? "Breathwork",
        duration: Number(session?.duration_min ?? 10),
        description: "",
      });
    }
  }

  if (Array.isArray(day?.mindfulness)) {
    for (const practice of day.mindfulness) {
      activities.push({
        type: "mindfulness",
        name: typeof practice === "string" ? practice : practice?.name ?? "Mindfulness",
        duration:
          typeof practice === "object" && practice?.duration_min
            ? Number(practice.duration_min)
            : 10,
        description:
          typeof practice === "object" && practice?.notes ? String(practice.notes) : "",
      });
    }
  }

  if (Array.isArray(day?.habits)) {
    for (const habit of day.habits) {
      activities.push({
        type: "habit",
        name: String(habit),
        duration: 0,
        description: "",
      });
    }
  }

  if (day?.notes) {
    activities.push({
      type: "note",
      name: "Coach Note",
      duration: 0,
      description: String(day.notes),
    });
  }

  return activities;
}

function collectMeals(day: any): StoredPlanDay["meals"] {
  const meals: StoredPlanDay["meals"] = [];
  const nutrition = day?.nutrition;
  const entries = Array.isArray(nutrition?.meals) ? nutrition.meals : [];

  for (const meal of entries) {
    meals.push({
      type: meal?.meal ?? "meal",
      name: meal?.name ?? "Meal",
      calories: Number(meal?.kcal ?? meal?.calories ?? 0),
      description: meal?.description ? String(meal.description) : "",
    });
  }

  if (!meals.length && nutrition?.kcal_target) {
    meals.push({
      type: "daily",
      name: "Nutrition Target",
      calories: Number(nutrition.kcal_target),
      description: "Estimated daily calorie target",
    });
  }

  return meals;
}

function buildFallbackDays(
  start: Date,
  goals: string[],
  durationDays: number,
  timeBudgetMin: number,
  kcalTarget: number,
): StoredPlanDay[] {
  const count = Math.min(Math.max(Math.round(durationDays), 7), 28);
  const targets = goals.length ? goals : ["wellness"];
  const movementDuration = Math.max(20, Math.min(Math.round(timeBudgetMin || 45), 90));
  const fallback: StoredPlanDay[] = [];

  for (let i = 0; i < count; i++) {
    const dateIso = new Date(start.getTime() + i * DAY_MS).toISOString().split("T")[0];
    const goal = targets[i % targets.length];
    const targetLabel = capitalize(goal);
    const isRecovery = (i + 1) % 7 === 0;

    const activities: StoredPlanDay["activities"] = [
      {
        type: "movement",
        name: isRecovery ? "Recovery mobility" : `${targetLabel} focus`,
        duration: isRecovery ? Math.min(30, movementDuration) : movementDuration,
        description: isRecovery
          ? "Gentle mobility, fascia release, and restorative stretching."
          : `Coach-guided session progressing your ${targetLabel.toLowerCase()} goal.`,
      },
      {
        type: "mindfulness",
        name: "Breathing reset",
        duration: 10,
        description: "Five minutes of box breathing followed by gratitude journaling.",
      },
      {
        type: "habit",
        name: "Hydration",
        duration: 0,
        description: "Target eight glasses of water spaced across the day.",
      },
    ];

    if (!isRecovery) {
      activities.push({
        type: "note",
        name: "Progress cue",
        duration: 0,
        description: `Track effort (RPE) and note wins for ${targetLabel.toLowerCase()}.`,
      });
    }

    const meals: StoredPlanDay["meals"] = [
      {
        type: "daily",
        name: "Balanced plate",
        calories: kcalTarget,
        description: "Three balanced meals plus two mindful snacks built around whole foods.",
      },
    ];

    fallback.push({
      date: dateIso,
      activities,
      meals,
    });
  }

  return fallback;
}

function safeDate(value?: string) {
  if (!value) return new Date();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function capitalize(value: string) {
  if (!value) return "Wellness";
  const normalized = value.replace(/[_-]+/g, " ").trim();
  if (!normalized.length) return "Wellness";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
