import { useEffect, useState } from 'react';
import api from '../../api/client';

interface HealthScores {
  nutrientDeficiencyRiskScore: number;
  foodDiversityScore: number;
  absorptionEfficiencyScore: number;
  supplementComplianceScore: number;
  consistencyScore: number;
  healthMomentumScore: number;
  wellnessTrendScore: number;
  overallHealthScore: number;
}

interface AnalyticsData {
  scores: HealthScores;
  totalMeals: number;
  totalSupplements: number;
  deficiencyForecast: { nutrient: string; risk: string; daysToDeficiency?: number }[];
  nutrientCoverage: Record<string, { percent: number; status: string }>;
}

const scoreConfig: Record<string, { label: string; color: string; icon: string }> = {
  nutrientDeficiencyRiskScore: { label: 'Nutrient Deficiency Risk', color: 'from-rose-500 to-pink-500', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  foodDiversityScore: { label: 'Food Diversity', color: 'from-emerald-500 to-green-500', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  absorptionEfficiencyScore: { label: 'Absorption Efficiency', color: 'from-sky-500 to-blue-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  supplementComplianceScore: { label: 'Supplement Compliance', color: 'from-violet-500 to-purple-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  consistencyScore: { label: 'Consistency', color: 'from-amber-500 to-orange-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  healthMomentumScore: { label: 'Health Momentum', color: 'from-teal-500 to-cyan-500', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  wellnessTrendScore: { label: 'Wellness Trend', color: 'from-indigo-500 to-blue-600', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
};

function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="90" height="90" className="transform -rotate-90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle cx="45" cy="45" r={radius} fill="none" stroke={`url(#grad-${label})`} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
        <defs>
          <linearGradient id={`grad-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color.split(' ')[0].replace('from-', '#')} />
            <stop offset="100%" stopColor={color.split(' ')[1]?.replace('to-', '#') || color.split(' ')[0].replace('from-', '#')} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: 90, height: 90 }}>
        <span className="text-xl font-bold text-slate-800">{value}</span>
      </div>
      <span className="text-[10px] text-slate-500 mt-1 text-center leading-tight max-w-[80px]">{label}</span>
    </div>
  );
}

const nutrientColorMap: Record<string, string> = {
  on_track: 'bg-emerald-500', borderline: 'bg-amber-500', likely_gap: 'bg-red-500',
};

export default function EnterpriseDashboard({ openTab }: { openTab?: (tab: string) => void }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/enterprise/analytics')
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load enterprise analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <p className="text-amber-700 text-sm">{error}</p>
        <p className="text-amber-500 text-xs mt-1">Enterprise analytics will load when backend is available.</p>
      </div>
    );
  }

  if (!data) return null;

  const { scores, totalMeals, totalSupplements, deficiencyForecast, nutrientCoverage } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-fraunces">Enterprise Health Overview</h2>
          <p className="text-xs text-slate-400">Powered by VitaNexa Analytics Engine V3</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600">{totalMeals} meals</span>
          <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600">{totalSupplements} supplements</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs text-emerald-400 font-medium">OVERALL HEALTH SCORE</span>
            <div className="text-4xl font-bold mt-1">{scores.overallHealthScore}</div>
          </div>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
            scores.overallHealthScore >= 80 ? 'bg-emerald-500' : scores.overallHealthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
          }`}>
            {scores.overallHealthScore}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Deficiency Risk', value: scores.nutrientDeficiencyRiskScore, color: scores.nutrientDeficiencyRiskScore >= 70 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Food Diversity', value: scores.foodDiversityScore, color: scores.foodDiversityScore >= 70 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Absorption Eff.', value: scores.absorptionEfficiencyScore, color: scores.absorptionEfficiencyScore >= 70 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Consistency', value: scores.consistencyScore, color: scores.consistencyScore >= 70 ? 'text-emerald-400' : 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3">
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(scoreConfig).map(([key, config]) => {
          const val = scores[key as keyof HealthScores] || 0;
          return (
            <div key={key} className="relative bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shrink-0`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <div className={`text-lg font-bold ${
                  val >= 80 ? 'text-emerald-600' : val >= 60 ? 'text-amber-600' : 'text-red-600'
                }`}>{val}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{config.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Nutrient Coverage</h3>
          <div className="space-y-2">
            {Object.entries(nutrientCoverage).slice(0, 10).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-24 capitalize">{key.replace(/_/g, ' ')}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                  <div className={`h-2.5 rounded-full ${nutrientColorMap[val.status] || 'bg-slate-400'}`}
                    style={{ width: `${Math.min(val.percent, 100)}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right">{val.percent}%</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  val.status === 'on_track' ? 'bg-emerald-100 text-emerald-600' :
                  val.status === 'borderline' ? 'bg-amber-100 text-amber-600' :
                  'bg-red-100 text-red-600'
                }`}>{val.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
          <button onClick={() => openTab?.('dashboard')} className="mt-3 text-xs text-sky-500 hover:text-sky-600 font-medium">View full Nutrient Dashboard →</button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Deficiency Forecast</h3>
          {deficiencyForecast.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No deficiencies predicted. Good coverage!</p>
          ) : (
            <div className="space-y-2">
              {deficiencyForecast.slice(0, 8).map((d, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      d.risk === 'critical' ? 'bg-red-500' : d.risk === 'high' ? 'bg-amber-500' : d.risk === 'moderate' ? 'bg-yellow-500' : 'bg-emerald-500'
                    }`} />
                    <span className="text-sm text-slate-700 capitalize">{d.nutrient.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      d.risk === 'critical' ? 'bg-red-100 text-red-600' : d.risk === 'high' ? 'bg-amber-100 text-amber-600' : d.risk === 'moderate' ? 'bg-yellow-100 text-yellow-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>{d.risk}</span>
                    {d.daysToDeficiency && (
                      <span className="text-xs text-slate-400">{d.daysToDeficiency}d</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-slate-400 mt-3">AI-predicted deficiency risk based on logged meals</p>
        </div>
      </div>
    </div>
  );
}
