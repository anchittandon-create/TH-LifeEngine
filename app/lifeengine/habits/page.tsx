"use client";

export default function HabitTrackerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-900">✅ Habit Tracker</h1>
          <p className="text-lg text-gray-600">
            Build and maintain healthy habits with daily tracking
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">📈</div>
            <h2 className="text-2xl font-semibold text-gray-800">Coming Soon</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The Habit Tracker feature is under development. Soon you'll be able to create custom habits, 
              track your daily progress, and build lasting healthy routines.
            </p>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">📝</div>
                <h3 className="font-semibold text-gray-800 mb-1">Custom Habits</h3>
                <p className="text-sm text-gray-600">Create personalized habits aligned with your wellness goals</p>
              </div>
              
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl mb-2">🔥</div>
                <h3 className="font-semibold text-gray-800 mb-1">Streak Tracking</h3>
                <p className="text-sm text-gray-600">Build momentum with daily streaks and consistency rewards</p>
              </div>
              
              <div className="p-4 bg-teal-50 rounded-lg">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-800 mb-1">Progress Analytics</h3>
                <p className="text-sm text-gray-600">Visualize your habit completion rates and trends over time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
