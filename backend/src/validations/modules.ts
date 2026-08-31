import { z } from 'zod';

export const bacteriaResultSchema = z.object({
  bacteriaName: z.string().min(1).max(200),
  level: z.enum(['LOW', 'NORMAL', 'HIGH']),
});

export const foodDatabaseSchema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  fiberContent: z.string().optional(),
  effect: z.enum(['FEEDS_GOOD_BACTERIA', 'MAY_CAUSE_BLOATING', 'ANTI_INFLAMMATORY', 'NEUTRAL']),
  prebiotic: z.boolean().optional(),
  probiotic: z.boolean().optional(),
});

export const foodLogSchema = z.object({
  foodId: z.string().optional(),
  foodName: z.string().optional(),
  eatenAt: z.string().optional(),
  bloating: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE']).optional(),
  energy: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  mood: z.enum(['POOR', 'FAIR', 'GOOD', 'GREAT']).optional(),
  notes: z.string().optional(),
});

export const painLogSchema = z.object({
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  painLevel: z.number().int().min(1).max(10),
  weather: z.string().optional(),
  food: z.string().optional(),
  stress: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  sleepHours: z.number().optional(),
  exercise: z.boolean().optional(),
  humidity: z.number().optional(),
  temperature: z.number().optional(),
  pressure: z.number().optional(),
});

export const supplementSchema = z.object({
  name: z.string().min(1).max(200),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  timeOfDay: z.string().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

export const supplementInteractionSchema = z.object({
  supplementName: z.string().min(1),
  interactsWith: z.string().min(1),
  effect: z.enum(['REDUCES_ABSORPTION', 'IMPROVES_ABSORPTION']),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
  description: z.string().optional(),
});

export const scanSchema = z.object({
  barcode: z.string().min(1),
});

export const mealLogSchema = z.object({
  mealTime: z.string().optional(),
  foods: z.string().min(1),
  notes: z.string().optional(),
});

export const spoonBudgetSchema = z.object({
  date: z.string().optional(),
  totalSpoons: z.number().positive(),
});

export const activitySchema = z.object({
  name: z.string().min(1),
  spoonCost: z.number().positive(),
  category: z.string().optional(),
  spoonBudgetId: z.string().optional(),
});

export const recoverySchema = z.object({
  activity: z.string().min(1),
  spoonsGained: z.number().positive(),
  notes: z.string().optional(),
  spoonBudgetId: z.string().optional(),
});

export const activityPresetSchema = z.object({
  name: z.string().min(1),
  spoonCost: z.number().positive(),
  category: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const petProfileSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().min(1).max(50),
  breed: z.string().optional(),
  age: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
});

export const petMoodLogSchema = z.object({
  petId: z.string().min(1),
  mood: z.enum(['LOW', 'NORMAL', 'HIGH', 'VERY_HIGH']).optional(),
  energyLevel: z.enum(['LOW', 'NORMAL', 'HIGH']).optional(),
  notes: z.string().optional(),
});

export const hospitalSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['GOVERNMENT', 'PRIVATE']),
  phone: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().min(1),
  state: z.string().min(1),
  services: z.string().optional(),
});

export const volunteerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const bloodDonorSchema = z.object({
  bloodGroup: z.string().min(1),
  phone: z.string().min(1),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  lastDonationDate: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

export const bloodRequestSchema = z.object({
  bloodGroupNeeded: z.string().min(1),
  hospital: z.string().min(1),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).optional(),
  requesterName: z.string().min(1),
  requesterPhone: z.string().min(1),
});

export const savingsEntrySchema = z.object({
  date: z.string().optional(),
  amount: z.number().positive(),
  notes: z.string().optional(),
});

export const savingsGoalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  deadline: z.string().optional(),
  reminderTime: z.string().optional(),
});
