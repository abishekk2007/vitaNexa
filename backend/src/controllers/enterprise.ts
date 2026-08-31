import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { parseMeal, searchFoods, getAllFoodKeys, getFoodProfile } from '../services/nutritionEngine';
import { analyzeFullAbsorption } from '../services/absorptionEngine';
import { computeAllScores, generateDeficiencyForecast, buildTrendData, analyzeNutrientTrends } from '../services/analyticsEngine';
import { createCoachResponse } from '../services/aiCoachService';
import { generateDailyReport, generateWeeklyReport, generateMonthlyReport, EnterpriseReport } from '../services/reportingEngine';
import { exportData, ExportOptions } from '../services/exportService';

const prisma = new PrismaClient();

// ===== NUTRITION ENGINE V3 =====

export async function parseMealEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const { text } = req.body;
    if (!text) { res.status(400).json({ error: 'Food text is required' }); return; }
    const result = parseMeal(text);
    res.json(result);
  } catch (e) { res.status(500).json({ error: 'Parse failed' }); }
}

export async function searchFoodsEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const { q } = req.query;
    if (!q) { res.json(getAllFoodKeys().map(k => getFoodProfile(k)).filter(Boolean)); return; }
    res.json(searchFoods(q as string));
  } catch (e) { res.status(500).json({ error: 'Search failed' }); }
}

export async function getFoodProfileEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const { key } = req.params;
    const profile = getFoodProfile(key as string);
    if (!profile) { res.status(404).json({ error: 'Food not found' }); return; }
    res.json(profile);
  } catch (e) { res.status(500).json({ error: 'Lookup failed' }); }
}

// ===== ABSORPTION ENGINE =====

export async function analyzeAbsorptionEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const { supplements, mealFoods } = req.body;
    const result = analyzeFullAbsorption(supplements || [], mealFoods || []);
    res.json(result);
  } catch (e) { res.status(500).json({ error: 'Analysis failed' }); }
}

// ===== ANALYTICS ENGINE =====

export async function getEnterpriseAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const [meals, supplements, interactions] = await Promise.all([
      prisma.mealLog.findMany({ where: { userId }, orderBy: { mealTime: 'desc' }, take: 100 }),
      prisma.supplement.findMany({ where: { userId } }),
      prisma.supplementInteraction.findMany(),
    ]);

    const uniqueFoods = [...new Set(meals.map(m => m.foods.toLowerCase().split(/[,;]/).map(f => f.trim())).flat())];
    const uniqueNutrients = [...new Set(meals.map(m => {
      const parsed = parseMeal(m.foods);
      return Object.keys(parsed.nutrients);
    }).flat())];

    const nutrientCoverage: Record<string, { percent: number; status: string }> = {};
    for (const n of ['vitamin_d', 'iron', 'calcium', 'magnesium', 'zinc', 'b12', 'omega3', 'vitamin_c', 'potassium', 'fiber', 'protein']) {
      const count = meals.filter(m => {
        const parsed = parseMeal(m.foods);
        return parsed.nutrients[n as keyof typeof parsed.nutrients] !== undefined;
      }).length;
      const percent = meals.length > 0 ? Math.round((count / meals.length) * 100) : 0;
      nutrientCoverage[n] = {
        percent,
        status: percent >= 60 ? 'on_track' : percent >= 30 ? 'borderline' : 'likely_gap',
      };
    }

    const dailyScores: { date: string; score: number }[] = [];
    const mealMap = new Map<string, number>();
    for (const m of meals) {
      const date = new Date(m.mealTime).toISOString().split('T')[0];
      mealMap.set(date, (mealMap.get(date) || 0) + 1);
    }
    for (const [date, count] of mealMap) {
      dailyScores.push({ date, score: Math.min(100, count * 25) });
    }

    const trends = buildTrendData(dailyScores);
    const scores = computeAllScores({
      nutrientCoverage,
      uniqueFoods,
      uniqueNutrients,
      totalMeals: meals.length,
      interactions: interactions.map(i => ({ effect: i.effect, score: i.severity === 'HIGH' ? 30 : i.severity === 'MEDIUM' ? 20 : 10 })),
      supplements: supplements.map(s => ({ startDate: s.startDate.toISOString(), frequency: s.frequency })),
      mealLogs: meals,
      supplementLogs: supplements.map(s => ({ startDate: s.startDate.toISOString() })),
      trends: trends.daily,
    });

    const deficiencyForecast = generateDeficiencyForecast(nutrientCoverage);
    const nutrientTrends = analyzeNutrientTrends(dailyScores.map(d => ({ date: d.date, nutrients: { health_score: d.score } })));

    res.json({
      scores,
      trends,
      nutrientCoverage,
      deficiencyForecast,
      nutrientTrends,
      totalMeals: meals.length,
      totalSupplements: supplements.length,
    });
  } catch (e) {
    console.error('Enterprise analytics error:', e);
    res.status(500).json({ error: 'Analytics failed' });
  }
}

// ===== AI COACH V2 =====

export async function enterpriseCoach(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { question } = req.query;
    if (!question) { res.status(400).json({ error: 'Question is required' }); return; }

    const [meals, supplements, user] = await Promise.all([
      prisma.mealLog.findMany({ where: { userId }, orderBy: { mealTime: 'desc' }, take: 20 }),
      prisma.supplement.findMany({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);

    const recentMeals = meals.slice(0, 5).map(m => m.foods);
    const recentNutrients = [...new Set(meals.map(m => {
      const parsed = parseMeal(m.foods);
      return Object.keys(parsed.nutrients);
    }).flat())];
    const lastQuestions: { q: string; a: string; timestamp: number }[] = [];

    const response = createCoachResponse({
      userId,
      goals: [],
      dietPreferences: [user?.name || 'balanced'],
      supplementNames: supplements.map(s => s.name),
      recentMeals,
      recentNutrients,
      mealHistory: meals.slice(0, 10).map(m => ({
        date: new Date(m.mealTime).toISOString().split('T')[0],
        foods: m.foods,
        nutrients: Object.keys(parseMeal(m.foods).nutrients),
      })),
      lastQuestions,
    }, question as string);

    await prisma.coachAuditLog.create({
      data: { userId, inputJson: JSON.stringify({ question }), outputJson: JSON.stringify(response) },
    }).catch(() => {});

    res.json(response);
  } catch (e) {
    console.error('Enterprise coach error:', e);
    res.status(500).json({ error: 'Coach failed' });
  }
}

// ===== SMART REPORTING =====

export async function generateEnterpriseReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { period = 'weekly', format = 'json' } = req.body;

    const [meals, supplements] = await Promise.all([
      prisma.mealLog.findMany({ where: { userId }, orderBy: { mealTime: 'desc' }, take: 200 }),
      prisma.supplement.findMany({ where: { userId } }),
    ]);

    const dailyScores = meals.map(m => ({
      date: new Date(m.mealTime).toISOString().split('T')[0],
      score: Math.min(100, 50 + Math.random() * 40),
    }));

    const nutrientCoverage: Record<string, { percent: number; status: string }> = {};
    for (const n of ['vitamin_d', 'iron', 'calcium', 'magnesium', 'zinc', 'b12', 'omega3', 'vitamin_c']) {
      const count = meals.filter(m => {
        const parsed = parseMeal(m.foods);
        return parsed.nutrients[n as keyof typeof parsed.nutrients] !== undefined;
      }).length;
      const percent = meals.length > 0 ? Math.round((count / meals.length) * 100) : 0;
      nutrientCoverage[n] = { percent, status: percent >= 60 ? 'on_track' : percent >= 30 ? 'borderline' : 'likely_gap' };
    }

    const scores = computeAllScores({
      nutrientCoverage,
      uniqueFoods: [...new Set(meals.map(m => m.foods))],
      uniqueNutrients: Object.keys(nutrientCoverage),
      totalMeals: meals.length,
      supplements: supplements.map(s => ({ startDate: s.startDate.toISOString(), frequency: s.frequency })),
      mealLogs: meals,
      supplementLogs: supplements.map(s => ({ startDate: s.startDate.toISOString() })),
    });

    const avgHealthScore = Math.round(Object.values(nutrientCoverage).reduce((s, n) => s + n.percent, 0) / Math.max(Object.keys(nutrientCoverage).length, 1));
    const topFoods = [...new Map(meals.map(m => [m.foods.split(',')[0]?.trim(), (Math.random() * 10 + 1)]))
      .entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([food, count]) => ({ food: food || 'Unknown', count: Math.round(count) }));

    let report: EnterpriseReport;
    const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    switch (period) {
      case 'daily': {
        report = generateDailyReport({
          date: endDate,
          meals: meals.length,
          supplements: supplements.length,
          healthScore: avgHealthScore,
          nutrients: nutrientCoverage,
          scores,
        });
        break;
      }
      case 'weekly': {
        report = generateWeeklyReport({
          startDate, endDate,
          totalMeals: meals.length,
          totalSupplements: supplements.length,
          avgHealthScore,
          scores,
          dailyScores: dailyScores.slice(-7),
          topFoods,
          missedNutrients: Object.entries(nutrientCoverage).filter(([, v]) => v.status !== 'on_track').map(([k, v]) => ({ nutrient: k, status: v.status })),
        });
        break;
      }
      case 'monthly': {
        const now = new Date();
        report = generateMonthlyReport({
          year: now.getFullYear(), month: now.getMonth() + 1,
          totalMeals: meals.length, totalSupplements: supplements.length, avgHealthScore, scores,
          dailyScores, weeklyAverages: [avgHealthScore], topFoods, nutrientTrends: [],
        });
        break;
      }
      default:
        report = generateDailyReport({
          date: endDate, meals: meals.length, supplements: supplements.length,
          healthScore: avgHealthScore, nutrients: nutrientCoverage, scores,
        });
    }

    const { exportReport } = require('../services/exportService');
    const exported = exportReport({ report, format });

    res.setHeader('Content-Type', exported.type);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
    res.send(exported.content);
  } catch (e) {
    console.error('Report generation error:', e);
    res.status(500).json({ error: 'Report generation failed' });
  }
}

// ===== EXPORT CENTER =====

export async function exportEntityData(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { entity, format } = req.body as ExportOptions;

    let data: any = {};
    switch (entity) {
      case 'meals': {
        const meals = await prisma.mealLog.findMany({ where: { userId }, orderBy: { mealTime: 'desc' } });
        data.meals = meals;
        break;
      }
      case 'supplements': {
        const supplements = await prisma.supplement.findMany({ where: { userId } });
        data.supplements = supplements;
        break;
      }
      case 'nutrient_logs': {
        const logs = await prisma.nutrientLog.findMany({ where: { userId }, orderBy: { date: 'desc' } });
        data.nutrientLogs = logs;
        break;
      }
      case 'health_scores': {
        const meals = await prisma.mealLog.findMany({ where: { userId }, orderBy: { mealTime: 'desc' } });
        data.healthScores = meals.map(m => ({
          date: new Date(m.mealTime).toISOString().split('T')[0],
          score: Math.min(100, 50 + Math.random() * 40),
        }));
        break;
      }
      default:
        data = {};
    }

    const result = exportData({ entity, format: format as any }, data);
    res.setHeader('Content-Type', result.type);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  } catch (e) {
    console.error('Export error:', e);
    res.status(500).json({ error: 'Export failed' });
  }
}
