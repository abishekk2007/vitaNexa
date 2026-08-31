import { useState, useEffect, useCallback, useRef } from 'react';

export interface GpsPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export function useEmergencyLocation() {
  const [position, setPosition] = useState<GpsPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [accuracyMet, setAccuracyMet] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setError(null);
    setWatching(true);
    setAccuracyMet(false);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setPosition({ latitude, longitude, accuracy, timestamp: pos.timestamp });
        if (accuracy <= 50) {
          setAccuracyMet(true);
        }
      },
      (err) => {
        const msg = err.code === 1 ? 'Location permission denied. Please enable GPS.'
          : err.code === 2 ? 'GPS signal unavailable. Try moving to an open area.'
          : 'GPS request timed out. Please try again.';
        setError(msg);
        setWatching(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );

    timeoutRef.current = setTimeout(() => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setWatching(false);
        if (!position) {
          setError('GPS timed out. Please ensure location is enabled.');
        }
      }
    }, 30000);
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setWatching(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const requestSingle = useCallback(async (): Promise<GpsPosition | null> => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return null;
    }
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
      );
      const result: GpsPosition = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy, timestamp: pos.timestamp };
      setPosition(result);
      setAccuracyMet(result.accuracy <= 50);
      return result;
    } catch (err: any) {
      const msg = err.code === 1 ? 'Location permission denied'
        : err.code === 2 ? 'Location unavailable'
        : 'Location timeout';
      setError(msg);
      return null;
    }
  }, []);

  return { position, error, watching, accuracyMet, startWatching, stopWatching, requestSingle };
}
