"use client";

import { useEffect, useState } from "react";

interface GenerationProgressProps {
  onComplete?: () => void;
}

export function GenerationProgress({ onComplete }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [eta, setEta] = useState(90);
  const [elapsedTime, setElapsedTime] = useState(0);

  const stages = [
    { name: "Analyzing", icon: "🔮", duration: 8, progress: 10 },
    { name: "Structuring", icon: "📋", duration: 5, progress: 20 },
    { name: "Yoga", icon: "🧘‍♀️", duration: 15, progress: 35 },
    { name: "Workouts", icon: "🏋️", duration: 15, progress: 50 },
    { name: "Recipes", icon: "🥗", duration: 20, progress: 70 },
    { name: "Details", icon: "✨", duration: 15, progress: 85 },
    { name: "Finalizing", icon: "📝", duration: 12, progress: 95 },
    { name: "Complete", icon: "✅", duration: 0, progress: 100 },
  ];

  useEffect(() => {
    let stageIndex = 0;
    let stageStartTime = Date.now();
    const startTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const totalElapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(totalElapsed);

      if (stageIndex >= stages.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
        return;
      }

      const currentStage = stages[stageIndex];
      const stageElapsed = (now - stageStartTime) / 1000;

      // Move to next stage if duration exceeded
      if (stageElapsed >= currentStage.duration) {
        stageIndex++;
        stageStartTime = now;
        if (stageIndex < stages.length) {
          setCurrentStageIndex(stageIndex);
          setProgress(stages[stageIndex].progress);
          
          // Calculate remaining ETA
          const remainingStages = stages.slice(stageIndex);
          const remainingTime = remainingStages.reduce((sum, s) => sum + s.duration, 0);
          setEta(Math.max(0, remainingTime));
        }
      } else {
        // Smooth progress within stage
        const stageProgress = Math.min(1, stageElapsed / currentStage.duration);
        const nextProgress = stageIndex < stages.length - 1 
          ? stages[stageIndex + 1].progress 
          : 100;
        const interpolatedProgress = 
          currentStage.progress + (nextProgress - currentStage.progress) * stageProgress;
        setProgress(Math.floor(interpolatedProgress));
        
        // Update ETA
        const remainingInStage = Math.max(0, currentStage.duration - stageElapsed);
        const remainingStages = stages.slice(stageIndex + 1);
        const remainingTime = remainingInStage + remainingStages.reduce((sum, s) => sum + s.duration, 0);
        setEta(Math.max(0, Math.ceil(remainingTime)));
      }
    }, 500); // Update every 500ms for smooth animation

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-xl border-2 border-blue-200">
      {/* Header Row - Compact */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-2xl">{stages[currentStageIndex].icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Generating Your Plan</h3>
            <p className="text-sm text-gray-600">{stages[currentStageIndex].name}</p>
          </div>
        </div>
        
        {/* Time Stats - Compact */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{elapsedTime}s</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-1 text-blue-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="font-semibold">~{eta}s left</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <span className="text-lg font-bold text-blue-600">{progress}%</span>
        </div>
      </div>

      {/* Horizontal Stage Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2">
          {stages.map((stage, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              {/* Stage Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  idx < currentStageIndex
                    ? "bg-green-500 text-white shadow-lg scale-110"
                    : idx === currentStageIndex
                    ? "bg-blue-500 text-white shadow-lg scale-125 animate-pulse"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {idx < currentStageIndex ? "✓" : stage.icon}
              </div>
              
              {/* Stage Name */}
              <span
                className={`text-xs font-medium text-center transition-all duration-300 ${
                  idx === currentStageIndex
                    ? "text-blue-700 font-bold"
                    : idx < currentStageIndex
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {stage.name}
              </span>
              
              {/* Connecting Line */}
              {idx < stages.length - 1 && (
                <div className="absolute left-0 right-0 h-1 top-5 -z-10">
                  <div
                    className={`h-full transition-all duration-300 ${
                      idx < currentStageIndex ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-50 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Info Box - Compact Horizontal Layout */}
      <div className="bg-blue-100 border border-blue-300 rounded-xl p-3">
        <div className="flex items-center gap-3">
          <span className="text-xl flex-shrink-0">💡</span>
          <div className="flex-1">
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>Behind the scenes:</strong> Analyzing your profile • Creating personalized sequences • 
              Designing workouts • Generating recipes • Adding safety tips and guidance
            </p>
          </div>
          <p className="text-xs text-blue-600 font-medium flex-shrink-0">
            ⚠️ Don't close window
          </p>
        </div>
      </div>
    </div>
  );
}
