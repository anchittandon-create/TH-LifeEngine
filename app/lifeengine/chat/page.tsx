"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/Button";
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
      }
    };
    loadProfiles();
  }, []);

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
    if (!selectedProfileId) {
      setError("Please select a profile before generating a plan.");
      return;
    }
    setLoading(true);
    setError(null);
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
        alert(
          `Custom GPT failed (${message}). A rule-based plan was generated instead. Redirecting you now.`
        );
        window.location.href = `/lifeengine/plan/${fallbackPlanId}`;
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
      <div className="max-w-5xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-gray-900">🤖 AI Plan Generator</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate personalized wellness plans using advanced AI
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          <CustomGPTForm
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onProfileChange={setSelectedProfileId}
            form={form}
            setForm={setForm}
          />
          <div className="flex flex-wrap gap-4">
            <Button type="submit" disabled={loading || !selectedProfileId}>
              {loading ? "Generating..." : "Generate with Custom GPT"}
            </Button>
            <Button type="button" variant="ghost" onClick={openGPT}>
              Open GPT in Chat
            </Button>
          </div>
        </form>

        <PlanBrief block={planBrief} copyBrief={() => navigator.clipboard.writeText(planBrief)} />

        {plan && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <span className="text-2xl">📖</span> Custom GPT Plan
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
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No plan yet
            </h3>
            <p className="text-gray-600">
              Configure your profile and click “Generate with Custom GPT” to get started.
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
