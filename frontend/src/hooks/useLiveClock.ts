import { useState, useEffect } from 'react';

export interface ClockState {
  date: Date;
  timeStr: string;
  dateStr: string;
  dayName: string;
  hour12: number;
  hour24: number;
  minute: number;
  second: number;
  ampm: string;
  timezone: string;
  greeting: string;
}

function getGreeting(h: number): string {
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  if (h < 21) return 'Good Evening';
  return 'Good Night';
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function computeState(date: Date): ClockState {
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  const h12 = h % 12 || 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return {
    date,
    timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
    dateStr: `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
    dayName: DAYS[date.getDay()],
    hour12: h12,
    hour24: h,
    minute: m,
    second: s,
    ampm,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    greeting: getGreeting(h),
  };
}

export function useLiveClock() {
  const [clock, setClock] = useState<ClockState>(() => computeState(new Date()));

  useEffect(() => {
    const id = setInterval(() => setClock(computeState(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return clock;
}

export function useLiveClockFormat(hour12: boolean = true) {
  const clock = useLiveClock();
  return {
    ...clock,
    displayTime: hour12
      ? `${clock.hour12}:${String(clock.minute).padStart(2, '0')}:${String(clock.second).padStart(2, '0')} ${clock.ampm}`
      : clock.timeStr,
  };
}
