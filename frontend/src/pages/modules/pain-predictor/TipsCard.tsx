interface TipsCardProps {
  title: string;
  icon: string;
  tips: string[];
  accentColor: string;
}

export default function TipsCard({ title, icon, tips, accentColor }: TipsCardProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 animate-fade-slide-up">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-800 font-mono uppercase tracking-wider">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up { animation: fadeSlideUp 0.4s ease-out; }
      `}</style>
    </div>
  );
}
