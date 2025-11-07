"use client";

import React, { useState, useEffect } from "react";
import PlanPreview from "@/app/components/PlanPreview";
import type { LifeEnginePlan } from "@/app/types/lifeengine";
import type { Profile } from "@/lib/ai/schemas";
import {
  defaultPlanFormState,
  describePlanBrief,
} from "@/lib/lifeengine/planConfig";
import type { PlanFormState } from "@/lib/lifeengine/planConfig";
import { PlanConfigurator } from "@/components/lifeengine/PlanConfigurator";
import { 
  buildPromptFromForm, 
  validatePlanForm,
  type PromptBuilderInput 
} from "@/lib/lifeengine/promptBuilder";
import { 
  generatePlanWithGPT, 
  getLatestPlan,
  formatErrorMessage 
} from "@/lib/lifeengine/api";

const GPT_URL =
  process.env.NEXT_PUBLIC_LIFEENGINE_GPT_URL ||
  "https://chatgpt.com/g/g-690630c1dfe48191b63fc09f8f024ccb-th-lifeengine-companion?ref=mini";

export default function UseCustomGPTPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState("prof_anchit");
  const [form, setForm] = useState(defaultPlanFormState);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);
  const [gptResponse, setGptResponse] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/lifeengine/profiles');
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const planBrief = describePlanBrief(profileId, form);

  const copyPlanBrief = async () => {
    try {
      await navigator.clipboard.writeText(planBrief);
    } catch (err) {
      console.warn("Failed to copy", err);
    }
  };

  const openGPT = async () => {
    if (!GPT_URL) {
      alert(
        "Please set NEXT_PUBLIC_LIFEENGINE_GPT_URL in your .env.local file with your Custom GPT share URL"
      );
      return;
    }
    await copyPlanBrief();
    window.open(GPT_URL, "_blank", "noopener,noreferrer");
  };

  const generateWithGPT = async () => {
    setGenerating(true);
    setError(null);
    setValidationErrors([]);
    setGptResponse("");

    // Validation
    const formValidation = validatePlanForm(form);
    if (!formValidation.valid) {
      setValidationErrors(formValidation.errors);
      setGenerating(false);
      return;
    }

    try {
      // Find selected profile
      const selectedProfile = profiles.find(p => p.id === profileId);
      
      // Build prompt with all form data and profile info
      const promptInput: PromptBuilderInput = {
        ...form,
        profileName: selectedProfile?.name,
        age: selectedProfile?.age,
        gender: selectedProfile?.gender,
      };

      const prompt = buildPromptFromForm(promptInput);
      
      console.log("🤖 [CustomGPT] Generating plan with prompt:", prompt.substring(0, 200) + "...");
      
      const result = await generatePlanWithGPT(prompt);
      
      console.log("✅ [CustomGPT] Generation successful");
      
      setGptResponse(result.plan);
      
    } catch (err: any) {
      console.error("❌ [CustomGPT] Generation failed:", err);
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const refreshPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getLatestPlan(profileId);
      setPlan(data);
    } catch (e: any) {
      const errorMessage = formatErrorMessage(e);
      setError(errorMessage);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 pt-8">
          <h1 className="text-4xl font-bold text-gray-900">
            🤖 Use Custom GPT
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate personalized wellness plans using TH_LifeEngine Companion
            GPT
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span> How It Works
          </h2>
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <span>
                Click <strong>"Open Custom GPT"</strong> to launch the
                TH_LifeEngine Companion in ChatGPT
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <span>
                In the chat, ask it to generate a plan using your{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                  profile_id
                </code>
                <br />
                <span className="text-sm text-gray-500 italic">
                  Example: "Use profile_id ritika-001 and generate a combined
                  7-day plan"
                </span>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <span>
                Return here and click <strong>"Refresh Latest Plan"</strong> to
                view the generated plan
              </span>
            </li>
          </ol>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚙️</span> Plan Configuration
          </h2>
          
          {/* Profile Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Profile
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
            >
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.age}y, {profile.gender})
                </option>
              ))}
            </select>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold mb-2">⚠️ Please fix the following:</p>
              <ul className="text-red-700 text-sm space-y-1 pl-4">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          <PlanConfigurator form={form} setForm={setForm} />
          
          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap mt-6">
            <button
              onClick={generateWithGPT}
              disabled={generating}
              className="flex-1 min-w-[200px] bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating with AI...
                </>
              ) : (
                <>
                  <span className="text-xl">✨</span>
                  Generate Plan with AI
                </>
              )}
            </button>
            
            <button
              onClick={openGPT}
              className="flex-1 min-w-[200px] bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-xl">🚀</span>
              Open Custom GPT
            </button>
            
            <button
              onClick={refreshPlan}
              disabled={loading}
              className="flex-1 min-w-[200px] bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <span className="text-xl">🔄</span>
                  Refresh Latest Plan
                </>
              )}
            </button>
          </div>
          
          <PlanBrief block={planBrief} copyBrief={copyPlanBrief} />
        </div>

        {/* GPT Generated Plan */}
        {gptResponse && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">✨</span> AI-Generated Plan
            </h2>
            <div className="prose prose-sm max-w-none">
              <div
                className="whitespace-pre-wrap text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: gptResponse.replace(/\n/g, '<br/>') }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-red-500 text-xl">❌</span>
              <div>
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Preview */}
        {plan && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-2xl">📖</span> Your Generated Plan
            </h2>
            <PlanPreview plan={plan} />
          </div>
        )}

        {/* Empty State */}
        {!plan && !error && !loading && (
          <div className="bg-gray-50 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🌟</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Plan Yet
            </h3>
            <p className="text-gray-600">
              Open the Custom GPT and generate a plan to see it here!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

type ProfileControlsProps = {
  profileId: string;
  setProfileId: (value: string) => void;
  openGPT: () => void;
  refreshPlan: () => Promise<void>;
  loading: boolean;
};

function ProfileControls({
  profileId,
  setProfileId,
  openGPT,
  refreshPlan,
  loading,
}: ProfileControlsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile ID
        </label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          placeholder="e.g., ritika-001"
        />
        <p className="text-xs text-gray-500 mt-1">
          Available profiles: <code>prof_anchit</code>, <code>prof_f6cf230b</code>, <code>ritika-001</code>, <code>demo-002</code>
        </p>
      </div>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={openGPT}
          className="flex-1 min-w-[200px] bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <span className="text-xl">🚀</span>
          Open Custom GPT (plan brief copied)
        </button>
        <button
          onClick={refreshPlan}
          disabled={loading}
          className="flex-1 min-w-[200px] bg-white border-2 border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </>
          ) : (
            <>
              <span className="text-xl">🔄</span>
              Refresh Latest Plan
            </>
          )}
        </button>
      </div>
    </div>
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
          <span className="text-xl">📝</span> Plan Brief for GPT
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
