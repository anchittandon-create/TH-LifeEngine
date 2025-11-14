"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PlanForm, PlanFormData, defaultPlanFormData, validatePlanFormData } from "@/components/lifeengine/PlanForm";
import type { CustomGPTFormData } from "@/lib/openai/promptBuilder";
import { buildCustomGPTPrompt } from "@/lib/openai/promptBuilder";

export default function CustomGPTPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<PlanFormData>(defaultPlanFormData);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Preparing your plan...");
  const [error, setError] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const customGPTData = useMemo<CustomGPTFormData>(() => ({
    fullName: formData.fullName,
    age: formData.age,
    gender: formData.gender,
    duration: formData.duration,
    planTypes: formData.planTypes,
    goals: formData.goals,
    dietType: formData.dietType,
    activityLevel: formData.activityLevel,
    chronicConditions: formData.chronicConditions,
    sleepHours: formData.sleepHours,
    stressLevel: formData.stressLevel,
    workSchedule: formData.workSchedule,
    preferredTime: formData.preferredTime,
    intensity: formData.intensity,
    focusAreas: formData.focusAreas,
  }), [formData]);

  const promptPreview = useMemo(() => buildCustomGPTPrompt(customGPTData), [customGPTData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors({});

    // Validate form
    const validation = validatePlanFormData(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    setLoadingMessage("🤖 Connecting to OpenAI GPT-4...");

    try {
      // Transform PlanFormData to CustomGPTFormData
      const customGPTData: CustomGPTFormData = {
        fullName: formData.fullName,
        age: formData.age,
        gender: formData.gender,
        duration: formData.duration,
        planTypes: formData.planTypes,
        goals: formData.goals,
        dietType: formData.dietType,
        activityLevel: formData.activityLevel,
        chronicConditions: formData.chronicConditions,
        sleepHours: formData.sleepHours,
        stressLevel: formData.stressLevel,
        workSchedule: formData.workSchedule,
        preferredTime: formData.preferredTime,
        intensity: formData.intensity,
        focusAreas: formData.focusAreas,
      };

      setLoadingMessage("✍️ Building personalized prompt...");
      await new Promise(resolve => setTimeout(resolve, 500));

      setLoadingMessage("🧠 GPT-4 is analyzing your profile...");
      
      // Call API
      const response = await fetch("/api/openai/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formData: customGPTData,
          model: "gpt-4o", // Can be "gpt-4o" or "gpt-4o-mini"
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate plan");
      }

      setLoadingMessage("✨ Plan generated! Preparing your notebook...");
      await new Promise(resolve => setTimeout(resolve, 500));

      // Store plan in localStorage
      const storedPlans = JSON.parse(localStorage.getItem("custom_gpt_plans") || "[]");
      storedPlans.push({
        id: data.planId,
        plan: data.plan,
        formData: customGPTData,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("custom_gpt_plans", JSON.stringify(storedPlans));

      setLoadingMessage("🎉 Redirecting to your plan...");
      
      // Redirect to plan view
      setTimeout(() => {
        router.push(`/custom-gpt/plan/${data.planId}`);
      }, 1000);

    } catch (err: any) {
      console.error("Error generating plan:", err);
      setError(err.message || "Failed to generate plan. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg">
            <span className="text-4xl">🤖</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Use Your Custom GPT
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Powered by OpenAI GPT-4 · Personalized wellness plans generated in seconds
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>GPT-4 Active</span>
            </div>
            <span>·</span>
            <span>~$0.05-0.15 per plan</span>
            <span>·</span>
            <span>30-60 seconds generation</span>
          </div>
        </header>

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="absolute inset-0 flex items-center justify-center text-4xl">🤖</span>
                </div>
                <div className="text-center">
                  <p className="text-blue-800 text-xl font-bold mb-2">{loadingMessage}</p>
                  <p className="text-blue-600 text-sm">
                    This may take 30-60 seconds. Please don't close this window.
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-bold text-red-900 mb-1">Generation Failed</h3>
              <p className="text-red-700 text-sm">{error}</p>
              {error.includes("API key") && (
                <p className="text-red-600 text-xs mt-2">
                  Please ensure OPENAI_API_KEY is configured in your .env file.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start gap-4">
            <span className="text-4xl">💡</span>
            <div>
              <h3 className="font-bold text-lg mb-2">How It Works</h3>
              <ul className="space-y-1 text-sm text-blue-50">
                <li>✓ Fill out the form with your details</li>
                <li>✓ GPT-4 creates a personalized wellness plan</li>
                <li>✓ View your day-by-day notebook-style plan</li>
                <li>✓ Download as PDF or export individual days</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form & Prompt Layout */}
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8 lg:col-span-3">
            <PlanForm formData={formData} setFormData={setFormData} errors={formErrors} />

            <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-200 sticky bottom-4 z-10">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Ready to Generate Your Plan?
                  </h3>
                  <p className="text-sm text-gray-600">
                    GPT-4 will create a {formData.duration || "personalized"} wellness plan in ~30-60 seconds
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-2xl transition disabled:opacity-60"
                >
                  {loading ? "Generating..." : "🤖 Generate with GPT-4"}
                </Button>
              </div>
            </div>
          </form>

          {/* Prompt Preview */}
          <aside className="lg:col-span-2 bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-xl rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-purple-500 font-semibold">Prompt Preview</p>
                <h2 className="text-lg font-bold text-gray-900">What GPT-4 Receives</h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="text-sm font-semibold text-purple-600 hover:text-purple-700"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(promptPreview);
                    setCopiedPrompt(true);
                    setTimeout(() => setCopiedPrompt(false), 2000);
                  } catch (error) {
                    console.error("Failed to copy prompt:", error);
                  }
                }}
              >
                {copiedPrompt ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              The detailed prompt drives GPT-4’s reasoning far more than a static snapshot. Review or tweak it before generating.
            </p>
            <div className="max-h-[60vh] overflow-auto rounded-xl border border-purple-100 bg-purple-50 p-4 text-xs leading-relaxed text-purple-900 whitespace-pre-wrap font-mono">
              {promptPreview}
            </div>
          </aside>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Powered by OpenAI GPT-4 · Your data is processed securely · Plans are stored locally
          </p>
        </div>
      </div>
    </div>
  );
}
