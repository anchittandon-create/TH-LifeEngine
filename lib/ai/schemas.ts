import { z } from 'zod';

export const PlanSchema = z.object({
  id: z.string(),
  days: z.array(z.object({
    date: z.string(),
    activities: z.array(z.object({
      type: z.string(),
      name: z.string(),
      duration: z.number(),
      description: z.string(),
    })),
    meals: z.array(z.object({
      type: z.string(),
      name: z.string(),
      calories: z.number(),
      description: z.string(),
    })),
  })),
});

export type Plan = z.infer<typeof PlanSchema>;