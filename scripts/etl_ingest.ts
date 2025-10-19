#!/usr/bin/env ts-node
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuid } from "uuid";
import { KnowledgeCard, KnowledgeCardSchema } from "@/lib/kb/schema";
import { upsertCards } from "@/lib/kb/store.bigquery";
import { env } from "@/lib/utils/env";

const SOURCE_DIR = path.join(process.cwd(), "prompts", "kb");

function chunkText(text: string, chunkSize = 800): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current: string[] = [];
  for (const word of words) {
    current.push(word);
    if (current.join(" ").length > chunkSize) {
      chunks.push(current.join(" "));
      current = [];
    }
  }
  if (current.length) chunks.push(current.join(" "));
  return chunks;
}

async function embed(text: string, client: GoogleGenerativeAI): Promise<number[]> {
  const model = client.getGenerativeModel({ model: "text-embedding-004" });
  const res = await model.embedContent(text);
  return res.embedding!.values!;
}

async function main() {
  if (!env.GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY missing");
  }
  const client = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
  const files = fs.readdirSync(SOURCE_DIR);
  const cards: KnowledgeCard[] = [];

  for (const file of files) {
    const fullPath = path.join(SOURCE_DIR, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const { data, content: body } = matter(content);
    const chunks = chunkText(body);
    chunks.forEach((chunk, index) => {
      const card: KnowledgeCard = KnowledgeCardSchema.parse({
        id: `${path.basename(file, path.extname(file))}-${index}-${uuid()}`,
        title: data.title ?? `Knowledge Card ${file} #${index + 1}`,
        body: chunk,
        tags: data.tags ?? [],
        goal_tags: data.goal_tags ?? [],
        contraindications: data.contraindications ?? [],
        region: data.region ?? "Global",
        source_url: data.source_url ?? "https://lifeengine.timeshealthplus.com",
        last_reviewed: data.last_reviewed ?? new Date().toISOString(),
      });
      cards.push(card);
    });
  }

  const embedded: KnowledgeCard[] = [];
  for (const card of cards) {
    const embedding = await embed(card.body, client);
    embedded.push({ ...card, embedding });
  }

  await upsertCards(embedded);
  console.log(`Ingested ${embedded.length} knowledge cards`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
