import { NextResponse } from "next/server";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";

type OpenAIResponse = {
  output_text?: string[];
  output?: Array<{
    content?: Array<{ type: string; text?: string }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
};

export async function POST(req: Request) {
  try {
    const { prompt, profileId, model } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured in environment" },
        { status: 500 }
      );
    }

    const modelToUse =
      model ||
      process.env.OPENAI_CUSTOM_GPT_ID ||
      process.env.NEXT_PUBLIC_LIFEENGINE_GPT_ID ||
      "gpt-4.1-mini";

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelToUse,
        input: prompt,
        temperature: 0.7,
        max_output_tokens: 6000,
      }),
    });

    const data = (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      const message =
        data?.error?.message ||
        `Custom GPT request failed with status ${response.status}`;
      return NextResponse.json(
        { error: "CustomGPT request failed", details: message },
        { status: response.status }
      );
    }

    const planText =
      data.output_text?.join("\n").trim() ||
      data.output?.[0]?.content?.map((c) => c.text).join("\n").trim() ||
      "";

    if (!planText) {
      return NextResponse.json(
        { error: "CustomGPT returned an empty response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      plan: planText,
      formatted: true,
      metadata: {
        model: modelToUse,
        profileId,
        tokens: {
          input: data.usage?.input_tokens ?? 0,
          output: data.usage?.output_tokens ?? 0,
          total: data.usage?.total_tokens ?? 0,
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ [CustomGPT API] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate plan with CustomGPT",
        details: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
