import { useState, useEffect, useCallback } from 'react';

export interface Reminder {
  id: string;
  type: 'supplement' | 'meal';
  title: string;
  time: string;
  days: string[];
  enabled: boolean;
}

const STORAGE_KEY = 'vitanexa_reminders';

function loadReminders(): Reminder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveReminders(reminders: Reminder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const p = await Notification.requestPermission();
      setPermission(p);
      return p;
    }
    return 'denied' as NotificationPermission;
  }, []);

  const addReminder = useCallback((reminder: Omit<Reminder, 'id'>) => {
    const newReminder: Reminder = { ...reminder, id: Date.now().toString() + Math.random().toString(36).slice(2) };
    setReminders((prev) => {
      const next = [...prev, newReminder];
      saveReminders(next);
      return next;
    });
    return newReminder;
  }, []);

  const updateReminder = useCallback((id: string, updates: Partial<Reminder>) => {
    setReminders((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...updates } : r));
      saveReminders(next);
      return next;
    });
  }, []);

  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => {
      const next = prev.filter((r) => r.id !== id);
      saveReminders(next);
      return next;
    });
  }, []);

  const toggleReminder = useCallback((id: string) => {
    setReminders((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
      saveReminders(next);
      return next;
    });
  }, []);

  const checkAndNotify = useCallback(() => {
    if (permission !== 'granted') return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dayStr = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];

    for (const r of reminders) {
      if (!r.enabled) continue;
      if (!r.days.includes(dayStr)) continue;
      if (r.time !== timeStr) continue;

      const notifKey = `notified_${r.id}_${now.toDateString()}`;
      if (localStorage.getItem(notifKey)) continue;

      const notif = new Notification(r.type === 'supplement' ? 'Supplement Reminder' : 'Meal Reminder', {
        body: r.title,
        icon: '/vite.svg',
      });
      setTimeout(() => notif.close(), 5000);
      localStorage.setItem(notifKey, 'true');
    }
  }, [reminders, permission]);

  useEffect(() => {
    const interval = setInterval(checkAndNotify, 30000);
    checkAndNotify();
    return () => clearInterval(interval);
  }, [checkAndNotify]);

  return { reminders, permission, requestPermission, addReminder, updateReminder, deleteReminder, toggleReminder };
}
