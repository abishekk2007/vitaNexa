import { useState, useCallback, useEffect } from 'react';

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  category: 'streak' | 'milestone' | 'mastery' | 'special';
}

export interface StreakData {
  current: number;
  best: number;
  lastCheckIn: string | null;
  dailyLog: string[];
}

const ACHIEVEMENTS_STORAGE_KEY = 'vitanexa_achievements';
const STREAK_STORAGE_KEY = 'vitanexa_streak';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_checkin', title: 'First Steps', icon: '👋', description: 'Complete your first daily check-in', unlocked: false, progress: 0, maxProgress: 1, category: 'milestone' },
  { id: 'streak_3', title: 'Getting Started', icon: '🔥', description: 'Maintain a 3-day streak', unlocked: false, progress: 0, maxProgress: 3, category: 'streak' },
  { id: 'streak_7', title: 'Week Warrior', icon: '⭐', description: 'Maintain a 7-day streak', unlocked: false, progress: 0, maxProgress: 7, category: 'streak' },
  { id: 'streak_14', title: 'Fortnight Force', icon: '💪', description: 'Maintain a 14-day streak', unlocked: false, progress: 0, maxProgress: 14, category: 'streak' },
  { id: 'streak_30', title: 'Monthly Master', icon: '🏆', description: 'Maintain a 30-day streak', unlocked: false, progress: 0, maxProgress: 30, category: 'streak' },
  { id: 'streak_100', title: 'Century Club', icon: '🎖️', description: 'Maintain a 100-day streak', unlocked: false, progress: 0, maxProgress: 100, category: 'streak' },
  { id: 'energy_champion', title: 'Energy Champion', icon: '⚡', description: 'Log energy levels for 7 consecutive days', unlocked: false, progress: 0, maxProgress: 7, category: 'mastery' },
  { id: 'recovery_expert', title: 'Recovery Expert', icon: '💚', description: 'Complete 10 recovery activities', unlocked: false, progress: 0, maxProgress: 10, category: 'mastery' },
  { id: 'consistency_hero', title: 'Consistency Hero', icon: '📈', description: 'Log data for 30 days total', unlocked: false, progress: 0, maxProgress: 30, category: 'milestone' },
  { id: 'goal_crusher', title: 'Goal Crusher', icon: '🎯', description: 'Complete 5 daily goals', unlocked: false, progress: 0, maxProgress: 5, category: 'milestone' },
  { id: 'mood_tracker', title: 'Mood Tracker', icon: '😊', description: 'Log your mood 7 times', unlocked: false, progress: 0, maxProgress: 7, category: 'mastery' },
  { id: 'supplement_pro', title: 'Supplement Pro', icon: '💊', description: 'Log supplements for 14 days', unlocked: false, progress: 0, maxProgress: 14, category: 'mastery' },
  { id: 'meal_logger', title: 'Meal Logger', icon: '🍽️', description: 'Log 30 meals total', unlocked: false, progress: 0, maxProgress: 30, category: 'milestone' },
  { id: 'legendary', title: 'Legendary Tracker', icon: '🎖️', description: 'Unlock all achievements', unlocked: false, progress: 0, maxProgress: 13, category: 'special' },
];

function loadAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Achievement[];
      return DEFAULT_ACHIEVEMENTS.map((def) => {
        const existing = parsed.find((p) => p.id === def.id);
        return existing ? { ...def, ...existing } : def;
      });
    }
  } catch {}
  return DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a }));
}

function saveAchievements(achievements: Achievement[]) {
  localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { current: 0, best: 0, lastCheckIn: null, dailyLog: [] };
  } catch { return { current: 0, best: 0, lastCheckIn: null, dailyLog: [] }; }
}

function saveStreak(streak: StreakData) {
  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

function isYesterday(dateStr: string): boolean {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateStr === d.toISOString().split('T')[0];
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>(loadAchievements);
  const [streak, setStreak] = useState<StreakData>(loadStreak);
  const [justUnlocked, setJustUnlocked] = useState<Achievement | null>(null);

  useEffect(() => {
    saveAchievements(achievements);
  }, [achievements]);

  useEffect(() => {
    saveStreak(streak);
  }, [streak]);

  const unlockAchievement = useCallback((id: string) => {
    setAchievements((prev) => {
      const existing = prev.find((a) => a.id === id);
      if (!existing || existing.unlocked) return prev;
      const updated = prev.map((a) =>
        a.id === id ? { ...a, unlocked: true, unlockedAt: new Date().toISOString(), progress: a.maxProgress } : a
      );
      const unlocked = updated.find((a) => a.id === id)!;
      setTimeout(() => setJustUnlocked(unlocked), 100);
      return updated;
    });
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    setAchievements((prev) => {
      const existing = prev.find((a) => a.id === id);
      if (!existing || existing.unlocked) return prev;
      const newProgress = Math.min(progress, existing.maxProgress);
      const shouldUnlock = newProgress >= existing.maxProgress;
      const updated = prev.map((a) =>
        a.id === id ? { ...a, progress: newProgress, unlocked: shouldUnlock, unlockedAt: shouldUnlock ? new Date().toISOString() : a.unlockedAt } : a
      );
      if (shouldUnlock) {
        const unlocked = updated.find((a) => a.id === id)!;
        setTimeout(() => setJustUnlocked(unlocked), 100);
      }
      return updated;
    });
  }, []);

  const doCheckIn = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    setStreak((prev) => {
      if (prev.dailyLog.includes(today)) return prev;
      const newLog = [...prev.dailyLog, today];
      let newCurrent = prev.current;
      if (prev.lastCheckIn && isYesterday(prev.lastCheckIn)) {
        newCurrent += 1;
      } else if (prev.lastCheckIn && isToday(prev.lastCheckIn)) {
        newCurrent = prev.current;
      } else {
        newCurrent = 1;
      }
      const newBest = Math.max(prev.best, newCurrent);
      return { current: newCurrent, best: newBest, lastCheckIn: today, dailyLog: newLog };
    });
    return today;
  }, []);

  const clearJustUnlocked = useCallback(() => setJustUnlocked(null), []);

  return {
    achievements,
    streak,
    justUnlocked,
    unlockAchievement,
    updateProgress,
    doCheckIn,
    clearJustUnlocked,
  };
}
