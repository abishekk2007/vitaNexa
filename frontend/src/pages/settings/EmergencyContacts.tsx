import { useState } from 'react';
import { useEmergencyContacts } from '../../hooks/useEmergencyContacts';
import { useToast } from '../../contexts/ToastContext';

export default function EmergencyContacts() {
  const { contacts, loading, createContact, updateContact, deleteContact, reorderContacts, sendTestAlert } = useEmergencyContacts();
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', relation: '' });
  const [search, setSearch] = useState('');

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const resetForm = () => { setForm({ name: '', phone: '', relation: '' }); setEditingId(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { addToast('Name and phone are required', 'error'); return; }
    try {
      if (editingId) {
        await updateContact(editingId, form);
        addToast('Contact updated', 'success');
      } else {
        await createContact(form);
        addToast('Contact added', 'success');
      }
      resetForm();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Operation failed', 'error');
    }
  };

  const handleEdit = (c: typeof contacts[0]) => {
    setForm({ name: c.name, phone: c.phone, relation: c.relation || '' });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this emergency contact?')) return;
    await deleteContact(id);
    addToast('Contact removed', 'success');
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const ordered = filtered.map(c => c.id);
    [ordered[index - 1], ordered[index]] = [ordered[index], ordered[index - 1]];
    await reorderContacts(ordered);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= filtered.length - 1) return;
    const ordered = filtered.map(c => c.id);
    [ordered[index], ordered[index + 1]] = [ordered[index + 1], ordered[index]];
    await reorderContacts(ordered);
  };

  const handleTest = async (id: string) => {
    try {
      const result = await sendTestAlert(id);
      addToast(`Test alert ${result.result?.success ? 'sent' : 'failed'}`, result.result?.success ? 'success' : 'error');
    } catch { addToast('Test alert failed', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-fraunces">Emergency Contacts</h1>
          <p className="text-slate-500 text-sm mt-1">Manage who gets notified when you trigger an SOS alert</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          Add Contact
        </button>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="input-field pl-10" />
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">{editingId ? 'Edit Contact' : 'Add Contact'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required className="input-field" placeholder="9876543210" />
              <p className="text-xs text-slate-400 mt-1">Indian mobile will be converted to +91XXXXXXXXXX</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Relation</label>
              <input type="text" value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })} className="input-field" placeholder="e.g. Spouse, Parent, Friend" />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Add'} Contact</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📞</div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Emergency Contacts</h3>
          <p className="text-slate-500 mb-4">Add contacts who will be notified when you trigger an SOS alert.</p>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">Add Your First Contact</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, i) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between animate-slide-up">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleMoveUp(i)} disabled={i === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30" title="Move up">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => handleMoveDown(i)} disabled={i >= filtered.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30" title="Move down">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 font-medium">{c.name}</span>
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">#{c.priority}</span>
                    {c.isVerified && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Verified</span>}
                  </div>
                  <p className="text-sm text-slate-500">{c.phone} {c.relation ? `• ${c.relation}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleTest(c.id)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors" title="Send test alert">
                  Test
                </button>
                <button onClick={() => handleEdit(c)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  Edit
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
