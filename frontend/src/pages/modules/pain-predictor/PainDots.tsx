interface PainDotsProps {
  level: number;
  size?: number;
}

export default function PainDots({ level, size = 12 }: PainDotsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 10 }, (_, i) => {
        const idx = i + 1;
        let color = '#22C55E';
        if (idx >= 7) color = '#EF4444';
        else if (idx >= 4) color = '#F59E0B';
        const filled = idx <= level;
        return (
          <div
            key={idx}
            className="rounded-full transition-all duration-500"
            style={{
              width: size,
              height: size,
              backgroundColor: filled ? color : 'rgba(0,0,0,0.08)',
              boxShadow: filled ? `0 0 ${size}px ${color}40` : 'none',
              transform: filled ? 'scale(1)' : 'scale(0.9)',
            }}
          />
        );
      })}
      <span className="ml-2 text-sm font-mono text-slate-500">{level}/10</span>
    </div>
  );
}
