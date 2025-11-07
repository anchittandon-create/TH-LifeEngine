// Test script for plan generation API
const profileId = "prof_anchit"; // Using existing profile

const intake = {
  primaryPlanType: "yoga",
  secondaryPlanType: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  preferences: {
    intensity: "Medium",
    focusAreas: ["Metabolic health", "Stress resilience"],
    format: "text",
    includeDailyRoutine: true,
  },
};

const payload = {
  profileId,
  intake,
};

console.log("🔍 Testing plan generation API...");
console.log("📤 Sending payload:", JSON.stringify(payload, null, 2));

fetch("http://localhost:3000/api/lifeengine/generate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
})
  .then(async (response) => {
    console.log(`\n📥 Response status: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log("📦 Response data:", JSON.stringify(data, null, 2));
    
    if (!response.ok) {
      console.error("\n❌ Request failed!");
      console.error("Error:", data.error);
      if (data.details) {
        console.error("Details:", data.details);
      }
      process.exit(1);
    } else {
      console.log("\n✅ Plan generated successfully!");
      console.log("Plan ID:", data.planId);
      process.exit(0);
    }
  })
  .catch((error) => {
    console.error("\n❌ Request error:", error.message);
    console.error(error.stack);
    process.exit(1);
  });
