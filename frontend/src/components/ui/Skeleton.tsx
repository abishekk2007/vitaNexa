export function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-shimmer shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-slate-100" />
      <div className="space-y-2">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-full" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-xl animate-shimmer" />
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-shimmer shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-100 rounded w-16" />
              <div className="h-3 bg-slate-100 rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonModule() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <div className="h-8 bg-slate-100 rounded w-64 animate-shimmer" />
        <div className="h-4 bg-slate-100 rounded w-96 animate-shimmer" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-shimmer" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-xl animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
