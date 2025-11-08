"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, Calendar, Home } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Type definitions for the notebook structure
export interface YogaPose {
  name: string;
  duration: string;
  steps: string[];
  breathing?: string;
  benefits?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  tips: string[];
  formCues?: string[];
}

export interface Meal {
  name: string;
  recipe: string;
  ingredients: string[];
  portions: string;
  macros?: {
    calories: number;
    protein: string;
    carbs: string;
    fats: string;
  };
  prepTime?: string;
}

export interface DayPlan {
  day: number;
  yoga?: YogaPose[];
  exercise?: Exercise[];
  meals?: {
    breakfast?: Meal;
    lunch?: Meal;
    dinner?: Meal;
    snacks?: Meal[];
  };
  tips?: string[];
  notes?: string;
}

export interface PlanNotebookData {
  planId?: string;
  planName: string;
  userName: string;
  duration: number;
  planTypes: string[];
  createdAt?: string;
  plan: DayPlan[];
}

interface PlanNotebookProps {
  data: PlanNotebookData;
  onClose?: () => void;
}

export default function PlanNotebook({ data, onClose }: PlanNotebookProps) {
  const [currentDay, setCurrentDay] = useState(0);
  const [showDayIndex, setShowDayIndex] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const pageRef = useRef<HTMLDivElement>(null);

  const dayData = data.plan[currentDay];
  const totalDays = data.plan.length;

  // Navigation handlers
  const goToNextDay = () => {
    if (currentDay < totalDays - 1) {
      setCurrentDay(currentDay + 1);
    }
  };

  const goToPreviousDay = () => {
    if (currentDay > 0) {
      setCurrentDay(currentDay - 1);
    }
  };

  const goToDay = (dayIndex: number) => {
    setCurrentDay(dayIndex);
    setShowDayIndex(false);
  };

  // Day selection for export
  const toggleDaySelection = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  };

  const selectAllDays = () => {
    setSelectedDays(Array.from({ length: totalDays }, (_, i) => i));
  };

  const clearSelection = () => {
    setSelectedDays([]);
  };

  // PDF Export functionality
  const exportToPDF = async (daysToExport: number[] = [currentDay]) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < daysToExport.length; i++) {
      const dayIndex = daysToExport[i];
      const dayElement = document.getElementById(`day-${dayIndex}`);

      if (dayElement) {
        const canvas = await html2canvas(dayElement, {
          scale: 2,
          useCORS: true,
          logging: false,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      }
    }

    const fileName = `${data.planName.replace(/\s/g, "_")}_${daysToExport.length === 1 ? `Day_${daysToExport[0] + 1}` : "Full_Plan"}.pdf`;
    pdf.save(fileName);
  };

  const exportFullPlan = () => {
    const allDays = Array.from({ length: totalDays }, (_, i) => i);
    exportToPDF(allDays);
  };

  const exportSelectedDays = () => {
    if (selectedDays.length > 0) {
      exportToPDF(selectedDays.sort((a, b) => a - b));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <Home className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{data.planName}</h1>
                <p className="text-sm text-gray-600">
                  For {data.userName} • {totalDays} Days • {data.planTypes.join(", ")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDayIndex(!showDayIndex)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Day Index
              </button>
              <button
                onClick={exportFullPlan}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Full Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Day Index Sidebar (Overlay) */}
      {showDayIndex && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowDayIndex(false)}
          />
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Day Index</h2>

              {/* Selection Controls */}
              <div className="mb-4 flex gap-2">
                <button
                  onClick={selectAllDays}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Clear
                </button>
                {selectedDays.length > 0 && (
                  <button
                    onClick={exportSelectedDays}
                    className="text-xs px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Export ({selectedDays.length})
                  </button>
                )}
              </div>

              {/* Day List */}
              <div className="space-y-2">
                {data.plan.map((day, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      currentDay === index
                        ? "border-blue-500 bg-blue-50"
                        : selectedDays.includes(index)
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(index)}
                        onChange={() => toggleDaySelection(index)}
                        className="w-4 h-4 text-blue-600 rounded"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select day ${day.day} for export`}
                      />
                      <button
                        onClick={() => goToDay(index)}
                        className="flex-1 text-left"
                      >
                        <div className="font-semibold text-gray-900">Day {day.day}</div>
                        <div className="text-xs text-gray-600">
                          {day.yoga && `${day.yoga.length} Yoga Poses`}
                          {day.exercise && ` • ${day.exercise.length} Exercises`}
                          {day.meals && ` • 3 Meals`}
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content - Notebook Page */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Day Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            disabled={currentDay === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentDay === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous Day
          </button>

          <div className="text-center">
            <div className="text-sm text-gray-600">Day {currentDay + 1} of {totalDays}</div>
            <div className="flex gap-1 mt-2">
              {data.plan.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToDay(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentDay ? "bg-blue-500 w-6" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to day ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={goToNextDay}
            disabled={currentDay === totalDays - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              currentDay === totalDays - 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
            }`}
          >
            Next Day
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Notebook Page */}
        <div
          ref={pageRef}
          id={`day-${currentDay}`}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12 min-h-[800px]"
        >
          {/* Page Header */}
          <div className="mb-8 pb-6 border-b-2 border-gray-200">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Day {dayData.day}</h2>
            {dayData.notes && (
              <p className="text-gray-600 italic">{dayData.notes}</p>
            )}
          </div>

          {/* Yoga Section */}
          {dayData.yoga && dayData.yoga.length > 0 && (
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-purple-600 mb-4 flex items-center gap-2">
                🧘 Yoga Routine
              </h3>
              <div className="space-y-6">
                {dayData.yoga.map((pose, index) => (
                  <div key={index} className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{pose.name}</h4>
                    <p className="text-sm text-purple-700 mb-3">⏱️ Duration: {pose.duration}</p>
                    
                    <div className="mb-3">
                      <p className="font-medium text-gray-800 mb-2">Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                        {pose.steps.map((step, idx) => (
                          <li key={idx} className="pl-2">{step}</li>
                        ))}
                      </ol>
                    </div>

                    {pose.breathing && (
                      <div className="bg-white rounded-lg p-3 mb-2">
                        <p className="text-sm font-medium text-gray-800">🌬️ Breathing: {pose.breathing}</p>
                      </div>
                    )}

                    {pose.benefits && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-sm text-gray-700">✨ Benefits: {pose.benefits}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Exercise Section */}
          {dayData.exercise && dayData.exercise.length > 0 && (
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                🏋️ Exercise Routine
              </h3>
              <div className="space-y-6">
                {dayData.exercise.map((ex, index) => (
                  <div key={index} className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="text-xl font-semibold text-gray-900 mb-3">{ex.name}</h4>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 uppercase">Sets</p>
                        <p className="text-2xl font-bold text-blue-600">{ex.sets}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 uppercase">Reps</p>
                        <p className="text-2xl font-bold text-blue-600">{ex.reps}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-600 uppercase">Rest</p>
                        <p className="text-2xl font-bold text-blue-600">{ex.rest}</p>
                      </div>
                    </div>

                    {ex.formCues && ex.formCues.length > 0 && (
                      <div className="bg-white rounded-lg p-4 mb-3">
                        <p className="font-medium text-gray-800 mb-2">📋 Form Cues:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                          {ex.formCues.map((cue, idx) => (
                            <li key={idx}>{cue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {ex.tips && ex.tips.length > 0 && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <p className="font-medium text-gray-800 mb-2">💡 Tips:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                          {ex.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Meals Section */}
          {dayData.meals && (
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-green-600 mb-4 flex items-center gap-2">
                🥗 Meal Plan
              </h3>
              <div className="space-y-6">
                {/* Breakfast */}
                {dayData.meals.breakfast && (
                  <MealCard meal={dayData.meals.breakfast} mealType="Breakfast" icon="🌅" />
                )}

                {/* Lunch */}
                {dayData.meals.lunch && (
                  <MealCard meal={dayData.meals.lunch} mealType="Lunch" icon="☀️" />
                )}

                {/* Dinner */}
                {dayData.meals.dinner && (
                  <MealCard meal={dayData.meals.dinner} mealType="Dinner" icon="🌙" />
                )}

                {/* Snacks */}
                {dayData.meals.snacks && dayData.meals.snacks.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">🍎 Snacks</h4>
                    <div className="grid gap-4">
                      {dayData.meals.snacks.map((snack, idx) => (
                        <MealCard key={idx} meal={snack} mealType="Snack" icon="🍪" compact />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Tips Section */}
          {dayData.tips && dayData.tips.length > 0 && (
            <section className="mb-8">
              <h3 className="text-2xl font-bold text-amber-600 mb-4 flex items-center gap-2">
                💡 Daily Tips & Reminders
              </h3>
              <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <ul className="space-y-3">
                  {dayData.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="text-amber-500 text-xl">•</span>
                      <span className="text-gray-700 flex-1">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Page Footer */}
          <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
            <div>Day {currentDay + 1} of {totalDays}</div>
            <button
              onClick={() => exportToPDF([currentDay])}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Download className="w-4 h-4" />
              Export This Day
            </button>
          </div>
        </div>

        {/* Keyboard Navigation Hint */}
        <div className="mt-4 text-center text-sm text-gray-500">
          💡 Tip: Use ← → arrow keys to navigate between days
        </div>
      </div>
    </div>
  );
}

// Meal Card Component
interface MealCardProps {
  meal: Meal;
  mealType: string;
  icon: string;
  compact?: boolean;
}

function MealCard({ meal, mealType, icon, compact = false }: MealCardProps) {
  return (
    <div className={`bg-green-50 rounded-xl ${compact ? "p-4" : "p-6"} border border-green-200`}>
      <h4 className={`${compact ? "text-base" : "text-xl"} font-semibold text-gray-900 mb-2 flex items-center gap-2`}>
        {icon} {mealType}: {meal.name}
      </h4>

      {meal.prepTime && (
        <p className="text-sm text-green-700 mb-3">⏱️ Prep Time: {meal.prepTime}</p>
      )}

      <div className="bg-white rounded-lg p-4 mb-3">
        <p className="font-medium text-gray-800 mb-2">📝 Recipe:</p>
        <p className="text-gray-700 text-sm whitespace-pre-line">{meal.recipe}</p>
      </div>

      <div className="bg-white rounded-lg p-4 mb-3">
        <p className="font-medium text-gray-800 mb-2">🛒 Ingredients:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          {meal.ingredients.map((ing, idx) => (
            <li key={idx}>{ing}</li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <div className="bg-white rounded-lg p-3 flex-1">
          <p className="text-xs text-gray-600 mb-1">Portions</p>
          <p className="font-medium text-gray-900">{meal.portions}</p>
        </div>

        {meal.macros && (
          <div className="bg-white rounded-lg p-3 flex-1">
            <p className="text-xs text-gray-600 mb-1">Macros</p>
            <div className="text-xs text-gray-700">
              <div>{meal.macros.calories} cal</div>
              <div>P: {meal.macros.protein} | C: {meal.macros.carbs} | F: {meal.macros.fats}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
