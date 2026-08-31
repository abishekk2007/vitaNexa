import { useMemo } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';

interface Props {
  children: React.ReactNode;
  cols?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: string;
  className?: string;
  minWidth?: string;
}

export default function ResponsiveGrid({ children, cols = { xs: 1, sm: 2, md: 3, lg: 4 }, gap = '1rem', className = '', minWidth }: Props) {
  const { width } = useBreakpoint();

  const gridTemplateColumns = useMemo(() => {
    const numCols = width < 480 ? (cols.xs ?? 1) : width < 768 ? (cols.sm ?? 2) : width < 1024 ? (cols.md ?? 3) : width < 1280 ? (cols.lg ?? 4) : (cols.xl ?? 4);
    if (minWidth) return `repeat(auto-fill, minmax(min(100%, ${minWidth}), 1fr))`;
    return `repeat(${numCols}, 1fr)`;
  }, [width, cols, minWidth]);

  return (
    <div className={className} style={{ display: 'grid', gridTemplateColumns, gap }}>
      {children}
    </div>
  );
}

export function ResponsiveStack({ children, gap = '0.75rem', className = '' }: { children: React.ReactNode; gap?: string; className?: string }) {
  return <div className={`flex flex-col ${className}`} style={{ gap }}>{children}</div>;
}

export function ResponsiveFlex({ children, gap = '0.75rem', wrap = true, align = 'center', className = '' }: { children: React.ReactNode; gap?: string; wrap?: boolean; align?: string; className?: string }) {
  return <div className={className} style={{ display: 'flex', flexWrap: wrap ? 'wrap' : 'nowrap', alignItems: align, gap }}>{children}</div>;
}
