import { z } from "zod";

const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_PRIVATE_KEY_BASE64: z.string().optional(),
  LIFEENGINE_ENABLED: z.string().optional(),
  LIFEENGINE_COACH_MINI_ENABLED: z.string().optional(),
  SHOW_CITATIONS_UI: z.string().optional(),
  RAG_MATCHING_ENGINE: z.string().optional(),
});

const parsed = EnvSchema.parse(process.env);

function normalizePrivateKey(key?: string, base64Key?: string) {
  if (base64Key) {
    try {
      return Buffer.from(base64Key, "base64").toString("ascii");
    } catch (e) {
      console.error("Failed to decode FIREBASE_PRIVATE_KEY_BASE64", e);
      return undefined;
    }
  }
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

export const env = {
  GEMINI_API_KEY: parsed.GEMINI_API_KEY,
  FIREBASE_PROJECT_ID: parsed.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: parsed.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: normalizePrivateKey(parsed.FIREBASE_PRIVATE_KEY, parsed.FIREBASE_PRIVATE_KEY_BASE64),
  LIFEENGINE_ENABLED: parsed.LIFEENGINE_ENABLED !== "false", // default to true
  LIFEENGINE_COACH_MINI_ENABLED: parsed.LIFEENGINE_COACH_MINI_ENABLED === "true",
  SHOW_CITATIONS_UI: parsed.SHOW_CITATIONS_UI !== "false", // default to true
  RAG_MATCHING_ENGINE: parsed.RAG_MATCHING_ENGINE === "true",
};

export const hasFirestoreConfig =
  Boolean(env.FIREBASE_PROJECT_ID) && Boolean(env.FIREBASE_CLIENT_EMAIL) && Boolean(env.FIREBASE_PRIVATE_KEY);
