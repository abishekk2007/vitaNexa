import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'report' | 'achievement' | 'warning' | 'success' | 'info';
  read: boolean;
  link?: string;
  createdAt: string;
}

const LOCAL_STORAGE_KEY = 'vitanexa_notifications';

const LOCAL_TYPES = ['achievement', 'reminder'];

function loadLocal(): AppNotification[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocal(notifications: AppNotification[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notifications));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(loadLocal);
  const [loading, setLoading] = useState(false);

  const fetchServerNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      if (Array.isArray(data)) {
        const serverNots = data.map((n: any): AppNotification => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type || 'info',
          read: n.read || false,
          link: n.link,
          createdAt: n.createdAt,
        }));
        setNotifications((prev) => {
          const localOnly = prev.filter((n) => LOCAL_TYPES.includes(n.type));
          const merged = [...serverNots, ...localOnly];
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return merged;
        });
      }
    } catch {
      // Server notifications unavailable, keep local
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServerNotifications();
    const interval = setInterval(fetchServerNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchServerNotifications]);

  useEffect(() => {
    saveLocal(notifications);
  }, [notifications]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: 'local_' + Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    return newNotif;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (!id.startsWith('local_')) {
      api.put(`/notifications/${id}/read`).catch(() => {});
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.put('/notifications/read-all').catch(() => {});
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (!id.startsWith('local_')) {
      api.delete(`/notifications/${id}`).catch(() => {});
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchServerNotifications,
  };
}
