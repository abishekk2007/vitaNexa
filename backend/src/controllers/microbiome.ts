import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const prisma = new PrismaClient();

const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const reportsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, reportsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadReportFile = multer({
  storage: reportsStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');

export const uploadImportFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('file');

function parseJsonField(val: string): string[] {
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function lookupSpeciesId(bacteriaName: string): Promise<string | null> {
  const species = await prisma.bacteriaSpecies.findFirst({
    where: { name: { equals: bacteriaName } },
  });
  return species ? species.id : null;
}

async function upsertEffect(data: {
  speciesName: string;
  foodName: string;
  effect: string;
  evidenceGrade?: string;
  evidenceBasis?: string;
  mechanism?: string;
  confidenceScore?: number;
  keyReference?: string;
}): Promise<{ success: boolean; error?: string }> {
  const species = await prisma.bacteriaSpecies.findFirst({ where: { name: data.speciesName } });
  if (!species) return { success: false, error: `Species not found: ${data.speciesName}` };

  const food = await prisma.foodItem.findFirst({ where: { name: data.foodName } });
  if (!food) return { success: false, error: `Food not found: ${data.foodName}` };

  await prisma.foodBacteriaEffect.upsert({
    where: { speciesId_foodId: { speciesId: species.id, foodId: food.id } },
    update: {
      effect: data.effect,
      ...(data.evidenceGrade !== undefined && { evidenceGrade: data.evidenceGrade }),
      ...(data.evidenceBasis !== undefined && { evidenceBasis: data.evidenceBasis }),
      ...(data.mechanism !== undefined && { mechanism: data.mechanism }),
      ...(data.confidenceScore !== undefined && { confidenceScore: data.confidenceScore }),
      ...(data.keyReference !== undefined && { keyReference: data.keyReference }),
    },
    create: {
      speciesId: species.id,
      foodId: food.id,
      effect: data.effect,
      ...(data.evidenceGrade && { evidenceGrade: data.evidenceGrade }),
      ...(data.evidenceBasis && { evidenceBasis: data.evidenceBasis }),
      ...(data.mechanism && { mechanism: data.mechanism }),
      ...(data.confidenceScore && { confidenceScore: data.confidenceScore }),
      ...(data.keyReference && { keyReference: data.keyReference }),
    },
  });
  return { success: true };
}

// ==================================================
// SPECIES CRUD
// ==================================================

export async function getSpecies(req: Request, res: Response): Promise<void> {
  try {
    const species = await prisma.bacteriaSpecies.findMany({
      orderBy: [{ priority: 'asc' }, { name: 'asc' }],
    });
    res.json(species);
  } catch (error) {
    console.error('getSpecies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createSpecies(req: Request, res: Response): Promise<void> {
  try {
    const { name, commonName, priority, description, isBeneficial } = req.body;
    const species = await prisma.bacteriaSpecies.create({
      data: {
        name,
        commonName,
        priority,
        description,
        isBeneficial: isBeneficial ?? true,
      },
    });
    res.status(201).json(species);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Species with this name already exists' });
      return;
    }
    console.error('createSpecies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateSpecies(req: Request, res: Response): Promise<void> {
  try {
    const { name, commonName, priority, description, isBeneficial } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (commonName !== undefined) data.commonName = commonName;
    if (priority !== undefined) data.priority = priority;
    if (description !== undefined) data.description = description;
    if (isBeneficial !== undefined) data.isBeneficial = isBeneficial;

    const species = await prisma.bacteriaSpecies.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(species);
  } catch (error) {
    console.error('updateSpecies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteSpecies(req: Request, res: Response): Promise<void> {
  try {
    await prisma.bacteriaSpecies.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Species deleted' });
  } catch (error) {
    console.error('deleteSpecies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// FOODS CRUD
// ==================================================

export async function getFoods(req: Request, res: Response): Promise<void> {
  try {
    const foods = await prisma.foodItem.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json(foods);
  } catch (error) {
    console.error('getFoods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createFood(req: Request, res: Response): Promise<void> {
  try {
    const { name, category, description, solubleFiber, insolubleFiber, polyphenols, isPrebiotic, isProbiotic, isRiskFood } = req.body;
    const food = await prisma.foodItem.create({
      data: {
        name,
        category,
        description,
        solubleFiber,
        insolubleFiber,
        polyphenols,
        isPrebiotic: isPrebiotic ?? false,
        isProbiotic: isProbiotic ?? false,
        isRiskFood: isRiskFood ?? false,
      },
    });
    res.status(201).json(food);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Food with this name already exists' });
      return;
    }
    console.error('createFood error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateFood(req: Request, res: Response): Promise<void> {
  try {
    const { name, category, description, solubleFiber, insolubleFiber, polyphenols, isPrebiotic, isProbiotic, isRiskFood } = req.body;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description;
    if (solubleFiber !== undefined) data.solubleFiber = solubleFiber;
    if (insolubleFiber !== undefined) data.insolubleFiber = insolubleFiber;
    if (polyphenols !== undefined) data.polyphenols = polyphenols;
    if (isPrebiotic !== undefined) data.isPrebiotic = isPrebiotic;
    if (isProbiotic !== undefined) data.isProbiotic = isProbiotic;
    if (isRiskFood !== undefined) data.isRiskFood = isRiskFood;

    const food = await prisma.foodItem.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(food);
  } catch (error) {
    console.error('updateFood error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFood(req: Request, res: Response): Promise<void> {
  try {
    await prisma.foodItem.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Food deleted' });
  } catch (error) {
    console.error('deleteFood error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// EFFECTS CRUD + REVIEW WORKFLOW
// ==================================================

export async function getEffects(req: Request, res: Response): Promise<void> {
  try {
    const { speciesId, foodId, effect, reviewStatus, evidenceGrade } = req.query;
    const where: any = {};
    if (speciesId) where.speciesId = speciesId as string;
    if (foodId) where.foodId = foodId as string;
    if (effect) where.effect = effect as string;
    if (reviewStatus) where.reviewStatus = reviewStatus as string;
    if (evidenceGrade) where.evidenceGrade = evidenceGrade as string;

    const effects = await prisma.foodBacteriaEffect.findMany({
      where,
      include: { species: true, food: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(effects);
  } catch (error) {
    console.error('getEffects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createEffect(req: Request, res: Response): Promise<void> {
  try {
    const { speciesId, foodId, effect, evidenceGrade, evidenceBasis, mechanism, confidenceScore, keyReference, reviewStatus } = req.body;

    const existing = await prisma.foodBacteriaEffect.findUnique({
      where: { speciesId_foodId: { speciesId, foodId } },
    });

    if (existing) {
      const updated = await prisma.foodBacteriaEffect.update({
        where: { id: existing.id },
        data: {
          effect: effect ?? existing.effect,
          ...(evidenceGrade !== undefined && { evidenceGrade }),
          ...(evidenceBasis !== undefined && { evidenceBasis }),
          ...(mechanism !== undefined && { mechanism }),
          ...(confidenceScore !== undefined && { confidenceScore }),
          ...(keyReference !== undefined && { keyReference }),
          ...(reviewStatus !== undefined && { reviewStatus }),
        },
      });
      res.status(200).json(updated);
      return;
    }

    const created = await prisma.foodBacteriaEffect.create({
      data: {
        speciesId,
        foodId,
        effect: effect ?? 'NEUTRAL',
        evidenceGrade,
        evidenceBasis,
        mechanism,
        confidenceScore,
        keyReference,
        reviewStatus: reviewStatus ?? 'draft',
      },
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('createEffect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateEffect(req: Request, res: Response): Promise<void> {
  try {
    const { effect, evidenceGrade, evidenceBasis, mechanism, confidenceScore, keyReference, reviewStatus } = req.body;
    const data: any = {};
    if (effect !== undefined) data.effect = effect;
    if (evidenceGrade !== undefined) data.evidenceGrade = evidenceGrade;
    if (evidenceBasis !== undefined) data.evidenceBasis = evidenceBasis;
    if (mechanism !== undefined) data.mechanism = mechanism;
    if (confidenceScore !== undefined) data.confidenceScore = confidenceScore;
    if (keyReference !== undefined) data.keyReference = keyReference;
    if (reviewStatus !== undefined) {
      data.reviewStatus = reviewStatus;
      if (reviewStatus === 'approved') {
        data.reviewedBy = req.user!.userId;
        data.reviewedAt = new Date();
      }
    }

    const updated = await prisma.foodBacteriaEffect.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(updated);
  } catch (error) {
    console.error('updateEffect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteEffect(req: Request, res: Response): Promise<void> {
  try {
    await prisma.foodBacteriaEffect.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Effect deleted' });
  } catch (error) {
    console.error('deleteEffect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function reviewEffect(req: Request, res: Response): Promise<void> {
  try {
    const { reviewStatus } = req.body;
    const updated = await prisma.foodBacteriaEffect.update({
      where: { id: req.params.id as string },
      data: {
        reviewStatus,
        reviewedBy: req.user!.userId,
        reviewedAt: new Date(),
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('reviewEffect error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPendingReviewEffects(req: Request, res: Response): Promise<void> {
  try {
    const effects = await prisma.foodBacteriaEffect.findMany({
      where: { reviewStatus: { in: ['draft', 'pending_review'] } },
      include: { species: true, food: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(effects);
  } catch (error) {
    console.error('getPendingReviewEffects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getLowConfidenceEffects(req: Request, res: Response): Promise<void> {
  try {
    const effects = await prisma.foodBacteriaEffect.findMany({
      where: {
        OR: [
          { confidenceScore: { lt: 50 } },
          { confidenceScore: null, evidenceGrade: null },
        ],
      },
      include: { species: true, food: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(effects);
  } catch (error) {
    console.error('getLowConfidenceEffects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// ENHANCED RULES CRUD
// ==================================================

export async function getRules(req: Request, res: Response): Promise<void> {
  try {
    const rules = await prisma.microbiomeRule.findMany({
      orderBy: { createdAt: 'desc' },
      include: { species: true },
    });
    const parsed = rules.map(r => ({
      ...r,
      foodsToEat: parseJsonField(r.foodsToEat),
      foodsToAvoid: parseJsonField(r.foodsToAvoid),
      probiotics: parseJsonField(r.probiotics),
      prebiotics: parseJsonField(r.prebiotics),
    }));
    res.json(parsed);
  } catch (error) {
    console.error('getRules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createRule(req: Request, res: Response): Promise<void> {
  try {
    const { bacteriaName, level, clinicalDirection, foodsToEat, foodsToAvoid, probiotics, prebiotics, shortExplanation, evidenceGradeOverall, confidenceScore, medicalNotes } = req.body;

    const speciesId = await lookupSpeciesId(bacteriaName);

    const rule = await prisma.microbiomeRule.create({
      data: {
        bacteriaName,
        level: level ?? 'NORMAL',
        speciesId,
        clinicalDirection,
        foodsToEat: JSON.stringify(foodsToEat || []),
        foodsToAvoid: JSON.stringify(foodsToAvoid || []),
        probiotics: JSON.stringify(probiotics || []),
        prebiotics: JSON.stringify(prebiotics || []),
        shortExplanation,
        evidenceGradeOverall,
        confidenceScore,
        medicalNotes,
        createdBy: req.user!.userId,
      },
      include: { species: true },
    });
    res.status(201).json({
      ...rule,
      foodsToEat: parseJsonField(rule.foodsToEat),
      foodsToAvoid: parseJsonField(rule.foodsToAvoid),
      probiotics: parseJsonField(rule.probiotics),
      prebiotics: parseJsonField(rule.prebiotics),
    });
  } catch (error) {
    console.error('createRule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateRule(req: Request, res: Response): Promise<void> {
  try {
    const { bacteriaName, level, clinicalDirection, foodsToEat, foodsToAvoid, probiotics, prebiotics, shortExplanation, evidenceGradeOverall, confidenceScore, medicalNotes, isActive } = req.body;
    const data: any = {};
    if (bacteriaName !== undefined) {
      data.bacteriaName = bacteriaName;
      data.speciesId = await lookupSpeciesId(bacteriaName);
    }
    if (level !== undefined) data.level = level;
    if (clinicalDirection !== undefined) data.clinicalDirection = clinicalDirection;
    if (foodsToEat !== undefined) data.foodsToEat = JSON.stringify(foodsToEat);
    if (foodsToAvoid !== undefined) data.foodsToAvoid = JSON.stringify(foodsToAvoid);
    if (probiotics !== undefined) data.probiotics = JSON.stringify(probiotics);
    if (prebiotics !== undefined) data.prebiotics = JSON.stringify(prebiotics);
    if (shortExplanation !== undefined) data.shortExplanation = shortExplanation;
    if (evidenceGradeOverall !== undefined) data.evidenceGradeOverall = evidenceGradeOverall;
    if (confidenceScore !== undefined) data.confidenceScore = confidenceScore;
    if (medicalNotes !== undefined) data.medicalNotes = medicalNotes;
    if (isActive !== undefined) data.isActive = isActive;

    const rule = await prisma.microbiomeRule.update({
      where: { id: req.params.id as string },
      data,
      include: { species: true },
    });
    res.json({
      ...rule,
      foodsToEat: parseJsonField(rule.foodsToEat),
      foodsToAvoid: parseJsonField(rule.foodsToAvoid),
      probiotics: parseJsonField(rule.probiotics),
      prebiotics: parseJsonField(rule.prebiotics),
    });
  } catch (error) {
    console.error('updateRule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteRule(req: Request, res: Response): Promise<void> {
  try {
    await prisma.microbiomeRule.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Rule deleted' });
  } catch (error) {
    console.error('deleteRule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// IMPORT / EXPORT
// ==================================================

export async function importJson(req: Request, res: Response): Promise<void> {
  try {
    const items: any[] = req.body;
    if (!Array.isArray(items)) {
      res.status(400).json({ error: 'Request body must be an array of effect objects' });
      return;
    }
    let imported = 0;
    const errors: string[] = [];
    for (const item of items) {
      const result = await upsertEffect(item);
      if (result.success) {
        imported++;
      } else {
        errors.push(result.error!);
      }
    }
    res.json({ imported, errors });
  } catch (error) {
    console.error('importJson error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function importCsv(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const content = req.file.buffer.toString('utf-8');
    const records: any[] = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    let imported = 0;
    const errors: string[] = [];
    for (const record of records) {
      const result = await upsertEffect({
        speciesName: record.speciesName,
        foodName: record.foodName,
        effect: record.effect,
        evidenceGrade: record.evidenceGrade,
        evidenceBasis: record.evidenceBasis,
        mechanism: record.mechanism,
        confidenceScore: record.confidenceScore ? parseFloat(record.confidenceScore) : undefined,
        keyReference: record.keyReference,
      });
      if (result.success) {
        imported++;
      } else {
        errors.push(result.error!);
      }
    }
    res.json({ imported, errors });
  } catch (error) {
    console.error('importCsv error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function importXlsx(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const records: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    let imported = 0;
    const errors: string[] = [];
    for (const record of records) {
      const result = await upsertEffect({
        speciesName: record.speciesName,
        foodName: record.foodName,
        effect: record.effect,
        evidenceGrade: record.evidenceGrade,
        evidenceBasis: record.evidenceBasis,
        mechanism: record.mechanism,
        confidenceScore: record.confidenceScore ? parseFloat(record.confidenceScore) : undefined,
        keyReference: record.keyReference,
      });
      if (result.success) {
        imported++;
      } else {
        errors.push(result.error!);
      }
    }
    res.json({ imported, errors });
  } catch (error) {
    console.error('importXlsx error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function exportEffects(req: Request, res: Response): Promise<void> {
  try {
    const effects = await prisma.foodBacteriaEffect.findMany({
      include: { species: { select: { name: true } }, food: { select: { name: true } } },
    });
    const data = effects.map(e => ({
      id: e.id,
      speciesName: e.species.name,
      foodName: e.food.name,
      effect: e.effect,
      evidenceGrade: e.evidenceGrade,
      evidenceBasis: e.evidenceBasis,
      mechanism: e.mechanism,
      confidenceScore: e.confidenceScore,
      keyReference: e.keyReference,
      reviewStatus: e.reviewStatus,
    }));
    res.json(data);
  } catch (error) {
    console.error('exportEffects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  try {
    const effects = await prisma.foodBacteriaEffect.findMany({
      include: { species: { select: { name: true } }, food: { select: { name: true } } },
    });
    const header = 'speciesName, foodName, effect, evidenceGrade, evidenceBasis, mechanism, confidenceScore, keyReference, reviewStatus\n';
    const rows = effects.map(e =>
      `"${e.species.name}","${e.food.name}","${e.effect}","${e.evidenceGrade || ''}","${e.evidenceBasis || ''}","${e.mechanism || ''}","${e.confidenceScore ?? ''}","${e.keyReference || ''}","${e.reviewStatus}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="effects.csv"');
    res.send(header + rows);
  } catch (error) {
    console.error('exportCsv error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// ENHANCED ANALYTICS
// ==================================================

export async function getAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const [
      mostCommonIssues,
      mostCommonDeficiencies,
      mostRecommendedFoods,
      mostAvoidedFoods,
      evidenceDistribution,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      totalSpecies,
      totalFoods,
      totalEffects,
      withEvidence,
      pendingReview,
      totalPairs,
      nonNeutralEffects,
      userHealthScoreTrends,
      userCount,
      reportCount,
      ruleCount,
    ] = await Promise.all([
      prisma.bacteriaResult.groupBy({
        by: ['bacteriaName'],
        where: { level: 'HIGH' },
        _count: { bacteriaName: true },
        orderBy: { _count: { bacteriaName: 'desc' } },
        take: 20,
      }),
      prisma.bacteriaResult.groupBy({
        by: ['bacteriaName'],
        where: { level: 'LOW' },
        _count: { bacteriaName: true },
        orderBy: { _count: { bacteriaName: 'desc' } },
        take: 20,
      }),
      prisma.foodRecommendation.groupBy({
        by: ['foodName'],
        _count: { foodName: true },
        orderBy: { _count: { foodName: 'desc' } },
        take: 20,
      }),
      prisma.foodRecommendation.groupBy({
        by: ['foodName'],
        where: { category: 'TO_AVOID' },
        _count: { foodName: true },
        orderBy: { _count: { foodName: 'desc' } },
        take: 20,
      }),
      prisma.foodBacteriaEffect.groupBy({
        by: ['evidenceGrade'],
        _count: { evidenceGrade: true },
      }),
      prisma.foodBacteriaEffect.count({ where: { confidenceScore: { gte: 70 } } }),
      prisma.foodBacteriaEffect.count({ where: { confidenceScore: { gte: 40, lt: 70 } } }),
      prisma.foodBacteriaEffect.count({ where: { OR: [{ confidenceScore: { lt: 40 } }, { confidenceScore: null }] } }),
      prisma.bacteriaSpecies.count(),
      prisma.foodItem.count(),
      prisma.foodBacteriaEffect.count(),
      prisma.foodBacteriaEffect.count({ where: { NOT: { evidenceGrade: null } } }),
      prisma.foodBacteriaEffect.count({ where: { reviewStatus: { in: ['draft', 'pending_review'] } } }),
      prisma.bacteriaSpecies.count(),
      prisma.foodBacteriaEffect.count({ where: { NOT: { effect: 'NEUTRAL' } } }),
      prisma.analyticsSnapshot.findMany({
        where: { metric: 'avg_health_score' },
        orderBy: { recordedAt: 'desc' },
        take: 30,
      }),
      prisma.user.count(),
      prisma.userMicrobiomeReport.count(),
      prisma.microbiomeRule.count(),
    ]);

    const possiblePairs = totalPairs * totalFoods;

    res.json({
      mostCommonIssues: mostCommonIssues.map(b => ({ bacteriaName: b.bacteriaName, count: b._count.bacteriaName })),
      mostCommonDeficiencies: mostCommonDeficiencies.map(b => ({ bacteriaName: b.bacteriaName, count: b._count.bacteriaName })),
      mostRecommendedFoods: mostRecommendedFoods.map(f => ({ foodName: f.foodName, count: f._count.foodName })),
      mostAvoidedFoods: mostAvoidedFoods.map(f => ({ foodName: f.foodName, count: f._count.foodName })),
      evidenceDistribution: evidenceDistribution.map(g => ({ grade: g.evidenceGrade || 'UNKNOWN', count: g._count.evidenceGrade })),
      confidenceDistribution: {
        high: highConfidence,
        medium: mediumConfidence,
        low: lowConfidence,
      },
      researchCoverage: {
        totalSpecies,
        totalFoods,
        totalEffects,
        withEvidence,
        pendingReview,
        coverage: possiblePairs > 0 ? Math.round((nonNeutralEffects / possiblePairs) * 10000) / 100 : 0,
      },
      userHealthScoreTrends: userHealthScoreTrends.map(s => ({
        metric: s.metric,
        value: s.value,
        label: s.label,
        period: s.period,
        recordedAt: s.recordedAt,
      })),
      speciesCount: totalSpecies,
      foodCount: totalFoods,
      effectCount: totalEffects,
      ruleCount,
      userCount,
      reportCount,
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// ENHANCED USER RECOMMENDATIONS
// ==================================================

export async function getUserRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const bacteriaResults = await prisma.bacteriaResult.findMany({ where: { userId } });

    const grouped = {
      TO_EAT: [] as any[],
      TO_AVOID: [] as any[],
      PROBIOTIC: [] as any[],
      PREBIOTIC: [] as any[],
    };

    for (const result of bacteriaResults) {
      const rule = await prisma.microbiomeRule.findFirst({
        where: { bacteriaName: result.bacteriaName, level: result.level, isActive: true },
      });

      if (!rule) continue;

      const foodsToEat = parseJsonField(rule.foodsToEat);
      const foodsToAvoid = parseJsonField(rule.foodsToAvoid);
      const probiotics = parseJsonField(rule.probiotics);
      const prebiotics = parseJsonField(rule.prebiotics);

      const allFoodNames = [...new Set([...foodsToEat, ...foodsToAvoid, ...probiotics, ...prebiotics])];

      const effects = allFoodNames.length > 0 && result.speciesId
        ? await prisma.foodBacteriaEffect.findMany({
            where: {
              speciesId: result.speciesId,
              food: { name: { in: allFoodNames } },
            },
            include: { food: true },
          })
        : [];

      const effectMap = new Map<string, { evidenceGrade?: string | null; confidenceScore?: number | null }>();
      for (const eff of effects) {
        effectMap.set(eff.food.name, { evidenceGrade: eff.evidenceGrade, confidenceScore: eff.confidenceScore });
      }

      const addWithEffect = (foodName: string, category: keyof typeof grouped, reason: string) => {
        const e = effectMap.get(foodName);
        grouped[category].push({
          foodName,
          reason,
          evidenceGrade: e?.evidenceGrade || rule.evidenceGradeOverall || null,
          confidenceScore: e?.confidenceScore ?? rule.confidenceScore ?? null,
        });
      };

      for (const food of foodsToEat) {
        const reason = `${result.bacteriaName} level is ${result.level} - recommended to eat`;
        const rec = await prisma.foodRecommendation.create({
          data: { userId, bacteriaResultId: result.id, mealTime: 'ANY', foodName: food, category: 'TO_EAT', reason },
        });
        addWithEffect(food, 'TO_EAT', reason);
      }

      for (const food of foodsToAvoid) {
        const reason = `${result.bacteriaName} level is ${result.level} - recommended to avoid`;
        await prisma.foodRecommendation.create({
          data: { userId, bacteriaResultId: result.id, mealTime: 'ANY', foodName: food, category: 'TO_AVOID', reason },
        });
        addWithEffect(food, 'TO_AVOID', reason);
      }

      for (const food of probiotics) {
        const reason = `Probiotic for ${result.bacteriaName} (${result.level})`;
        await prisma.foodRecommendation.create({
          data: { userId, bacteriaResultId: result.id, mealTime: 'ANY', foodName: food, category: 'PROBIOTIC', reason },
        });
        addWithEffect(food, 'PROBIOTIC', reason);
      }

      for (const food of prebiotics) {
        const reason = `Prebiotic for ${result.bacteriaName} (${result.level})`;
        await prisma.foodRecommendation.create({
          data: { userId, bacteriaResultId: result.id, mealTime: 'ANY', foodName: food, category: 'PREBIOTIC', reason },
        });
        addWithEffect(food, 'PREBIOTIC', reason);
      }

      if (result.speciesId) {
        const additionalEffects = await prisma.foodBacteriaEffect.findMany({
          where: {
            speciesId: result.speciesId,
            NOT: { effect: 'NEUTRAL' },
          },
          include: { food: true },
        });

        for (const eff of additionalEffects) {
          if ((eff.effect === 'INCREASES' || eff.effect === 'FEEDS') && result.level === 'LOW' && !foodsToEat.includes(eff.food.name)) {
            const reason = `${result.bacteriaName} is low - ${eff.food.name} ${eff.effect}`;
            await prisma.foodRecommendation.create({
              data: { userId, bacteriaResultId: result.id, mealTime: 'ANY', foodName: eff.food.name, category: 'TO_EAT', reason, evidenceGrade: eff.evidenceGrade, confidenceScore: eff.confidenceScore },
            });
            grouped.TO_EAT.push({ foodName: eff.food.name, reason, evidenceGrade: eff.evidenceGrade, confidenceScore: eff.confidenceScore });
          }
          if ((eff.effect === 'DECREASES' || eff.effect === 'INHIBITS') && result.level === 'HIGH' && !foodsToAvoid.includes(eff.food.name)) {
            const reason = `${result.bacteriaName} is high - ${eff.food.name} ${eff.effect}`;
            await prisma.foodRecommendation.create({
              data: { userId, bacteriaResultId: result.id, mealTime: 'ANY', foodName: eff.food.name, category: 'TO_AVOID', reason, evidenceGrade: eff.evidenceGrade, confidenceScore: eff.confidenceScore },
            });
            grouped.TO_AVOID.push({ foodName: eff.food.name, reason, evidenceGrade: eff.evidenceGrade, confidenceScore: eff.confidenceScore });
          }
        }
      }
    }

    res.json(grouped);
  } catch (error) {
    console.error('getUserRecommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// ENHANCED DIET PLAN
// ==================================================

export async function getDietPlan(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const bacteriaResults = await prisma.bacteriaResult.findMany({ where: { userId } });

    const foodsToEatSet = new Set<string>();
    const foodsToAvoidSet = new Set<string>();

    for (const result of bacteriaResults) {
      const rule = await prisma.microbiomeRule.findFirst({
        where: { bacteriaName: result.bacteriaName, level: result.level, isActive: true },
      });
      if (rule) {
        parseJsonField(rule.foodsToEat).forEach(f => foodsToEatSet.add(f));
        parseJsonField(rule.foodsToAvoid).forEach(f => foodsToAvoidSet.add(f));
      }

      if (result.speciesId) {
        const isBeneficial = await prisma.bacteriaSpecies.findUnique({
          where: { id: result.speciesId },
          select: { isBeneficial: true },
        });

        if (isBeneficial) {
          const incEffects = await prisma.foodBacteriaEffect.findMany({
            where: {
              speciesId: result.speciesId,
              effect: { in: ['INCREASES', 'FEEDS'] },
            },
            include: { food: true },
          });
          for (const eff of incEffects) {
            foodsToEatSet.add(eff.food.name);
          }

          if (!isBeneficial.isBeneficial) {
            const decEffects = await prisma.foodBacteriaEffect.findMany({
              where: {
                speciesId: result.speciesId,
                effect: { in: ['DECREASES', 'INHIBITS'] },
              },
              include: { food: true },
            });
            for (const eff of decEffects) {
              foodsToEatSet.add(eff.food.name);
            }
          }
        }

        const highEffects = await prisma.foodBacteriaEffect.findMany({
          where: {
            speciesId: result.speciesId,
            effect: { in: ['DECREASES', 'INHIBITS'] },
          },
          include: { food: true },
        });
        for (const eff of highEffects) {
          if (result.level === 'HIGH') {
            foodsToEatSet.add(eff.food.name);
          }
        }
      }
    }

    const foodsToEatArr = Array.from(foodsToEatSet);
    const foodsToAvoidArr = Array.from(foodsToAvoidSet);

    const allFoodItems = await prisma.foodItem.findMany();
    const foodMap = new Map(allFoodItems.map(f => [f.name, f]));

    const availableToEat = foodsToEatArr.filter(f => !foodsToAvoidArr.includes(f) && foodMap.has(f));

    const byCategory = (cats: string[]) => {
      return availableToEat
        .filter(name => cats.includes(foodMap.get(name)?.category || ''))
        .map(name => ({
          name,
          category: foodMap.get(name)?.category || '',
          reason: 'Supports gut microbiome balance',
        }));
    };

    const mealPlan = {
      breakfast: byCategory(['FRUITS', 'GRAINS', 'FERMENTED', 'DAIRY', 'BREAKFAST']),
      lunch: byCategory(['VEGETABLES', 'LEGUMES', 'PROTEIN', 'LUNCH']),
      dinner: byCategory(['VEGETABLES', 'WHOLE_GRAINS', 'GRAINS', 'PROTEIN', 'DINNER']),
      snacks: byCategory(['NUTS', 'SEEDS', 'FRUITS', 'SNACKS']),
    };

    if (availableToEat.length > 0) {
      if (mealPlan.breakfast.length === 0) mealPlan.breakfast = [{ name: availableToEat[0], category: foodMap.get(availableToEat[0])?.category || '', reason: 'Supports gut microbiome balance' }];
      if (mealPlan.lunch.length === 0) mealPlan.lunch = [{ name: availableToEat[0], category: foodMap.get(availableToEat[0])?.category || '', reason: 'Supports gut microbiome balance' }];
      if (mealPlan.dinner.length === 0) mealPlan.dinner = [{ name: availableToEat[0], category: foodMap.get(availableToEat[0])?.category || '', reason: 'Supports gut microbiome balance' }];
      if (mealPlan.snacks.length === 0) mealPlan.snacks = [{ name: availableToEat[availableToEat.length > 1 ? 1 : 0], category: foodMap.get(availableToEat[availableToEat.length > 1 ? 1 : 0])?.category || '', reason: 'Supports gut microbiome balance' }];
    }

    for (const [meal, items] of Object.entries(mealPlan)) {
      for (const item of items) {
        await prisma.dietPlanSuggestion.create({
          data: { userId, meal, foodName: item.name, category: item.category, reason: item.reason },
        }).catch(() => {});
      }
    }

    res.json(mealPlan);
  } catch (error) {
    console.error('getDietPlan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// ENHANCED HEALTH SCORE
// ==================================================

export async function getHealthScore(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const results = await prisma.bacteriaResult.findMany({
      where: { userId },
      include: { species: true },
    });

    let highCount = 0, lowCount = 0, normalCount = 0;
    let beneficialSpeciesScore = 100;
    let totalBeneficial = 0;
    let beneficialSum = 0;

    const speciesIds = results.filter(r => r.speciesId).map(r => r.speciesId!);
    const weights = speciesIds.length > 0
      ? await prisma.microbiomeHealthScoreWeight.findMany({
          where: { speciesId: { in: speciesIds } },
        })
      : [];
    const weightMap = new Map(weights.map(w => [w.speciesId, w]));

    for (const r of results) {
      if (r.level === 'HIGH') highCount++;
      else if (r.level === 'LOW') lowCount++;
      else if (r.level === 'NORMAL') normalCount++;

      if (r.species) {
        const w = weightMap.get(r.speciesId!);
        if (r.species.isBeneficial) {
          totalBeneficial++;
          if (r.level === 'NORMAL') beneficialSum += 100;
          else if (r.level === 'HIGH') beneficialSum += w?.beneficialHighWeight ?? 80;
          else if (r.level === 'LOW') beneficialSum += w?.beneficialLowWeight ?? 40;
        }
      }
    }

    beneficialSpeciesScore = totalBeneficial > 0 ? Math.round(beneficialSum / totalBeneficial) : 50;

    const distinctSpecies = new Set(results.filter(r => r.speciesId).map(r => r.speciesId!));
    const distinctCount = distinctSpecies.size;
    const gutDiversityScore = Math.min(100, Math.round((distinctCount / 30) * 100));

    const akkermansia = results.find(r => r.bacteriaName.toLowerCase().includes('akkermansia'));
    let gutBarrierScore = 100;
    if (akkermansia) {
      if (akkermansia.level === 'LOW') gutBarrierScore = 40;
      else if (akkermansia.level === 'NORMAL') gutBarrierScore = 100;
      else if (akkermansia.level === 'HIGH') gutBarrierScore = 80;
    }
    const butyrateProducers = results.filter(r =>
      ['faecalibacterium', 'roseburia', 'eubacterium', 'butyrivibrio', 'anaerostipes'].some(n =>
        r.bacteriaName.toLowerCase().includes(n)
      )
    );
    const lowButyrate = butyrateProducers.filter(r => r.level === 'LOW');
    if (lowButyrate.length > 0) {
      gutBarrierScore = Math.round((gutBarrierScore + (lowButyrate.length > 2 ? 30 : 60)) / 2);
    }

    const opportunistic = results.filter(r => r.species && !r.species.isBeneficial);
    const opportunisticHigh = opportunistic.filter(r => r.level === 'HIGH').length;
    const antiInflammatoryLow = results.filter(r =>
      r.species?.isBeneficial && r.level === 'LOW'
    ).length;
    let inflammatoryRiskScore = 100;
    inflammatoryRiskScore -= opportunisticHigh * 15;
    inflammatoryRiskScore -= antiInflammatoryLow * 10;
    inflammatoryRiskScore = Math.max(0, Math.min(100, inflammatoryRiskScore));

    const overallScore = Math.round(
      beneficialSpeciesScore * 0.4 +
      gutDiversityScore * 0.25 +
      gutBarrierScore * 0.20 +
      inflammatoryRiskScore * 0.15
    );

    const lastSnapshots = await prisma.analyticsSnapshot.findMany({
      where: { metric: 'avg_health_score' },
      orderBy: { recordedAt: 'desc' },
      take: 7,
    });

    let trend: 'improving' | 'stable' | 'declining' | 'insufficient_data' = 'insufficient_data';
    if (lastSnapshots.length >= 2) {
      const recentAvg = lastSnapshots.slice(0, 3).reduce((s, x) => s + x.value, 0) / Math.min(3, lastSnapshots.length);
      const olderAvg = lastSnapshots.slice(-3).reduce((s, x) => s + x.value, 0) / Math.min(3, lastSnapshots.length);
      const diff = recentAvg - olderAvg;
      if (diff > 5) trend = 'improving';
      else if (diff < -5) trend = 'declining';
      else trend = 'stable';
    }

    await prisma.analyticsSnapshot.create({
      data: {
        metric: 'avg_health_score',
        value: overallScore,
        label: userId,
        period: 'daily',
      },
    }).catch(() => {});

    res.json({
      overallScore,
      subscores: {
        beneficialSpeciesScore,
        gutDiversityScore,
        gutBarrierScore,
        inflammatoryRiskScore,
      },
      breakdown: {
        highCount,
        lowCount,
        normalCount,
        totalResults: results.length,
      },
      trend,
    });
  } catch (error) {
    console.error('getHealthScore error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// REPORT GENERATION
// ==================================================

export async function generateReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const [user, bacteriaResults] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.bacteriaResult.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' } }),
    ]);

    const grouped = { TO_EAT: [] as any[], TO_AVOID: [] as any[], PROBIOTIC: [] as any[], PREBIOTIC: [] as any[] };
    for (const result of bacteriaResults) {
      const rule = await prisma.microbiomeRule.findFirst({
        where: { bacteriaName: result.bacteriaName, level: result.level, isActive: true },
      });
      if (!rule) continue;
      const pushItems = (arr: string[], cat: keyof typeof grouped, prefix: string) => {
        for (const food of arr) {
          grouped[cat].push({
            foodName: food,
            reason: `${prefix} for ${result.bacteriaName} (${result.level})`,
            evidenceGrade: rule.evidenceGradeOverall,
            confidenceScore: rule.confidenceScore,
          });
        }
      };
      pushItems(parseJsonField(rule.foodsToEat), 'TO_EAT', 'Recommended');
      pushItems(parseJsonField(rule.foodsToAvoid), 'TO_AVOID', 'Avoid');
      pushItems(parseJsonField(rule.probiotics), 'PROBIOTIC', 'Probiotic');
      pushItems(parseJsonField(rule.prebiotics), 'PREBIOTIC', 'Prebiotic');
    }

    const foodsToEatSet = new Set<string>();
    for (const result of bacteriaResults) {
      const rule = await prisma.microbiomeRule.findFirst({
        where: { bacteriaName: result.bacteriaName, level: result.level, isActive: true },
      });
      if (rule) parseJsonField(rule.foodsToEat).forEach(f => foodsToEatSet.add(f));
    }

    const allFoodItems = await prisma.foodItem.findMany();
    const foodMap = new Map(allFoodItems.map(f => [f.name, f]));
    const availableToEat = Array.from(foodsToEatSet).filter(f => foodMap.has(f));
    const byCategory = (cats: string[]) => availableToEat.filter(name => cats.includes(foodMap.get(name)?.category || '')).map(name => ({ name, category: foodMap.get(name)?.category || '' }));

    const dietPlan = {
      breakfast: byCategory(['FRUITS', 'GRAINS', 'FERMENTED', 'DAIRY', 'BREAKFAST']),
      lunch: byCategory(['VEGETABLES', 'LEGUMES', 'PROTEIN', 'LUNCH']),
      dinner: byCategory(['VEGETABLES', 'WHOLE_GRAINS', 'GRAINS', 'PROTEIN', 'DINNER']),
      snacks: byCategory(['NUTS', 'SEEDS', 'FRUITS', 'SNACKS']),
    };

    let highCount = 0, lowCount = 0, normalCount = 0;
    for (const r of bacteriaResults) {
      if (r.level === 'HIGH') highCount++;
      else if (r.level === 'LOW') lowCount++;
      else if (r.level === 'NORMAL') normalCount++;
    }
    let score = 100 - (highCount * 15) - (lowCount * 10) + (normalCount * 5);
    score = Math.max(0, Math.min(100, score));

    res.json({
      user,
      bacteriaResults,
      recommendations: grouped,
      dietPlan,
      healthScore: {
        overallScore: score,
        subscores: {
          beneficialSpeciesScore: 0,
          gutDiversityScore: 0,
          gutBarrierScore: 0,
          inflammatoryRiskScore: 0,
        },
        breakdown: { highCount, lowCount, normalCount, totalResults: bacteriaResults.length },
      },
      disclaimer: 'For educational and wellness guidance only. Not medical advice.',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('generateReport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// PDF REPORT GENERATION
// ==================================================

export async function exportPdfReport(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;

    const [user, bacteriaResults] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.bacteriaResult.findMany({ where: { userId }, orderBy: { recordedAt: 'desc' } }),
    ]);

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const page = doc.addPage([612, 792]);
    const { width, height } = page.getSize();

    let y = height - 50;
    const margin = 50;
    const fontSize = 11;
    const titleSize = 20;
    const lineHeight = 16;

    page.drawText('VitaNexa AI - Microbiome Report', { x: margin, y, size: titleSize, font: fontBold, color: rgb(0.2, 0.4, 0.8) });
    y -= 30;

    page.drawText(`Name: ${user?.name || 'N/A'}`, { x: margin, y, size: fontSize, font });
    y -= lineHeight;
    page.drawText(`Email: ${user?.email || 'N/A'}`, { x: margin, y, size: fontSize, font });
    y -= lineHeight;
    page.drawText(`Date: ${new Date().toISOString().split('T')[0]}`, { x: margin, y, size: fontSize, font });
    y -= 25;

    page.drawText('Bacteria Results', { x: margin, y, size: 14, font: fontBold, color: rgb(0.2, 0.4, 0.8) });
    y -= 20;

    for (const result of bacteriaResults) {
      page.drawText(`${result.bacteriaName}: ${result.level}`, { x: margin, y, size: fontSize, font });
      y -= lineHeight;
      if (y < 60) {
        const newPage = doc.addPage([612, 792]);
        y = height - 50;
      }
    }

    y -= 15;
    page.drawText('Health Score', { x: margin, y, size: 14, font: fontBold, color: rgb(0.2, 0.4, 0.8) });
    y -= 20;

    const highC = bacteriaResults.filter(r => r.level === 'HIGH').length;
    const lowC = bacteriaResults.filter(r => r.level === 'LOW').length;
    const normC = bacteriaResults.filter(r => r.level === 'NORMAL').length;
    let healthScore = 100 - (highC * 15) - (lowC * 10) + (normC * 5);
    healthScore = Math.max(0, Math.min(100, healthScore));

    page.drawText(`Overall Score: ${healthScore}/100`, { x: margin, y, size: fontSize, font: fontBold });
    y -= lineHeight;
    page.drawText(`High: ${highC} | Low: ${lowC} | Normal: ${normC}`, { x: margin, y, size: fontSize, font });
    y -= 25;

    page.drawText('Disclaimer: For educational and wellness guidance only. Not medical advice.', {
      x: margin,
      y: 40,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await doc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="microbiome-report.pdf"');
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('exportPdfReport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ==================================================
// REPORT UPLOAD & MANAGEMENT
// ==================================================

export async function uploadReport(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const { parsedData, results, healthScore } = req.body;
    const report = await prisma.userMicrobiomeReport.create({
      data: {
        userId: req.user!.userId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileUrl: `/uploads/reports/${req.file.filename}`,
        parsedData: parsedData ? JSON.stringify(parsedData) : undefined,
        results: results ? JSON.stringify(results) : undefined,
        healthScore: healthScore ? parseInt(healthScore) : undefined,
      },
    });
    res.status(201).json(report);
  } catch (error) {
    console.error('uploadReport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getReports(req: Request, res: Response): Promise<void> {
  try {
    const reports = await prisma.userMicrobiomeReport.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (error) {
    console.error('getReports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteReport(req: Request, res: Response): Promise<void> {
  try {
    await prisma.userMicrobiomeReport.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('deleteReport error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
