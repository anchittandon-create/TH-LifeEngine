"use client";

import { useEffect, useState } from "react";

interface GenerationProgressProps {
  onComplete?: () => void;
}

export function GenerationProgress({ onComplete }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Starting");
  const [eta, setEta] = useState(90);
  const [elapsedTime, setElapsedTime] = useState(0);

  const stages = [
    { name: "🔮 Analyzing your profile", duration: 8, progress: 10 },
    { name: "📋 Structuring your plan", duration: 5, progress: 20 },
    { name: "🧘‍♀️ Generating yoga sequences", duration: 15, progress: 35 },
    { name: "🏋️ Creating workout routines", duration: 15, progress: 50 },
    { name: "🥗 Crafting meal recipes", duration: 20, progress: 70 },
    { name: "✨ Adding step-by-step details", duration: 15, progress: 85 },
    { name: "📝 Finalizing your plan", duration: 12, progress: 95 },
    { name: "✅ Complete!", duration: 0, progress: 100 },
  ];

  useEffect(() => {
    let currentStageIndex = 0;
    let stageStartTime = Date.now();
    const startTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const totalElapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(totalElapsed);

      if (currentStageIndex >= stages.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
        return;
      }

      const currentStage = stages[currentStageIndex];
      const stageElapsed = (now - stageStartTime) / 1000;

      // Move to next stage if duration exceeded
      if (stageElapsed >= currentStage.duration) {
        currentStageIndex++;
        stageStartTime = now;
        if (currentStageIndex < stages.length) {
          setStage(stages[currentStageIndex].name);
          setProgress(stages[currentStageIndex].progress);
          
          // Calculate remaining ETA
          const remainingStages = stages.slice(currentStageIndex);
          const remainingTime = remainingStages.reduce((sum, s) => sum + s.duration, 0);
          setEta(Math.max(0, remainingTime));
        }
      } else {
        // Smooth progress within stage
        const stageProgress = Math.min(1, stageElapsed / currentStage.duration);
        const nextProgress = currentStageIndex < stages.length - 1 
          ? stages[currentStageIndex + 1].progress 
          : 100;
        const interpolatedProgress = 
          currentStage.progress + (nextProgress - currentStage.progress) * stageProgress;
        setProgress(Math.floor(interpolatedProgress));
        
        // Update ETA
        const remainingInStage = Math.max(0, currentStage.duration - stageElapsed);
        const remainingStages = stages.slice(currentStageIndex + 1);
        const remainingTime = remainingInStage + remainingStages.reduce((sum, s) => sum + s.duration, 0);
        setEta(Math.max(0, Math.ceil(remainingTime)));
      }
    }, 500); // Update every 500ms for smooth animation

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-xl border-2 border-blue-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full mb-4 animate-pulse">
          <span className="text-4xl">🧠</span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Generating Your Plan</h3>
        <p className="text-gray-600">AI is crafting your personalized wellness journey...</p>
      </div>

      {/* Current Stage */}
      <div className="mb-6 text-center">
        <p className="text-xl font-semibold text-blue-700 mb-2">{stage}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Elapsed: {elapsedTime}s</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>ETA: ~{eta}s remaining</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
            style={{ width: `${progress}%` }}
          >
            {progress > 10 && (
              <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            )}
          </div>
        </div>
      </div>

      {/* Stage Indicators */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {stages.slice(0, -1).map((s, idx) => (
          <div
            key={idx}
            className={`text-center p-2 rounded-lg transition-all duration-300 ${
              progress >= s.progress
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <div className="text-lg mb-1">
              {progress >= s.progress ? "✓" : "○"}
            </div>
            <div className="text-xs font-medium truncate">
              {s.name.replace(/^[🔮📋🧘‍♀️🏋️🥗✨📝]+\s/, "")}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-100 border border-blue-300 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div className="flex-1">
            <p className="text-sm text-blue-800 font-semibold mb-2">
              What's happening behind the scenes:
            </p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Analyzing your profile, goals, and preferences</li>
              <li>• Creating personalized yoga sequences with detailed steps</li>
              <li>• Designing workouts tailored to your fitness level</li>
              <li>• Generating complete recipes with ingredients and instructions</li>
              <li>• Adding safety tips, modifications, and motivational guidance</li>
            </ul>
            <p className="text-xs text-blue-600 mt-3 font-medium">
              ⚠️ Please don't close this window. Generation typically takes 60-90 seconds.
            </p>
          </div>
        </div>
      </div>

      {/* Animated Dots */}
      <div className="mt-6 flex justify-center gap-2">
        <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
    </div>
  );
}
