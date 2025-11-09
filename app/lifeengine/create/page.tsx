"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PlanForm, PlanFormData, defaultPlanFormData, validatePlanFormData } from "@/components/lifeengine/PlanForm";
import { generatePlan, formatErrorMessage } from "@/lib/lifeengine/api";
import { PLAN_TYPE_OPTIONS, DURATION_OPTIONS, getDietLabel } from "@/lib/lifeengine/planConfig";
import { GenerationProgress } from "@/components/lifeengine/GenerationProgress";

const GENDER_MAP: Record<string, "M" | "F" | "Other"> = {
  male: "M",
  female: "F",
  other: "Other",
};

const SLOT_PRESETS: Record<
  string,
  {
    start: string;
    end: string;
  }
> = {
  morning: { start: "06:00", end: "07:00" },
  late_morning: { start: "10:00", end: "11:00" },
  afternoon: { start: "13:00", end: "14:00" },
  evening: { start: "18:00", end: "19:00" },
  night: { start: "21:00", end: "22:00" },
  flexible: { start: "09:00", end: "10:00" },
};

interface Profile {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  goals: string[];
  healthConcerns: string;
  experience: "beginner" | "intermediate" | "advanced";
  preferredTime: "morning" | "evening" | "flexible";
  subscriptionType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CreatePlan() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [formData, setFormData] = useState<PlanFormData>(defaultPlanFormData);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Preparing your plan...");
  const [error, setError] = useState<string>("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generatedPlanId, setGeneratedPlanId] = useState<string>("");

  // Fetch profiles on mount
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await fetch("/api/lifeengine/profiles");
        if (response.ok) {
          const data = await response.json();
          setProfiles(data.profiles || []);
        }
      } catch (err) {
        console.error("Failed to fetch profiles:", err);
      } finally {
        setLoadingProfiles(false);
      }
    }
    fetchProfiles();
  }, []);

  // Update form when profile is selected
  useEffect(() => {
    if (selectedProfileId && selectedProfileId !== "new") {
      const profile = profiles.find(p => p.id === selectedProfileId);
      if (profile) {
        // Use functional setState to avoid formData in dependencies (prevents infinite loop)
        setFormData(prevData => ({
          ...prevData,
          fullName: profile.name,
          age: profile.age,
          gender: profile.gender,
          goals: profile.goals || [],
          preferredTime: profile.preferredTime || "flexible",
          // Map experience to intensity
          intensity: profile.experience === "beginner" ? "low" : 
                     profile.experience === "advanced" ? "high" : "medium",
        }));
      }
    }
  }, [selectedProfileId, profiles]); // Safe - no formData dependency

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors({});
    setGeneratedPlanId("");
    
    // Validate form
    const validation = validatePlanFormData(formData);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    setLoading(true);
    setLoadingMessage("🔮 Analyzing your profile and preferences...");

    try {
      // Use selected profile ID or create inline profile
      const profileId = selectedProfileId && selectedProfileId !== "new" 
        ? selectedProfileId 
        : `inline_${Date.now()}`;
        
      const normalizedGender = GENDER_MAP[formData.gender] ?? "Other";
      
      // Parse duration from the new format (e.g., "1_week", "2_weeks", "3_months")
      let durationValue: number;
      let durationUnit: "days" | "weeks" | "months";
      
      if (formData.duration.includes("week")) {
        durationValue = parseInt(formData.duration.match(/\d+/)?.[0] || "1", 10);
        durationUnit = "weeks";
      } else if (formData.duration.includes("month")) {
        durationValue = parseInt(formData.duration.match(/\d+/)?.[0] || "1", 10);
        durationUnit = "months";
      } else {
        // Fallback to days
        durationValue = parseInt(formData.duration.match(/\d+/)?.[0] || "7", 10);
        durationUnit = "days";
      }
      
      const preferredSlot = SLOT_PRESETS[formData.preferredTime] ?? SLOT_PRESETS.flexible;
      const daysPerWeek =
        formData.activityLevel === "intense" ? 6 : formData.activityLevel === "sedentary" ? 4 : 5;

      // Convert PlanFormData to API format
      const payload = {
        profileId,
        profileSnapshot: {
          id: profileId,
          name: formData.fullName,
          age: formData.age,
          gender: normalizedGender,
          height_cm: 170,
          weight_kg: 70,
          region: "Global",
          activity_level: formData.activityLevel,
          dietary: {
            type: formData.dietType,
            allergies: [],
            avoid_items: [],
            cuisine_pref: []
          },
          medical_flags: formData.chronicConditions,
          preferences: {
            tone: "balanced",
            indoor_only: false,
            notes: `Work: ${formData.workSchedule}, Preferred Time: ${formData.preferredTime}, Sleep: ${formData.sleepHours}h, Stress: ${formData.stressLevel}`
          },
          availability: {
            days_per_week: daysPerWeek,
            preferred_slots: [preferredSlot]
          }
        },
        plan_type: {
          primary: formData.planTypes[0] || "combined",
          secondary: formData.planTypes.slice(1)
        },
        goals: formData.goals.map((goal, index) => ({
          name: goal,
          priority: index + 1
        })),
        conditions: formData.chronicConditions,
        duration: {
          unit: durationUnit,
          value: durationValue
        },
        time_budget_min_per_day: formData.intensity === "low" ? 30 : formData.intensity === "high" ? 60 : 45,
        experience_level: formData.intensity === "low" ? "beginner" : formData.intensity === "high" ? "advanced" : "intermediate",
        equipment: []
      };
      
      console.log('🔍 [CreatePlan] Generating with profile:', {
        profileId,
        name: formData.fullName,
        age: formData.age,
        planTypes: formData.planTypes,
        duration: formData.duration,
        goals: formData.goals
      });
      
      // Update loading messages
      const timer1 = setTimeout(() => {
        setLoadingMessage("✨ AI is crafting your personalized wellness plan...");
      }, 5000);

      const timer2 = setTimeout(() => {
        setLoadingMessage("🎯 Adding step-by-step instructions...");
      }, 15000);

      const timer3 = setTimeout(() => {
        setLoadingMessage("📝 Finalizing your plan details...");
      }, 30000);
      
      const result = await generatePlan(payload);
      
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      
      console.log('✅ [CreatePlan] Plan generated successfully:', result.planId);
      
      setGeneratedPlanId(result.planId);
      
      // Success message and redirect
      setTimeout(() => {
        router.push(`/lifeengine/plan/${result.planId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ [CreatePlan] Generation failed:', err);
      
      const errorMessage = formatErrorMessage(err);
      setError(`Plan generation failed: ${errorMessage}. Please try again or contact support if the issue persists.`);
      
      // Log detailed error for debugging
      console.error('Detailed error:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
    } finally {
      setLoading(false);
      setLoadingMessage("Preparing your plan...");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-6 px-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Compact Header */}
        <header className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-5xl">🚀</span>
            <h1 className="text-4xl font-bold text-gray-900">
              Create Your Wellness Plan
            </h1>
          </div>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Fill the form and our AI will craft a comprehensive plan tailored just for you
          </p>
        </header>

        {/* Loading State with Real Progress - Full Width */}
        {loading && (
          <div className="mb-6">
            <GenerationProgress onComplete={() => {
              console.log('Progress complete - generation should be finishing soon');
            }} />
          </div>
        )}

        {/* Error Messages - Full Width */}
        {Object.keys(formErrors).length > 0 && (
          <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 shadow-lg animate-pulse mb-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-lg mb-2">
                  Please fix the following errors:
                </p>
                <ul className="space-y-1 text-red-700 text-sm">
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

        {/* API Error - Full Width */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 shadow-lg mb-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">❌</span>
              <div className="flex-1">
                <p className="font-bold text-red-800 text-lg mb-2">Generation Failed</p>
                <p className="text-red-700 text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message - Full Width */}
        {generatedPlanId && (
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-4 shadow-lg mb-6">
            <div className="flex items-start gap-3">
              <span className="text-3xl flex-shrink-0">✅</span>
              <div className="flex-1">
                <p className="font-bold text-green-800 text-lg mb-1">
                  🎉 Plan Generated Successfully!
                </p>
                <p className="text-green-700 text-sm">
                  Your personalized wellness plan is ready. Redirecting you now...
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Two Column Layout: Form (Left) + Summary (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Form Fields (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Selector - Compact */}
              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">👤</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Profile</h2>
                    <p className="text-sm text-gray-600">Select or create new</p>
                  </div>
                </div>
                
                {loadingProfiles ? (
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <span className="text-sm">Loading profiles...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <select
                      id="profile-select"
                      value={selectedProfileId}
                      onChange={(e) => setSelectedProfileId(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base"
                      aria-label="Select a profile"
                    >
                      <option value="">-- Select a Profile --</option>
                      {profiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.name} (Age: {profile.age}, {profile.gender})
                        </option>
                      ))}
                      <option value="new">➕ Create New Profile</option>
                    </select>
                    
                    {selectedProfileId && selectedProfileId !== "new" && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                          ✅ Profile loaded. Modify details below if needed.
                        </p>
                      </div>
                    )}
                    
                    {selectedProfileId === "new" && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-800">
                          ✨ Creating new profile. Fill in the details below.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Unified Plan Form */}
              <PlanForm formData={formData} setFormData={setFormData} errors={formErrors} />
            </div>

            {/* Right Column: Plan Summary (1/3 width, sticky) */}
            {formData.planTypes.length > 0 && formData.fullName && (
              <div className="lg:col-span-1">
                <div className="sticky top-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200 shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">📊</span>
                    <h2 className="text-lg font-bold text-gray-800">Plan Summary</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Name</p>
                      <p className="text-sm font-bold text-gray-800">{formData.fullName}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Age & Gender</p>
                      <p className="text-sm font-bold text-gray-800">{formData.age}y, {formData.gender}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Plan Types</p>
                      <p className="text-xs font-bold text-gray-800">
                        {formData.planTypes.map(pt => 
                          PLAN_TYPE_OPTIONS.find(opt => opt.value === pt)?.label || pt
                        ).join(", ")}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Duration</p>
                      <p className="text-sm font-bold text-gray-800">
                        {DURATION_OPTIONS.find(opt => opt.value === formData.duration)?.label}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Diet</p>
                      <p className="text-xs font-bold text-gray-800">
                        {getDietLabel(formData.dietType)}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-xs font-semibold text-gray-600 mb-1">Activity</p>
                      <p className="text-sm font-bold text-gray-800 capitalize">{formData.activityLevel}</p>
                    </div>
                    {formData.goals.length > 0 && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Goals</p>
                        <p className="text-xs font-bold text-gray-800">{formData.goals.join(", ")}</p>
                      </div>
                    )}
                    {formData.chronicConditions.length > 0 && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Health</p>
                        <p className="text-xs font-bold text-gray-800">{formData.chronicConditions.join(", ")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Full Width */}
          <div className="flex flex-wrap gap-3 justify-center items-center pt-4 pb-6 border-t-2 border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
              className="px-6 py-2.5 text-base"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.fullName || formData.planTypes.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-10 py-2.5 text-base rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </span>
              ) : (
                "✨ Generate My Plan"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFormData(defaultPlanFormData)}
              disabled={loading}
              className="px-6 py-2.5 text-base"
            >
              🔄 Reset
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
