"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import PlanPreview from "@/app/components/PlanPreview";
import type { Profile } from "@/lib/ai/schemas";
import type { LifeEnginePlan } from "@/app/types/lifeengine";
import {
  defaultPlanFormState,
  describePlanBrief,
  type PlanFormState,
} from "@/lib/lifeengine/planConfig";
import { PlanConfigurator } from "@/components/lifeengine/PlanConfigurator";
import { validatePlanForm } from "@/lib/lifeengine/promptBuilder";
import { requestPlanFromCustomGPT, fallbackToRuleEngine } from "@/lib/lifeengine/customGptService";
import { savePlanRecord } from "@/lib/lifeengine/storage";
import { formatErrorMessage } from "@/lib/lifeengine/api";

const GPT_URL =
  process.env.NEXT_PUBLIC_LIFEENGINE_GPT_URL ||
  "https://chatgpt.com/g/g-690630c1dfe48191b63fc09f8f024ccb-th-lifeengine-companion?ref=mini";

export default function UseCustomGPTPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [form, setForm] = useState<PlanFormState>(defaultPlanFormState);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<LifeEnginePlan | null>(null);
  const [rawPlan, setRawPlan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showJson, setShowJson] = useState(false);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await fetch("/api/lifeengine/profiles");
      const data = await response.json();
      setProfiles(data.profiles || []);
      
      // Auto-select first profile if available
      if (data.profiles && data.profiles.length > 0 && !selectedProfileId) {
        setSelectedProfileId(data.profiles[0].id);
      }
    } catch (err) {
      console.error("Failed to load profiles", err);
    }
  };

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
  const planBrief = describePlanBrief(selectedProfileId || "unknown", form);

  const openGPT = async () => {
    try {
      await navigator.clipboard.writeText(planBrief);
    } catch (err) {
      console.warn("Failed to copy prompt", err);
    }
    window.open(GPT_URL, "_blank", "noopener,noreferrer");
  };

  const handleGenerate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setValidationErrors([]);
    
    // Validation
    const errors: string[] = [];
    if (!selectedProfileId) {
      errors.push("Please select a profile");
    }
    
    const formValidation = validatePlanForm(form);
    if (!formValidation.valid) {
      errors.push(...formValidation.errors);
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setShowJson(false);

    try {
      const result = await requestPlanFromCustomGPT({
        form,
        profileId: selectedProfileId,
        profile: selectedProfile,
        model: process.env.NEXT_PUBLIC_LIFEENGINE_GPT_ID,
      });

      const planId = result.metadata?.planId || `local-${crypto.randomUUID()}`;
      setPlan(result.plan);
      setRawPlan(JSON.stringify(result.plan, null, 2));

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
      
      // Scroll to plan
      setTimeout(() => {
        document.getElementById('generated-plan')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 300);
      
    } catch (err: any) {
      const message = formatErrorMessage(err);
      setError(message);
      try {
        const fallbackPlanId = await fallbackToRuleEngine(form, selectedProfileId);
        alert(
          `Custom GPT failed (${message}). A rule-based plan was generated instead. Redirecting you now.`
        );
        router.push(`/lifeengine/plan/${fallbackPlanId}`);
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
  };

  const downloadPdf = async () => {
    if (!planRef.current || !plan) return;
    try {
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
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-10">
      <div className="max-w-7xl mx-auto px-6 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-6xl mb-4">🤖</div>
          <h1 className="text-4xl font-bold text-gray-900">AI-Powered Plan Generation</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate personalized wellness plans using advanced AI (Google Gemini) with your Custom GPT prompts
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span> How It Works
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              Configure your plan below with the same options as "Create Plan"
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              Click "Generate with AI" for advanced AI-powered plan generation using Google Gemini
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              Optionally open the Custom GPT tab to refine via chat (prompt auto-copied)
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              Download your plan as PDF or JSON once generation completes
            </li>
          </ol>
        </div>

        <form onSubmit={handleGenerate} className="space-y-8">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 shadow-lg animate-shake">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold text-red-800 text-lg mb-2">
                    Please fix the following errors:
                  </p>
                  <ul className="space-y-1 text-red-700">
                    {validationErrors.map((err, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 shadow-lg">
              <div className="flex items-start gap-3">
                <span className="text-3xl">❌</span>
                <div className="flex-1">
                  <p className="font-bold text-red-800 text-lg mb-1">Generation Failed</p>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Selection */}
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">👤</span>
              <h2 className="text-xl font-bold text-gray-800">Select Your Profile</h2>
            </div>

            <Field label="Choose Profile" required>
              <Select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                required
              >
                <option value="">Select a profile</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.age}y, {profile.gender})
                  </option>
                ))}
              </Select>
            </Field>

            {profiles.length === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-xl">
                <p className="text-yellow-800 mb-3">
                  📋 No profiles found. Please create a profile first.
                </p>
                <Link href="/lifeengine/profiles">
                  <Button variant="ghost">Go to Profiles →</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Plan Configuration */}
          <section className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">⚙️</span>
              <h2 className="text-xl font-bold text-gray-800">Customize Your Plan</h2>
            </div>
            <PlanConfigurator form={form} setForm={setForm} />
          </section>

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <Button type="submit" disabled={loading || !selectedProfileId}>
              {loading ? "Generating..." : "✨ Generate with AI"}
            </Button>
            <Button type="button" variant="ghost" onClick={openGPT}>
              🚀 Open Custom GPT in ChatGPT
            </Button>
          </div>
        </form>

        {/* GPT Prompt Brief */}
        <PlanBrief
          block={planBrief}
          copyBrief={() => navigator.clipboard.writeText(planBrief)}
        />

        {/* Generated Plan */}
        {plan && (
          <div id="generated-plan" className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📖</span> AI-Generated Plan
              </h2>
              <div className="flex flex-wrap gap-3">
                <Button variant="ghost" type="button" onClick={() => setShowJson(!showJson)}>
                  {showJson ? "Hide JSON" : "View Full JSON"}
                </Button>
                <Button variant="ghost" type="button" onClick={downloadJson}>
                  Download JSON
                </Button>
                <Button type="button" onClick={downloadPdf}>
                  Download PDF
                </Button>
              </div>
            </div>

            <div ref={planRef}>
              <PlanPreview plan={plan} />
            </div>

            {showJson && (
              <pre className="bg-gray-900 text-green-200 text-xs rounded-xl p-4 overflow-auto max-h-96">
                {rawPlan}
              </pre>
            )}
          </div>
        )}

        {!plan && !error && !loading && (
          <div className="bg-gray-50 rounded-2xl p-12 text-center border border-dashed border-gray-200">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No plan yet</h3>
            <p className="text-gray-600">
              Configure your profile and preferences above, then click "Generate with Custom GPT" to get started.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

type PlanBriefProps = {
  block: string;
  copyBrief: () => Promise<void> | void;
};

function PlanBrief({ block, copyBrief }: PlanBriefProps) {
  return (
    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 justify-between">
        <div className="font-semibold text-purple-800 flex items-center gap-2">
          <span className="text-xl">📝</span> GPT Prompt Snapshot
        </div>
        <button
          onClick={copyBrief}
          className="text-sm text-purple-600 hover:text-purple-800 font-semibold"
        >
          Copy Brief
        </button>
      </div>
      <textarea
        readOnly
        aria-label="GPT Prompt Brief"
        title="GPT Prompt Brief"
        className="w-full border border-purple-200 rounded-lg bg-white/80 text-sm p-3 text-gray-700"
        rows={6}
        value={block}
      />
      <p className="text-xs text-purple-600">
        The brief is automatically copied when you open the Custom GPT tab.
      </p>
    </div>
  );
}