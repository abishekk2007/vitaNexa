import { Request, Response } from 'express';
import { getNutrientDashboard } from '../utils/timingEngine';

export async function dashboard(req: Request, res: Response): Promise<void> {
  try {
    const data = await getNutrientDashboard(req.user!.userId);
    res.json(data);
  } catch (error) {
    console.error('Nutrient dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
