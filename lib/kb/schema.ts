import { z } from "zod";

export const KnowledgeCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(20),
  tags: z.array(z.string().min(1)).default([]),
  goal_tags: z.array(z.string().min(1)).default([]),
  contraindications: z.array(z.string().min(1)).default([]),
  region: z.enum(["IN", "US", "EU", "Global"]).default("Global"),
  source_url: z.string().url(),
  last_reviewed: z.string().min(4),
  embedding: z.array(z.number()).optional(),
});

export type KnowledgeCard = z.infer<typeof KnowledgeCardSchema>;

export const KnowledgeSearchHitSchema = z.object({
  card: KnowledgeCardSchema,
  score: z.number(),
});

export type KnowledgeSearchHit = z.infer<typeof KnowledgeSearchHitSchema>;
