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
    <div className="space-y-8">
      {/* Plan Types Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 shadow-sm">
        <CheckboxGroup
          label="🎯 Plan Types"
          helper="Select one or more plan types to customize your wellness journey"
          options={planTypeOptions}
          selected={form.planTypes}
          onToggle={(val) => toggleValue("planTypes", val)}
          icon="🎯"
        />
      </div>

      {/* Core Settings Grid */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          ⚙️ Core Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <CheckboxGroup
          label="🎨 Focus Areas"
          helper="Select specific areas to emphasize in your plan"
          options={FOCUS_AREA_OPTIONS.map((value) => ({ label: value, value }))}
          selected={form.focusAreas}
          onToggle={(val) => toggleValue("focusAreas", val)}
          icon="🎨"
        />
      </div>

      {/* Goals */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 shadow-sm">
        <CheckboxGroup
          label="🎖️ Primary Goals"
          helper="What are you trying to achieve?"
          options={GOAL_OPTIONS.map((value) => ({ label: value, value }))}
          selected={form.goals}
          onToggle={(val) => toggleValue("goals", val)}
          icon="🎖️"
        />
      </div>

      {/* Health Considerations */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200 shadow-sm">
        <CheckboxGroup
          label="🏥 Health Conditions"
          helper="Select any conditions to account for in your plan"
          options={CHRONIC_CONDITION_OPTIONS.map((value) => ({ label: value, value }))}
          selected={form.chronicConditions}
          onToggle={(val) => toggleValue("chronicConditions", val)}
          icon="🏥"
        />
      </div>

      {/* Lifestyle Settings */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🌱 Lifestyle Settings
        </h3>
        <div className="space-y-4">
          <SelectField
            label="🥗 Diet Preference"
            value={form.dietType}
            options={DIET_OPTIONS.map((value) => ({ label: value.replace("_", " "), value }))}
            onChange={(value) => setForm((prev) => ({ ...prev, dietType: value }))}
          />

          <SelectField
            label="🏃 Activity Level"
            value={form.activityLevel}
            options={ACTIVITY_LEVEL_OPTIONS.map((value) => ({ label: value, value }))}
            onChange={(value) => setForm((prev) => ({ ...prev, activityLevel: value }))}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <InputField
              label="😴 Sleep Hours"
              value={form.sleepHours}
              onChange={(value) => setForm((prev) => ({ ...prev, sleepHours: value }))}
              type="number"
              min={4}
              max={12}
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
    </div>
  );
}

type CheckboxGroupProps = {
  label: string;
  helper?: string;
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  icon?: string;
};

function CheckboxGroup({ label, helper, options, selected, onToggle, icon }: CheckboxGroupProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {label}
        </label>
        {selected.length > 0 && (
          <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-sm">
            {selected.length} selected
          </span>
        )}
      </div>
      {helper && <p className="text-sm text-gray-600 mb-4">{helper}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option) => {
          const checked = selected.includes(option.value);
          return (
            <label
              key={option.value}
              className={`
                flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer
                transition-all duration-200 ease-in-out
                ${
                  checked
                    ? "bg-blue-100 border-blue-500 shadow-md scale-[1.02]"
                    : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }
              `}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.value)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              <span
                className={`text-sm ${
                  checked ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                }`}
              >
                {option.label}
              </span>
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

