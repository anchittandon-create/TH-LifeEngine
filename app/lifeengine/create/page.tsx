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
    const planSelections = form.planTypes.length ? form.planTypes.slice(0, 3) : [PLAN_TYPE_OPTIONS[0].value];
    setLoading(true);

    try {
      const planIds: string[] = [];
      for (const planType of planSelections) {
        const intake = buildIntakeFromForm(form, planType);
        const response = await fetch("/api/lifeengine/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId: selectedProfileId,
            intake,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to generate plan");
        }
        planIds.push(payload.planId);
      }

      const lastPlan = planIds[planIds.length - 1];
      if (planIds.length > 1) {
        alert(`Generated ${planIds.length} plans. Opening the most recent one now.`);
      }
      router.push(`/lifeengine/plan/${lastPlan}`);
    } catch (error: any) {
      console.error("Error creating plan:", error);
      alert(error?.message ?? "Failed to create plan. Please try again.");
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
          <PlanConfigurator form={form} setForm={setForm} />
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
