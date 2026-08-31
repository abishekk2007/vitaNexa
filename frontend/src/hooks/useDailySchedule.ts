import { useState, useCallback, useEffect } from 'react';

export interface ScheduleBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  category: 'morning' | 'afternoon' | 'evening' | 'recovery' | 'custom';
  color: string;
  completed: boolean;
}

const STORAGE_KEY = 'vitanexa_schedule';

function loadBlocks(): ScheduleBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBlocks(blocks: ScheduleBlock[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 8);
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function useDailySchedule() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(loadBlocks);

  useEffect(() => { saveBlocks(blocks); }, [blocks]);

  const addBlock = useCallback((block: Omit<ScheduleBlock, 'id'>) => {
    const newBlock: ScheduleBlock = { ...block, id: generateId() };
    setBlocks((prev) => [...prev, newBlock].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return parseTime(a.startTime) - parseTime(b.startTime);
    }));
    return newBlock;
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<ScheduleBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b)));
  }, []);

  const getBlocksForDate = useCallback((date: string) => {
    return blocks.filter((b) => b.date === date).sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
  }, [blocks]);

  const getTodayBlocks = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return getBlocksForDate(today);
  }, [getBlocksForDate]);

  const CATEGORIES = [
    { value: 'morning', label: 'Morning', color: 'from-sky-400 to-blue-500' },
    { value: 'afternoon', label: 'Afternoon', color: 'from-amber-400 to-yellow-500' },
    { value: 'evening', label: 'Evening', color: 'from-indigo-400 to-purple-500' },
    { value: 'recovery', label: 'Recovery', color: 'from-emerald-400 to-green-500' },
    { value: 'custom', label: 'Custom', color: 'from-slate-400 to-gray-500' },
  ] as const;

  return {
    blocks, addBlock, updateBlock, deleteBlock, toggleComplete,
    getBlocksForDate, getTodayBlocks, CATEGORIES,
  };
}
