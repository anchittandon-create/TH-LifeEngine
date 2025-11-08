"use client";

import { useState } from "react";
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
  defaultPlanFormState,
  getDietLabel,
} from "@/lib/lifeengine/planConfig";

export type PlanFormData = PlanFormState & {
  fullName: string;
  age: number;
  gender: string;
  workSchedule: string;
  preferredTime: string;
};

export const defaultPlanFormData: PlanFormData = {
  fullName: "",
  age: 30,
  gender: "other",
  workSchedule: "9_to_5",
  preferredTime: "morning",
  ...defaultPlanFormState,
  planTypes: [],
  duration: DURATION_OPTIONS[2].value,
  intensity: INTENSITY_OPTIONS[1].value,
  focusAreas: [],
  goals: [],
  chronicConditions: [],
  dietType: DIET_OPTIONS[0],
  activityLevel: ACTIVITY_LEVEL_OPTIONS[2],
  sleepHours: "7",
  stressLevel: "medium",
};

type Props = {
  formData: PlanFormData;
  setFormData: React.Dispatch<React.SetStateAction<PlanFormData>>;
  errors?: Record<string, string>;
};

export function PlanForm({ formData, setFormData, errors = {} }: Props) {
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  
  const allErrors = { ...localErrors, ...errors };

  const validateField = (field: string, value: any) => {
    const newErrors = { ...localErrors };
    
    switch (field) {
      case "fullName":
        if (!value || value.trim().length < 2) {
          newErrors.fullName = "Name must be at least 2 characters";
        } else {
          delete newErrors.fullName;
        }
        break;
      case "age":
        if (value < 10 || value > 100) {
          newErrors.age = "Age must be between 10 and 100";
        } else {
          delete newErrors.age;
        }
        break;
      case "planTypes":
        if (!value || value.length === 0) {
          newErrors.planTypes = "Please select at least one plan type";
        } else {
          delete newErrors.planTypes;
        }
        break;
    }
    
    setLocalErrors(newErrors);
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  return (
    <div className="space-y-8">
      {/* Personal Information Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">👤</span>
          <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              onBlur={() => validateField("fullName", formData.fullName)}
              className={`w-full border-2 ${
                allErrors.fullName ? "border-red-400" : "border-gray-300"
              } rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 hover:border-gray-400`}
              placeholder="Enter your full name"
            />
            {allErrors.fullName && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {allErrors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={10}
              max={100}
              value={formData.age}
              onChange={(e) => updateField("age", parseInt(e.target.value) || 0)}
              onBlur={() => validateField("age", formData.age)}
              className={`w-full border-2 ${
                allErrors.age ? "border-red-400" : "border-gray-300"
              } rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 hover:border-gray-400`}
              placeholder="25"
            />
            {allErrors.age && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <span>⚠️</span> {allErrors.age}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => updateField("gender", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 cursor-pointer hover:border-gray-400"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other/Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Work Schedule
            </label>
            <select
              value={formData.workSchedule}
              onChange={(e) => updateField("workSchedule", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 cursor-pointer hover:border-gray-400"
            >
              <option value="9_to_5">9 AM - 5 PM (Standard)</option>
              <option value="flexible">Flexible Hours</option>
              <option value="night_shift">Night Shift</option>
              <option value="rotating">Rotating Shifts</option>
              <option value="part_time">Part Time</option>
              <option value="student">Student Schedule</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Preferred Time for Wellness
            </label>
            <select
              value={formData.preferredTime}
              onChange={(e) => updateField("preferredTime", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 cursor-pointer hover:border-gray-400"
            >
              <option value="morning">Morning (6-9 AM)</option>
              <option value="late_morning">Late Morning (9-12 PM)</option>
              <option value="afternoon">Afternoon (12-3 PM)</option>
              <option value="evening">Evening (6-9 PM)</option>
              <option value="night">Night (9 PM+)</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>
      </section>

      {/* Plan Types Section */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🎯</span>
          <h2 className="text-xl font-bold text-gray-800">Plan Types</h2>
        </div>
        <CheckboxDropdown
          label="Select Plan Types"
          helper="Choose one or more types to customize your wellness journey"
          options={PLAN_TYPE_OPTIONS.map((opt) => ({ ...opt }))}
          selected={formData.planTypes}
          onChange={(values) => {
            updateField("planTypes", values);
          }}
        />
        {allErrors.planTypes && (
          <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
            <span>⚠️</span> {allErrors.planTypes}
          </p>
        )}
      </section>

      {/* Health Profile Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🏥</span>
          <h2 className="text-xl font-bold text-gray-800">Health Profile</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🥗 Diet Preference
            </label>
            <select
              value={formData.dietType}
              onChange={(e) => updateField("dietType", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 cursor-pointer hover:border-gray-400"
            >
              {DIET_OPTIONS.map((diet) => (
                <option key={diet} value={diet}>
                  {getDietLabel(diet)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏃 Activity Level
            </label>
            <select
              value={formData.activityLevel}
              onChange={(e) => updateField("activityLevel", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 cursor-pointer hover:border-gray-400"
            >
              {ACTIVITY_LEVEL_OPTIONS.map((level) => (
                <option key={level} value={level}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              😴 Sleep Hours (per night)
            </label>
            <input
              type="number"
              min={4}
              max={12}
              step={0.5}
              value={formData.sleepHours}
              onChange={(e) => updateField("sleepHours", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 hover:border-gray-400"
              placeholder="7"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              😰 Stress Level
            </label>
            <select
              value={formData.stressLevel}
              onChange={(e) => updateField("stressLevel", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 cursor-pointer hover:border-gray-400"
            >
              <option value="low">Low - Mostly relaxed</option>
              <option value="medium">Medium - Some stress</option>
              <option value="high">High - Significant stress</option>
            </select>
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="mt-6">
          <CheckboxDropdown
            label="Chronic Health Conditions"
            helper="Select any conditions we should account for"
            options={CHRONIC_CONDITION_OPTIONS.map((value) => ({ label: value, value }))}
            selected={formData.chronicConditions}
            onChange={(values) => updateField("chronicConditions", values)}
          />
        </div>
      </section>

      {/* Goals & Focus Areas Section */}
      <section className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🎖️</span>
          <h2 className="text-xl font-bold text-gray-800">Fitness Goals & Focus Areas</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <CheckboxDropdown
              label="Primary Fitness Goals"
              helper="What are you trying to achieve?"
              options={GOAL_OPTIONS.map((value) => ({ label: value, value }))}
              selected={formData.goals}
              onChange={(values) => updateField("goals", values)}
            />
          </div>

          <div>
            <CheckboxDropdown
              label="Focus Areas"
              helper="Specific areas to emphasize"
              options={FOCUS_AREA_OPTIONS.map((value) => ({ label: value, value }))}
              selected={formData.focusAreas}
              onChange={(values) => updateField("focusAreas", values)}
            />
          </div>
        </div>
      </section>

      {/* Plan Settings Section */}
      <section className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">⚙️</span>
          <h2 className="text-xl font-bold text-gray-800">Plan Settings</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ⏱️ Plan Duration <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 cursor-pointer hover:border-gray-400"
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💪 Intensity Level
            </label>
            <select
              value={formData.intensity}
              onChange={(e) => updateField("intensity", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 cursor-pointer hover:border-gray-400"
            >
              {INTENSITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📄 Output Format
            </label>
            <select
              value={formData.format}
              onChange={(e) => updateField("format", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 cursor-pointer hover:border-gray-400"
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📅 Daily Routine Guidance
            </label>
            <select
              value={formData.includeDailyRoutine}
              onChange={(e) => updateField("includeDailyRoutine", e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-800
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
                         transition-all duration-200 cursor-pointer hover:border-gray-400"
            >
              {ROUTINE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}

// Validation function
export function validatePlanFormData(formData: PlanFormData): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (!formData.fullName || formData.fullName.trim().length < 2) {
    errors.fullName = "Name must be at least 2 characters";
  }
  
  if (formData.age < 10 || formData.age > 100) {
    errors.age = "Age must be between 10 and 100";
  }
  
  if (!formData.planTypes || formData.planTypes.length === 0) {
    errors.planTypes = "Please select at least one plan type";
  }
  
  if (!formData.gender) {
    errors.gender = "Please select a gender";
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
