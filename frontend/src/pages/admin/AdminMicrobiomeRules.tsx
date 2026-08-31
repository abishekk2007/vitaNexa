import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';

interface MicrobiomeRule {
  id: string; bacteriaName: string; level: string;
  speciesId?: string | null; clinicalDirection?: string | null;
  foodsToEat: string[]; foodsToAvoid: string[];
  probiotics: string[]; prebiotics: string[];
  shortExplanation?: string | null;
  evidenceGradeOverall?: string | null; confidenceScore?: number | null;
  medicalNotes?: string | null;
}

interface Species { id: string; name: string; }

const emptyForm = {
  bacteriaName: '', level: 'NORMAL', speciesId: '',
  clinicalDirection: '', foodsToEat: [] as string[], foodsToAvoid: [] as string[],
  probiotics: [] as string[], prebiotics: [] as string[],
  shortExplanation: '', evidenceGradeOverall: '', confidenceScore: null as number | null,
  medicalNotes: '',
};

export default function AdminMicrobiomeRules() {
  const { addToast } = useToast();
  const [rules, setRules] = useState<MicrobiomeRule[]>([]);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [rRes, sRes] = await Promise.all([
        api.get('/microbiome/rules'), api.get('/microbiome/species').catch(() => ({ data: [] }))
      ]);
      const rulesData = rRes.data?.data ?? rRes.data ?? [];
      setRules(Array.isArray(rulesData) ? rulesData : []);
      if (sRes?.data && Array.isArray(sRes.data)) setSpecies(sRes.data);
    } catch (err: any) {
      const status = err?.response?.status || err?.status || 'unknown';
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error(`AdminMicrobiomeRules: load failed [status=${status}] [msg=${msg}]`, err);
      setError(`Failed to load rules (${status})`);
      addToast(`Failed to load rules (${status}: ${msg})`, 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setModal(true); };
  const openEdit = (rule: MicrobiomeRule) => {
    setForm({
      bacteriaName: rule.bacteriaName, level: rule.level,
      speciesId: rule.speciesId || '',
      clinicalDirection: rule.clinicalDirection || '',
      foodsToEat: rule.foodsToEat, foodsToAvoid: rule.foodsToAvoid,
      probiotics: rule.probiotics, prebiotics: rule.prebiotics,
      shortExplanation: rule.shortExplanation || '',
      evidenceGradeOverall: rule.evidenceGradeOverall || '',
      confidenceScore: rule.confidenceScore ?? null,
      medicalNotes: rule.medicalNotes || '',
    });
    setEditing(rule.id); setModal(true);
  };

  const handleArr = (field: 'foodsToEat' | 'foodsToAvoid' | 'probiotics' | 'prebiotics', value: string) => {
    setForm(prev => ({ ...prev, [field]: value.split(',').map(s => s.trim()).filter(Boolean) }));
  };

  const handleSave = async () => {
    if (!form.bacteriaName.trim()) { addToast('Bacteria name is required', 'error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, speciesId: form.speciesId || null, clinicalDirection: form.clinicalDirection || null, shortExplanation: form.shortExplanation || null, evidenceGradeOverall: form.evidenceGradeOverall || null, medicalNotes: form.medicalNotes || null };
      if (editing) { await api.put(`/microbiome/rules/${editing}`, payload); addToast('Rule updated', 'success'); }
      else { await api.post('/microbiome/rules', payload); addToast('Rule created', 'success'); }
      setModal(false); load();
    } catch (err: any) {
      const status = err?.response?.status || 'unknown';
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error(`AdminMicrobiomeRules: save failed [status=${status}] [msg=${msg}]`);
      addToast(`Save failed (${status}: ${msg})`, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    setDeleting(id);
    try { await api.delete(`/microbiome/rules/${id}`); setRules(prev => prev.filter(r => r.id !== id)); addToast('Rule deleted', 'success'); }
    catch (err: any) {
      const status = err?.response?.status || 'unknown';
      const msg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error(`AdminMicrobiomeRules: delete failed [status=${status}] [msg=${msg}]`);
      addToast(`Delete failed (${status}: ${msg})`, 'error');
    } finally { setDeleting(null); }
  };

  const levelBadge = (lvl: string) => { switch (lvl) { case 'HIGH': return 'badge-error'; case 'LOW': return 'badge-warning'; default: return 'badge-info'; } };
  const gradeColor = (g: string) => g === 'A' ? 'text-emerald-400 bg-emerald-500/10' : g === 'B' ? 'text-blue-400 bg-blue-500/10' : g === 'C' ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400 bg-gray-500/10';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text font-fraunces mb-2">Rules Engine</h1>
          <p className="text-gray-400">{rules.length} rules · Clinical decision rules for bacteria levels</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ New Rule</button>
      </div>
      <div className="glass rounded-2xl p-6">
        {loading ? <SkeletonTable rows={6} /> : error ? (
          <div className="text-center py-8"><p className="text-red-400 mb-4">{error}</p><button onClick={load} className="btn-primary">Retry</button></div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12"><p className="text-gray-400 mb-4">No rules found</p><button onClick={openCreate} className="btn-primary">Create First Rule</button></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left p-3 font-medium">Bacteria</th>
                  <th className="text-left p-3 font-medium">Level</th>
                  <th className="text-left p-3 font-medium">Direction</th>
                  <th className="text-left p-3 font-medium">Eat</th>
                  <th className="text-left p-3 font-medium">Avoid</th>
                  <th className="text-center p-3 font-medium">Evidence</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium text-white">{r.bacteriaName}</td>
                    <td className="p-3"><span className={levelBadge(r.level)}>{r.level}</span></td>
                    <td className="p-3 text-xs">{r.clinicalDirection ? <span className="text-gray-400">{r.clinicalDirection}</span> : <span className="text-gray-500">—</span>}</td>
                    <td className="p-3 max-w-[180px]"><div className="flex flex-wrap gap-1">{r.foodsToEat.slice(0, 2).map((f, i) => <span key={i} className="badge-success text-[10px]">{f}</span>)}{r.foodsToEat.length > 2 && <span className="text-xs text-gray-500">+{r.foodsToEat.length - 2}</span>}</div></td>
                    <td className="p-3 max-w-[180px]"><div className="flex flex-wrap gap-1">{r.foodsToAvoid.slice(0, 2).map((f, i) => <span key={i} className="badge-error text-[10px]">{f}</span>)}{r.foodsToAvoid.length > 2 && <span className="text-xs text-gray-500">+{r.foodsToAvoid.length - 2}</span>}</div></td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.evidenceGradeOverall && <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${gradeColor(r.evidenceGradeOverall)}`}>{r.evidenceGradeOverall}</span>}
                        {r.confidenceScore != null && <span className="text-[10px] text-gray-500">{r.confidenceScore}%</span>}
                        {!r.evidenceGradeOverall && <span className="text-gray-500">—</span>}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(r)} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">Edit</button>
                        <button onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50">{deleting === r.id ? '...' : 'Delete'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="glass rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white font-fraunces mb-6">{editing ? 'Edit Rule' : 'Create Rule'}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Species</label>
                    <select value={form.speciesId} onChange={e => { const sp = species.find(s => s.id === e.target.value); setForm(prev => ({ ...prev, speciesId: e.target.value, bacteriaName: sp?.name || prev.bacteriaName })); }} className="input-field w-full">
                      <option value="">Select species (optional)</option>
                      {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Level</label>
                    <select value={form.level} onChange={e => setForm(prev => ({ ...prev, level: e.target.value }))} className="input-field w-full">
                      <option value="LOW">Low</option>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Bacteria Name</label>
                  <input type="text" value={form.bacteriaName} onChange={e => setForm(prev => ({ ...prev, bacteriaName: e.target.value }))} className="input-field w-full" placeholder="e.g. Akkermansia muciniphila" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Clinical Direction</label>
                    <select value={form.clinicalDirection} onChange={e => setForm(prev => ({ ...prev, clinicalDirection: e.target.value }))} className="input-field w-full">
                      <option value="">None</option>
                      <option value="beneficial_high">Beneficial when high</option>
                      <option value="concerning_high">Concerning when high</option>
                      <option value="beneficial_low">Beneficial when low</option>
                      <option value="concerning_low">Concerning when low</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Evidence Grade</label>
                      <select value={form.evidenceGradeOverall} onChange={e => setForm(prev => ({ ...prev, evidenceGradeOverall: e.target.value }))} className="input-field w-full">
                        <option value="">None</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Confidence</label>
                      <input type="number" min="0" max="100" value={form.confidenceScore ?? ''} onChange={e => setForm(prev => ({ ...prev, confidenceScore: e.target.value ? Number(e.target.value) : null }))} className="input-field w-full" placeholder="0-100" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Short Explanation</label>
                  <input type="text" value={form.shortExplanation} onChange={e => setForm(prev => ({ ...prev, shortExplanation: e.target.value }))} className="input-field w-full" placeholder="Brief clinical explanation..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Foods to Eat (comma separated)</label>
                  <textarea value={form.foodsToEat.join(', ')} onChange={e => handleArr('foodsToEat', e.target.value)} rows={2} className="input-field w-full" placeholder="yogurt, kefir, sauerkraut" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Foods to Avoid (comma separated)</label>
                  <textarea value={form.foodsToAvoid.join(', ')} onChange={e => handleArr('foodsToAvoid', e.target.value)} rows={2} className="input-field w-full" placeholder="sugar, processed foods" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Probiotics (comma separated)</label>
                    <textarea value={form.probiotics.join(', ')} onChange={e => handleArr('probiotics', e.target.value)} rows={2} className="input-field w-full" placeholder="Lactobacillus rhamnosus GG" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Prebiotics (comma separated)</label>
                    <textarea value={form.prebiotics.join(', ')} onChange={e => handleArr('prebiotics', e.target.value)} rows={2} className="input-field w-full" placeholder="Inulin, FOS, GOS" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Medical Notes</label>
                  <textarea value={form.medicalNotes} onChange={e => setForm(prev => ({ ...prev, medicalNotes: e.target.value }))} rows={3} className="input-field w-full" placeholder="Additional notes..." />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
