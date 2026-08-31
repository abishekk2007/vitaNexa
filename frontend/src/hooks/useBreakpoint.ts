import { useState, useEffect, useMemo, useCallback } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

const breakpoints: Record<Breakpoint, number> = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1440,
  '3xl': 1600,
  '4xl': 1920,
};

export function useBreakpoint(): { width: number; height: number; breakpoint: Breakpoint; isMobile: boolean; isTablet: boolean; isDesktop: boolean; isLandscape: boolean } {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));

  useEffect(() => {
    let frameId: number;
    const handler = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => setSize({ width: window.innerWidth, height: window.innerHeight }));
    };
    window.addEventListener('resize', handler);
    return () => { window.removeEventListener('resize', handler); cancelAnimationFrame(frameId); };
  }, []);

  const breakpoint = useMemo(() => {
    const entries = Object.entries(breakpoints) as [Breakpoint, number][];
    let result: Breakpoint = 'xs';
    for (const [key, value] of entries) {
      if (size.width >= value) result = key;
    }
    return result;
  }, [size.width]);

  return useMemo(() => ({
    width: size.width,
    height: size.height,
    breakpoint,
    isMobile: size.width < 768,
    isTablet: size.width >= 768 && size.width < 1024,
    isDesktop: size.width >= 1024,
    isLandscape: size.width > size.height,
  }), [size, breakpoint]);
}

export function useResponsive<T>(values: { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T; '3xl'?: T; '4xl'?: T; default: T }): T {
  const { breakpoint } = useBreakpoint();
  return useMemo(() => {
    const keys: Breakpoint[] = ['4xl', '3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
    for (const k of keys) {
      if (breakpoint >= k && values[k] !== undefined) return values[k]!;
    }
    return values.default;
  }, [breakpoint, values]);
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

export function useResponsiveGrid(itemsPerRow: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }): string {
  const { width } = useBreakpoint();
  return useMemo(() => {
    const cols = width < 480 ? (itemsPerRow.xs || 1) : width < 768 ? (itemsPerRow.sm || 2) : width < 1024 ? (itemsPerRow.md || 3) : width < 1280 ? (itemsPerRow.lg || 4) : (itemsPerRow.xl || 4);
    return `repeat(auto-fill, minmax(${Math.floor((width - (cols + 1) * 12) / cols)}px, 1fr))`;
  }, [width, itemsPerRow]);
}

export { breakpoints };
