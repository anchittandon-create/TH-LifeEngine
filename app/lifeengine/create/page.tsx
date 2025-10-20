"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
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
      <h1>Create Your Personalized Plan</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <section>
          <h2>Profile Information</h2>

          <Field label="Name">
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Enter your name"
              required
            />
          </Field>

          <div className={styles.grid}>
            <Field label="Age">
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                placeholder="Years"
                required
                min="1"
                max="120"
              />
            </Field>

            <Field label="Gender">
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                required
              >
                {GENDERS.map(gender => (
                  <option key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className={styles.grid}>
            <Field label="Height (cm)">
              <input
                type="number"
                value={profile.height}
                onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                placeholder="cm"
                required
                min="50"
                max="250"
              />
            </Field>

            <Field label="Weight (kg)">
              <input
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

          <Field label="Activity Level">
            <select
              value={profile.activityLevel}
              onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as any })}
              required
            >
              {ACTIVITY_LEVELS.map(level => (
                <option key={level} value={level}>
                  {level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Goals">
            <TypeaheadMulti
              value={profile.goals}
              onChange={(goals) => setProfile({ ...profile, goals })}
              suggestions={goalSuggestions}
              placeholder="Select your goals..."
            />
          </Field>

          <Field label="Medical Conditions (optional)">
            <TypeaheadMulti
              value={profile.flags}
              onChange={(flags) => setProfile({ ...profile, flags })}
              suggestions={flagSuggestions}
              placeholder="Any medical conditions..."
            />
          </Field>
        </section>

        <section>
          <h2>Plan Preferences</h2>

          <Field label="Primary Plan Type">
            <select
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
            </select>
          </Field>

          <Field label="Secondary Plan Type (optional)">
            <select
              value={intake.secondaryPlanType}
              onChange={(e) => setIntake({ ...intake, secondaryPlanType: e.target.value })}
            >
              <option value="">Select secondary type (optional)</option>
              {PLAN_TYPES.secondary.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </Field>

          <div className={styles.grid}>
            <Field label="Start Date">
              <input
                type="date"
                value={intake.startDate}
                onChange={(e) => setIntake({ ...intake, startDate: e.target.value })}
                placeholder="Select start date"
                required
              />
            </Field>

            <Field label="End Date">
              <input
                type="date"
                value={intake.endDate}
                onChange={(e) => setIntake({ ...intake, endDate: e.target.value })}
                placeholder="Select end date"
                required
              />
            </Field>
          </div>
        </section>

        <div className={styles.actions}>
          <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={() => router.back()}>
            Cancel
          </button>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Creating..." : "Create Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
