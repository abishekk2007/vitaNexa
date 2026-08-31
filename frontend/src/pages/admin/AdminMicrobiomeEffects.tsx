import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';

interface Effect {
  id: string; speciesId: string; foodId: string;
  effect: string; evidenceGrade: string | null; evidenceBasis: string | null;
  mechanism: string | null; confidenceScore: number | null;
  keyReference: string | null; reviewStatus: string;
  species: { id: string; name: string }; food: { id: string; name: string };
}

interface Species { id: string; name: string; }
interface FoodItem { id: string; name: string; category: string; }

const EFFECTS = ['STRONGLY_INCREASES', 'MODERATELY_INCREASES', 'SLIGHTLY_INCREASES', 'NEUTRAL', 'SLIGHTLY_DECREASES', 'MODERATELY_DECREASES', 'STRONGLY_DECREASES'];
const GRADES = ['A', 'B', 'C', 'D'];
const BASES = ['human_species_specific', 'human_genus_level', 'observational_only', 'animal_invitro', 'theoretical_only'];
const STATUSES = ['draft', 'pending_review', 'approved', 'archived'];

const defaultForm = { speciesId: '', foodId: '', effect: 'NEUTRAL', evidenceGrade: '', evidenceBasis: '', mechanism: '', confidenceScore: null as number | null, keyReference: '', reviewStatus: 'draft' };

export default function AdminMicrobiomeEffects() {
  const { addToast } = useToast();
  const [effects, setEffects] = useState<Effect[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [effectFilter, setEffectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Effect | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [eRes, sRes, fRes] = await Promise.all([
        api.get('/microbiome/effects'), api.get('/microbiome/species'), api.get('/microbiome/foods')
      ]);
      const effectsData = eRes.data?.data ?? eRes.data ?? [];
      setEffects(Array.isArray(effectsData) ? effectsData : []);
      if (sRes?.data && Array.isArray(sRes.data)) setSpecies(sRes.data);
      if (fRes?.data && Array.isArray(fRes.data)) setFoods(fRes.data);
      console.log('AdminMicrobiomeEffects: loaded');
    } catch (err) {
      console.error('AdminMicrobiomeEffects: load failed', err);
      addToast('Failed to load data', 'error');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (e: Effect) => {
    setEditing(e);
    setForm({ speciesId: e.speciesId, foodId: e.foodId, effect: e.effect, evidenceGrade: e.evidenceGrade || '', evidenceBasis: e.evidenceBasis || '', mechanism: e.mechanism || '', confidenceScore: e.confidenceScore, keyReference: e.keyReference || '', reviewStatus: e.reviewStatus });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.speciesId || !form.foodId) { addToast('Species and Food are required', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, evidenceGrade: form.evidenceGrade || null, evidenceBasis: form.evidenceBasis || null, mechanism: form.mechanism || null, keyReference: form.keyReference || null };
      if (editing) { const { data } = await api.put(`/microbiome/effects/${editing.id}`, payload); setEffects(effects.map(e => e.id === editing.id ? data : e)); addToast('Effect updated', 'success'); }
      else { const { data } = await api.post('/microbiome/effects', payload); setEffects([data, ...effects]); addToast('Effect created', 'success'); }
      setShowModal(false);
    } catch (e: any) { addToast(e.response?.data?.error || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete this effect?')) return;
    try { await api.delete(`/microbiome/effects/${id}`); setEffects(effects.filter(e => e.id !== id)); addToast('Effect deleted', 'success'); }
    catch { addToast('Delete failed', 'error'); }
  };

  const filtered = effects.filter(e => {
    if (speciesFilter && e.speciesId !== speciesFilter) return false;
    if (effectFilter && e.effect !== effectFilter) return false;
    if (statusFilter && e.reviewStatus !== statusFilter) return false;
    return true;
  });

  if (loading) return <SkeletonTable />;

  const statusColor = (s: string) => s === 'approved' ? 'text-emerald-400' : s === 'pending_review' ? 'text-amber-400' : s === 'archived' ? 'text-gray-500' : 'text-sky-400';
  const effectColor = (eff: string) => eff.includes('INCREASES') ? 'text-emerald-400' : eff.includes('DECREASES') ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text font-fraunces">Food-Bacteria Effects</h1>
          <p className="text-gray-400 mt-1">{effects.length} relationships · Scientific evidence mapping</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Effect</button>
      </div>
      <div className="flex gap-3 flex-wrap">
        <select value={speciesFilter} onChange={e => setSpeciesFilter(e.target.value)} className="input-field flex-1 min-w-[150px]">
          <option value="">All Species</option>
          {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={effectFilter} onChange={e => setEffectFilter(e.target.value)} className="input-field w-48">
          <option value="">All Effects</option>
          {EFFECTS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field w-36">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="border-b border-white/10 text-gray-400">
                <th className="text-left p-3 font-medium">Species</th>
                <th className="text-left p-3 font-medium">Food</th>
                <th className="text-left p-3 font-medium">Effect</th>
                <th className="text-center p-3 font-medium">Grade</th>
                <th className="text-center p-3 font-medium">Confidence</th>
                <th className="text-left p-3 font-medium">Mechanism</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((e, i) => (
                <tr key={e.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-white/5' : ''}`}>
                  <td className="p-3 text-white font-medium text-xs italic">{e.species.name}</td>
                  <td className="p-3 text-gray-200 text-xs">{e.food.name}</td>
                  <td className="p-3 text-xs"><span className={effectColor(e.effect)}>{e.effect}</span></td>
                  <td className="p-3 text-center">{e.evidenceGrade ? <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${e.evidenceGrade === 'A' ? 'bg-emerald-500/20 text-emerald-400' : e.evidenceGrade === 'B' ? 'bg-blue-500/20 text-blue-400' : e.evidenceGrade === 'C' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}>{e.evidenceGrade}</span> : <span className="text-gray-500">—</span>}</td>
                  <td className="p-3 text-center text-xs">{e.confidenceScore !== null ? `${e.confidenceScore}%` : '—'}</td>
                  <td className="p-3 text-gray-400 text-xs max-w-[200px] truncate">{e.mechanism || '—'}</td>
                  <td className="p-3 text-center"><span className={`text-xs ${statusColor(e.reviewStatus)}`}>{e.reviewStatus}</span></td>
                  <td className="p-3 text-right">
                    <button onClick={() => openEdit(e)} className="text-emerald-400 hover:text-emerald-300 mr-2 text-xs">Edit</button>
                    <button onClick={() => del(e.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && <p className="text-center text-gray-500 p-3 text-xs">Showing 500 of {filtered.length} results. Use filters to narrow down.</p>}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-white mb-4">{editing ? 'Edit Effect' : 'Add Effect'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Species *</label>
                  <select value={form.speciesId} onChange={e => setForm({...form, speciesId: e.target.value})} className="input-field w-full">
                    <option value="">Select species...</option>
                    {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Food *</label>
                  <select value={form.foodId} onChange={e => setForm({...form, foodId: e.target.value})} className="input-field w-full">
                    <option value="">Select food...</option>
                    {foods.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Effect</label>
                  <select value={form.effect} onChange={e => setForm({...form, effect: e.target.value})} className="input-field w-full">
                    {EFFECTS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Evidence Grade</label>
                  <select value={form.evidenceGrade} onChange={e => setForm({...form, evidenceGrade: e.target.value})} className="input-field w-full">
                    <option value="">None</option>
                    {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Confidence</label>
                  <input type="number" min="0" max="100" value={form.confidenceScore ?? ''} onChange={e => setForm({...form, confidenceScore: e.target.value ? Number(e.target.value) : null})} className="input-field w-full" placeholder="0-100" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Evidence Basis</label>
                <select value={form.evidenceBasis} onChange={e => setForm({...form, evidenceBasis: e.target.value})} className="input-field w-full">
                  <option value="">None</option>
                  {BASES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Mechanism</label>
                <input type="text" value={form.mechanism} onChange={e => setForm({...form, mechanism: e.target.value})} className="input-field w-full" placeholder="e.g. Inulin fermentation" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Key Reference</label>
                <input type="text" value={form.keyReference} onChange={e => setForm({...form, keyReference: e.target.value})} className="input-field w-full" placeholder="DOI or citation" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Review Status</label>
                <select value={form.reviewStatus} onChange={e => setForm({...form, reviewStatus: e.target.value})} className="input-field w-full">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
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
