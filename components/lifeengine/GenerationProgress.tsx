"use client";

import { useEffect, useState } from "react";
import styles from "./GenerationProgress.module.css";

interface GenerationProgressProps {
  onComplete?: () => void;
}

export function GenerationProgress({ onComplete }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [eta, setEta] = useState(90);
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
    <div className="w-full max-w-6xl mx-auto">
      {/* Main Card with Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl shadow-2xl border border-white/20">
        {/* Animated Background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 ${styles.animateGradient}`}></div>
        
        <div className="relative z-10 p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {/* Animated Icon */}
              <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${stages[currentStageIndex].color} shadow-lg flex items-center justify-center transform transition-all duration-500`}>
                <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse"></div>
                <span className="text-3xl relative z-10">{stages[currentStageIndex].icon}</span>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  Crafting Your Perfect Plan
                </h3>
                <p className="text-base text-gray-600 font-medium">
                  Currently: <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{stages[currentStageIndex].name}</span>
                </p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="flex items-center gap-4">
              {/* Elapsed Time */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg border border-gray-200/50">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Elapsed</div>
                    <div className="text-lg font-bold text-gray-800">{elapsedTime}s</div>
                  </div>
                </div>
              </div>
              
              {/* ETA */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl px-4 py-3 shadow-lg border border-blue-200/50">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <div>
                    <div className="text-xs text-blue-600 font-medium">Remaining</div>
                    <div className="text-lg font-bold text-blue-700">~{eta}s</div>
                  </div>
                </div>
              </div>
              
              {/* Progress Percentage */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl px-5 py-3 shadow-lg border border-green-200/50">
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                  {progress}%
                </div>
              </div>
            </div>
          </div>

          {/* Main Progress Bar - Large Box Design */}
          <div className="mb-8">
            {/* Progress Label Above */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700 tracking-wide">GENERATION PROGRESS</h4>
              <span className="text-sm font-bold text-gray-500">{progress}% Complete</span>
            </div>
            
            {/* Modern Box-Shaped Progress Container */}
            <div className="relative">
              {/* Outer Glow Effect */}
              <div className={`absolute -inset-1 bg-gradient-to-r ${stages[currentStageIndex].color} rounded-2xl opacity-30 blur-xl ${styles.animatePulse}`}></div>
              
              {/* Main Progress Box */}
              <div className="relative h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-xl border-2 border-gray-300/50">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className={`h-full w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 ${styles.animateShimmer}`}></div>
                </div>
                
                {/* Progress Fill Bar with 3D Effect */}
                <div
                  className={`relative h-full bg-gradient-to-r ${stages[currentStageIndex].color} transition-all duration-700 ease-out`}
                  style={{ width: `${progress}%` }}
                >
                  {/* Top Highlight (3D Effect) */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/40 to-transparent"></div>
                  
                  {/* Animated Shine Sweep */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent ${styles.animateShine}`}></div>
                  
                  {/* Vertical Stripes Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className={styles.stripePattern}></div>
                  </div>
                  
                  {/* Active Pulse at Progress Edge */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-lg">
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg animate-ping"></div>
                  </div>
                </div>
                
                {/* Center Content Overlay */}
                <div className="absolute inset-0 flex items-center justify-between px-6">
                  {/* Left Side: Current Stage */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stages[currentStageIndex].color} shadow-lg flex items-center justify-center`}>
                      <span className="text-2xl">{stages[currentStageIndex].icon}</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Stage</div>
                      <div className="text-lg font-bold text-gray-800">{stages[currentStageIndex].name}</div>
                    </div>
                  </div>
                  
                  {/* Right Side: Large Percentage */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</div>
                      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                        {progress}%
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stages[currentStageIndex].color} shadow-lg flex items-center justify-center animate-pulse`}>
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Shadow (3D Depth) */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Stage Pills */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-3">
              {stages.map((stage, idx) => (
                <div key={idx} className="flex-1">
                  <div className="flex flex-col items-center gap-2">
                    {/* Stage Pill */}
                    <div
                      className={`w-full h-2 rounded-full transition-all duration-500 transform ${
                        idx < currentStageIndex
                          ? "bg-gradient-to-r from-green-400 to-green-500 scale-105 shadow-lg"
                          : idx === currentStageIndex
                          ? `bg-gradient-to-r ${stage.color} scale-110 shadow-xl animate-pulse`
                          : "bg-gray-300 scale-95"
                      }`}
                    ></div>
                    
                    {/* Icon Badge */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-500 transform ${
                        idx < currentStageIndex
                          ? "bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg scale-100"
                          : idx === currentStageIndex
                          ? `bg-gradient-to-br ${stage.color} text-white shadow-2xl scale-110 ${styles.animateBounceSlow}`
                          : "bg-gray-200 text-gray-400 scale-90"
                      }`}
                    >
                      {idx < currentStageIndex ? "✓" : stage.icon}
                    </div>
                    
                    {/* Stage Name */}
                    <span
                      className={`text-xs font-semibold text-center transition-all duration-300 ${
                        idx === currentStageIndex
                          ? "text-blue-700 scale-110"
                          : idx < currentStageIndex
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {stage.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200/50 rounded-2xl p-5 shadow-inner">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">💡</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-800 mb-2">Behind the Scenes</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our AI is analyzing your profile, creating personalized yoga sequences, 
                  designing custom workouts, generating nutritious recipes, and adding 
                  expert safety tips and guidance tailored just for you.
                </p>
              </div>
              <div className="flex-shrink-0 bg-yellow-100 border border-yellow-300 rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm">
                <span className="text-xl">⚠️</span>
                <span className="text-xs font-bold text-yellow-800">Don't Close Window</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
