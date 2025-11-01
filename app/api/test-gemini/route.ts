import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: "GOOGLE_API_KEY not configured",
        hasKey: false
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // Test with the most basic model first
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 50,
      },
    });

    const result = await model.generateContent("Say hello in JSON format: {\"message\": \"your response\"}");
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      hasKey: true,
      keyLength: process.env.GOOGLE_API_KEY.length,
      keyPreview: process.env.GOOGLE_API_KEY.substring(0, 10) + "...",
      modelResponse: text,
      usage: response.usageMetadata || {}
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      hasKey: !!process.env.GOOGLE_API_KEY,
      keyLength: process.env.GOOGLE_API_KEY?.length || 0,
      errorType: error.constructor.name
    }, { status: 500 });
  }
}