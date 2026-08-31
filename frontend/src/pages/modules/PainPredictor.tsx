import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonModule } from '../../components/ui/Skeleton';
import api from '../../api/client';
import type { PainLog } from '../../types';

const today = () => new Date().toISOString().split('T')[0];

export default function PainPredictor() {
  const { addToast } = useToast();
  const [logs, setLogs] = useState<PainLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    date: today(), time: '', location: '', painLevel: 5,
    weather: '', food: '', stress: '', sleepHours: 7, exercise: false,
  });

  const load = async () => {
    try {
      const { data } = await api.get('/pain');
      setLogs(data.data ?? data ?? []);
    } catch {
      addToast('Failed to load pain logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/pain', form);
      setLogs([data, ...logs]);
      setForm({ date: today(), time: '', location: '', painLevel: 5, weather: '', food: '', stress: '', sleepHours: 7, exercise: false });
      addToast('Pain entry logged', 'success');
    } catch (e: any) {
      addToast(e.response?.data?.error || 'Failed to log pain', 'error');
    }
  };

  const painHeat = (level: number) => {
    if (level >= 7) return 'badge-error';
    if (level >= 4) return 'badge-warning';
    return 'badge-success';
  };

  if (loading) return <SkeletonModule />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-fraunces">Pain Pattern Predictor</h1>
        <p className="text-slate-500 mt-1">Log pain episodes and discover patterns over time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:border-sky-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Log Pain Entry</h2>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Time</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g., Lower back" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Pain Level: <span className="text-slate-900 font-bold">{form.painLevel}/10</span></label>
              <input type="range" min="1" max="10" value={form.painLevel} onChange={(e) => setForm({ ...form, painLevel: parseInt(e.target.value) })} className="w-full accent-emerald-500" />
              <div className="flex justify-between text-xs text-slate-400 mt-1"><span>1 (Mild)</span><span>10 (Severe)</span></div>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Weather</label>
              <input type="text" value={form.weather} onChange={(e) => setForm({ ...form, weather: e.target.value })} placeholder="e.g., Rainy, Humid" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Food Trigger</label>
              <input type="text" value={form.food} onChange={(e) => setForm({ ...form, food: e.target.value })} placeholder="e.g., Spicy food" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Stress Level</label>
              <select value={form.stress} onChange={(e) => setForm({ ...form, stress: e.target.value })} className="input-field">
                <option value="">Select</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Sleep Hours</label>
              <input type="number" step="0.5" value={form.sleepHours} onChange={(e) => setForm({ ...form, sleepHours: parseFloat(e.target.value) })} className="input-field" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="exercise" checked={form.exercise} onChange={(e) => setForm({ ...form, exercise: e.target.checked })} className="w-4 h-4 accent-emerald-500" />
              <label htmlFor="exercise" className="text-sm text-slate-700">Exercised today</label>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary">Log Pain Entry</button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:border-sky-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Pain Summary</h2>
          <div className="bg-white border border-slate-100 rounded-xl p-5 text-center shadow-sm">
            <div className={`text-5xl mb-3 ${logs.length === 0 ? 'text-slate-300' : ''}`}>
              {logs.length > 0 ? (
                logs[0].painLevel >= 7 ? '🔴' : logs[0].painLevel >= 4 ? '🟡' : '🟢'
              ) : '⚪'}
            </div>
            <p className="text-slate-700 text-sm">
              {logs.length > 0
                ? `Latest pain: ${logs[0].painLevel}/10${logs[0].location ? ` at ${logs[0].location}` : ''}`
                : 'No pain data logged yet'}
            </p>
            <p className="text-xs text-slate-400 mt-3">{logs.length} total entries recorded</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-lg hover:border-sky-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Pain History</h2>
        {logs.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Nothing logged yet. Use the form above to start tracking.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Pain</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-left p-3">Weather</th>
                  <th className="text-left p-3">Stress</th>
                  <th className="text-left p-3">Sleep</th>
                  <th className="text-left p-3">Exercise</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">
                    <td className="p-3">{new Date(l.date).toLocaleDateString()}</td>
                    <td className="p-3"><span className={painHeat(l.painLevel)}>{l.painLevel}/10</span></td>
                    <td className="p-3">{l.location || '-'}</td>
                    <td className="p-3">{l.weather || '-'}</td>
                    <td className="p-3">{l.stress || '-'}</td>
                    <td className="p-3">{l.sleepHours ? `${l.sleepHours}h` : '-'}</td>
                    <td className="p-3">{l.exercise ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
