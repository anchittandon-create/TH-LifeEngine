import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

type RequestPayload = {
  prompt: string;
  profileId: string;
  model?: string;
};

export async function POST(req: Request) {
  try {
    const { prompt, profileId, model } = (await req.json()) as RequestPayload;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required and must be a string" }, { status: 400 });
    }

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const googleKey = process.env.GOOGLE_API_KEY;

    if (!openAiKey && !googleKey) {
      return NextResponse.json(
        { error: "No AI provider configured. Please set OPENAI_API_KEY or GOOGLE_API_KEY." },
        { status: 500 }
      );
    }

    if (openAiKey) {
      try {
        const data = await generateWithOpenAI({
          prompt,
          profileId,
          modelOverride: model,
          apiKey: openAiKey,
        });
        return NextResponse.json(data);
      } catch (error) {
        console.error("❌ [CustomGPT API] OpenAI call failed:", error);
        if (!googleKey) {
          throw error;
        }
        console.warn("⚠️ Falling back to Gemini due to OpenAI error.");
      }
    }

    if (googleKey) {
      const data = await generateWithGemini({
        prompt,
        profileId,
        modelOverride: model,
        apiKey: googleKey,
      });
      return NextResponse.json(data);
    }

    throw new Error("No AI provider available.");
  } catch (error: any) {
    console.error("❌ [CustomGPT API] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate plan with AI",
        details: error?.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

async function generateWithOpenAI({
  prompt,
  profileId,
  modelOverride,
  apiKey,
}: {
  prompt: string;
  profileId: string;
  modelOverride?: string;
  apiKey: string;
}) {
  const client = new OpenAI({ apiKey });
  const model =
    modelOverride || process.env.LIFEENGINE_CUSTOM_GPT_ID || process.env.NEXT_PUBLIC_LIFEENGINE_GPT_ID;

  if (!model) {
    throw new Error("Custom GPT model ID is not configured.");
  }

  // The Responses API is exposed via `responses` in the latest OpenAI SDK.
  const responsesClient = (client as any).responses;
  if (!responsesClient?.create) {
    throw new Error("Responses API is unavailable in the current OpenAI SDK.");
  }

  const response = await responsesClient.create({
    model,
    input: prompt,
    temperature: 0.65,
    max_output_tokens: 6000,
  });

  const planText = extractResponseText(response).trim();
  if (!planText) {
    throw new Error("Custom GPT returned an empty response.");
  }

  return {
    plan: planText,
    formatted: true,
    metadata: {
      provider: "openai-gpts",
      model,
      profileId,
      usage: response.usage ?? null,
      generatedAt: new Date().toISOString(),
    },
  };
}

async function generateWithGemini({
  prompt,
  profileId,
  modelOverride,
  apiKey,
}: {
  prompt: string;
  profileId: string;
  modelOverride?: string;
  apiKey: string;
}) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = modelOverride || process.env.GEMINI_MODEL || "gemini-1.5-flash-8b";
  const geminiModel = genAI.getGenerativeModel({ model });

  const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 6000,
  };

  const result = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig,
  });

  const response = result.response;
  const text = response.text().trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const cleanedText = stripCodeFences(text);

  return {
    plan: cleanedText,
    formatted: true,
    metadata: {
      provider: "google-gemini",
      model,
      profileId,
      tokens: {
        input: 0,
        output: 0,
        total: 0,
      },
      generatedAt: new Date().toISOString(),
    },
  };
}

function extractResponseText(response: any): string {
  if (response?.output_text) {
    return response.output_text;
  }

  if (response?.output?.length) {
    return response.output
      .map((item: any) =>
        item.content
          ?.map((part: any) => {
            if (part?.text?.value) return part.text.value;
            if (typeof part?.text === "string") return part.text;
            return "";
          })
          .join("\n"),
      )
      .join("\n");
  }

  if (response?.content?.length) {
    return response.content
      .map((item: any) => item.text ?? item?.content?.map((part: any) => part?.text).join("\n"))
      .join("\n");
  }

  return "";
}

function stripCodeFences(value: string) {
  const match = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (match?.[1]) {
    return match[1].trim();
  }
  return value;
}
