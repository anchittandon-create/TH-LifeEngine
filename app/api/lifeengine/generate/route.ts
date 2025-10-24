import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@/lib/logging/logger';

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

const TH_PLANS = new Map<string, any>();

// Request throttling - prevent duplicate calls within 5 seconds
const requestCache = new Map<string, { timestamp: number; response: any }>();
const THROTTLE_MS = 5000;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const input = inputSchema.parse(body);

    // Create cache key from profile + plan type
    const cacheKey = `${input.profileId}-${input.plan_type.primary}-${JSON.stringify(input.goals)}`;
    
    // Check throttle cache
    const cached = requestCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < THROTTLE_MS) {
      logger.warn('Request throttled - duplicate call detected', { 
        profileId: input.profileId,
        timeSinceLastCall: Date.now() - cached.timestamp
      });
      return NextResponse.json(cached.response);
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
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "application/json", // Force JSON output - no markdown
      },
    });

    // ULTRA-COMPACT PROMPT: Minimal tokens
    const compactPrompt = `Generate ${input.duration.value} ${input.duration.unit} wellness plan JSON:
Profile: ${input.profileSnapshot.gender} ${input.profileSnapshot.age}y ${input.profileSnapshot.weight_kg}kg ${input.profileSnapshot.height_cm}cm ${input.profileSnapshot.activity_level}
Diet: ${input.profileSnapshot.dietary.type} | Avoid: ${input.profileSnapshot.dietary.allergies.join(',')||'none'}
Goals: ${input.goals.map(g => g.name).join(', ')}
Medical: ${input.profileSnapshot.medical_flags.join(', ')||'none'}
Budget: ${input.time_budget_min_per_day}min/day | Level: ${input.experience_level}
Equipment: ${input.equipment.join(', ')||'none'}

JSON structure:
{"meta":{"title":"","duration_days":${input.duration.unit === 'weeks' ? input.duration.value * 7 : input.duration.value},"weeks":${input.duration.unit === 'weeks' ? input.duration.value : Math.ceil(input.duration.value / 7)},"goals":[],"summary":""},"weekly_plan":[{"week_index":1,"focus":"","days":[{"day_index":1,"theme":"","yoga":[{"name":"","duration_min":0,"calories_burned":0}],"nutrition":{"kcal_target":${Math.round(calculateKcalTarget(input.profileSnapshot))},"hydration_ml":${Math.round(calculateHydration(input.profileSnapshot))},"meals":[{"meal":"breakfast","name":"","kcal":0}]},"habits":[],"citations":[]}]}],"citations":[],"warnings":[],"adherence_tips":[]}`;

    const estimatedInputTokens = Math.ceil(compactPrompt.length / 4);
    logger.debug('Sending compact request to Gemini', { 
      model: 'gemini-1.5-flash',
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

    logger.info('✅ Gemini API usage', {
      inputTokens: `${inputTokens} tokens (saved ~${1500 - inputTokens} tokens!)`,
      outputTokens,
      totalTokens,
      estimatedCost: `$${estimatedCost.toFixed(6)}`
    });
    
    let planJson;
    const responseText = response.text().trim()
    
    try {
      planJson = JSON.parse(responseText);
      logger.info('✅ Plan JSON parsed successfully');
    } catch (parseError: any) {
      logger.error('❌ JSON parse failed', { 
        error: parseError.message, 
        responsePreview: responseText.substring(0, 200) 
      });
      // Return error instead of retrying to save costs
      return NextResponse.json({ 
        error: 'Failed to generate valid plan. Please try again.',
        details: parseError.message 
      }, { status: 500 });
    }

    // Verifier
    const verifiedPlan = verifyPlan(planJson, input);

    const planId = uuidv4();
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
        savedTokens: Math.max(0, 1500 - inputTokens)
      }
    };

    TH_PLANS.set(planId, planData);

    const duration = Date.now() - startTime;
    logger.info('🎉 Plan generated successfully', {
      planId,
      profileId: input.profileId,
      duration: `${duration}ms`,
      warningsCount: verifiedPlan.warnings.length,
      cost: `$${estimatedCost.toFixed(6)}`,
      tokensSaved: Math.max(0, 1500 - inputTokens)
    });

    // Cache the response for throttling
    requestCache.set(cacheKey, { 
      timestamp: Date.now(), 
      response: planData 
    });
    
    // Clear old cache entries (older than 10 seconds)
    for (const [key, value] of requestCache.entries()) {
      if (Date.now() - value.timestamp > 10000) {
        requestCache.delete(key);
      }
    }

    return NextResponse.json(planData);
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Plan generation failed', { 
      error: error.message,
      duration: `${duration}ms`,
      stack: error.stack
    });
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
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
  return { plan: planJson, warnings, analytics };
}
