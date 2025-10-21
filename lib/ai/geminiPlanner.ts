import { GoogleGenerativeAI } from '@google/generative-ai';
import { GOOGLE_API_KEY } from '../utils/env';
import { PLANNER_PROMPT } from './prompts';
import type { Intake, Plan, Profile } from './schemas';

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

export async function generatePlan(profile: Profile, intake: Intake): Promise<Plan> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = PLANNER_PROMPT
    .replace('{age}', profile.age.toString())
    .replace('{gender}', profile.gender)
    .replace('{goals}', profile.goals.join(', '))
    .replace('{experience}', profile.experience)
    .replace('{healthConcerns}', profile.healthConcerns)
    .replace('{preferredTime}', profile.preferredTime)
    .replace('{primaryPlanType}', intake.primaryPlanType)
    .replace('{secondaryPlanType}', intake.secondaryPlanType || 'none')
    .replace('{startDate}', intake.startDate)
    .replace('{endDate}', intake.endDate);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    const parsed = JSON.parse(text);
    return {
      id: `plan_${Date.now()}`,
      profileId: profile.id,
      intakeId: intake.profileId, // using profileId as intakeId for now
      days: parsed.days || [],
    };
  } catch (error) {
    throw new Error(`Failed to parse plan from Gemini response: ${text}`);
  }
}