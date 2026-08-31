// Advanced Absorption Engine — bioavailability, synergy/conflict scoring, timing efficiency

import { NutrientName, ALL_NUTRIENTS, foodNutrientQuantities } from './nutritionEngine';

export interface AbsorptionResult {
  supplementName: string;
  nutrientName: string;
  bioavailability: number;
  absorptionScore: number;
  synergyScore: number;
  conflictScore: number;
  timingEfficiency: number;
  nutrientUtilization: number;
  recommendations: string[];
}

export interface PairInteraction {
  itemA: string;
  itemB: string;
  effect: 'positive' | 'negative' | 'competition' | 'neutral';
  score: number;
  mechanism: string;
  timingAdvice: string;
}

export interface AbsorptionAnalysis {
  supplements: AbsorptionResult[];
  interactions: PairInteraction[];
  overallScore: number;
  optimizationTips: string[];
}

// ===== BIOAVAILABILITY FACTORS =====
// Each nutrient has a base bioavailability (0-1) influenced by form, food matrix, etc.

const BASE_BIOAVAILABILITY: Partial<Record<NutrientName, number>> = {
  vitamin_d: 0.75, vitamin_a: 0.80, vitamin_e: 0.60, vitamin_k: 0.50,
  vitamin_c: 0.85, vitamin_b1: 0.90, vitamin_b2: 0.85, vitamin_b3: 0.85,
  vitamin_b5: 0.80, vitamin_b6: 0.85, vitamin_b7: 0.70, vitamin_b9: 0.75,
  vitamin_b12: 0.55, choline: 0.70,
  calcium: 0.30, iron: 0.18, zinc: 0.33, magnesium: 0.45,
  potassium: 0.90, selenium: 0.80, copper: 0.65, manganese: 0.10,
  chromium: 0.03, iodine: 0.85,
  protein: 0.90, carbohydrates: 0.95, fat: 0.95, fiber: 0,
  omega3: 0.75, omega6: 0.80,
};

// ===== SYNERGY PAIRS (positive interactions) =====
// nutrient + enhancer -> boost multiplier
const SYNERGY_PAIRS: [NutrientName, NutrientName, number, string][] = [
  ['vitamin_d', 'fat', 1.4, 'Vitamin D is fat-soluble; dietary fat enhances absorption up to 40%'],
  ['iron', 'vitamin_c', 1.6, 'Vitamin C reduces ferric iron to ferrous, boosting absorption up to 60%'],
  ['calcium', 'vitamin_d', 1.3, 'Vitamin D increases calcium absorption in the intestines'],
  ['magnesium', 'vitamin_b6', 1.2, 'Vitamin B6 improves magnesium retention'],
  ['zinc', 'protein', 1.2, 'Protein-bound zinc has higher bioavailability'],
  ['vitamin_e', 'fat', 1.3, 'Vitamin E is fat-soluble; dietary fat enhances absorption'],
  ['vitamin_k', 'fat', 1.3, 'Vitamin K absorption improves with dietary fat'],
  ['iron', 'protein', 1.15, 'Heme iron from animal protein is better absorbed'],
  ['vitamin_a', 'fat', 1.3, 'Vitamin A is fat-soluble; dietary fat enhances absorption'],
  ['omega3', 'fat', 1.3, 'Omega-3 fatty acids absorb better with dietary fat'],
  ['calcium', 'vitamin_k', 1.15, 'Vitamin K supports calcium utilization and bone health'],
  ['vitamin_b12', 'calcium', 1.1, 'Calcium aids intrinsic factor function for B12 absorption'],
];

// ===== CONFLICT PAIRS (negative interactions) =====
// nutrient + inhibitor -> reduction multiplier
const CONFLICT_PAIRS: [NutrientName, NutrientName, number, string][] = [
  ['iron', 'calcium', 0.5, 'Calcium competes with iron for absorption; reduces up to 50%'],
  ['iron', 'zinc', 0.6, 'High-dose zinc competes with iron for transporters'],
  ['zinc', 'iron', 0.6, 'High-dose iron competes with zinc for absorption'],
  ['zinc', 'calcium', 0.7, 'Calcium may reduce zinc absorption at high doses'],
  ['magnesium', 'calcium', 0.7, 'Calcium and magnesium compete for absorption'],
  ['copper', 'zinc', 0.4, 'High zinc dramatically reduces copper absorption'],
  ['vitamin_c', 'vitamin_b12', 0.7, 'High-dose Vitamin C may degrade B12 in the digestive tract'],
  ['iron', 'manganese', 0.4, 'Iron and manganese compete for absorption transporters'],
  ['iron', 'copper', 0.6, 'Iron and copper compete for absorption at high doses'],
  ['calcium', 'iron', 0.5, 'Calcium supplements can inhibit heme and non-heme iron'],
  ['zinc', 'copper', 0.5, 'Zinc induces metallothionein which binds copper'],
  ['calcium', 'zinc', 0.8, 'Calcium may mildly reduce zinc absorption'],
  ['magnesium', 'iron', 0.7, 'Magnesium may reduce iron absorption in the gut'],
];

// ===== COMPETITION GROUPS =====
// Nutrients in the same group compete for transporters
const COMPETITION_GROUPS: NutrientName[][] = [
  ['iron', 'zinc', 'copper', 'manganese'],
  ['calcium', 'magnesium', 'zinc'],
  ['potassium', 'magnesium'],
];

// ===== TIMING EFFICIENCY =====
// Best time-of-day multipliers
const TIME_EFFICIENCY: Record<string, { factor: number; reasoning: string }> = {
  morning_empty: { factor: 1.1, reasoning: 'Empty stomach allows maximum absorption for certain nutrients' },
  morning_food: { factor: 1.0, reasoning: 'With breakfast provides moderate absorption' },
  midday_food: { factor: 1.05, reasoning: 'Midday meals often contain fat which helps fat-soluble vitamins' },
  evening_food: { factor: 1.0, reasoning: 'Evening meals have variable absorption based on digestive activity' },
  evening_bed: { factor: 0.9, reasoning: 'Absorption may be lower near bedtime due to slowed digestion' },
};

const NUTRIENT_TIME_PREFERENCE: Partial<Record<NutrientName, string>> = {
  vitamin_d: 'morning_food',
  vitamin_b12: 'morning_empty',
  iron: 'morning_empty',
  calcium: 'evening_food',
  magnesium: 'evening_food',
  zinc: 'midday_food',
  omega3: 'morning_food',
  vitamin_c: 'midday_food',
};

// ===== CALCULATION FUNCTIONS =====

export function calculateBioavailability(nutrient: NutrientName, context?: {
  withFood?: boolean;
  withFat?: boolean;
  withVitaminC?: boolean;
  withCalcium?: boolean;
  withTea?: boolean;
}): number {
  let score = BASE_BIOAVAILABILITY[nutrient] || 0.5;

  if (!context) return score;

  // Apply context modifiers
  if (nutrient === 'iron' && context.withVitaminC) score *= 1.4;
  if (nutrient === 'iron' && context.withCalcium) score *= 0.6;
  if (nutrient === 'iron' && context.withTea) score *= 0.5;
  if ((nutrient === 'vitamin_d' || nutrient === 'vitamin_e' || nutrient === 'vitamin_k') && context.withFat) score *= 1.3;
  if (nutrient === 'calcium' && context.withFat) score *= 1.1;

  return Math.min(score, 1.0);
}

export function analyzeAbsorption(
  supplementName: string,
  nutrientName: string,
  pairedFoods: string[],
  timeOfDay: string
): AbsorptionResult {
  const baseScore = BASE_BIOAVAILABILITY[nutrientName as NutrientName] || 0.5;
  const nutrient = nutrientName as NutrientName;

  // Calculate synergy from paired foods
  let synergyScore = 0;
  const synergyReasons: string[] = [];
  for (const [a, b, boost, reason] of SYNERGY_PAIRS) {
    if (a === nutrient || b === nutrient) {
      const hasEnhancer = pairedFoods.some(f => f.toLowerCase().includes(b) || f.toLowerCase().includes(a));
      if (hasEnhancer) {
        synergyScore += (boost - 1) * 10;
        synergyReasons.push(reason);
      }
    }
  }

  // Calculate conflict from paired foods
  let conflictScore = 0;
  for (const [a, b, reduction] of CONFLICT_PAIRS) {
    if (a === nutrient || b === nutrient) {
      const hasInhibitor = pairedFoods.some(f =>
        f.toLowerCase().includes(b.replace(/_/g, ' ')) || f.toLowerCase().includes(a.replace(/_/g, ' '))
      );
      if (hasInhibitor) {
        conflictScore += (1 - reduction) * 10;
      }
    }
  }

  // Timing efficiency
  const preferredTime = NUTRIENT_TIME_PREFERENCE[nutrient];
  const timingEff = preferredTime === timeOfDay ? 1.1 : timeOfDay.includes('bed') ? 0.9 : 1.0;
  const timingEfficiency = Math.round(timingEff * 100);

  // Competition check
  let competitionPenalty = 0;
  for (const group of COMPETITION_GROUPS) {
    if (group.includes(nutrient) && pairedFoods.some(f => group.some(n => f.includes(n)))) {
      competitionPenalty += 0.1;
    }
  }

  const bioavailability = baseScore * timingEff * (1 - competitionPenalty);
  const absorptionScore = Math.round(bioavailability * 100);
  const synergyPts = Math.round(Math.min(synergyScore, 30));
  const conflictPts = Math.round(Math.min(conflictScore, 30));
  const nutrientUtilization = Math.round(Math.max(0, absorptionScore + synergyPts - conflictPts));

  const recommendations: string[] = synergyReasons.slice(0, 2);

  if (conflictScore > 10) {
    recommendations.push(`Avoid taking ${nutrientName} with known inhibitors. Space by 2+ hours.`);
  }
  if (timingEff < 1.0) {
    recommendations.push(`Consider taking ${nutrientName} at ${preferredTime || 'a time with food containing fat'} for better absorption.`);
  }
  if (absorptionScore < 40) {
    recommendations.push(`${nutrientName} has naturally low bioavailability (${Math.round(baseScore * 100)}%). Consider higher doses or enhanced forms.`);
  }

  return {
    supplementName,
    nutrientName,
    bioavailability: Math.round(bioavailability * 100) / 100,
    absorptionScore,
    synergyScore: synergyPts,
    conflictScore: conflictPts,
    timingEfficiency,
    nutrientUtilization,
    recommendations,
  };
}

export function analyzePairInteractions(
  items: { name: string; nutrients?: NutrientName[] }[]
): PairInteraction[] {
  const interactions: PairInteraction[] = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];

      // Check synergy
      for (const [n1, n2, boost, reason] of SYNERGY_PAIRS) {
        const aHas = a.nutrients?.includes(n1) || a.name.toLowerCase().includes(n1);
        const bHas = b.nutrients?.includes(n2) || b.name.toLowerCase().includes(n2);
        const aHas2 = a.nutrients?.includes(n2) || a.name.toLowerCase().includes(n2);
        const bHas2 = b.nutrients?.includes(n1) || b.name.toLowerCase().includes(n1);
        if ((aHas && bHas) || (aHas2 && bHas2)) {
          interactions.push({
            itemA: a.name,
            itemB: b.name,
            effect: 'positive',
            score: Math.round((boost - 1) * 100),
            mechanism: reason,
            timingAdvice: 'Take together for enhanced absorption',
          });
        }
      }

      // Check conflict
      for (const [n1, n2, reduction] of CONFLICT_PAIRS) {
        const aHas = a.nutrients?.includes(n1) || a.name.toLowerCase().includes(n1);
        const bHas = b.nutrients?.includes(n2) || b.name.toLowerCase().includes(n2);
        if ((aHas && bHas) || (aHas && bHas)) {
          interactions.push({
            itemA: a.name,
            itemB: b.name,
            effect: 'negative',
            score: Math.round((1 - reduction) * 100),
            mechanism: `Potential negative interaction between ${n1} and ${n2}`,
            timingAdvice: 'Space intake by at least 2 hours',
          });
        }
      }

      // Check competition
      for (const group of COMPETITION_GROUPS) {
        const aGroup = group.filter(n => a.nutrients?.includes(n) || a.name.toLowerCase().includes(n));
        const bGroup = group.filter(n => b.nutrients?.includes(n) || b.name.toLowerCase().includes(n));
        if (aGroup.length > 0 && bGroup.length > 0 && aGroup[0] !== bGroup[0]) {
          interactions.push({
            itemA: a.name,
            itemB: b.name,
            effect: 'competition',
            score: 30,
            mechanism: `Both ${a.name} and ${b.name} compete for absorption transporters`,
            timingAdvice: `Take ${a.name} and ${b.name} at separate meals`,
          });
        }
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return interactions.filter(i => {
    const key = [i.itemA, i.itemB].sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getOverallAbsorptionScore(results: AbsorptionResult[]): number {
  if (results.length === 0) return 0;
  const scores = results.map(r => r.nutrientUtilization);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function generateOptimizationTips(results: AbsorptionResult[], interactions: PairInteraction[]): string[] {
  const tips: string[] = [];

  const lowUtil = results.filter(r => r.nutrientUtilization < 40);
  if (lowUtil.length > 0) {
    tips.push(`These nutrients have low utilization: ${lowUtil.map(r => r.nutrientName).join(', ')}. Consider form or timing adjustments.`);
  }

  const conflicts = interactions.filter(i => i.effect === 'negative' || i.effect === 'competition');
  if (conflicts.length > 0) {
    tips.push(`${conflicts.length} negative interaction(s) detected. Follow timing advice to minimize.`);
  }

  const synergies = interactions.filter(i => i.effect === 'positive');
  if (synergies.length > 0) {
    tips.push(`${synergies.length} positive synergy(s) found. Taking these together may enhance absorption.`);
  }

  if (results.some(r => r.timingEfficiency < 90)) {
    tips.push('Adjust supplement timing to match nutrient-specific optimal windows (morning/fat/evening).');
  }

  tips.push('Space competing minerals (iron, zinc, calcium, magnesium) by 2+ hours for best absorption.');

  return tips;
}

export function analyzeFullAbsorption(
  supplements: { name: string; nutrients?: string[]; timeOfDay?: string }[],
  mealFoods: string[]
): AbsorptionAnalysis {
  const results: AbsorptionResult[] = [];
  const allItems: { name: string; nutrients?: NutrientName[] }[] = [];

  for (const supp of supplements) {
    const nutList: NutrientName[] = [];
    for (const n of (supp.nutrients || [supp.name])) {
      const nut = n as NutrientName;
      if (ALL_NUTRIENTS.includes(nut)) {
        nutList.push(nut);
        const result = analyzeAbsorption(supp.name, nut, mealFoods, supp.timeOfDay || 'morning_food');
        results.push(result);
      }
    }
    allItems.push({ name: supp.name, nutrients: nutList });
  }

  const interactions = analyzePairInteractions(allItems);
  const overallScore = getOverallAbsorptionScore(results);
  const optimizationTips = generateOptimizationTips(results, interactions);

  return {
    supplements: results,
    interactions,
    overallScore,
    optimizationTips,
  };
}
