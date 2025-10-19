import { PlanSchema, Plan } from "./schemas";
import yogaFlows from "@/lib/catalog/yogaFlows.json";
import foods from "@/lib/catalog/foods.json";

const contraindications: Record<string,string[]> = {
  pcod: ["inversions_long","intense_core"],
  pregnancy: ["twists_deep","inversions_long","prone"],
  back_pain: ["deep_forward_folds"],
  thyroid: []
};

export async function verifyPlan(plan:any, ctx:{ flags:string[], dietary:any, modules?: string[] }){
  const parsed = PlanSchema.parse(plan);
  const warns:string[] = [];

  const restrictedTags = new Set(ctx.flags.flatMap(f => contraindications[f] || []));

  for(const day of parsed.days){
    for(const y of day.yoga){
      const flow = (yogaFlows as any[]).find(f => f.id === y.flowId);
      if (!flow) { warns.push(`Unknown flow ${y.flowId}`); continue; }
      const hits = (flow.contraindications || []).filter((tag:string)=>restrictedTags.has(tag));
      if (hits.length) {
        warns.push(`Flow ${flow.id} may violate flags ${ctx.flags.join(",")} (${hits.join(",")})`);
      }
    }
    for(const m of day.meals){
      const food = (foods as any[]).find(f => f.id === m.itemId);
      if (!food) warns.push(`Unknown food ${m.itemId}`);
    }
  }

  const confidence = Math.max(0.5, 1 - warns.length * 0.05);
  return { plan: parsed, warnings: warns, confidence };
}
