"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Profiles.module.css";
import type { Profile } from "@/lib/ai/schemas";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Field } from "@/components/ui/Field";
import { Actions } from "@/components/ui/Actions";

const DEFAULT_PROFILE: Partial<Profile> = {
  name: "",
  age: 25,
  gender: "other",
  goals: [],
  healthConcerns: "",
  experience: "beginner",
  preferredTime: "flexible",
  subscriptionType: "quarterly",
};

function toFormState(profile: Profile) {
  return {
    ...profile,
    goalsInput: (profile.goals ?? []).join(", "),
  };
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(toFormState(DEFAULT_PROFILE as Profile));
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === editingId) ?? null,
    [profiles, editingId]
  );

  useEffect(() => {
    if (selectedProfile) {
      setForm(toFormState(selectedProfile));
    } else {
      setForm(toFormState({ ...DEFAULT_PROFILE, id: "" } as Profile));
    }
  }, [selectedProfile]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: Profile = {
      id: editingId || `profile_${Date.now()}`,
      name: form.name,
      age: Number(form.age),
      gender: form.gender,
      goals: form.goalsInput ? form.goalsInput.split(',').map(g => g.trim()).filter(Boolean) : [],
      healthConcerns: form.healthConcerns,
      experience: form.experience,
      preferredTime: form.preferredTime,
      subscriptionType: form.subscriptionType,
    };

    try {
      const response = await fetch('/api/lifeengine/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchProfiles();
        // Reset form to create mode after successful save
        setEditingId(null);
        setForm(toFormState({ ...DEFAULT_PROFILE, id: "" } as Profile));
      } else {
        const errorData = await response.json();
        alert(`Failed to save profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile: Network error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this profile?')) return;

    try {
      const response = await fetch('/api/lifeengine/profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (response.ok) {
        await fetchProfiles();
        if (editingId === id) {
          setEditingId(null);
          setForm(toFormState({ ...DEFAULT_PROFILE, id: "" } as Profile));
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to delete profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert('Failed to delete profile: Network error');
    }
  };

  if (loading) {
    return <div className={styles.wrapper}>Loading...</div>;
  }

  return (
    <div className={styles.wrapper}>
      <section className={styles.section}>
        <div className={styles.headingRow}>
          <h1 className={styles.title}>Profiles</h1>
          <Button variant="ghost" onClick={() => setEditingId(null)}>
            New Profile
          </Button>
        </div>
        <div className={styles.list}>
          {profiles.map((profile) => (
            <article key={profile.id} className={`card ${styles.card}`}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>{profile.name}</div>
                  <div className={styles.badges}>
                    <span className={styles.badge}>
                      {profile.gender} • {profile.age}y
                    </span>
                    <span className={styles.badge}>{profile.experience}</span>
                    <span className={styles.badge}>{profile.preferredTime}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(profile.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(profile.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className={styles.badges}>
                {profile.goals.map((goal) => (
                  <span key={goal} className={styles.badge}>
                    {goal}
                  </span>
                ))}
              </div>
              {profile.healthConcerns && (
                <div className={styles.healthConcerns}>
                  Health Concerns: {profile.healthConcerns}
                </div>
              )}
            </article>
          ))}
          {profiles.length === 0 && (
            <div className={`card ${styles.emptyState}`}>
              <div className={styles.emptyStateTitle}>No profiles yet</div>
              <p>Create your first profile to start building personalized health plans.</p>
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>
          {editingId ? "Edit Profile" : "Create Profile"}
        </h2>
        <form onSubmit={handleSave} className={styles.form}>
          <Field label="Name" required>
            <Input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </Field>

          <Field label="Age" required>
            <Input
              type="number"
              min={1}
              value={form.age}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  age: Number(event.target.value),
                }))
              }
              required
            />
          </Field>

          <Field label="Gender" required>
            <Select
              value={form.gender}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  gender: event.target.value as Profile["gender"],
                }))
              }
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </Field>

          <Field label="Fitness Goals" helper="Comma-separated list (e.g., Weight Loss, Flexibility, Stress Relief)">
            <Input
              value={form.goalsInput}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  goalsInput: event.target.value,
                }))
              }
              placeholder="Weight Loss, Flexibility, Stress Relief"
            />
          </Field>

          <Field label="Health Concerns">
            <Textarea
              value={form.healthConcerns}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  healthConcerns: event.target.value,
                }))
              }
              placeholder="Any health concerns or conditions..."
            />
          </Field>

          <Field label="Experience Level" required>
            <Select
              value={form.experience}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  experience: event.target.value as Profile["experience"],
                }))
              }
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </Field>

          <Field label="Preferred Session Time" required>
            <Select
              value={form.preferredTime}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  preferredTime: event.target.value as Profile["preferredTime"],
                }))
              }
              required
            >
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="flexible">Flexible</option>
            </Select>
          </Field>

          <Field label="Subscription Type" required>
            <Select
              value={form.subscriptionType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subscriptionType: event.target.value as Profile["subscriptionType"],
                }))
              }
              required
            >
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
              <option value="custom">Custom</option>
            </Select>
          </Field>

          <Actions>
            <Button type="submit">
              {editingId ? "Update Profile" : "Create Profile"}
            </Button>
          </Actions>
        </form>
      </section>
    </div>
  );
}
