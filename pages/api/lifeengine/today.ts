import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    date: new Date().toISOString().slice(0,10),
    tasks: ["Morning pranayama 10m","Walk 20m","Wind-down 30m"],
    meals: ["Veg upma","Dal-rice-salad","Curd + roti"],
    hydrationMl: 1800,
    nudges: ["Add 200ml water to hit goal"],
  });
}
