import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db, type StoredPlan } from '@/lib/utils/db';
import { systemLogger as logger } from '@/lib/logging/logger';
import { createId } from '@/lib/utils/ids';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type GenerateBody = {
  profileId: string;
  intake?: {
    primaryPlanType?: string;
    secondaryPlanType?: string;
    startDate?: string;
    endDate?: string;
    preferences?: Record<string, any>;
    durationDays?: number;
  };
};

const isProd = process.env.NODE_ENV === 'production';

function hardTimeout<T>(promise: Promise<T>, ms: number, label = 'operation'): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((value) => { clearTimeout(id); resolve(value); })
      .catch((err) => { clearTimeout(id); reject(err); });
  });
}

function stripCodeFences(text: string): string {
  if (!text) return text;
  const fenceRegex = /\`\`\`(?:json)?\n([\s\S]*?)\n\`\`\`/i;
  const match = text.match(fenceRegex);
  if (match && match[1]) return match[1].trim();
  return text.trim();
}

function extractJson(text: string): any | null {
  try { return JSON.parse(text); } catch (_) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = text.slice(start, end + 1);
      try { return JSON.parse(candidate); } catch (_) {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) { try { return JSON.parse(m[0]); } catch (_) {} }
      }
    }
  }
  return null;
}

function sanitizePlanJson(raw: any, profileId: string, intakeId: string): StoredPlan {
  const today = new Date();
  const ensureArray = (v: any) => (Array.isArray(v) ? v : v ? [v] : []);
  const days: StoredPlan['days'] = ensureArray(raw?.days).map((d: any, idx: number) => {
    const date = new Date(today.getTime() + idx * 86400000).toISOString().split('T')[0];
    const activities = ensureArray(d?.activities).map((a: any) => {
      const nameVal = typeof a?.name === 'string' ? a.name : typeof a?.name === 'object' ? (a?.name?.name ?? a?.name?.title ?? JSON.stringify(a.name)) : (a?.type ?? 'Activity');
      return {
        type: String(a?.type ?? 'general'),
        name: String(nameVal),
        duration: Number(a?.duration ?? a?.duration_min ?? a?.minutes ?? 0) || 0,
        description: String(a?.description ?? a?.details ?? ''),
      };
    });
    const meals = ensureArray(d?.meals ?? d?.nutrition?.meals).map((m: any) => {
      const nameVal = typeof m?.name === 'string' ? m.name : typeof m?.name === 'object' ? (m?.name?.name ?? m?.name?.title ?? JSON.stringify(m.name)) : (m?.item ?? m?.meal ?? 'Meal');
      return {
        type: String(m?.type ?? m?.meal ?? 'meal'),
        name: String(nameVal),
        calories: Number(m?.calories ?? m?.kcal ?? m?.kcal_target ?? 0) || 0,
        description: String(m?.description ?? m?.details ?? ''),
      };
    });
    return { date, activities, meals };
  });

  const createdAt = new Date().toISOString();
  const plan: StoredPlan = {
    id: `plan_${createId()}`,
    profileId,
    intakeId,
    goals: Array.isArray(raw?.goals) ? raw.goals.map((g: any) => String(g)) : [],
    createdAt,
    days,
  };
  return plan;
}

function buildPrompt(opts: { profile: any; durationDays: number; }) {
  const { profile, durationDays } = opts;
  return `You are TH_LifeEngine, a precise and concise planner. Generate a compact JSON plan for the next ${durationDays} days only.
Return ONLY valid JSON. Do not include markdown, code fences, or commentary.

Schema strictly:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "activities": [ { "type": "yoga|cardio|strength|mindfulness", "name": "string", "duration": 10-60, "description": "string" } ],
      "meals": [ { "type": "breakfast|lunch|dinner|snack", "name": "string", "calories": number, "description": "string" } ]
    }
  ]
}

User profile summary:
- age: ${profile?.ui?.age ?? profile?.age ?? 30}
- gender: ${profile?.ui?.gender ?? profile?.gender ?? 'other'}
- goals: ${(profile?.ui?.goals ?? profile?.goals ?? []).join(', ')}
- experience: ${profile?.ui?.experience ?? profile?.preferences?.level ?? profile?.experience ?? 'beginner'}
- preferred time: ${profile?.ui?.preferredTime ?? profile?.preferredTime ?? 'flexible'}
- health concerns: ${profile?.ui?.healthConcerns ?? profile?.healthConcerns ?? ''}

Rules:
- Keep descriptions short.
- Keep activity names as simple strings (no objects).
- Calorie totals per day around 1800-2200 unless weight loss is a goal (then 1500-1900).
- If vegetarian in nutrition.dietType, avoid meat.
- Prefer Indian meals if cuisinePreference contains 'indian'.
`;
}

function buildFallbackPlan(profileId: string, intakeId: string, durationDays: number): StoredPlan {
  const today = new Date();
  const days: StoredPlan['days'] = Array.from({ length: durationDays }, (_, i) => {
    const date = new Date(today.getTime() + i * 86400000).toISOString().split('T')[0];
    return {
      date,
      activities: [
        { type: 'yoga', name: 'Gentle Flow', duration: 20, description: 'Full-body mobility and breath' },
        { type: 'mindfulness', name: 'Box Breathing', duration: 5, description: '4-4-4-4 breathing to reset' }
      ],
      meals: [
        { type: 'breakfast', name: 'Oats + Fruit', calories: 350, description: 'Fiber-rich start' },
        { type: 'lunch', name: 'Dal + Roti + Salad', calories: 600, description: 'Balanced Indian plate' },
        { type: 'dinner', name: 'Paneer + Veg Stir-fry', calories: 550, description: 'High-protein veg dinner' }
      ],
    };
  });
  return {
    id: `plan_${createId()}`,
    profileId,
    intakeId,
    goals: [],
    createdAt: new Date().toISOString(),
    days,
  };
}

export async function POST(request: NextRequest) {
  const warnings: string[] = [];
  let usage: any = {};
  const startedAt = Date.now();

  try {
    const body = (await request.json().catch(() => ({}))) as GenerateBody;
    const profileId = body?.profileId;
    if (!profileId) {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    const profile = await db.getProfile(profileId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const durationDaysRequested = Math.max(1, Math.min(Number(body?.intake?.durationDays ?? 7), isProd ? 7 : 28));
    const durationDays = durationDaysRequested;
    const intakeId = body?.intake?.startDate ?? `intake_${createId()}`;

    const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
    const shouldCallAI = !!apiKey;

    let rawPlanJson: any | null = null;

    if (shouldCallAI) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: isProd ? 2048 : 8192,
          },
        });

        const prompt = buildPrompt({ profile, durationDays });
        const result = await hardTimeout(model.generateContent(prompt), isProd ? 9000 : 20000, 'Gemini generateContent');
        const response = await result.response;
        usage = (response as any).usageMetadata || {};
        const text = (response as any).text();
        const cleaned = stripCodeFences(text);
        rawPlanJson = extractJson(cleaned);
        if (!rawPlanJson) {
          warnings.push('AI returned non-JSON or partial content; using fallback');
        }
      } catch (err: any) {
        warnings.push(`AI error: ${err?.message || String(err)}`);
        rawPlanJson = null;
      }
    } else {
      warnings.push('No AI key configured; returning fallback plan');
    }

    const planJSON: StoredPlan = rawPlanJson
      ? sanitizePlanJson(rawPlanJson, profileId, intakeId)
      : buildFallbackPlan(profileId, intakeId, durationDays);

    const planId = planJSON.id || `plan_${createId()}`;
    const confidence = rawPlanJson ? 0.9 : 0.6;

    await db.savePlan({
      planId,
      profileId,
      days: planJSON.days?.length ?? durationDays,
      confidence,
      warnings,
      planJSON,
      analytics: {
        generatedAt: new Date().toISOString(),
        ms: Date.now() - startedAt,
      },
      costMetrics: {
        inputTokens: usage?.promptTokenCount ?? usage?.inputTokens ?? 0,
        outputTokens: usage?.candidatesTokenCount ?? usage?.outputTokens ?? 0,
        totalTokens: (usage?.promptTokenCount ?? 0) + (usage?.candidatesTokenCount ?? 0),
        model: 'gemini-2.5-flash',
      },
    });

    return NextResponse.json({
      planId,
      plan: planJSON,
      warnings,
      quality_score: { overall: confidence },
    });
  } catch (error: any) {
    logger.error('/api/generate failed', { message: error?.message });
    try {
      const fallback = buildFallbackPlan('unknown', `intake_${createId()}`, isProd ? 7 : 7);
      return NextResponse.json({
        planId: fallback.id,
        plan: fallback,
        warnings: ['Hard fallback due to server error'],
        quality_score: { overall: 0.5 },
      });
    } catch {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
}
