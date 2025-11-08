"use client";

import CheckboxDropdown from "@/app/components/ui/CheckboxDropdown";
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
  getDietLabel,
} from "@/lib/lifeengine/planConfig";

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

  return (
    <div className="space-y-8">
      {/* Plan Types Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
        <CheckboxDropdown
          label="Plan Types"
          helper="Select plan types to customize your wellness journey"
          options={planTypeOptions}
          selected={form.planTypes}
          onChange={(values) => setForm((prev) => ({ ...prev, planTypes: values }))}
        />
      </div>

      {/* Core Settings Grid */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          ⚙️ Core Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectField
            label="⏱️ Duration"
            value={form.duration}
            options={durationOptions}
            onChange={(value) => setForm((prev) => ({ ...prev, duration: value }))}
          />
          <SelectField
            label="💪 Intensity"
            value={form.intensity}
            options={intensityOptions}
            onChange={(value) => setForm((prev) => ({ ...prev, intensity: value }))}
          />
          <SelectField
            label="📄 Output Format"
            value={form.format}
            options={formatOptions}
            onChange={(value) => setForm((prev) => ({ ...prev, format: value }))}
          />
          <SelectField
            label="📅 Daily Routine Guidance"
            value={form.includeDailyRoutine}
            options={routineOptions}
            onChange={(value) => setForm((prev) => ({ ...prev, includeDailyRoutine: value }))}
          />
        </div>
      </div>

      {/* Focus Areas */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 shadow-sm">
        <CheckboxDropdown
          label="Focus Areas"
          helper="Select specific areas to emphasize"
          options={FOCUS_AREA_OPTIONS.map((value) => ({ label: value, value }))}
          selected={form.focusAreas}
          onChange={(values) => setForm((prev) => ({ ...prev, focusAreas: values }))}
        />
      </div>

      {/* Goals */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm">
        <CheckboxDropdown
          label="Primary Goals"
          helper="What are you trying to achieve?"
          options={GOAL_OPTIONS.map((value) => ({ label: value, value }))}
          selected={form.goals}
          onChange={(values) => setForm((prev) => ({ ...prev, goals: values }))}
        />
      </div>

      {/* Health Considerations */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200 shadow-sm">
        <CheckboxDropdown
          label="Health Conditions"
          helper="Select any conditions to account for"
          options={CHRONIC_CONDITION_OPTIONS.map((value) => ({ label: value, value }))}
          selected={form.chronicConditions}
          onChange={(values) => setForm((prev) => ({ ...prev, chronicConditions: values }))}
        />
      </div>

      {/* Lifestyle Settings */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🌱 Lifestyle Settings
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectField
            label="🥗 Diet Preference"
            value={form.dietType}
            options={DIET_OPTIONS.map((value) => ({ label: getDietLabel(value), value }))}
            onChange={(value) => setForm((prev) => ({ ...prev, dietType: value }))}
          />

          <SelectField
            label="🏃 Activity Level"
            value={form.activityLevel}
            options={ACTIVITY_LEVEL_OPTIONS.map((value) => ({ label: value, value }))}
            onChange={(value) => setForm((prev) => ({ ...prev, activityLevel: value }))}
          />

          <InputField
            label="😴 Sleep Hours"
            value={form.sleepHours}
            onChange={(value) => setForm((prev) => ({ ...prev, sleepHours: value }))}
            type="number"
            min={0}
            icon="😴"
          />
          <SelectField
            label="😰 Stress Level"
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
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <select
        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800 
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                   transition-all duration-200 cursor-pointer hover:border-gray-400"
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
  icon?: string;
};

function InputField({ label, value, onChange, type = "text", min, max, icon }: InputFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        min={min}
        max={max}
        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                   transition-all duration-200 hover:border-gray-400"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={type === "number" ? `${min}-${max}` : ""}
      />
    </div>
  );
}
