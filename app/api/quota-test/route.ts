import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ 
        error: "GOOGLE_API_KEY not configured",
        status: "❌ No API Key"
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      },
    });

    // Test multiple requests to check quota
    const promises = Array.from({ length: 3 }, async (_, i) => {
      try {
        const result = await model.generateContent(`Test request ${i + 1}: Generate a simple wellness tip in JSON format: {"tip": "your tip here"}`);
        const response = await result.response;
        return {
          request: i + 1,
          success: true,
          response: response.text(),
          usage: response.usageMetadata || {}
        };
      } catch (error: any) {
        return {
          request: i + 1,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    const hasQuotaError = results.some(r => r.error && r.error.includes("429"));

    return NextResponse.json({
      apiKeyStatus: "✅ Valid",
      quotaStatus: hasQuotaError ? "❌ Quota Exceeded" : "✅ Available",
      successfulRequests: `${successCount}/3`,
      results,
      recommendation: hasQuotaError 
        ? "🔄 Upgrade billing plan or create new API key" 
        : "✅ Ready for production use"
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      apiKeyStatus: "❌ Invalid or Quota Exceeded",
      errorType: error.constructor.name
    }, { status: 500 });
  }
}