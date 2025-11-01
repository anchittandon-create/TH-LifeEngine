"use client";

import React from "react";
import type { LifeEnginePlan } from "@/app/types/lifeengine";

interface PlanPreviewProps {
  plan: LifeEnginePlan | null;
}

export default function PlanPreview({ plan }: PlanPreviewProps) {
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

          return (
            <div
              key={dayKey}
              className="rounded-2xl p-5 shadow-md border border-gray-100 bg-white hover:shadow-lg transition-shadow"
            >
              <div className="font-bold text-lg capitalize text-purple-700 mb-4 flex items-center gap-2">
                <span className="text-2xl">
                  {dayKey === "monday" && "🌟"}
                  {dayKey === "tuesday" && "💪"}
                  {dayKey === "wednesday" && "🧘"}
                  {dayKey === "thursday" && "🌿"}
                  {dayKey === "friday" && "✨"}
                  {dayKey === "saturday" && "🎯"}
                  {dayKey === "sunday" && "🌸"}
                </span>
                {dayKey}
              </div>

              {/* Yoga Section */}
              {dayPlan.yoga && (
                <div className="mb-4 p-4 bg-purple-50 rounded-xl">
                  <div className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    <span>🧘‍♀️</span> Yoga Session
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">Warmup:</span>{" "}
                    {dayPlan.yoga.warmup_min ?? 0} min
                    {" | "}
                    <span className="font-medium">Cooldown:</span>{" "}
                    {dayPlan.yoga.cooldown_min ?? 0} min
                  </div>
                  {dayPlan.yoga.focus_area && (
                    <div className="text-sm text-purple-700 mb-2">
                      <span className="font-medium">Focus:</span>{" "}
                      {dayPlan.yoga.focus_area}
                    </div>
                  )}
                  {dayPlan.yoga.sequence && dayPlan.yoga.sequence.length > 0 && (
                    <ul className="list-none space-y-2 mb-3">
                      {dayPlan.yoga.sequence.map((pose, i) => (
                        <li
                          key={i}
                          className="text-sm bg-white p-2 rounded-lg shadow-sm"
                        >
                          <span className="font-semibold text-gray-800">
                            {pose.name}
                          </span>
                          <span className="text-purple-600 ml-2">
                            • {pose.duration_min} min
                          </span>
                          {pose.focus && (
                            <span className="text-gray-600 ml-2">
                              • Focus: {pose.focus}
                            </span>
                          )}
                          {pose.modifications && (
                            <div className="text-xs text-gray-500 mt-1">
                              💡 {pose.modifications}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {dayPlan.yoga.breathwork && (
                    <div className="text-sm text-gray-700 mb-2">
                      <span className="font-medium">🌬️ Breathwork:</span>{" "}
                      {dayPlan.yoga.breathwork}
                    </div>
                  )}
                  {dayPlan.yoga.journal_prompt && (
                    <div className="text-sm text-gray-700 p-3 bg-white rounded-lg mt-2">
                      <span className="font-medium">📝 Journal Prompt:</span>{" "}
                      {dayPlan.yoga.journal_prompt}
                    </div>
                  )}
                </div>
              )}

              {/* Diet Section */}
              {dayPlan.diet && (
                <div className="mb-4 p-4 bg-green-50 rounded-xl">
                  <div className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <span>🥗</span> Nutrition Plan
                  </div>
                  <div className="space-y-2">
                    {["breakfast", "lunch", "dinner", "evening_tea"].map(
                      (mealKey) => {
                        const meal = (dayPlan.diet as any)[mealKey];
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
                          <div
                            key={mealKey}
                            className="text-sm bg-white p-3 rounded-lg"
                          >
                            <div className="font-semibold text-gray-800 capitalize flex items-center gap-2">
                              <span>{emoji}</span> {mealKey.replace("_", " ")}:
                            </div>
                            <div className="text-gray-700 mt-1">
                              {meal.title}
                            </div>
                            {meal.notes && (
                              <div className="text-xs text-gray-600 mt-1">
                                {meal.notes}
                              </div>
                            )}
                            {meal.portion_guidance && (
                              <div className="text-xs text-green-600 mt-1">
                                📏 {meal.portion_guidance}
                              </div>
                            )}
                            {meal.swap && (
                              <div className="text-xs text-blue-600 mt-1">
                                🔄 Swap: {meal.swap}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                    {dayPlan.diet.snacks && dayPlan.diet.snacks.length > 0 && (
                      <div className="text-sm bg-white p-3 rounded-lg">
                        <div className="font-semibold text-gray-800 flex items-center gap-2">
                          <span>🍎</span> Snacks:
                        </div>
                        <ul className="mt-1 space-y-1">
                          {dayPlan.diet.snacks.map((snack, i) => (
                            <li key={i} className="text-gray-700">
                              • {snack.title}
                              {snack.notes && (
                                <span className="text-xs text-gray-600 ml-2">
                                  ({snack.notes})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Holistic Section */}
              {dayPlan.holistic && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <span>🌟</span> Holistic Wellness
                  </div>
                  {dayPlan.holistic.rest_day && (
                    <div className="text-sm bg-white p-2 rounded-lg mb-2 text-center font-medium text-blue-700">
                      ✅ Rest & Recovery Day
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    {dayPlan.holistic.mindfulness && (
                      <div className="bg-white p-2 rounded-lg">
                        <span className="font-medium text-gray-800">
                          🧠 Mindfulness:
                        </span>{" "}
                        <span className="text-gray-700">
                          {dayPlan.holistic.mindfulness}
                        </span>
                      </div>
                    )}
                    {dayPlan.holistic.affirmation && (
                      <div className="bg-white p-2 rounded-lg">
                        <span className="font-medium text-gray-800">
                          💫 Affirmation:
                        </span>{" "}
                        <span className="text-gray-700 italic">
                          "{dayPlan.holistic.affirmation}"
                        </span>
                      </div>
                    )}
                    {dayPlan.holistic.sleep && (
                      <div className="bg-white p-2 rounded-lg">
                        <span className="font-medium text-gray-800">
                          😴 Sleep:
                        </span>{" "}
                        <span className="text-gray-700">
                          {dayPlan.holistic.sleep}
                        </span>
                      </div>
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
