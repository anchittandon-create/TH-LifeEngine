"use client";

import {
  PLAN_TYPE_OPTIONS,
  DURATION_OPTIONS,
  INTENSITY_OPTIONS,
  FORMAT_OPTIONS,
  FOCUS_AREA_OPTIONS,
  ROUTINE_OPTIONS,
  GOAL_OPTIONS,
  DIET_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
  CHRONIC_CONDITION_OPTIONS,
  PlanFormState,
} from "@/lib/lifeengine/planConfig";
import styles from "@/app/lifeengine/create/page.module.css";

type Props = {
  form: PlanFormState;
  setForm: React.Dispatch<React.SetStateAction<PlanFormState>>;
};

export function PlanConfigurator({ form, setForm }: Props) {
  const planTypeOptions = PLAN_TYPE_OPTIONS.map((opt) => ({ ...opt }));
  const durationOptions = DURATION_OPTIONS.map((opt) => ({ ...opt }));
  const intensityOptions = INTENSITY_OPTIONS.map((opt) => ({ ...opt }));
  const formatOptions = FORMAT_OPTIONS.map((opt) => ({ ...opt }));
  const routineOptions = ROUTINE_OPTIONS.map((opt) => ({ ...opt }));
  const toggleValue = (key: keyof PlanFormState, value: string) => {
    setForm((prev) => {
      const current = prev[key] as string[];
      const exists = current.includes(value);
      const next = exists
        ? current.filter((val) => val !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  return (
    <div className="space-y-6">
      <CheckboxGroup
        label="Plan Types"
        helper="Select any number of plan types to generate simultaneously"
        options={planTypeOptions}
        selected={form.planTypes}
        onToggle={(val) => toggleValue("planTypes", val)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Duration"
          value={form.duration}
          options={durationOptions}
          onChange={(value) => setForm((prev) => ({ ...prev, duration: value }))}
        />
        <SelectField
          label="Intensity"
          value={form.intensity}
          options={intensityOptions}
          onChange={(value) => setForm((prev) => ({ ...prev, intensity: value }))}
        />
        <SelectField
          label="Output Format"
          value={form.format}
          options={formatOptions}
          onChange={(value) => setForm((prev) => ({ ...prev, format: value }))}
        />
        <SelectField
          label="Daily Routine Guidance"
          value={form.includeDailyRoutine}
          options={routineOptions}
          onChange={(value) => setForm((prev) => ({ ...prev, includeDailyRoutine: value }))}
        />
      </div>

      <CheckboxGroup
        label="Focus Areas"
        helper="Select any number of areas to emphasize"
        options={FOCUS_AREA_OPTIONS.map((value) => ({ label: value, value }))}
        selected={form.focusAreas}
        onToggle={(val) => toggleValue("focusAreas", val)}
      />

      <CheckboxGroup
        label="Goals"
        helper="Select any number of primary goals"
        options={GOAL_OPTIONS.map((value) => ({ label: value, value }))}
        selected={form.goals}
        onToggle={(val) => toggleValue("goals", val)}
      />

      <CheckboxGroup
        label="Chronic Conditions"
        helper="Select conditions to factor in"
        options={CHRONIC_CONDITION_OPTIONS.map((value) => ({ label: value, value }))}
        selected={form.chronicConditions}
        onToggle={(val) => toggleValue("chronicConditions", val)}
      />

      <SelectField
        label="Diet Preference"
        value={form.dietType}
        options={DIET_OPTIONS.map((value) => ({ label: value.replace("_", " "), value }))}
        onChange={(value) => setForm((prev) => ({ ...prev, dietType: value }))}
      />

      <SelectField
        label="Activity Level"
        value={form.activityLevel}
        options={ACTIVITY_LEVEL_OPTIONS.map((value) => ({ label: value, value }))}
        onChange={(value) => setForm((prev) => ({ ...prev, activityLevel: value }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Sleep Hours"
          value={form.sleepHours}
          onChange={(value) => setForm((prev) => ({ ...prev, sleepHours: value }))}
          type="number"
        />
        <SelectField
          label="Stress Level"
          value={form.stressLevel}
          options={[
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
          ]}
          onChange={(value) => setForm((prev) => ({ ...prev, stressLevel: value }))}
        />
      </div>
    </div>
  );
}

type CheckboxGroupProps = {
  label: string;
  helper?: string;
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
};

function CheckboxGroup({ label, helper, options, selected, onToggle }: CheckboxGroupProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1">{label}</label>
      {helper && <p className="text-xs text-gray-500 mb-2">{helper}</p>}
      <div className={styles.checkboxList}>
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label key={option.value} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.value)}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
};

function InputField({ label, value, onChange, type = "text", min, max }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        min={min}
        max={max}
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
