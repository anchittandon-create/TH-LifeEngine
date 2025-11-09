"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import PlanPreview from "@/app/components/PlanPreview";
import { CustomGPTForm } from "@/components/lifeengine/CustomGPTForm";
import type { Profile } from "@/lib/ai/schemas";
import type { LifeEnginePlan } from "@/app/types/lifeengine";
import {
  defaultPlanFormState,
  describePlanBrief,
} from "@/lib/lifeengine/planConfig";
import { requestPlanFromCustomGPT, fallbackToRuleEngine } from "@/lib/lifeengine/customGptService";
import { savePlanRecord } from "@/lib/lifeengine/storage";
import { formatErrorMessage } from "@/lib/lifeengine/api";

const GPT_URL =
  process.env.NEXT_PUBLIC_LIFEENGINE_GPT_URL ||
  "https://chatgpt.com/g/g-690630c1dfe48191b63fc09f8f024ccb-th-lifeengine-companion?ref=mini";

export default function UseCustomGPTPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [form, setForm] = useState(defaultPlanFormState);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<LifeEnginePlan | null>(null);
  const [rawPlan, setRawPlan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const response = await fetch("/api/lifeengine/profiles");
        const data = await response.json();
        setProfiles(data.profiles || []);
      } catch (err) {
        console.error("Failed to load profiles", err);
        setError("Failed to load profiles. Please refresh the page.");
        setTimeout(() => setError(null), 5000);
      }
    };
    loadProfiles();
  }, []);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const planBrief = describePlanBrief(selectedProfileId || "unknown", form);

  const openGPT = async () => {
    try {
      await navigator.clipboard.writeText(planBrief);
      setSuccessMessage("✨ Prompt copied to clipboard! Opening ChatGPT...");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.warn("Failed to copy prompt", err);
      setError("Failed to copy prompt to clipboard");
      setTimeout(() => setError(null), 3000);
    }
    window.open(GPT_URL, "_blank", "noopener,noreferrer");
  };

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProfileId) {
      setError("Please select a profile before generating a plan.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setShowJson(false);

    try {
      const result = await requestPlanFromCustomGPT({
        form,
        profileId: selectedProfileId,
        profile: selectedProfile,
        model: process.env.NEXT_PUBLIC_LIFEENGINE_GPT_ID,
      });

      const planId = result.metadata?.planId || `local-${crypto.randomUUID()}`;
      
      // Ensure metadata includes profile_id for /api/v1/plans/latest
      if (!result.plan.metadata) {
        result.plan.metadata = {} as any;
      }
      result.plan.metadata.profile_id = selectedProfileId;
      (result.plan.metadata as any).generated_by = "custom-gpt-page";
      (result.plan.metadata as any).plan_type = form.planTypes;
      result.plan.metadata.language = "English";
      (result.plan.metadata as any).timestamp = result.metadata?.generatedAt || new Date().toISOString();
      
      setPlan(result.plan);
      setRawPlan(JSON.stringify(result.plan, null, 2));
      setSuccessMessage("🎉 Plan generated successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);

      // Save to localStorage for immediate UI access
      savePlanRecord({
        id: planId,
        profileId: selectedProfileId,
        planName: `Plan for ${selectedProfile?.name ?? "Member"}`,
        planTypes: form.planTypes,
        createdAt: result.metadata?.generatedAt ?? new Date().toISOString(),
        source: "custom-gpt",
        plan: result.plan,
        rawPrompt: result.prompt,
      });

      // Also POST to /api/v1/plans for persistence and dashboard integration
      try {
        const postResponse = await fetch('/api/v1/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.plan),
        });

        if (postResponse.ok) {
          const postData = await postResponse.json();
          console.log(`✅ [CustomGPT] Plan saved to backend with ID: ${postData.plan_id}`);
        } else {
          console.warn(`⚠️ [CustomGPT] Failed to save plan to backend:`, await postResponse.text());
        }
      } catch (backendError) {
        console.warn(`⚠️ [CustomGPT] Could not save to backend:`, backendError);
      }
    } catch (err: any) {
      const message = formatErrorMessage(err);
      setError(message);
      try {
        const fallbackPlanId = await fallbackToRuleEngine(form, selectedProfileId);
        setSuccessMessage(
          `⚠️ Custom GPT failed, but a rule-based plan was generated. Redirecting...`
        );
        setTimeout(() => {
          window.location.href = `/lifeengine/plan/${fallbackPlanId}`;
        }, 2000);
      } catch (fallbackError) {
        setError(
          `Custom GPT failed (${message}) and fallback generation also failed: ${formatErrorMessage(
            fallbackError
          )}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    if (!rawPlan) return;
    const blob = new Blob([rawPlan], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TH_LifeEngine_CustomGPT_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage("📥 JSON downloaded successfully!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const downloadPdf = async () => {
    if (!planRef.current || !plan) return;
    try {
      setSuccessMessage("📄 Generating PDF... Please wait.");
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

      pdf.save(`TH_LifeEngine_CustomGPT_${selectedProfile?.name ?? "plan"}.pdf`);
      setSuccessMessage("✅ PDF downloaded successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("PDF generation failed", err);
      setError("Failed to generate PDF. Please try again.");
      setTimeout(() => setError(null), 4000);
    }
  };

  const copyPromptToBrief = async () => {
    try {
      await navigator.clipboard.writeText(planBrief);
      setSuccessMessage("📋 Prompt copied to clipboard!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError("Failed to copy prompt to clipboard");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-10">
      <div className="max-w-5xl mx-auto px-6 space-y-6 animate-fade-in">
        
        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">🤖 AI Plan Generator</h1>
                <p className="text-purple-100 text-lg">Generate personalized wellness plans using advanced AI</p>
              </div>
              <Link href="/lifeengine/dashboard">
                <Button variant="ghost" className="bg-white/20 hover:bg-white/30 text-white border-white/50 backdrop-blur-sm">
                  ← Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 shadow-lg animate-slide-in">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✅</span>
              <p className="text-green-800 font-semibold text-lg">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 shadow-lg animate-slide-in">
            <div className="flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <div>
                <p className="text-red-800 font-semibold text-lg mb-1">Error</p>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Form Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 pb-6 border-b border-gray-200 mb-6">
              <span className="text-4xl">📋</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Configure Your Plan</h2>
                <p className="text-gray-600">Fill in the details below to generate a custom wellness plan</p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-6">
              <CustomGPTForm
                profiles={profiles}
                selectedProfileId={selectedProfileId}
                onProfileChange={setSelectedProfileId}
                form={form}
                setForm={setForm}
              />
              
              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                <Button 
                  type="submit" 
                  disabled={loading || !selectedProfileId}
                  className="min-w-[200px]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Generating...
                    </span>
                  ) : (
                    "✨ Generate with Custom GPT"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={openGPT}
                  className="min-w-[180px]"
                >
                  💬 Open GPT in Chat
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Plan Brief Card */}
        <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📝</span>
                <div>
                  <h3 className="text-xl font-bold text-purple-900">GPT Prompt Snapshot</h3>
                  <p className="text-purple-700 text-sm">This prompt will be used to generate your plan</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={copyPromptToBrief}
                className="text-purple-600 hover:text-purple-800"
              >
                📋 Copy Brief
              </Button>
            </div>
            <textarea
              readOnly
              aria-label="GPT Prompt Brief"
              title="GPT Prompt Brief"
              className="w-full border-2 border-purple-200 rounded-lg bg-purple-50/50 text-sm p-4 text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
              rows={6}
              value={planBrief}
            />
            <p className="text-xs text-purple-600 italic">
              💡 The brief is automatically copied when you click "Open GPT in Chat"
            </p>
          </div>
        </div>

        {/* Generated Plan Card */}
        {plan && (
          <Card className="animate-fade-in">
            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-4 items-center justify-between pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <span className="text-3xl">📖</span> Your Custom GPT Plan
                </h2>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="ghost" 
                    type="button" 
                    onClick={() => setShowJson(!showJson)}
                    className="text-sm"
                  >
                    {showJson ? "👁️ Hide JSON" : "🔍 View JSON"}
                  </Button>
                  <Button 
                    variant="ghost" 
                    type="button" 
                    onClick={downloadJson}
                    className="text-sm"
                  >
                    📥 Download JSON
                  </Button>
                  <Button 
                    type="button" 
                    onClick={downloadPdf}
                    className="text-sm"
                  >
                    📄 Download PDF
                  </Button>
                </div>
              </div>

              <div ref={planRef}>
                <PlanPreview plan={plan} />
              </div>

              {showJson && (
                <div className="animate-slide-in">
                  <div className="bg-gray-900 text-green-400 text-xs rounded-xl p-5 overflow-auto max-h-[500px] font-mono shadow-inner">
                    <div className="flex items-center gap-2 mb-3 text-green-300 font-semibold">
                      <span>📝</span>
                      <span>Raw JSON Output</span>
                    </div>
                    <pre>{rawPlan}</pre>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Empty State Card */}
        {!plan && !loading && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center shadow-inner animate-fade-in">
            <div className="text-8xl mb-6 animate-bounce-slow">🌟</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Ready to Create Your Plan?
            </h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
              Configure your profile above and click <strong className="text-purple-600">"Generate with Custom GPT"</strong> to get started.
            </p>
            <div className="flex flex-wrap gap-3 justify-center items-center text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <span className="text-lg">✨</span> AI-powered generation
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <span className="text-lg">🎯</span> Personalized for you
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <span className="text-lg">⚡</span> Ready in seconds
              </span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
