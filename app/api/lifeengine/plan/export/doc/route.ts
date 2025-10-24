import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/utils/db";
import { normalizePlanStructure } from "@/lib/utils/planTransform";

const QuerySchema = z.object({
  planId: z.string().min(1),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");
    const { planId: parsedPlanId } = QuerySchema.parse({ planId });

    const planRow = await db.getPlan(parsedPlanId);
    if (!planRow) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const normalized = normalizePlanStructure(planRow.planId, planRow.planJSON, planRow.warnings);
    const lines: string[] = [];
    lines.push(`Plan ID: ${planRow.planId}`);
    lines.push(`Confidence: ${(planRow.confidence * 100).toFixed(1)}%`);
    lines.push(`Warnings: ${(planRow.warnings ?? []).length}`);
    lines.push("");
    lines.push("Meta");
    lines.push(JSON.stringify(normalized.meta, null, 2));
    lines.push("");

    for (const week of normalized.weeks) {
      lines.push(`Week ${week.week_index}: ${week.focus}`);
      lines.push(`Progression: ${week.progression_note}`);
      for (const day of week.days) {
        lines.push(`  Day ${day.day_index} — ${day.theme}`);
        lines.push(`    Yoga: ${day.yoga.map((y) => `${y.name} (${y.duration_min}m)`).join(", ") || "None"}`);
        lines.push(
          `    Breath/Mindfulness: ${
            day.breath_mindfulness.map((b) => `${b.name} (${b.duration_min}m)`).join(", ") || "None"
          }`,
        );
        lines.push(`    Habit Tasks: ${day.habit_tasks.join(", ") || "None"}`);
        lines.push(`    Nutrition kcal: ${day.nutrition.kcal_target}`);
        lines.push(
          `    Meals: ${day.nutrition.meals
            .map((m) => `${m.meal}: ${m.name} (swaps: ${m.swap_suggestions.join(", ")})`)
            .join(" | ")}`,
        );
        lines.push(`    Hydration Target: ${day.hydration_ml_target} ml`);
        lines.push(`    Sleep: ${day.sleep.wind_down_min} min wind-down — ${day.sleep.tip}`);
        if (day.notes) lines.push(`    Notes: ${day.notes}`);
        lines.push("");
      }
      lines.push("");
    }

    if (normalized.safetyWarnings.length) {
      lines.push("Safety Warnings");
      normalized.safetyWarnings.forEach((warning) => lines.push(`- ${warning}`));
      lines.push("");
    }

    if (normalized.adherenceTips.length) {
      lines.push("Adherence Tips");
      normalized.adherenceTips.forEach((tip) => lines.push(`- ${tip}`));
      lines.push("");
    }

    const docContent = lines.join("\n");

    return new NextResponse(docContent, {
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="${planRow.planId}.doc"`,
      },
    });
  } catch (error: any) {
    console.error("plan:export doc error", error);
    return NextResponse.json({ error: error.message ?? "Failed to generate document" }, { status: 400 });
  }
}
