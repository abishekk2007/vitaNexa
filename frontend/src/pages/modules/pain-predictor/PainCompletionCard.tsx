import { PainData, PainCategory } from './types';
import { getCategoryIcon, getCategoryAccent, getCategoryLabel } from './PainCategoryEngine';
import { getComfortGuidance, generalTips, healthReminder } from './PainTipsData';
import TipsCard from './TipsCard';
import PainDots from './PainDots';

interface PainCompletionCardProps {
  painData: PainData;
  category: PainCategory;
  onSave?: () => void;
  isSaved?: boolean;
  onNewAssessment?: () => void;
}

export default function PainCompletionCard({ painData, category, onSave, isSaved, onNewAssessment }: PainCompletionCardProps) {
  const guidance = getComfortGuidance(category);
  const accent = getCategoryAccent(category);
  const icon = getCategoryIcon(category);

  return (
    <div className="space-y-4 animate-fade-slide-up">
      <div
        className="rounded-2xl p-6 border text-center bg-white"
        style={{ borderColor: `${accent}30` }}
      >
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-slate-900 font-fraunces mb-1">Assessment Complete</h2>
        <p className="text-sm text-slate-500 mb-4">All 6 fields logged</p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono" style={{ backgroundColor: `${accent}20`, color: accent }}>
          {icon} {getCategoryLabel(category)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { label: 'Location', value: painData.location },
          { label: 'Started', value: painData.whenStarted },
          { label: 'Date', value: painData.date },
          { label: 'Pain Level', value: `${painData.painLevel}/10` },
          { label: 'Doctor', value: painData.doctorConsultation },
          { label: 'Medication', value: painData.medication },
          ...(painData.diagnosis ? [{ label: 'Diagnosis', value: painData.diagnosis }] : []),
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-white border border-slate-200 shadow-sm p-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
            <p className="text-sm text-slate-700">{item.value || '—'}</p>
          </div>
        ))}
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-3 md:col-span-2">
          <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Pain Level</p>
          <PainDots level={painData.painLevel} />
        </div>
      </div>

      <div
        className="rounded-2xl p-4 border text-center bg-white"
        style={{ borderColor: `${accent}30` }}
      >
        <span className="text-2xl mr-2">{icon}</span>
        <span className="text-sm text-slate-700 font-mono">{getCategoryLabel(category)}</span>
      </div>

      <TipsCard
        title={guidance.title}
        icon={guidance.icon}
        tips={guidance.tips}
        accentColor={guidance.accentColor}
      />

      <div className="rounded-2xl bg-red-50 border border-red-200 p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">🚨</span>
          <h3 className="text-sm font-semibold text-red-600 font-mono uppercase tracking-wider">Warning Signs</h3>
        </div>
        <ul className="space-y-2">
          {guidance.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-red-700/80">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 bg-red-500/50" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 p-3 rounded-xl bg-red-100/50 border border-red-300">
          <p className="text-xs text-red-700 font-medium">
            ⚕️ If you experience any of these warning signs, please consult a doctor or visit the nearest emergency room immediately.
          </p>
        </div>
      </div>

      <TipsCard
        title="General Wellness Tips"
        icon="💚"
        tips={generalTips}
        accentColor="#22C55E"
      />

      <div className="rounded-2xl bg-gradient-to-r from-sky-50 to-emerald-50 border border-slate-200 p-5 text-center">
        <p className="text-sm text-slate-600 italic mb-2">{healthReminder.message}</p>
        <p className="text-xs text-slate-400">— {healthReminder.title}</p>
      </div>

      {onSave && (
        <button
          onClick={onSave}
          className="w-full py-3 rounded-xl text-sm font-medium transition-all border"
          style={{
            backgroundColor: isSaved ? `${accent}15` : accent,
            color: isSaved ? accent : '#fff',
            borderColor: `${accent}40`,
          }}
        >
          {isSaved ? '✓ Report Saved' : 'Save Report'}
        </button>
      )}

      {onNewAssessment && (
        <button
          onClick={onNewAssessment}
          className="w-full py-3 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all shadow-sm"
        >
          Start New Assessment
        </button>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up { animation: fadeSlideUp 0.5s ease-out; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
      `}</style>
    </div>
  );
}
