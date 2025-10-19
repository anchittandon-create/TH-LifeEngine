import { Plan } from "./schemas";
import yogaFlows from "@/lib/catalog/yogaFlows.json";
import foods from "@/lib/catalog/foods.json";

function isoDate(daysAhead: number) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const flows = yogaFlows as Array<{ id: string }>;
const meals = foods as Array<{ id: string }>;

export function createFallbackPlan(profileSex: string = "F"): Plan {
  const flowCycle = flows.map((flow) => flow.id);
  const mealCycle = meals.map((meal) => meal.id);
  const days = Array.from({ length: 7 }, (_, idx) => {
    const flowId = flowCycle[idx % flowCycle.length];
    const mealStart = idx % mealCycle.length;
    const meals = [
      mealCycle[mealStart],
      mealCycle[(mealStart + 1) % mealCycle.length],
      mealCycle[(mealStart + 2) % mealCycle.length],
    ];

    return {
      date: isoDate(idx),
      yoga: [
        {
          flowId,
          durationMin: 20,
        },
      ],
      meals: meals.map((itemId) => ({
        itemId,
        qty: "1 serving",
      })),
      habits: profileSex === "M" ? ["Hydration 3L", "10 min stretching"] : ["Hydration 2.5L", "10 min journaling"],
      sleep: { windDownMin: 30 },
    };
  });

  return {
    id: `fallback-plan-${Date.now()}`,
    days,
  };
}
