import type { NextApiRequest, NextApiResponse } from "next";
import { coachReply } from "@/lib/ai/coachMini";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { message } = req.body ?? {};
  const reply = await coachReply(message ?? "");
  return res.status(200).json({ reply, quickActions: [] });
}
