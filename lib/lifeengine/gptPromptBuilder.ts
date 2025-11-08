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

**CRITICAL CONTENT REQUIREMENTS - READ CAREFULLY**

⚠️ **ONLY USE REAL, WELL-KNOWN EXERCISES AND POSES**

YOGA POSES - Use only authentic poses like:
- Tadasana (Mountain Pose), Adho Mukha Svanasana (Downward Dog)
- Virabhadrasana I/II/III (Warrior I/II/III)
- Trikonasana (Triangle Pose), Bhujangasana (Cobra Pose)
- Balasana (Child's Pose), Savasana (Corpse Pose)
- Surya Namaskar (Sun Salutation sequence)
- Vrikshasana (Tree Pose), Paschimottanasana (Seated Forward Bend)

EXERCISES - Use only real, proven exercises:
- Strength: Push-ups, Squats, Lunges, Deadlifts, Bench Press, Pull-ups, Rows
- Cardio: Running, Cycling, Jumping Jacks, Burpees, Mountain Climbers, Jump Rope
- Core: Planks, Crunches, Russian Twists, Bicycle Crunches, Leg Raises
- Flexibility: Hamstring stretches, Hip openers, Shoulder stretches

RECIPES - Provide COMPLETE details:
- List ALL ingredients with EXACT measurements (cups, grams, tablespoons)
- Write FULL step-by-step cooking instructions (not just "mix" or "cook")
- Include cooking temperature and time
- Mention pan/pot type needed
- Specify serving size

**EXAMPLE OF CORRECT YOGA POSE FORMAT:**

{
  "name": "Adho Mukha Svanasana",
  "sanskrit_name": "Downward-Facing Dog",
  "steps": [
    "Start on your hands and knees in a tabletop position, hands shoulder-width apart",
    "Spread your fingers wide and press firmly through your palms and knuckles",
    "Tuck your toes under and lift your knees off the floor, straightening your legs",
    "Press your hips up and back, creating an inverted V-shape with your body",
    "Keep your head between your arms, ears aligned with your upper arms",
    "Hold for 5-8 breaths, pressing your heels toward the floor"
  ],
  "breathing_instructions": "Inhale deeply through your nose, exhale slowly. Match each breath to the movement.",
  "duration_sec": 60,
  "benefits": "Strengthens arms and legs, stretches hamstrings and calves, energizes the body, relieves stress",
  "modifications": "Bend knees if hamstrings are tight, place hands on blocks for less intensity"
}

**EXAMPLE OF CORRECT EXERCISE FORMAT:**

{
  "name": "Bodyweight Squats",
  "type": "strength",
  "steps": [
    "Stand with feet shoulder-width apart, toes pointed slightly outward",
    "Keep your chest up and core engaged, hands clasped in front of chest",
    "Lower your body by bending knees and pushing hips back as if sitting in a chair",
    "Go down until thighs are parallel to floor, keeping knees behind toes",
    "Push through your heels to return to starting position, squeezing glutes at top"
  ],
  "sets": 3,
  "reps": 15,
  "rest_sec": 60,
  "form_cues": [
    "Keep your weight in your heels",
    "Don't let knees cave inward",
    "Maintain neutral spine throughout",
    "Go as low as comfortable with good form"
  ],
  "target_muscles": ["Quadriceps", "Glutes", "Hamstrings", "Core"],
  "benefits": "Builds lower body strength, improves mobility, functional movement for daily activities"
}

**EXAMPLE OF CORRECT RECIPE FORMAT:**

{
  "name": "Oatmeal with Berries and Almonds",
  "timing": "7:30 AM",
  "ingredients": [
    "1/2 cup rolled oats",
    "1 cup water or milk",
    "1/4 cup fresh blueberries",
    "1/4 cup fresh strawberries, sliced",
    "10 raw almonds, roughly chopped",
    "1 tablespoon honey or maple syrup",
    "1/4 teaspoon cinnamon powder",
    "Pinch of salt"
  ],
  "recipe_steps": [
    "In a small pot, bring 1 cup water (or milk) to a boil over medium-high heat",
    "Add rolled oats and a pinch of salt, stir well",
    "Reduce heat to low and simmer for 5-7 minutes, stirring occasionally",
    "Once oats are creamy and cooked through, remove from heat",
    "Transfer to a bowl and top with fresh berries",
    "Sprinkle chopped almonds and cinnamon on top",
    "Drizzle honey or maple syrup over everything",
    "Serve hot and enjoy immediately"
  ],
  "calories": 320,
  "protein_g": 10,
  "carbs_g": 52,
  "fats_g": 9,
  "prep_time_min": 10
}

❌ DO NOT:
- Create fake or made-up exercise names
- Use vague instructions like "do some stretches" or "eat healthy"
- Skip ingredient measurements
- Omit cooking steps
- Use poses/exercises you're not certain exist

✅ DO:
- Use only well-established, real exercises and yoga poses
- Provide complete, detailed step-by-step instructions
- Include exact measurements for all recipe ingredients
- Write full cooking procedures
- Be specific about timing, sets, reps, hold durations

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
