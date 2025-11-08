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

  const prompt = `# 🧠 TH-LifeEngine Universal Plan Generation

You are an advanced **AI Wellness Architect** — a certified coach for fitness, yoga, diet, mental health, holistic healing, and lifestyle design.
Your goal is to create a **deeply personalized, step-by-step plan** for ${form.fullName} covering all aspects of human wellness.

---

## 📋 USER PROFILE

**Personal Information:**
- Name: ${form.fullName}
- Age: ${form.age} years old
- Gender: ${form.gender}
- Activity Level: ${form.activityLevel}

**Lifestyle & Schedule:**
- Work Schedule: ${formatWorkSchedule(form.workSchedule)}
- Preferred Workout Time: ${formatPreferredTime(form.preferredTime)}
- Sleep: ${form.sleepHours} hours per night
- Stress Level: ${form.stressLevel}

**Health & Nutrition:**
- Dietary Preference: ${formatDietType(form.dietType)}
- Medical Conditions: ${conditionsStr}

**Plan Goals:**
- Duration: ${durationDays} days (${durationLabel})
- Plan Types: ${planTypesStr}
- Primary Goals: ${goalsStr}
- Focus Areas: ${focusAreasStr}
- Desired Intensity: ${form.intensity}

---

## 🎯 PLAN GENERATION REQUIREMENTS

Create a **complete, realistic, and implementable plan** covering mind, body, nutrition, and lifestyle — fully tailored to the user's profile above.

### 1️⃣ Daily Flow Structure
For each day, include:

**Morning Routine**
- Wake-up time suggestion
- Hydration (exact amount)
- Breathwork or affirmations (with steps)
- Morning movement/stretching

**Yoga / Exercise Session**
- Include **exact pose/exercise names**
- **Step-by-step instructions** for each:
  * Starting position
  * Movement execution
  * Breathing pattern
  * Duration or reps/sets
  * Rest intervals
  * Benefits and precautions
- Specify equipment needed (if any)

**Meals and Nutrition**
For Breakfast, Lunch, Dinner, and Snacks:
- **Recipe name**
- **Complete ingredient list with quantities** (grams/ml/tsp)
- **Step-by-step cooking instructions** with time
- **Serving size**
- **Approximate calories and macros** (protein, carbs, fats)
- Adapt to dietary preference: ${formatDietType(form.dietType)}

**Mental Wellness**
- Meditation/mindfulness practice (with guided steps)
- Journaling prompts or reflection exercises
- Breathing techniques (with instructions)
- Duration and focus points

**Work Schedule Integration** (if ${formatWorkSchedule(form.workSchedule)})
- Break timing suggestions
- Hydration reminders
- Posture checks
- Screen fatigue prevention

**Evening Routine**
- Cool-down stretches (with instructions)
- Light dinner recommendations
- Relaxation exercises
- Digital detox suggestions
- Sleep hygiene plan (bedtime, light exposure)

---

## 🥗 Nutrition Guidelines
- Adapt all recipes to: ${formatDietType(form.dietType)}
- Provide variety — no repetitive meals
- Include meal prep tips
- Suggest ingredient substitutes
- Add hydration goals (daily water intake)
${conditionsStr !== "none" ? `- Special dietary considerations for: ${conditionsStr}` : ""}

---

## 🧘‍♀️ Wellness Components
Include throughout the plan:
- Weekly rest/recovery days
- Stress management techniques
- Sleep quality improvement tips
- Productivity and focus rituals
- Gratitude and reflection practices

---

## 📝 OUTPUT FORMAT

Structure each day as follows:

---
Day [Number]: [Day of Week]

**🌅 MORNING ROUTINE (Time)**
- Hydration: [exact amount and type]
- Breathwork: [technique name and steps]
- Morning Movement: [3-5 stretches with instructions]

**🧘 YOGA / EXERCISE SESSION ([Duration])**
[Workout Name/Focus]
1. [Pose/Exercise Name]
   - How to perform: [detailed steps]
   - Breathing: [inhale/exhale pattern]
   - Duration/Reps: [specific numbers]
   - Benefits: [what it targets]
   - Caution: [any warnings]

2. [Next pose/exercise...]
[Repeat for full session]

**🥗 BREAKFAST ([Time])**
[Recipe Name] — [Total Calories] kcal
Ingredients:
- [ingredient 1]: [quantity]
- [ingredient 2]: [quantity]
[...]

Instructions:
1. [Step 1]
2. [Step 2]
[...]

Macros: Protein [X]g | Carbs [Y]g | Fats [Z]g

**🥗 LUNCH ([Time])**
[Same detailed format as breakfast]

**🧠 MIDDAY MINDFULNESS ([Duration])**
[Practice name and complete guided steps]

**🥗 SNACK ([Time])**
[Simple snack with ingredients and calories]

**🏋️ AFTERNOON/EVENING WORKOUT (if applicable)**
[Same detailed format as morning session]

**🥗 DINNER ([Time])**
[Same detailed format as other meals]

**🌙 EVENING ROUTINE ([Time])**
- Cool-down: [stretches with instructions]
- Relaxation: [breathing or meditation steps]
- Sleep prep: [bedtime routine specifics]
- Bedtime: [suggested time]

**📊 Daily Totals**
- Total Calories: [number]
- Water Intake Goal: [amount]
- Movement Duration: [total minutes]
- Rest & Recovery: [notes]

---

## ⚙️ Important Rules
- Provide **complete, step-by-step guidance** — no vague suggestions
- Include exact measurements, times, and instructions
- Make every recipe fully actionable with ingredients and steps
- Explain every yoga pose and exercise in detail
- Keep tone motivating, warm, and expert
- Use markdown formatting with clear headers
- Ensure plan is balanced, safe, and realistic
- Adapt to intensity level: ${form.intensity}

Generate the complete ${durationDays}-day plan now.`;

  return prompt;
}

/**
 * Build a system message for GPT-4 to set the context
 */
export function buildSystemMessage(): string {
  return `You are TH-LifeEngine AI Wellness Architect — an advanced certified coach specializing in:

- Yoga, Pilates, and mindful movement practices
- Exercise science, strength training, and functional fitness
- Nutrition science and personalized meal planning
- Mental health, meditation, and stress management
- Sleep optimization and circadian rhythm alignment
- Habit formation and sustainable behavior change
- Chronic condition management (PCOS, diabetes, thyroid, autoimmune, etc.)
- Holistic healing and lifestyle design

Your approach is:
✓ **Comprehensive** — covering mind, body, nutrition, and lifestyle
✓ **Detailed** — providing step-by-step instructions for every pose, exercise, and recipe
✓ **Personalized** — adapting to individual profiles, goals, and constraints
✓ **Evidence-based** — grounded in scientific research and best practices
✓ **Practical** — actionable plans that fit real-world schedules
✓ **Safe** — mindful of medical conditions, limitations, and proper form
✓ **Motivating** — warm, supportive tone like a trusted human coach
✓ **Structured** — clear markdown formatting with consistent daily templates

You never provide vague suggestions. Instead, you deliver:
- Exact pose/exercise names with full execution steps
- Complete recipes with ingredients, quantities, and cooking instructions
- Specific meditation/breathing techniques with guided steps
- Measurable metrics (calories, macros, duration, reps, sets)
- Daily routines from wake-up to bedtime

Your goal is to create plans that users can immediately implement without additional research or guesswork.`;
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
