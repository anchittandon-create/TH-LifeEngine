"use client";

import useSWR from "swr";
import clsx from "clsx";
import { useState } from "react";

type Sex = "F" | "M" | "Other";

type Profile = {
  id: string;
  name: string;
  demographics?: {
    age?: number;
    sex?: Sex;
    height?: number;
    weight?: number;
  };
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
  };
  lifestyle?: {
    occupation?: string;
    timeZone?: string;
    activityLevel?: string;
    primaryGoal?: string;
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const INPUT_CLASS =
  "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

const defaultForm = {
  name: "",
  age: 30,
  sex: "F" as Sex,
  height: 165,
  weight: 70,
  email: "",
  phone: "",
  location: "",
  occupation: "",
  timeZone: "Asia/Kolkata",
  activityLevel: "moderate",
  primaryGoal: "",
};

export default function Profiles() {
  const { data, mutate, isLoading } = useSWR<{ profiles: Profile[] }>("/api/lifeengine/profiles/list", fetcher);
  const profiles = data?.profiles ?? [];

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateForm<K extends keyof typeof defaultForm>(key: K, value: (typeof defaultForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(defaultForm);
    setEditingId(null);
    setError(null);
  }

  function loadProfile(profile: Profile) {
    setForm({
      name: profile.name ?? "",
      age: profile.demographics?.age ?? 30,
      sex: (profile.demographics?.sex as Sex) ?? "F",
      height: profile.demographics?.height ?? 165,
      weight: profile.demographics?.weight ?? 70,
      email: profile.contact?.email ?? "",
      phone: profile.contact?.phone ?? "",
      location: profile.contact?.location ?? "",
      occupation: profile.lifestyle?.occupation ?? "",
      timeZone: profile.lifestyle?.timeZone ?? "Asia/Kolkata",
      activityLevel: profile.lifestyle?.activityLevel ?? "moderate",
      primaryGoal: profile.lifestyle?.primaryGoal ?? "",
    });
    setEditingId(profile.id);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      demographics: {
        age: Number(form.age),
        sex: form.sex,
        height: Number(form.height),
        weight: Number(form.weight),
      },
      contact: {
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
      },
      lifestyle: {
        occupation: form.occupation.trim(),
        timeZone: form.timeZone,
        activityLevel: form.activityLevel,
        primaryGoal: form.primaryGoal.trim(),
      },
    };

    try {
      const url = editingId ? "/api/lifeengine/profiles/update" : "/api/lifeengine/profiles/create";
      const body = editingId ? { id: editingId, ...payload } : payload;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Unable to save profile");
      }
      await mutate();
      resetForm();
    } catch (err: any) {
      setError(err.message ?? "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProfile(id: string) {
    try {
      const res = await fetch("/api/lifeengine/profiles/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error || "Unable to delete profile");
      }
      await mutate();
      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      setError(err.message ?? "Unexpected error");
    }
  }

  return (
    <section className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-white/95 p-8 shadow-xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Profile Management</h2>
          <p className="text-sm text-slate-500">
            Store detailed demographics and lifestyle context. Plans reference this data to stay personalised.
          </p>
        </div>
        <span className="rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold text-indigo-700">
          {profiles.length} total
        </span>
      </header>

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-4">
        <InputCard title="Identity">
          <FormField label="Full name" required>
            <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="e.g. Anchit Tandon" className={INPUT_CLASS} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Age" required>
              <input
                type="number"
                min={10}
                max={100}
                value={form.age}
                onChange={(e) => updateForm("age", Number(e.target.value) || 0)}
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField label="Sex" required>
              <select value={form.sex} onChange={(e) => updateForm("sex", e.target.value as Sex)} className={INPUT_CLASS}>
                <option value="F">Female</option>
                <option value="M">Male</option>
                <option value="Other">Other</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Height (cm)" required>
              <input
                type="number"
                min={120}
                max={220}
                value={form.height}
                onChange={(e) => updateForm("height", Number(e.target.value) || 0)}
                className={INPUT_CLASS}
              />
            </FormField>
            <FormField label="Weight (kg)" required>
              <input
                type="number"
                min={30}
                max={200}
                value={form.weight}
                onChange={(e) => updateForm("weight", Number(e.target.value) || 0)}
                className={INPUT_CLASS}
              />
            </FormField>
          </div>
        </InputCard>

        <InputCard title="Contact">
          <FormField label="Email" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
              placeholder="anchit@timesgroup.com"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Phone" required>
            <input
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              placeholder="+91-90000-00000"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Location" required>
            <input
              value={form.location}
              onChange={(e) => updateForm("location", e.target.value)}
              placeholder="Mumbai, IN"
              className={INPUT_CLASS}
            />
          </FormField>
        </InputCard>

        <InputCard title="Lifestyle">
          <FormField label="Occupation">
            <input
              value={form.occupation}
              onChange={(e) => updateForm("occupation", e.target.value)}
              placeholder="Product Manager"
              className={INPUT_CLASS}
            />
          </FormField>
          <FormField label="Time zone">
            <select value={form.timeZone} onChange={(e) => updateForm("timeZone", e.target.value)} className={INPUT_CLASS}>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              <option value="Europe/London">Europe/London (BST)</option>
            </select>
          </FormField>
          <FormField label="Activity level">
            <select
              value={form.activityLevel}
              onChange={(e) => updateForm("activityLevel", e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="sedentary">Sedentary</option>
              <option value="light">Lightly active</option>
              <option value="moderate">Moderately active</option>
              <option value="active">Very active</option>
            </select>
          </FormField>
          <FormField label="Primary goal">
            <input
              value={form.primaryGoal}
              onChange={(e) => updateForm("primaryGoal", e.target.value)}
              placeholder="PCOD-friendly fat loss"
              className={INPUT_CLASS}
            />
          </FormField>
        </InputCard>

        <div className="flex flex-col justify-end gap-3">
          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</p> : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : editingId ? "Update profile" : "Add profile"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-inner">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading profiles…</p>
        ) : profiles.length ? (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => {
              const isAnchor = profile.id === "prof_anchit";
              const lifestyle = profile.lifestyle ?? {};
              return (
                <li key={profile.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
                      <p className="text-xs text-slate-500">
                        Age {profile.demographics?.age ?? "—"} · {profile.demographics?.sex ?? "—"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {isAnchor ? (
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-[10px] font-semibold uppercase text-indigo-600">
                          Anchor
                        </span>
                      ) : null}
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadProfile(profile)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        {!isAnchor ? (
                          <button
                            onClick={() => deleteProfile(profile.id)}
                            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 text-[11px] text-slate-500">
                    <Stat label="Email" value={profile.contact?.email ?? "—"} />
                    <Stat label="Phone" value={profile.contact?.phone ?? "—"} />
                    <Stat label="Location" value={profile.contact?.location ?? "—"} />
                    <Stat label="Height" value={profile.demographics?.height ? `${profile.demographics.height} cm` : "—"} />
                    <Stat label="Weight" value={profile.demographics?.weight ? `${profile.demographics.weight} kg` : "—"} />
                    <Stat label="Occupation" value={lifestyle.occupation ?? "—"} />
                    <Stat label="Time zone" value={lifestyle.timeZone ?? "—"} />
                    <Stat label="Activity" value={lifestyle.activityLevel ?? "—"} />
                    <Stat label="Primary goal" value={lifestyle.primaryGoal ?? "—"} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No profiles yet. Add your first member to get started.</p>
        )}
      </div>
    </section>
  );
}

function InputCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-100/80 px-3 py-2">
      <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-xs text-slate-700">{value || "—"}</span>
    </div>
  );
}

// Utility class to keep inputs consistent
declare module "react" {
  interface HTMLAttributes<T> {
    className?: string;
  }
}
