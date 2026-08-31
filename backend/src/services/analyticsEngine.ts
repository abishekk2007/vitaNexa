// Enterprise Analytics Engine — 8 advanced health scores + trend forecasting

export interface HealthScores {
  nutrientDeficiencyRiskScore: number;
  foodDiversityScore: number;
  absorptionEfficiencyScore: number;
  supplementComplianceScore: number;
  reminderComplianceScore: number;
  consistencyScore: number;
  healthMomentumScore: number;
  wellnessTrendScore: number;
  overallHealthScore: number;
}

export interface TrendData {
  period: string;
  value: number;
  label: string;
}

export interface NutrientTrend {
  nutrient: string;
  current: number;
  previous: number;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface AnalyticsReport {
  scores: HealthScores;
  nutrientTrends: NutrientTrend[];
  dailyTrends: TrendData[];
  weeklyTrends: TrendData[];
  monthlyTrends: TrendData[];
  deficiencyForecast: { nutrient: string; risk: 'low' | 'moderate' | 'high' | 'critical'; daysToDeficiency?: number }[];
  recommendations: string[];
}

// Score calculators

export function calculateNutrientDeficiencyRiskScore(
  nutrientCoverage: Record<string, { percent: number; status: string }>
): number {
  const entries = Object.entries(nutrientCoverage).filter(([, v]) => v.percent !== undefined);
  if (entries.length === 0) return 50;

  const gapCount = entries.filter(([, v]) => v.percent < 50).length;
  const borderlineCount = entries.filter(([, v]) => v.percent >= 50 && v.percent < 80).length;
  const total = entries.length;

  const gapRatio = gapCount / total;
  const borderlineRatio = borderlineCount / total;

  const score = Math.round(100 - (gapRatio * 80 + borderlineRatio * 40));
  return Math.max(0, Math.min(100, score));
}

export function calculateFoodDiversityScore(
  uniqueFoods: string[],
  uniqueNutrients: string[],
  totalMeals: number
): number {
  if (totalMeals === 0) return 50;

  const foodVariety = Math.min(uniqueFoods.length / 20, 1) * 40;
  const nutrientCoverage = Math.min(uniqueNutrients.length / 15, 1) * 40;
  const mealFrequency = Math.min(totalMeals / 21, 1) * 20;

  return Math.round(foodVariety + nutrientCoverage + mealFrequency);
}

export function calculateAbsorptionEfficiencyScore(
  interactions: { effect: string; score: number }[]
): number {
  if (interactions.length === 0) return 75;

  let score = 75;
  for (const i of interactions) {
    if (i.effect === 'positive') score += i.score * 0.1;
    if (i.effect === 'negative') score -= i.score * 0.15;
    if (i.effect === 'competition') score -= i.score * 0.05;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateSupplementComplianceScore(
  supplements: { startDate: string; frequency?: string | null }[],
  currentDate: Date = new Date()
): number {
  if (supplements.length === 0) return 0;

  let score = 0;
  for (const supp of supplements) {
    const start = new Date(supp.startDate);
    const daysSinceStart = Math.max(1, Math.floor((currentDate.getTime() - start.getTime()) / 86400000));

    // Daily compliance decays slowly
    const dailyDecay = Math.min(daysSinceStart, 90) / 90;
    const suppScore = Math.round(100 * (1 - dailyDecay * 0.2));
    score += suppScore;
  }

  return Math.round(score / supplements.length);
}

export function calculateConsistencyScore(
  mealLogs: { mealTime: Date | string }[],
  supplementLogs: { startDate: string }[]
): number {
  const recentDays = 14;
  const now = Date.now();
  const dayWindow = recentDays * 86400000;

  const recentMeals = mealLogs.filter(m =>
    now - new Date(m.mealTime).getTime() < dayWindow
  ).length;

  const recentSupplements = supplementLogs.filter(s =>
    now - new Date(s.startDate).getTime() < dayWindow
  ).length;

  const mealScore = Math.min(recentMeals / 21, 1) * 50;
  const suppScore = Math.min(recentSupplements / 5, 1) * 50;

  return Math.round(mealScore + suppScore);
}

export function calculateHealthMomentumScore(
  currentScores: Partial<HealthScores>,
  previousScores: Partial<HealthScores>
): number {
  let delta = 0;
  let count = 0;

  for (const key of Object.keys(currentScores) as (keyof HealthScores)[]) {
    const cur = currentScores[key];
    const prev = previousScores[key];
    if (cur !== undefined && prev !== undefined && prev !== 0) {
      delta += ((cur - prev) / prev) * 100;
      count++;
    }
  }

  const avgDelta = count > 0 ? delta / count : 0;
  return Math.round(Math.max(-100, Math.min(100, avgDelta)));
}

export function calculateWellnessTrendScore(
  trends: TrendData[]
): number {
  if (trends.length < 2) return 50;

  const recent = trends.slice(-7);
  if (recent.length < 2) return 50;

  let improvement = 0;
  for (let i = 1; i < recent.length; i++) {
    improvement += recent[i].value - recent[i - 1].value;
  }

  const avgImprovement = improvement / (recent.length - 1);
  return Math.round(Math.max(0, Math.min(100, 50 + avgImprovement)));
}

export function calculateOverallHealthScore(scores: Partial<HealthScores>): number {
  const weights: Record<string, number> = {
    nutrientDeficiencyRiskScore: 0.25,
    foodDiversityScore: 0.15,
    absorptionEfficiencyScore: 0.15,
    supplementComplianceScore: 0.10,
    consistencyScore: 0.15,
    healthMomentumScore: 0.10,
    wellnessTrendScore: 0.10,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const val = scores[key as keyof HealthScores];
    if (val !== undefined) {
      weightedSum += val * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 50;
  return Math.round(weightedSum / totalWeight);
}

export function generateDeficiencyForecast(
  nutrientCoverage: Record<string, { percent: number; status: string; trend?: string }>
): { nutrient: string; risk: 'low' | 'moderate' | 'high' | 'critical'; daysToDeficiency?: number }[] {
  const forecast: { nutrient: string; risk: 'low' | 'moderate' | 'high' | 'critical'; daysToDeficiency?: number }[] = [];

  for (const [nutrient, data] of Object.entries(nutrientCoverage)) {
    if (data.percent === undefined) continue;

    if (data.percent < 20) {
      forecast.push({ nutrient, risk: 'critical', daysToDeficiency: Math.round(30 - data.percent) });
    } else if (data.percent < 40) {
      forecast.push({ nutrient, risk: 'high', daysToDeficiency: Math.round(60 - data.percent) });
    } else if (data.percent < 60) {
      forecast.push({ nutrient, risk: 'moderate', daysToDeficiency: Math.round(90 - data.percent) });
    } else if (data.percent < 80) {
      forecast.push({ nutrient, risk: 'low' });
    }
  }

  return forecast.sort((a, b) => {
    const riskOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
    return riskOrder[a.risk] - riskOrder[b.risk];
  });
}

export function computeAllScores(params: {
  nutrientCoverage?: Record<string, { percent: number; status: string }>;
  uniqueFoods?: string[];
  uniqueNutrients?: string[];
  totalMeals?: number;
  interactions?: { effect: string; score: number }[];
  supplements?: { startDate: string; frequency?: string | null }[];
  mealLogs?: { mealTime: Date | string }[];
  supplementLogs?: { startDate: string }[];
  currentScores?: Partial<HealthScores>;
  previousScores?: Partial<HealthScores>;
  trends?: TrendData[];
}): HealthScores {
  const scores: HealthScores = {
    nutrientDeficiencyRiskScore: calculateNutrientDeficiencyRiskScore(params.nutrientCoverage || {}),
    foodDiversityScore: calculateFoodDiversityScore(
      params.uniqueFoods || [],
      params.uniqueNutrients || [],
      params.totalMeals || 0
    ),
    absorptionEfficiencyScore: calculateAbsorptionEfficiencyScore(params.interactions || []),
    supplementComplianceScore: calculateSupplementComplianceScore(params.supplements || []),
    reminderComplianceScore: 50,
    consistencyScore: calculateConsistencyScore(params.mealLogs || [], params.supplementLogs || []),
    healthMomentumScore: calculateHealthMomentumScore(
      params.currentScores || {},
      params.previousScores || {}
    ),
    wellnessTrendScore: calculateWellnessTrendScore(params.trends || []),
    overallHealthScore: 0,
  };

  scores.overallHealthScore = calculateOverallHealthScore(scores);
  return scores;
}

export function analyzeNutrientTrends(
  history: { date: string; nutrients: Record<string, number> }[]
): NutrientTrend[] {
  if (history.length < 2) return [];

  const latest = history[history.length - 1];
  const previous = history[0];
  const trends: NutrientTrend[] = [];

  for (const [nutrient, currentValue] of Object.entries(latest.nutrients)) {
    const prevValue = previous.nutrients[nutrient];
    if (prevValue === undefined) continue;

    const change = currentValue - prevValue;
    const trend: 'improving' | 'declining' | 'stable' =
      change > 10 ? 'improving' :
      change < -10 ? 'declining' : 'stable';

    trends.push({
      nutrient,
      current: currentValue,
      previous: prevValue,
      change,
      trend,
    });
  }

  return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

export function buildTrendData(
  dailyScores: { date: string; score: number }[]
): { daily: TrendData[]; weekly: TrendData[]; monthly: TrendData[] } {
  const daily: TrendData[] = dailyScores.map(d => ({
    period: d.date,
    value: d.score,
    label: `Day ${new Date(d.date).getDate()}`,
  }));

  // Weekly aggregation
  const weeklyMap = new Map<string, number[]>();
  for (const d of dailyScores) {
    const date = new Date(d.date);
    const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + 1 - date.getDay()) / 7)}`;
    if (!weeklyMap.has(weekKey)) weeklyMap.set(weekKey, []);
    weeklyMap.get(weekKey)!.push(d.score);
  }
  const weekly: TrendData[] = [];
  for (const [week, scores] of weeklyMap) {
    weekly.push({ period: week, value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), label: week });
  }

  // Monthly aggregation
  const monthlyMap = new Map<string, number[]>();
  for (const d of dailyScores) {
    const monthKey = d.date.slice(0, 7);
    if (!monthlyMap.has(monthKey)) monthlyMap.set(monthKey, []);
    monthlyMap.get(monthKey)!.push(d.score);
  }
  const monthly: TrendData[] = [];
  for (const [month, scores] of monthlyMap) {
    monthly.push({ period: month, value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length), label: month });
  }

  return { daily, weekly, monthly };
}
