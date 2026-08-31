import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonStats } from '../../components/ui/Skeleton';

interface NutrientAnalytics {
  totalSupplements: number;
  totalMeals: number;
  totalScans: number;
  totalInteractions: number;
  usersWithSupplements: number;
  topSupplements: { name: string; users: number }[];
  commonNutrients: { nutrient: string; count: number }[];
  interactionBySeverity: { severity: string; count: number }[];
  interactionByEffect: { effect: string; count: number }[];
}

export default function AdminNutrientAnalytics() {
  const { addToast } = useToast();
  const [data, setData] = useState<NutrientAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await api.get('/admin/nutrient-analytics');
        setData(res);
      } catch {
        addToast('Failed to load nutrient analytics', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <SkeletonStats />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-fraunces">Nutrient Analytics</h1>
        <p className="text-slate-500 mt-1">Read-only analytics on supplement usage, meal logging, and interaction data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <div className="text-slate-500 text-xs">Supplements</div>
          <div className="text-2xl font-bold text-slate-900">{data?.totalSupplements ?? 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <div className="text-slate-500 text-xs">Meals Logged</div>
          <div className="text-2xl font-bold text-slate-900">{data?.totalMeals ?? 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <div className="text-slate-500 text-xs">Barcode Scans</div>
          <div className="text-2xl font-bold text-slate-900">{data?.totalScans ?? 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <div className="text-slate-500 text-xs">Interactions</div>
          <div className="text-2xl font-bold text-slate-900">{data?.totalInteractions ?? 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <div className="text-slate-500 text-xs">Users w/ Supplements</div>
          <div className="text-2xl font-bold text-slate-900">{data?.usersWithSupplements ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Supplements by Users</h2>
          <div className="space-y-2">
            {data?.topSupplements?.slice(0, 10).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-6">{i + 1}.</span>
                <span className="text-sm text-slate-700 flex-1 capitalize">{s.name}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="bg-sky-400 h-2 rounded-full" style={{ width: `${Math.min((s.users / Math.max(...(data?.topSupplements?.map(x => x.users) || [1]))) * 100, 100)}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{s.users}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Common Nutrients Logged</h2>
          <div className="space-y-2">
            {data?.commonNutrients?.slice(0, 10).map((n, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-slate-700 flex-1 capitalize">{n.nutrient.replace(/_/g, ' ')}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${Math.min((n.count / Math.max(...(data?.commonNutrients?.map(x => x.count) || [1]))) * 100, 100)}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{n.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Interactions by Severity</h2>
          <div className="flex gap-4 justify-center py-4">
            {data?.interactionBySeverity?.map((s) => (
              <div key={s.severity} className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto ${s.severity === 'HIGH' ? 'bg-red-500' : s.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`}>{s.count}</div>
                <div className="text-xs text-slate-500 mt-1">{s.severity}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Interaction Effects</h2>
          <div className="flex gap-4 justify-center py-4">
            {data?.interactionByEffect?.map((e) => (
              <div key={e.effect} className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto ${e.effect === 'IMPROVES_ABSORPTION' ? 'bg-emerald-500' : 'bg-red-500'}`}>{e.count}</div>
                <div className="text-xs text-slate-500 mt-1">{e.effect === 'IMPROVES_ABSORPTION' ? 'Improves' : 'Reduces'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm">
        <p className="text-amber-600 text-xs">Aggregate analytics only. No personal health data is exposed.</p>
      </div>
    </div>
  );
}
