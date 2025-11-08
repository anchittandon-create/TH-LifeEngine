import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: "GOOGLE_API_KEY not configured in environment" },
        { status: 500 }
      );
    }

    console.log("🤖 [CustomGPT API] Generating plan with AI...");
    console.log("📝 [CustomGPT API] Prompt length:", prompt.length);
    console.log("👤 [CustomGPT API] Profile ID:", profileId);
    console.log("🎯 [CustomGPT API] Model:", model || "gemini-2.0-flash-exp");

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const modelToUse = model && model.startsWith("gemini-") 
      ? model 
      : "gemini-2.0-flash-exp"; // Use latest model
    
    const aiModel = genAI.getGenerativeModel({
      model: modelToUse,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 8192, // Increased for longer plans
      },
    });

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("✅ [CustomGPT API] Generated response length:", text.length);

    // Track token usage
    const usageMetadata = response.usageMetadata;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = usageMetadata?.totalTokenCount || 0;

    console.log("📊 [CustomGPT API] Token usage:", {
      inputTokens,
      outputTokens,
      totalTokens,
    });

    return NextResponse.json({
      plan: text,
      formatted: true,
      metadata: {
        model: modelToUse,
        profileId,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens,
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
