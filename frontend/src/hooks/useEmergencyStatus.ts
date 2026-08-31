import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';
import type { EmergencyEvent } from '../types';

export function useEmergencyStatus(eventId: string | null, pollInterval: number = 5000) {
  const [event, setEvent] = useState<EmergencyEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!eventId) return;
    try {
      const { data } = await api.get(`/emergency/sos/${eventId}`);
      setEvent(data);
      return data;
    } catch {
      return null;
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) { setEvent(null); return; }
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, pollInterval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [eventId, pollInterval, fetchStatus]);

  return { event, loading, refresh: fetchStatus };
}
