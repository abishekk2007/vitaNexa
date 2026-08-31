// Enterprise AI Coach V2 — context-aware coaching with memory

import { parseMeal, MealParseResult, NutrientName, ALL_NUTRIENTS, NUTRIENT_LABELS, NUTRIENT_UNITS } from './nutritionEngine';

export interface CoachMemory {
  userId: string;
  goals: string[];
  dietPreferences: string[];
  supplementNames: string[];
  recentMeals: string[];
  recentNutrients: string[];
  healthScores: { date: string; score: number }[];
  lastQuestions: { q: string; a: string; timestamp: number }[];
  mealHistory: { date: string; foods: string; nutrients: string[] }[];
}

export interface CoachResponse {
  answer: string;
  reasoning?: string;
  suggestions?: string[];
  recommendations?: { type: string; text: string; priority: 'high' | 'medium' | 'low' }[];
  disclaimer: string;
}

export class AICoachService {
  private memory: CoachMemory;

  constructor(memory: Partial<CoachMemory>) {
    this.memory = {
      userId: memory.userId || '',
      goals: memory.goals || [],
      dietPreferences: memory.dietPreferences || [],
      supplementNames: memory.supplementNames || [],
      recentMeals: memory.recentMeals || [],
      recentNutrients: memory.recentNutrients || [],
      healthScores: memory.healthScores || [],
      lastQuestions: memory.lastQuestions || [],
      mealHistory: memory.mealHistory || [],
    };
  }

  answerQuestion(question: string): CoachResponse {
    const q = question.toLowerCase();

    // Check memory for context
    const recentContext = this.getRecentContext();

    // Meal analysis
    if (q.includes('meal') || q.includes('eat') || q.includes('food') || q.includes('diet')) {
      return this.analyzeMealQuestion(q);
    }

    // Nutrient gap detection
    if (q.includes('nutrient') || q.includes('vitamin') || q.includes('mineral') || q.includes('deficien') || q.includes('gap')) {
      return this.detectNutrientGaps();
    }

    // Supplement suggestions
    if (q.includes('supplement') || q.includes('should i take') || q.includes('what should') || q.includes('recommend')) {
      return this.suggestSupplements();
    }

    // Meal suggestions
    if (q.includes('suggest') || q.includes('recipe') || q.includes('cook') || q.includes('what to eat') || q.includes('breakfast') || q.includes('lunch') || q.includes('dinner')) {
      return this.suggestMeals(q);
    }

    // Deficiency prediction
    if (q.includes('deficien') || q.includes('risk') || q.includes('lack') || q.includes('missing')) {
      return this.predictDeficiencies();
    }

    // Food pairing
    if (q.includes('pair') || q.includes('combine') || q.includes('with') || q.includes('together')) {
      return this.suggestFoodPairing(q);
    }

    // Absorption optimization
    if (q.includes('absorb') || q.includes('bioavailab') || q.includes('timing') || q.includes('when')) {
      return this.optimizeAbsorption(q);
    }

    // Recovery
    if (q.includes('recover') || q.includes('heal') || q.includes('repair') || q.includes('rest')) {
      return this.recoverRecommendations();
    }

    // Lifestyle coaching
    if (q.includes('lifestyle') || q.includes('habit') || q.includes('routine') || q.includes('exercise') || q.includes('sleep') || q.includes('stress')) {
      return this.lifestyleCoaching(q);
    }

    // General/fallback
    return this.generalGuidance(recentContext);
  }

  private getRecentContext(): string {
    const parts: string[] = [];
    if (this.memory.goals.length > 0) parts.push(`Your goals: ${this.memory.goals.join(', ')}.`);
    if (this.memory.dietPreferences.length > 0) parts.push(`Diet: ${this.memory.dietPreferences.join(', ')}.`);
    if (this.memory.supplementNames.length > 0) parts.push(`Supplements: ${this.memory.supplementNames.join(', ')}.`);
    if (this.memory.recentNutrients.length > 0) parts.push(`Recent nutrients: ${this.memory.recentNutrients.slice(0, 5).join(', ')}.`);
    return parts.join(' ');
  }

  private analyzeMealQuestion(q: string): CoachResponse {
    // Parse any food mention from the question
    const foodWords = q.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w =>
      !['what', 'should', 'eat', 'meal', 'food', 'diet', 'you', 'i', 'my', 'the', 'a', 'an', 'is', 'are', 'for', 'and', 'or', 'of', 'in', 'to', 'with', 'about', 'tell', 'me', 'analyze', 'analysis'].includes(w)
    );
    let parseResult: MealParseResult | null = null;
    if (foodWords.length > 0) {
      parseResult = parseMeal(foodWords.join(', '));
    }

    if (parseResult && parseResult.foods.length > 0) {
      const foodNames = parseResult.foods.map(f => f.name).join(', ');
      const nutrients = Object.keys(parseResult.nutrients).slice(0, 8);
      return {
        answer: `Meal Analysis for "${foodNames}":\n\nDetected ${parseResult.foods.length} food(s).\nKey nutrients: ${nutrients.map(n => `${NUTRIENT_LABELS[n as NutrientName] || n}`).join(', ')}.\nConfidence: ${Math.round(parseResult.confidence * 100)}%.`,
        reasoning: 'Analyzed via Nutrition Engine V3 with NLP food parsing and 32-nutrient database.',
        suggestions: [
          'Try adding a source of Vitamin C to enhance iron absorption.',
          'Consider pairing with healthy fats for fat-soluble vitamin absorption.',
          'Log your meals consistently to get better personalized insights.',
        ],
        disclaimer: 'Analysis based on estimated nutrient content. Individual needs vary.',
      };
    }

    const meals = this.memory.recentMeals;
    if (meals.length > 0) {
      return {
        answer: `Based on your recent meals: ${meals.slice(0, 3).join(', ')}${meals.length > 3 ? ` and ${meals.length - 3} more` : ''}.\n\nYou have ${this.memory.recentNutrients.length} unique nutrients tracked. ${this.memory.recentNutrients.length < 15 ? 'Consider diversifying your food choices to cover more micronutrients.' : 'Good nutrient diversity detected!'}`,
        suggestions: [
          'Log at least 3 meals per day for accurate tracking.',
          'Include a variety of colorful vegetables for phytonutrients.',
          'Track supplements to get complete nutrient picture.',
        ],
        disclaimer: 'Meal analysis uses estimated nutrient profiles. Individual needs vary.',
      };
    }

    return {
      answer: 'To analyze your meals, please describe what you ate (e.g., "Oats with milk, banana and eggs" or "Rice, dal and spinach"). I can detect nutrients from food descriptions!',
      suggestions: [
        'Try describing a meal in detail with ingredients.',
        'Use commas to separate different foods.',
        'Include quantities for more accurate analysis.',
      ],
      disclaimer: 'I can help analyze meals but cannot provide medical dietary advice.',
    };
  }

  private detectNutrientGaps(): CoachResponse {
    const recent = this.memory.recentNutrients;
    const allNutrients = ALL_NUTRIENTS;
    const missing = allNutrients.filter(n => !recent.includes(n));

    if (missing.length === 0) {
      return {
        answer: 'Great news! Based on your logged data, you are covering all 32 tracked nutrients. Keep up the diverse eating!',
        disclaimer: 'This analysis is based on logged food and supplement entries.',
      };
    }

    const criticalGaps = missing.filter(n =>
      ['vitamin_d', 'vitamin_b12', 'iron', 'calcium', 'magnesium', 'zinc', 'omega3'].includes(n)
    );
    const gapNames = missing.slice(0, 10).map(n => NUTRIENT_LABELS[n as NutrientName] || n);

    const suggestions: string[] = [];
    if (criticalGaps.includes('vitamin_d')) suggestions.push('Spend 15-20 min in sunlight or consider fortified foods.');
    if (criticalGaps.includes('iron')) suggestions.push('Include red meat, lentils, or spinach. Pair with Vitamin C.');
    if (criticalGaps.includes('calcium')) suggestions.push('Add dairy, fortified alternatives, or leafy greens.');
    if (criticalGaps.includes('magnesium')) suggestions.push('Eat nuts, seeds, dark chocolate, and leafy greens.');
    if (criticalGaps.includes('zinc')) suggestions.push('Include pumpkin seeds, chickpeas, or lean meat.');
    if (criticalGaps.includes('omega3')) suggestions.push('Eat fatty fish 2x/week or add flax/chia seeds.');
    if (criticalGaps.includes('vitamin_b12')) suggestions.push('Include animal products or consider fortified foods.');

    return {
      answer: `Nutrient Gap Analysis:\n\nPotential gaps detected in ${missing.length} of ${allNutrients.length} nutrients.\n\nMost critical: ${criticalGaps.map(n => NUTRIENT_LABELS[n as NutrientName]).join(', ') || 'None identified'}.\n\nGaps by category: ${gapNames.join(', ')}${missing.length > 10 ? ` and ${missing.length - 10} more` : ''}.`,
      reasoning: 'Compared your logged nutrients against recommended coverage.',
      suggestions,
      recommendations: criticalGaps.map(n => ({
        type: 'nutrient',
        text: `${NUTRIENT_LABELS[n as NutrientName]} — ${this.getDeficiencyAdvice(n)}`,
        priority: 'high' as const,
      })),
      disclaimer: 'This is an estimated analysis. Consult a healthcare provider for blood tests.',
    };
  }

  private suggestSupplements(): CoachResponse {
    const current = this.memory.supplementNames;
    const gaps = ALL_NUTRIENTS.filter(n => !this.memory.recentNutrients.includes(n));
    const criticalMissing = gaps.filter(n =>
      ['vitamin_d', 'vitamin_b12', 'iron', 'omega3', 'magnesium'].includes(n)
    );

    const suggestions: string[] = [];
    if (criticalMissing.includes('vitamin_d') && !current.some(s => s.toLowerCase().includes('vitamin d'))) {
      suggestions.push('Vitamin D3 — especially important if limited sun exposure.');
    }
    if (criticalMissing.includes('vitamin_b12') && !current.some(s => s.toLowerCase().includes('b12'))) {
      suggestions.push('Vitamin B12 — important for vegans/vegetarians.');
    }
    if (criticalMissing.includes('omega3') && !current.some(s => s.toLowerCase().includes('omega'))) {
      suggestions.push('Omega-3 (EPA/DHA) — supports brain and heart health.');
    }
    if (criticalMissing.includes('magnesium') && !current.some(s => s.toLowerCase().includes('magnesium'))) {
      suggestions.push('Magnesium glycinate — supports sleep, stress, and muscles.');
    }

    if (suggestions.length === 0 && current.length > 0) {
      return {
        answer: `You currently take ${current.length} supplement(s): ${current.join(', ')}.\nBased on your profile, your current regimen covers the most critical nutrients. Focus on consistency rather than adding more.`,
        suggestions: ['Consider a high-quality multivitamin for general coverage.', 'Log your supplements regularly for accurate analysis.'],
        disclaimer: 'Supplement suggestions are informational only. Consult your doctor before starting any supplement.',
      };
    }

    return {
      answer: `Based on your logged data, here are supplements you may want to discuss with your healthcare provider:\n\n${suggestions.map(s => `• ${s}`).join('\n')}`,
      reasoning: 'Identified potential nutrient gaps from your food logs and cross-referenced with current supplements.',
      suggestions: [
        'Start with one supplement at a time to assess tolerance.',
        'Choose third-party tested brands for quality.',
        'Always take supplements as directed on the label.',
      ],
      disclaimer: 'Supplement suggestions are informational only. Consult your doctor before starting any supplement.',
    };
  }

  private suggestMeals(q: string): CoachResponse {
    const preferences = this.memory.dietPreferences;
    const dietType = preferences.includes('vegan') ? 'vegan' :
      preferences.includes('vegetarian') ? 'vegetarian' :
      preferences.includes('keto') ? 'keto' : 'balanced';

    const mealTime = q.includes('breakfast') ? 'breakfast' :
      q.includes('lunch') ? 'lunch' :
      q.includes('dinner') ? 'dinner' : 'snack';

    const suggestions: Record<string, Record<string, string[]>> = {
      balanced: {
        breakfast: ['Oatmeal with berries, nuts and milk', 'Scrambled eggs with spinach and whole-grain toast', 'Greek yogurt parfait with granola and banana'],
        lunch: ['Grilled chicken salad with quinoa and avocado', 'Lentil soup with whole-grain bread', 'Brown rice bowl with chickpeas, veggies and tahini'],
        dinner: ['Salmon with roasted sweet potato and broccoli', 'Stir-fried tofu with vegetables and brown rice', 'Lean beef with sautéed kale and quinoa'],
        snack: ['Apple slices with almond butter', 'Mixed nuts and dark chocolate', 'Hummus with carrot and cucumber sticks'],
      },
      vegetarian: {
        breakfast: ['Oatmeal with berries and flax seeds', 'Vegetable omelette with whole-grain toast', 'Smoothie bowl with spinach, banana, and plant protein'],
        lunch: ['Quinoa bowl with roasted vegetables and chickpeas', 'Dal with brown rice and sautéed greens', 'Caprese salad with whole-grain bread'],
        dinner: ['Paneer curry with spinach and brown rice', 'Lentil bolognese with whole-wheat pasta', 'Stuffed bell peppers with quinoa and black beans'],
        snack: ['Trail mix with nuts and dried fruit', 'Greek yogurt with honey and walnuts', 'Edamame with sea salt'],
      },
      vegan: {
        breakfast: ['Smoothie with plant milk, banana, spinach and chia', 'Overnight oats with plant milk and berries', 'Avocado toast on whole-grain bread'],
        lunch: ['Buddha bowl with quinoa, chickpeas, and tahini dressing', 'Lentil soup with whole-grain bread', 'Brown rice sushi with avocado and cucumber'],
        dinner: ['Vegan chili with kidney beans and sweet potato', 'Stir-fried tofu with vegetables and brown rice', 'Curried chickpeas with spinach and quinoa'],
        snack: ['Hummus with vegetable sticks', 'Mixed nuts and dried fruit', 'Smoothie with plant protein'],
      },
    };

    const mealIdeas = (suggestions[dietType] || suggestions.balanced)[mealTime] || suggestions.balanced.breakfast;

    return {
      answer: `Here are ${mealTime} ideas for your ${dietType} diet:\n\n${mealIdeas.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n${this.memory.recentMeals.length > 0 ? `Recently you ate: ${this.memory.recentMeals.slice(0, 3).join(', ')}. Try something different today!` : 'Start logging your meals for personalized suggestions.'}`,
      suggestions: [
        'Include protein at every meal for satiety.',
        'Add healthy fats for nutrient absorption.',
        'Eat a rainbow of vegetables for diverse phytonutrients.',
      ],
      disclaimer: 'These are general suggestions. Adjust based on your specific health needs.',
    };
  }

  private predictDeficiencies(): CoachResponse {
    const recent = this.memory.recentNutrients;
    const highRisk = ALL_NUTRIENTS.filter(n => !recent.includes(n)).filter(n =>
      ['vitamin_d', 'vitamin_b12', 'iron', 'calcium', 'magnesium', 'zinc', 'omega3', 'iodine'].includes(n)
    );
    const moderateRisk = ALL_NUTRIENTS.filter(n => !recent.includes(n)).filter(n =>
      ['vitamin_a', 'vitamin_c', 'vitamin_k', 'potassium', 'selenium', 'folate', 'vitamin_b6'].includes(n)
    );

    return {
      answer: `Deficiency Risk Assessment:\n\nHigh Risk (8 nutrients): ${highRisk.map(n => NUTRIENT_LABELS[n as NutrientName]).join(', ')}\nModerate Risk (${moderateRisk.length}): ${moderateRisk.map(n => NUTRIENT_LABELS[n as NutrientName]).join(', ')}\n\n${highRisk.length === 0 ? 'Your current diet appears to cover most critical nutrients.' : `${highRisk.length} high-risk nutrients identified. Consider dietary adjustments.`}`,
      reasoning: 'Risk levels determined by absence of these nutrients in your logged meals and supplements.',
      recommendations: [
        ...highRisk.map(n => ({ type: 'deficiency' as const, text: `${NUTRIENT_LABELS[n as NutrientName]} — ${this.getDeficiencyAdvice(n)}`, priority: 'high' as const })),
        ...moderateRisk.slice(0, 3).map(n => ({ type: 'deficiency' as const, text: `${NUTRIENT_LABELS[n as NutrientName]} — ${this.getDeficiencyAdvice(n)}`, priority: 'medium' as const })),
      ],
      disclaimer: 'This is an estimated risk based on food logging. Not a substitute for blood tests or medical diagnosis.',
    };
  }

  private suggestFoodPairing(q: string): CoachResponse {
    return {
      answer: `Food Pairing Optimization:\n\nPositive Pairs:\n• Iron + Vitamin C: Pair spinach/beans with citrus/peppers\n• Vitamin D + Fat: Take with eggs/avocado/nuts\n• Calcium + Vitamin D: Dairy + sunlight or supplement\n• Turmeric + Black Pepper: Piperine boosts absorption 2000%\n\nAvoid:\n• Iron + Tea/Coffee: Tannins reduce iron absorption\n• Calcium + Iron: Take at separate meals\n• Zinc + High-dose Calcium: Space by 2 hours`,
      suggestions: [
        'Pair iron-rich foods with Vitamin C sources.',
        'Include healthy fats with fat-soluble vitamins (A, D, E, K).',
        'Space competing minerals by 2+ hours.',
      ],
      disclaimer: 'General food pairing guidance. Individual responses may vary.',
    };
  }

  private optimizeAbsorption(q: string): CoachResponse {
    const supps = this.memory.supplementNames;
    return {
      answer: `Absorption Optimization:\n\n${supps.length > 0 ? `Based on your supplements (${supps.join(', ')}):` : 'Your supplements will determine specific timing advice.'}\n\nGeneral Guidelines:\n• Fat-soluble vitamins (A, D, E, K): Take with a meal containing fat\n• Iron: Morning on empty stomach or with Vitamin C, avoid tea/coffee\n• Calcium: Evening with food, avoid taking with iron\n• Magnesium: Evening before bed for relaxation\n• Zinc: With protein-rich meal\n• B12: Morning on empty stomach`,
      suggestions: [
        'Take supplements at consistent times daily.',
        'Use a pill organizer to track compliance.',
        'Set reminders for optimal timing windows.',
      ],
      disclaimer: 'Timing suggestions based on general absorption science.',
    };
  }

  private recoverRecommendations(): CoachResponse {
    return {
      answer: `Recovery Recommendations:\n\nTo support recovery, focus on:\n1. Protein intake (1.6-2.2g/kg body weight for muscle recovery)\n2. Anti-inflammatory foods (berries, turmeric, fatty fish)\n3. Magnesium for muscle relaxation and sleep\n4. Adequate hydration (2-3L water per day)\n5. Sleep (7-9 hours for optimal recovery)\n6. Omega-3 fatty acids for reducing inflammation`,
      suggestions: [
        'Include protein within 2 hours after exercise.',
        'Tart cherry juice may support muscle recovery.',
        'Contrast showers (hot/cold) may reduce soreness.',
      ],
      disclaimer: 'Recovery needs vary by individual. Listen to your body.',
    };
  }

  private lifestyleCoaching(q: string): CoachResponse {
    return {
      answer: `Lifestyle Optimization:\n\nBuilding sustainable habits is key to long-term health.\n\nSleep: Aim for 7-9 hours. Consistent sleep schedule improves hormone function.\nStress: Deep breathing (4-7-8 method) activates parasympathetic nervous system.\nExercise: Mix strength (2x/week) + cardio (150 min/week) + mobility.\nHydration: Start day with 500ml water. Total 2-3L depending on activity.\nNutrition: Prioritize whole foods, adequate protein, fiber (25-30g/day).\n\nSmall, consistent changes outperform drastic overhauls.`,
      suggestions: [
        'Start with one habit change at a time (e.g., 10-min morning walk).',
        'Use habit stacking: attach new habits to existing routines.',
        'Track streaks to maintain motivation.',
      ],
      disclaimer: 'General lifestyle guidance. Not medical advice.',
    };
  }

  private generalGuidance(context: string): CoachResponse {
    return {
      answer: `I'm your AI Health Coach powered by VitaNexa Enterprise Analytics.\n\n${context || 'I can help you with:'}\n\n• Meal analysis — describe what you ate\n• Nutrient gap detection — find missing nutrients\n• Supplement suggestions — based on your diet\n• Meal ideas — tailored to your preferences\n• Deficiency risk prediction — early warning\n• Food pairing — maximize absorption\n• Absorption optimization — timing advice\n• Recovery recommendations — post-workout\n• Lifestyle coaching — sleep, stress, exercise\n\nWhat would you like to explore today?`,
      suggestions: [
        'Try: "Analyze my lunch: rice, dal and spinach"',
        'Try: "What nutrients am I missing?"',
        'Try: "Suggest supplements for my diet"',
        'Try: "Give me breakfast ideas"',
      ],
      disclaimer: 'I provide informational guidance only. Not a substitute for professional medical advice.',
    };
  }

  private getDeficiencyAdvice(nutrient: string): string {
    const advice: Record<string, string> = {
      vitamin_d: 'Sunlight 15-20 min/day, fatty fish, fortified foods, or supplement D3.',
      vitamin_b12: 'Animal products (meat, eggs, dairy), fortified nutritional yeast, or B12 supplement.',
      iron: 'Red meat, lentils, spinach. Pair with Vitamin C. Avoid tea/coffee with meals.',
      calcium: 'Dairy, fortified plant milks, leafy greens, tofu, or almonds.',
      magnesium: 'Nuts, seeds, dark chocolate, leafy greens, whole grains, or magnesium supplement.',
      zinc: 'Pumpkin seeds, chickpeas, nuts, meat, or zinc supplement.',
      omega3: 'Fatty fish (salmon, mackerel, sardines) 2x/week, flax/chia seeds, or fish oil.',
      iodine: 'Seaweed, iodized salt, fish, or dairy.',
      selenium: 'Brazil nuts (1-2/day), tuna, sardines, eggs.',
      potassium: 'Bananas, potatoes, avocados, spinach, beans.',
      vitamin_a: 'Sweet potato, carrots, spinach, liver, mango.',
      vitamin_c: 'Citrus fruits, bell peppers, broccoli, strawberries.',
      folate: 'Leafy greens, legumes, asparagus, fortified grains.',
      vitamin_b6: 'Chicken, fish, potatoes, chickpeas, bananas.',
    };
    return advice[nutrient] || 'Include a variety of whole foods to cover this nutrient.';
  }
}

export function createCoachResponse(memory: Partial<CoachMemory>, question: string): CoachResponse {
  const coach = new AICoachService(memory);
  return coach.answerQuestion(question);
}
