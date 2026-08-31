import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonModule } from '../../components/ui/Skeleton';
import api from '../../api/client';
import type { BacteriaResult } from '../../types';

const LEVELS = ['LOW', 'NORMAL', 'HIGH'] as const;

interface DietPlan {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snacks: string[];
}

interface Recommendation {
  name: string;
  reason: string;
  evidenceGrade?: string;
  confidenceScore?: number;
}

interface Recommendations {
  foodsToEat: Recommendation[];
  foodsToAvoid: Recommendation[];
  probiotics: Recommendation[];
  prebiotics: Recommendation[];
}

function HealthScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const from = 0;
    const to = score;

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const strokeColor =
    score <= 33 ? '#ef4444' : score <= 66 ? '#f59e0b' : '#10b981';
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" className="drop-shadow-lg">
        <circle cx="80" cy="80" r="54" fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx="80" cy="80" r="54"
          fill="none" stroke={strokeColor} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 80 80)"
          className="transition-all duration-300"
          style={{ filter: `drop-shadow(0 0 8px ${strokeColor}66)` }}
        />
        <text x="80" y="76" textAnchor="middle" fill="#1e293b" fontSize="36" fontWeight="bold" fontFamily="Fraunces, serif">
          {animatedScore}
        </text>
        <text x="80" y="96" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="Inter, sans-serif">
          / 100
        </text>
      </svg>
      <span className="text-xs text-slate-400 mt-2">Based on your bacteria levels</span>
    </div>
  );
}

const mealIcons: Record<string, string> = {
  breakfast: '\uD83C\uDF05',
  lunch: '\u2600\uFE0F',
  dinner: '\uD83C\uDF06',
  snacks: '\uD83C\uDF19',
};

const mealLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

const mealColors: Record<string, string> = {
  breakfast: 'from-amber-500/20 to-orange-500/10',
  lunch: 'from-yellow-500/20 to-amber-500/10',
  dinner: 'from-indigo-500/20 to-purple-500/10',
  snacks: 'from-sky-500/20 to-blue-500/10',
};

export default function Microbiome() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [healthSubscores, setHealthSubscores] = useState<any>(null);
  const [results, setResults] = useState<BacteriaResult[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [bacteriaName, setBacteriaName] = useState('');
  const [bacteriaLevel, setBacteriaLevel] = useState<'LOW' | 'NORMAL' | 'HIGH'>('NORMAL');
  const [adding, setAdding] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const loadHealthScore = async () => {
    try {
      const { data } = await api.get('/microbiome/health-score');
      setHealthScore(data?.overallScore ?? data?.score ?? 0);
      if (data?.subscores) setHealthSubscores(data.subscores);
    } catch {
      // score stays unchanged on error
    }
  };

  const load = async () => {
    try {
      const [bacteriaRes, recsRes, dietRes] = await Promise.all([
        api.get('/bacteria'),
        api.get('/microbiome/recommendations').catch(() => ({ data: null })),
        api.get('/microbiome/diet-plan').catch(() => ({ data: null })),
      ]);
      const bacteriaData = bacteriaRes?.data?.data ?? bacteriaRes?.data ?? [];
      setResults(Array.isArray(bacteriaData) ? bacteriaData : []);
      if (recsRes?.data) {
        const d = recsRes.data;
        setRecommendations({
          foodsToEat: (d.TO_EAT || []).map((r: any) => ({ name: r?.foodName ?? '', reason: r?.reason ?? '', evidenceGrade: r?.evidenceGrade, confidenceScore: r?.confidenceScore })),
          foodsToAvoid: (d.TO_AVOID || []).map((r: any) => ({ name: r?.foodName ?? '', reason: r?.reason ?? '', evidenceGrade: r?.evidenceGrade, confidenceScore: r?.confidenceScore })),
          probiotics: (d.PROBIOTIC || []).map((r: any) => ({ name: r?.foodName ?? '', reason: r?.reason ?? '', evidenceGrade: r?.evidenceGrade, confidenceScore: r?.confidenceScore })),
          prebiotics: (d.PREBIOTIC || []).map((r: any) => ({ name: r?.foodName ?? '', reason: r?.reason ?? '', evidenceGrade: r?.evidenceGrade, confidenceScore: r?.confidenceScore })),
        });
      }
      if (dietRes?.data) {
        const d = dietRes.data;
        setDietPlan({
          breakfast: Array.isArray(d?.breakfast) ? d.breakfast.map((f: any) => f?.name ?? f ?? '') : [],
          lunch: Array.isArray(d?.lunch) ? d.lunch.map((f: any) => f?.name ?? f ?? '') : [],
          dinner: Array.isArray(d?.dinner) ? d.dinner.map((f: any) => f?.name ?? f ?? '') : [],
          snacks: Array.isArray(d?.snacks) ? d.snacks.map((f: any) => f?.name ?? f ?? '') : [],
        });
      }
    } catch (err) {
      console.error('Microbiome: load failed', err);
      addToast('Failed to load microbiome data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); loadHealthScore(); }, []);

  const addResult = async () => {
    if (!bacteriaName.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post('/bacteria', { bacteriaName, level: bacteriaLevel });
      if (data) setResults([data, ...results]);
      setBacteriaName('');
      addToast('Bacteria result logged', 'success');
      loadHealthScore();
    } catch (e: any) {
      addToast(e.response?.data?.error || 'Failed to log result', 'error');
    } finally {
      setAdding(false);
    }
  };

  const deleteResult = async (id: string) => {
    try {
      await api.delete(`/bacteria/${id}`);
      setResults(results.filter((r) => r.id !== id));
      addToast('Result deleted', 'success');
      loadHealthScore();
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  const levelBadgeClass = (level: string) => {
    if (level === 'HIGH') return 'badge-error';
    if (level === 'LOW') return 'badge-warning';
    return 'badge-success';
  };

  const levelCardBorder = (level: string) => {
    if (level === 'HIGH') return 'border-l-red-500/50';
    if (level === 'LOW') return 'border-l-amber-500/50';
    return 'border-l-emerald-500/50';
  };

  if (loading) return <SkeletonModule />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-fraunces">Microbiome Wellness</h1>
        <p className="text-slate-500 mt-1">Track gut bacteria levels and get personalised dietary guidance</p>
      </div>

      {/* Health Score */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:border-sky-200 stagger-1 animate-slide-up">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {healthScore !== null && <HealthScoreGauge score={healthScore} />}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-semibold text-slate-900 font-fraunces">Gut Health Score</h2>
            <p className="text-sm text-slate-500 mt-1">
              {healthScore !== null && healthScore <= 33
                ? 'Your gut health needs attention. Consider dietary adjustments.'
                : healthScore !== null && healthScore <= 66
                  ? 'Your gut health is moderate. Keep up with balanced nutrition.'
                  : 'Your gut health looks great! Maintain your current habits.'}
            </p>
            {healthSubscores && (
              <div className="grid grid-cols-2 gap-2 mt-3 max-w-xs mx-auto md:mx-0">
                <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-sm">
                  <div className="text-xs text-emerald-600 font-bold">{healthSubscores.beneficialSpeciesScore ?? '—'}</div>
                  <div className="text-[10px] text-slate-400">Beneficial</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-sm">
                  <div className="text-xs text-blue-600 font-bold">{healthSubscores.gutDiversityScore ?? '—'}</div>
                  <div className="text-[10px] text-slate-400">Diversity</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-sm">
                  <div className="text-xs text-purple-600 font-bold">{healthSubscores.gutBarrierScore ?? '—'}</div>
                  <div className="text-[10px] text-slate-400">Barrier</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-2 text-center shadow-sm">
                  <div className="text-xs text-amber-600 font-bold">{healthSubscores.inflammatoryRiskScore ?? '—'}</div>
                  <div className="text-[10px] text-slate-400">Inflammatory</div>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-3 justify-center md:justify-start">
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-red-500" /> Low (0–33)</span>
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-amber-500" /> Moderate (34–66)</span>
              <span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Good (67–100)</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-3 italic">For educational and wellness guidance only. Not medical advice.</p>
          </div>
        </div>
      </div>

      {/* Add Bacteria Result */}
      <div ref={formRef} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:border-sky-200 stagger-2 animate-slide-up">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Log Bacteria Result</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            value={bacteriaName}
            onChange={(e) => setBacteriaName(e.target.value)}
            placeholder="Bacteria name (e.g., Lactobacillus)"
            className="input-field flex-1 min-w-[200px]"
            onKeyDown={(e) => { if (e.key === 'Enter') addResult(); }}
          />
          <select
            value={bacteriaLevel}
            onChange={(e) => setBacteriaLevel(e.target.value as any)}
            className="input-field w-40"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <button onClick={addResult} disabled={adding || !bacteriaName.trim()} className="btn-primary disabled:opacity-50">
            {adding ? 'Adding...' : 'Add Result'}
          </button>
        </div>
      </div>

      {/* Bacteria Results */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:border-sky-200 stagger-3 animate-slide-up">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Your Bacteria Results</h2>
        {results.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No bacteria results logged yet. Add one above to get started.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {results.map((r, i) => (
              <div
                key={r.id}
                className={`bg-white border border-slate-100 rounded-xl p-4 shadow-sm border-l-4 ${levelCardBorder(r.level)} animate-slide-up`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-800 font-medium text-sm">{r.bacteriaName}</span>
                  <span className={levelBadgeClass(r.level)}>{r.level}</span>
                </div>
                <p className="text-xs text-slate-400">{new Date(r.recordedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                <button onClick={() => deleteResult(r.id)} className="text-xs text-red-600 hover:text-red-700 mt-2 transition-colors">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recommendations && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 font-fraunces stagger-4 animate-slide-up">Personalised Recommendations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Foods To Eat */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-sky-200 stagger-4 animate-slide-up border-t-2 border-t-emerald-500/40">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">\u2714</span>
                <h3 className="text-slate-800 font-semibold">Foods To Eat</h3>
              </div>
              {recommendations.foodsToEat.length === 0 ? (
                <p className="text-xs text-slate-400">No recommendations yet.</p>
              ) : (
                <div className="space-y-3">
                  {recommendations.foodsToEat.map((item, i) => (
                    <div key={i} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <p className="text-sm text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                      {item.evidenceGrade && <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${item.evidenceGrade === 'A' ? 'bg-emerald-100 text-emerald-700' : item.evidenceGrade === 'B' ? 'bg-blue-100 text-blue-700' : item.evidenceGrade === 'C' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>Grade {item.evidenceGrade}</span>}
                      {item.confidenceScore != null && <span className="ml-1 text-[10px] text-slate-400">{item.confidenceScore}% confidence</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Foods To Avoid */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-sky-200 stagger-5 animate-slide-up border-t-2 border-t-red-500/40">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-sm">\u2718</span>
                <h3 className="text-slate-800 font-semibold">Foods To Avoid</h3>
              </div>
              {recommendations.foodsToAvoid.length === 0 ? (
                <p className="text-xs text-slate-400">No recommendations yet.</p>
              ) : (
                <div className="space-y-3">
                  {recommendations.foodsToAvoid.map((item, i) => (
                    <div key={i} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <p className="text-sm text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                      {item.evidenceGrade && <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${item.evidenceGrade === 'A' ? 'bg-emerald-100 text-emerald-700' : item.evidenceGrade === 'B' ? 'bg-blue-100 text-blue-700' : item.evidenceGrade === 'C' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>Grade {item.evidenceGrade}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Probiotic */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-sky-200 stagger-5 animate-slide-up border-t-2 border-t-purple-500/40">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-sm">\u2665</span>
                <h3 className="text-slate-800 font-semibold">Probiotic</h3>
              </div>
              {recommendations.probiotics.length === 0 ? (
                <p className="text-xs text-slate-400">No recommendations yet.</p>
              ) : (
                <div className="space-y-3">
                  {recommendations.probiotics.map((item, i) => (
                    <div key={i} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <p className="text-sm text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prebiotic */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-sky-200 stagger-6 animate-slide-up border-t-2 border-t-blue-500/40">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-sm">\u26A1</span>
                <h3 className="text-slate-800 font-semibold">Prebiotic</h3>
              </div>
              {recommendations.prebiotics.length === 0 ? (
                <p className="text-xs text-slate-400">No recommendations yet.</p>
              ) : (
                <div className="space-y-3">
                  {recommendations.prebiotics.map((item, i) => (
                    <div key={i} className="border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <p className="text-sm text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 italic text-center stagger-6 animate-slide-up">For educational and wellness guidance only. Not medical advice. Evidence grades shown where available.</p>

      {/* Daily Diet Plan */}
      {dietPlan && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900 font-fraunces stagger-4 animate-slide-up">Daily Diet Plan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(mealLabels) as Array<keyof DietPlan>).map((meal, i) => {
              const items = dietPlan[meal] ?? [];
              return (
                <div
                  key={meal}
                  className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm stagger-${i + 4} animate-slide-up bg-gradient-to-br ${mealColors[meal]}`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{mealIcons[meal]}</span>
                    <h3 className="text-slate-800 font-semibold">{mealLabels[meal]}</h3>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-slate-400">No items planned.</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
