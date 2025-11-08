// Prompt Builder for Custom GPT Plan Generation
// Transforms form inputs into comprehensive GPT-4 prompts

import type { PlanFormData } from "@/components/lifeengine/PlanForm";

export interface CustomGPTFormData {
  // User Profile
  fullName: string;
  age: number;
  gender: string;
  
  // Plan Configuration
  duration: string; // "1_week", "2_weeks", "3_weeks", "1_month", "3_months", "6_months"
  planTypes: string[]; // ["yoga", "fitness", "diet", etc.]
  goals: string[]; // ["weight_loss", "stress_relief", etc.]
  
  // Health & Lifestyle
  dietType: string;
  activityLevel: string;
  chronicConditions: string[];
  sleepHours: string;
  stressLevel: string;
  
  // Preferences
  workSchedule: string;
  preferredTime: string;
  intensity: string;
  focusAreas: string[];
}

/**
 * Build a comprehensive prompt for GPT-4 to generate a personalized wellness plan
 */
export function buildCustomGPTPrompt(form: CustomGPTFormData): string {
  // Parse duration
  const durationLabel = parseDurationLabel(form.duration);
  const durationDays = parseDurationDays(form.duration);
  
  // Format lists
  const planTypesStr = form.planTypes.length > 0 
    ? form.planTypes.join(", ") 
    : "comprehensive wellness";
  const goalsStr = form.goals.length > 0 
    ? form.goals.join(", ") 
    : "overall health improvement";
  const conditionsStr = form.chronicConditions.length > 0 
    ? form.chronicConditions.filter(c => c !== "None").join(", ") 
    : "none";
  const focusAreasStr = form.focusAreas.length > 0 
    ? form.focusAreas.join(", ") 
    : "balanced approach";

  const prompt = `You are an expert holistic wellness and fitness planner certified in yoga, nutrition, mental health, and physical training.

Create a ${durationLabel} personalized wellness plan for:

**PROFILE:**
- Name: ${form.fullName}
- Age: ${form.age} years old
- Gender: ${form.gender}
- Activity Level: ${form.activityLevel}
- Work Schedule: ${formatWorkSchedule(form.workSchedule)}
- Preferred Workout Time: ${formatPreferredTime(form.preferredTime)}

**HEALTH & LIFESTYLE:**
- Dietary Preference: ${formatDietType(form.dietType)}
- Sleep: ${form.sleepHours} hours per night
- Stress Level: ${form.stressLevel}
- Medical Conditions: ${conditionsStr}

**PLAN REQUIREMENTS:**
- Duration: ${durationDays} days (${durationLabel})
- Plan Types: ${planTypesStr}
- Goals: ${goalsStr}
- Focus Areas: ${focusAreasStr}
- Intensity: ${form.intensity}

**OUTPUT FORMAT:**
Provide a day-by-day plan in the following structure for each day:

Day [Number]:
Date: [Day of week]

🧘 Morning Yoga/Movement (20-30 min)
- Flow name and focus
- 3-5 key poses with instructions
- Breathing technique
- Benefits

🏋️ Workout/Exercise (if applicable)
- Exercise type and duration
- 3-5 exercises with sets/reps or duration
- Form cues
- Modifications

🥗 Meal Plan
Breakfast:
- Meal name
- Key ingredients
- Portion guidance
- Nutritional highlights

Lunch:
- Meal name
- Key ingredients  
- Portion guidance

Dinner:
- Meal name
- Key ingredients
- Portion guidance

Snacks (1-2):
- Options with portions

💧 Hydration: Daily water intake recommendation

🧠 Mindfulness/Mental Health
- Practice or activity (5-10 min)
- Affirmation or journal prompt

😴 Evening Routine
- Wind-down activities
- Sleep hygiene tip

📝 Notes & Tips
- Key focus for the day
- Progress tracking suggestion

**IMPORTANT GUIDELINES:**
1. Ensure meals align with ${formatDietType(form.dietType)} dietary preference
2. Consider ${conditionsStr} when recommending exercises and foods
3. Scale intensity based on "${form.activityLevel}" activity level
4. Make it actionable and realistic for someone with "${formatWorkSchedule(form.workSchedule)}" schedule
5. Include variety and progression across days
6. Add motivational elements and celebrate small wins
7. Provide modifications for beginners
8. Include rest/recovery days as appropriate
9. Make each day unique but with consistent structure
10. Focus on sustainable habits, not extreme changes

Generate the complete ${durationDays}-day plan now.`;

  return prompt;
}

/**
 * Build a system message for GPT-4 to set the context
 */
export function buildSystemMessage(): string {
  return `You are TH-LifeEngine, an expert certified holistic wellness and fitness planner with deep knowledge in:

- Yoga and mindful movement practices
- Exercise science and strength training
- Nutrition and dietary planning
- Mental health and stress management
- Sleep optimization
- Habit formation and behavior change
- Chronic condition management (PCOS, diabetes, thyroid, etc.)

Your responses are:
✓ Evidence-based and scientifically accurate
✓ Personalized to individual needs and constraints
✓ Practical and actionable
✓ Supportive and motivating
✓ Structured and easy to follow
✓ Mindful of safety and modifications
✓ Focused on sustainable lifestyle changes

You provide comprehensive day-by-day wellness plans that integrate physical fitness, nutrition, mental health, and lifestyle practices into a cohesive, achievable program.`;
}

/**
 * Parse duration label for display
 */
function parseDurationLabel(duration: string): string {
  const match = duration.match(/(\d+)_(week|month)s?/);
  if (!match) return duration;
  
  const [, num, unit] = match;
  return `${num} ${unit}${num !== "1" ? "s" : ""}`;
}

/**
 * Parse duration to number of days
 */
function parseDurationDays(duration: string): number {
  if (duration.includes("week")) {
    const weeks = parseInt(duration.match(/\d+/)?.[0] || "1", 10);
    return weeks * 7;
  } else if (duration.includes("month")) {
    const months = parseInt(duration.match(/\d+/)?.[0] || "1", 10);
    return months * 30;
  }
  return parseInt(duration.match(/\d+/)?.[0] || "7", 10);
}

/**
 * Format work schedule for prompt
 */
function formatWorkSchedule(schedule: string): string {
  const scheduleMap: Record<string, string> = {
    "9_to_5": "9 AM - 5 PM (Standard Office)",
    "flexible": "Flexible Hours",
    "night_shift": "Night Shift",
    "rotating": "Rotating Shifts",
    "part_time": "Part Time",
    "student": "Student Schedule",
  };
  return scheduleMap[schedule] || schedule;
}

/**
 * Format preferred time for prompt
 */
function formatPreferredTime(time: string): string {
  const timeMap: Record<string, string> = {
    "morning": "Morning (6-9 AM)",
    "late_morning": "Late Morning (9-12 PM)",
    "afternoon": "Afternoon (12-3 PM)",
    "evening": "Evening (6-9 PM)",
    "night": "Night (9 PM+)",
    "flexible": "Flexible",
  };
  return timeMap[time] || time;
}

/**
 * Format diet type for prompt
 */
function formatDietType(dietType: string): string {
  const dietMap: Record<string, string> = {
    "veg": "Vegetarian",
    "vegan": "Vegan",
    "eggetarian": "Eggetarian (Vegetarian + Eggs)",
    "non_veg": "Non-Vegetarian",
    "jain": "Jain (No root vegetables)",
    "gluten_free": "Gluten-Free",
    "lactose_free": "Lactose-Free",
  };
  return dietMap[dietType] || dietType;
}

/**
 * Estimate token count for prompt (rough approximation)
 * GPT-4 uses ~1 token per 4 characters
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Validate form data before generating prompt
 */
export function validateFormData(form: CustomGPTFormData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!form.fullName || form.fullName.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  if (form.age < 10 || form.age > 100) {
    errors.push("Age must be between 10 and 100");
  }

  if (!form.planTypes || form.planTypes.length === 0) {
    errors.push("Select at least one plan type");
  }

  if (!form.duration) {
    errors.push("Select a plan duration");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
