import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';

interface Species {
  id: string;
  name: string;
  commonName: string | null;
  priority: number;
  description: string | null;
  isBeneficial: boolean;
}

const defaultForm = { name: '', commonName: '', priority: 1, description: '', isBeneficial: true };

export default function AdminMicrobiomeSpecies() {
  const { addToast } = useToast();
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Species | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/microbiome/species');
      setSpecies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('AdminMicrobiomeSpecies: load failed', err);
      addToast('Failed to load species', 'error');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (s: Species) => { setEditing(s); setForm({ name: s.name, commonName: s.commonName || '', priority: s.priority, description: s.description || '', isBeneficial: s.isBeneficial }); setShowModal(true); };

  const save = async () => {
    if (!form.name.trim()) { addToast('Name is required', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, commonName: form.commonName || null, description: form.description || null };
      if (editing) {
        const { data } = await api.put(`/microbiome/species/${editing.id}`, payload);
        setSpecies(species.map(s => s.id === editing.id ? data : s));
        addToast('Species updated', 'success');
      } else {
        const { data } = await api.post('/microbiome/species', payload);
        setSpecies([data, ...species]);
        addToast('Species created', 'success');
      }
      setShowModal(false);
    } catch (e: any) { addToast(e.response?.data?.error || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this species?')) return;
    try {
      await api.delete(`/microbiome/species/${id}`);
      setSpecies(species.filter(s => s.id !== id));
      addToast('Species deleted', 'success');
    } catch { addToast('Delete failed', 'error'); }
  };

  const filtered = species.filter(s => {
    if (priorityFilter && s.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || (s.commonName || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <SkeletonTable />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text font-fraunces">Bacteria Species</h1>
          <p className="text-gray-400 mt-1">{species.length} species · Manage the master bacteria reference table</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Species</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search species..." className="input-field flex-1 min-w-[200px]" />
        <select value={priorityFilter ?? ''} onChange={e => setPriorityFilter(e.target.value ? Number(e.target.value) : null)} className="input-field w-32">
          <option value="">All Priorities</option>
          {[1,2,3,4,5].map(p => <option key={p} value={p}>Priority {p}</option>)}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Common Name</th>
                <th className="text-center p-4 font-medium">Priority</th>
                <th className="text-center p-4 font-medium">Beneficial</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-white/5' : ''}`}>
                  <td className="p-4 text-white font-medium"><span className="italic">{s.name}</span></td>
                  <td className="p-4 text-gray-300">{s.commonName || '—'}</td>
                  <td className="p-4 text-center"><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">P{s.priority}</span></td>
                  <td className="p-4 text-center">{s.isBeneficial ? <span className="text-emerald-400">Yes</span> : <span className="text-red-400">No</span>}</td>
                  <td className="p-4 text-gray-400 max-w-xs truncate">{s.description || '—'}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEdit(s)} className="text-emerald-400 hover:text-emerald-300 mr-3 transition-colors">Edit</button>
                    <button onClick={() => del(s.id)} className="text-red-400 hover:text-red-300 transition-colors">Delete</button>
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
            <h2 className="text-xl font-semibold text-white mb-4">{editing ? 'Edit Species' : 'Add Species'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Scientific Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input-field w-full" placeholder="e.g. Akkermansia muciniphila" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Common Name</label>
                  <input type="text" value={form.commonName} onChange={e => setForm({...form, commonName: e.target.value})} className="input-field w-full" placeholder="e.g. Akkermansia" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: Number(e.target.value)})} className="input-field w-full">
                    {[1,2,3,4,5].map(p => <option key={p} value={p}>Priority {p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field w-full h-20" placeholder="Scientific description..." />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input type="checkbox" checked={form.isBeneficial} onChange={e => setForm({...form, isBeneficial: e.target.checked})} className="rounded" />
                Beneficial species
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
