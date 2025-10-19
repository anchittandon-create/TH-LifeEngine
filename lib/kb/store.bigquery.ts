import { BigQuery } from "@google-cloud/bigquery";
import { KnowledgeCard, KnowledgeSearchHit, KnowledgeCardSchema } from "./schema";
import { env } from "@/lib/utils/env";

const hasKbConfig = Boolean(env.BIGQUERY_PROJECT_ID) && Boolean(env.BIGQUERY_DATASET_ID) && Boolean(env.BIGQUERY_KB_TABLE);
const TABLE = hasKbConfig
  ? `${env.BIGQUERY_PROJECT_ID}.${env.BIGQUERY_DATASET_ID}.${env.BIGQUERY_KB_TABLE}`
  : undefined;

let client: BigQuery | null = null;

function getClient() {
  if (!hasKbConfig || !TABLE) {
    throw new Error("BigQuery knowledge base configuration missing");
  }
  if (client) return client;
  client = new BigQuery({
    projectId: env.BIGQUERY_PROJECT_ID,
  });
  return client;
}

export async function upsertCards(cards: KnowledgeCard[]): Promise<void> {
  if (!hasKbConfig) {
    console.warn("Skipping KB upsert; BigQuery config missing.");
    return;
  }
  if (!cards.length) return;
  const rows = cards.map((card) => ({
    id: card.id,
    title: card.title,
    body: card.body,
    tags: card.tags,
    goal_tags: card.goal_tags,
    contraindications: card.contraindications,
    region: card.region,
    source_url: card.source_url,
    last_reviewed: card.last_reviewed,
    embedding: card.embedding ?? null,
  }));
  const datasetId = env.BIGQUERY_DATASET_ID as string;
  const tableId = env.BIGQUERY_KB_TABLE as string;
  const table = getClient().dataset(datasetId).table(tableId);
  await table.insert(rows, { ignoreUnknownValues: true });
}

type SearchFilters = {
  region?: KnowledgeCard["region"];
  tags?: string[];
  contraindications?: string[];
};

export async function search(query: string, filters: SearchFilters = {}, k = 20): Promise<KnowledgeSearchHit[]> {
  if (!hasKbConfig || !TABLE) {
    console.warn("Skipping KB search; BigQuery config missing.");
    return [];
  }
  const client = getClient();
  const vectorQuery = `
    SELECT
      id,
      title,
      body,
      tags,
      goal_tags,
      contraindications,
      region,
      source_url,
      last_reviewed,
      embedding,
      (SELECT cosine_distance FROM ML.DISTANCES(
        (SELECT embedding FROM \`${TABLE}\` WHERE id = 'probe'),
        (SELECT embedding FROM \`${TABLE}\` WHERE id = cards.id)
      )) AS distance
    FROM \`${TABLE}\` AS cards
    WHERE TRUE
      ${filters.region ? "AND region IN ('Global', @region)" : ""}
      ${filters.tags?.length ? "AND ARRAY_LENGTH(ARRAY_INTERSECT(tags, @tags)) > 0" : ""}
    ORDER BY distance ASC
    LIMIT @limit
  `;

  // Fallback simple search if embeddings not available
  const fallbackQuery = `
    SELECT
      id,
      title,
      body,
      tags,
      goal_tags,
      contraindications,
      region,
      source_url,
      last_reviewed,
      embedding,
      0 as distance
    FROM \`${TABLE}\`
    WHERE CONTAINS_SUBSTR(LOWER(body), LOWER(@query))
    LIMIT @limit
  `;

  try {
    const [rows] = await client.query({
      query: vectorQuery,
      params: {
        query,
        region: filters.region,
        tags: filters.tags,
        limit: k,
      },
    });
    return rows.map((row: any) => ({
      card: KnowledgeCardSchema.parse({
        id: row.id,
        title: row.title,
        body: row.body,
        tags: row.tags,
        goal_tags: row.goal_tags,
        contraindications: row.contraindications,
        region: row.region,
        source_url: row.source_url,
        last_reviewed: row.last_reviewed,
        embedding: row.embedding,
      }),
      score: row.distance ?? 0,
    }));
  } catch (error) {
    console.warn("BigQuery vector search failed, using fallback", error);
    const [rows] = await client.query({
      query: fallbackQuery,
      params: {
        query,
        limit: k,
      },
    });
    return rows.map((row: any) => ({
      card: KnowledgeCardSchema.parse(row),
      score: 1,
    }));
  }
}
