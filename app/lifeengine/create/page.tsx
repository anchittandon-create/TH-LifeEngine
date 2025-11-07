"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Actions } from "@/components/ui/Actions";
import type { Profile } from "@/lib/ai/schemas";
import {
  PLAN_TYPE_OPTIONS,
  DURATION_OPTIONS,
  INTENSITY_OPTIONS,
  FORMAT_OPTIONS,
  FOCUS_AREA_OPTIONS,
  ROUTINE_OPTIONS,
  defaultPlanFormState,
  buildIntakeFromForm,
} from "@/lib/lifeengine/planConfig";
import styles from "./page.module.css";

export default function CreatePlan() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [form, setForm] = useState(defaultPlanFormState);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) {
      alert("Please select a profile");
      return;
    }
    setLoading(true);

    try {
      const intake = buildIntakeFromForm(form);

      const response = await fetch("/api/lifeengine/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfileId,
          intake,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate plan");

      const { planId } = await response.json();
      router.push(`/lifeengine/plan/${planId}`);
    } catch (error) {
      console.error("Error creating plan:", error);
      alert("Failed to create plan. Please try again.");
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

          <Field label="Plan Type" helper="Choose the primary objective">
            <Select
              value={form.planType}
              onChange={(e) => setForm({ ...form, planType: e.target.value })}
            >
              {PLAN_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <div className={styles.grid}>
            <Field label="Duration">
              <Select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Intensity">
              <Select
                value={form.intensity}
                onChange={(e) => setForm({ ...form, intensity: e.target.value })}
              >
                {INTENSITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Focus Areas"
            helper="Pick up to 4 areas to emphasize"
          >
            <select
              multiple
              className={styles.multiSelect}
              value={form.focusAreas}
              onChange={(event) => {
                const selections = Array.from(
                  event.target.selectedOptions,
                  (option) => option.value,
                ).slice(0, 4);
                setForm({ ...form, focusAreas: selections });
              }}
            >
              {FOCUS_AREA_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Output Format">
            <Select
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
            >
              {FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Daily Routine Guidance">
            <Select
              value={form.includeDailyRoutine}
              onChange={(event) =>
                setForm({ ...form, includeDailyRoutine: event.target.value })
              }
            >
              {ROUTINE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </section>

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
