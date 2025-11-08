// OpenAI GPT-4 Integration Utility
// Provides functions to interact with OpenAI's chat completions API

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

/**
 * Call OpenAI GPT-4 API with chat completions
 */
export async function callOpenAI(
  messages: OpenAIMessage[],
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<OpenAIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in environment variables");
  }

  const {
    model = "gpt-4o", // Default to GPT-4 Optimized
    temperature = 0.7,
    max_tokens = 4000,
  } = options;

  const requestBody: OpenAIRequest = {
    model,
    messages,
    temperature,
    max_tokens,
  };

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as OpenAIError;
      throw new Error(
        `OpenAI API Error (${response.status}): ${errorData.error?.message || "Unknown error"}`
      );
    }

    const data = (await response.json()) as OpenAIResponse;
    return data;
  } catch (error: any) {
    console.error("OpenAI API call failed:", error);
    throw new Error(`Failed to call OpenAI API: ${error.message}`);
  }
}

/**
 * Extract the assistant's message content from OpenAI response
 */
export function extractContent(response: OpenAIResponse): string {
  return response.choices[0]?.message?.content || "";
}

/**
 * Get token usage statistics from response
 */
export function getTokenUsage(response: OpenAIResponse) {
  return {
    promptTokens: response.usage.prompt_tokens,
    completionTokens: response.usage.completion_tokens,
    totalTokens: response.usage.total_tokens,
  };
}

/**
 * Calculate estimated cost for GPT-4 usage
 * GPT-4o pricing: $2.50 per 1M input tokens, $10.00 per 1M output tokens
 * GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens
 */
export function calculateCost(
  usage: { promptTokens: number; completionTokens: number },
  model: string = "gpt-4o"
): number {
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o": { input: 2.50, output: 10.00 },
    "gpt-4o-mini": { input: 0.15, output: 0.60 },
    "gpt-4": { input: 30.00, output: 60.00 },
    "gpt-3.5-turbo": { input: 0.50, output: 1.50 },
  };

  const rates = pricing[model] || pricing["gpt-4o"];
  const inputCost = (usage.promptTokens / 1_000_000) * rates.input;
  const outputCost = (usage.completionTokens / 1_000_000) * rates.output;

  return inputCost + outputCost;
}

/**
 * Validate OpenAI API key format
 */
export function validateApiKey(apiKey: string): boolean {
  return /^sk-[a-zA-Z0-9]{48,}$/.test(apiKey);
}
