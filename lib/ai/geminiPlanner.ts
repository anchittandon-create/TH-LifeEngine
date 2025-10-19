import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/utils/env";
import { PlanSchema, Plan } from "./schemas";
import { createFallbackPlan } from "./samplePlan";
import yogaFlows from "@/lib/catalog/yogaFlows.json";
import foods from "@/lib/catalog/foods.json";

let client: GoogleGenerativeAI | null = null;

function getClient() {
  if (client) return client;
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  client = new GoogleGenerativeAI(apiKey);
  return client;
}

function extractJsonCandidate(text: string) {
  const trimmed = (text ?? "").trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  if (start === -1) {
    throw new Error("Planner response did not contain JSON");
  }
  return candidate.slice(start);
}

export async function generatePlan(input: any): Promise<Plan> {
  const system = [
    "ROLE: Planner for Times Health+",
    "TASK: Produce a 7-day booster plan.",
    "CONSTRAINTS:",
    "1. Only use yogaFlows + foods catalog IDs.",
    "2. Respect contraindications tied to health flags.",
    "3. Keep daily time under provided timeBudget minutes.",
    "4. Output STRICT JSON matching PlanSchema (7 days). No prose or markdown.",
  ].join("\n");

  const prompt = {
    system,
    catalogs: { yogaFlows, foods },
    schema_hint: "TypeScript PlanSchema { id, days[7] }",
    input,
  };

  try {
    const model = getClient().getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: JSON.stringify(prompt) }]}],
    });
    const text = response.response.text();
    const json = JSON.parse(extractJsonCandidate(text));
    return PlanSchema.parse(json);
  } catch (error) {
    console.warn("Gemini planner failed; using fallback plan.", error);
    return createFallbackPlan(input?.profile?.sex ?? "F");
  }
}
