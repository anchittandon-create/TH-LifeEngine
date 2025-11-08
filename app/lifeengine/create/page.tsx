"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PlanForm, PlanFormData, defaultPlanFormData, validatePlanFormData } from "@/components/lifeengine/PlanForm";
import { generatePlan, formatErrorMessage } from "@/lib/lifeengine/api";
import { PLAN_TYPE_OPTIONS, DURATION_OPTIONS, getDietLabel } from "@/lib/lifeengine/planConfig";

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
        setFormData({
          ...formData,
          fullName: profile.name,
          age: profile.age,
          gender: profile.gender,
          goals: profile.goals || [],
          preferredTime: profile.preferredTime || "flexible",
          // Map experience to intensity
          intensity: profile.experience === "beginner" ? "low" : 
                     profile.experience === "advanced" ? "high" : "medium",
        });
      }
    }
  }, [selectedProfileId, profiles]);

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
      const durationValue = parseInt(formData.duration.match(/\d+/)?.[0] || "1", 10);
      const durationUnit = formData.duration.includes("week") ? "weeks" : "days";
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="text-7xl mb-4">🚀</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Create Your Personalized Wellness Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Answer a few questions and our AI will craft a comprehensive health, yoga, diet, and fitness plan tailored just for you
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Selector */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">👤</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Select Profile</h2>
                <p className="text-gray-600">Use an existing profile or create a new one</p>
              </div>
            </div>
            
            {loadingProfiles ? (
              <div className="flex items-center gap-3 text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span>Loading profiles...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <label htmlFor="profile-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Profile
                </label>
                <select
                  id="profile-select"
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg"
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
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                      ✅ Profile loaded. You can modify the details below before generating your plan.
                    </p>
                  </div>
                )}
                
                {selectedProfileId === "new" && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-800">
                      ✨ Creating a new profile. Fill in the details below.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

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
                  <p className="font-bold text-red-800 text-xl mb-2">Generation Failed</p>
                  <p className="text-red-700 leading-relaxed">{error}</p>
                  <div className="mt-4 p-4 bg-red-100 rounded-lg">
                    <p className="text-sm text-red-800 font-semibold mb-2">💡 Troubleshooting Tips:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Check your internet connection</li>
                      <li>• Verify your API key is configured correctly</li>
                      <li>• Try reducing the plan duration or complexity</li>
                      <li>• Contact support if the issue persists</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {generatedPlanId && (
            <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">✅</span>
                <div className="flex-1">
                  <p className="font-bold text-green-800 text-xl mb-2">
                    🎉 Plan Generated Successfully!
                  </p>
                  <p className="text-green-700 text-lg">
                    Your personalized wellness plan is ready. Redirecting you now...
                  </p>
                  <div className="mt-4">
                    <div className="animate-pulse flex space-x-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <div className="h-2 w-2 bg-green-500 rounded-full animation-delay-200"></div>
                      <div className="h-2 w-2 bg-green-500 rounded-full animation-delay-400"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-8 shadow-lg">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl">
                    🧠
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-blue-800 text-xl font-bold mb-2">{loadingMessage}</p>
                  <p className="text-blue-600 text-sm">
                    This may take 30-90 seconds. Please don't close this window.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Unified Plan Form */}
          <PlanForm formData={formData} setFormData={setFormData} errors={formErrors} />

          {/* Plan Summary */}
          {formData.planTypes.length > 0 && formData.fullName && (
            <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📊</span>
                <h2 className="text-xl font-bold text-gray-800">Plan Summary</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Name</p>
                  <p className="text-lg font-bold text-gray-800">{formData.fullName}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Age & Gender</p>
                  <p className="text-lg font-bold text-gray-800">{formData.age}y, {formData.gender}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Plan Types</p>
                  <p className="text-sm font-bold text-gray-800">
                    {formData.planTypes.map(pt => 
                      PLAN_TYPE_OPTIONS.find(opt => opt.value === pt)?.label || pt
                    ).join(", ")}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Duration</p>
                  <p className="text-lg font-bold text-gray-800">
                    {DURATION_OPTIONS.find(opt => opt.value === formData.duration)?.label}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Diet Preference</p>
                  <p className="text-sm font-bold text-gray-800">
                    {getDietLabel(formData.dietType)}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Activity Level</p>
                  <p className="text-lg font-bold text-gray-800 capitalize">{formData.activityLevel}</p>
                </div>
                {formData.goals.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm lg:col-span-2">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Goals</p>
                    <p className="text-sm font-bold text-gray-800">{formData.goals.join(", ")}</p>
                  </div>
                )}
                {formData.chronicConditions.length > 0 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm lg:col-span-2">
                    <p className="text-sm font-semibold text-gray-600 mb-1">Health Considerations</p>
                    <p className="text-sm font-bold text-gray-800">{formData.chronicConditions.join(", ")}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 pb-10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 text-lg"
            >
              ← Back
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.fullName || formData.planTypes.length === 0}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-12 py-4 text-lg rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
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
                "✨ Generate My Personalized Plan"
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFormData(defaultPlanFormData)}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 text-lg"
            >
              🔄 Reset Form
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
