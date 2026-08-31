import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'active' } });
    const suspendedUsers = await prisma.user.count({ where: { status: 'suspended' } });
    const inactiveUsers = await prisma.user.count({ where: { status: 'inactive' } });
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const newUsersToday = await prisma.user.count({ where: { createdAt: { gte: todayStart } } });

    const roles = ['USER', 'ADMIN', 'MODERATOR', 'RESEARCHER', 'NUTRITIONIST', 'DOCTOR'];
    const usersByRole: Record<string, number> = {};
    for (const r of roles) {
      usersByRole[r] = await prisma.user.count({ where: { role: r } });
    }

    const totalDonors = await prisma.bloodDonor.count();
    const totalRequests = await prisma.bloodRequest.count();
    const pendingVolunteers = await prisma.volunteerDriver.count({ where: { status: 'PENDING' } });
    const verifiedVolunteers = await prisma.volunteerDriver.count({ where: { status: 'VERIFIED' } });
    const totalHospitals = await prisma.hospital.count();
    const pendingBloodRequests = await prisma.bloodRequest.count({ where: { status: 'PENDING' } });

    res.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      inactiveUsers,
      newUsersToday,
      adminCount,
      usersByRole,
      totalDonors,
      totalRequests,
      pendingVolunteers,
      verifiedVolunteers,
      totalHospitals,
      pendingBloodRequests,
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSignupsOverTime(req: Request, res: Response): Promise<void> {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    const signupsByDate: Record<string, number> = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      signupsByDate[key] = 0;
    }

    users.forEach((u) => {
      const key = u.createdAt.toISOString().split('T')[0];
      if (signupsByDate[key] !== undefined) signupsByDate[key]++;
    });

    const data = Object.entries(signupsByDate).map(([date, count]) => ({ date, count }));
    res.json(data);
  } catch (error) {
    console.error('Signups over time error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getActiveUsersChart(req: Request, res: Response): Promise<void> {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data: { date: string; active: number; newUsers: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      date.setHours(0, 0, 0, 0);

      const newUsers = await prisma.user.count({
        where: { createdAt: { gte: date, lte: dayEnd } },
      });

      const active = await prisma.auditLog.count({
        where: { createdAt: { gte: date, lte: dayEnd } },
      });

      data.push({ date: date.toISOString().split('T')[0], active, newUsers });
    }

    res.json(data);
  } catch (error) {
    console.error('Active users chart error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getSystemAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const totalBacteriaResults = await prisma.bacteriaResult.count();
    const totalFoodLogs = await prisma.foodLog.count();
    const totalPainLogs = await prisma.painLog.count();
    const totalSupplements = await prisma.supplement.count();
    const totalMealLogs = await prisma.mealLog.count();
    const totalSpoonBudgets = await prisma.spoonBudget.count();
    const totalActivities = await prisma.activity.count();
    const totalSavingsEntries = await prisma.savingsEntry.count();
    const totalSavingsGoals = await prisma.savingsGoal.count();
    const totalNotifications = await prisma.notification.count();
    const totalAuditLogs = await prisma.auditLog.count();
    const totalSessions = await prisma.session.count();

    res.json({
      totalBacteriaResults,
      totalFoodLogs,
      totalPainLogs,
      totalSupplements,
      totalMealLogs,
      totalSpoonBudgets,
      totalActivities,
      totalSavingsEntries,
      totalSavingsGoals,
      totalNotifications,
      totalAuditLogs,
      totalSessions,
    });
  } catch (error) {
    console.error('System analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
    res.json(logs);
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getNutrientAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const totalSupplements = await prisma.supplement.count();
    const totalMeals = await prisma.mealLog.count();
    const totalScans = await prisma.scanHistory.count();
    const totalInteractions = await prisma.supplementInteraction.count();

    const usersWithSupplements = await prisma.supplement.groupBy({
      by: ['userId'],
      _count: { id: true },
    });

    const supplementUsage = await prisma.supplement.groupBy({
      by: ['name'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    const mealLogs = await prisma.mealLog.findMany({
      take: 500,
      select: { foods: true, nutrientTags: true, calories: true },
    });

    const nutrientCounts: Record<string, number> = {};
    for (const meal of mealLogs) {
      if (meal.nutrientTags) {
        try {
          const tags: string[] = JSON.parse(meal.nutrientTags);
          for (const tag of tags) {
            nutrientCounts[tag.toLowerCase()] = (nutrientCounts[tag.toLowerCase()] || 0) + 1;
          }
        } catch { }
      }
    }

    const interactionStats = await prisma.supplementInteraction.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    const effectStats = await prisma.supplementInteraction.groupBy({
      by: ['effect'],
      _count: { id: true },
    });

    res.json({
      totalSupplements,
      totalMeals,
      totalScans,
      totalInteractions,
      usersWithSupplements: usersWithSupplements.length,
      topSupplements: supplementUsage.map((s) => ({ name: s.name, users: s._count.id })),
      commonNutrients: Object.entries(nutrientCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([nutrient, count]) => ({ nutrient, count })),
      interactionBySeverity: interactionStats.map((s) => ({ severity: s.severity, count: s._count.id })),
      interactionByEffect: effectStats.map((s) => ({ effect: s.effect, count: s._count.id })),
    });
  } catch (error) {
    console.error('Nutrient analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


