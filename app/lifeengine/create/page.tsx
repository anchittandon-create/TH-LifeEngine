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
        <h1 className={styles.title}>Create Your Personalized Plan</h1>
        <p className={styles.subtitle}>
          Select a profile and customize your wellness plan
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        {validationErrors.length > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <p style={{ color: '#dc2626', fontWeight: '600', marginBottom: '8px' }}>
              ⚠️ Please fix the following errors:
            </p>
            <ul style={{ color: '#dc2626', paddingLeft: '20px' }}>
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        
        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#dc2626'
          }}>
            ❌ {error}
          </div>
        )}
        
        {generatedPlanId && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            border: '2px solid #22c55e',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#16a34a'
          }}>
            ✅ Plan generated successfully! Redirecting...
          </div>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Select Profile</h2>

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
            <div className={styles.noProfiles}>
              <p>No profiles found. Please create a profile first.</p>
              <Button variant="ghost" onClick={() => router.push('/lifeengine/profiles')}>
                Go to Profiles
              </Button>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Plan Configuration</h2>
          <PlanConfigurator form={form} setForm={setForm} />
        </section>

        {selectedProfileId && form.planTypes.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📋 Generation Summary</h2>
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #bae6fd'
            }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>Profile:</strong> {profiles.find(p => p.id === selectedProfileId)?.name || 'Selected'}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Plan Types:</strong> {form.planTypes.map(pt => 
                  PLAN_TYPE_OPTIONS.find(opt => opt.value === pt)?.label || pt
                ).join(', ')}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Duration:</strong> {DURATION_OPTIONS.find(opt => opt.value === form.duration)?.label || form.duration}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>Intensity:</strong> {form.intensity}
              </p>
              {form.focusAreas.length > 0 && (
                <p style={{ marginBottom: '8px' }}>
                  <strong>Focus Areas:</strong> {form.focusAreas.join(', ')}
                </p>
              )}
              {form.goals.length > 0 && (
                <p style={{ marginBottom: '8px' }}>
                  <strong>Goals:</strong> {form.goals.join(', ')}
                </p>
              )}
            </div>
          </section>
        )}

        <Actions>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !selectedProfileId}>
            {loading ? "Generating..." : "Generate Plan"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setForm(defaultPlanFormState)}
          >
            Reset Fields
          </Button>
        </Actions>
      </form>
    </div>
  );
}
