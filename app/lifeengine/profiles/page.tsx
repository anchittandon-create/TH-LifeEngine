"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Profiles.module.css";
import type { Profile } from "@/lib/domain/profile";
import {
  deleteProfile as deleteProfileLocal,
  exportProfiles,
  getProfiles,
  importProfiles,
  saveProfile as saveProfileLocal,
} from "@/lib/utils/store";
import { createId } from "@/lib/utils/ids";

const DEFAULT_PROFILE: Profile = {
  id: "",
  name: "",
  gender: "F",
  age: 30,
  height_cm: 165,
  weight_kg: 65,
  region: "IN",
  medical_flags: [],
  activity_level: "moderate",
  dietary: {
    type: "veg",
    allergies: [],
    avoid_items: [],
    cuisine_pref: ["Indian fusion"],
  },
  preferences: { tone: "balanced", indoor_only: true },
  availability: {
    days_per_week: 5,
    preferred_slots: [{ start: "06:30", end: "07:15" }],
  },
  plan_type: { primary: "weight_loss", secondary: [] },
};

function toFormState(profile: Profile) {
  return {
    ...profile,
    medicalFlagsInput: (profile.medical_flags ?? []).join(", "),
    allergiesInput: (profile.dietary?.allergies ?? []).join(", "),
    avoidInput: (profile.dietary?.avoid_items ?? []).join(", "),
    cuisineInput: (profile.dietary?.cuisine_pref ?? []).join(", "),
    slotsInput: (profile.availability?.preferred_slots ?? [])
      .map((slot) => `${slot.start}-${slot.end}`)
      .join(", "),
  };
}

function parseList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseSlots(value: string) {
  return value
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((segment) => {
      const [start, end] = segment.split("-").map((part) => part.trim());
      return { start: start || "06:00", end: end || "07:00" };
    });
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(toFormState(DEFAULT_PROFILE));
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfiles(getProfiles());
  }, []);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === editingId) ?? null,
    [profiles, editingId]
  );

  useEffect(() => {
    if (selectedProfile) {
      setForm(toFormState(selectedProfile));
    } else {
      setForm(toFormState({ ...DEFAULT_PROFILE, id: "" }));
    }
  }, [selectedProfile]);

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const id = editingId ?? createId();
    const payload: Profile = {
      id,
      name: form.name || "Unnamed",
      gender: form.gender,
      age: Number(form.age) || 0,
      height_cm: Number(form.height_cm) || 0,
      weight_kg: Number(form.weight_kg) || 0,
      region: form.region,
      medical_flags: parseList(form.medicalFlagsInput ?? ""),
      activity_level: form.activity_level,
      dietary: {
        type: form.dietary?.type,
        allergies: parseList(form.allergiesInput ?? ""),
        avoid_items: parseList(form.avoidInput ?? ""),
        cuisine_pref: parseList(form.cuisineInput ?? ""),
      },
      preferences: {
        tone: form.preferences?.tone ?? "balanced",
        indoor_only: form.preferences?.indoor_only ?? true,
        notes: form.preferences?.notes ?? "",
      },
      availability: {
        days_per_week: Number(form.availability?.days_per_week) || 5,
        preferred_slots: parseSlots(form.slotsInput ?? ""),
      },
      plan_type: {
        primary: form.plan_type?.primary ?? "weight_loss",
        secondary: form.plan_type?.secondary ?? [],
      },
    };

    const next = saveProfileLocal(payload);
    setProfiles(next);
    setEditingId(payload.id);

    fetch("/api/lifeengine/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Remove this profile?")) return;
    const next = deleteProfileLocal(id);
    setProfiles(next);
    if (editingId === id) {
      setEditingId(null);
    }
    fetch("/api/lifeengine/profiles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  };

  const handleExport = () => {
    const blob = new Blob([exportProfiles()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `th_profiles_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      importProfiles(text);
      const next = getProfiles();
      setProfiles(next);
      next.forEach((profile) => {
        fetch("/api/lifeengine/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        }).catch(() => {});
      });
    } catch (error) {
      console.error("Import failed", error);
      window.alert("Invalid profile file");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.section}>
        <div className={styles.headingRow}>
          <h1 className={styles.title}>Profiles</h1>
          <button
            type="button"
            className={styles.buttonGhost}
            onClick={() => setEditingId(null)}
          >
            New Profile
          </button>
        </div>
        <div className={styles.list}>
          {profiles.map((profile) => (
            <article key={profile.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>{profile.name}</div>
                  <div className={styles.badges}>
                    <span className={styles.badge}>
                      {profile.gender} • {profile.age}
                    </span>
                    {profile.region && (
                      <span className={styles.badge}>{profile.region}</span>
                    )}
                    {profile.activity_level && (
                      <span className={styles.badge}>{profile.activity_level}</span>
                    )}
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.buttonGhost}
                    onClick={() => setEditingId(profile.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={styles.buttonGhost}
                    onClick={() => handleDelete(profile.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className={styles.badges}>
                {(profile.medical_flags ?? []).map((flag) => (
                  <span key={flag} className={styles.badge}>
                    {flag}
                  </span>
                ))}
              </div>
            </article>
          ))}
          {profiles.length === 0 && (
            <article className={styles.card}>
              <div className={styles.cardTitle}>No profiles yet</div>
              <p className={styles.badge}>Add your first profile to begin planning.</p>
            </article>
          )}
        </div>
        <div className={styles.toolbar}>
          <button type="button" className={styles.buttonGhost} onClick={handleExport}>
            Export JSON
          </button>
          <label className={styles.buttonGhost}>
            Import JSON
            <input
              ref={importRef}
              type="file"
              accept="application/json"
              className={styles.fileInput}
              onChange={handleImport}
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>
          {editingId ? "Edit Profile" : "Create Profile"}
        </h2>
        <form onSubmit={handleSave} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Name</span>
            <input
              className="input"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Gender</span>
            <select
              className="select"
              value={form.gender}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  gender: event.target.value as Profile["gender"],
                }))
              }
            >
              <option>F</option>
              <option>M</option>
              <option>Other</option>
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Age</span>
            <input
              className="input"
              type="number"
              min={12}
              max={90}
              value={form.age}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  age: Number(event.target.value),
                }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Height (cm)</span>
            <input
              className="input"
              type="number"
              value={form.height_cm}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  height_cm: Number(event.target.value),
                }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Weight (kg)</span>
            <input
              className="input"
              type="number"
              value={form.weight_kg}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  weight_kg: Number(event.target.value),
                }))
              }
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Region</span>
            <select
              className="select"
              value={form.region}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  region: event.target.value as Profile["region"],
                }))
              }
            >
              <option>IN</option>
              <option>US</option>
              <option>EU</option>
              <option>Global</option>
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Medical flags</span>
            <input
              className="input"
              value={form.medicalFlagsInput}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  medicalFlagsInput: event.target.value,
                }))
              }
              placeholder="pcod, hypertension"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Dietary allergies</span>
            <input
              className="input"
              value={form.allergiesInput}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  allergiesInput: event.target.value,
                }))
              }
              placeholder="lactose, peanut"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Foods to avoid</span>
            <input
              className="input"
              value={form.avoidInput}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  avoidInput: event.target.value,
                }))
              }
              placeholder="fried snacks"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Preferred slots</span>
            <input
              className="input"
              value={form.slotsInput}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  slotsInput: event.target.value,
                }))
              }
              placeholder="06:30-07:15, 20:30-21:00"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Notes</span>
            <textarea
              className="textarea"
              value={form.preferences?.notes ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  preferences: {
                    ...current.preferences,
                    notes: event.target.value,
                  },
                }))
              }
            />
          </label>

          <button type="submit" className={styles.buttonGhost}>
            {editingId ? "Update" : "Save"}
          </button>
        </form>
      </section>
    </div>
  );
}
