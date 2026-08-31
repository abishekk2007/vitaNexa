import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateDetailedAnalysis, getCoachExplanation, getMealAnalytics } from '../utils/timingEngine';

const prisma = new PrismaClient();

export async function createSupplement(req: Request, res: Response): Promise<void> {
  try {
    const supp = await prisma.supplement.create({
      data: { ...req.body, userId: req.user!.userId },
    });
    res.status(201).json(supp);
  } catch (error) {
    console.error('Create supplement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSupplements(req: Request, res: Response): Promise<void> {
  try {
    const supps = await prisma.supplement.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(supps);
  } catch (error) {
    console.error('Get supplements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateSupplement(req: Request, res: Response): Promise<void> {
  try {
    const supp = await prisma.supplement.updateMany({
      where: { id: req.params.id as string, userId: req.user!.userId },
      data: req.body,
    });
    if (supp.count === 0) { res.status(404).json({ error: 'Not found' }); return; }
    res.json({ message: 'Updated' });
  } catch (error) {
    console.error('Update supplement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteSupplement(req: Request, res: Response): Promise<void> {
  try {
    await prisma.supplement.deleteMany({ where: { id: req.params.id as string, userId: req.user!.userId } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete supplement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function checkInteractions(req: Request, res: Response): Promise<void> {
  try {
    const userSupps = await prisma.supplement.findMany({
      where: { userId: req.user!.userId },
      select: { name: true },
    });

    const userSuppNames = userSupps.map((s) => s.name.toLowerCase());
    const allInteractions = await prisma.supplementInteraction.findMany();

    const relevantInteractions = allInteractions.filter((i) =>
      userSuppNames.includes(i.supplementName.toLowerCase()) ||
      userSuppNames.includes(i.interactsWith.toLowerCase())
    );

    const reduces = relevantInteractions.filter((i) => i.effect === 'REDUCES_ABSORPTION');
    const improves = relevantInteractions.filter((i) => i.effect === 'IMPROVES_ABSORPTION');

    const timingSuggestions = userSupps.map((s) => {
      const base = `Take ${s.name} `;
      const interactions = relevantInteractions.filter(
        (i) => i.supplementName.toLowerCase() === s.name.toLowerCase()
      );
      if (interactions.some((i) => i.effect === 'REDUCES_ABSORPTION')) {
        return base + 'at least 2 hours apart from other supplements.';
      }
      return base + 'with food for best absorption.';
    });

    res.json({
      interactions: relevantInteractions,
      mayReduceAbsorption: reduces,
      mayImproveAbsorption: improves,
      timingSuggestions,
      disclaimer: 'General educational guidance only.',
    });
  } catch (error) {
    console.error('Check interactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getInteractions(req: Request, res: Response): Promise<void> {
  try {
    const interactions = await prisma.supplementInteraction.findMany({
      orderBy: { supplementName: 'asc' },
    });
    res.json(interactions);
  } catch (error) {
    console.error('Get interactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createInteraction(req: Request, res: Response): Promise<void> {
  try {
    const interaction = await prisma.supplementInteraction.create({ data: req.body });
    res.status(201).json(interaction);
  } catch (error) {
    console.error('Create interaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteInteraction(req: Request, res: Response): Promise<void> {
  try {
    await prisma.supplementInteraction.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete interaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDetailedAnalysis(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.userId;
    const supplements = await prisma.supplement.findMany({ where: { userId } });
    const meals = await prisma.mealLog.findMany({
      where: { userId },
      orderBy: { mealTime: 'desc' },
      take: 20,
    });
    const result = await generateDetailedAnalysis(userId, supplements, meals);
    res.json(result);
  } catch (error) {
    console.error('Detailed analysis error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCoachExplanationHandler(req: Request, res: Response): Promise<void> {
  try {
    const { question } = req.query;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question parameter is required' });
      return;
    }
    const result = await getCoachExplanation(req.user!.userId, question);
    res.json(result);
  } catch (error) {
    console.error('Coach explanation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function scanProduct(req: Request, res: Response): Promise<void> {
  try {
    const { barcode } = req.body;
    if (!barcode) {
      res.status(400).json({ error: 'Barcode is required' });
      return;
    }

    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data: any = await response.json();

    if (!data.product) {
      res.json({ matched: false, message: 'Product not found in Open Food Facts database' });
      return;
    }

    const product = data.product;
    const result = {
      matched: true,
      productName: product.product_name || 'Unknown Product',
      brand: product.brands || '',
      ingredients: product.ingredients_text || '',
      nutrition: {
        energyKcal: product.nutriments?.['energy-kcal_100g'] || null,
        protein: product.nutriments?.proteins_100g || null,
        fat: product.nutriments?.fat_100g || null,
        carbs: product.nutriments?.carbohydrates_100g || null,
        fiber: product.nutriments?.fiber_100g || null,
        vitaminD: product.nutriments?.['vitamin-d_100g'] || null,
        iron: product.nutriments?.iron_100g || null,
        calcium: product.nutriments?.calcium_100g || null,
        magnesium: product.nutriments?.magnesium_100g || null,
        zinc: product.nutriments?.zinc_100g || null,
        b12: product.nutriments?.['vitamin-b12_100g'] || null,
        omega3: product.nutriments?.['omega-3-fatty-acids_100g'] || null,
        vitaminC: product.nutriments?.['vitamin-c_100g'] || null,
      },
      servingSize: product.serving_size || '',
      imageUrl: product.image_url || '',
      confidenceScore: data.status === 1 ? 0.9 : 0.5,
    };

    await prisma.scanHistory.create({
      data: {
        userId: req.user!.userId,
        barcode,
        rawScanText: JSON.stringify(product),
        parsedName: result.productName,
        parsedIngredients: result.ingredients,
        confidenceScore: result.confidenceScore,
        matched: true,
        source: 'openfoodfacts',
      },
    });

    res.json(result);
  } catch (error) {
    console.error('Scan product error:', error);
    res.status(500).json({ error: 'Failed to look up product' });
  }
}

export async function getMealHistoryAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const result = await getMealAnalytics(req.user!.userId);
    res.json(result);
  } catch (error) {
    console.error('Meal history analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
