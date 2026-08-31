import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonModule } from '../../components/ui/Skeleton';
import api from '../../api/client';
import type { SpoonBudget } from '../../types';

export default function EnergyLedger() {
  const { addToast } = useToast();
  const [budget, setBudget] = useState<SpoonBudget | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustom, setShowCustom] = useState(false);
  const [customSpoons, setCustomSpoons] = useState(10);
  const [activityName, setActivityName] = useState('');
  const [activityCost, setActivityCost] = useState(1);

  const load = async () => {
    try {
      const [b, a] = await Promise.all([
        api.get('/spoons/budget'),
        api.get('/spoons/activities'),
      ]);
      setBudget(b.data ?? null);
      setActivities(a.data?.data ?? a.data ?? []);
    } catch {
      addToast('Failed to load energy data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const setBudgetSpoons = async (amount: number) => {
    try {
      const { data } = await api.post('/spoons/budget', { totalSpoons: amount, date: new Date().toISOString() });
      setBudget(data);
      addToast(`Budget set to ${amount} spoons`, 'success');
      setShowCustom(false);
    } catch (e: any) {
      addToast(e.response?.data?.error || 'Failed to set budget', 'error');
    }
  };

  const logActivity = async () => {
    if (!activityName.trim()) return;
    try {
      const { data } = await api.post('/spoons/activities', { name: activityName, spoonCost: activityCost });
      setActivities([data, ...activities]);
      setActivityName('');
      setActivityCost(1);
      addToast(`Logged: ${activityName} (-${activityCost} spoons)`, 'success');
    } catch (e: any) {
      addToast(e.response?.data?.error || 'Failed to log activity', 'error');
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      await api.delete(`/spoons/activities/${id}`);
      setActivities(activities.filter((a) => a.id !== id));
      addToast('Activity deleted', 'success');
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  const remaining = budget ? Number(budget.remainingSpoons) : 0;
  const total = budget ? Number(budget.totalSpoons) : 0;
  const percent = total > 0 ? Math.round((remaining / total) * 100) : 0;

  if (loading) return <SkeletonModule />;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-fluid-2xl sm:text-3xl font-bold text-slate-900 font-fraunces">Energy Ledger</h1>
        <p className="text-fluid-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Spoon theory budgeting for chronic fatigue management</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 hover:shadow-lg hover:border-sky-200 text-center">
        <p className="text-fluid-sm text-slate-500 mb-2">Daily Spoon Budget</p>
        <div className="flex justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
          {[6, 8, 10, 12, 15].map((n) => (
            <button key={n} onClick={() => setBudgetSpoons(n)} className={`r-touch px-3 sm:px-4 py-2 rounded-xl text-fluid-sm font-medium transition-all ${total === n ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-100'}`}>
              {n}
            </button>
          ))}
          <button onClick={() => setShowCustom(!showCustom)} className="r-touch px-3 sm:px-4 py-2 rounded-xl text-fluid-sm bg-white border border-slate-100 text-slate-700 hover:bg-slate-100">
            Custom
          </button>
        </div>
        {showCustom && (
          <div className="flex items-center justify-center gap-3 mb-4 animate-slide-up">
            <input type="number" value={customSpoons} onChange={(e) => setCustomSpoons(parseInt(e.target.value) || 0)} className="input-field w-24 text-center" min="1" />
            <button onClick={() => setBudgetSpoons(customSpoons)} className="btn-primary">Set</button>
          </div>
        )}

        <div className="py-4 sm:py-6">
          <div className={`text-fluid-hero font-bold font-fraunces mb-2 ${percent > 30 ? 'text-emerald-600' : 'text-red-600'}`}>
            {remaining}
          </div>
          <p className="text-fluid-sm text-slate-500">spoons remaining of {total}</p>
          <div className="w-full h-2 sm:h-3 rounded-full mt-3 sm:mt-4 bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${percent}%`, backgroundColor: percent > 30 ? '#10b981' : '#ef4444' }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="r-card hover:shadow-lg hover:border-sky-200">
          <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Log Activity</h2>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <input type="text" value={activityName} onChange={(e) => setActivityName(e.target.value)} placeholder="What did you do?" className="input-field flex-1 min-w-[140px]" />
            <input type="number" value={activityCost} onChange={(e) => setActivityCost(parseFloat(e.target.value) || 1)} className="input-field w-20" min="0.5" step="0.5" />
            <button onClick={logActivity} className="btn-primary">Log</button>
          </div>
          <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 flex-wrap">
            {[
              { name: 'Shower', cost: 2 },
              { name: 'Cook', cost: 3 },
              { name: 'Walk', cost: 2 },
              { name: 'Work', cost: 4 },
              { name: 'Socialize', cost: 3 },
            ].map((p) => (
              <button key={p.name} onClick={() => { setActivityName(p.name); setActivityCost(p.cost); }} className="r-touch px-2.5 sm:px-3 py-1.5 rounded-lg text-fluid-xs bg-white border border-slate-100 text-slate-700 hover:bg-slate-100">{p.name} ({p.cost})</button>
            ))}
          </div>
        </div>

        <div className="r-card hover:shadow-lg hover:border-sky-200">
          <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Today's Activity Log</h2>
          {activities.length === 0 ? (
            <p className="text-slate-500 text-center py-6 sm:py-8 text-fluid-sm">No activities logged today. Start tracking your energy.</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {activities.map((a) => (
                <div key={a.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex items-center justify-between animate-slide-up">
                  <span className="text-fluid-sm text-slate-700">{a.name}</span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-red-600 font-medium text-fluid-sm">-{Number(a.spoonCost)}</span>
                    <button onClick={() => deleteActivity(a.id)} className="r-touch text-red-600 hover:text-red-700 text-fluid-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
