"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PlanForm, PlanFormData, defaultPlanFormData, validatePlanFormData } from "@/components/lifeengine/PlanForm";
import { buildDetailedGPTPrompt, buildPromptSummary } from "@/lib/lifeengine/gptPromptBuilder";
import { savePlanRecord } from "@/lib/lifeengine/storage";
import PlanPreview from "@/app/components/PlanPreview";
import type { LifeEnginePlan } from "@/app/types/lifeengine";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function UseCustomGPTPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<PlanFormData>(defaultPlanFormData);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Connecting to AI...");
  const [error, setError] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generatedPlan, setGeneratedPlan] = useState<LifeEnginePlan | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [rawPlanText, setRawPlanText] = useState("");
  const planRef = useRef<HTMLDivElement>(null);
  const customGptUrl = process.env.NEXT_PUBLIC_LIFEENGINE_GPT_URL;
  const customGptModel = process.env.NEXT_PUBLIC_LIFEENGINE_GPT_ID;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors({});
    setGeneratedPlan(null);
    
    // Validate form
    const validation = validatePlanFormData(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    setLoading(true);
    setLoadingMessage("🤖 Building comprehensive prompt for AI...");

    try {
      // Build detailed GPT prompt
      const prompt = buildDetailedGPTPrompt(formData);
      
      console.log('📝 [CustomGPT] Generated prompt:', buildPromptSummary(formData));
      
      setTimeout(() => {
        setLoadingMessage("🧠 AI is analyzing your requirements...");
      }, 2000);

      setTimeout(() => {
        setLoadingMessage("✨ Generating personalized wellness plan...");
      }, 5000);

      setTimeout(() => {
        setLoadingMessage("📋 Creating step-by-step instructions...");
      }, 15000);
      
      const gptProfileId = `gpt_${Date.now()}`;

      // Call API to generate plan via Custom GPT
      const response = await fetch("/api/lifeengine/custom-gpt-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          profileId: gptProfileId,
          model: customGptModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ [CustomGPT] Plan generated successfully');
      
      // Parse the plan
      let planText = result.plan?.trim();
      if (!planText) {
        throw new Error("AI returned an empty response");
      }

      // Extract JSON from markdown code blocks if present
      const jsonMatch = planText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        planText = jsonMatch[1].trim();
      }

      setRawPlanText(planText);

      try {
        const parsedPlan = JSON.parse(planText) as LifeEnginePlan;
        setGeneratedPlan(parsedPlan);
        
        // Save plan
        const planId = `gpt_plan_${Date.now()}`;
        savePlanRecord({
          id: planId,
          profileId: gptProfileId,
          planName: `Plan for ${formData.fullName}`,
          planTypes: formData.planTypes,
          createdAt: new Date().toISOString(),
          source: "custom-gpt",
          plan: parsedPlan,
          rawPrompt: prompt,
        });

        // Scroll to plan
        setTimeout(() => {
          document.getElementById('generated-plan')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 500);

      } catch (parseError) {
        console.error('Failed to parse plan JSON:', parseError);
        throw new Error(`AI generated invalid JSON format. Raw response saved for debugging.`);
      }
      
    } catch (err: any) {
      console.error('❌ [CustomGPT] Generation failed:', err);
      
      const errorMessage = err.message || "Unknown error occurred";
      setError(`AI plan generation failed: ${errorMessage}`);
      
      // Detailed error logging
      console.error('Detailed error:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    } finally {
      setLoading(false);
      setLoadingMessage("Connecting to AI...");
    }
  };

  const downloadJson = () => {
    if (!rawPlanText) return;
    const blob = new Blob([rawPlanText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.fullName.replace(/\s+/g, "_")}_WellnessPlan_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    if (!planRef.current || !generatedPlan) return;
    try {
      setLoadingMessage("📄 Generating PDF...");
      const canvas = await html2canvas(planRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${formData.fullName.replace(/\s+/g, "_")}_WellnessPlan.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="text-7xl mb-4">🧠</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Wellness Architect
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powered by advanced AI to create hyper-personalized wellness plans with comprehensive step-by-step guidance
          </p>
          {customGptUrl && (
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => window.open(customGptUrl, "_blank", "noopener,noreferrer")}
                className="px-6 py-3 text-base"
              >
                🔗 Open TH-LifeEngine Companion GPT
              </Button>
            </div>
          )}
        </header>

        {/* How It Works */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8 border-2 border-blue-200 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">💡</span> How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">1</div>
              <h3 className="font-semibold text-gray-800 mb-2">Fill the Form</h3>
              <p className="text-sm text-gray-600">Provide your personal info, health profile, and wellness goals</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">2</div>
              <h3 className="font-semibold text-gray-800 mb-2">AI Generation</h3>
              <p className="text-sm text-gray-600">Our AI analyzes and creates a comprehensive plan just for you</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">3</div>
              <h3 className="font-semibold text-gray-800 mb-2">Review Plan</h3>
              <p className="text-sm text-gray-600">Get detailed day-by-day instructions for yoga, exercises, and meals</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">4</div>
              <h3 className="font-semibold text-gray-800 mb-2">Download & Track</h3>
              <p className="text-sm text-gray-600">Save as PDF or JSON and track your wellness journey</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Error Messages */}
          {Object.keys(formErrors).length > 0 && (
            <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-6 shadow-lg animate-pulse">
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold text-red-800 text-xl mb-3">
                    Please fix the following errors:
                  </p>
                  <ul className="space-y-2 text-red-700">
                    {Object.entries(formErrors).map(([field, error]) => (
                      <li key={field} className="flex items-start gap-2">
                        <span className="text-red-500 font-bold">•</span>
                        <span className="font-medium">{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* API Error */}
          {error && !loading && (
            <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">❌</span>
                <div className="flex-1">
                  <p className="font-bold text-red-800 text-xl mb-2">AI Generation Failed</p>
                  <p className="text-red-700 leading-relaxed">{error}</p>
                  <div className="mt-4 p-4 bg-red-100 rounded-lg">
                    <p className="text-sm text-red-800 font-semibold mb-2">💡 Troubleshooting:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Ensure your Google AI API key is valid and has quota</li>
                      <li>• Check browser console for detailed error logs</li>
                      <li>• Try simplifying your requirements (fewer plan types)</li>
                      <li>• Verify your internet connection</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-400 rounded-2xl p-8 shadow-lg">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">
                    🧠
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-purple-800 text-2xl font-bold mb-2">{loadingMessage}</p>
                  <p className="text-purple-600">
                    AI is crafting your personalized plan... This may take 30-60 seconds.
                  </p>
                  <div className="mt-6 flex justify-center gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Unified Plan Form */}
          <PlanForm formData={formData} setFormData={setFormData} errors={formErrors} />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 pb-10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/lifeengine')}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 text-lg"
            >
              ← Back to Dashboard
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.fullName || formData.planTypes.length === 0}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-12 py-4 text-lg rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-started transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </span>
              ) : (
                "🤖 Generate with AI"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setFormData(defaultPlanFormData);
                setGeneratedPlan(null);
                setError("");
              }}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 text-lg"
            >
              🔄 Reset Form
            </Button>
          </div>
        </form>

        {/* Generated Plan Display */}
        {generatedPlan && (
          <div id="generated-plan" className="mt-12 bg-white rounded-2xl p-8 border-2 border-green-300 shadow-xl">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🎉</span>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    Your Personalized Wellness Plan is Ready!
                  </h2>
                  <p className="text-gray-600">
                    Generated for {formData.fullName} • {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost" onClick={() => setShowJson(!showJson)}>
                  {showJson ? "📋 Hide JSON" : "📋 View JSON"}
                </Button>
                <Button variant="ghost" onClick={downloadJson}>
                  💾 Download JSON
                </Button>
                <Button onClick={downloadPdf} className="bg-green-600 hover:bg-green-700 text-white">
                  📄 Download PDF
                </Button>
              </div>
            </div>

            {showJson && (
              <div className="mb-6 bg-gray-900 text-green-300 rounded-xl p-6 overflow-auto max-h-96">
                <pre className="text-xs font-mono">{rawPlanText}</pre>
              </div>
            )}

            <div ref={planRef}>
              <PlanPreview plan={generatedPlan} />
            </div>

            <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
              <Button onClick={() => router.push('/lifeengine/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white">
                📊 View All Plans
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setGeneratedPlan(null);
                  setFormData(defaultPlanFormData);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                ✨ Create Another Plan
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!generatedPlan && !loading && !error && (
          <div className="mt-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No Plan Generated Yet</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Fill out the form above and click "Generate with AI" to create your personalized wellness plan with detailed step-by-step instructions.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
