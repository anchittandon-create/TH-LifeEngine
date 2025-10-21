"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Actions } from "@/components/ui/Actions";
import { TypeaheadMulti } from "@/components/ui/TypeaheadMulti";
import type { Profile } from "@/lib/ai/schemas";
import styles from "./page.module.css";

export default function CreatePlan() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [form, setForm] = useState({
    planType: "",
    duration: "",
    intensity: "",
    focusAreas: [] as string[],
    format: "text",
    includeDailyRoutine: false,
  });
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

  const focusAreaOptions = [
    "Weight", "Stress", "Flexibility", "Energy", "Sleep"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) {
      alert("Please select a profile");
      return;
    }
    setLoading(true);

    try {
      const intake = {
        primaryPlanType: form.planType.toLowerCase().replace(' ', '_'),
        secondaryPlanType: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + parseInt(form.duration) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        preferences: {
          intensity: form.intensity,
          focusAreas: form.focusAreas,
          format: form.format,
          includeDailyRoutine: form.includeDailyRoutine,
        },
      };

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

          <Field label="Plan Type" required>
            <Select
              value={form.planType}
              onChange={(e) => setForm({ ...form, planType: e.target.value })}
              required
            >
              <option value="">Select plan type</option>
              <option value="Yoga">Yoga</option>
              <option value="Diet">Diet</option>
              <option value="Combined">Combined</option>
              <option value="Holistic">Holistic</option>
            </Select>
          </Field>

          <div className={styles.grid}>
            <Field label="Duration" required>
              <Select
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                required
              >
                <option value="">Select duration</option>
                <option value="1">1 month</option>
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
              </Select>
            </Field>

            <Field label="Intensity" required>
              <Select
                value={form.intensity}
                onChange={(e) => setForm({ ...form, intensity: e.target.value })}
                required
              >
                <option value="">Select intensity</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
            </Field>
          </div>

          <Field label="Focus Areas">
            <TypeaheadMulti
              label="Focus Areas"
              values={form.focusAreas}
              onChange={(focusAreas) => setForm({ ...form, focusAreas })}
              suggestField="goals"
              placeholder="Select focus areas..."
            />
          </Field>

          <Field label="Output Format" required>
            <Select
              value={form.format}
              onChange={(e) => setForm({ ...form, format: e.target.value })}
              required
            >
              <option value="text">Text</option>
              <option value="pdf">PDF</option>
              <option value="both">Both</option>
            </Select>
          </Field>

          <Field label="Include Daily Routine">
            <input
              type="checkbox"
              checked={form.includeDailyRoutine}
              onChange={(e) => setForm({ ...form, includeDailyRoutine: e.target.checked })}
            />
          </Field>
        </section>

        <Actions>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !selectedProfileId}>
            {loading ? "Generating..." : "Generate Plan"}
          </Button>
        </Actions>
      </form>
    </div>
  );
}
