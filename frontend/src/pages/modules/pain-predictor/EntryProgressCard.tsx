import { PainData, QuestionStep } from './types';

interface EntryProgressCardProps {
  painData: PainData;
  currentStep: QuestionStep;
}

const fields: { key: keyof PainData; label: string }[] = [
  { key: 'location', label: 'Location' },
  { key: 'whenStarted', label: 'When' },
  { key: 'date', label: 'Date' },
  { key: 'painLevel', label: 'Pain Level' },
  { key: 'doctorConsultation', label: 'Doctor' },
  { key: 'medication', label: 'Medication' },
];

export default function EntryProgressCard({ painData, currentStep }: EntryProgressCardProps) {
  const completedCount = fields.filter((f) => {
    const val = painData[f.key];
    return val !== '' && val !== 0 && val !== undefined && val !== null;
  }).length;
  const progress = Math.round((completedCount / fields.length) * 100);
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 animate-fade-slide-up">
      <h3 className="text-sm font-semibold text-slate-800 mb-3 font-mono uppercase tracking-wider">Entry Progress</h3>
      <div className="space-y-2 mb-4">
        {fields.map((f) => {
          const val = painData[f.key];
          const filled = val !== '' && val !== 0 && val !== undefined && val !== null;
          return (
            <div key={f.key} className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">{f.label}</span>
              <span className={`flex items-center gap-1.5 ${filled ? 'text-emerald-600' : 'text-slate-400'}`}>
                {filled ? '✓' : '○'}
                <span className="truncate max-w-[120px]">
                  {filled ? String(val).substring(0, 20) : 'Pending'}
                </span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-right text-xs text-slate-400 mt-1 font-mono">{progress}% Logged</p>
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
