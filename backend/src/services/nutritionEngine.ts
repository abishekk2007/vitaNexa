// Nutrition Engine V3 — Enterprise NLP food parser with 32-nutrient database

export type NutrientName =
  | 'calories' | 'protein' | 'carbohydrates' | 'fat' | 'fiber'
  | 'vitamin_a' | 'vitamin_b1' | 'vitamin_b2' | 'vitamin_b3' | 'vitamin_b5'
  | 'vitamin_b6' | 'vitamin_b7' | 'vitamin_b9' | 'folate' | 'vitamin_b12'
  | 'vitamin_c' | 'vitamin_d' | 'vitamin_e' | 'vitamin_k'
  | 'calcium' | 'iron' | 'zinc' | 'magnesium' | 'potassium'
  | 'selenium' | 'copper' | 'manganese' | 'chromium' | 'iodine'
  | 'choline' | 'omega3' | 'omega6';

export interface FoodNutrientProfile {
  key: string;
  name: string;
  nutrients: Partial<Record<NutrientName, number>>;
}

export interface ParsedFoodResult {
  key: string;
  name: string;
  confidence: number;
  matchedVia: 'exact' | 'fuzzy' | 'synonym' | 'partial' | 'multi_word';
}

export interface MealParseResult {
  foods: ParsedFoodResult[];
  nutrients: Partial<Record<NutrientName, number>>;
  totalNutrients: Partial<Record<NutrientName, { value: number; unit: string }>>;
  confidence: number;
}

const ALL_NUTRIENTS: NutrientName[] = [
  'calories', 'protein', 'carbohydrates', 'fat', 'fiber',
  'vitamin_a', 'vitamin_b1', 'vitamin_b2', 'vitamin_b3', 'vitamin_b5',
  'vitamin_b6', 'vitamin_b7', 'vitamin_b9', 'folate', 'vitamin_b12',
  'vitamin_c', 'vitamin_d', 'vitamin_e', 'vitamin_k',
  'calcium', 'iron', 'zinc', 'magnesium', 'potassium',
  'selenium', 'copper', 'manganese', 'chromium', 'iodine',
  'choline', 'omega3', 'omega6',
];

const NUTRIENT_UNITS: Record<NutrientName, string> = {
  calories: 'kcal', protein: 'g', carbohydrates: 'g', fat: 'g', fiber: 'g',
  vitamin_a: 'mcg', vitamin_b1: 'mg', vitamin_b2: 'mg', vitamin_b3: 'mg', vitamin_b5: 'mg',
  vitamin_b6: 'mg', vitamin_b7: 'mcg', vitamin_b9: 'mcg', folate: 'mcg', vitamin_b12: 'mcg',
  vitamin_c: 'mg', vitamin_d: 'IU', vitamin_e: 'mg', vitamin_k: 'mcg',
  calcium: 'mg', iron: 'mg', zinc: 'mg', magnesium: 'mg', potassium: 'mg',
  selenium: 'mcg', copper: 'mg', manganese: 'mg', chromium: 'mcg', iodine: 'mcg',
  choline: 'mg', omega3: 'g', omega6: 'g',
};

export const NUTRIENT_LABELS: Record<NutrientName, string> = {
  calories: 'Calories', protein: 'Protein', carbohydrates: 'Carbs', fat: 'Fat', fiber: 'Fiber',
  vitamin_a: 'Vitamin A', vitamin_b1: 'Vitamin B1', vitamin_b2: 'Vitamin B2', vitamin_b3: 'Vitamin B3',
  vitamin_b5: 'Vitamin B5', vitamin_b6: 'Vitamin B6', vitamin_b7: 'Vitamin B7', vitamin_b9: 'Vitamin B9',
  folate: 'Folate', vitamin_b12: 'Vitamin B12', vitamin_c: 'Vitamin C', vitamin_d: 'Vitamin D',
  vitamin_e: 'Vitamin E', vitamin_k: 'Vitamin K',
  calcium: 'Calcium', iron: 'Iron', zinc: 'Zinc', magnesium: 'Magnesium', potassium: 'Potassium',
  selenium: 'Selenium', copper: 'Copper', manganese: 'Manganese', chromium: 'Chromium', iodine: 'Iodine',
  choline: 'Choline', omega3: 'Omega-3', omega6: 'Omega-6',
};

export { ALL_NUTRIENTS, NUTRIENT_UNITS };

// ===== ULTRA-EXPANDED FOOD-NUTRIENT DATABASE =====
// Maps food keys to nutrient names (qualitative — contains which nutrients)
// The main FOOD_NUTRIENT_MAP remains unchanged for backward compat; this adds quantitative data.

export const foodNutrientQuantities: Record<string, Partial<Record<NutrientName, number>>> = {
  eggs:           { calories: 155, protein: 13, fat: 11, carbohydrates: 1.1, fiber: 0, vitamin_a: 160, vitamin_b2: 0.5, vitamin_b5: 1.5, vitamin_b6: 0.1, vitamin_b12: 1.1, vitamin_d: 87, vitamin_e: 1, vitamin_k: 0.3, calcium: 50, iron: 1.2, zinc: 1.3, magnesium: 10, potassium: 126, selenium: 30.8, choline: 294, omega3: 0.1, omega6: 1.7 },
  milk:           { calories: 42, protein: 3.4, fat: 1, carbohydrates: 5, fiber: 0, vitamin_a: 46, vitamin_b2: 0.2, vitamin_b5: 0.4, vitamin_b12: 0.5, vitamin_d: 48, calcium: 125, iron: 0, zinc: 0.4, magnesium: 11, potassium: 150, selenium: 3.3, choline: 14.3 },
  banana:         { calories: 89, protein: 1.1, fat: 0.3, carbohydrates: 23, fiber: 2.6, vitamin_b6: 0.4, vitamin_c: 8.7, vitamin_k: 0.5, calcium: 5, iron: 0.3, magnesium: 27, potassium: 358, manganese: 0.3, copper: 0.1, choline: 9.8 },
  oatmeal:        { calories: 68, protein: 2.4, fat: 1.4, carbohydrates: 12, fiber: 1.7, vitamin_b1: 0.1, vitamin_b5: 0.2, iron: 1.1, magnesium: 25, potassium: 70, zinc: 0.5, copper: 0.08, manganese: 0.6, selenium: 5.4 },
  spinach:        { calories: 23, protein: 2.9, fat: 0.4, carbohydrates: 3.6, fiber: 2.2, vitamin_a: 469, vitamin_b2: 0.2, vitamin_b6: 0.2, vitamin_c: 28.1, vitamin_e: 2, vitamin_k: 483, calcium: 99, iron: 2.7, magnesium: 79, potassium: 558, selenium: 1, copper: 0.1, manganese: 0.9, choline: 19.3, omega3: 0.1 },
  almonds:        { calories: 579, protein: 21, fat: 50, carbohydrates: 22, fiber: 12.5, vitamin_b2: 1.1, vitamin_b3: 3.6, vitamin_b6: 0.1, vitamin_e: 25.6, vitamin_k: 0, calcium: 269, iron: 3.7, zinc: 3.1, magnesium: 270, potassium: 733, selenium: 4.1, copper: 1, manganese: 2.3, choline: 52.1, omega3: 0, omega6: 12.3 },
  salmon:         { calories: 208, protein: 20, fat: 13, fiber: 0, vitamin_b2: 0.1, vitamin_b3: 7.9, vitamin_b5: 1.5, vitamin_b6: 0.8, vitamin_b12: 3.2, vitamin_d: 526, vitamin_e: 2.8, vitamin_k: 0.1, calcium: 9, iron: 0.3, zinc: 0.4, magnesium: 27, potassium: 363, selenium: 36.5, choline: 56.3, omega3: 2.6, omega6: 0.4 },
  tuna:           { calories: 130, protein: 29, fat: 0.8, carbohydrates: 0, fiber: 0, vitamin_b3: 11.3, vitamin_b6: 1, vitamin_b12: 2.5, vitamin_d: 82, vitamin_k: 0.2, calcium: 6, iron: 1, zinc: 0.5, magnesium: 28, potassium: 237, selenium: 108, choline: 29.3, omega3: 0.2, omega6: 0 },
  yogurt:         { calories: 59, protein: 10, fat: 0.4, carbohydrates: 3.6, fiber: 0, vitamin_b2: 0.2, vitamin_b5: 0.4, vitamin_b12: 0.6, calcium: 183, iron: 0.1, zinc: 0.6, magnesium: 18, potassium: 234, selenium: 7.5, choline: 7.6 },
  cheese:         { calories: 350, protein: 25, fat: 28, carbohydrates: 1.3, fiber: 0, vitamin_a: 263, vitamin_b2: 0.3, vitamin_b5: 0.2, vitamin_b6: 0.1, vitamin_b12: 0.8, vitamin_k: 1.4, calcium: 657, iron: 0.4, zinc: 2.7, magnesium: 17, potassium: 81, selenium: 8.6, choline: 21.4, omega3: 0.3, omega6: 0.5 },
  broccoli:       { calories: 34, protein: 2.8, fat: 0.4, carbohydrates: 7, fiber: 2.6, vitamin_a: 62, vitamin_b1: 0.1, vitamin_b2: 0.1, vitamin_b3: 0.6, vitamin_b5: 0.6, vitamin_b6: 0.2, vitamin_c: 89.2, vitamin_e: 0.8, vitamin_k: 102, calcium: 47, iron: 0.7, zinc: 0.4, magnesium: 21, potassium: 316, selenium: 2.5, copper: 0.1, manganese: 0.2, choline: 18.7 },
  orange:         { calories: 47, protein: 0.9, fat: 0.1, carbohydrates: 12, fiber: 2.4, vitamin_b1: 0.1, vitamin_b5: 0.3, vitamin_b9: 30, vitamin_c: 53.2, vitamin_k: 0, calcium: 40, iron: 0.1, zinc: 0.1, magnesium: 10, potassium: 181, copper: 0.1, choline: 8.4 },
  strawberry:     { calories: 32, protein: 0.7, fat: 0.3, carbohydrates: 8, fiber: 2, vitamin_b5: 0.1, vitamin_b6: 0.1, vitamin_c: 58.8, vitamin_k: 2.2, calcium: 16, iron: 0.4, zinc: 0.1, magnesium: 13, potassium: 153, selenium: 0.4, copper: 0.1, manganese: 0.4, choline: 5.7 },
  sweet_potato:   { calories: 86, protein: 1.6, fat: 0.1, carbohydrates: 20, fiber: 3, vitamin_a: 709, vitamin_b5: 0.3, vitamin_b6: 0.2, vitamin_c: 2.4, vitamin_e: 0.3, calcium: 30, iron: 0.6, zinc: 0.3, magnesium: 25, potassium: 337, copper: 0.2, manganese: 0.3, choline: 12.3 },
  carrot:         { calories: 41, protein: 0.9, fat: 0.2, carbohydrates: 10, fiber: 2.8, vitamin_a: 835, vitamin_b1: 0.1, vitamin_b6: 0.1, vitamin_c: 5.9, vitamin_k: 13.2, calcium: 33, iron: 0.3, zinc: 0.2, magnesium: 12, potassium: 320, copper: 0.1, manganese: 0.1, choline: 8.8 },
  kale:           { calories: 35, protein: 2.9, fat: 0.5, carbohydrates: 4.4, fiber: 2, vitamin_a: 481, vitamin_b1: 0.1, vitamin_b2: 0.1, vitamin_b3: 0.5, vitamin_b6: 0.1, vitamin_c: 93.4, vitamin_e: 1.5, vitamin_k: 390, calcium: 135, iron: 1.5, zinc: 0.3, magnesium: 32, potassium: 348, selenium: 0.9, copper: 0.2, manganese: 0.5, choline: 0.8, omega3: 0.1 },
  beef:           { calories: 250, protein: 26, fat: 15, fiber: 0, vitamin_b2: 0.2, vitamin_b3: 4.5, vitamin_b5: 0.6, vitamin_b6: 0.4, vitamin_b12: 2.6, vitamin_d: 2, vitamin_e: 0.2, vitamin_k: 1.5, calcium: 14, iron: 2.6, zinc: 5.1, magnesium: 21, potassium: 315, selenium: 21.5, copper: 0.1, choline: 80, omega3: 0.1, omega6: 0.4 },
  chicken:        { calories: 239, protein: 27, fat: 14, fiber: 0, vitamin_b3: 7.1, vitamin_b5: 0.8, vitamin_b6: 0.5, vitamin_b12: 0.4, vitamin_d: 2, vitamin_e: 0.2, vitamin_k: 0.3, calcium: 11, iron: 0.9, zinc: 1.8, magnesium: 23, potassium: 203, selenium: 22.4, choline: 68.6, omega3: 0.1, omega6: 2 },
  liver:          { calories: 135, protein: 21, fat: 3.6, carbohydrates: 5.1, fiber: 0, vitamin_a: 4968, vitamin_b2: 3.4, vitamin_b3: 9.7, vitamin_b5: 4.8, vitamin_b6: 0.7, vitamin_b7: 67, vitamin_b9: 211, vitamin_b12: 18.7, vitamin_c: 7, vitamin_d: 14, vitamin_e: 0.9, vitamin_k: 1.2, calcium: 6, iron: 17.4, zinc: 5.3, magnesium: 21, potassium: 345, selenium: 30.2, copper: 1.5, choline: 60.2 },
  lentils:        { calories: 116, protein: 9, fat: 0.4, carbohydrates: 20, fiber: 7.9, vitamin_b1: 0.2, vitamin_b2: 0.1, vitamin_b3: 0.7, vitamin_b5: 0.4, vitamin_b6: 0.2, vitamin_b9: 181, vitamin_c: 1.5, vitamin_k: 1.7, calcium: 19, iron: 3.3, zinc: 1.3, magnesium: 36, potassium: 369, selenium: 2.8, copper: 0.3, manganese: 0.5, choline: 32.7 },
  beans:          { calories: 132, protein: 8.7, fat: 0.5, carbohydrates: 24, fiber: 6.4, vitamin_b1: 0.2, vitamin_b2: 0.1, vitamin_b3: 0.4, vitamin_b5: 0.2, vitamin_b6: 0.1, vitamin_b9: 130, vitamin_c: 1.2, vitamin_k: 3.5, calcium: 50, iron: 2.1, zinc: 0.9, magnesium: 45, potassium: 358, selenium: 3.7, copper: 0.2, manganese: 0.4, choline: 30.3 },
  chickpeas:      { calories: 139, protein: 7.6, fat: 2.6, carbohydrates: 23, fiber: 6.7, vitamin_b1: 0.1, vitamin_b2: 0.1, vitamin_b3: 0.3, vitamin_b5: 0.3, vitamin_b6: 0.1, vitamin_b9: 172, vitamin_c: 1.1, vitamin_k: 3.5, calcium: 45, iron: 1.3, zinc: 1.2, magnesium: 38, potassium: 239, selenium: 3.7, copper: 0.2, manganese: 0.6, choline: 38.9 },
  tofu:           { calories: 76, protein: 8, fat: 4.8, carbohydrates: 1.9, fiber: 0.3, vitamin_b1: 0.1, vitamin_b2: 0.1, vitamin_b3: 0.1, vitamin_b6: 0.1, vitamin_b9: 15, vitamin_c: 0.1, vitamin_e: 0.2, vitamin_k: 2.4, calcium: 350, iron: 5.4, zinc: 0.9, magnesium: 30, potassium: 121, selenium: 8.9, copper: 0.2, manganese: 0.5, choline: 28.3 },
  avocado:        { calories: 160, protein: 2, fat: 15, carbohydrates: 9, fiber: 6.7, vitamin_b2: 0.1, vitamin_b3: 1.7, vitamin_b5: 1.3, vitamin_b6: 0.2, vitamin_b9: 81, vitamin_c: 10, vitamin_e: 2.1, vitamin_k: 21, calcium: 12, iron: 0.6, zinc: 0.6, magnesium: 29, potassium: 485, copper: 0.2, manganese: 0.1, choline: 14.2, omega6: 1.8 },
  nuts:           { calories: 579, protein: 21, fat: 50, carbohydrates: 22, fiber: 12.5, vitamin_b2: 1.1, vitamin_b3: 3.6, vitamin_b6: 0.1, vitamin_e: 25.6, calcium: 269, iron: 3.7, zinc: 3.1, magnesium: 270, potassium: 733, selenium: 4.1, copper: 1, manganese: 2.3, choline: 52.1, omega3: 0, omega6: 12.3 },
  seeds:          { calories: 560, protein: 18, fat: 49, carbohydrates: 23, fiber: 12, vitamin_b1: 0.5, vitamin_b3: 4.1, vitamin_b6: 0.4, vitamin_b9: 82, vitamin_e: 1.6, calcium: 277, iron: 8.8, zinc: 5.1, magnesium: 325, potassium: 497, selenium: 34.4, copper: 1.3, manganese: 2.5, choline: 58.7, omega3: 0.1, omega6: 17.7 },
  chia:           { calories: 486, protein: 17, fat: 31, carbohydrates: 42, fiber: 34.4, vitamin_b1: 0.6, vitamin_b3: 8.8, vitamin_b5: 0.6, vitamin_c: 1.6, vitamin_e: 0.5, calcium: 631, iron: 7.7, zinc: 4.6, magnesium: 335, potassium: 407, selenium: 55.2, copper: 0.7, manganese: 2.3, choline: 63.7, omega3: 17.8, omega6: 5.8 },
  flax:           { calories: 534, protein: 18, fat: 42, carbohydrates: 29, fiber: 27.3, vitamin_b1: 1.6, vitamin_b2: 0.2, vitamin_b3: 3.1, vitamin_b6: 0.5, vitamin_b9: 87, vitamin_c: 0.6, vitamin_k: 4.3, calcium: 255, iron: 5.7, zinc: 4.3, magnesium: 392, potassium: 813, selenium: 25.4, copper: 1.2, manganese: 2.6, choline: 78.7, omega3: 22.8, omega6: 5.9 },
  olive_oil:      { calories: 884, fat: 100, fiber: 0, vitamin_e: 14.4, vitamin_k: 60.2, iron: 0.6, calcium: 0, omega6: 3.3 },
  butter:         { calories: 717, fat: 81, carbohydrates: 0.1, fiber: 0, vitamin_a: 684, vitamin_b12: 0.1, vitamin_d: 15, vitamin_e: 2.3, vitamin_k: 7, calcium: 24, iron: 0, zinc: 0.1, magnesium: 2, potassium: 24, selenium: 1, choline: 18.8, omega3: 0.3, omega6: 2.2 },
  whole_grain_bread: { calories: 247, protein: 13, fat: 3.4, carbohydrates: 41, fiber: 7, vitamin_b1: 0.4, vitamin_b2: 0.2, vitamin_b3: 4.4, vitamin_b5: 0.6, vitamin_b6: 0.3, vitamin_b9: 50, vitamin_e: 0.5, vitamin_k: 1.4, calcium: 74, iron: 2.5, zinc: 1.7, magnesium: 76, potassium: 164, selenium: 22, copper: 0.2, manganese: 1.8, choline: 20.5 },
  brown_rice:     { calories: 111, protein: 2.6, fat: 0.9, carbohydrates: 23, fiber: 1.8, vitamin_b1: 0.2, vitamin_b2: 0.1, vitamin_b3: 2.6, vitamin_b5: 0.7, vitamin_b6: 0.2, vitamin_e: 0.4, vitamin_k: 0.8, calcium: 10, iron: 0.6, zinc: 0.7, magnesium: 44, potassium: 84, selenium: 6.4, copper: 0.1, manganese: 1.3, choline: 17.2 },
  quinoa:         { calories: 120, protein: 4.4, fat: 1.9, carbohydrates: 21, fiber: 2.8, vitamin_b1: 0.1, vitamin_b2: 0.2, vitamin_b3: 0.4, vitamin_b6: 0.1, vitamin_b9: 42, vitamin_e: 0.6, calcium: 17, iron: 1.5, zinc: 1.1, magnesium: 64, potassium: 172, selenium: 4.4, copper: 0.2, manganese: 0.6, choline: 23 },
  tea:            { calories: 1, protein: 0, fat: 0, carbohydrates: 0, fiber: 0, vitamin_c: 0 },
  coffee:         { calories: 2, protein: 0.1, fat: 0, carbohydrates: 0, fiber: 0, vitamin_b2: 0, vitamin_b3: 0.2, vitamin_b5: 0.2, magnesium: 3, potassium: 49, choline: 2.6 },
  dark_chocolate: { calories: 546, protein: 4.9, fat: 31, carbohydrates: 61, fiber: 7, vitamin_b2: 0.1, vitamin_b3: 0.4, vitamin_b6: 0.1, vitamin_e: 0.5, vitamin_k: 2.4, calcium: 73, iron: 11.9, zinc: 3.3, magnesium: 146, potassium: 447, selenium: 3.8, copper: 1.8, manganese: 1.4, choline: 36.9, omega6: 0.9 },
  mushrooms:      { calories: 22, protein: 3.1, fat: 0.3, carbohydrates: 3.3, fiber: 1, vitamin_b2: 0.4, vitamin_b3: 3.6, vitamin_b5: 1.5, vitamin_b6: 0.1, vitamin_b7: 8.3, vitamin_b9: 16, vitamin_d: 7, vitamin_k: 0, calcium: 3, iron: 0.5, zinc: 0.5, magnesium: 9, potassium: 318, selenium: 12.5, copper: 0.3, choline: 17.3 },
  fortified_cereal: { calories: 379, protein: 6, fat: 2, carbohydrates: 83, fiber: 2, vitamin_a: 500, vitamin_b1: 0.5, vitamin_b2: 0.6, vitamin_b3: 7, vitamin_b6: 0.5, vitamin_b9: 200, vitamin_b12: 2, vitamin_c: 30, vitamin_d: 55, calcium: 300, iron: 8, zinc: 3, magnesium: 30, selenium: 10 },
  // ===== NEW IN V3 =====
  apple:          { calories: 52, protein: 0.3, fat: 0.2, carbohydrates: 14, fiber: 2.4, vitamin_c: 4.6, vitamin_k: 2.2, calcium: 6, iron: 0.1, magnesium: 5, potassium: 107, choline: 3.4 },
  blueberry:      { calories: 57, protein: 0.7, fat: 0.3, carbohydrates: 14, fiber: 2.4, vitamin_c: 9.7, vitamin_k: 19.3, calcium: 6, iron: 0.3, magnesium: 6, potassium: 77, manganese: 0.3, choline: 6 },
  watermelon:     { calories: 30, protein: 0.6, fat: 0.2, carbohydrates: 8, fiber: 0.4, vitamin_a: 28, vitamin_c: 8.1, calcium: 7, magnesium: 10, potassium: 112, choline: 4.1 },
  grape:          { calories: 69, protein: 0.7, fat: 0.2, carbohydrates: 18, fiber: 0.9, vitamin_c: 3.2, vitamin_k: 14.6, calcium: 10, iron: 0.4, magnesium: 7, potassium: 191, copper: 0.1, choline: 5.6 },
  pineapple:      { calories: 50, protein: 0.5, fat: 0.1, carbohydrates: 13, fiber: 1.4, vitamin_c: 47.8, vitamin_b6: 0.1, calcium: 13, iron: 0.3, magnesium: 12, potassium: 109, manganese: 0.9, choline: 5.5 },
  mango:          { calories: 60, protein: 0.8, fat: 0.4, carbohydrates: 15, fiber: 1.6, vitamin_a: 54, vitamin_c: 36.4, vitamin_b6: 0.1, vitamin_b9: 43, vitamin_k: 4.2, calcium: 11, iron: 0.2, magnesium: 10, potassium: 168, copper: 0.1, choline: 7.6 },
  papaya:         { calories: 43, protein: 0.5, fat: 0.3, carbohydrates: 11, fiber: 1.7, vitamin_a: 47, vitamin_c: 60.9, vitamin_b9: 37, vitamin_k: 2.6, calcium: 20, magnesium: 21, potassium: 182, choline: 6.1 },
  coconut:        { calories: 354, protein: 3.3, fat: 33, carbohydrates: 15, fiber: 9, vitamin_b5: 0.3, vitamin_b6: 0.1, vitamin_c: 3.3, vitamin_e: 0.2, vitamin_k: 0.2, calcium: 14, iron: 2.4, zinc: 1.1, magnesium: 32, potassium: 356, selenium: 10.1, copper: 0.4, manganese: 1.5, choline: 12.1, omega6: 0.4 },
  walnuts:        { calories: 654, protein: 15, fat: 65, carbohydrates: 14, fiber: 6.7, vitamin_b6: 0.5, vitamin_b9: 98, vitamin_e: 0.7, vitamin_k: 2.7, calcium: 98, iron: 2.9, zinc: 3.1, magnesium: 158, potassium: 441, selenium: 4.9, copper: 1.6, manganese: 3.4, choline: 39.2, omega3: 9.1, omega6: 38.1 },
  cashews:        { calories: 553, protein: 18, fat: 44, carbohydrates: 30, fiber: 3.3, vitamin_b1: 0.4, vitamin_b2: 0.1, vitamin_b3: 1.1, vitamin_b6: 0.4, vitamin_b9: 25, vitamin_e: 0.9, vitamin_k: 34, calcium: 37, iron: 6.7, zinc: 5.8, magnesium: 292, potassium: 660, selenium: 11.7, copper: 2.2, manganese: 1.7, choline: 61 },
  peanuts:        { calories: 567, protein: 26, fat: 49, carbohydrates: 16, fiber: 8.5, vitamin_b3: 12.1, vitamin_b6: 0.3, vitamin_b9: 240, vitamin_e: 8.3, vitamin_k: 0, calcium: 92, iron: 4.6, zinc: 3.3, magnesium: 168, potassium: 705, selenium: 7.2, copper: 1.1, manganese: 2, choline: 52.5, omega6: 15.6 },
  peanut_butter:  { calories: 588, protein: 25, fat: 50, carbohydrates: 20, fiber: 6, vitamin_b3: 13.1, vitamin_b6: 0.4, vitamin_b9: 87, vitamin_e: 9.1, calcium: 49, iron: 1.7, zinc: 2.5, magnesium: 168, potassium: 558, selenium: 4.1, copper: 0.5, manganese: 1.2, choline: 64.3, omega6: 12.3 },
  oats:           { calories: 389, protein: 17, fat: 6.9, carbohydrates: 66, fiber: 10.6, vitamin_b1: 0.8, vitamin_b5: 1.3, vitamin_b6: 0.1, vitamin_b9: 56, vitamin_e: 0.4, vitamin_k: 2, calcium: 54, iron: 4.7, zinc: 3.6, magnesium: 177, potassium: 429, selenium: 28.9, copper: 0.6, manganese: 4.9, choline: 34.4 },
  rye_bread:      { calories: 259, protein: 8.5, fat: 3.3, carbohydrates: 48, fiber: 5.8, vitamin_b1: 0.3, vitamin_b2: 0.2, vitamin_b3: 2.8, vitamin_b6: 0.1, vitamin_b9: 41, vitamin_e: 0.3, calcium: 73, iron: 2.5, zinc: 1.6, magnesium: 61, potassium: 166, selenium: 18.5, copper: 0.2, manganese: 1.2, choline: 12.8 },
  pasta:          { calories: 131, protein: 5, fat: 1.1, carbohydrates: 25, fiber: 1.8, vitamin_b1: 0.3, vitamin_b2: 0.1, vitamin_b3: 1.8, vitamin_b9: 43, vitamin_k: 0.1, calcium: 8, iron: 1.5, zinc: 0.6, magnesium: 18, potassium: 44, selenium: 22.1, copper: 0.1, manganese: 0.3, choline: 4.4 },
  white_rice:     { calories: 130, protein: 2.7, fat: 0.3, carbohydrates: 28, fiber: 0.4, vitamin_b1: 0.2, vitamin_b3: 1.5, vitamin_b5: 0.4, vitamin_b6: 0.1, vitamin_b9: 58, calcium: 10, iron: 1.2, zinc: 0.5, magnesium: 12, potassium: 35, selenium: 7.5, copper: 0.1, choline: 4.2 },
  potato:         { calories: 77, protein: 2, fat: 0.1, carbohydrates: 17, fiber: 2.2, vitamin_b1: 0.1, vitamin_b3: 1.1, vitamin_b5: 0.3, vitamin_b6: 0.3, vitamin_c: 19.7, vitamin_k: 2.2, calcium: 12, iron: 0.8, zinc: 0.3, magnesium: 23, potassium: 421, copper: 0.1, manganese: 0.2, choline: 12.1 },
  onion:          { calories: 40, protein: 1.1, fat: 0.1, carbohydrates: 9, fiber: 1.7, vitamin_b6: 0.1, vitamin_b9: 19, vitamin_c: 7.4, calcium: 23, iron: 0.2, zinc: 0.2, magnesium: 10, potassium: 146, selenium: 0.5, copper: 0.1, manganese: 0.1, choline: 6.1 },
  garlic:         { calories: 149, protein: 6.4, fat: 0.5, carbohydrates: 33, fiber: 2.1, vitamin_b1: 0.2, vitamin_b2: 0.1, vitamin_b3: 0.7, vitamin_b6: 1.2, vitamin_b9: 3, vitamin_c: 31.2, calcium: 181, iron: 1.7, zinc: 1.2, magnesium: 25, potassium: 401, selenium: 14.2, copper: 0.3, manganese: 1.7, choline: 23.2 },
  ginger:         { calories: 80, protein: 1.8, fat: 0.8, carbohydrates: 18, fiber: 2, vitamin_b3: 0.8, vitamin_b5: 0.2, vitamin_b6: 0.2, vitamin_c: 5, vitamin_k: 0.1, calcium: 16, iron: 0.6, zinc: 0.3, magnesium: 43, potassium: 415, copper: 0.2, manganese: 0.2, choline: 28.8 },
  turmeric:       { calories: 354, protein: 7.8, fat: 9.9, carbohydrates: 65, fiber: 21, vitamin_b1: 0.2, vitamin_b2: 0.2, vitamin_b3: 1.4, vitamin_b6: 1.8, vitamin_c: 0.7, vitamin_e: 3.1, vitamin_k: 13.4, calcium: 168, iron: 41.4, zinc: 4.4, magnesium: 193, potassium: 2080, selenium: 6.2, copper: 1.3, manganese: 7.8, choline: 49.2 },
  cinnamon:       { calories: 247, protein: 4, fat: 1.2, carbohydrates: 81, fiber: 47, vitamin_b1: 0.1, vitamin_b2: 0.1, vitamin_b3: 1.3, vitamin_b6: 0.2, vitamin_b9: 9, vitamin_c: 3.8, vitamin_e: 2.3, vitamin_k: 31.2, calcium: 1002, iron: 8.3, zinc: 1.8, magnesium: 60, potassium: 431, selenium: 3.1, copper: 0.3, manganese: 17.5, choline: 11 },
  bell_pepper:    { calories: 31, protein: 1, fat: 0.3, carbohydrates: 6, fiber: 2.1, vitamin_a: 157, vitamin_b2: 0.1, vitamin_b3: 0.5, vitamin_b6: 0.2, vitamin_c: 127.7, vitamin_e: 1.6, vitamin_k: 4.9, calcium: 10, iron: 0.3, zinc: 0.1, magnesium: 11, potassium: 211, copper: 0.1, choline: 5.6 },
  cucumber:       { calories: 15, protein: 0.7, fat: 0.1, carbohydrates: 3.6, fiber: 0.5, vitamin_k: 16.4, vitamin_c: 2.8, calcium: 16, magnesium: 13, potassium: 147, choline: 6.2 },
  tomato:         { calories: 18, protein: 0.9, fat: 0.2, carbohydrates: 3.9, fiber: 1.2, vitamin_a: 42, vitamin_b1: 0.1, vitamin_b3: 0.6, vitamin_b6: 0.1, vitamin_c: 13.7, vitamin_e: 0.5, vitamin_k: 7.9, calcium: 10, iron: 0.3, zinc: 0.2, magnesium: 11, potassium: 237, copper: 0.1, manganese: 0.1, choline: 6.7 },
  lemon:          { calories: 29, protein: 1.1, fat: 0.3, carbohydrates: 9, fiber: 2.8, vitamin_c: 53, calcium: 26, iron: 0.6, magnesium: 8, potassium: 138, choline: 5.1 },
  lime:           { calories: 30, protein: 0.7, fat: 0.2, carbohydrates: 11, fiber: 2.8, vitamin_c: 29.1, calcium: 33, iron: 0.6, magnesium: 6, potassium: 102, choline: 5.1 },
  corn:           { calories: 96, protein: 3.4, fat: 1.5, carbohydrates: 21, fiber: 2.4, vitamin_b1: 0.2, vitamin_b2: 0.1, vitamin_b3: 1.7, vitamin_b5: 0.7, vitamin_b6: 0.1, vitamin_b9: 19, vitamin_c: 6.8, vitamin_k: 0.3, calcium: 2, iron: 0.5, zinc: 0.5, magnesium: 37, potassium: 270, selenium: 0.6, copper: 0.1, choline: 23 },
  peas:           { calories: 81, protein: 5.4, fat: 0.4, carbohydrates: 14, fiber: 5.7, vitamin_a: 38, vitamin_b1: 0.3, vitamin_b3: 2.1, vitamin_b5: 0.1, vitamin_b6: 0.2, vitamin_b9: 65, vitamin_c: 40, vitamin_k: 24.8, calcium: 25, iron: 1.5, zinc: 1.2, magnesium: 33, potassium: 244, selenium: 1.8, copper: 0.2, manganese: 0.4, choline: 28.7 },
  green_beans:    { calories: 31, protein: 1.8, fat: 0.2, carbohydrates: 7, fiber: 2.7, vitamin_a: 35, vitamin_b1: 0.1, vitamin_b2: 0.1, vitamin_b3: 0.7, vitamin_b6: 0.1, vitamin_b9: 33, vitamin_c: 12.2, vitamin_k: 43, calcium: 37, iron: 1, zinc: 0.2, magnesium: 25, potassium: 211, selenium: 0.6, choline: 16.9 },
  cauliflower:    { calories: 25, protein: 1.9, fat: 0.3, carbohydrates: 5, fiber: 2, vitamin_b5: 0.2, vitamin_b6: 0.2, vitamin_b9: 44, vitamin_c: 46.4, vitamin_k: 15.5, calcium: 22, iron: 0.4, zinc: 0.3, magnesium: 15, potassium: 299, choline: 44.3 },
  cabbage:        { calories: 25, protein: 1.3, fat: 0.1, carbohydrates: 6, fiber: 2.5, vitamin_a: 5, vitamin_b1: 0.1, vitamin_b6: 0.1, vitamin_c: 36.6, vitamin_k: 76, calcium: 40, iron: 0.5, zinc: 0.2, magnesium: 12, potassium: 170, selenium: 0.3, choline: 10.7 },
  celery:         { calories: 16, protein: 0.7, fat: 0.2, carbohydrates: 3, fiber: 1.6, vitamin_a: 22, vitamin_c: 3.1, vitamin_k: 29.3, calcium: 40, iron: 0.2, magnesium: 11, potassium: 260, choline: 6.1 },
  zucchini:       { calories: 17, protein: 1.2, fat: 0.3, carbohydrates: 3, fiber: 1, vitamin_a: 10, vitamin_b6: 0.2, vitamin_b9: 24, vitamin_c: 17.9, vitamin_k: 4.3, calcium: 16, iron: 0.4, zinc: 0.3, magnesium: 18, potassium: 261, manganese: 0.2, choline: 8.8 },
  eggplant:       { calories: 25, protein: 1, fat: 0.2, carbohydrates: 6, fiber: 3, vitamin_b1: 0.1, vitamin_b3: 0.6, vitamin_b6: 0.1, vitamin_b9: 22, vitamin_c: 2.2, vitamin_k: 3.5, calcium: 9, iron: 0.2, zinc: 0.2, magnesium: 14, potassium: 229, copper: 0.1, manganese: 0.2, choline: 6.9 },
  pumpkin:        { calories: 26, protein: 1, fat: 0.1, carbohydrates: 7, fiber: 0.5, vitamin_a: 426, vitamin_c: 9, vitamin_e: 1.1, calcium: 21, iron: 0.8, zinc: 0.3, magnesium: 12, potassium: 340, choline: 6.9 },
  beet:           { calories: 43, protein: 1.6, fat: 0.2, carbohydrates: 10, fiber: 2.8, vitamin_b9: 109, vitamin_c: 4.9, calcium: 16, iron: 0.8, zinc: 0.4, magnesium: 23, potassium: 325, copper: 0.1, manganese: 0.3, choline: 6 },
  radish:         { calories: 16, protein: 0.7, fat: 0.1, carbohydrates: 3.4, fiber: 1.6, vitamin_c: 14.8, vitamin_k: 1.3, calcium: 25, iron: 0.3, zinc: 0.3, magnesium: 10, potassium: 233, folate: 25, choline: 6.5 },
  asparagus:      { calories: 20, protein: 2.2, fat: 0.1, carbohydrates: 4, fiber: 2.1, vitamin_a: 38, vitamin_b1: 0.1, vitamin_b2: 0.1, vitamin_b3: 1, vitamin_b5: 0.3, vitamin_b6: 0.1, vitamin_b9: 52, vitamin_c: 5.6, vitamin_e: 1.1, vitamin_k: 41.6, calcium: 24, iron: 2.1, zinc: 0.5, magnesium: 14, potassium: 202, selenium: 2.3, copper: 0.2, choline: 16 },
  avocado_oil:    { calories: 884, fat: 100, vitamin_e: 12.2, vitamin_k: 37.2, omega6: 13.5 },
  sesame_oil:     { calories: 884, fat: 100, vitamin_e: 3.6, vitamin_k: 13.6, omega3: 0.3, omega6: 41.3 },
  ghee:           { calories: 900, fat: 100, vitamin_a: 840, vitamin_e: 2.8, vitamin_k: 8.6, omega3: 0.3, omega6: 2.1 },
  honey:          { calories: 304, protein: 0.3, fat: 0, carbohydrates: 82, fiber: 0.2, vitamin_b2: 0.1, vitamin_b3: 0.1, vitamin_b6: 0.2, vitamin_c: 0.5, calcium: 6, iron: 0.4, zinc: 0.2, magnesium: 2, potassium: 52, selenium: 0.8, choline: 2.2 },
  maple_syrup:    { calories: 260, protein: 0, fat: 0.1, carbohydrates: 67, fiber: 0, vitamin_b2: 1.3, calcium: 102, zinc: 1.5, magnesium: 19, potassium: 212, manganese: 2.9, choline: 1.6 },
  coconut_milk:   { calories: 230, protein: 2.3, fat: 24, carbohydrates: 6, fiber: 0.2, vitamin_c: 2.3, vitamin_e: 0.2, vitamin_k: 0.2, calcium: 16, iron: 3.3, zinc: 0.7, magnesium: 37, potassium: 263, selenium: 2.7, copper: 0.2, manganese: 0.9, choline: 4.9, omega6: 0.3 },
  soy_milk:       { calories: 33, protein: 2.9, fat: 1.8, carbohydrates: 1.6, fiber: 0.4, vitamin_b2: 0.2, vitamin_b9: 15, vitamin_b12: 0.5, vitamin_d: 49, calcium: 120, iron: 0.4, zinc: 0.3, magnesium: 15, potassium: 118, selenium: 1.8, choline: 26 },
  almond_milk:    { calories: 17, protein: 0.6, fat: 1.1, carbohydrates: 1.6, fiber: 0.2, vitamin_e: 3.3, vitamin_d: 41, calcium: 120, iron: 0.1, zinc: 0.1, magnesium: 5, potassium: 67, selenium: 0.5, choline: 2.2 },
  rice_milk:      { calories: 47, protein: 0.3, fat: 1, carbohydrates: 9, fiber: 0.3, vitamin_d: 42, calcium: 118, iron: 0.2, choline: 1.4 },
  oat_milk:       { calories: 47, protein: 1.1, fat: 0.7, carbohydrates: 9, fiber: 0.3, vitamin_b2: 0.2, vitamin_b12: 0.6, vitamin_d: 41, calcium: 120, iron: 0.3, zinc: 0.2, magnesium: 7, potassium: 81, selenium: 1, choline: 4.2 },
  tofu_firm:      { calories: 145, protein: 16, fat: 8.7, carbohydrates: 2.6, fiber: 0.4, vitamin_b1: 0.2, vitamin_b2: 0.1, vitamin_b3: 0.4, vitamin_b6: 0.1, vitamin_b9: 19, calcium: 350, iron: 7.2, zinc: 1.5, magnesium: 37, potassium: 162, selenium: 11.2, copper: 0.3, manganese: 1.4, choline: 40.4 },
  tempeh:         { calories: 193, protein: 19, fat: 11, carbohydrates: 9, fiber: 0, vitamin_b2: 0.4, vitamin_b3: 2.3, vitamin_b6: 0.2, vitamin_b12: 0.1, calcium: 111, iron: 2.7, zinc: 1.6, magnesium: 81, potassium: 412, selenium: 7.7, copper: 0.5, manganese: 1.3, choline: 36.3 },
  edamame:        { calories: 121, protein: 12, fat: 5.2, carbohydrates: 9, fiber: 5.2, vitamin_a: 15, vitamin_b1: 0.2, vitamin_b2: 0.2, vitamin_b3: 0.9, vitamin_b9: 311, vitamin_c: 6.1, vitamin_k: 26, calcium: 63, iron: 2.5, zinc: 1.6, magnesium: 64, potassium: 436, selenium: 1.5, copper: 0.4, manganese: 0.8, choline: 47.7, omega3: 0.3, omega6: 2.1 },
  hummus:         { calories: 237, protein: 7.6, fat: 12, carbohydrates: 21, fiber: 4.7, vitamin_b9: 47, calcium: 61, iron: 1.8, zinc: 1.3, magnesium: 48, potassium: 267, selenium: 4.7, copper: 0.3, manganese: 0.6, choline: 32, omega6: 5.2 },
  salsa:          { calories: 36, protein: 1.5, fat: 0.2, carbohydrates: 7, fiber: 2, vitamin_a: 23, vitamin_c: 10.2, vitamin_k: 3.5, calcium: 27, iron: 0.7, magnesium: 15, potassium: 332, choline: 7.3 },
  guacamole:      { calories: 150, protein: 2, fat: 13, carbohydrates: 8, fiber: 5, vitamin_c: 8, vitamin_k: 18, calcium: 10, iron: 0.6, magnesium: 25, potassium: 410, choline: 12, omega6: 1.5 },
  pesto:          { calories: 480, protein: 8, fat: 47, carbohydrates: 7, fiber: 2, vitamin_a: 43, vitamin_b2: 0.2, vitamin_c: 15, vitamin_e: 7, vitamin_k: 95, calcium: 265, iron: 1.5, zinc: 1.2, magnesium: 48, potassium: 235, selenium: 4.1, copper: 0.1, manganese: 0.3, choline: 10, omega3: 1, omega6: 8 },
  soy_sauce:      { calories: 53, protein: 8, fat: 0.1, carbohydrates: 5, fiber: 0.4, vitamin_b3: 0.8, vitamin_b6: 0.1, calcium: 19, iron: 1.5, zinc: 1, magnesium: 40, potassium: 212, selenium: 0.8, copper: 0.1, manganese: 0.3, choline: 16.1 },
  vinegar:        { calories: 21, protein: 0, fat: 0, carbohydrates: 0.9, fiber: 0, calcium: 7, iron: 0.1, magnesium: 5, potassium: 42 },
  rice_vinegar:   { calories: 12, protein: 0, fat: 0, carbohydrates: 0.3, fiber: 0, calcium: 4, potassium: 10 },
  balsamic:       { calories: 88, protein: 0.5, fat: 0, carbohydrates: 17, fiber: 0, calcium: 27, iron: 0.7, magnesium: 11, potassium: 112, manganese: 0.1 },
  // ===== PROTEIN SOURCES =====
  pork:           { calories: 242, protein: 25, fat: 15, fiber: 0, vitamin_b1: 0.8, vitamin_b2: 0.3, vitamin_b3: 5.4, vitamin_b6: 0.4, vitamin_b12: 0.7, vitamin_d: 14, calcium: 15, iron: 1.1, zinc: 2.8, magnesium: 23, potassium: 363, selenium: 31.5, copper: 0.1, choline: 67.3, omega6: 1.6 },
  lamb:           { calories: 258, protein: 25, fat: 17, fiber: 0, vitamin_b2: 0.3, vitamin_b3: 6, vitamin_b5: 0.7, vitamin_b6: 0.2, vitamin_b12: 2.3, calcium: 17, iron: 2.3, zinc: 4.5, magnesium: 22, potassium: 310, selenium: 26.4, copper: 0.1, choline: 77, omega3: 0.4, omega6: 0.9 },
  turkey:         { calories: 135, protein: 30, fat: 0.7, fiber: 0, vitamin_b3: 9.8, vitamin_b6: 0.8, vitamin_b12: 0.4, vitamin_d: 2, selenium: 22.5, zinc: 1.5, magnesium: 20, potassium: 215, choline: 48.4, omega6: 0.2 },
  duck:           { calories: 337, protein: 19, fat: 28, fiber: 0, vitamin_b1: 0.3, vitamin_b2: 0.3, vitamin_b3: 4.3, vitamin_b5: 1.1, vitamin_b6: 0.2, vitamin_b12: 0.4, calcium: 12, iron: 2.8, zinc: 2, magnesium: 17, potassium: 203, selenium: 16.6, copper: 0.3, choline: 40.6, omega3: 0.1, omega6: 2.8 },
  shrimp:         { calories: 85, protein: 20, fat: 0.5, carbohydrates: 0, fiber: 0, vitamin_b12: 1.7, vitamin_d: 4, vitamin_e: 1.2, calcium: 52, iron: 0.4, zinc: 1.2, magnesium: 22, potassium: 111, selenium: 33.3, copper: 0.2, choline: 80.9, omega3: 0.2, omega6: 0.1 },
  cod:            { calories: 82, protein: 18, fat: 0.7, fiber: 0, vitamin_b3: 2.1, vitamin_b6: 0.2, vitamin_b12: 1.2, vitamin_d: 36, selenium: 33.1, calcium: 11, iron: 0.4, zinc: 0.5, magnesium: 32, potassium: 413, choline: 65.2, omega3: 0.2 },
  sardines:       { calories: 208, protein: 25, fat: 11, fiber: 0, vitamin_b2: 0.2, vitamin_b3: 5.2, vitamin_b12: 8.9, vitamin_d: 193, calcium: 382, iron: 2.9, zinc: 1.4, magnesium: 39, potassium: 397, selenium: 52.7, copper: 0.2, choline: 64.9, omega3: 1.5, omega6: 0.2 },
  mackerel:       { calories: 205, protein: 19, fat: 14, fiber: 0, vitamin_b2: 0.3, vitamin_b3: 9.1, vitamin_b5: 0.6, vitamin_b6: 0.4, vitamin_b12: 8.7, vitamin_d: 360, selenium: 43.1, calcium: 12, iron: 1.6, zinc: 0.8, magnesium: 34, potassium: 314, choline: 65, omega3: 2.6, omega6: 0.2 },
  trout:          { calories: 148, protein: 20, fat: 6.6, fiber: 0, vitamin_b3: 6.3, vitamin_b5: 0.9, vitamin_b6: 0.4, vitamin_b12: 4.5, vitamin_d: 635, vitamin_e: 2.2, calcium: 43, iron: 0.5, zinc: 0.6, magnesium: 26, potassium: 450, selenium: 16.2, choline: 65.5, omega3: 1.2, omega6: 0.3 },
  tilapia:        { calories: 96, protein: 20, fat: 1.7, fiber: 0, vitamin_b3: 3.9, vitamin_b5: 0.5, vitamin_b6: 0.2, vitamin_b12: 1.6, vitamin_d: 124, selenium: 41.8, calcium: 10, iron: 0.6, zinc: 0.4, magnesium: 27, potassium: 302, choline: 48.2, omega3: 0.2, omega6: 0.1 },
  clams:          { calories: 148, protein: 26, fat: 2, carbohydrates: 5, fiber: 0, vitamin_b12: 98.9, vitamin_c: 22, vitamin_k: 0.2, calcium: 46, iron: 14, zinc: 1.2, magnesium: 9, potassium: 314, selenium: 36.5, copper: 0.3, manganese: 0.3, choline: 41.5, omega3: 0.3 },
  mussels:        { calories: 86, protein: 12, fat: 2.2, carbohydrates: 3.7, fiber: 0, vitamin_b1: 0.2, vitamin_b2: 0.3, vitamin_b3: 2.2, vitamin_b12: 24, vitamin_c: 11.2, vitamin_k: 0.5, calcium: 43, iron: 5.6, zinc: 2.3, magnesium: 33, potassium: 242, selenium: 44.8, manganese: 6.8, choline: 43, omega3: 0.7, omega6: 0.1 },
  crab:           { calories: 87, protein: 18, fat: 1.2, carbohydrates: 0, fiber: 0, vitamin_b12: 11.5, vitamin_c: 7.6, vitamin_k: 0.3, calcium: 46, iron: 0.8, zinc: 3.9, magnesium: 33, potassium: 185, selenium: 42.5, copper: 0.7, choline: 54.3, omega3: 0.4 },
  lobster:        { calories: 89, protein: 19, fat: 0.9, carbohydrates: 0, fiber: 0, vitamin_b12: 1.8, vitamin_c: 0.2, vitamin_k: 0.1, calcium: 54, iron: 0.3, zinc: 3.7, magnesium: 33, potassium: 207, selenium: 57.5, copper: 0.8, choline: 51.4, omega3: 0.4 },
  // ===== DAIRY & EGGS =====
  cottage_cheese: { calories: 98, protein: 11, fat: 4.3, carbohydrates: 3.4, fiber: 0, vitamin_b2: 0.2, vitamin_b5: 0.2, vitamin_b12: 0.6, vitamin_a: 52, calcium: 83, iron: 0.1, zinc: 0.4, magnesium: 8, potassium: 104, selenium: 9.7, choline: 18.2 },
  sour_cream:     { calories: 193, protein: 2.4, fat: 19, carbohydrates: 4.6, fiber: 0, vitamin_a: 182, vitamin_b2: 0.1, vitamin_b12: 0.2, calcium: 91, iron: 0.1, zinc: 0.3, magnesium: 9, potassium: 119, selenium: 1.9, choline: 14.5 },
  heavy_cream:    { calories: 345, protein: 2.8, fat: 37, carbohydrates: 2.8, fiber: 0, vitamin_a: 350, vitamin_b2: 0.1, vitamin_b12: 0.2, vitamin_d: 16, calcium: 66, iron: 0.1, zinc: 0.3, magnesium: 7, potassium: 95, selenium: 1.1, choline: 16.5 },
  ice_cream:      { calories: 207, protein: 3.5, fat: 11, carbohydrates: 24, fiber: 0.5, vitamin_a: 139, vitamin_b2: 0.2, vitamin_b12: 0.3, calcium: 128, iron: 0.1, zinc: 0.5, magnesium: 14, potassium: 157, selenium: 2.4, choline: 22.4 },
  buttermilk:     { calories: 40, protein: 3.3, fat: 0.9, carbohydrates: 4.8, fiber: 0, vitamin_b2: 0.2, vitamin_b12: 0.3, calcium: 116, zinc: 0.4, magnesium: 11, potassium: 151, selenium: 2.9, choline: 9.6 },
  // ===== GRAINS =====
  barley:         { calories: 354, protein: 12, fat: 2.3, carbohydrates: 73, fiber: 17.3, vitamin_b1: 0.3, vitamin_b2: 0.2, vitamin_b3: 4.6, vitamin_b5: 0.3, vitamin_b6: 0.3, vitamin_b9: 23, vitamin_e: 0.6, vitamin_k: 2.2, calcium: 33, iron: 3.6, zinc: 2.8, magnesium: 133, potassium: 452, selenium: 37.7, copper: 0.5, manganese: 1.9, choline: 37.8 },
  bulgur:         { calories: 342, protein: 12, fat: 1.3, carbohydrates: 76, fiber: 12.5, vitamin_b1: 0.2, vitamin_b3: 5.1, vitamin_b6: 0.3, vitamin_b9: 27, calcium: 35, iron: 2.5, zinc: 1.9, magnesium: 164, potassium: 410, selenium: 11.9, copper: 0.3, manganese: 2, choline: 18.5 },
  couscous:       { calories: 376, protein: 13, fat: 0.6, carbohydrates: 77, fiber: 5, vitamin_b1: 0.2, vitamin_b3: 3.5, vitamin_b5: 0.6, vitamin_b6: 0.1, vitamin_b9: 20, calcium: 24, iron: 1.1, zinc: 0.7, magnesium: 44, potassium: 166, selenium: 27.2, copper: 0.2, manganese: 0.6, choline: 7.7 },
  millet:         { calories: 378, protein: 11, fat: 4.2, carbohydrates: 73, fiber: 8.5, vitamin_b1: 0.4, vitamin_b2: 0.3, vitamin_b3: 4.7, vitamin_b6: 0.4, vitamin_b9: 85, calcium: 8, iron: 3, zinc: 1.7, magnesium: 114, potassium: 195, selenium: 2.7, copper: 0.8, manganese: 1.6, choline: 33.4 },
  // ===== INTERNATIONAL FOODS =====
  paneer:         { calories: 300, protein: 19, fat: 23, carbohydrates: 3.6, fiber: 0, vitamin_a: 160, vitamin_b2: 0.2, vitamin_b12: 0.5, calcium: 500, iron: 0.5, zinc: 1.5, magnesium: 20, potassium: 90, selenium: 10.5, choline: 15 },
  greek_yogurt:   { calories: 59, protein: 10, fat: 0.4, carbohydrates: 3.6, fiber: 0, vitamin_b2: 0.2, vitamin_b12: 0.6, calcium: 183, zinc: 0.6, magnesium: 18, potassium: 234, selenium: 7.5, choline: 7.6 },
  coconut_oil:    { calories: 862, fat: 100, fiber: 0, vitamin_e: 0.1, vitamin_k: 0.5, iron: 0.1, omega6: 1.8 },
  canola_oil:     { calories: 884, fat: 100, vitamin_e: 17.5, vitamin_k: 71.3, omega3: 9.1, omega6: 19.3 },
  sunflower_oil:  { calories: 884, fat: 100, vitamin_e: 41.1, vitamin_k: 5.4, omega6: 65.7 },
  corn_oil:       { calories: 884, fat: 100, vitamin_e: 14.3, vitamin_k: 1.9, omega6: 53.2 },
};

// ===== EXPANDED ALIAS / SYNONYM MAP =====
const foodSynonyms: Record<string, string[]> = {
  eggs: ['egg', 'egg_white', 'egg_yolk', 'scrambled_eggs', 'boiled_egg', 'omelette', 'omelet'],
  milk: ['dairy_milk', 'whole_milk', 'skim_milk', '2%_milk', 'toned_milk'],
  banana: ['bananas', 'ripe_banana'],
  oatmeal: ['oats', 'porridge', 'oat_porridge', 'rolled_oats', 'steel_cut_oats'],
  spinach: ['palak', 'saag', 'baby_spinach'],
  almonds: ['almond', 'badam'],
  salmon: ['atlantic_salmon', 'smoked_salmon', 'wild_salmon'],
  tuna: ['canned_tuna', 'tuna_fish', 'skipjack_tuna'],
  yogurt: ['yoghurt', 'curd', 'dahi', 'plain_yogurt', 'greek_yogurt'],
  cheese: ['cheddar', 'mozzarella', 'swiss_cheese', 'parmesan', 'paneer'],
  broccoli: ['broccolini'],
  orange: ['oranges', 'sweet_orange', 'navel_orange'],
  strawberry: ['strawberries', 'fresh_strawberry'],
  sweet_potato: ['sweet_potatoes', 'shakarkandi'],
  carrot: ['carrots', 'gajar'],
  kale: ['curly_kale', 'lacinato_kale'],
  beef: ['steak', 'ground_beef', 'minced_beef', 'beef_steak', 'roast_beef'],
  chicken: ['chicken_breast', 'chicken_thigh', 'chicken_leg', 'roast_chicken', 'grilled_chicken', 'chicken_curry'],
  liver: ['chicken_liver', 'beef_liver', 'lamb_liver'],
  lentils: ['dal', 'daal', 'red_lentils', 'green_lentils', 'brown_lentils', 'masoor_dal', 'toor_dal', 'moong_dal'],
  beans: ['kidney_beans', 'rajma', 'black_beans', 'pinto_beans', 'navy_beans', 'green_beans'],
  chickpeas: ['chana', 'garbanzo', 'chhole', 'kabuli_chana', 'bengal_gram'],
  tofu: ['bean_curd', 'soy_tofu', 'silken_tofu'],
  avocado: ['avocados', 'butter_fruit'],
  nuts: ['mixed_nuts', 'assorted_nuts'],
  seeds: ['mixed_seeds', 'assorted_seeds', 'pumpkin_seeds', 'sunflower_seeds', 'sesame_seeds', 'til'],
  chia: ['chia_seeds', 'chia_seed'],
  flax: ['flaxseed', 'flax_seed', 'linseed', 'alsi'],
  olive_oil: ['extra_virgin_olive_oil', 'evoo', 'jaitun_ka_tel'],
  butter: ['salted_butter', 'unsalted_butter', 'makkhan'],
  whole_grain_bread: ['whole_wheat_bread', 'brown_bread', 'wholemeal_bread', 'whole_grain'],
  brown_rice: ['brown_rice', 'unpolished_rice'],
  quinoa: ['quinoa_grain', 'white_quinoa', 'red_quinoa'],
  tea: ['green_tea', 'black_tea', 'chai', 'herbal_tea', 'masala_chai'],
  coffee: ['black_coffee', 'filter_coffee', 'espresso', 'latte', 'cappuccino'],
  dark_chocolate: ['dark_choc', '70%_chocolate', '85%_chocolate', 'dark_cocoa'],
  mushrooms: ['button_mushrooms', 'cremini', 'portobello', 'shiitake', 'mushroom'],
  fortified_cereal: ['cereal', 'breakfast_cereal', 'cornflakes', 'muesli', 'granola'],
  apple: ['apples', 'green_apple', 'red_apple', 'gala_apple'],
  blueberry: ['blueberries', 'wild_blueberry'],
  watermelon: ['water_melon', 'tarbuz'],
  grape: ['grapes', 'red_grapes', 'green_grapes', 'angoor'],
  pineapple: ['ananas', 'pine_apple'],
  mango: ['mangoes', 'aam', 'alphonso', 'kesar_mango'],
  papaya: ['papita'],
  coconut: ['fresh_coconut', 'dried_coconut', 'nariyal'],
  walnuts: ['walnut', 'akhrot'],
  cashews: ['cashew', 'kaju'],
  peanuts: ['peanut', 'groundnut', 'moongfali'],
  peanut_butter: ['peanut_butter_spread'],
  oats: ['oat', 'rolled_oats', 'steel_cut_oats', 'instant_oats'],
  rye_bread: ['rye', 'dark_rye_bread', 'pumpernickel'],
  pasta: ['spaghetti', 'macaroni', 'penne', 'fettuccine', 'noodles', 'vermicelli'],
  white_rice: ['white_rice', 'polished_rice', 'basmati_rice', 'jasmine_rice', 'samba_rice', 'rawa_rice'],
  potato: ['potatoes', 'aloo', 'mashed_potato', 'baked_potato', 'boiled_potato'],
  onion: ['onions', 'pyaz', 'red_onion', 'white_onion', 'spring_onion'],
  garlic: ['lasan', 'lehsun', 'garlic_cloves'],
  ginger: ['adrak', 'fresh_ginger', 'ginger_root'],
  turmeric: ['haldi', 'turmeric_powder'],
  cinnamon: ['dalchini'],
  bell_pepper: ['capsicum', 'bell_peppers', 'shimla_mirch', 'red_bell_pepper', 'yellow_bell_pepper', 'green_bell_pepper'],
  cucumber: ['kheera', 'cucumber', 'salad_cucumber'],
  tomato: ['tomatoes', 'tamatar', 'cherry_tomato', 'plum_tomato'],
  lemon: ['lemons', 'nimbu', 'lemon_juice'],
  lime: ['limes', 'nimbu'],
  corn: ['corn_kernels', 'sweet_corn', 'makai', 'bhutta', 'maize'],
  peas: ['green_peas', 'mutter', 'snow_peas', 'garden_peas'],
  cauliflower: ['gobi', 'phool_gobi'],
  cabbage: ['patta_gobi', 'band_gobi'],
  celery: ['ajmoda', 'celery_stalk'],
  zucchini: ['courgette', 'tori', 'lauki'],
  eggplant: ['aubergine', 'brinjal', 'baingan'],
  pumpkin: ['kaddu', 'pumpkin_puree'],
  beet: ['beetroot', 'chukandar'],
  radish: ['mooli', 'daikon'],
  asparagus: ['asparagus_spears'],
  pork: ['pork_chop', 'pork_loin', 'ham', 'bacon', 'sausage'],
  lamb: ['mutton', 'lamb_chop', 'goat_meat'],
  turkey: ['turkey_breast', 'roast_turkey'],
  duck: ['duck_breast', 'roast_duck'],
  shrimp: ['prawns', 'jhinga', 'shrimp'],
  cod: ['cod_fish', 'atlantic_cod'],
  sardines: ['sardine', 'tinned_sardines', 'mathi'],
  mackerel: ['bangda', 'indian_mackerel'],
  trout: ['rainbow_trout'],
  tilapia: ['tilapia_fish'],
  clams: ['vongole', 'clams'],
  mussels: ['mussels', 'green_mussels'],
  crab: ['crab_meat', 'blue_crab'],
  lobster: ['lobster_tail', 'langoustine'],
  cottage_cheese: ['paneer', 'fresh_cheese'],
  paneer: ['cottage_cheese', 'indian_paneer'],
  greek_yogurt: ['greek_yoghurt', 'strained_yogurt', 'hung_curd'],
};

// Build reverse map: any alias -> canonical key
const aliasToCanonical: Record<string, string> = {};
for (const [canonical, aliases] of Object.entries(foodSynonyms)) {
  aliasToCanonical[canonical] = canonical;
  for (const alias of aliases) {
    aliasToCanonical[alias] = canonical;
  }
}

// Additional fuzzy patterns for multi-word Indian/Asian dishes
const multiWordDishes: [RegExp, string][] = [
  [/(chicken\s+curry|murgh\s+curry|chicken\s+masala)/i, 'chicken'],
  [/(paneer\s+(butter\s+)?masala|shahi\s+paneer)/i, 'paneer'],
  [/(dal\s+(makhani|tadka|fry))/i, 'lentils'],
  [/(rice\s+(and|&)\s+dal|dal\s+cha?wal|khich(di|ri))/i, 'brown_rice'],
  [/(aloo\s+(gobi|mutter|paratha))/i, 'potato'],
  [/(palak\s+paneer|saag\s+paneer)/i, 'spinach'],
  [/(chhole|chana\s+masala)/i, 'chickpeas'],
  [/(rajma\s+cha?wal)/i, 'beans'],
  [/(egg\s+(curry|masala|bhurji))/i, 'eggs'],
  [/(fish\s+curry|fish\s+fry)/i, 'salmon'],
  [/(vegetable\s+biryani|veg\s+pulao)/i, 'brown_rice'],
  [/(chicken\s+biryani|mutton\s+biryani)/i, 'chicken'],
  [/(naan|roti|chapati|phulka|paratha)/i, 'whole_grain_bread'],
  [/(dosa|idli|sambar)/i, 'brown_rice'],
  [/(upma|poha|sheera)/i, 'oats'],
  [/(oats?\s+(with|and)\s+milk|daliya)/i, 'oats'],
  [/(smoothie|protein\s+shake)/i, 'banana'],
  [/(salad|green\s+salad)/i, 'spinach'],
  [/(sandwich|toast)/i, 'whole_grain_bread'],
  [/(pizza)/i, 'cheese'],
  [/(burger)/i, 'beef'],
  [/(soup|broth|stock)/i, 'chicken'],
];

const nutrientSynonymMap: Record<string, string> = {
  b12: 'vitamin_b12', 'vit b12': 'vitamin_b12', 'cobalamin': 'vitamin_b12',
  b1: 'vitamin_b1', thiamin: 'vitamin_b1', thiamine: 'vitamin_b1',
  b2: 'vitamin_b2', riboflavin: 'vitamin_b2',
  b3: 'vitamin_b3', niacin: 'vitamin_b3',
  b5: 'vitamin_b5', 'pantothenic acid': 'vitamin_b5',
  b6: 'vitamin_b6', pyridoxine: 'vitamin_b6',
  b7: 'vitamin_b7', biotin: 'vitamin_b7',
  b9: 'vitamin_b9', 'folic acid': 'vitamin_b9', folate: 'folate',
  'vit c': 'vitamin_c', 'ascorbic acid': 'vitamin_c',
  'vit d': 'vitamin_d', 'cholecalciferol': 'vitamin_d',
  'vit e': 'vitamin_e', tocopherol: 'vitamin_e',
  'vit k': 'vitamin_k', phylloquinone: 'vitamin_k',
  'vit a': 'vitamin_a', retinol: 'vitamin_a',
  'omega 3': 'omega3', 'epa': 'omega3', 'dha': 'omega3',
  'omega 6': 'omega6', 'linoleic acid': 'omega6',
};

// ===== PARSER FUNCTIONS =====

function normalize(str: string): string {
  return str.toLowerCase().replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getSynonyms(word: string): string[] {
  const n = normalize(word).replace(/\s+/g, '_');
  const canon = aliasToCanonical[n];
  if (canon) return [canon, ...foodSynonyms[canon] || []];
  const direct = foodSynonyms[n];
  if (direct) return [n, ...direct];
  return [n];
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyMatch(word: string, threshold = 0.7): string | null {
  const n = normalize(word).replace(/\s+/g, '_');
  const known = Object.keys(foodNutrientQuantities);
  let best: string | null = null;
  let bestScore = 0;
  for (const k of known) {
    const score = 1 - levenshtein(n, k) / Math.max(n.length, k.length);
    if (score > bestScore && score >= threshold) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

function hasIngredientDelimiters(input: string): boolean {
  return /[,;+/&]/.test(input) || /\s+\+\s+/.test(input) || /\s+and\s+/i.test(input);
}

function extractIngredients(input: string): string[] {
  const raw = input.split(/[,;+/&]/).map(s => s.trim()).filter(Boolean);
  const parts: string[] = [];
  for (const r of raw) {
    const withAnd = r.split(/\s+and\s+/i);
    parts.push(...withAnd.map(s => s.trim()).filter(Boolean));
  }
  return parts;
}

export function parseMeal(input: string): MealParseResult {
  const result: MealParseResult = {
    foods: [],
    nutrients: {},
    totalNutrients: {},
    confidence: 0,
  };

  if (!input || !input.trim()) return result;

  const raw = input.trim();

  // Check for multi-word dishes first
  for (const [pattern, canonicalKey] of multiWordDishes) {
    if (pattern.test(raw)) {
      const matched = raw.match(pattern)![0];
      const profile = foodNutrientQuantities[canonicalKey];
      if (profile) {
        result.foods.push({ key: canonicalKey, name: matched, confidence: 0.9, matchedVia: 'multi_word' });
        for (const [nutrient, value] of Object.entries(profile)) {
          result.nutrients[nutrient as NutrientName] = (result.nutrients[nutrient as NutrientName] || 0) + value;
        }
        break; // matched as whole dish
      }
    }
  }

  // If no multi-word match, parse ingredients
  if (result.foods.length === 0 && hasIngredientDelimiters(raw)) {
    const ingredients = extractIngredients(raw);
    for (const ingredient of ingredients) {
      parseSingleFood(ingredient, result);
    }
  } else if (result.foods.length === 0) {
    parseSingleFood(raw, result);
  }

  // Compute total nutrients
  const totalNutrients: MealParseResult['totalNutrients'] = {};
  for (const n of ALL_NUTRIENTS) {
    const val = result.nutrients[n];
    if (val && val > 0) {
      totalNutrients[n] = { value: Math.round(val * 100) / 100, unit: NUTRIENT_UNITS[n] || '' };
    }
  }
  result.totalNutrients = totalNutrients;
  result.confidence = result.foods.length > 0
    ? Math.round((result.foods.reduce((s, f) => s + f.confidence, 0) / result.foods.length) * 100) / 100
    : 0;

  return result;
}

function parseSingleFood(word: string, result: MealParseResult): void {
  const n = normalize(word);
  const underscoreKey = n.replace(/\s+/g, '_');

  // 1. Exact match on canonical or synonym
  const canon = aliasToCanonical[underscoreKey];
  if (canon && foodNutrientQuantities[canon]) {
    result.foods.push({ key: canon, name: word.trim(), confidence: 1, matchedVia: 'exact' });
    addQuantities(canon, result);
    return;
  }

  // 2. Direct key match
  if (foodNutrientQuantities[underscoreKey]) {
    result.foods.push({ key: underscoreKey, name: word.trim(), confidence: 1, matchedVia: 'exact' });
    addQuantities(underscoreKey, result);
    return;
  }

  // 3. Partial match (word contained in food key)
  const partialMatches = Object.keys(foodNutrientQuantities).filter(k =>
    k.includes(underscoreKey) || underscoreKey.includes(k)
  );
  if (partialMatches.length > 0) {
    const best = partialMatches[0];
    result.foods.push({ key: best, name: word.trim(), confidence: 0.8, matchedVia: 'partial' });
    addQuantities(best, result);
    return;
  }

  // 4. Fuzzy match
  const fuzzy = fuzzyMatch(word);
  if (fuzzy) {
    result.foods.push({ key: fuzzy, name: word.trim(), confidence: 0.7, matchedVia: 'fuzzy' });
    addQuantities(fuzzy, result);
    return;
  }

  // 5. Synonym match (search through all aliases)
  const allKeys = Object.keys(foodNutrientQuantities);
  for (const key of allKeys) {
    const synonyms = foodSynonyms[key] || [];
    for (const syn of synonyms) {
      if (n.includes(syn) || syn.includes(n)) {
        result.foods.push({ key, name: word.trim(), confidence: 0.75, matchedVia: 'synonym' });
        addQuantities(key, result);
        return;
      }
    }
  }
}

function addQuantities(key: string, result: MealParseResult): void {
  const profile = foodNutrientQuantities[key];
  if (!profile) return;
  for (const [nutrient, value] of Object.entries(profile)) {
    const n = normalizeNutrient(nutrient);
    if (n) {
      result.nutrients[n] = (result.nutrients[n] || 0) + value;
    }
  }
}

function normalizeNutrient(name: string): NutrientName | null {
  const lower = name.toLowerCase();
  if (nutrientSynonymMap[lower]) return nutrientSynonymMap[lower] as NutrientName;
  if (ALL_NUTRIENTS.includes(lower as NutrientName)) return lower as NutrientName;
  return null;
}

export function getNutrientNames(): NutrientName[] {
  return [...ALL_NUTRIENTS];
}

export function getNutrientLabel(n: NutrientName): string {
  return NUTRIENT_LABELS[n] || n;
}

export function getNutrientUnit(n: NutrientName): string {
  return NUTRIENT_UNITS[n] || '';
}

export function getAllFoodKeys(): string[] {
  return Object.keys(foodNutrientQuantities);
}

export function getFoodProfile(key: string): FoodNutrientProfile | null {
  const nutrients = foodNutrientQuantities[key];
  if (!nutrients) return null;
  const synonyms = foodSynonyms[key] || [];
  return { key, name: key.replace(/_/g, ' '), nutrients };
}

export function searchFoods(query: string, limit = 10): FoodNutrientProfile[] {
  const q = normalize(query);
  return Object.entries(foodNutrientQuantities)
    .filter(([key]) => key.includes(q) || q.includes(key) || (foodSynonyms[key] || []).some(s => s.includes(q)))
    .slice(0, limit)
    .map(([key, nutrients]) => ({ key, name: key.replace(/_/g, ' '), nutrients }));
}
