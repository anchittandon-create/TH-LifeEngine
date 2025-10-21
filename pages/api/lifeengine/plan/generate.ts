import type { NextApiRequest, NextApiResponse } from "next";
import { generatePlan } from "@/lib/ai/geminiPlanner";
import { verifyPlan } from "@/lib/ai/geminiVerifier";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { profile, goals, dietary, flags, timeBudget, level } = req.body;
    const draft = await generatePlan({ profile, goals, dietary, flags, timeBudget, level });
    const { plan, warnings, confidence } = await verifyPlan(draft, { flags, dietary });
    return res.status(200).json({ planId: plan.id, weekPlan: plan.days, warnings, confidence });
  } catch (e:any) {
    console.error(e);
    return res.status(500).json({ error: e?.message ?? "GENERIC_ERROR" });
  }
}
