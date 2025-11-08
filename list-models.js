const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GOOGLE_API_KEY || "YOUR_API_KEY_HERE";

async function listModels() {
  try {
    console.log("🔍 Fetching available models...");
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list models
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey);
    const data = await response.json();
    
    console.log("\n✅ Available models:");
    if (data.models) {
      data.models.forEach(model => {
        console.log(`  - ${model.name}`);
        console.log(`    Display name: ${model.displayName}`);
        console.log(`    Supports: ${model.supportedGenerationMethods?.join(", ") || "N/A"}`);
        console.log("");
      });
    } else {
      console.log("No models found or error:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error listing models:", error.message);
  }
}

listModels();
