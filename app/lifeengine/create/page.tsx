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
      
      // Show success message
      setTimeout(() => {
        router.push(`/lifeengine/plan/${result.planId}`);
      }, 1500);
      
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
    </div>
  );
}
