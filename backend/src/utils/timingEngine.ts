import { PrismaClient } from '@prisma/client';
import { foodNutrientMap, supplementGuidance, commonFoodNames } from './foodNutrientData';

const prisma = new PrismaClient();

interface SupplementInput {
  id: string;
  name: string;
  dosage?: string | null;
  dosageValue?: number | null;
  dosageUnit?: string | null;
  timeOfDay?: string | null;
  frequency?: string | null;
}

interface MealEntry {
  id: string;
  mealTime: Date | string;
  foods: string;
  nutrientTags?: string | null;
  calories?: number | null;
  macros?: string | null;
}

interface DetailedAnalysis {
  supplementId: string;
  supplementName: string;
  mayImproveAbsorption: { interactsWith: string; description: string; citationUrl?: string | null }[];
  mayReduceAbsorption: { interactsWith: string; description: string; severity: string; citationUrl?: string | null }[];
  bestTimeToTake: string;
  foodsToPair: { food: string; reason: string }[];
  foodsToAvoid: { food: string; reason: string }[];
  reasoning: string;
  severity: string;
}

interface InteractionSummary {
  supplementA: string;
  supplementB: string;
  effect: string;
  severity: string;
  description: string;
  timingFix: string;
  citationUrl?: string | null;
}

interface MealAnalysis {
  mealId: string;
  foods: string;
  detectedNutrients: string[];
  conflictsWithSupplements: { supplementName: string; issue: string }[];
  boostsWithSupplements: { supplementName: string; reason: string }[];
}

interface CoachResponse {
  answer: string;
  disclaimer: string;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[_-]/g, ' ').trim();
}

function getFoodKeys(foodInput: string): string[] {
  const keys: string[] = [];
  const parts = foodInput.split(/[,;]/).map((p) => p.trim().toLowerCase().replace(/\s+/g, '_'));
  for (const part of parts) {
    if (commonFoodNames[part]) {
      keys.push(...commonFoodNames[part]);
    } else if (foodNutrientMap[part]) {
      keys.push(part);
    }
  }
  return [...new Set(keys)];
}

function getNutrientsFromFoods(foodInput: string): string[] {
  const nutrients = new Set<string>();
  const foodKeys = getFoodKeys(foodInput);
  for (const key of foodKeys) {
    const mapped = foodNutrientMap[key];
    if (mapped) mapped.forEach((n) => nutrients.add(n));
  }
  return [...nutrients];
}

function getDetectedFoodNames(foodInput: string): string[] {
  const keys = getFoodKeys(foodInput);
  return keys.map((k) => k.replace(/_/g, ' '));
}

function matchSuppGuidance(suppName: string) {
  const n = normalizeName(suppName);
  return supplementGuidance[n] || supplementGuidance[n.replace(/\s+/g, '-')] || null;
}

export async function generateDetailedAnalysis(
  userId: string,
  supplements: SupplementInput[],
  meals: MealEntry[]
): Promise<{
  analyses: DetailedAnalysis[];
  interactionSummary: InteractionSummary[];
  mealAnalyses: MealAnalysis[];
  warnings: string[];
  disclaimer: string;
}> {
  const warnings: string[] = [];
  const analyses: DetailedAnalysis[] = [];
  const interactionSummary: InteractionSummary[] = [];
  const mealAnalyses: MealAnalysis[] = [];

  const allInteractions = await prisma.supplementInteraction.findMany();
  const recentMeals = meals.slice(0, 10);
  const allMealNutrients = new Set<string>();
  const mealFoodSets: { mealId: string; foods: string; nutrients: Set<string> }[] = [];

  for (const meal of recentMeals) {
    const detected = getNutrientsFromFoods(meal.foods);
    const nutrientSet = new Set(detected);
    if (meal.nutrientTags) {
      try {
        const tags: string[] = JSON.parse(meal.nutrientTags);
        tags.forEach((t) => nutrientSet.add(t.toLowerCase()));
      } catch { }
    }
    nutrientSet.forEach((n) => allMealNutrients.add(n));
    mealFoodSets.push({ mealId: meal.id, foods: meal.foods, nutrients: nutrientSet });
  }

  for (const supp of supplements) {
    const suppName = supp.name;
    const suppNameL = suppName.toLowerCase();
    const guidance = matchSuppGuidance(suppName);

    const rules = allInteractions.filter(
      (i) => i.supplementName.toLowerCase() === suppNameL
    );
    const otherRules = allInteractions.filter(
      (i) => i.interactsWith.toLowerCase() === suppNameL
    );

    const mayImprove: DetailedAnalysis['mayImproveAbsorption'] = [];
    const mayReduce: DetailedAnalysis['mayReduceAbsorption'] = [];

    for (const rule of rules) {
      const parsed = {
        interactsWith: rule.interactsWith,
        description: rule.description || '',
        citationUrl: rule.citationUrl,
        severity: rule.severity,
      };
      if (rule.effect === 'IMPROVES_ABSORPTION') {
        mayImprove.push(parsed);
      } else {
        mayReduce.push(parsed);
      }
    }

    const foodsToPair: DetailedAnalysis['foodsToPair'] = [];
    const foodsToAvoid: DetailedAnalysis['foodsToAvoid'] = [];

    if (guidance) {
      for (const fk of guidance.foodsToPair) {
        const foodName = fk.replace(/_/g, ' ');
        const nutrients = foodNutrientMap[fk] || [];
        foodsToPair.push({
          food: foodName,
          reason: `Contains ${nutrients.slice(0, 3).join(', ')} which may pair well with ${suppName}`,
        });
      }
      for (const fk of guidance.foodsToAvoid) {
        foodsToAvoid.push({
          food: fk.replace(/_/g, ' '),
          reason: `May reduce absorption of ${suppName} when taken together`,
        });
      }
    }

    for (const meal of mealFoodSets) {
      for (const nutrient of meal.nutrients) {
        const avoidRules = rules.filter(
          (r) => r.effect === 'REDUCES_ABSORPTION' && r.itemBType === 'food_tag' && r.interactsWith.toLowerCase() === nutrient
        );
        if (avoidRules.length > 0 && !foodsToAvoid.some((f) => f.food === nutrient)) {
          foodsToAvoid.push({
            food: nutrient.replace(/_/g, ' '),
            reason: `${suppName} may reduce absorption when taken with foods containing ${nutrient}`,
          });
        }

        const boostRules = rules.filter(
          (r) => r.effect === 'IMPROVES_ABSORPTION' && r.itemBType === 'food_tag' && r.interactsWith.toLowerCase() === nutrient
        );
        if (boostRules.length > 0 && !foodsToPair.some((f) => f.food === nutrient)) {
          foodsToPair.push({
            food: nutrient.replace(/_/g, ' '),
            reason: `${nutrient} may improve absorption of ${suppName}`,
          });
        }
      }
    }

    analyses.push({
      supplementId: supp.id,
      supplementName: suppName,
      mayImproveAbsorption: mayImprove,
      mayReduceAbsorption: mayReduce,
      bestTimeToTake: guidance?.bestTimeToTake || 'With a meal for general absorption',
      foodsToPair,
      foodsToAvoid,
      reasoning: guidance?.reasoning || 'General guidance: taking supplements with food may improve tolerance and absorption.',
      severity: mayReduce.length > 0 ? 'MEDIUM' : mayImprove.length > 0 ? 'LOW' : 'LOW',
    });
  }

  for (const supp of supplements) {
    const suppNameL = supp.name.toLowerCase();
    for (const other of supplements) {
      if (other.id === supp.id) continue;
      const otherNameL = other.name.toLowerCase();
      const rule = allInteractions.find(
        (i) =>
          (i.supplementName.toLowerCase() === suppNameL && i.interactsWith.toLowerCase() === otherNameL) ||
          (i.supplementName.toLowerCase() === otherNameL && i.interactsWith.toLowerCase() === suppNameL)
      );
      if (rule) {
        interactionSummary.push({
          supplementA: supp.name,
          supplementB: other.name,
          effect: rule.effect,
          severity: rule.severity,
          description: rule.description || `Interaction between ${supp.name} and ${other.name}`,
          timingFix: rule.suggestedTimingFix || 'Space by at least 2 hours',
          citationUrl: rule.citationUrl,
        });
      }
    }
  }

  for (const meal of mealFoodSets) {
    const conflicts: MealAnalysis['conflictsWithSupplements'] = [];
    const boosts: MealAnalysis['boostsWithSupplements'] = [];

    const detectedNames = getDetectedFoodNames(meal.foods);

    for (const supp of supplements) {
      const suppNameL = supp.name.toLowerCase();
      const rules = allInteractions.filter(
        (i) => i.supplementName.toLowerCase() === suppNameL || i.interactsWith.toLowerCase() === suppNameL
      );

      for (const nutrient of meal.nutrients) {
        const conflictRule = rules.find(
          (r) =>
            (r.supplementName.toLowerCase() === suppNameL && r.interactsWith.toLowerCase() === nutrient && r.effect === 'REDUCES_ABSORPTION') ||
            (r.interactsWith.toLowerCase() === suppNameL && r.supplementName.toLowerCase() === nutrient && r.effect === 'IMPROVES_ABSORPTION')
        );
        if (conflictRule) {
          conflicts.push({
            supplementName: supp.name,
            issue: `${meal.foods.split(',')[0]?.trim() || 'Meal'} contains ${nutrient} which may reduce absorption of ${supp.name}. ${conflictRule.suggestedTimingFix ? 'Consider: ' + conflictRule.suggestedTimingFix : ''}`,
          });
        }

        const boostRule = rules.find(
          (r) =>
            (r.supplementName.toLowerCase() === suppNameL && r.interactsWith.toLowerCase() === nutrient && r.effect === 'IMPROVES_ABSORPTION') ||
            (r.interactsWith.toLowerCase() === suppNameL && r.supplementName.toLowerCase() === nutrient && r.effect === 'REDUCES_ABSORPTION')
        );
        if (boostRule) {
          boosts.push({
            supplementName: supp.name,
            reason: `${meal.foods.split(',')[0]?.trim() || 'Meal'} contains ${nutrient} which may improve absorption of ${supp.name}.`,
          });
        }
      }
    }

    mealAnalyses.push({
      mealId: meal.mealId,
      foods: meal.foods,
      detectedNutrients: [...meal.nutrients],
      conflictsWithSupplements: conflicts,
      boostsWithSupplements: boosts,
    });
  }

  return {
    analyses,
    interactionSummary,
    mealAnalyses,
    warnings,
    disclaimer: 'General educational guidance only. These suggestions may not apply to everyone. Consult your healthcare provider.',
  };
}

export async function getCoachExplanation(
  userId: string,
  question: string
): Promise<CoachResponse> {
  const q = question.toLowerCase();
  const supplements = await prisma.supplement.findMany({ where: { userId } });

  const matchedSupp = supplements.find(
    (s) => q.includes(s.name.toLowerCase())
  );

  if (matchedSupp) {
    const guidance = matchSuppGuidance(matchedSupp.name);
    if (guidance) {
      let answer = '';
      if (q.includes('breakfast') || q.includes('morning') || q.includes('time') || q.includes('when')) {
        answer = `${matchedSupp.name}: ${guidance.bestTimeToTake}. ${guidance.reasoning}`;
      } else if (q.includes('food') || q.includes('eat') || q.includes('pair')) {
        const foodNames = guidance.foodsToPair.map((f) => f.replace(/_/g, ' ')).join(', ');
        answer = `${matchedSupp.name} may absorb better when paired with foods like ${foodNames}. ${guidance.reasoning}`;
      } else if (q.includes('avoid') || q.includes('bad')) {
        if (guidance.foodsToAvoid.length > 0) {
          const avoidNames = guidance.foodsToAvoid.map((f) => f.replace(/_/g, ' ')).join(', ');
          answer = `${matchedSupp.name} may reduce absorption when taken with ${avoidNames}. Consider spacing intake by 2 hours.`;
        } else {
          answer = `${matchedSupp.name} generally does not have known food conflicts. ${guidance.reasoning}`;
        }
      } else {
        answer = `${matchedSupp.name}: ${guidance.reasoning} Best time: ${guidance.bestTimeToTake}.`;
      }
      return {
        answer,
        disclaimer: 'For personal medical advice, talk with your doctor or pharmacist.',
      };
    }
  }

  const generalAnswers: Record<string, string> = {
    'vitamin d': 'Vitamin D is fat-soluble and may improve absorption when taken with a meal containing dietary fat.',
    iron: 'Iron may reduce absorption when taken with calcium, tea, or coffee. Vitamin C may improve iron absorption.',
    calcium: 'Calcium may reduce iron absorption when taken together. Taking with food may improve tolerance.',
    magnesium: 'Magnesium may have a calming effect. Taking in the evening may support sleep quality.',
    zinc: 'Zinc may reduce absorption when taken with high-dose iron or calcium on an empty stomach.',
    'omega-3': 'Omega-3 fatty acids are fat-soluble and may improve absorption when taken with dietary fat.',
  };

  for (const [key, answer] of Object.entries(generalAnswers)) {
    if (q.includes(key)) {
      return {
        answer,
        disclaimer: 'For personal medical advice, talk with your doctor or pharmacist.',
      };
    }
  }

  return {
    answer: 'The Nutrient Absorber Optimizer provides general nutrition guidance based on established nutrition science. I can explain supplement timing, food pairings, and general absorption principles. Try asking about a specific supplement you are taking.',
    disclaimer: 'For personal medical advice, talk with your doctor or pharmacist.',
  };
}

export async function getMealAnalytics(userId: string) {
  const meals = await prisma.mealLog.findMany({
    where: { userId },
    orderBy: { mealTime: 'desc' },
    take: 100,
  });

  const nutrientFrequency: Record<string, number> = {};
  const foodFrequency: Record<string, number> = {};
  let totalCalories = 0;
  let mealsWithCalories = 0;

  for (const meal of meals) {
    const foodKeys = getFoodKeys(meal.foods);
    for (const key of foodKeys) {
      foodFrequency[key.replace(/_/g, ' ')] = (foodFrequency[key.replace(/_/g, ' ')] || 0) + 1;
    }
    const nutrients = getNutrientsFromFoods(meal.foods);
    for (const n of nutrients) {
      nutrientFrequency[n] = (nutrientFrequency[n] || 0) + 1;
    }
    if (meal.nutrientTags) {
      try {
        const tags: string[] = JSON.parse(meal.nutrientTags);
        for (const tag of tags) {
          nutrientFrequency[tag.toLowerCase()] = (nutrientFrequency[tag.toLowerCase()] || 0) + 1;
        }
      } catch { }
    }
    if (meal.calories) {
      totalCalories += meal.calories;
      mealsWithCalories++;
    }
  }

  const sortedNutrients = Object.entries(nutrientFrequency)
    .sort(([, a], [, b]) => b - a)
    .map(([key, count]) => ({ nutrient: key, count }));

  const rdiRefs = await prisma.rdiReference.findMany();
  const rdiMap = new Map(rdiRefs.map((r) => [r.nutrient.toLowerCase(), r]));

  const missedNutrients = rdiRefs
    .map((r) => {
      const found = nutrientFrequency[r.nutrient.toLowerCase()] || 0;
      return {
        nutrient: r.nutrient,
        loggedCount: found,
        rdiTarget: r.rdiValue,
        unit: r.rdiUnit,
        status: found === 0 ? 'likely_gap' as const : found < 3 ? 'borderline' as const : 'on_track' as const,
      };
    })
    .sort((a, b) => a.loggedCount - b.loggedCount);

  const avgCalories = mealsWithCalories > 0 ? Math.round(totalCalories / mealsWithCalories) : 0;

  return {
    totalMeals: meals.length,
    avgCalories,
    mostFrequentFoods: Object.entries(foodFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([food, count]) => ({ food, count })),
    nutrientFrequency: sortedNutrients.slice(0, 15),
    missedNutrients,
    recentDays: meals.length > 0
      ? Math.ceil((Date.now() - new Date(meals[meals.length - 1].mealTime).getTime()) / 86400000) || 1
      : 0,
  };
}

export async function getNutrientDashboard(userId: string) {
  const mealLogs = await prisma.mealLog.findMany({
    where: { userId },
    orderBy: { mealTime: 'desc' },
    take: 50,
  });

  const supplements = await prisma.supplement.findMany({
    where: { userId },
  });

  const rdiRefs = await prisma.rdiReference.findMany();
  const rdiMap = new Map(rdiRefs.map((r) => [r.nutrient.toLowerCase(), r]));

  const nutrientEstimates: Record<string, {
    food: number;
    supplement: number;
    total: number;
    unit: string;
    rdi: number;
    percent: number;
    topSources: string[];
    suggestions: string[];
    status: 'on_track' | 'borderline' | 'likely_gap';
  }> = {};

  for (const rdi of rdiRefs) {
    const key = rdi.nutrient.toLowerCase();
    nutrientEstimates[key] = {
      food: 0,
      supplement: 0,
      total: 0,
      unit: rdi.rdiUnit,
      rdi: rdi.rdiValue,
      percent: 0,
      topSources: [],
      suggestions: [],
      status: 'likely_gap',
    };
  }

  const foodSourceMap: Record<string, Set<string>> = {};
  for (const rdi of rdiRefs) {
    foodSourceMap[rdi.nutrient.toLowerCase()] = new Set();
  }

  for (const meal of mealLogs) {
    const nutrients = getNutrientsFromFoods(meal.foods);
    for (const n of nutrients) {
      if (nutrientEstimates[n]) {
        nutrientEstimates[n].food += 1;
        const foodKeys = getFoodKeys(meal.foods);
        foodKeys.forEach((fk) => {
          if (foodNutrientMap[fk]?.includes(n)) {
            foodSourceMap[n]?.add(fk.replace(/_/g, ' '));
          }
        });
      }
    }
    if (meal.nutrientTags) {
      try {
        const tags: string[] = JSON.parse(meal.nutrientTags);
        for (const tag of tags) {
          const key = tag.toLowerCase();
          if (nutrientEstimates[key]) {
            nutrientEstimates[key].food += 1;
          }
        }
      } catch { }
    }
  }

  for (const supp of supplements) {
    const nameL = supp.name.toLowerCase();
    for (const key of Object.keys(nutrientEstimates)) {
      if (nameL.includes(key) || key.includes(nameL)) {
        nutrientEstimates[key].supplement += 1;
      }
    }
  }

  const suggestionMap: Record<string, string[]> = {
    vitamin_d: ['Spend 15-20 minutes in sunlight daily', 'Eat fatty fish like salmon', 'Consider fortified dairy products'],
    iron: ['Pair with Vitamin C sources (citrus, peppers)', 'Include lean red meat or lentils', 'Avoid tea/coffee near meals'],
    calcium: ['Include dairy or fortified alternatives', 'Add leafy greens like kale', 'Consider tofu or fortified cereals'],
    magnesium: ['Eat nuts, seeds, and dark leafy greens', 'Include whole grains', 'Add dark chocolate occasionally'],
    zinc: ['Include pumpkin seeds or nuts', 'Eat beef or shellfish', 'Add chickpeas or lentils'],
    omega3: ['Eat fatty fish 2x per week', 'Add flax or chia seeds', 'Consider walnuts'],
    b12: ['Include animal products (meat, eggs, dairy)', 'Consider fortified nutritional yeast', 'If vegan, consider supplementation'],
    vitamin_c: ['Eat citrus fruits daily', 'Add bell peppers to meals', 'Include berries and broccoli'],
  };

  for (const [key, est] of Object.entries(nutrientEstimates)) {
    est.total = est.food + est.supplement;
    if (est.rdi > 0) {
      est.percent = Math.min(Math.round((est.total / est.rdi) * 100), 100);
    }
    est.topSources = [...(foodSourceMap[key] || [])].slice(0, 3);
    est.suggestions = suggestionMap[key] || ['Include a variety of nutrient-dense foods'];
    if (est.percent >= 80) est.status = 'on_track';
    else if (est.percent >= 50) est.status = 'borderline';
    else est.status = 'likely_gap';
  }

  const dailyScore = Math.round(
    Object.values(nutrientEstimates).reduce((sum, n) => sum + n.percent, 0) /
    Math.max(Object.keys(nutrientEstimates).length, 1)
  );

  const totalSupplements = supplements.length;
  const totalMeals = mealLogs.length;

  return {
    nutrientEstimates,
    dailyScore,
    totalSupplements,
    totalMeals,
    disclaimer: 'Estimate based on logged food and supplements. Not a medical diagnosis.',
  };
}
