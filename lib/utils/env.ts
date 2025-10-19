import { z } from "zod";

const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  LIFEENGINE_ENABLED: z.string().optional(),
  LIFEENGINE_COACH_MINI_ENABLED: z.string().optional(),
  SHOW_CITATIONS_UI: z.string().optional(),
  RAG_MATCHING_ENGINE: z.string().optional(),
});

const parsed = EnvSchema.parse(process.env);

export const env = {
  GEMINI_API_KEY: parsed.GEMINI_API_KEY,
  LIFEENGINE_ENABLED: parsed.LIFEENGINE_ENABLED !== "false", // default to true
  LIFEENGINE_COACH_MINI_ENABLED: parsed.LIFEENGINE_COACH_MINI_ENABLED === "true",
  SHOW_CITATIONS_UI: parsed.SHOW_CITATIONS_UI !== "false", // default to true
  RAG_MATCHING_ENGINE: parsed.RAG_MATCHING_ENGINE === "true",
};

export const hasFirestoreConfig = false;
