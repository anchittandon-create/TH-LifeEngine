import { z } from "zod";

const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  LIFEENGINE_ENABLED: z.string().optional(),
  LIFEENGINE_ROLLOUT_PERCENT: z.string().optional(),
  LIFEENGINE_COACH_MINI_ENABLED: z.string().optional(),
  BIGQUERY_PROJECT_ID: z.string().optional(),
  BIGQUERY_DATASET_ID: z.string().optional(),
  BIGQUERY_KB_TABLE: z.string().optional(),
});

const parsed = EnvSchema.parse(process.env);

function normalizePrivateKey(key?: string) {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

export const env = {
  GEMINI_API_KEY: parsed.GEMINI_API_KEY || parsed.GOOGLE_API_KEY,
  GOOGLE_API_KEY: parsed.GOOGLE_API_KEY,
  FIREBASE_PROJECT_ID: parsed.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: parsed.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: normalizePrivateKey(parsed.FIREBASE_PRIVATE_KEY),
  OPENAI_API_KEY: parsed.OPENAI_API_KEY,
  LIFEENGINE_ENABLED: parsed.LIFEENGINE_ENABLED === "true",
  LIFEENGINE_ROLLOUT_PERCENT: Number(parsed.LIFEENGINE_ROLLOUT_PERCENT ?? 0),
  LIFEENGINE_COACH_MINI_ENABLED: parsed.LIFEENGINE_COACH_MINI_ENABLED === "true",
  BIGQUERY_PROJECT_ID: parsed.BIGQUERY_PROJECT_ID,
  BIGQUERY_DATASET_ID: parsed.BIGQUERY_DATASET_ID,
  BIGQUERY_KB_TABLE: parsed.BIGQUERY_KB_TABLE,
};

export const hasFirestoreConfig =
  Boolean(env.FIREBASE_PROJECT_ID) && Boolean(env.FIREBASE_CLIENT_EMAIL) && Boolean(env.FIREBASE_PRIVATE_KEY);
