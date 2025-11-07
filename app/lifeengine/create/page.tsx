"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Actions } from "@/components/ui/Actions";
import type { Profile } from "@/lib/ai/schemas";
import { PlanConfigurator } from "@/components/lifeengine/PlanConfigurator";
import {
  defaultPlanFormState,
  buildIntakeFromForm,
  PLAN_TYPE_OPTIONS,
  DURATION_OPTIONS,
} from "@/lib/lifeengine/planConfig";
import { validatePlanForm, formatFormForAPI } from "@/lib/lifeengine/promptBuilder";
import { generatePlan, formatErrorMessage, type ApiError } from "@/lib/lifeengine/api";
import styles from "./page.module.css";

export default function CreatePlan() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [form, setForm] = useState(defaultPlanFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [generatedPlanId, setGeneratedPlanId] = useState<string>("");
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/lifeengine/profiles');
      const data = await response.json();
      setProfiles(data.profiles || []);
      
      // Auto-select first profile if available
      if (data.profiles && data.profiles.length > 0 && !selectedProfileId) {
        setSelectedProfileId(data.profiles[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors([]);
    setGeneratedPlanId("");
    
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

    try {
      const payload = formatFormForAPI(form, selectedProfileId);
      
      console.log('🔍 [CreatePlan] Submitting plan generation:', {
        profileId: selectedProfileId,
        planTypes: form.planTypes,
        duration: form.duration,
        intensity: form.intensity,
      });
      
      const result = await generatePlan(payload);
      
      console.log('✅ [CreatePlan] Plan generated successfully:', result.planId);
      
      setGeneratedPlanId(result.planId);
      setGeneratedPlan(result.plan);
      setShowPlan(true);
      
      // Scroll to plan view
      setTimeout(() => {
        document.getElementById('generated-plan')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 300);
      
    } catch (err: any) {
      console.error('❌ [CreatePlan] Generation failed:', err);
      
      const errorMessage = formatErrorMessage(err);
      setError(errorMessage);
      
      // Show specific error details
      if (err.details) {
        setValidationErrors([err.details]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className="text-6xl mb-4">🚀</div>
        <h1 className={styles.title}>Create Your Personalized Wellness Plan</h1>
        <p className={styles.subtitle}>
          AI-powered planning tailored to your unique profile and goals
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
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
        
        {/* Success Message */}
        {generatedPlanId && (
          <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-3xl">✅</span>
              <div className="flex-1">
                <p className="font-bold text-green-800 text-lg mb-1">Plan Generated Successfully!</p>
                <p className="text-green-700">Redirecting to your personalized plan...</p>
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
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.age}y, {profile.gender})
                </option>
              ))}
            </Select>
          </Field>

          {profiles.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-xl">
              <p className="text-yellow-800 mb-3">📋 No profiles found. Please create a profile first.</p>
              <Button variant="ghost" onClick={() => router.push('/lifeengine/profiles')}>
                Go to Profiles →
              </Button>
            </div>
          )}
        </section>

        {/* Plan Configuration */}
        <section className={styles.section}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">⚙️</span>
            <h2 className="text-xl font-bold text-gray-800">Customize Your Plan</h2>
          </div>
          <PlanConfigurator form={form} setForm={setForm} />
        </section>

        {/* Generation Summary */}
        {selectedProfileId && form.planTypes.length > 0 && (
          <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📋</span>
              <h2 className="text-xl font-bold text-gray-800">Generation Summary</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                <span className="text-xl">👤</span>
                <div>
                  <p className="font-semibold text-gray-700">Profile</p>
                  <p className="text-gray-600">{profiles.find(p => p.id === selectedProfileId)?.name || 'Selected'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                <span className="text-xl">🎯</span>
                <div>
                  <p className="font-semibold text-gray-700">Plan Types</p>
                  <p className="text-gray-600">{form.planTypes.map(pt => 
                    PLAN_TYPE_OPTIONS.find(opt => opt.value === pt)?.label || pt
                  ).join(', ')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2 p-3 bg-white rounded-xl">
                  <span className="text-lg">⏱️</span>
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">Duration</p>
                    <p className="text-gray-600 text-sm">{DURATION_OPTIONS.find(opt => opt.value === form.duration)?.label || form.duration}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-white rounded-xl">
                  <span className="text-lg">💪</span>
                  <div>
                    <p className="font-semibold text-gray-700 text-sm">Intensity</p>
                    <p className="text-gray-600 text-sm capitalize">{form.intensity}</p>
                  </div>
                </div>
              </div>
              {form.focusAreas.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                  <span className="text-xl">🎨</span>
                  <div>
                    <p className="font-semibold text-gray-700">Focus Areas</p>
                    <p className="text-gray-600">{form.focusAreas.join(', ')}</p>
                  </div>
                </div>
              )}
              {form.goals.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-white rounded-xl">
                  <span className="text-xl">🎖️</span>
                  <div>
                    <p className="font-semibold text-gray-700">Goals</p>
                    <p className="text-gray-600">{form.goals.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => router.back()}
            className="w-full sm:w-auto"
          >
            ← Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !selectedProfileId}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              "✨ Generate My Plan"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setForm(defaultPlanFormState)}
            className="w-full sm:w-auto"
          >
            🔄 Reset
          </Button>
        </div>
      </form>

      {/* Generated Plan Display */}
      {showPlan && generatedPlan && (
        <div id="generated-plan" className="mt-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-300 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🎉</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Your Plan is Ready!</h2>
                  <p className="text-gray-600">Generated {generatedPlan.days?.length || 0} days of personalized wellness activities</p>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/lifeengine/plan/${generatedPlanId}`)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                View Full Plan →
              </Button>
            </div>

            {/* Plan Preview */}
            <div className="space-y-4">
              {generatedPlan.days?.slice(0, 3).map((day: any, index: number) => (
                <div key={index} className="bg-white rounded-xl p-5 shadow-md border border-green-200">
                  <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                    📅 Day {index + 1} - {day.date}
                  </h3>
                  
                  {/* Activities */}
                  {day.activities && day.activities.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        🏃 Activities ({day.activities.length})
                      </h4>
                      <div className="space-y-2">
                        {day.activities.slice(0, 3).map((activity: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-blue-600">•</span>
                            <div>
                              <span className="font-medium">{activity.name}</span>
                              <span className="text-gray-600"> - {activity.duration} min</span>
                              {activity.description && (
                                <p className="text-gray-500 text-xs mt-1">{activity.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {day.activities.length > 3 && (
                          <p className="text-xs text-gray-500 italic">+ {day.activities.length - 3} more activities</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meals */}
                  {day.meals && day.meals.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        🍽️ Meals ({day.meals.length})
                      </h4>
                      <div className="space-y-2">
                        {day.meals.slice(0, 3).map((meal: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-green-600">•</span>
                            <div>
                              <span className="font-medium">{meal.name}</span>
                              <span className="text-gray-600"> - {meal.calories} cal</span>
                              {meal.description && (
                                <p className="text-gray-500 text-xs mt-1">{meal.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {day.meals.length > 3 && (
                          <p className="text-xs text-gray-500 italic">+ {day.meals.length - 3} more meals</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {generatedPlan.days && generatedPlan.days.length > 3 && (
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-blue-800 font-medium">
                    + {generatedPlan.days.length - 3} more days in your complete plan
                  </p>
                  <Button
                    onClick={() => router.push(`/lifeengine/plan/${generatedPlanId}`)}
                    variant="ghost"
                    className="mt-2"
                  >
                    View Complete Plan →
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-green-200">
              <Button
                onClick={() => router.push(`/lifeengine/plan/${generatedPlanId}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                📋 View Full Plan
              </Button>
              <Button
                onClick={() => router.push('/lifeengine/dashboard')}
                variant="ghost"
              >
                📊 Go to Dashboard
              </Button>
              <Button
                onClick={() => {
                  setShowPlan(false);
                  setGeneratedPlan(null);
                  setGeneratedPlanId("");
                  setForm(defaultPlanFormState);
                }}
                variant="ghost"
              >
                ✨ Create Another Plan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
