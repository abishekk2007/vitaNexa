import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';

interface FoodItem {
  id: string; name: string; category: string; description: string | null;
  solubleFiber: number | null; insolubleFiber: number | null; polyphenols: number | null;
  isPrebiotic: boolean; isProbiotic: boolean; isRiskFood: boolean;
}

const CATEGORIES = ['FRUITS', 'VEGETABLES', 'LEGUMES', 'GRAINS', 'NUTS_SEEDS', 'FERMENTED', 'SPICES', 'RISK_FOODS'];
const defaultForm = { name: '', category: 'FRUITS', description: '', solubleFiber: null as number | null, insolubleFiber: null as number | null, polyphenols: null as number | null, isPrebiotic: false, isProbiotic: false, isRiskFood: false };

export default function AdminMicrobiomeFoods() {
  const { addToast } = useToast();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/microbiome/foods');
      setFoods(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('AdminMicrobiomeFoods: load failed', err);
      addToast('Failed to load foods', 'error');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (f: FoodItem) => { setEditing(f); setForm({ name: f.name, category: f.category, description: f.description || '', solubleFiber: f.solubleFiber, insolubleFiber: f.insolubleFiber, polyphenols: f.polyphenols, isPrebiotic: f.isPrebiotic, isProbiotic: f.isProbiotic, isRiskFood: f.isRiskFood }); setShowModal(true); };

  const save = async () => {
    if (!form.name.trim()) { addToast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, description: form.description || null };
      if (editing) { const { data } = await api.put(`/microbiome/foods/${editing.id}`, payload); setFoods(foods.map(f => f.id === editing.id ? data : f)); addToast('Food updated', 'success'); }
      else { const { data } = await api.post('/microbiome/foods', payload); setFoods([data, ...foods]); addToast('Food created', 'success'); }
      setShowModal(false);
    } catch (e: any) { addToast(e.response?.data?.error || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this food?')) return;
    try { await api.delete(`/microbiome/foods/${id}`); setFoods(foods.filter(f => f.id !== id)); addToast('Food deleted', 'success'); }
    catch { addToast('Delete failed', 'error'); }
  };

  const filtered = foods.filter(f => {
    if (catFilter && f.category !== catFilter) return false;
    if (search) return f.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  if (loading) return <SkeletonTable />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text font-fraunces">Food Library</h1>
          <p className="text-gray-400 mt-1">{foods.length} food items · Manage the master food reference database</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Food</button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search foods..." className="input-field flex-1 min-w-[200px]" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field w-40">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-center p-4 font-medium">Prebiotic</th>
                <th className="text-center p-4 font-medium">Probiotic</th>
                <th className="text-center p-4 font-medium">Risk Food</th>
                <th className="text-center p-4 font-medium">Fiber (g)</th>
                <th className="text-center p-4 font-medium">Polyphenols</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-white/5' : ''}`}>
                  <td className="p-4 text-white font-medium">{f.name}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs">{f.category}</span></td>
                  <td className="p-4 text-center">{f.isPrebiotic ? <span className="text-emerald-400">Yes</span> : <span className="text-gray-500">—</span>}</td>
                  <td className="p-4 text-center">{f.isProbiotic ? <span className="text-purple-400">Yes</span> : <span className="text-gray-500">—</span>}</td>
                  <td className="p-4 text-center">{f.isRiskFood ? <span className="text-red-400">Yes</span> : <span className="text-gray-500">—</span>}</td>
                  <td className="p-4 text-center text-gray-300">{(f.solubleFiber || 0) + (f.insolubleFiber || 0) > 0 ? `${((f.solubleFiber || 0) + (f.insolubleFiber || 0)).toFixed(1)}` : '—'}</td>
                  <td className="p-4 text-center text-gray-300">{f.polyphenols ? `${f.polyphenols}mg` : '—'}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEdit(f)} className="text-emerald-400 hover:text-emerald-300 mr-3">Edit</button>
                    <button onClick={() => del(f.id)} className="text-red-400 hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white mb-4">{editing ? 'Edit Food' : 'Add Food'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input-field w-full">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isPrebiotic} onChange={e => setForm({...form, isPrebiotic: e.target.checked})} /> Prebiotic</label>
                <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isProbiotic} onChange={e => setForm({...form, isProbiotic: e.target.checked})} /> Probiotic</label>
                <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.isRiskFood} onChange={e => setForm({...form, isRiskFood: e.target.checked})} /> Risk Food</label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Soluble Fiber (g)</label><input type="number" step="0.1" value={form.solubleFiber ?? ''} onChange={e => setForm({...form, solubleFiber: e.target.value ? Number(e.target.value) : null})} className="input-field w-full" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Insoluble Fiber (g)</label><input type="number" step="0.1" value={form.insolubleFiber ?? ''} onChange={e => setForm({...form, insolubleFiber: e.target.value ? Number(e.target.value) : null})} className="input-field w-full" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Polyphenols (mg)</label><input type="number" step="1" value={form.polyphenols ?? ''} onChange={e => setForm({...form, polyphenols: e.target.value ? Number(e.target.value) : null})} className="input-field w-full" /></div>
              </div>
              <div><label className="text-xs text-gray-400 mb-1 block">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field w-full h-20" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
