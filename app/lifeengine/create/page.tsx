"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Create.module.css";
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
} from "@/components/ui/Form";
import type { Profile } from "@/lib/domain/profile";
import type { Plan } from "@/lib/domain/plan";
import type { Intake } from "@/lib/domain/intake";
import { getProfiles, savePlanRecord, StoredPlan } from "@/lib/utils/store";
import { createId } from "@/lib/utils/ids";

const DRAFT_KEY = "th_lifeengine_create_draft";

const durationUnits: Intake["duration"]["unit"][] = [
  "days",
  "weeks",
  "months",
  "years",
];

const experienceLevels: Intake["experience_level"][] = [
  "beginner",
  "intermediate",
  "advanced",
];

const equipmentOptions = [
  { key: "mat", label: "Yoga mat" },
  { key: "blocks", label: "Blocks" },
  { key: "strap", label: "Strap" },
  { key: "weights", label: "Light weights" },
  { key: "chair", label: "Chair" },
] as const;

function parseList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function loadDraft(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDraft(payload: any) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
}

function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

type GenerateResponse = {
  planId: string;
  plan: Plan;
  warnings: string[];
  analytics: Plan["analytics"];
};

export default function CreatePlanPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [goalsInput, setGoalsInput] = useState("weight optimisation, gut health");
  const [timeBudget, setTimeBudget] = useState(40);
  const [durationUnit, setDurationUnit] = useState<Intake["duration"]["unit"]>("weeks");
  const [durationValue, setDurationValue] = useState(8);
  const [experience, setExperience] = useState<Intake["experience_level"]>("intermediate");
  const [equipment, setEquipment] = useState<Record<string, boolean>>({ mat: true });
  const [overrideDietType, setOverrideDietType] = useState<string>("");
  const [overrideAllergies, setOverrideAllergies] = useState<string>("");
  const [overrideFlags, setOverrideFlags] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const planFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfiles(getProfiles());
    const draft = loadDraft();
    if (draft) {
      setSelectedProfileId(draft.selectedProfileId ?? "");
      setGoalsInput(draft.goalsInput ?? goalsInput);
      setTimeBudget(draft.timeBudget ?? timeBudget);
      setDurationUnit(draft.durationUnit ?? durationUnit);
      setDurationValue(draft.durationValue ?? durationValue);
      setExperience(draft.experience ?? experience);
      setEquipment(draft.equipment ?? { mat: true });
      setOverrideDietType(draft.overrideDietType ?? "");
      setOverrideAllergies(draft.overrideAllergies ?? "");
      setOverrideFlags(draft.overrideFlags ?? "");
      setNotes(draft.notes ?? "");
    }
  }, []);

  useEffect(() => {
    saveDraft({
      selectedProfileId,
      goalsInput,
      timeBudget,
      durationUnit,
      durationValue,
      experience,
      equipment,
      overrideDietType,
      overrideAllergies,
      overrideFlags,
      notes,
    });
  }, [
    selectedProfileId,
    goalsInput,
    timeBudget,
    durationUnit,
    durationValue,
    experience,
    equipment,
    overrideDietType,
    overrideAllergies,
    overrideFlags,
    notes,
  ]);

  useEffect(() => {
    const profile = profiles.find((p) => p.id === selectedProfileId);
    if (profile) {
      setOverrideDietType(profile.dietary?.type || "");
      setOverrideAllergies(profile.dietary?.allergies?.join(", ") || "");
      setOverrideFlags(profile.medicalConditions?.join(", ") || "");
    }
  }, [profiles, selectedProfileId]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId]
  );

  const goalsList = useMemo(() => parseList(goalsInput), [goalsInput]);

  const equipmentPayload = useMemo(() => {
    const payload: Intake["equipment"] = {};
    equipmentOptions.forEach(({ key }) => {
      if (equipment[key]) {
        payload[key] = true;
      }
    });
    return payload;
  }, [equipment]);

  const planReady = Boolean(selectedProfile);

  const handleGeneratePlan = async () => {
    if (!selectedProfile) {
      setError("Select a profile first");
      return;
    }
    setLoading(true);
    setError(null);

    const profileSnapshot: Profile = {
      ...selectedProfile,
      medicalConditions: parseList(overrideFlags).length
        ? parseList(overrideFlags)
        : selectedProfile.medicalConditions,
      dietary: {
        ...selectedProfile.dietary,
        type: overrideDietType || selectedProfile.dietary?.type,
        allergies: parseList(overrideAllergies).length
          ? parseList(overrideAllergies)
          : selectedProfile.dietary?.allergies,
      },
    };

    const intake: Intake = {
      profileId: selectedProfile.id,
      profileSnapshot,
      goals: goalsList.map((name, index) => ({ name, priority: index + 1 })),
      duration: { unit: durationUnit, value: durationValue },
      time_budget_min_per_day: timeBudget,
      experience_level: experience,
      equipment: equipmentPayload,
    };

    try {
      const response = await fetch("/api/lifeengine/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake, notes }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed (${response.status})`);
      }
      const data = (await response.json()) as GenerateResponse;
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocal = () => {
    if (!result || !selectedProfile) return;
    const record: StoredPlan = {
      id: result.planId,
      plan: result.plan,
      profileId: selectedProfile.id,
      warnings: result.warnings,
      analytics: result.analytics,
      createdAt: Date.now(),
    };
    const stored = savePlanRecord(record);
    console.log("Stored plans", stored.length);
  };

  const handleExportPlan = () => {
    if (!result) return;
    const payload = JSON.stringify(result, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `th_plan_${result.planId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPlan = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as GenerateResponse;
      if (parsed.plan && parsed.planId) {
        setResult(parsed);
        const record: StoredPlan = {
          id: parsed.planId,
          plan: parsed.plan,
          profileId: selectedProfileId || "unknown",
          warnings: parsed.warnings ?? [],
          analytics: parsed.analytics,
          createdAt: Date.now(),
        };
        savePlanRecord(record);
      }
    } catch (error) {
      setError("Invalid plan JSON");
    } finally {
      event.target.value = "";
    }
  };

  const handleClearDraft = () => {
    clearDraft();
    setGoalsInput("weight optimisation, gut health");
    setTimeBudget(40);
    setDurationUnit("weeks");
    setDurationValue(8);
    setExperience("intermediate");
    setEquipment({ mat: true });
    setOverrideDietType("");
    setOverrideAllergies("");
    setOverrideFlags("");
    setNotes("");
  };

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <h1 className={styles.sectionTitle}>Create Plan</h1>
        <div className={styles.stepBadges}>
          <span className={styles.badge}>Step 1 · Profile</span>
          <span className={styles.badge}>Step 2 · Inputs</span>
          <span className={styles.badge}>Step 3 · Review &amp; Generate</span>
        </div>

        <Form
          onSubmit={(event) => {
            event.preventDefault();
            handleGeneratePlan();
          }}
        >
          <Field>
            <Label>Select Profile</Label>
            <Select
              required
              value={selectedProfileId}
              onChange={(event) => setSelectedProfileId(event.target.value)}
            >
              <option value="">Choose profile</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.gender}, {profile.age})
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label>Goals (comma separated)</Label>
            <Input
              value={goalsInput}
              onChange={(event) => setGoalsInput(event.target.value)}
              placeholder="weight optimisation, stress resilience"
            />
            <HelpText>{goalsList.join(" · ")}</HelpText>
          </Field>

          <Field>
            <Label>Duration</Label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Select
                value={durationUnit}
                onChange={(event) =>
                  setDurationUnit(event.target.value as Intake["duration"]["unit"])
                }
              >
                {durationUnits.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min={1}
                value={durationValue}
                onChange={(event) => setDurationValue(Number(event.target.value))}
              />
            </div>
          </Field>

          <Field>
            <Label>Daily Time Budget (minutes)</Label>
            <Input
              type="number"
              min={10}
              max={240}
              value={timeBudget}
              onChange={(event) => setTimeBudget(Number(event.target.value))}
            />
          </Field>

          <Field>
            <Label>Experience Level</Label>
            <Select
              value={experience}
              onChange={(event) =>
                setExperience(event.target.value as Intake["experience_level"])
              }
            >
              {experienceLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </Field>

          <Field>
            <Label>Equipment Available</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {equipmentOptions.map(({ key, label }) => (
                <label key={key} style={{ fontSize: "0.85rem" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(equipment[key])}
                    onChange={(event) =>
                      setEquipment((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))
                    }
                  />
                  &nbsp;{label}
                </label>
              ))}
            </div>
          </Field>

          <Field>
            <Label>Override Diet Type (optional)</Label>
            <Input
              value={overrideDietType}
              onChange={(event) =>
                setOverrideDietType(event.target.value)
              }
              placeholder="veg"
            />
          </Field>

          <Field>
            <Label>Override Allergies</Label>
            <Input
              value={overrideAllergies}
              onChange={(event) => setOverrideAllergies(event.target.value)}
              placeholder="lactose, peanut"
            />
          </Field>

          <Field>
            <Label>Additional Flags</Label>
            <Input
              value={overrideFlags}
              onChange={(event) => setOverrideFlags(event.target.value)}
              placeholder="pcod"
            />
          </Field>

          <Field>
            <Label>Additional Notes for AI (optional)</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Focus on morning slots for yoga and evening for wind-down."
            />
          </Field>

          <Actions>
            <Button
              type="submit"
              disabled={!planReady || loading}
              variant="primary"
            >
              {loading ? "Generating…" : "Create Plan"}
            </Button>
            <Button type="button" variant="secondary" onClick={handleClearDraft}>
              Clear Draft
            </Button>
          </Actions>
        </Form>
        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.sectionTitle}>Plan Output</h2>
        {result ? (
          <div className={styles.planOutput}>
            <div className={styles.analyticsRow}>
              <span className={styles.analyticsPill}>
                Overall {Math.round(result.analytics.overall * 100) / 100}
              </span>
              <span className={styles.analyticsPill}>
                Safety {result.analytics.safety_score}
              </span>
              <span className={styles.analyticsPill}>
                Progression {result.analytics.progression_score}
              </span>
            </div>
            {result.warnings.length > 0 && (
              <div className={styles.warningList}>
                <strong>Warnings</strong>
                <ul>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <pre className={styles.jsonBlock}>
{JSON.stringify(result.plan, null, 2)}
            </pre>
            <div className={styles.controlRow}>
              <Button type="button" variant="primary" onClick={handleSaveLocal}>
                Save Locally
              </Button>
              <Button type="button" variant="secondary" onClick={handleExportPlan}>
                Export JSON
              </Button>
              <label className={styles.buttonGhost} style={{ cursor: "pointer" }}>
                Import JSON
                <input
                  ref={planFileRef}
                  type="file"
                  accept="application/json"
                  style={{ display: "none" }}
                  onChange={handleImportPlan}
                />
              </label>
            </div>
          </div>
        ) : (
          <p style={{ color: "#475569" }}>
            Configure inputs and generate a plan. Output appears here along with analytics and warnings.
          </p>
        )}
      </section>
    </div>
  );
}
