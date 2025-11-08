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

  // Header with critical emphasis
  parts.push("═══════════════════════════════════════════════════════════════");
  parts.push("🎯 WELLNESS PLAN GENERATOR - DETAILED STEP-BY-STEP INSTRUCTIONS REQUIRED");
  parts.push("═══════════════════════════════════════════════════════════════");
  parts.push("");
  parts.push("⚠️  IMPORTANT: This plan will be followed by a REAL USER at home.");
  parts.push("    You MUST provide EXTREMELY DETAILED, STEP-BY-STEP instructions for:");
  parts.push("    - Every yoga pose (minimum 5 steps per pose)");
  parts.push("    - Every exercise (minimum 5 steps per exercise)");
  parts.push("    - Every meal recipe (minimum 5 cooking steps per meal)");
  parts.push("    - Complete nutrition data for ALL meals");
  parts.push("    - Calorie burn estimates for ALL activities");
  parts.push("");
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
  parts.push("═══════════════════════════════════════════════════════════════");
  parts.push("🚨 CRITICAL INSTRUCTIONS - READ CAREFULLY:");
  parts.push("═══════════════════════════════════════════════════════════════");
  parts.push("");
  parts.push("This plan MUST be designed for a USER to FOLLOW AT HOME.");
  parts.push("The user needs CLEAR, DETAILED, STEP-BY-STEP instructions for EVERYTHING.");
  parts.push("Imagine you're writing a guide for someone who's never done these activities before.");
  parts.push("");
  parts.push("**MANDATORY: Include STEP-BY-STEP DETAILS for everything:**");
  parts.push("");
  parts.push("🧘 **For Yoga Poses:**");
  parts.push("- **MINIMUM 5 DETAILED STEPS** for each pose (e.g., 'Step 1: Stand with feet hip-width apart, arms at sides')");
  parts.push("- Include EXACT breathing pattern (e.g., 'Inhale deeply for 4 counts as you raise arms, exhale slowly for 6 counts as you fold forward')");
  parts.push("- List 3-5 specific benefits (e.g., 'Improves flexibility in hamstrings', 'Relieves lower back tension')");
  parts.push("- Specify EXACT duration (e.g., 'Hold for 3 minutes' NOT just '3 min')");
  parts.push("- Add 2-3 modifications (e.g., 'Beginners: Use a yoga block under hands', 'Limited flexibility: Bend knees slightly')");
  parts.push("- List 2-3 common mistakes (e.g., 'Don't lock knees', 'Avoid arching lower back')");
  parts.push("- **MUST INCLUDE**: Estimated calories burned (realistic, e.g., 15-30 cal for 3 minutes)");
  parts.push("");
  parts.push("🏋️ **For Exercises:**");
  parts.push("- **MINIMUM 5 DETAILED STEPS** for proper form (e.g., 'Step 1: Lie flat on bench, feet planted firmly on ground', 'Step 2: Grip barbell slightly wider than shoulder-width', 'Step 3: Lower bar slowly to mid-chest over 3 seconds')");
  parts.push("- Include EXACT sets & reps (e.g., '3 sets of 12 reps' OR '4 sets of 30 seconds')");
  parts.push("- Specify rest periods (e.g., '60 seconds rest between sets', '2 minutes rest before next exercise')");
  parts.push("- Add 3-5 form cues (e.g., 'Keep back straight', 'Core engaged throughout', 'Shoulders pulled back', 'Control the movement')");
  parts.push("- List 3-5 common mistakes (e.g., 'Don't arch back', 'Avoid locking elbows', 'Don't use momentum')");
  parts.push("- Provide progression (e.g., 'Advanced: Add 5kg weight', 'Progress to single-leg variation')");
  parts.push("- Provide regression (e.g., 'Beginners: Do on knees', 'Start with bodyweight only')");
  parts.push("- **MUST INCLUDE**: Estimated calories burned (realistic based on intensity and duration)");
  parts.push("- **MUST INCLUDE**: Target muscles worked as array (e.g., ['chest', 'triceps', 'shoulders', 'core'])");
  parts.push("");
  parts.push("🥗 **For Meals (MOST IMPORTANT - USER MUST BE ABLE TO COOK THIS):**");
  parts.push("- List ALL ingredients with EXACT quantities (e.g., '2 large eggs', '100g boneless chicken breast', '1 tablespoon olive oil', '1/2 cup chopped spinach')");
  parts.push("- **MINIMUM 5 DETAILED RECIPE STEPS** (e.g., 'Step 1: Heat 1 tbsp olive oil in non-stick pan over medium heat (2 minutes)', 'Step 2: Add chicken breast, season with salt and pepper, cook for 6-7 minutes per side until golden brown', 'Step 3: Remove chicken, add spinach to same pan, sauté for 2 minutes until wilted')");
  parts.push("- Include EXACT preparation time (e.g., 'Prep time: 10 minutes')");
  parts.push("- Include EXACT cooking time (e.g., 'Cook time: 15 minutes')");
  parts.push("- Add portion guidance (e.g., 'Serves 1 person', '1.5 cups total', 'Fills a dinner plate')");
  parts.push("- Suggest 1-2 healthy swaps (e.g., 'Swap chicken for tofu', 'Use whole wheat bread instead of white')");
  parts.push("- Add cooking tips (e.g., 'For extra flavor, marinate chicken for 30 minutes', 'Toast bread lightly for better texture')");
  parts.push("- **MUST INCLUDE**: Total calories (e.g., 350 calories)");
  parts.push("- **MUST INCLUDE**: Protein in grams (e.g., 25g)");
  parts.push("- **MUST INCLUDE**: Carbs in grams (e.g., 30g)");
  parts.push("- **MUST INCLUDE**: Fat in grams (e.g., 12g)");
  parts.push("- **MUST INCLUDE**: Fiber in grams (e.g., 5g)");
  parts.push("- **OPTIONAL**: Sugar and sodium if relevant");
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
        "name": "Downward Facing Dog (Adho Mukha Svanasana)",
        "duration_min": 3,
        "focus": "Full body stretch, hamstrings, shoulders",
        "benefits": "Stretches hamstrings and calves, strengthens arms and shoulders, energizes the body, relieves tension in spine",
        "steps": [
          "Step 1: Start on hands and knees with wrists under shoulders and knees under hips",
          "Step 2: Spread fingers wide and press palms firmly into mat",
          "Step 3: Tuck toes under and lift hips up and back, straightening legs",
          "Step 4: Press chest toward thighs, keeping spine long and neutral",
          "Step 5: Relax head and neck, gaze toward feet or navel",
          "Step 6: Hold position while breathing deeply, pressing heels toward floor"
        ],
        "breathing_instructions": "Inhale deeply through nose for 4 counts, exhale slowly through nose for 6 counts. Maintain steady breath throughout the pose.",
        "modifications": "Beginners: Keep knees slightly bent if hamstrings are tight. Use yoga blocks under hands to reduce wrist strain. Advanced: Lift one leg at a time for three-legged dog variation.",
        "common_mistakes": ["Don't round the spine or hunch shoulders", "Avoid locking elbows", "Don't let weight shift too far forward onto hands"],
        "calories_burned": 25
      }
    ],
    "breathwork": string,
    "cooldown_min": number,
    "journal_prompt": string,
    "focus_area": string
  },
  "diet": {
    "breakfast": {
      "title": "Protein-Packed Veggie Omelette",
      "ingredients": [
        "3 large eggs",
        "1/2 cup chopped bell peppers (red and green)",
        "1/4 cup diced onions",
        "1/2 cup fresh spinach leaves",
        "1 tablespoon olive oil",
        "1/4 cup shredded cheese (optional)",
        "Salt and black pepper to taste",
        "Fresh herbs (parsley or chives) for garnish"
      ],
      "recipe_steps": [
        "Step 1: Heat 1 tablespoon olive oil in a non-stick pan over medium heat for 1-2 minutes",
        "Step 2: Add diced onions and bell peppers, sauté for 3-4 minutes until softened and slightly golden",
        "Step 3: Add spinach leaves and cook for 1 minute until wilted, then transfer vegetables to a plate",
        "Step 4: In a bowl, crack 3 eggs, add salt and pepper, whisk vigorously for 30 seconds until well combined and slightly frothy",
        "Step 5: Pour egg mixture into the same pan, let it sit for 30 seconds without stirring",
        "Step 6: Add cooked vegetables to one half of the omelette, sprinkle cheese if using",
        "Step 7: When edges are set but center is still slightly runny (about 2 minutes), carefully fold omelette in half using spatula",
        "Step 8: Cook for another 1-2 minutes until fully set, then slide onto plate and garnish with fresh herbs"
      ],
      "preparation_time": "5 minutes",
      "cooking_time": "8 minutes",
      "portion_guidance": "Serves 1 person. Fills approximately half a standard dinner plate.",
      "notes": "For fluffier omelette, add 1 tablespoon of milk to eggs before whisking",
      "swap": "Vegan option: Use 1/2 cup chickpea flour mixed with water instead of eggs. Dairy-free: Skip cheese or use nutritional yeast.",
      "calories": 320,
      "protein_g": 22,
      "carbs_g": 12,
      "fat_g": 21,
      "fiber_g": 3,
      "sugar_g": 6,
      "sodium_mg": 380
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
      "name": "Push-ups",
      "type": "strength",
      "sets": 3,
      "reps": 12,
      "rest_period": "60 seconds between sets",
      "steps": [
        "Step 1: Start in plank position with hands placed slightly wider than shoulder-width apart, fingers pointing forward",
        "Step 2: Position body in straight line from head to heels, feet hip-width apart, core engaged and glutes tight",
        "Step 3: Lower body by bending elbows at 45-degree angle, keeping them close to sides (not flaring out)",
        "Step 4: Descend until chest is 1-2 inches from floor, maintaining rigid body alignment throughout",
        "Step 5: Press through palms explosively to return to start position, fully extending arms without locking elbows",
        "Step 6: Repeat for prescribed reps, maintaining consistent tempo: 2 seconds down, 1 second pause, 1 second up"
      ],
      "form_cues": [
        "Keep core tight and engaged throughout entire movement",
        "Don't let hips sag or pike up - maintain straight body line",
        "Look at floor about 6 inches in front of hands to keep neck neutral",
        "Squeeze shoulder blades together at bottom of movement",
        "Breathe in on way down, breathe out on way up"
      ],
      "common_mistakes": [
        "Don't let elbows flare out to 90 degrees - keep them at 45 degrees",
        "Avoid sagging hips or piking hips up high",
        "Don't lock elbows at top of movement",
        "Don't rush through reps - maintain control"
      ],
      "progressions": "Advanced: Elevate feet on bench for decline push-ups. Add weight vest. Progress to archer push-ups or one-arm push-ups.",
      "regressions": "Beginners: Perform on knees (knee push-ups). Use wall push-ups if floor is too difficult. Reduce range of motion initially.",
      "duration_min": 5,
      "calories_burned": 35,
      "target_muscles": ["chest", "triceps", "shoulders", "core"]
    }
  ]
}`);
  parts.push("");
  parts.push("DO NOT include Markdown fences. Respond with pure JSON only.");
  parts.push("");
  parts.push("═══════════════════════════════════════════════════════════════");
  parts.push("🚨 VALIDATION REQUIREMENTS - PLAN WILL BE REJECTED IF MISSING:");
  parts.push("═══════════════════════════════════════════════════════════════");
  parts.push("");
  parts.push("✅ 1. EVERY MEAL must have: calories, protein_g, carbs_g, fat_g, fiber_g");
  parts.push("      - Example: {'calories': 450, 'protein_g': 28, 'carbs_g': 35, 'fat_g': 15, 'fiber_g': 6}");
  parts.push("");
  parts.push("✅ 2. EVERY MEAL must have: ingredients array (with quantities) + recipe_steps array (minimum 5 steps)");
  parts.push("      - Example ingredients: ['2 large eggs', '100g chicken breast', '1 tbsp olive oil']");
  parts.push("      - Example steps: ['Step 1: Heat oil in pan...', 'Step 2: Add chicken...', 'Step 3: Cook for 7 minutes...']");
  parts.push("");
  parts.push("✅ 3. EVERY YOGA POSE must have: steps array (minimum 5 steps), breathing_instructions, calories_burned");
  parts.push("      - Example steps: ['Step 1: Stand with feet...', 'Step 2: Raise arms...', 'Step 3: Bend forward...']");
  parts.push("      - Example breathing: 'Inhale for 4 counts as you raise arms, exhale for 6 counts as you fold'");
  parts.push("");
  parts.push("✅ 4. EVERY EXERCISE must have: steps array (minimum 5 steps), form_cues array, calories_burned, target_muscles");
  parts.push("      - Example steps: ['Step 1: Start position...', 'Step 2: Lower weight...', 'Step 3: Press up...']");
  parts.push("      - Example form_cues: ['Keep back straight', 'Core engaged', 'Control the movement']");
  parts.push("      - Example target_muscles: ['chest', 'triceps', 'shoulders']");
  parts.push("");
  parts.push("✅ 5. ALL nutritional values must be REALISTIC and ACCURATE for the portion sizes given");
  parts.push("");
  parts.push("✅ 6. ALL recipe_steps must be DETAILED enough that a beginner can follow them");
  parts.push("      - Include cooking times, temperatures, visual cues (e.g., 'until golden brown')");
  parts.push("");
  parts.push("✅ 7. ALL exercise/yoga steps must describe the FULL MOVEMENT from start to finish");
  parts.push("      - Don't just say 'Do a push-up' - explain hand position, body alignment, movement pattern");
  parts.push("");
  parts.push("🚨 REMEMBER: This plan is for a REAL USER who will follow these instructions AT HOME.");
  parts.push("   They need COMPLETE, CLEAR, STEP-BY-STEP guidance. BE DETAILED!");
  parts.push("");
  parts.push("═══════════════════════════════════════════════════════════════");

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
