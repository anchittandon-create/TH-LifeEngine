"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Actions } from "@/components/ui/Actions";
import { TypeaheadMulti } from "@/components/ui/TypeaheadMulti";
import { GOALS, MEDICAL_FLAGS, ACTIVITY_LEVELS, GENDERS, PLAN_TYPES } from "@/lib/catalog/examples";
import styles from "./page.module.css";

export default function CreatePlan() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    gender: "other" as const,
    height: "",
    weight: "",
    activityLevel: "moderate" as const,
    goals: [] as string[],
    flags: [] as string[],
  });

  const [intake, setIntake] = useState({
    primaryPlanType: "",
    secondaryPlanType: "",
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(false);

  const goalSuggestions = GOALS.map(goal => ({ id: goal, label: goal }));
  const flagSuggestions = MEDICAL_FLAGS.map(flag => ({ id: flag, label: flag }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create profile
      const profileResponse = await fetch("/api/lifeengine/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          age: parseInt(profile.age),
          height: parseInt(profile.height),
          weight: parseInt(profile.weight),
        }),
      });

      if (!profileResponse.ok) throw new Error("Failed to create profile");

      const { profile: createdProfile } = await profileResponse.json();

      // Generate plan
      const planResponse = await fetch("/api/lifeengine/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: createdProfile.id,
          intake: {
            ...intake,
            profileId: createdProfile.id,
          },
        }),
      });

      if (!planResponse.ok) throw new Error("Failed to generate plan");

      const { planId } = await planResponse.json();

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
          Tell us about yourself and we'll create a custom health plan tailored to your needs
        </p>
      </header>

      <form onSubmit={handleSubmit} className={styles.form}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Profile Information</h2>

          <Field label="Name" required>
            <Input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Enter your name"
              required
            />
          </Field>

          <div className={styles.grid}>
            <Field label="Age" required>
              <Input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                placeholder="Years"
                required
                min="1"
                max="120"
              />
            </Field>

            <Field label="Gender" required>
              <Select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                required
              >
                {GENDERS.map(gender => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className={styles.grid}>
            <Field label="Height (cm)" required>
              <Input
                type="number"
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                placeholder="cm"
                required
                min="50"
                max="250"
              />
            </Field>

            <Field label="Weight (kg)" required>
              <Input
                type="number"
                value={profile.weight}
                onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                placeholder="kg"
                required
                min="20"
                max="300"
              />
            </Field>
          </div>

          <Field label="Activity Level" required>
            <Select
              value={profile.activityLevel}
              onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as any })}
              required
            >
              {ACTIVITY_LEVELS.map(level => (
                <option key={level} value={level}>
                  {level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Goals">
            <TypeaheadMulti
              label="Goals"
              values={profile.goals}
              onChange={(goals) => setProfile({ ...profile, goals })}
              suggestField="goals"
              placeholder="Select your goals..."
            />
          </Field>

          <Field label="Medical Conditions" helper="Optional - any conditions that may affect your plan">
            <TypeaheadMulti
              label="Medical Conditions"
              values={profile.flags}
              onChange={(flags) => setProfile({ ...profile, flags })}
              suggestField="flags"
              placeholder="Any medical conditions..."
            />
          </Field>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Plan Preferences</h2>

          <Field label="Primary Plan Type" required>
            <Select
              value={intake.primaryPlanType}
              onChange={(e) => setIntake({ ...intake, primaryPlanType: e.target.value })}
              required
            >
              <option value="">Select primary type</option>
              {PLAN_TYPES.primary.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Secondary Plan Type" helper="Optional - choose a secondary focus for your plan">
            <Select
              value={intake.secondaryPlanType}
              onChange={(e) => setIntake({ ...intake, secondaryPlanType: e.target.value })}
            >
              <option value="">Select secondary type (optional)</option>
              {PLAN_TYPES.secondary.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </Select>
          </Field>

          <div className={styles.grid}>
            <Field label="Start Date" required>
              <Input
                type="date"
                value={intake.startDate}
                onChange={(e) => setIntake({ ...intake, startDate: e.target.value })}
                placeholder="Select start date"
                required
              />
            </Field>

            <Field label="End Date" required>
              <Input
                type="date"
                value={intake.endDate}
                onChange={(e) => setIntake({ ...intake, endDate: e.target.value })}
                placeholder="Select end date"
                required
              />
            </Field>
          </div>
        </section>

        <Actions>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Plan"}
          </Button>
        </Actions>
      </form>
    </div>
  );
}
