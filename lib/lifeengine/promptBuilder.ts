import { PlanFormState } from "./planConfig";

export interface PromptBuilderInput extends PlanFormState {
  profileName?: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
}

/**
 * Builds a structured prompt from form data for GPT-based plan generation
 */
export function buildPromptFromForm(form: PromptBuilderInput): string {
  const parts: string[] = [];

  // Header
  parts.push("Create a personalized wellness plan with the following specifications:\n");

  // Personal Info
  if (form.profileName || form.age || form.gender) {
    parts.push("**Personal Information:**");
    if (form.profileName) parts.push(`- Name: ${form.profileName}`);
    if (form.age) parts.push(`- Age: ${form.age} years`);
    if (form.gender) parts.push(`- Gender: ${form.gender}`);
    if (form.weight) parts.push(`- Weight: ${form.weight} kg`);
    if (form.height) parts.push(`- Height: ${form.height} cm`);
    parts.push("");
  }

  // Plan Types
  if (form.planTypes && form.planTypes.length > 0) {
    parts.push(`**Plan Type:** ${form.planTypes.join(", ")}`);
  }

  // Duration & Intensity
  parts.push(`**Duration:** ${form.duration}`);
  parts.push(`**Intensity:** ${form.intensity}`);
  parts.push("");

  // Goals
  if (form.goals && form.goals.length > 0) {
    parts.push(`**Primary Goals:** ${form.goals.join(", ")}`);
  }

  // Focus Areas
  if (form.focusAreas && form.focusAreas.length > 0) {
    parts.push(`**Focus Areas:** ${form.focusAreas.join(", ")}`);
  }

  // Health & Lifestyle
  parts.push("\n**Health & Lifestyle:**");
  parts.push(`- Diet Type: ${form.dietType || "Not specified"}`);
  parts.push(`- Activity Level: ${form.activityLevel || "Not specified"}`);
  parts.push(`- Stress Level: ${form.stressLevel || "Not specified"}`);
  parts.push(`- Sleep: ${form.sleepHours || "Not specified"} hours per night`);

  // Chronic Conditions
  if (form.chronicConditions && form.chronicConditions.length > 0) {
    parts.push(`- Health Conditions to consider: ${form.chronicConditions.join(", ")}`);
  }

  // Additional Requirements
  parts.push("");
  parts.push("**Additional Requirements:**");
  parts.push(`- Output Format: ${form.format}`);
  parts.push(`- Include Daily Routine: ${form.includeDailyRoutine === "yes" ? "Yes" : "No"}`);

  // Instructions
  parts.push("");
  parts.push("**Instructions:**");
  parts.push("Please generate a comprehensive wellness plan that:");
  parts.push("1. Is tailored to the specifications above");
  parts.push("2. Includes specific exercises, meal suggestions, and daily routines");
  parts.push("3. Considers all health conditions and goals mentioned");
  parts.push("4. Provides actionable, easy-to-follow guidance");
  parts.push("5. Is structured in a clear, organized format");
  parts.push("");
  parts.push("**CRITICAL: Include STEP-BY-STEP DETAILS for everything:**");
  parts.push("");
  parts.push("🧘 **For Yoga Poses:**");
  parts.push("- Provide step-by-step instructions (e.g., 'Step 1: Stand with feet hip-width apart...')");
  parts.push("- Include breathing instructions (e.g., 'Inhale as you raise arms, exhale as you fold forward')");
  parts.push("- List specific benefits of each pose");
  parts.push("- Specify exact duration in minutes");
  parts.push("- Add modifications for beginners or those with limitations");
  parts.push("");
  parts.push("🏋️ **For Exercises:**");
  parts.push("- Provide exact sets & reps (e.g., '3 sets of 12 reps')");
  parts.push("- Include rest periods between sets (e.g., '60 seconds rest')");
  parts.push("- Add detailed form cues (e.g., 'Keep back straight, core engaged')");
  parts.push("- List common mistakes to avoid");
  parts.push("- Provide progressions/regressions");
  parts.push("");
  parts.push("🥗 **For Meals:**");
  parts.push("- List all ingredients with exact quantities");
  parts.push("- Provide numbered recipe steps (e.g., 'Step 1: Heat oil in pan...')");
  parts.push("- Include preparation time and cooking time");
  parts.push("- Add portion guidance (e.g., '1 cup serving')");
  parts.push("- Suggest healthy swaps when possible");
  parts.push("");
  parts.push("Return your answer as VALID JSON matching this shape:");
  parts.push(`{
  "motivation": string,
  "category_tag": string,
  "summary": string,
  "weekly_schedule": {
    "monday": DayPlan,
    ...
    "sunday": DayPlan
  },
  "recovery_tips": string[],
  "hydration_goals": string,
  "metadata": {
    "generated_by": "gpt",
    "plan_type": string[],
    "language": "en",
    "timestamp": ISO8601,
    "profile_id": "${form.profileName ?? "unknown"}"
  },
  "disclaimer": string
}

Where DayPlan contains:
{
  "yoga": {
    "warmup_min": number,
    "sequence": [
      {
        "name": string,
        "duration_min": number,
        "focus": string,
        "benefits": string,
        "steps": string[], // ["Step 1: Begin in...", "Step 2: Inhale and...", ...]
        "breathing_instructions": string, // "Inhale for 4 counts, exhale for 6 counts"
        "modifications": string,
        "common_mistakes": string[]
      }
    ],
    "breathwork": string,
    "cooldown_min": number,
    "journal_prompt": string,
    "focus_area": string
  },
  "diet": {
    "breakfast": {
      "title": string,
      "ingredients": string[], // ["2 eggs", "1 cup spinach", "1 tbsp olive oil"]
      "recipe_steps": string[], // ["Step 1: Heat oil...", "Step 2: Add eggs..."]
      "preparation_time": string, // "10 minutes"
      "cooking_time": string, // "5 minutes"
      "portion_guidance": string,
      "notes": string,
      "swap": string
    },
    "lunch": {...same as breakfast...},
    "snacks": [...same structure...],
    "dinner": {...same as breakfast...},
    "evening_tea": {...}
  },
  "holistic": {
    "mindfulness": string,
    "affirmation": string,
    "sleep": string,
    "rest_day": boolean
  },
  "exercises": [
    {
      "name": string,
      "type": string, // "strength", "cardio", "flexibility"
      "sets": number,
      "reps": number | string, // "12" or "30 seconds"
      "rest_period": string, // "60 seconds"
      "steps": string[], // ["Step 1: Start position...", "Step 2: Movement..."]
      "form_cues": string[], // ["Keep back straight", "Engage core"]
      "common_mistakes": string[], // ["Don't arch back", "Avoid locking knees"]
      "progressions": string,
      "regressions": string,
      "duration_min": number
    }
  ]
}`);
  parts.push("");
  parts.push("DO NOT include Markdown fences. Respond with pure JSON only.");
  parts.push("");
  parts.push("REMEMBER: Every yoga pose, exercise, and meal MUST include step-by-step instructions!");

  return parts.join("\n");
}

/**
 * Builds a compact prompt for ChatGPT Custom GPT integration
 */
export function buildCompactPrompt(form: PromptBuilderInput, profileId: string): string {
  const parts: string[] = [];

  parts.push(`Create a ${form.duration} ${form.planTypes.join("+")} plan for profile_id: ${profileId}`);
  
  if (form.goals.length > 0) {
    parts.push(`Goals: ${form.goals.join(", ")}`);
  }
  
  if (form.focusAreas.length > 0) {
    parts.push(`Focus: ${form.focusAreas.join(", ")}`);
  }

  parts.push(`Intensity: ${form.intensity}`);
  parts.push(`Diet: ${form.dietType}, Activity: ${form.activityLevel}`);
  
  if (form.chronicConditions.length > 0) {
    parts.push(`Conditions: ${form.chronicConditions.join(", ")}`);
  }

  parts.push(`Sleep: ${form.sleepHours}h, Stress: ${form.stressLevel}`);

  return parts.join(" | ");
}

/**
 * Validates form data before submission
 */
export function validatePlanForm(form: PlanFormState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!form.planTypes || form.planTypes.length === 0) {
    errors.push("Please select at least one plan type");
  }

  if (!form.duration) {
    errors.push("Please select a duration");
  }

  if (!form.intensity) {
    errors.push("Please select an intensity level");
  }

  if (form.sleepHours) {
    const hours = parseInt(form.sleepHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      errors.push("Sleep hours must be between 0 and 24");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formats form data for API submission
 */
export function formatFormForAPI(form: PlanFormState, profileId: string) {
  return {
    profileId,
    intake: {
      primaryPlanType: form.planTypes[0] || "yoga",
      secondaryPlanType: form.planTypes[1] || "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: calculateEndDate(form.duration),
      preferences: {
        intensity: form.intensity,
        focusAreas: form.focusAreas,
        goals: form.goals,
        chronicConditions: form.chronicConditions,
        format: form.format,
        includeDailyRoutine: form.includeDailyRoutine === "yes",
        dietType: form.dietType,
        activityLevel: form.activityLevel,
        stressLevel: form.stressLevel,
        sleepHours: form.sleepHours,
      },
    },
  };
}

function calculateEndDate(duration: string): string {
  const today = new Date();
  let days = 7; // default 1 week

  if (duration.includes("week")) {
    const weeks = parseInt(duration.match(/\d+/)?.[0] || "1");
    days = weeks * 7;
  } else if (duration.includes("month")) {
    const months = parseInt(duration.match(/\d+/)?.[0] || "1");
    days = months * 30;
  } else if (duration.includes("day")) {
    days = parseInt(duration.match(/\d+/)?.[0] || "7");
  }

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  return endDate.toISOString().split("T")[0];
}
