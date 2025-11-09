"use client";

import { useEffect, useState } from "react";
import styles from "./GenerationProgress.module.css";

interface GenerationProgressProps {
  onComplete?: () => void;
}

export function GenerationProgress({ onComplete }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [eta, setEta] = useState(165);
  const [elapsedTime, setElapsedTime] = useState(0);

  const stages = [
    { name: "Analyzing", icon: "🔮", duration: 15, progress: 10, color: "from-purple-500 to-purple-600" },
    { name: "Structuring", icon: "📋", duration: 12, progress: 20, color: "from-blue-500 to-blue-600" },
    { name: "Yoga", icon: "🧘‍♀️", duration: 25, progress: 35, color: "from-green-500 to-green-600" },
    { name: "Workouts", icon: "🏋️", duration: 30, progress: 50, color: "from-orange-500 to-orange-600" },
    { name: "Recipes", icon: "🥗", duration: 40, progress: 70, color: "from-emerald-500 to-emerald-600" },
    { name: "Details", icon: "✨", duration: 25, progress: 85, color: "from-yellow-500 to-yellow-600" },
    { name: "Finalizing", icon: "📝", duration: 18, progress: 95, color: "from-indigo-500 to-indigo-600" },
    { name: "Complete", icon: "✅", duration: 0, progress: 100, color: "from-green-500 to-green-600" },
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
    <div className="w-full max-w-5xl mx-auto">
      {/* Compact Card Design - Won't Break Layout */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl shadow-xl border border-white/20 p-6">
        {/* Animated Background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 ${styles.animateGradient}`}></div>
        
        <div className="relative z-10">
          {/* Compact Header Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* Current Stage Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stages[currentStageIndex].color} shadow-lg flex items-center justify-center ${styles.animateBounceSlow}`}>
                <span className="text-2xl">{stages[currentStageIndex].icon}</span>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Crafting Your Plan
                </h3>
                <p className="text-sm text-gray-600">
                  {stages[currentStageIndex].name}...
                </p>
              </div>
            </div>
            
            {/* Compact Stats */}
            <div className="flex items-center gap-3">
              {/* ETA */}
              <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-200">
                <div className="text-xs text-blue-600 font-semibold">ETA</div>
                <div className="text-lg font-bold text-blue-700">{eta}s</div>
              </div>
              
              {/* Progress % */}
              <div className="bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  {progress}%
                </div>
              </div>
            </div>
          </div>

          {/* Single Real-Time Progress Bar with Segmented Design */}
          <div className="mb-4">
            {/* Progress Label */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Generation Progress</span>
              <span className="text-xs font-semibold text-gray-500">{elapsedTime}s elapsed</span>
            </div>
            
            {/* Modern Segmented Progress Bar */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              {/* Background shimmer */}
              <div className={`absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 ${styles.animateShimmer}`}></div>
              
              {/* Active Progress Fill */}
              <div
                className={`relative h-full bg-gradient-to-r ${stages[currentStageIndex].color} transition-all duration-700 ease-out rounded-full`}
                style={{ width: `${progress}%` }}
              >
                {/* Shine effect */}
                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent ${styles.animateShine}`}></div>
                
                {/* Active pulse at end */}
                {progress < 100 && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white">
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-ping"></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Segmented Ticks Below (Modern Design) */}
            <div className="flex items-center justify-between mt-2 px-0.5">
              {stages.slice(0, -1).map((stage, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center transition-all duration-300 ${
                    idx <= currentStageIndex ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  {/* Stage Indicator */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                      idx < currentStageIndex
                        ? "bg-gradient-to-br from-green-400 to-green-500 text-white shadow-md scale-90"
                        : idx === currentStageIndex
                        ? `bg-gradient-to-br ${stage.color} text-white shadow-lg scale-100`
                        : "bg-gray-300 text-gray-500 scale-75"
                    }`}
                  >
                    {idx < currentStageIndex ? "✓" : stage.icon}
                  </div>
                  
                  {/* Stage Name */}
                  <span
                    className={`text-[10px] font-semibold text-center mt-1 transition-all ${
                      idx === currentStageIndex
                        ? "text-blue-700"
                        : idx < currentStageIndex
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Info Banner - Compact */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-lg">💡</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600 leading-relaxed">
                  AI is analyzing your profile and creating personalized content. This may take 2-3 minutes.
                </p>
              </div>
              <div className="flex-shrink-0 bg-yellow-100 border border-yellow-300 rounded-lg px-2 py-1 flex items-center gap-1">
                <span className="text-sm">⚠️</span>
                <span className="text-[10px] font-bold text-yellow-800">Keep Open</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
