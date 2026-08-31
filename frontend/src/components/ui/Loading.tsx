interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function Loading({ size = 'md', text }: LoadingProps) {
  const sizeClasses = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-label="Loading">
      <div className={`${sizeClasses[size]} border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin`} />
      {text && <p className="text-slate-500 text-sm">{text}</p>}
    </div>
  );
}
