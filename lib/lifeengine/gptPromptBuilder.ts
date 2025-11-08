import { PlanFormData } from "@/components/lifeengine/PlanForm";

export function buildDetailedGPTPrompt(formData: PlanFormData): string {
  const planTypesText = formData.planTypes
    .map((pt) => {
      switch (pt) {
        case "yoga":
          return "Yoga";
        case "diet":
          return "Diet/Nutrition";
        case "fitness":
          return "Fitness/Exercise";
        case "holistic":
          return "Holistic Wellness";
        case "mindfulness":
          return "Mindfulness/Meditation";
        default:
          return pt;
      }
    })
    .join(", ");

  const durationText = formData.duration.replace("_", " ").replace(/(\d+)/, "$1 ");
  
  const goalsText = formData.goals.length > 0 
    ? formData.goals.join(", ") 
    : "general wellness";

  const focusAreasText = formData.focusAreas.length > 0
    ? `\n- Focus Areas: ${formData.focusAreas.join(", ")}`
    : "";

  const chronicConditionsText = formData.chronicConditions.length > 0
    ? `\n- Health Conditions to Consider: ${formData.chronicConditions.join(", ")}`
    : "\n- Health Conditions: None reported";

  const workScheduleText = formData.workSchedule
    .replace("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const preferredTimeText = formData.preferredTime
    .replace("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const prompt = `Create a comprehensive, personalized ${planTypesText} wellness plan for ${formData.fullName}, a ${formData.age}-year-old ${formData.gender === "other" ? "individual" : formData.gender}.

**PLAN OVERVIEW**
- Duration: ${durationText}
- Primary Goals: ${goalsText}${focusAreasText}
- Intensity Level: ${formData.intensity}
- Work Schedule: ${workScheduleText}
- Preferred Time for Wellness Activities: ${preferredTimeText}

**HEALTH PROFILE**
- Diet Preference: ${formData.dietType.replace("_", " ")}
- Activity Level: ${formData.activityLevel}
- Sleep: ${formData.sleepHours} hours per night
- Stress Level: ${formData.stressLevel}${chronicConditionsText}

**DELIVERABLES**

For EACH day of the ${durationText} plan, provide:

${formData.planTypes.includes("yoga") ? `
🧘 **YOGA SECTION** (if selected)
- Daily yoga sequence with 5-8 poses
- For each pose include:
  * Pose name (Sanskrit and English)
  * Step-by-step instructions (numbered list)
  * Breathing pattern (inhale/exhale guidance)
  * Duration/hold time
  * Benefits and modifications
  * Form cues and safety tips
` : ""}

${formData.planTypes.includes("fitness") ? `
🏋️ **FITNESS/EXERCISE SECTION** (if selected)
- 4-6 exercises per session
- For each exercise include:
  * Exercise name and type
  * Step-by-step execution (numbered list)
  * Sets, reps, and rest periods
  * Form cues (posture, alignment)
  * Common mistakes to avoid
  * Progressions/regressions
  * Target muscles and benefits
` : ""}

${formData.planTypes.includes("diet") ? `
🥗 **DIET/NUTRITION SECTION** (if selected)
- Breakfast, Lunch, Dinner, and 2 snacks
- For each meal provide:
  * Meal name and timing
  * Complete ingredient list with quantities
  * Step-by-step recipe (if needed)
  * Macros (calories, protein, carbs, fats)
  * Prep time and cooking time
  * Dietary considerations (${formData.dietType})
  * Hydration reminders
` : ""}

${formData.planTypes.includes("mindfulness") ? `
🧠 **MINDFULNESS/MEDITATION SECTION** (if selected)
- Daily meditation practice (5-20 minutes)
- Breathing exercises
- Journaling prompts
- Stress management techniques
` : ""}

${formData.planTypes.includes("holistic") ? `
🌟 **HOLISTIC WELLNESS SECTION** (if selected)
- Sleep optimization tips
- Digital detox recommendations
- Social connection activities
- Self-care practices
- Environmental wellness
` : ""}

**FORMATTING REQUIREMENTS**

Return the plan as a JSON object with this structure:

\`\`\`json
{
  "plan_name": "string",
  "participant_name": "${formData.fullName}",
  "participant_age": ${formData.age},
  "participant_gender": "${formData.gender}",
  "duration_text": "${durationText}",
  "generated_at": "ISO timestamp",
  "plan_summary": {
    "goals": ["goal1", "goal2"],
    "plan_types": ${JSON.stringify(formData.planTypes)},
    "intensity": "${formData.intensity}",
    "focus_areas": ${JSON.stringify(formData.focusAreas)},
    "health_considerations": ${JSON.stringify(formData.chronicConditions)}
  },
  "weekly_schedule": {
    "day_1": {
      "date": "YYYY-MM-DD",
      "day_of_week": "Monday",
      "theme": "string",
      "yoga": {
        "duration_min": number,
        "sequence": [
          {
            "name": "Pose Name",
            "sanskrit_name": "Sanskrit Name",
            "steps": ["step 1", "step 2", ...],
            "breathing_instructions": "string",
            "duration_sec": number,
            "benefits": "string",
            "modifications": "string"
          }
        ]
      },
      "exercises": [
        {
          "name": "Exercise Name",
          "type": "strength|cardio|flexibility",
          "steps": ["step 1", "step 2", ...],
          "sets": number,
          "reps": number,
          "rest_sec": number,
          "form_cues": ["cue 1", "cue 2"],
          "target_muscles": ["muscle 1"],
          "benefits": "string"
        }
      ],
      "diet": {
        "breakfast": {
          "name": "Meal Name",
          "timing": "7:00 AM",
          "ingredients": ["item 1", "item 2"],
          "recipe_steps": ["step 1", "step 2"],
          "calories": number,
          "protein_g": number,
          "carbs_g": number,
          "fats_g": number,
          "prep_time_min": number
        },
        "lunch": { /* same structure */ },
        "dinner": { /* same structure */ },
        "snacks": [{ /* same structure */ }]
      },
      "mindfulness": {
        "meditation_type": "string",
        "duration_min": number,
        "instructions": ["step 1", "step 2"],
        "breathing_exercise": "string"
      },
      "holistic": {
        "sleep_tip": "string",
        "stress_management": "string",
        "self_care": "string"
      }
    },
    "day_2": { /* same structure */ },
    ...continue for all days
  },
  "shopping_list": {
    "produce": ["item1", "item2"],
    "proteins": ["item1", "item2"],
    "grains": ["item1", "item2"],
    "dairy": ["item1", "item2"],
    "other": ["item1", "item2"]
  },
  "equipment_needed": ["mat", "dumbbells", ...],
  "progress_tracking": {
    "metrics_to_track": ["weight", "energy_level", "sleep_quality"],
    "check_in_frequency": "weekly"
  },
  "notes": "Any additional guidance or modifications"
}
\`\`\`

**IMPORTANT INSTRUCTIONS**

1. Make the plan HIGHLY PERSONALIZED based on:
   - Work schedule (${workScheduleText}) - schedule activities accordingly
   - Preferred time (${preferredTimeText}) - optimize timing
   - Sleep (${formData.sleepHours} hours) - account for recovery needs
   - Stress level (${formData.stressLevel}) - adapt intensity
   - Health conditions - provide safe modifications

2. Include DETAILED STEP-BY-STEP instructions:
   - Every yoga pose must have 4-6 numbered steps
   - Every exercise must have 3-5 numbered steps
   - Every recipe must have complete cooking instructions

3. Account for ${formData.dietType.replace("_", " ")} dietary requirements

4. Ensure the ${formData.intensity} intensity level is appropriate for a ${formData.activityLevel} activity level

5. Provide ACTIONABLE, SPECIFIC guidance (not vague suggestions)

6. Include rest days and recovery guidance if duration > 1 week

7. Add motivational tips and progress milestones

8. Ensure JSON is valid and properly formatted

Generate the complete plan now.`;

  return prompt;
}

// Shorter version for display
export function buildPromptSummary(formData: PlanFormData): string {
  const planTypesText = formData.planTypes.join(", ");
  const goalsText = formData.goals.length > 0 ? formData.goals.join(", ") : "wellness";
  
  return `${planTypesText} plan for ${formData.fullName} (${formData.age}y, ${formData.gender}) 
- Goals: ${goalsText}
- Duration: ${formData.duration}
- Intensity: ${formData.intensity}
- Diet: ${formData.dietType}
- Activity Level: ${formData.activityLevel}
- Sleep: ${formData.sleepHours}h, Stress: ${formData.stressLevel}
- Work: ${formData.workSchedule}, Preferred Time: ${formData.preferredTime}
${formData.chronicConditions.length > 0 ? `- Health: ${formData.chronicConditions.join(", ")}` : ""}`;
}
