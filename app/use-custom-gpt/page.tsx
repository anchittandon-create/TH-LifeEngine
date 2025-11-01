"use client";

import React, { useState } from "react";
import PlanPreview from "@/app/components/PlanPreview";
import type { LifeEnginePlan } from "@/app/types/lifeengine";

const GPT_URL =
  process.env.NEXT_PUBLIC_LIFEENGINE_GPT_URL || "";

export default function UseCustomGPTPage() {
  const [profileId, setProfileId] = useState("ritika-001");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<LifeEnginePlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openGPT = () => {
    if (!GPT_URL) {
      alert(
        "Please set NEXT_PUBLIC_LIFEENGINE_GPT_URL in your .env.local file with your Custom GPT share URL"
      );
      return;
    }
    window.open(GPT_URL, "_blank", "noopener,noreferrer");
  };

  const refreshPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/v1/plans/latest?profile_id=${encodeURIComponent(profileId)}`
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to fetch latest plan");
      }

      const data = await res.json();
      setPlan(data);
    } catch (e: any) {
      setError(e.message || "Unknown error occurred");
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
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚙️</span> Controls
          </h2>
          <div className="space-y-4">
            {/* Profile ID Input */}
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
                Available demo profiles: <code>ritika-001</code>,{" "}
                <code>demo-002</code>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
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
          </div>
        </div>

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
