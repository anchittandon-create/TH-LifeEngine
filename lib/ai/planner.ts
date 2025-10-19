import type { Intake } from "@/lib/domain/intake";
import type { Plan } from "@/lib/domain/plan";
import { SYSTEM_DIRECTOR, buildUserPrompt } from "./prompts";
import { CONTRA } from "@/lib/rules/contra";
import { PROGRESSION } from "@/lib/rules/progression";
import { assertEnv, ENV } from "@/lib/utils/env";

type Derived = {
  bmr: number;
  tdee: number;
  kcalTarget: number;
  hydration: number;
};

export function deriveBasics(
  profile: Intake["profileSnapshot"],
  intake: Intake
): Derived {
  const isMale = profile.gender === "M";
  const base =
    (isMale ? 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5 : 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age - 161);
  const multiplier = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    intense: 1.725,
  }[profile.activity_level];
  const tdee = base * multiplier;
  const goalName = intake.goals.map((g) => g.name.toLowerCase()).join(" ");
  let goal: "deficit" | "maintenance" | "surplus" = "maintenance";
  if (goalName.includes("gain") || goalName.includes("muscle")) {
    goal = "surplus";
  } else if (goalName.includes("weight") || goalName.includes("fat")) {
    goal = "deficit";
  }
  const kcal =
    goal === "deficit"
      ? Math.max(1200, tdee - 500)
      : goal === "surplus"
      ? tdee + 300
      : tdee;
  const regionFloors: Record<string, number> = {
    IN: 2200,
    US: 2000,
    EU: 2000,
    Global: 2000,
  };
  const hydration = Math.max(35 * profile.weight_kg, regionFloors[profile.region] ?? 2000);
  return {
    bmr: Math.round(base),
    tdee: Math.round(tdee),
    kcalTarget: Math.round(kcal),
    hydration: Math.round(hydration),
  };
}

export async function generatePlan({
  intake,
}: {
  intake: Intake;
}): Promise<Plan> {
  const derived = deriveBasics(intake.profileSnapshot, intake);
  assertEnv();

  const system = SYSTEM_DIRECTOR;
  const user = buildUserPrompt({ intake, derived }, { CONTRA, PROGRESSION });

  try {
    const response = await callGeminiJSON(system, user);
    return response as Plan;
  } catch (error) {
    const retryUser = `${user}\n\nReturn valid JSON only; conform to Plan schema.`;
    const response = await callGeminiJSON(system, retryUser);
    return response as Plan;
  }
}

async function callGeminiJSON(system: string, user: string) {
  const key = ENV.GOOGLE_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_API_KEY is missing");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "system", parts: [{ text: system }] },
          { role: "user", parts: [{ text: user }] },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4000,
        },
        safetySettings: [],
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const text =
    (((data.candidates || [])[0] || {}).content?.parts || [])[0]?.text ?? "{}";
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error("Gemini returned invalid JSON");
  }
}
