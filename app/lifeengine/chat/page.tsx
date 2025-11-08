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
  type PlanFormState,
} from "@/lib/lifeengine/planConfig";
import { PlanConfigurator } from "@/components/lifeengine/PlanConfigurator";
import { validatePlanForm } from "@/lib/lifeengine/promptBuilder";
import { requestPlanFromCustomGPT, fallbackToRuleEngine } from "@/lib/lifeengine/customGptService";
import { savePlanRecord } from "@/lib/lifeengine/storage";
import { formatErrorMessage } from "@/lib/lifeengine/api";

export default function AIWellnessArchitectPage() {
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
          `AI generation failed (${message}). A rule-based plan was generated instead. Redirecting you now.`
        );
        router.push(`/lifeengine/plan/${fallbackPlanId}`);
      } catch (fallbackError) {
        setError(
          `AI generation failed (${message}) and fallback generation also failed: ${formatErrorMessage(
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
          <div className="text-6xl mb-4">�</div>
          <h1 className="text-4xl font-bold text-gray-900">AI Wellness Architect</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate hyper-personalized wellness plans with advanced AI - powered by TH_LifeEngine's intelligence
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
              Select your profile and configure your wellness plan preferences below
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              Click "Generate Your Plan" and our AI will create a hyper-personalized wellness program
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              Review your plan with step-by-step instructions for yoga, exercises, and meals
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              Download your plan as PDF or JSON for offline access
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
              {loading ? "🔄 Generating Your Plan..." : "✨ Generate Your Plan"}
            </Button>
          </div>
        </form>

        {/* GPT Prompt Brief - Removed, not needed for in-app generation */}

        {/* Generated Plan */}
        {plan && (
          <div id="generated-plan" className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📖</span> Your Personalized Wellness Plan
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
              Configure your profile and preferences above, then click "Generate Your Plan" to get started.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}