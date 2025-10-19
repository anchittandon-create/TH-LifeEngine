import type { Intake } from "@/lib/domain/intake";
import type { Profile } from "@/lib/domain/profile";
import type { Plan } from "@/lib/domain/plan";
import { CONTRA } from "@/lib/rules/contra";
import { PROGRESSION } from "@/lib/rules/progression";

export const SYSTEM_DIRECTOR = `
You are TH+ LifeEngine Director. Create safe, evidence-aligned wellness plans using only the rule tables and catalogs provided.
Honor the profile (gender, age, region, medical flags), goals, time budget, diet type, allergies, and availability.
Rules: ≤10% weekly progression; include a rest day at least every 6 days; insert a deload week for durations ≥8 weeks with ~30% lower volume; hydration ≥ 35ml/kg or regional floor; avoid contraindications for medical flags.
Return VALID JSON conforming exactly to the provided Plan schema. Do not include explanations outside JSON.
If a safe swap is unavailable, set the field to "TBD_SAFE" and add a warning string.
Do not invent new catalog items beyond those listed. Reference citations using compact strings like "KB:SunSalutationBasics".
`;

type DerivedMetrics = {
  bmr: number;
  tdee: number;
  kcalTarget: number;
  hydration: number;
};

const YOGA_FLOWS = [
  {
    id: "flow_sun_salute_gentle",
    name: "Sun Salutation Gentle",
    duration: 18,
    intensity: "low",
    tags: ["warmup", "mobility"],
  },
  {
    id: "flow_foundation_core",
    name: "Foundation Core Flow",
    duration: 24,
    intensity: "mod",
    tags: ["core_strength", "balance"],
  },
  {
    id: "flow_grounding_evening",
    name: "Grounding Evening Flow",
    duration: 22,
    intensity: "low",
    tags: ["relaxation", "evening"],
  },
  {
    id: "flow_dynamic_power",
    name: "Dynamic Power Flow",
    duration: 28,
    intensity: "high",
    tags: ["strength", "cardio"],
  },
  {
    id: "flow_spine_care",
    name: "Spine Care Sequence",
    duration: 20,
    intensity: "low",
    tags: ["back_care", "gentle"],
  },
  {
    id: "flow_hip_stability",
    name: "Hip Stability Flow",
    duration: 26,
    intensity: "mod",
    tags: ["hip_strength", "balance"],
  },
];

const BREATHWORK = [
  { name: "Box Breathing", duration: 6, tag: "calm" },
  { name: "Alternate Nostril", duration: 8, tag: "focus" },
  { name: "4-7-8 Breath", duration: 5, tag: "sleep" },
  { name: "Ocean Breath", duration: 7, tag: "relax" },
];

const MEALS = [
  { name: "Moong Dal Cheela", diet: ["veg"], swap: ["Besan Cheela"] },
  { name: "Sprouts Poha", diet: ["veg", "vegan"], swap: ["Quinoa Upma"] },
  { name: "Masala Oats", diet: ["veg"], swap: ["Steel-cut Oats Upma"] },
  { name: "Rajma Brown Rice", diet: ["veg", "vegan"], swap: ["Kala Chana Rice"] },
  { name: "Paneer Quinoa Bowl", diet: ["veg", "eggetarian"], swap: ["Tofu Quinoa Bowl"] },
  { name: "Grilled Fish Thali", diet: ["non_veg"], swap: ["Grilled Paneer Thali"] },
  { name: "Lemon Coriander Soup", diet: ["veg", "vegan"], swap: ["Tomato Basil Soup"] },
  { name: "Ragi Dosa", diet: ["veg"], swap: ["Jowar Dosa"] },
  { name: "Idli Sambar", diet: ["veg"], swap: ["Millet Idli"] },
  { name: "Curd Rice with Vegetables", diet: ["veg"], swap: ["Buttermilk Millet Bowl"] },
  { name: "Herbal Infusion", diet: ["veg", "vegan"], swap: ["Lemon Ginger Water"] },
];

const HABITS = [
  "5-minute gratitude journaling",
  "Post-lunch 10 minute walk",
  "Screen curfew 60 minutes before bed",
  "Hydration check-ins every 3 hours",
  "Weekly reflection with coach note",
];

function formatProfile(profile: Profile) {
  return `
Name: ${profile.name}
Gender: ${profile.gender}
Age: ${profile.age}
Region: ${profile.region}
Medical Flags: ${profile.medical_flags.join(", ") || "none"}
Activity Level: ${profile.activity_level}
Diet Type: ${profile.dietary.type}
Allergies: ${profile.dietary.allergies.join(", ") || "none"}
Avoid Items: ${profile.dietary.avoid_items.join(", ") || "none"}
Preferred Cuisine: ${profile.dietary.cuisine_pref || "flex"}
Availability: ${profile.availability.days_per_week} days/week, slots ${profile.availability.preferred_slots
    .map((slot) => `${slot.start}-${slot.end}`)
    .join(", ") || "flexible"}
Preferences: tone=${profile.preferences.tone}, indoor_only=${profile.preferences.indoor_only}
`;
}

function formatRules() {
  const contra = Object.entries(CONTRA)
    .map(
      ([flag, data]) =>
        `Flag: ${flag} -> avoid yoga tags ${data.yoga_avoid.join(
          "|"
        ) || "none"}, breath caution ${data.breath_caution.join(
          "|"
        ) || "none"}, diet notes ${data.diet_notes.join("|") || "none"}`
    )
    .join("\n");

  const progression = `Max weekly increase: ${PROGRESSION.maxWeeklyIncreasePct}%
Deload every ${PROGRESSION.deloadEveryWeeks} weeks, drop ${PROGRESSION.deloadDropPct}% volume`;

  return `CONTRAINDICATIONS\n${contra}\n\nPROGRESSION\n${progression}`;
}

function formatCatalogs() {
  const yoga = YOGA_FLOWS.map(
    (flow) =>
      `${flow.id} | ${flow.name} | duration ${flow.duration} | intensity ${flow.intensity} | tags ${flow.tags.join(
        ","
      )}`
  ).join("\n");
  const breath = BREATHWORK.map(
    (item) => `${item.name} | duration ${item.duration} | tag ${item.tag}`
  ).join("\n");
  const meals = MEALS.map(
    (meal) =>
      `${meal.name} | diet ${meal.diet.join(",")} | swaps ${meal.swap.join(
        ","
      )}`
  ).join("\n");
  const habits = HABITS.map((habit) => `- ${habit}`).join("\n");

  return `YOGA FLOWS\n${yoga}\n\nBREATHWORK OPTIONS\n${breath}\n\nMEAL CATALOG\n${meals}\n\nHABIT PROMPTS\n${habits}`;
}

export function buildUserPrompt(
  context: { intake: Intake; derived: DerivedMetrics },
  _rules: { CONTRA: typeof CONTRA; PROGRESSION: typeof PROGRESSION }
) {
  const { intake, derived } = context;
  const profileBlock = formatProfile(intake.profileSnapshot);
  const goals = intake.goals.map((g) => g.name).join(", ");
  const rulesBlock = formatRules();
  const catalogs = formatCatalogs();

  return `
PROFILE SNAPSHOT
${profileBlock}

INTAKE
- Goals: ${goals || "general wellness"}
- Duration: ${intake.duration.value} ${intake.duration.unit}
- Daily Time Budget: ${intake.time_budget_min_per_day} minutes
- Experience Level: ${intake.experience_level}
- Equipment: ${Object.entries(intake.equipment)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key)
    .join(", ") || "bodyweight only"}

DERIVED METRICS
- BMR: ${Math.round(derived.bmr)}
- TDEE: ${Math.round(derived.tdee)}
- Daily kcal target: ${Math.round(derived.kcalTarget)}
- Hydration target (ml): ${Math.round(derived.hydration)}

RULES AND SAFETY
${rulesBlock}

CATALOGS (USE ONLY THESE LABELS)
${catalogs}

OUTPUT REQUIREMENTS
- Return valid JSON matching the Plan schema exactly (meta, weekly_plan, citations, warnings, adherence_tips, coach_messages, analytics).
- Each day must respect the daily time budget and include hydration, sleep tip, and optional habits/mindfulness aligned with tone.
- Ensure at least one full rest/light day every six days.
- Weekly progression must increase ≤10% and insert deload if duration ≥8 weeks.
- Diet selections must honour diet type and allergies. Include meal swaps from catalog.
- Provide citations array referencing catalog labels (e.g., "KB:SunSalutationBasics").
- Include warnings for any forced substitutions or TBD_SAFE placeholders.
- Do not invent new flows or meals beyond the catalog list.
`;
}
