import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonModule } from '../../components/ui/Skeleton';
import api from '../../api/client';
import type { SavingsEntry, SavingsGoal } from '../../types';

export default function BudgetSaver() {
  const { addToast } = useToast();
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(100);
  const [notes, setNotes] = useState('');
  const [goalForm, setGoalForm] = useState({ name: '', targetAmount: 10000, deadline: '', reminderTime: '' });

  const currentTotal = entries.length > 0 ? Number(entries[entries.length - 1].runningTotal) : 0;

  const load = async () => {
    try {
      const [e, g] = await Promise.all([
        api.get('/savings/entries'),
        api.get('/savings/goals'),
      ]);
      setEntries(e.data?.data ?? e.data ?? []);
      setGoals(g.data?.data ?? g.data ?? []);
    } catch {
      addToast('Failed to load savings data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveToday = async () => {
    if (amount <= 0) return;
    try {
      const { data } = await api.post('/savings/entries', { amount, notes });
      setEntries([...entries, data]);
      setAmount(100);
      setNotes('');
      addToast(`Saved ₹${amount}!`, 'success');
    } catch (e: any) {
      addToast(e.response?.data?.error || 'Failed to save', 'error');
    }
  };

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/savings/goals', goalForm);
      setGoals([data, ...goals]);
      setGoalForm({ name: '', targetAmount: 10000, deadline: '', reminderTime: '' });
      addToast('Goal created!', 'success');
    } catch (e: any) {
      addToast(e.response?.data?.error || 'Failed to create goal', 'error');
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await api.delete(`/savings/entries/${id}`);
      setEntries(entries.filter((e) => e.id !== id));
      addToast('Entry deleted', 'success');
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await api.delete(`/savings/goals/${id}`);
      setGoals(goals.filter((g) => g.id !== id));
      addToast('Goal deleted', 'success');
    } catch {
      addToast('Delete failed', 'error');
    }
  };

  if (loading) return <SkeletonModule />;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-fluid-2xl sm:text-3xl font-bold text-slate-800 font-fraunces">Smart Budget Saver</h1>
        <p className="text-fluid-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Track your savings and reach your financial goals</p>
      </div>

      <div className="r-card text-center transition-all hover:shadow-lg hover:border-sky-200">
        <p className="text-fluid-sm text-slate-500 mb-1 sm:mb-2">Total Savings</p>
        <div className="text-fluid-hero font-bold text-emerald-600 font-fraunces mb-1">₹{currentTotal.toLocaleString()}</div>
        <p className="text-slate-400 text-fluid-sm">{entries.length} entries recorded</p>
      </div>

      <div className="r-card transition-all hover:shadow-lg hover:border-sky-200">
        <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">I Saved Today!</h2>
        <div className="flex gap-3 sm:gap-4 items-end flex-wrap">
          <div className="w-full sm:w-auto">
            <label className="block text-fluid-sm text-slate-700 mb-0.5 sm:mb-1">Amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} min="1" className="input-field w-full sm:w-32" />
          </div>
          <div className="flex-1 min-w-[180px] sm:min-w-[200px] w-full sm:w-auto">
            <label className="block text-fluid-sm text-slate-700 mb-0.5 sm:mb-1">Notes (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What's this for?" className="input-field w-full" />
          </div>
          <button onClick={saveToday} className="btn-primary w-full sm:w-auto">Save ₹{amount}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="r-card transition-all hover:shadow-lg hover:border-sky-200">
          <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Savings Goals</h2>

          <form onSubmit={createGoal} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 space-y-2 sm:space-y-3">
            <input type="text" value={goalForm.name} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} required placeholder="Goal name (e.g., New Laptop)" className="input-field w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <input type="number" value={goalForm.targetAmount} onChange={(e) => setGoalForm({ ...goalForm, targetAmount: parseFloat(e.target.value) || 0 })} required min="1" placeholder="Target amount" className="input-field w-full" />
              <input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })} className="input-field w-full" />
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto">Create Goal</button>
          </form>

          {goals.length === 0 ? (
            <p className="text-slate-500 text-center py-3 sm:py-4 text-fluid-sm">No goals yet. Create one above to get started.</p>
          ) : (
            <div className="space-y-2 sm:space-y-3 max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
              {goals.map((g) => {
                const progress = Number(g.targetAmount) > 0 ? Math.min(100, Math.round((currentTotal / Number(g.targetAmount)) * 100)) : 0;
                return (
                  <div key={g.id} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 animate-slide-up">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <h3 className="text-fluid-sm sm:text-base text-slate-800 font-medium truncate">{g.name}</h3>
                      <button onClick={() => deleteGoal(g.id)} className="r-touch text-red-500 hover:text-red-700 text-fluid-xs">Delete</button>
                    </div>
                    <div className="text-fluid-base sm:text-lg font-bold text-emerald-600">₹{currentTotal.toLocaleString()} / ₹{Number(g.targetAmount).toLocaleString()}</div>
                    <div className="w-full h-2 sm:h-2.5 rounded-full bg-slate-100 mt-2 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-fluid-xs text-slate-500 mt-0.5 sm:mt-1">
                      <span>{progress}% complete</span>
                      {g.deadline && <span>Due: {new Date(g.deadline).toLocaleDateString()}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="r-card transition-all hover:shadow-lg hover:border-sky-200">
          <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Recent Entries</h2>
          {entries.length === 0 ? (
            <p className="text-slate-500 text-center py-6 sm:py-8 text-fluid-sm">No savings entries yet. Save your first amount above.</p>
          ) : (
            <div className="space-y-1.5 sm:space-y-2 max-h-[500px] overflow-y-auto pr-1 sm:pr-2">
              {entries.slice().reverse().map((e) => (
                <div key={e.id} className="bg-white border border-slate-200 rounded-xl p-2.5 sm:p-3 flex items-center justify-between animate-slide-up">
                  <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-wrap">
                    <span className="text-fluid-sm sm:text-base text-slate-800 font-medium">₹{Number(e.amount).toLocaleString()}</span>
                    {e.notes && <span className="text-slate-500 text-fluid-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{e.notes}</span>}
                    <span className="text-slate-400 text-fluid-xs">{new Date(e.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    <span className="text-emerald-600 text-fluid-xs">₹{Number(e.runningTotal).toLocaleString()}</span>
                    <button onClick={() => deleteEntry(e.id)} className="r-touch text-red-500 hover:text-red-700 text-fluid-xs">Delete</button>
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
