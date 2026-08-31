import { useState, useCallback } from 'react';
import api from '../api/client';
import type { EmergencyEvent } from '../types';

export function useSOS() {
  const [activeEvent, setActiveEvent] = useState<EmergencyEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);

  const checkActiveEvent = useCallback(async () => {
    try {
      const { data } = await api.get('/emergency/sos/active');
      setActiveEvent(data || null);
      return data || null;
    } catch {
      setActiveEvent(null);
      return null;
    }
  }, []);

  const triggerSos = async (payload?: {
    description?: string; symptoms?: string; medicalSnapshot?: string;
    latitude?: number; longitude?: number; locationName?: string;
  }) => {
    setActivating(true);
    try {
      const { data } = await api.post('/emergency/sos', payload || {});
      setActiveEvent(data.event);
      return data;
    } finally {
      setActivating(false);
    }
  };

  const cancelSos = async (eventId: string) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/emergency/sos/${eventId}/cancel`);
      setActiveEvent(null);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const resolveSos = async (eventId: string) => {
    setLoading(true);
    try {
      const { data } = await api.post(`/emergency/sos/${eventId}/resolve`);
      setActiveEvent(null);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = async (eventId: string) => {
    const { data } = await api.get(`/emergency/sos/${eventId}`);
    return data as EmergencyEvent;
  };

  return { activeEvent, loading, activating, checkActiveEvent, triggerSos, cancelSos, resolveSos, getEventStatus };
}
