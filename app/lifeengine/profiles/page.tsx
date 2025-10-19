"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Profiles.module.css";
import {
  Actions,
  Button,
  Field,
  Form,
  HelpText,
  Input,
  Label,
  Select,
  Textarea,
  Chips,
} from "@/components/ui/Form";
import type { Profile } from "@/lib/domain/profile";
import {
  deleteProfile as removeProfileLocal,
  exportProfiles,
  getProfiles,
  importProfiles,
  saveProfile as saveProfileLocal,
} from "@/lib/utils/store";
import { createId } from "@/lib/utils/ids";

const genderOptions: Profile["gender"][] = ["F", "M", "Other"];
const regionOptions: Profile["region"][] = ["IN", "US", "EU", "Global"];
const activityOptions: Profile["activity_level"][] = [
  "sedentary",
  "light",
  "moderate",
  "intense",
];
const dietaryOptions: Profile["dietary"]["type"][] = [
  "veg",
  "vegan",
  "eggetarian",
  "non_veg",
  "jain",
  "gluten_free",
  "lactose_free",
];
const toneOptions: Profile["preferences"]["tone"][] = [
  "gentle",
  "balanced",
  "intense",
];

type FormState = {
  id: string;
  name: string;
  gender: Profile["gender"];
  age: number;
  height_cm: number;
  weight_kg: number;
  region: Profile["region"];
  medical_flags: string;
  activity_level: Profile["activity_level"];
  dietary_type: Profile["dietary"]["type"];
  dietary_allergies: string;
  dietary_avoid: string;
  cuisine_pref: string;
  tone: Profile["preferences"]["tone"];
  indoor_only: boolean;
  notes: string;
  days_per_week: number;
  slots: string;
};

const emptyForm: FormState = {
  id: "",
  name: "",
  gender: "F",
  age: 30,
  height_cm: 165,
  weight_kg: 60,
  region: "IN",
  medical_flags: "",
  activity_level: "moderate",
  dietary_type: "veg",
  dietary_allergies: "",
  dietary_avoid: "",
  cuisine_pref: "Indian fusion",
  tone: "balanced",
  indoor_only: false,
  notes: "",
  days_per_week: 5,
  slots: "06:30-07:15, 20:30-21:00",
};

function parseList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function serialiseSlots(slots: Profile["availability"]["preferred_slots"]) {
  if (!slots.length) return "";
  return slots.map((slot) => `${slot.start}-${slot.end}`).join(", ");
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

async function mirrorProfile(profile: Profile, method: "POST" | "PUT") {
  try {
    await fetch("/api/lifeengine/profiles", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    });
  } catch (error) {
    console.warn("Profile sync failed", error);
  }
}

async function removeProfileRemote(id: string) {
  try {
    await fetch("/api/lifeengine/profiles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  } catch (error) {
    console.warn("Profile removal sync failed", error);
  }
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfiles(getProfiles());
  }, []);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === editingId) ?? null,
    [profiles, editingId]
  );

  useEffect(() => {
    if (selectedProfile) {
      setForm({
        id: selectedProfile.id,
        name: selectedProfile.name,
        gender: selectedProfile.gender,
        age: selectedProfile.age,
        height_cm: selectedProfile.height_cm,
        weight_kg: selectedProfile.weight_kg,
        region: selectedProfile.region,
        medical_flags: selectedProfile.medical_flags.join(", "),
        activity_level: selectedProfile.activity_level,
        dietary_type: selectedProfile.dietary.type,
        dietary_allergies: selectedProfile.dietary.allergies.join(", "),
        dietary_avoid: selectedProfile.dietary.avoid_items.join(", "),
        cuisine_pref: selectedProfile.dietary.cuisine_pref,
        tone: selectedProfile.preferences.tone,
        indoor_only: selectedProfile.preferences.indoor_only,
        notes: selectedProfile.preferences.notes ?? "",
        days_per_week: selectedProfile.availability.days_per_week,
        slots: serialiseSlots(selectedProfile.availability.preferred_slots),
      });
    } else {
      setForm(emptyForm);
    }
  }, [selectedProfile]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prepared: Profile = {
      id: form.id || createId("prof"),
      name: form.name || "Unnamed",
      gender: form.gender,
      age: Number(form.age) || 30,
      height_cm: Number(form.height_cm) || 165,
      weight_kg: Number(form.weight_kg) || 60,
      region: form.region,
      medical_flags: parseList(form.medical_flags),
      activity_level: form.activity_level,
      dietary: {
        type: form.dietary_type,
        allergies: parseList(form.dietary_allergies),
        avoid_items: parseList(form.dietary_avoid),
        cuisine_pref: form.cuisine_pref,
      },
      preferences: {
        tone: form.tone,
        indoor_only: form.indoor_only,
        notes: form.notes || undefined,
      },
      availability: {
        days_per_week: Number(form.days_per_week) || 5,
        preferred_slots: parseSlots(form.slots),
      },
    };

    const nextList = saveProfileLocal(prepared);
    setProfiles(nextList);
    setEditingId(prepared.id);
    await mirrorProfile(prepared, form.id ? "PUT" : "POST");
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "Remove this profile? This only clears your local copy."
    );
    if (!confirmDelete) return;
    const nextList = removeProfileLocal(id);
    setProfiles(nextList);
    if (editingId === id) {
      setEditingId(null);
    }
    await removeProfileRemote(id);
  };

  const handleExport = () => {
    const data = exportProfiles();
    const blob = new Blob([data], { type: "application/json" });
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
    importProfiles(text);
    const nextList = getProfiles();
    setProfiles(nextList);
    nextList.forEach((profile) => {
      mirrorProfile(profile, "POST");
    });
    event.target.value = "";
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.section}>
        <div className={styles.headingRow}>
          <h1 className={styles.title}>Profiles</h1>
          <button
            type="button"
            className={styles.buttonGhost}
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
            }}
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
                      {profile.gender} • {profile.age}y
                    </span>
                    <span className={styles.badge}>{profile.region}</span>
                    <span className={styles.badge}>{profile.activity_level}</span>
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
                {profile.medical_flags.map((flag) => (
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
              ref={fileRef}
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
        <Form onSubmit={handleSubmit}>
          <Field>
            <Label>Name</Label>
            <Input
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Anchit"
            />
          </Field>

          <Field>
            <Label>Gender</Label>
            <Select
              value={form.gender}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  gender: event.target.value as FormState["gender"],
                }))
              }
            >
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label>Age</Label>
            <Input
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
          </Field>

          <Field>
            <Label>Height (cm)</Label>
            <Input
              type="number"
              value={form.height_cm}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  height_cm: Number(event.target.value),
                }))
              }
            />
          </Field>

          <Field>
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              value={form.weight_kg}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  weight_kg: Number(event.target.value),
                }))
              }
            />
          </Field>

          <Field>
            <Label>Region</Label>
            <Select
              value={form.region}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  region: event.target.value as FormState["region"],
                }))
              }
            >
              {regionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label>Medical Flags (comma separated)</Label>
            <Input
              value={form.medical_flags}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  medical_flags: event.target.value,
                }))
              }
              placeholder="pcod, hypertension"
            />
            <Chips items={parseList(form.medical_flags)} />
          </Field>

          <Field>
            <Label>Activity Level</Label>
            <Select
              value={form.activity_level}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  activity_level: event.target.value as FormState["activity_level"],
                }))
              }
            >
              {activityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label>Dietary Type</Label>
            <Select
              value={form.dietary_type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dietary_type: event.target.value as FormState["dietary_type"],
                }))
              }
            >
              {dietaryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label>Dietary Allergies (comma separated)</Label>
            <Input
              value={form.dietary_allergies}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dietary_allergies: event.target.value,
                }))
              }
              placeholder="peanut, lactose"
            />
            <Chips items={parseList(form.dietary_allergies)} />
          </Field>

          <Field>
            <Label>Foods to Avoid</Label>
            <Input
              value={form.dietary_avoid}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dietary_avoid: event.target.value,
                }))
              }
              placeholder="fried snacks"
            />
          </Field>

          <Field>
            <Label>Preferred Cuisine</Label>
            <Input
              value={form.cuisine_pref}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  cuisine_pref: event.target.value,
                }))
              }
            />
          </Field>

          <Field>
            <Label>Plan Tone</Label>
            <Select
              value={form.tone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tone: event.target.value as FormState["tone"],
                }))
              }
            >
              {toneOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label>Indoor Only?</Label>
            <Select
              value={form.indoor_only ? "yes" : "no"}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  indoor_only: event.target.value === "yes",
                }))
              }
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </Select>
          </Field>

          <Field>
            <Label>Availability (days per week)</Label>
            <Input
              type="number"
              min={1}
              max={7}
              value={form.days_per_week}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  days_per_week: Number(event.target.value),
                }))
              }
            />
          </Field>

          <Field>
            <Label>Preferred Slots (start-end, comma separated)</Label>
            <Input
              value={form.slots}
              onChange={(event) =>
                setForm((current) => ({ ...current, slots: event.target.value }))
              }
              placeholder="06:30-07:15, 20:30-21:00"
            />
            <HelpText>Use 24h time e.g., 06:30-07:15</HelpText>
          </Field>

          <Field>
            <Label>Preferences / Notes</Label>
            <Textarea
              className={styles.textareaSmall}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </Field>

          <Actions>
            <Button type="submit" variant="primary">
              {editingId ? "Update Profile" : "Save Profile"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Clear
            </Button>
          </Actions>
        </Form>
      </section>
    </div>
  );
}
