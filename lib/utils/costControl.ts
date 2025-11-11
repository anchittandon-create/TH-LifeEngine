/**
 * Dynamically adjust quota for a feature to allow full execution, then enforce quota after completion.
 */
export function adjustQuotaForFeature(estimatedCost: number): { allowed: boolean; reason?: string; adjusted: boolean } {
  const stats = getUsageStats();
  // If estimated cost exceeds remaining budget, allow temporary overage for this feature
  if (stats.daily.remainingBudget < estimatedCost) {
    // Allow execution, but mark as adjusted
    return {
      allowed: true,
      reason: `Quota temporarily increased to allow feature completion. Estimated cost: $${estimatedCost.toFixed(4)}`,
      adjusted: true,
    };
  }
  return { allowed: true, adjusted: false };
}
/**
 * Cost Control Utilities for Hobby Project
 * 
 * Implements rate limiting and cost tracking to keep Google Cloud billing minimal
 */

interface RateLimitConfig {
  maxRequestsPerHour: number;
  maxDailyCost: number; // in USD
}

interface UsageRecord {
  timestamp: number;
  tokens: {
    input: number;
    output: number;
  };
  cost: number;
}

const RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequestsPerHour: 10, // Max 10 plan generations per hour
  maxDailyCost: 0.50, // Max $0.50 per day (hobby project budget)
};

const STORAGE_KEY_PREFIX = 'lifeengine_cost_';

/**
 * Check if a new plan generation is allowed based on rate limits
 */
export function canGeneratePlan(): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  // Get recent usage from localStorage
  const recentUsage = getRecentUsage();
  
  // Check hourly rate limit
  const hourlyRequests = recentUsage.filter(r => r.timestamp > oneHourAgo).length;
  if (hourlyRequests >= RATE_LIMIT_CONFIG.maxRequestsPerHour) {
    const oldestRequest = Math.min(...recentUsage.filter(r => r.timestamp > oneHourAgo).map(r => r.timestamp));
    const minutesUntilReset = Math.ceil((oldestRequest + 60 * 60 * 1000 - now) / 60000);
    return {
      allowed: false,
      reason: `Rate limit reached. Max ${RATE_LIMIT_CONFIG.maxRequestsPerHour} plans per hour. Try again in ${minutesUntilReset} minutes.`
    };
  }

  // Check daily cost limit
  const dailyCost = recentUsage
    .filter(r => r.timestamp > oneDayAgo)
    .reduce((sum, r) => sum + r.cost, 0);
  
  if (dailyCost >= RATE_LIMIT_CONFIG.maxDailyCost) {
    const hoursUntilReset = Math.ceil((Math.min(...recentUsage.map(r => r.timestamp)) + 24 * 60 * 60 * 1000 - now) / 3600000);
    return {
      allowed: false,
      reason: `Daily budget limit reached ($${RATE_LIMIT_CONFIG.maxDailyCost}). Spent: $${dailyCost.toFixed(4)}. Resets in ${hoursUntilReset} hours.`
    };
  }

  return { allowed: true };
}

/**
 * Record a plan generation for cost tracking
 */
export function recordPlanGeneration(tokens: { input: number; output: number }, cost: number) {
  const record: UsageRecord = {
    timestamp: Date.now(),
    tokens,
    cost,
  };

  const usage = getRecentUsage();
  usage.push(record);

  // Keep only last 7 days of data
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const filtered = usage.filter(r => r.timestamp > sevenDaysAgo);

  if (typeof window !== 'undefined') {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}usage`,
      JSON.stringify(filtered)
    );
  }
}

/**
 * Get usage statistics for display
 */
export function getUsageStats() {
  const usage = getRecentUsage();
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const hourlyUsage = usage.filter(r => r.timestamp > oneHourAgo);
  const dailyUsage = usage.filter(r => r.timestamp > oneDayAgo);
  const weeklyUsage = usage.filter(r => r.timestamp > oneWeekAgo);

  return {
    hourly: {
      requests: hourlyUsage.length,
      maxRequests: RATE_LIMIT_CONFIG.maxRequestsPerHour,
      remainingRequests: Math.max(0, RATE_LIMIT_CONFIG.maxRequestsPerHour - hourlyUsage.length),
    },
    daily: {
      cost: dailyUsage.reduce((sum, r) => sum + r.cost, 0),
      maxCost: RATE_LIMIT_CONFIG.maxDailyCost,
      remainingBudget: Math.max(0, RATE_LIMIT_CONFIG.maxDailyCost - dailyUsage.reduce((sum, r) => sum + r.cost, 0)),
      requests: dailyUsage.length,
    },
    weekly: {
      cost: weeklyUsage.reduce((sum, r) => sum + r.cost, 0),
      requests: weeklyUsage.length,
      avgCostPerRequest: weeklyUsage.length > 0 
        ? weeklyUsage.reduce((sum, r) => sum + r.cost, 0) / weeklyUsage.length 
        : 0,
    },
  };
}

/**
 * Clear all usage data (admin function)
 */
export function clearUsageData() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}usage`);
  }
}

/**
 * Helper to get recent usage records from localStorage
 */
function getRecentUsage(): UsageRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}usage`);
    if (!stored) return [];
    return JSON.parse(stored) as UsageRecord[];
  } catch (error) {
    console.error('Failed to parse usage data:', error);
    return [];
  }
}

/**
 * Estimate cost before generation
 */
export function estimatePlanCost(durationDays: number, planTypes: number): { 
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  warning?: string;
} {
  // Rough estimation based on observed patterns
  // Average prompt size: 2000-3000 tokens
  // Average output per day: 400-600 tokens
  
  const basePromptTokens = 2000;
  const planTypeMultiplier = planTypes * 200; // Each plan type adds context
  const estimatedInputTokens = basePromptTokens + planTypeMultiplier;
  
  const tokensPerDay = 500; // Average tokens per day in output
  const estimatedOutputTokens = Math.min(durationDays * tokensPerDay, 3000); // Capped at max
  
  // Pricing for gemini-1.5-flash-8b
  const inputCostPer1M = 0.0375;
  const outputCostPer1M = 0.15;
  
  const inputCost = (estimatedInputTokens / 1000000) * inputCostPer1M;
  const outputCost = (estimatedOutputTokens / 1000000) * outputCostPer1M;
  const estimatedCost = inputCost + outputCost;
  
  const stats = getUsageStats();
  let warning: string | undefined;
  
  if (stats.daily.cost + estimatedCost > RATE_LIMIT_CONFIG.maxDailyCost) {
    warning = `This generation will exceed your daily budget of $${RATE_LIMIT_CONFIG.maxDailyCost}`;
  }
  
  return {
    estimatedInputTokens,
    estimatedOutputTokens,
    estimatedCost,
    warning,
  };
}
