import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  // TODO: hook Gemini Vision; return structured items
  return res.status(200).json({ items: [{ name: "Poha", qtyGuess: "1 plate", kcal: 320 }] });
}
