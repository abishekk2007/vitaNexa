export function qs(val: unknown): string {
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val[0] || '';
  return '';
}

export function qn(val: unknown): number {
  const s = qs(val);
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function qb(val: unknown): boolean | undefined {
  const s = qs(val);
  if (s === 'true') return true;
  if (s === 'false') return false;
  return undefined;
}

export function pid(params: Record<string, any>, key: string): string {
  const val = params[key];
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
}
