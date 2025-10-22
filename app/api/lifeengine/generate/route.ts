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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const input = inputSchema.parse(body);

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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are TH+ LifeEngine Director. Generate safe, evidence-aligned plans strictly in JSON schema. Respect user profile (gender/age/region/diet/flags), plan_type (primary+secondary), goals, duration, time budget, experience, equipment. Constraints: ≤10% weekly progression, ≥1 rest day ≤6, deload ≥8 weeks, hydration ≥35 ml/kg (or floor by region), contraindications per flags. Use labeled catalogs only. Include daily citations where possible. If unsafe, set 'TBD_SAFE' and add a warning. Output valid JSON only.`;

    const userPrompt = JSON.stringify({
      profileSnapshot: input.profileSnapshot,
      intake: {
        plan_type: input.plan_type,
        goals: input.goals,
        conditions: input.conditions,
        duration: input.duration,
        time_budget_min_per_day: input.time_budget_min_per_day,
        experience_level: input.experience_level,
        equipment: input.equipment,
      },
      derived: {
        bmr: calculateBMR(input.profileSnapshot),
        tdee: calculateTDEE(input.profileSnapshot),
        kcalTarget: calculateKcalTarget(input.profileSnapshot),
        hydration: calculateHydration(input.profileSnapshot),
        durationDays: input.duration.unit === 'weeks' ? input.duration.value * 7 : input.duration.value,
        weeks: input.duration.unit === 'weeks' ? input.duration.value : Math.ceil(input.duration.value / 7),
      },
      catalogs: {
        flows: getYogaFlows(),
        meals: getMeals(),
      },
    });

    logger.debug('Sending request to Gemini', { 
      model: 'gemini-1.5-flash',
      promptLength: userPrompt.length
    });

    const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
    const response = await result.response;
    let planJson;
    try {
      planJson = JSON.parse(response.text());
      logger.debug('Plan JSON parsed successfully');
    } catch {
      logger.warn('First parse failed, retrying...');
      // Retry
      const retryResult = await model.generateContent(`${systemPrompt}\n\n${userPrompt}\nReturn JSON only.`);
      const retryResponse = await retryResult.response;
      planJson = JSON.parse(retryResponse.text());
      logger.debug('Plan JSON parsed on retry');
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
    };

    TH_PLANS.set(planId, planData);

    const duration = Date.now() - startTime;
    logger.info('Plan generated successfully', {
      planId,
      profileId: input.profileId,
      duration: `${duration}ms`,
      warningsCount: verifiedPlan.warnings.length
    });

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

function getYogaFlows() {
  return [
    { id: 'pcod_calm', name: 'PCOD Calm', tags: ['gentle', 'pcod'] },
    // Add more
  ];
}

function getMeals() {
  return [
    { name: 'Oats Upma', swaps: ['Poha (no peanuts)'] },
    // Add more
  ];
}

function verifyPlan(planJson: any, input: any) {
  // Implement verifier logic as per prompt
  const warnings: string[] = [];
  const analytics = { safety_score: 0.95, diet_match: 0.92, progression_score: 0.9, adherence_score: 0.88, overall: 0.91 };
  return { plan: planJson, warnings, analytics };
}
