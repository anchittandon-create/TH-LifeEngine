import { GoogleGenerativeAI } from '@google/generative-ai';
import { GOOGLE_API_KEY } from '../utils/env';
import { PLANNER_PROMPT } from './prompts';
import type { Intake } from '../domain/intake';
import type { Plan } from '../domain/plan';

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

export async function generatePlan(intake: Intake): Promise<Plan> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `${PLANNER_PROMPT}\n\nIntake: ${JSON.stringify(intake)}`;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  return JSON.parse(text);
}
