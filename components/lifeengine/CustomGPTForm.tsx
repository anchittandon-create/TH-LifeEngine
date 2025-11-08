"use client";

import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { PlanConfigurator } from "./PlanConfigurator";
import type { PlanFormState } from "@/lib/lifeengine/planConfig";
import type { Profile } from "@/lib/ai/schemas";
import styles from "@/app/lifeengine/create/page.module.css";

type Props = {
  profiles: Profile[];
  selectedProfileId: string;
  onProfileChange: (value: string) => void;
  form: PlanFormState;
  setForm: React.Dispatch<React.SetStateAction<PlanFormState>>;
  children?: React.ReactNode;
};

export function CustomGPTForm({
  profiles,
  selectedProfileId,
  onProfileChange,
  form,
  setForm,
  children,
}: Props) {
  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Select Profile</h2>
        <Field label="Choose Profile" required>
          <Select value={selectedProfileId} onChange={(e) => onProfileChange(e.target.value)}>
            <option value="">Select a profile</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.age}y, {profile.gender})
              </option>
            ))}
          </Select>
        </Field>
        {profiles.length === 0 && (
          <div className={styles.noProfiles}>
            <p>No profiles found. Please create a profile first.</p>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Plan Configuration</h2>
        <PlanConfigurator form={form} setForm={setForm} />
      </section>

      {children}
    </>
  );
}
