import { useLiveClockFormat } from '../../hooks/useLiveClock';

interface LiveClockProps {
  variant?: 'full' | 'time' | 'date' | 'greeting';
  hour12?: boolean;
  className?: string;
}

export default function LiveClock({ variant = 'full', hour12 = true, className = '' }: LiveClockProps) {
  const clock = useLiveClockFormat(hour12);

  if (variant === 'time') {
    return <span className={`tabular-nums ${className}`}>{clock.displayTime}</span>;
  }
  if (variant === 'date') {
    return <span className={className}>{clock.dateStr}</span>;
  }
  if (variant === 'greeting') {
    return <span className={className}>{clock.greeting}</span>;
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-2xl font-bold tabular-nums">{clock.displayTime}</span>
      <span className="text-sm opacity-80">{clock.dateStr}</span>
      <span className="text-xs opacity-60">{clock.timezone}</span>
    </div>
  );
}

export function ClockBadge({ className = '' }: { className?: string }) {
  const clock = useLiveClockFormat(true);
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-sm shadow-sm ${className}`}>
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="tabular-nums font-medium text-slate-700">{clock.displayTime}</span>
      <span className="text-slate-400">|</span>
      <span className="text-slate-500 text-xs">{clock.dateStr}</span>
    </div>
  );
}
