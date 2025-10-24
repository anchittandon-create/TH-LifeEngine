import { NextRequest, NextResponse } from 'next/server';

// Access the same global spending tracker
const globalDailySpend = new Map<string, { date: string; totalCost: number }>();
const MAX_DAILY_BUDGET_USD = 0.50;

export async function GET(request: NextRequest) {
  const today = new Date().toISOString().split('T')[0];
  const currentSpend = globalDailySpend.get(today) || { date: today, totalCost: 0 };
  
  const remainingBudget = MAX_DAILY_BUDGET_USD - currentSpend.totalCost;
  const usagePercent = (currentSpend.totalCost / MAX_DAILY_BUDGET_USD) * 100;
  
  return NextResponse.json({
    date: today,
    currentSpend: `$${currentSpend.totalCost.toFixed(6)}`,
    currentSpendINR: `₹${(currentSpend.totalCost * 84).toFixed(4)}`,
    dailyBudget: `$${MAX_DAILY_BUDGET_USD}`,
    remainingBudget: `$${remainingBudget.toFixed(6)}`,
    usagePercent: `${usagePercent.toFixed(1)}%`,
    status: usagePercent >= 100 ? 'BUDGET_EXCEEDED' : usagePercent >= 80 ? 'WARNING' : 'OK',
    costOptimizations: {
      cacheHours: 24,
      maxRequestsPerProfile: 3,
      maxOutputTokens: 1024,
      model: 'gemini-1.5-flash-8b',
      temperature: 0.3
    }
  });
}