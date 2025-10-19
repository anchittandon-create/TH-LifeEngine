"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { normalizePlanStructure, NormalizedPlan } from "@/lib/utils/planTransform";
import clsx from "clsx";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Contact = {
  email?: string;
  phone?: string;
  location?: string;
};

type Lifestyle = {
  occupation?: string;
  timeZone?: string;
  activityLevel?: string;
  primaryGoal?: string;
};

type Profile = {
  id: string;
  name: string;
  demographics?: {
    age?: number;
    sex?: string;
    height?: number;
    weight?: number;
  };
  contact?: Contact;
  lifestyle?: Lifestyle;
};

type PlanResponse = {
  planId: string;
  weekPlan: Array<{
    date: string;
    yoga: Array<{ flowId: string; durationMin: number }>;
    meals: Array<{ itemId: string; qty: string }>;
    habits?: string[];
    sleep?: { windDownMin: number };
  }>;
  warnings?: string[];
  confidence?: number;
  plan?: any;
};

const goalOptions = [
  "weight_loss",
  "muscle_gain",
  "pcod_remission",
  "gut_health",
  "sleep_quality",
  "stress_balance",
];

const moduleOptions = [
  { id: "yoga", label: "Yoga Booster" },
  { id: "nutrition", label: "Nutrition Reset" },
  { id: "mindfulness", label: "Mindfulness & Breath" },
  { id: "sleep", label: "Sleep & Recovery" },
  { id: "habit", label: "Habit Coaching" },
  { id: "skin_gut", label: "Skin & Gut Glow" },
];

const flagOptions = ["pcod", "pregnancy", "thyroid", "diabetes", "back_pain", "anxiety", "insomnia", "hypertension"];

const equipmentCatalog = [
  { key: "mat", label: "Yoga mat" },
  { key: "blocks", label: "Blocks" },
  { key: "strap", label: "Strap" },
  { key: "chair", label: "Chair" },
  { key: "rollers", label: "Foam roller" },
];

const INPUT_CLASS =
  "rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100";

export default function PlanCreator() {
  const { data: profileRes } = useSWR<{ profiles: Profile[] }>("/api/lifeengine/profiles/list", fetcher);
  const profiles = profileRes?.profiles ?? [];
  const { mutate } = useSWRConfig();

  const [profileId, setProfileId] = useState<string>("");
  const [durationUnit, setDurationUnit] = useState<"days" | "weeks" | "months">("weeks");
  const [durationValue, setDurationValue] = useState<number>(12);
  const [startDate, setStartDate] = useState<string>("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>(["weight_loss"]);
  const [modules, setModules] = useState<string[]>(["yoga", "nutrition", "mindfulness"]);
  const [dietType, setDietType] = useState("veg");
  const [cuisinePref, setCuisinePref] = useState("indian");
  const [allergiesInput, setAllergiesInput] = useState("nuts");
  const [flags, setFlags] = useState<string[]>(["pcod"]);
  const [timeBudget, setTimeBudget] = useState(45);
  const [availabilityDays, setAvailabilityDays] = useState(5);
  const [slotStart, setSlotStart] = useState("19:00");
  const [slotEnd, setSlotEnd] = useState("21:00");
  const [tone, setTone] = useState<"gentle" | "balanced" | "intense">("balanced");
  const [indoorOnly, setIndoorOnly] = useState(true);
  const [equipment, setEquipment] = useState<Record<string, boolean>>({
    mat: true,
    blocks: false,
    strap: false,
    chair: false,
    rollers: false,
  });
  const [level, setLevel] = useState("beginner");
  const [availabilityNotes, setAvailabilityNotes] = useState("Evening sessions preferred");
  const [additionalNotes, setAdditionalNotes] = useState("Cycle-friendly adjustments please");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PlanResponse | null>(null);
  const [normalized, setNormalized] = useState<NormalizedPlan | null>(null);

  useEffect(() => {
    if (!profileId && profiles.length) {
      setProfileId(profiles[0].id);
    }
  }, [profiles, profileId]);

  const currentProfile = useMemo(() => profiles.find((p) => p.id === profileId), [profileId, profiles]);

  const allergies = useMemo(
    () =>
      allergiesInput
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    [allergiesInput],
  );

  function toggle(collection: string[], value: string, setter: (next: string[]) => void) {
    setter(collection.includes(value) ? collection.filter((item) => item !== value) : [...collection, value]);
  }

  function toggleEquipment(key: string) {
    setEquipment((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleGenerate() {
    if (!profileId) {
      setError("Select a profile before generating.");
      return;
    }
    if (!selectedGoals.length) {
      setError("Pick at least one goal.");
      return;
    }
    setLoading(true);
    setError(null);
    setResponse(null);
    setNormalized(null);

    const payload = {
      profileId,
      profile: {
        age: currentProfile?.demographics?.age ?? 30,
        sex: (currentProfile?.demographics?.sex as "F" | "M" | "Other") ?? "F",
        height: currentProfile?.demographics?.height ?? 165,
        weight: currentProfile?.demographics?.weight ?? 70,
      },
      goals: selectedGoals,
      modules,
      dietary: { type: dietType, cuisine: cuisinePref, allergies },
      flags,
      timeBudget,
      level,
      notes: additionalNotes,
      duration: { unit: durationUnit, value: durationValue },
      startDate: startDate || undefined,
      availability: {
        daysPerWeek: availabilityDays,
        preferredSlots: [{ start: slotStart, end: slotEnd }],
        notes: availabilityNotes,
      },
      preferences: {
        tone,
        indoorOnly,
        notes: additionalNotes,
      },
      equipment,
    };

    try {
      const res = await fetch("/api/lifeengine/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Unable to generate plan");
      }
      setResponse(json);
      const normalizedPlan = normalizePlanStructure(json.planId, json.plan ?? json.weekPlan, json.warnings);
      setNormalized(normalizedPlan);
      mutate(`/api/lifeengine/plan/listByProfile?profileId=${profileId}`);
    } catch (err: any) {
      setError(err.message ?? "Unexpected error generating plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-white/95 p-8 shadow-xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">AI Plan Composer</h2>
          <p className="text-sm text-slate-500">
            Configure the member’s duration, goals, and constraints. Gemini 1.5 Flash will translate this into a phased
            weekly journey with yoga, nutrition, breathwork, and habits.
          </p>
        </div>
      </header>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <Card title="Profile & duration">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Member profile" required>
                <select value={profileId} onChange={(e) => setProfileId(e.target.value)} className={INPUT_CLASS}>
                  <option value="">Select profile…</option>
                  {profiles.map((profile) => (
                    <option value={profile.id} key={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Experience level" required>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className={INPUT_CLASS}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Duration value" required>
                <input
                  type="number"
                  min={1}
                  value={durationValue}
                  onChange={(e) => setDurationValue(Number(e.target.value) || 1)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Duration unit" required>
                <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as any)} className={INPUT_CLASS}>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="days">Days</option>
                </select>
              </Field>
              <Field label="Start date">
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={INPUT_CLASS} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Daily time budget (min)" required>
                <input
                  type="number"
                  min={20}
                  max={120}
                  value={timeBudget}
                  onChange={(e) => setTimeBudget(Number(e.target.value) || 20)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Days per week" required>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={availabilityDays}
                  onChange={(e) => setAvailabilityDays(Number(e.target.value) || 1)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="Preferred slot">
                <div className="flex items-center gap-2">
                  <input type="time" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} className={INPUT_CLASS} />
                  <span className="text-xs text-slate-500">to</span>
                  <input type="time" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} className={INPUT_CLASS} />
                </div>
              </Field>
            </div>
            <Field label="Availability notes">
              <input value={availabilityNotes} onChange={(e) => setAvailabilityNotes(e.target.value)} className={INPUT_CLASS} />
            </Field>
          </Card>

          <Card title="Goals & focus areas">
            <Field label="Primary goals" required>
              <div className="flex flex-wrap gap-2">
                {goalOptions.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggle(selectedGoals, goal, setSelectedGoals)}
                    className={clsx(
                      "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide",
                      selectedGoals.includes(goal)
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-100 text-slate-600 hover:border-slate-300",
                    )}
                  >
                    {goal.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Module toggles">
              <div className="grid gap-2 md:grid-cols-2">
                {moduleOptions.map((module) => (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => toggle(modules, module.id, setModules)}
                    className={clsx(
                      "rounded-2xl border px-4 py-3 text-left text-sm",
                      modules.includes(module.id)
                        ? "border-indigo-500 bg-indigo-500 text-white shadow"
                        : "border-indigo-100 bg-white text-indigo-700 hover:border-indigo-200",
                    )}
                  >
                    {module.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Medical flags">
              <div className="flex flex-wrap gap-2">
                {flagOptions.map((flag) => (
                  <button
                    key={flag}
                    type="button"
                    onClick={() => toggle(flags, flag, setFlags)}
                    className={clsx(
                      "rounded-full border px-4 py-2 text-xs font-semibold uppercase",
                      flags.includes(flag)
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-rose-200 bg-white text-rose-600 hover:border-rose-300",
                    )}
                  >
                    {flag.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </Field>
          </Card>

          <Card title="Nutrition & preferences">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Diet type" required>
                <select value={dietType} onChange={(e) => setDietType(e.target.value)} className={INPUT_CLASS}>
                  <option value="veg">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="eggetarian">Eggetarian</option>
                  <option value="non_veg">Non-veg</option>
                  <option value="jain">Jain</option>
                  <option value="gluten_free">Gluten free</option>
                  <option value="lactose_free">Lactose free</option>
                </select>
              </Field>
              <Field label="Cuisine preference" required>
                <input value={cuisinePref} onChange={(e) => setCuisinePref(e.target.value)} className={INPUT_CLASS} />
              </Field>
              <Field label="Allergies / restrictions">
                <input
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  placeholder="comma separated"
                  className={INPUT_CLASS}
                />
              </Field>
            </div>
            <Field label="Equipment">
              <div className="flex flex-wrap gap-2">
                {equipmentCatalog.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleEquipment(item.key)}
                    className={clsx(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      equipment[item.key]
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-emerald-200 bg-white text-emerald-600 hover:border-emerald-300",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tone">
                <div className="flex gap-2">
                  {(["gentle", "balanced", "intense"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTone(option)}
                      className={clsx(
                        "rounded-full border px-4 py-2 text-xs font-semibold uppercase",
                        tone === option
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Indoor focus">
                <button
                  type="button"
                  onClick={() => setIndoorOnly((prev) => !prev)}
                  className={clsx(
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase",
                    indoorOnly ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-200 bg-white text-slate-600",
                  )}
                >
                  {indoorOnly ? "Indoor only" : "Indoor + Outdoor"}
                </button>
              </Field>
            </div>
            <Field label="Additional notes">
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                className={INPUT_CLASS}
              />
            </Field>
          </Card>
        </div>

        <div className="space-y-6">
          <ReferenceCard title="Profile context" profile={currentProfile} />
          <Card title="Generation checklist">
            <ul className="list-disc space-y-2 pl-5 text-xs text-slate-600">
              <li>Profile demographics + contact should be complete.</li>
              <li>Duration & time budget drive cadence and intensity.</li>
              <li>Flags automatically constrain yoga flows and nutrition picks.</li>
              <li>Modules switch on/off entire surfaces (yoga, nutrition, habits).</li>
            </ul>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate plan"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {normalized && response ? (
          <motion.div key={response.planId} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
            <PlanOutput normalized={normalized} raw={response} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <div className="mt-4 space-y-4 text-sm text-slate-600">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

function ReferenceCard({ title, profile }: { title: string; profile?: Profile }) {
  if (!profile) {
    return (
      <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 text-sm text-indigo-700">
        <p className="text-sm font-semibold text-indigo-800">{title}</p>
        <p className="mt-2 text-xs">Select a saved profile to view contact & lifestyle context.</p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 text-sm text-indigo-800">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 space-y-1 text-xs">
        <p>{profile.contact?.email ?? "Email —"}</p>
        <p>{profile.contact?.phone ?? "Phone —"}</p>
        <p>{profile.contact?.location ?? "Location —"}</p>
        <p>{profile.lifestyle?.occupation ?? "Occupation —"}</p>
        <p>{profile.lifestyle?.timeZone ?? "Time zone —"}</p>
        <p>{profile.lifestyle?.activityLevel ? `Activity: ${profile.lifestyle.activityLevel}` : "Activity —"}</p>
        <p>{profile.lifestyle?.primaryGoal ? `Goal: ${profile.lifestyle.primaryGoal}` : "Goal —"}</p>
      </div>
    </div>
  );
}

function PlanOutput({ normalized, raw }: { normalized: NormalizedPlan; raw: PlanResponse }) {
  return (
    <div className="space-y-5 rounded-3xl border border-indigo-100 bg-white p-6 text-sm text-slate-700 shadow-xl">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-indigo-500">Plan ID</p>
          <p className="text-lg font-semibold text-slate-900">{raw.planId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
            Confidence {(raw.confidence ?? 0.65).toFixed(2)}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            {(raw.warnings ?? []).length} warnings
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 text-xs text-slate-600">
        <div>
          <p className="font-semibold text-slate-800">Duration</p>
          <p>{normalized.meta.duration_days} days ({normalized.meta.weeks} weeks)</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">Goals</p>
          <p>{normalized.meta.goals.join(", ") || "—"}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">Flags</p>
          <p>{normalized.meta.flags.join(", ") || "None"}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">Diet</p>
          <p>
            {normalized.meta.dietary.type} ·{" "}
            {normalized.meta.dietary.cuisine_pref || "cuisine —"}
          </p>
          <p>Allergies: {normalized.meta.dietary.allergies.join(", ") || "None"}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">Time budget</p>
          <p>{normalized.meta.time_budget_min_per_day} min/day</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">Notes</p>
          <p>{normalized.meta.notes || "—"}</p>
        </div>
      </div>

      <div className="space-y-4">
        {normalized.weeks.map((week) => (
          <div key={`week-${week.week_index}`} className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Week {week.week_index}: {week.focus}
              </h3>
              <p className="text-xs text-slate-500">{week.progression_note}</p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {week.days.map((day) => (
                <div key={`week-${week.week_index}-day-${day.day_index}`} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700">
                    Day {day.day_index} · {day.theme}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Yoga: {day.yoga.map((y) => `${y.name} (${y.duration_min}m)`).join(", ") || "None"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Breathwork: {day.breath_mindfulness.map((b) => `${b.name} (${b.duration_min}m)`).join(", ") || "None"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Nutrition: {day.nutrition.meals.map((meal) => `${meal.meal}: ${meal.name}`).join(" | ") || "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Hydration: {day.hydration_ml_target} ml</p>
                  <p className="mt-1 text-xs text-slate-500">Sleep: {day.sleep.wind_down_min} min · {day.sleep.tip}</p>
                  {day.habit_tasks.length ? (
                    <p className="mt-1 text-xs text-slate-500">Habits: {day.habit_tasks.join(", ")}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {(raw.warnings ?? []).length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold">Verifier notices</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {(raw.warnings ?? []).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
