import { useState, useCallback, useEffect } from 'react';

export interface MoodEntry {
  id: string;
  date: string;
  time: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  energy: 1 | 2 | 3 | 4 | 5;
  reflection: string;
  gratitude: string;
  tags: string[];
}

const MOODS = ['great', 'good', 'okay', 'bad', 'terrible'] as const;
const MOOD_EMOJIS: Record<string, string> = {
  great: '😄', good: '🙂', okay: '😐', bad: '😔', terrible: '😢',
};
const MOOD_COLORS: Record<string, string> = {
  great: 'from-emerald-400 to-green-500', good: 'from-sky-400 to-blue-500',
  okay: 'from-amber-400 to-yellow-500', bad: 'from-orange-400 to-red-500', terrible: 'from-red-500 to-rose-600',
};
const ENERGY_LABELS: Record<number, string> = { 1: 'Very Low', 2: 'Low', 3: 'Medium', 4: 'High', 5: 'Very High' };

const STORAGE_KEY = 'vitanexa_mood_journal';

function loadEntries(): MoodEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEntries(entries: MoodEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useMoodJournal() {
  const [entries, setEntries] = useState<MoodEntry[]>(loadEntries);

  useEffect(() => { saveEntries(entries); }, [entries]);

  const addEntry = useCallback((entry: Omit<MoodEntry, 'id' | 'date' | 'time'>) => {
    const now = new Date();
    const newEntry: MoodEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getRecent = useCallback((days: number = 7) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return entries.filter((e) => new Date(e.date) >= cutoff);
  }, [entries]);

  return { entries, addEntry, deleteEntry, getRecent, MOODS, MOOD_EMOJIS, MOOD_COLORS, ENERGY_LABELS };
}
