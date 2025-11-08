"use client";

export default function SleepOptimizerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-900">😴 Sleep Optimizer</h1>
          <p className="text-lg text-gray-600">
            Track and improve your sleep quality with personalized insights
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🌙</div>
            <h2 className="text-2xl font-semibold text-gray-800">Coming Soon</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The Sleep Optimizer feature is under development. Soon you'll be able to track your sleep patterns, 
              receive personalized recommendations, and improve your sleep quality.
            </p>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-800 mb-1">Sleep Tracking</h3>
                <p className="text-sm text-gray-600">Log your sleep hours and quality each night</p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">💡</div>
                <h3 className="font-semibold text-gray-800 mb-1">Smart Insights</h3>
                <p className="text-sm text-gray-600">Get AI-powered recommendations to improve your sleep</p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-800 mb-1">Sleep Goals</h3>
                <p className="text-sm text-gray-600">Set and track your sleep duration and quality targets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
