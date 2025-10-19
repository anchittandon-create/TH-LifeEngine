import { z } from "zod";

export const MealItemSchema = z.object({
  itemId: z.string(),
  qty: z.string(),
});

export const YogaItemSchema = z.object({
  flowId: z.string(),
  durationMin: z.number().int().min(5).max(90),
});

export const DaySchema = z.object({
  date: z.string(),
  yoga: z.array(YogaItemSchema),
  meals: z.array(MealItemSchema),
  habits: z.array(z.string()).default([]),
  sleep: z.object({ windDownMin: z.number().int().min(0).max(120) }).optional(),
});

export const PlanSchema = z.object({
  id: z.string(),
  days: z.array(DaySchema).length(7),
});

export type Plan = z.infer<typeof PlanSchema>;
