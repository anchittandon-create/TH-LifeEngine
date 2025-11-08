"use client";

import React, { useState } from "react";
import type { LifeEnginePlan } from "@/app/types/lifeengine";

interface PlanPreviewProps {
  plan: LifeEnginePlan | null;
}

type TabType = "yoga" | "exercises" | "diet" | "holistic";

export default function PlanPreview({ plan }: PlanPreviewProps) {
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, TabType>>({});

  if (!plan) return null;

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  const toggleDay = (dayKey: string) => {
    setExpandedDays((prev) => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  const setTab = (dayKey: string, tab: TabType) => {
    setActiveTabs((prev) => ({ ...prev, [dayKey]: tab }));
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-3xl">👟</span>
          <h2 className="text-2xl font-bold text-gray-800">
            {plan.motivation ?? "Your Personalized Plan"}
          </h2>
        </div>
        {plan.category_tag && (
          <div className="inline-block px-3 py-1 bg-white rounded-full text-sm font-semibold text-purple-600 mb-3">
            {plan.category_tag}
          </div>
        )}
        <p className="text-gray-700 leading-relaxed">{plan.summary}</p>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">📅 Weekly Schedule</h3>
        {days.map((dayKey) => {
          const dayPlan = plan.weekly_schedule[dayKey];
          if (!dayPlan) return null;

          const isExpanded = expandedDays[dayKey];
          const activeTab = activeTabs[dayKey] || "yoga";

          // Determine which tabs are available
          const availableTabs: TabType[] = [];
          if (dayPlan.yoga) availableTabs.push("yoga");
          if (dayPlan.exercises && dayPlan.exercises.length > 0)
            availableTabs.push("exercises");
          if (dayPlan.diet) availableTabs.push("diet");
          if (dayPlan.holistic) availableTabs.push("holistic");

          return (
            <div
              key={dayKey}
              className="rounded-2xl shadow-md border border-gray-200 bg-white overflow-hidden"
            >
              {/* Day Header - Clickable Accordion */}
              <button
                onClick={() => toggleDay(dayKey)}
                className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {dayKey === "monday" && "🌟"}
                    {dayKey === "tuesday" && "💪"}
                    {dayKey === "wednesday" && "🧘"}
                    {dayKey === "thursday" && "�"}
                    {dayKey === "friday" && "✨"}
                    {dayKey === "saturday" && "�"}
                    {dayKey === "sunday" && "🌸"}
                  </span>
                  <span className="font-bold text-lg capitalize text-purple-700">
                    {dayKey}
                  </span>
                </div>
                <span className="text-xl text-gray-600">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="p-5">
                  {/* Tabs */}
                  {availableTabs.length > 1 && (
                    <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
                      {availableTabs.map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setTab(dayKey, tab)}
                          className={`px-4 py-2 rounded-t-lg font-semibold text-sm transition-colors ${
                            activeTab === tab
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {tab === "yoga" && "🧘‍♀️ Yoga"}
                          {tab === "exercises" && "🏋️ Exercises"}
                          {tab === "diet" && "🥗 Meals"}
                          {tab === "holistic" && "🌟 Wellness"}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Tab Content */}
                  <div className="space-y-4">
                    {activeTab === "yoga" && dayPlan.yoga && (
                      <YogaSection yoga={dayPlan.yoga} />
                    )}
                    {activeTab === "exercises" &&
                      dayPlan.exercises &&
                      dayPlan.exercises.length > 0 && (
                        <ExercisesSection exercises={dayPlan.exercises} />
                      )}
                    {activeTab === "diet" && dayPlan.diet && (
                      <DietSection diet={dayPlan.diet} />
                    )}
                    {activeTab === "holistic" && dayPlan.holistic && (
                      <HolisticSection holistic={dayPlan.holistic} />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-5 shadow-sm">
          <div className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <span>💧</span> Hydration Goals
          </div>
          <p className="text-gray-700">{plan.hydration_goals}</p>
        </div>

        <div className="bg-pink-50 rounded-xl p-5 shadow-sm">
          <div className="font-semibold text-pink-800 mb-2 flex items-center gap-2">
            <span>🔄</span> Recovery Tips
          </div>
          <ul className="text-gray-700 text-sm space-y-1">
            {plan.recovery_tips.map((tip, i) => (
              <li key={i}>• {tip}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      {plan.disclaimer && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div>
              <span className="font-semibold text-yellow-800">
                Important Notice:
              </span>
              <p className="text-gray-700 mt-1">{plan.disclaimer}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 border-t pt-4">
        <div className="flex flex-wrap gap-4">
          <span>
            Generated by: <strong>{plan.metadata.generated_by}</strong>
          </span>
          <span>
            Plan type:{" "}
            <strong>{plan.metadata.plan_type.join(", ")}</strong>
          </span>
          <span>
            Language: <strong>{plan.metadata.language}</strong>
          </span>
          <span>
            Created:{" "}
            <strong>
              {new Date(plan.metadata.timestamp).toLocaleString()}
            </strong>
          </span>
          {plan.metadata.profile_id && (
            <span>
              Profile ID: <strong>{plan.metadata.profile_id}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== Section Components ==========

function YogaSection({ yoga }: { yoga: any }) {
  return (
    <div className="p-4 bg-purple-50 rounded-xl">
      <div className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
        <span>🧘‍♀️</span> Yoga Session
      </div>

      {/* Warmup & Cooldown */}
      <div className="text-sm text-gray-700 mb-3 flex gap-4">
        <span className="font-medium">
          ⏱️ Warmup: {yoga.warmup_min ?? 0} min
        </span>
        <span className="font-medium">
          ⏱️ Cooldown: {yoga.cooldown_min ?? 0} min
        </span>
      </div>

      {/* Focus Area */}
      {yoga.focus_area && (
        <div className="text-sm text-purple-700 mb-3 p-2 bg-white rounded-lg">
          <span className="font-medium">🎯 Focus:</span> {yoga.focus_area}
        </div>
      )}

      {/* Yoga Poses */}
      {yoga.sequence && yoga.sequence.length > 0 && (
        <div className="space-y-3 mb-3">
          {yoga.sequence.map((pose: any, i: number) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-gray-800 text-base">
                  {pose.name}
                </h4>
                <span className="text-purple-600 font-semibold text-sm">
                  {pose.duration_min} min
                </span>
              </div>

              {/* Benefits */}
              {pose.benefits && (
                <div className="text-sm text-green-700 mb-2 p-2 bg-green-50 rounded">
                  <span className="font-medium">✨ Benefits:</span>{" "}
                  {pose.benefits}
                </div>
              )}

              {/* Step-by-step Instructions */}
              {pose.steps && pose.steps.length > 0 && (
                <div className="mb-2">
                  <div className="font-medium text-sm text-gray-700 mb-1">
                    📋 How to Perform:
                  </div>
                  <ol className="space-y-1 text-sm text-gray-700">
                    {pose.steps.map((step: string, idx: number) => (
                      <li key={idx} className="pl-2">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Breathing Instructions */}
              {pose.breathing_instructions && (
                <div className="text-sm text-blue-700 mb-2 p-2 bg-blue-50 rounded">
                  <span className="font-medium">🌬️ Breathing:</span>{" "}
                  {pose.breathing_instructions}
                </div>
              )}

              {/* Modifications */}
              {pose.modifications && (
                <div className="text-xs text-gray-600 mb-2">
                  <span className="font-medium">💡 Modifications:</span>{" "}
                  {pose.modifications}
                </div>
              )}

              {/* Common Mistakes */}
              {pose.common_mistakes && pose.common_mistakes.length > 0 && (
                <div className="text-xs text-red-600 p-2 bg-red-50 rounded">
                  <span className="font-medium">⚠️ Avoid:</span>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    {pose.common_mistakes.map((mistake: string, idx: number) => (
                      <li key={idx}>{mistake}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Focus */}
              {pose.focus && (
                <div className="text-xs text-gray-600 mt-2">
                  <span className="font-medium">🎯 Focus:</span> {pose.focus}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Breathwork */}
      {yoga.breathwork && (
        <div className="text-sm text-gray-700 mb-2 p-3 bg-white rounded-lg">
          <span className="font-medium">🌬️ Breathwork Practice:</span>{" "}
          {yoga.breathwork}
        </div>
      )}

      {/* Journal Prompt */}
      {yoga.journal_prompt && (
        <div className="text-sm text-gray-700 p-3 bg-white rounded-lg">
          <span className="font-medium">📝 Journal Prompt:</span>{" "}
          {yoga.journal_prompt}
        </div>
      )}
    </div>
  );
}

function ExercisesSection({ exercises }: { exercises: any[] }) {
  return (
    <div className="p-4 bg-orange-50 rounded-xl">
      <div className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
        <span>🏋️</span> Fitness Exercises
      </div>

      <div className="space-y-3">
        {exercises.map((exercise, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-bold text-gray-800 text-base">
                  {exercise.name}
                </h4>
                {exercise.type && (
                  <span className="text-xs text-orange-600 font-semibold uppercase">
                    {exercise.type}
                  </span>
                )}
              </div>
              {exercise.duration_min && (
                <span className="text-orange-600 font-semibold text-sm">
                  {exercise.duration_min} min
                </span>
              )}
            </div>

            {/* Sets, Reps, Rest */}
            {(exercise.sets || exercise.reps || exercise.rest_period) && (
              <div className="flex gap-4 mb-2 text-sm text-gray-700 font-medium">
                {exercise.sets && <span>🔢 {exercise.sets} sets</span>}
                {exercise.reps && <span>⚡ {exercise.reps} reps</span>}
                {exercise.rest_period && <span>⏸️ Rest: {exercise.rest_period}</span>}
              </div>
            )}

            {/* Description */}
            {exercise.description && (
              <p className="text-sm text-gray-700 mb-2">{exercise.description}</p>
            )}

            {/* Step-by-step Instructions */}
            {exercise.steps && exercise.steps.length > 0 && (
              <div className="mb-2">
                <div className="font-medium text-sm text-gray-700 mb-1">
                  📋 Movement Instructions:
                </div>
                <ol className="space-y-1 text-sm text-gray-700">
                  {exercise.steps.map((step: string, idx: number) => (
                    <li key={idx} className="pl-2">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Form Cues */}
            {exercise.form_cues && exercise.form_cues.length > 0 && (
              <div className="text-sm text-blue-700 mb-2 p-2 bg-blue-50 rounded">
                <span className="font-medium">✅ Form Cues:</span>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  {exercise.form_cues.map((cue: string, idx: number) => (
                    <li key={idx}>{cue}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Mistakes */}
            {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
              <div className="text-sm text-red-700 mb-2 p-2 bg-red-50 rounded">
                <span className="font-medium">⚠️ Common Mistakes to Avoid:</span>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  {exercise.common_mistakes.map((mistake: string, idx: number) => (
                    <li key={idx}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Progressions & Regressions */}
            <div className="flex gap-2">
              {exercise.progressions && (
                <div className="text-xs text-green-600 flex-1 p-2 bg-green-50 rounded">
                  <span className="font-medium">⬆️ Progress:</span>{" "}
                  {exercise.progressions}
                </div>
              )}
              {exercise.regressions && (
                <div className="text-xs text-yellow-600 flex-1 p-2 bg-yellow-50 rounded">
                  <span className="font-medium">⬇️ Regress:</span>{" "}
                  {exercise.regressions}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DietSection({ diet }: { diet: any }) {
  return (
    <div className="p-4 bg-green-50 rounded-xl">
      <div className="font-semibold text-green-800 mb-3 flex items-center gap-2">
        <span>🥗</span> Nutrition Plan
      </div>

      <div className="space-y-3">
        {["breakfast", "lunch", "dinner", "evening_tea"].map((mealKey) => {
          const meal = diet[mealKey];
          if (!meal) return null;

          const emoji =
            mealKey === "breakfast"
              ? "🌅"
              : mealKey === "lunch"
              ? "☀️"
              : mealKey === "dinner"
              ? "🌙"
              : "☕";

          return (
            <div key={mealKey} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-gray-800 capitalize flex items-center gap-2">
                  <span className="text-xl">{emoji}</span>
                  {mealKey.replace("_", " ")}
                </div>
                {(meal.preparation_time || meal.cooking_time) && (
                  <div className="text-xs text-gray-600 flex gap-2">
                    {meal.preparation_time && (
                      <span>⏱️ Prep: {meal.preparation_time}</span>
                    )}
                    {meal.cooking_time && (
                      <span>🔥 Cook: {meal.cooking_time}</span>
                    )}
                  </div>
                )}
              </div>

              <h5 className="text-gray-800 font-semibold mb-2">{meal.title}</h5>

              {/* Ingredients */}
              {meal.ingredients && meal.ingredients.length > 0 && (
                <div className="mb-2">
                  <div className="font-medium text-sm text-gray-700 mb-1">
                    🛒 Ingredients:
                  </div>
                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-0.5">
                    {meal.ingredients.map((ingredient: string, idx: number) => (
                      <li key={idx}>{ingredient}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recipe Steps */}
              {meal.recipe_steps && meal.recipe_steps.length > 0 && (
                <div className="mb-2">
                  <div className="font-medium text-sm text-gray-700 mb-1">
                    👨‍🍳 Preparation Steps:
                  </div>
                  <ol className="text-sm text-gray-700 space-y-1">
                    {meal.recipe_steps.map((step: string, idx: number) => (
                      <li key={idx} className="pl-2">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Notes */}
              {meal.notes && (
                <div className="text-sm text-gray-600 mb-2 p-2 bg-gray-50 rounded">
                  💡 {meal.notes}
                </div>
              )}

              {/* Portion Guidance */}
              {meal.portion_guidance && (
                <div className="text-sm text-green-600 mb-2">
                  📏 <span className="font-medium">Portion:</span>{" "}
                  {meal.portion_guidance}
                </div>
              )}

              {/* Swaps */}
              {meal.swap && (
                <div className="text-sm text-blue-600 p-2 bg-blue-50 rounded">
                  🔄 <span className="font-medium">Healthy Swap:</span> {meal.swap}
                </div>
              )}
            </div>
          );
        })}

        {/* Snacks */}
        {diet.snacks && diet.snacks.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-bold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-xl">🍎</span> Snacks
            </div>
            <div className="space-y-2">
              {diet.snacks.map((snack: any, i: number) => (
                <div key={i} className="p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-800">{snack.title}</div>
                  {snack.notes && (
                    <div className="text-sm text-gray-600 mt-1">{snack.notes}</div>
                  )}
                  {snack.ingredients && snack.ingredients.length > 0 && (
                    <ul className="text-xs text-gray-600 list-disc list-inside mt-1">
                      {snack.ingredients.map((ing: string, idx: number) => (
                        <li key={idx}>{ing}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HolisticSection({ holistic }: { holistic: any }) {
  return (
    <div className="p-4 bg-blue-50 rounded-xl">
      <div className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
        <span>🌟</span> Holistic Wellness
      </div>

      {holistic.rest_day && (
        <div className="text-sm bg-white p-3 rounded-lg mb-3 text-center font-medium text-blue-700">
          ✅ Rest & Recovery Day
        </div>
      )}

      <div className="space-y-2 text-sm">
        {holistic.mindfulness && (
          <div className="bg-white p-3 rounded-lg">
            <span className="font-medium text-gray-800">🧠 Mindfulness:</span>{" "}
            <span className="text-gray-700">{holistic.mindfulness}</span>
          </div>
        )}

        {holistic.affirmation && (
          <div className="bg-white p-3 rounded-lg">
            <span className="font-medium text-gray-800">💫 Affirmation:</span>{" "}
            <span className="text-gray-700 italic">
              "{holistic.affirmation}"
            </span>
          </div>
        )}

        {holistic.sleep && (
          <div className="bg-white p-3 rounded-lg">
            <span className="font-medium text-gray-800">😴 Sleep:</span>{" "}
            <span className="text-gray-700">{holistic.sleep}</span>
          </div>
        )}
      </div>
    </div>
  );
}
