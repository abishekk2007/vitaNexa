import { z } from 'zod';

export const parseMealSchema = z.object({
  mealText: z.string().min(1, 'Meal text is required').max(500, 'Meal text too long'),
  userId: z.string().uuid('Invalid userId').optional(),
});

export const analyzeAbsorptionSchema = z.object({
  nutrients: z.record(z.number().min(0)),
  mealContext: z.string().max(200).optional(),
});

export const analyticsQuerySchema = z.object({
  userId: z.string().uuid('Invalid userId'),
  days: z.coerce.number().int().min(1).max(365).default(30).optional(),
});

export const coachQuerySchema = z.object({
  userId: z.string().uuid('Invalid userId'),
  question: z.string().min(1, 'Question is required').max(1000, 'Question too long'),
});

export const generateReportSchema = z.object({
  userId: z.string().uuid('Invalid userId'),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  format: z.enum(['json', 'csv', 'print']).default('json'),
  date: z.string().optional(),
});

export const exportDataSchema = z.object({
  userId: z.string().uuid('Invalid userId').optional(),
  entity: z.enum(['meals', 'supplements', 'nutrient_logs', 'health_scores', 'analytics']),
  format: z.enum(['csv', 'json']).default('csv'),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
});
