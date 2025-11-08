/**
 * Utility functions to convert between the rule-based Plan structure
 * and the notebook-style PlanNotebookData structure for display
 */

import { Plan, Day as RuleDay } from "@/lib/domain/plan";
import {
  PlanNotebookData,
  DayPlan,
  YogaPose,
  Exercise,
  Meal,
} from "@/components/lifeengine/PlanNotebook";

/**
 * Convert a rule-based Plan to notebook format
 */
export function convertPlanToNotebook(plan: Plan, userName: string): PlanNotebookData {
  const allDays: DayPlan[] = [];
  
  // Flatten weekly structure into day array
  plan.weekly_plan.forEach((week) => {
    week.days.forEach((day) => {
      const notebookDay = convertDayToNotebook(day, week.focus);
      allDays.push(notebookDay);
    });
  });

  return {
    planName: plan.meta.title || "Health & Wellness Plan",
    userName: userName,
    duration: plan.meta.duration_days,
    planTypes: [plan.meta.plan_type.primary, ...plan.meta.plan_type.secondary],
    createdAt: new Date().toISOString(),
    plan: allDays,
  };
}

/**
 * Convert a single day from rule-based format to notebook format
 */
function convertDayToNotebook(day: RuleDay, weekFocus?: string): DayPlan {
  const notebookDay: DayPlan = {
    day: day.day_index,
    notes: weekFocus ? `Focus: ${weekFocus}` : day.notes,
    tips: [],
  };

  // Convert Yoga
  if (day.yoga && day.yoga.length > 0) {
    notebookDay.yoga = day.yoga.map((pose): YogaPose => ({
      name: pose.name,
      duration: `${pose.duration_min} minutes`,
      steps: [
        "Begin in a comfortable starting position",
        "Focus on proper alignment and breathing",
        "Hold the pose for the recommended duration",
        "Release slowly and mindfully",
      ],
      breathing: pose.tags?.includes("breathwork")
        ? "Deep, steady breaths throughout"
        : "Natural breathing pattern",
      benefits: pose.tags?.join(", ") || `${pose.intensity} intensity yoga pose`,
    }));
  }

  // Convert Breathwork to tips
  if (day.breathwork && day.breathwork.length > 0) {
    day.breathwork.forEach((bw) => {
      notebookDay.tips = notebookDay.tips || [];
      notebookDay.tips.push(`🌬️ Breathwork: ${bw.name} for ${bw.duration_min} minutes`);
    });
  }

  // Convert Nutrition to Meals
  if (day.nutrition && day.nutrition.meals && day.nutrition.meals.length > 0) {
    notebookDay.meals = {
      breakfast: undefined,
      lunch: undefined,
      dinner: undefined,
    };
    
    day.nutrition.meals.forEach((meal) => {
      const mealData: Meal = {
        name: meal.name,
        recipe: `A nutritious ${meal.meal} designed for your dietary preferences`,
        ingredients: meal.swaps || ["Ingredients based on your dietary profile"],
        portions: "1 serving",
        macros: day.nutrition?.macros ? {
          calories: Math.round(day.nutrition.kcal_target / 3), // Distribute calories
          protein: `${Math.round(day.nutrition.macros.p / 3)}g`,
          carbs: `${Math.round(day.nutrition.macros.c / 3)}g`,
          fats: `${Math.round(day.nutrition.macros.f / 3)}g`,
        } : undefined,
      };

      if (meal.meal === "breakfast" && notebookDay.meals) {
        notebookDay.meals.breakfast = mealData;
      } else if (meal.meal === "lunch" && notebookDay.meals) {
        notebookDay.meals.lunch = mealData;
      } else if (meal.meal === "dinner" && notebookDay.meals) {
        notebookDay.meals.dinner = mealData;
      }
    });
  }

  // Convert Habits and Mindfulness to Tips
  if (day.habits && day.habits.length > 0) {
    notebookDay.tips = notebookDay.tips || [];
    notebookDay.tips.push(...day.habits.map((h) => `✅ Habit: ${h}`));
  }

  if (day.mindfulness && day.mindfulness.length > 0) {
    notebookDay.tips = notebookDay.tips || [];
    notebookDay.tips.push(...day.mindfulness.map((m) => `🧘 Mindfulness: ${m}`));
  }

  // Add sleep tip
  if (day.sleep) {
    notebookDay.tips = notebookDay.tips || [];
    if (day.sleep.tip) {
      notebookDay.tips.push(`😴 Sleep Tip: ${day.sleep.tip}`);
    }
    if (day.sleep.target_hr) {
      notebookDay.tips.push(`⏰ Sleep Target: ${day.sleep.target_hr} hours`);
    }
  }

  // Add hydration tip
  if (day.hydration_ml_target) {
    notebookDay.tips = notebookDay.tips || [];
    notebookDay.tips.push(`💧 Hydration Goal: ${day.hydration_ml_target}ml water today`);
  }

  return notebookDay;
}

/**
 * Parse AI-generated plan JSON and convert to notebook format
 */
export function parseAIPlanToNotebook(
  planText: string,
  userName: string,
  planTypes: string[]
): PlanNotebookData {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(planText);

    // Check if it's already in notebook format
    if (parsed.plan && Array.isArray(parsed.plan)) {
      return {
        planName: parsed.planName || parsed.meta?.title || "AI-Generated Plan",
        userName: userName,
        duration: parsed.duration || parsed.plan.length,
        planTypes: planTypes,
        createdAt: new Date().toISOString(),
        plan: parsed.plan,
      };
    }

    // Check if it's in rule-based format
    if (parsed.weekly_plan && parsed.meta) {
      return convertPlanToNotebook(parsed as Plan, userName);
    }

    // If neither format, try to construct from whatever we have
    const days: DayPlan[] = [];
    
    if (parsed.days && Array.isArray(parsed.days)) {
      // Direct days array
      parsed.days.forEach((day: any, index: number) => {
        days.push({
          day: day.day || index + 1,
          yoga: day.yoga || [],
          exercise: day.exercise || [],
          meals: day.meals || {},
          tips: day.tips || [],
          notes: day.notes,
        });
      });
    }

    return {
      planName: parsed.title || parsed.name || "AI-Generated Plan",
      userName: userName,
      duration: days.length || 7,
      planTypes: planTypes,
      createdAt: new Date().toISOString(),
      plan: days.length > 0 ? days : generateEmptyDays(7),
    };
  } catch (error) {
    console.error("Failed to parse AI plan:", error);
    // Return a default structure
    return {
      planName: "AI-Generated Plan (Parsing Error)",
      userName: userName,
      duration: 7,
      planTypes: planTypes,
      createdAt: new Date().toISOString(),
      plan: generateEmptyDays(7),
    };
  }
}

/**
 * Generate empty days for fallback
 */
function generateEmptyDays(count: number): DayPlan[] {
  return Array.from({ length: count }, (_, i) => ({
    day: i + 1,
    tips: ["Plan data is being processed. Please check back soon."],
  }));
}

/**
 * Convert notebook format back to a simplified plan structure for saving
 */
export function convertNotebookToPlan(notebookData: PlanNotebookData): any {
  const weekly_plan = [];
  const daysPerWeek = 7;
  const totalWeeks = Math.ceil(notebookData.plan.length / daysPerWeek);

  for (let week = 0; week < totalWeeks; week++) {
    const weekStart = week * daysPerWeek;
    const weekEnd = Math.min(weekStart + daysPerWeek, notebookData.plan.length);
    const weekDays = notebookData.plan.slice(weekStart, weekEnd);

    weekly_plan.push({
      week_index: week + 1,
      focus: `Week ${week + 1}`,
      days: weekDays.map((day) => convertNotebookDayToRuleDay(day)),
    });
  }

  return {
    meta: {
      title: notebookData.planName,
      duration_days: notebookData.duration,
      weeks: totalWeeks,
      goals: [],
      flags: [],
      plan_type: {
        primary: notebookData.planTypes[0] || "wellness",
        secondary: notebookData.planTypes.slice(1) || [],
      },
      dietary: {},
      time_budget_min_per_day: 60,
    },
    weekly_plan,
    citations: [],
    warnings: [],
    adherence_tips: [],
    coach_messages: [],
    analytics: {
      safety_score: 0,
      diet_match: 0,
      progression_score: 0,
      adherence_score: 0,
      overall: 0,
    },
  };
}

/**
 * Convert notebook day back to rule-based day
 */
function convertNotebookDayToRuleDay(day: DayPlan): RuleDay {
  return {
    day_index: day.day,
    theme: day.notes,
    yoga: day.yoga?.map((pose) => ({
      flow_id: `flow_${day.day}`,
      name: pose.name,
      duration_min: parseInt(pose.duration) || 10,
      intensity: "mod" as const,
      tags: [],
    })),
    habits: day.tips?.filter((tip) => tip.includes("Habit")) || [],
    mindfulness: day.tips?.filter((tip) => tip.includes("Mindfulness")) || [],
    notes: day.notes,
  };
}
