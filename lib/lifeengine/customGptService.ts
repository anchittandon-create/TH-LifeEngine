import type { Profile } from "@/lib/ai/schemas";
import type { LifeEnginePlan } from "@/app/types/lifeengine";
import { buildPromptFromForm, PromptBuilderInput, formatFormForAPI } from "./promptBuilder";
import { generatePlanWithGPT, generatePlan, formatErrorMessage } from "./api";
import type { PlanFormState } from "./planConfig";

export type CustomGptResult = {
  plan: LifeEnginePlan;
  rawText: string;
  prompt: string;
  metadata?: any;
  validationWarnings?: string[];
};

/**
 * Validates that a plan includes step-by-step instructions
 */
export function validateStepByStepContent(plan: LifeEnginePlan): {
  isValid: boolean;
  warnings: string[];
  score: number;
} {
  const warnings: string[] = [];
  let totalScore = 0;
  let maxScore = 0;

  // Check weekly schedule
  const days = Object.keys(plan.weekly_schedule);
  
  days.forEach((dayKey) => {
    const dayPlan = plan.weekly_schedule[dayKey as keyof typeof plan.weekly_schedule];
    if (!dayPlan) return;

    // Validate Yoga poses have step-by-step instructions
    if (dayPlan.yoga?.sequence) {
      dayPlan.yoga.sequence.forEach((pose, idx) => {
        maxScore += 3; // 3 points per pose (steps, breathing, benefits)
        
        if (pose.steps && pose.steps.length > 0) {
          totalScore += 1;
        } else {
          warnings.push(`${dayKey}: Yoga pose "${pose.name}" missing step-by-step instructions`);
        }

        if (pose.breathing_instructions) {
          totalScore += 1;
        } else {
          warnings.push(`${dayKey}: Yoga pose "${pose.name}" missing breathing instructions`);
        }

        if (pose.benefits) {
          totalScore += 1;
        } else {
          warnings.push(`${dayKey}: Yoga pose "${pose.name}" missing benefits description`);
        }
      });
    }

    // Validate Exercises have detailed instructions
    if (dayPlan.exercises) {
      dayPlan.exercises.forEach((exercise) => {
        maxScore += 3; // 3 points per exercise (steps, form_cues, sets/reps)
        
        if (exercise.steps && exercise.steps.length > 0) {
          totalScore += 1;
        } else {
          warnings.push(`${dayKey}: Exercise "${exercise.name}" missing step-by-step instructions`);
        }

        if (exercise.form_cues && exercise.form_cues.length > 0) {
          totalScore += 1;
        } else {
          warnings.push(`${dayKey}: Exercise "${exercise.name}" missing form cues`);
        }

        if ((exercise.sets && exercise.reps) || exercise.duration_min) {
          totalScore += 1;
        } else {
          warnings.push(`${dayKey}: Exercise "${exercise.name}" missing sets/reps or duration`);
        }
      });
    }

    // Validate Meals have recipe steps
    if (dayPlan.diet) {
      const meals = ['breakfast', 'lunch', 'dinner'] as const;
      meals.forEach((mealType) => {
        const meal = dayPlan.diet?.[mealType];
        if (meal) {
          maxScore += 2; // 2 points per meal (ingredients, recipe_steps)
          
          if (meal.ingredients && meal.ingredients.length > 0) {
            totalScore += 1;
          } else {
            warnings.push(`${dayKey}: ${mealType} missing ingredients list`);
          }

          if (meal.recipe_steps && meal.recipe_steps.length > 0) {
            totalScore += 1;
          } else {
            warnings.push(`${dayKey}: ${mealType} missing recipe steps`);
          }
        }
      });
    }
  });

  const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const isValid = score >= 70; // Consider valid if 70% or more criteria met

  return {
    isValid,
    warnings,
    score,
  };
}

export async function requestPlanFromCustomGPT(options: {
  form: PlanFormState;
  profileId: string;
  profile?: Profile;
  model?: string;
}): Promise<CustomGptResult> {
  const { form, profileId, profile, model } = options;
  const promptInput: PromptBuilderInput = {
    ...form,
    profileName: profile?.name,
    age: profile?.age,
    gender: profile?.gender,
  };

  const prompt = buildPromptFromForm(promptInput);
  const response = await generatePlanWithGPT({ prompt, profileId, model });
  const planText = response.plan?.trim();

  if (!planText) {
    throw new Error("CustomGPT returned an empty response");
  }

  try {
    const parsed = JSON.parse(planText) as LifeEnginePlan;
    
    // Validate step-by-step content
    const validation = validateStepByStepContent(parsed);
    
    console.log(`📊 [CustomGPT] Step-by-step validation score: ${validation.score}%`);
    if (validation.warnings.length > 0) {
      console.warn(`⚠️ [CustomGPT] Validation warnings (${validation.warnings.length}):`, validation.warnings.slice(0, 5));
    }
    
    return {
      plan: parsed,
      rawText: planText,
      prompt,
      metadata: {
        ...response.metadata,
        validation: {
          score: validation.score,
          isValid: validation.isValid,
          warningCount: validation.warnings.length,
        },
      },
      validationWarnings: validation.warnings,
    };
  } catch (error) {
    throw new Error(
      `CustomGPT returned invalid JSON. ${formatErrorMessage(error as Error)}`
    );
  }
}

export async function fallbackToRuleEngine(
  form: PlanFormState,
  profileId: string
): Promise<string> {
  const payload = formatFormForAPI(form, profileId);
  const planResponse = await generatePlan(payload);
  return planResponse.planId;
}
