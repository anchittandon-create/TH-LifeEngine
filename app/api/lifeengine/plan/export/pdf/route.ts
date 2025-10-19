import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { z } from "zod";
import { db } from "@/lib/utils/db";
import { normalizePlanStructure } from "@/lib/utils/planTransform";

const QuerySchema = z.object({
  planId: z.string().min(1),
});

export const dynamic = "force-dynamic";

function wrapText(text: string, maxLineLength: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxLineLength) {
      lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine += ` ${word}`;
    }
  }
  if (currentLine.trim()) lines.push(currentLine.trim());
  return lines;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");
    const { planId: parsedPlanId } = QuerySchema.parse({ planId });

    const planRow = await db.getPlan(parsedPlanId);
    if (!planRow) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const lineHeight = 14;
    const margin = 40;

    const drawLine = (text: string, bold = false) => {
      const lines = wrapText(text, 90);
      for (const line of lines) {
        page.drawText(line, {
          x: margin,
          y,
          size: 11,
          font: bold ? fontBold : font,
        });
        y -= lineHeight;
        if (y < margin) {
          y = 800;
          doc.addPage();
        }
      }
    };

    const normalized = normalizePlanStructure(planRow.planId, planRow.planJSON, planRow.warnings);

    drawLine(`Plan ID: ${planRow.planId}`, true);
    drawLine(`Confidence: ${(planRow.confidence * 100).toFixed(1)}%`);
    drawLine(`Warnings: ${(planRow.warnings ?? []).length}`, false);
    drawLine("");

    drawLine("Plan Overview", true);
    drawLine(JSON.stringify(normalized.meta, null, 2));
    drawLine("");

    normalized.weeks.forEach((week) => {
      drawLine(`Week ${week.week_index}: ${week.focus}`, true);
      drawLine(`Progression: ${week.progression_note}`);
      week.days.forEach((day) => {
        drawLine(`  Day ${day.day_index} - ${day.theme}`, true);
        drawLine(`    Yoga: ${day.yoga.map((y) => `${y.name} (${y.duration_min}m)`).join(", ") || "None"}`);
        drawLine(
          `    Breath/Mindfulness: ${
            day.breath_mindfulness.map((b) => `${b.name} (${b.duration_min}m)`).join(", ") || "None"
          }`,
        );
        drawLine(`    Habit Tasks: ${day.habit_tasks.join(", ") || "None"}`);
        drawLine(`    Nutrition kcal: ${day.nutrition.kcal_target}`);
        drawLine(
          `    Meals: ${day.nutrition.meals
            .map((m) => `${m.meal}: ${m.name} (swaps: ${m.swap_suggestions.join(", ")})`)
            .join(" | ")}`,
        );
        drawLine(`    Hydration Target: ${day.hydration_ml_target} ml`);
        drawLine(`    Sleep: ${day.sleep.wind_down_min} min wind-down - ${day.sleep.tip}`);
        if (day.notes) {
          drawLine(`    Notes: ${day.notes}`);
        }
        drawLine("");
      });
      drawLine("");
    });

    if (normalized.safetyWarnings.length) {
      drawLine("Safety Warnings", true);
      normalized.safetyWarnings.forEach((warning) => drawLine(`- ${warning}`));
    }

    if (normalized.adherenceTips.length) {
      drawLine("");
      drawLine("Adherence Tips", true);
      normalized.adherenceTips.forEach((tip) => drawLine(`- ${tip}`));
    }

    const pdfBytes = await doc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${planRow.planId}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("plan:export pdf error", error);
    return NextResponse.json({ error: error.message ?? "Failed to generate PDF" }, { status: 400 });
  }
}
