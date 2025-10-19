import { z } from "zod";
import { ProfileSchema } from "./profile";

export const GoalSchema = z.object({
  name: z.string().min(1),
  target_metric: z.string().min(1),
  priority: z.number().int().min(1).max(5),
});

export const DurationSchema = z.object({
  unit: z.enum(["days", "weeks", "months", "years"]),
  value: z.number().int().min(1).max(365),
});

export const NormalizedIntakeSchema = z.object({
  profileId: z.string().min(1),
  profileSnapshot: ProfileSchema,
  goals: z.array(GoalSchema).min(1).max(5),
  duration: DurationSchema,
  time_budget_min_per_day: z.number().int().min(20).max(180),
  experience_level: z.enum(["beginner", "intermediate", "advanced"]),
  equipment: z.array(z.string().min(1)).max(10),
  assumptions: z.array(z.string().min(1)).default([]),
});

export type NormalizedIntake = z.infer<typeof NormalizedIntakeSchema>;
