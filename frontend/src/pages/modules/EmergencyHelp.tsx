import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonModule } from '../../components/ui/Skeleton';
import { useEmergencyLocation } from '../../hooks/useEmergencyLocation';
import api from '../../api/client';
import type { EmergencyEvent, EmergencyContact } from '../../types';

type ViewMode = 'main' | 'active-sos' | 'contacts' | 'admin';

const SOS_STORAGE_KEY = 'vitanexa_emergency_queue';

function getStoredQueue(): any[] {
  try { return JSON.parse(localStorage.getItem(SOS_STORAGE_KEY) || '[]'); } catch { return []; }
}

function setStoredQueue(queue: any[]) {
  localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(queue));
}

const HospitalCard = ({ h, onNavigate }: { h: any; onNavigate?: (lat: number, lng: number) => void }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between animate-slide-up hover:shadow-md transition-shadow">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${h.type === 'Government' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        <span className="text-slate-800 font-medium truncate">{h.name}</span>
      </div>
      <div className="flex flex-wrap gap-2 mt-1">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${h.type === 'Government' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {h.type}
        </span>
        {h.hours24x7 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">24x7</span>}
        {h.hasEmergencyDept && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Emergency</span>}
      </div>
      <p className="text-xs text-slate-500 mt-1 truncate">{h.address || 'Address unavailable'}</p>
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
        <span>{h.distance ? `${h.distance} km` : ''}</span>
        {h.phone && <a href={`tel:${h.phone}`} className="text-sky-600 font-medium hover:underline">{h.phone}</a>}
      </div>
      {h.latitude && h.longitude && (
        <a href={`https://maps.google.com/?q=${h.latitude},${h.longitude}`} target="_blank" rel="noopener noreferrer"
          className="text-xs text-sky-600 hover:text-sky-700 font-medium mt-1 inline-block">
          Navigate via Google Maps
        </a>
      )}
    </div>
    {h.phone && (
      <a href={`tel:${h.phone}`} className="btn-primary text-xs px-3 py-2 ml-2 shrink-0">
        Call
      </a>
    )}
  </div>
);

const EmergencyContacts = () => {
  const { addToast } = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', relation: '' });
  const [search, setSearch] = useState('');

  const fetchContacts = useCallback(async () => {
    try {
      const { data } = await api.get('/emergency/contacts');
      setContacts(Array.isArray(data) ? data : []);
    } catch { setContacts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const filtered = useMemo(() =>
    contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)),
    [contacts, search]
  );

  const resetForm = () => { setForm({ name: '', phone: '', relation: '' }); setEditId(null); setShowForm(false); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { addToast('Name and phone required', 'error'); return; }
    try {
      if (editId) {
        await api.put(`/emergency/contacts/${editId}`, form);
        addToast('Contact updated', 'success');
      } else {
        await api.post('/emergency/contacts', form);
        addToast('Contact added', 'success');
      }
      resetForm();
      fetchContacts();
    } catch (err: any) { addToast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this emergency contact?')) return;
    await api.delete(`/emergency/contacts/${id}`);
    addToast('Contact removed', 'success');
    fetchContacts();
  };

  const handleEdit = (c: EmergencyContact) => {
    setForm({ name: c.name, phone: c.phone, relation: c.relation || '' });
    setEditId(c.id);
    setShowForm(true);
  };

  const [sendingTestAll, setSendingTestAll] = useState(false);

  const handleTestAll = async () => {
    setSendingTestAll(true);
    try {
      const { data } = await api.post('/emergency/test-alert');
      addToast(data.success ? 'Test alert sent' : 'Some test alerts failed', data.success ? 'success' : 'warning');
    } catch { addToast('Test alert failed', 'error'); }
    finally { setSendingTestAll(false); }
  };

  const handleTest = async (id: string) => {
    try {
      const { data } = await api.post(`/emergency/contacts/${id}/test-alert`);
      addToast(data.result?.success ? 'Test alert sent' : 'Test alert failed', data.result?.success ? 'success' : 'error');
    } catch { addToast('Test failed', 'error'); }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const ordered = contacts.map(c => c.id);
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const { data } = await api.put('/emergency/contacts/reorder', { orderedIds: ordered });
    setContacts(data);
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-fraunces">Emergency Contacts</h2>
            <p className="text-slate-500 text-sm">Who to notify when SOS is triggered</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleTestAll} disabled={sendingTestAll}
              className="border border-slate-200 text-slate-600 text-sm px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
              {sendingTestAll ? 'Sending...' : 'Test All'}
            </button>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm px-4 py-2">
              Add Contact
            </button>
          </div>
        </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..." className="input-field pl-10 w-full" />
      </div>

      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">{editId ? 'Edit Contact' : 'New Contact'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name *" required className="input-field" />
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number *" required className="input-field" />
            <input type="text" value={form.relation} onChange={e => setForm({ ...form, relation: e.target.value })} placeholder="Relation (e.g. Spouse, Parent)" className="input-field" />
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Contact</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📞</div>
          <p className="text-slate-500 mb-3">No emergency contacts added yet</p>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm">Add Contact</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c, i) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => handleMove(i, 'up')} disabled={i === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => handleMove(i, 'down')} disabled={i >= filtered.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
                <button onClick={() => handleTest(c.id)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Test</button>
                <button onClick={() => handleEdit(c)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Edit</button>
                <button onClick={() => handleDelete(c.id)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActiveSosView = ({ event, onResolve, onCancel, whatsappUrl }: {
  event: EmergencyEvent; onResolve: () => void; onCancel: () => void; whatsappUrl?: string;
}) => {
  const liveLat = event.latitude;
  const liveLng = event.longitude;
  const mapsUrl = liveLat && liveLng ? `https://maps.google.com/?q=${liveLat},${liveLng}` : '';
  const elapsed = Math.floor((Date.now() - new Date(event.createdAt).getTime()) / 1000);
  const [seconds, setSeconds] = useState(elapsed);

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const notifCounts = useMemo(() => {
    const n = event.notifications || [];
    return {
      total: n.length,
      sent: n.filter(x => x.status === 'SENT').length,
      failed: n.filter(x => x.status === 'FAILED').length,
      pending: n.filter(x => x.status === 'PENDING').length,
    };
  }, [event.notifications]);

  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-6 text-white shadow-lg shadow-red-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
            <h1 className="text-2xl font-bold font-fraunces">Active SOS</h1>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold">{String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}</div>
            <div className="text-red-200 text-xs">elapsed</div>
          </div>
        </div>

        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 mb-4 transition-colors">
            <span className="text-lg">📍</span>
            <div>
              <p className="text-sm font-medium">Live Location</p>
              <p className="text-xs text-red-200">{liveLat?.toFixed(6)}, {liveLng?.toFixed(6)}</p>
            </div>
          </a>
        )}

        {event.locationName && (
          <p className="text-red-100 text-sm mb-3">Location: {event.locationName}</p>
        )}

        {event.description && (
          <p className="text-red-100 text-sm mb-3">Details: {event.description}</p>
        )}

        <div className="flex gap-4 mt-4">
          <div className="bg-white/10 rounded-xl px-4 py-3 flex-1 text-center">
            <div className="text-lg font-bold">{notifCounts.sent}</div>
            <div className="text-xs text-red-200">Sent</div>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 flex-1 text-center">
            <div className="text-lg font-bold">{notifCounts.failed}</div>
            <div className="text-xs text-red-200">Failed</div>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 flex-1 text-center">
            <div className="text-lg font-bold">{notifCounts.pending}</div>
            <div className="text-xs text-red-200">Pending</div>
          </div>
        </div>

        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 mt-4 transition-colors">
            <span>💬</span>
            <span className="font-medium">Open WhatsApp</span>
          </a>
        )}
        <a href="tel:108" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 rounded-xl px-4 py-3 mt-2 transition-colors">
          <span>📞</span>
          <span className="font-medium">Call 108 (Ambulance)</span>
        </a>

        <div className="flex gap-3 mt-6">
          <button onClick={onResolve} className="bg-white text-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-all flex-1">
            Resolve
          </button>
          <button onClick={onCancel} className="bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-all flex-1">
            Cancel SOS
          </button>
        </div>
      </div>

      {event.notifications && event.notifications.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Notifications Timeline</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {event.notifications.map((n) => (
              <div key={n.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    n.status === 'SENT' ? 'bg-emerald-100 text-emerald-600' :
                    n.status === 'FAILED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {n.method === 'SMS' ? '💬' : '📞'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{n.contact?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{n.method} • {n.contact?.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    n.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                    n.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>{n.status}</span>
                  {n.sentAt && <p className="text-xs text-slate-400 mt-1">{new Date(n.sentAt).toLocaleTimeString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [activeEvents, setActiveEvents] = useState<EmergencyEvent[]>([]);
  const [allEvents, setAllEvents] = useState<EmergencyEvent[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, cancelled: 0 });
  const [selectedEvent, setSelectedEvent] = useState<EmergencyEvent | null>(null);
  const [tab, setTab] = useState<'active' | 'history' | 'stats'>('active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchActive = useCallback(async () => {
    try { const { data } = await api.get('/emergency/admin/active'); setActiveEvents(Array.isArray(data) ? data : []); } catch { setActiveEvents([]); }
  }, []);

  const fetchAll = useCallback(async (p: number, s?: string) => {
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (s) params.set('status', s);
      const { data } = await api.get(`/emergency/admin/events?${params}`);
      setAllEvents(data.events || []);
      setTotalPages(data.totalPages || 1);
    } catch { setAllEvents([]); }
  }, []);

  const fetchStats = useCallback(async () => {
    try { const { data } = await api.get('/emergency/admin/stats'); setStats(data); } catch {}
  }, []);

  useEffect(() => { fetchActive(); fetchAll(1); fetchStats(); const i = setInterval(fetchActive, 5000); return () => clearInterval(i); }, [fetchActive, fetchAll, fetchStats]);
  useEffect(() => { if (tab === 'history') fetchAll(page, statusFilter); }, [page, statusFilter, tab, fetchAll]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 font-fraunces">Emergency Management</h2>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 font-semibold text-sm">{activeEvents.length} Active</span>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['active', 'history', 'stats'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'stats') fetchStats(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t === 'active' ? 'Active' : t === 'history' ? 'History' : 'Statistics'}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Active Emergencies</h3>
            {activeEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No active emergencies</div>
            ) : (
              <div className="space-y-3">
                {activeEvents.map(ev => (
                  <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedEvent?.id === ev.id ? 'border-sky-300 bg-sky-50' : 'border-slate-200 hover:border-sky-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-800 font-medium">{ev.user?.name || 'Unknown'}</span>
                      <span className="text-xs text-slate-400">{new Date(ev.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600">{ev.description || 'No description'}</p>
                    {ev.latitude && ev.longitude && (
                      <a href={`https://maps.google.com/?q=${ev.latitude},${ev.longitude}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-sky-600 hover:text-sky-700 mt-1 inline-block">View on map</a>
                    )}
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Active</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{ev.contactMethod}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Event Details</h3>
            {selectedEvent ? (
              <div className="space-y-3 text-sm">
                <div><span className="text-slate-500">User:</span> <span className="text-slate-800 font-medium">{selectedEvent.user?.name}</span></div>
                <div><span className="text-slate-500">Phone:</span> <span className="text-slate-800">{selectedEvent.user?.phone || 'N/A'}</span></div>
                <div><span className="text-slate-500">Status:</span> <span className="text-red-600 font-medium">{selectedEvent.status}</span></div>
                <div><span className="text-slate-500">Description:</span> <span className="text-slate-800">{selectedEvent.description || 'N/A'}</span></div>
                <div><span className="text-slate-500">Location:</span> <span className="text-slate-800">{selectedEvent.locationName || `${selectedEvent.latitude},${selectedEvent.longitude}` || 'N/A'}</span></div>
                <div><span className="text-slate-500">Created:</span> <span className="text-slate-800">{new Date(selectedEvent.createdAt).toLocaleString()}</span></div>
                {selectedEvent.notifications && selectedEvent.notifications.length > 0 && (
                  <div>
                    <span className="text-slate-500">Notifications:</span>
                    <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                      {selectedEvent.notifications.map(n => (
                        <div key={n.id} className="text-xs text-slate-600 flex justify-between bg-slate-50 p-2 rounded">
                          <span>{n.method} → {n.contact?.name || 'Unknown'}</span>
                          <span className={n.status === 'SENT' ? 'text-emerald-600' : n.status === 'FAILED' ? 'text-red-600' : 'text-amber-600'}>{n.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">Select an event</div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Event History</h3>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white">
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          {allEvents.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No events</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left py-3 px-2">User</th><th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Description</th><th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Resolved</th>
                </tr></thead>
                <tbody>
                  {allEvents.map(ev => (
                    <tr key={ev.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 text-slate-800">{ev.user?.name || 'Unknown'}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          ev.status === 'ACTIVE' ? 'bg-red-100 text-red-700' :
                          ev.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>{ev.status}</span>
                      </td>
                      <td className="py-3 px-2 text-slate-600 max-w-xs truncate">{ev.description || '-'}</td>
                      <td className="py-3 px-2 text-slate-600">{new Date(ev.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-2 text-slate-600">{ev.resolvedAt ? new Date(ev.resolvedAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm disabled:opacity-50">Previous</button>
              <span className="px-3 py-1.5 text-slate-500 text-sm">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: stats.total, color: 'text-slate-800' },
            { label: 'Active', value: stats.active, color: 'text-red-600' },
            { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600' },
            { label: 'Cancelled', value: stats.cancelled, color: 'text-amber-600' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-sm">
              <div className={`text-3xl font-bold font-fraunces ${s.color}`}>{s.value}</div>
              <p className="text-slate-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function EmergencyHelp() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { position, error: gpsError, watching, accuracyMet, startWatching, stopWatching, requestSingle } = useEmergencyLocation();

  const [view, setView] = useState<ViewMode>('main');
  const [activeEvent, setActiveEvent] = useState<EmergencyEvent | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [searchRadius, setSearchRadius] = useState(5);
  const [searchingHospitals, setSearchingHospitals] = useState(false);
  const [sosDescription, setSosDescription] = useState('');
  const [sosSymptoms, setSosSymptoms] = useState('');
  const [sosContactMethod, setSosContactMethod] = useState('SMS');
  const [activating, setActivating] = useState(false);
  const [gpsStarted, setGpsStarted] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState(getStoredQueue());
  const [historyEvents, setHistoryEvents] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const checkActiveEvent = useCallback(async () => {
    try {
      const { data } = await api.get('/emergency/sos/active');
      if (data) { setActiveEvent(data); setView('active-sos'); }
    } catch {}
  }, []);

  useEffect(() => { checkActiveEvent(); }, [checkActiveEvent]);

  useEffect(() => {
    if (view === 'active-sos' && activeEvent) {
      pollRef.current = setInterval(async () => {
        try {
          const { data } = await api.get(`/emergency/sos/${activeEvent.id}`);
          setActiveEvent(data);
        } catch {}
      }, 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [view, activeEvent?.id]);

  const startGps = useCallback(() => {
    startWatching();
    setGpsStarted(true);
  }, [startWatching]);

  const searchForHospitals = useCallback(async (lat: number, lng: number, radius: number) => {
    setSearchingHospitals(true);
    try {
      const { data } = await api.get(`/emergency/hospitals/search?lat=${lat}&lng=${lng}&radius=${radius}`);
      setHospitals(data || []);
    } catch {
      addToast('Failed to search hospitals', 'error');
    } finally {
      setSearchingHospitals(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (position && accuracyMet && gpsStarted) {
      searchForHospitals(position.latitude, position.longitude, searchRadius);
    }
  }, [position, accuracyMet, gpsStarted, searchRadius, searchForHospitals]);

  const processQueue = useCallback(async () => {
    const queue = getStoredQueue();
    if (queue.length === 0) return;
    for (const item of queue) {
      try {
        const { data } = await api.post('/emergency/sos', item);
        if (data.event) {
          setActiveEvent(data.event);
          setView('active-sos');
          addToast('Queued SOS sent successfully!', 'success');
        }
      } catch (err: any) {
        if (err?.response?.status !== 0 && err?.response?.status !== undefined) {
          addToast('Failed to send queued SOS', 'error');
        }
        return;
      }
    }
    setStoredQueue([]);
    setOfflineQueue([]);
  }, [addToast]);

  useEffect(() => {
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, [processQueue]);

  useEffect(() => {
    if (navigator.onLine && offlineQueue.length > 0) {
      processQueue();
    }
  }, []);

  const handleSos = useCallback(async () => {
    if (!position) {
      const single = await requestSingle();
      if (!single) { addToast('GPS location required for SOS. Please enable location.', 'error'); return; }
    }
    setActivating(true);
    try {
      const lat = position!.latitude;
      const lng = position!.longitude;

      if (!navigator.onLine) {
        const queue = getStoredQueue();
        queue.push({ latitude: lat, longitude: lng, description: sosDescription });
        setStoredQueue(queue);
        setOfflineQueue(queue);
        addToast('You are offline. SOS queued and will be sent when connection returns.', 'warning');
        return;
      }

      const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
      const userName = user?.name || 'Someone';

      const { data: contacts } = await api.get('/emergency/contacts');
      const sorted: EmergencyContact[] = (Array.isArray(contacts) ? contacts : [])
        .filter((c: any) => c.isActive !== false)
        .sort((a: any, b: any) => (a.priority || 99) - (b.priority || 99));

      const message = `🚨 VITANEXA EMERGENCY ALERT\n\nPatient Name: ${userName}\n\nI need immediate medical assistance.\n\nCurrent Location:\n${mapsUrl}\n\nPlease contact me immediately.\n\nGenerated automatically by VitaNexa AI.`;

      const encoded = encodeURIComponent(message);

      let waUrl = '';
      if (sorted.length > 0) {
        const top = sorted[0];
        const waNumber = top.phone.replace(/[^0-9]/g, '');
        waUrl = `https://wa.me/${waNumber}?text=${encoded}`;
      } else {
        waUrl = `https://web.whatsapp.com/?text=${encoded}`;
      }
      setWhatsappUrl(waUrl);

      const waWindow = window.open(waUrl, '_blank');
      if (!waWindow || waWindow.closed || typeof waWindow.closed === 'undefined') {
        addToast('If WhatsApp did not open, click "Open WhatsApp" below.', 'warning');
      }

      setTimeout(() => {
        window.open('tel:108', '_self');
      }, 500);

      const { data } = await api.post('/emergency/sos', {
        latitude: lat,
        longitude: lng,
        description: sosDescription || 'SOS via WhatsApp',
        contactMethod: 'SMS',
      });
      if (data.event) {
        setActiveEvent(data.event);
        setView('active-sos');
        addToast('Emergency alert sent successfully', 'success');
      }
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to trigger SOS. Try again.', 'error');
    } finally {
      setActivating(false);
    }
  }, [position, sosDescription, user, requestSingle, addToast]);

  const handleResolve = useCallback(async () => {
    if (!activeEvent) return;
    try {
      await api.post(`/emergency/sos/${activeEvent.id}/resolve`);
      setActiveEvent(null);
      setView('main');
      addToast('SOS resolved', 'success');
    } catch { addToast('Failed to resolve', 'error'); }
  }, [activeEvent, addToast]);

  const handleCancel = useCallback(async () => {
    if (!activeEvent) return;
    try {
      await api.post(`/emergency/sos/${activeEvent.id}/cancel`);
      setActiveEvent(null);
      setView('main');
      addToast('SOS cancelled', 'info');
    } catch { addToast('Failed to cancel', 'error'); }
  }, [activeEvent, addToast]);

  const loadHistory = useCallback(async (p: number) => {
    try {
      const { data } = await api.get(`/emergency/sos?page=${p}&limit=10`);
      setHistoryEvents(data.events || []);
      setHistoryTotal(data.totalPages || 0);
      setHistoryPage(p);
    } catch {}
  }, []);

  const radiusOptions = useMemo(() => [
    { value: 1, label: '1 km' },
    { value: 2, label: '2 km' },
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 20, label: '20 km' },
    { value: 50, label: 'Entire City' },
  ], []);

  const gpsAccuracyClass = useMemo(() => {
    if (!position) return '';
    if (position.accuracy <= 10) return 'text-emerald-600';
    if (position.accuracy <= 50) return 'text-amber-600';
    return 'text-red-600';
  }, [position]);

  const mainView = () => (
    <div className="space-y-6">
      {offlineQueue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-800 font-semibold">Offline Queue</p>
              <p className="text-amber-700 text-sm">{offlineQueue.length} SOS event{offlineQueue.length > 1 ? 's' : ''} waiting to be sent</p>
            </div>
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-slate-800 font-fraunces">Emergency Help</h1>
        <p className="text-slate-500 mt-1">Live GPS tracking, nearby hospitals, and instant SOS alerts</p>
      </div>

      {!gpsStarted ? (
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-2xl p-8 text-white shadow-lg text-center">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-2xl font-bold font-fraunces mb-2">Enable Live GPS</h2>
          <p className="text-sky-100 mb-6">We need your location to find nearby hospitals and send accurate SOS alerts</p>
          <button onClick={startGps} className="bg-white text-sky-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-sky-50 transition-all">
            Enable GPS Tracking
          </button>
          <button onClick={async () => {
            const loc = await requestSingle();
            if (loc) {
              setGpsStarted(true);
              searchForHospitals(loc.latitude, loc.longitude, searchRadius);
            }
          }} className="block mx-auto mt-3 text-sky-200 text-sm hover:text-white transition-colors">
            Or get one-time location
          </button>
        </div>
      ) : (
        <>
          {watching && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                <div>
                  <p className="text-slate-800 font-medium">GPS Active</p>
                  {position ? (
                    <p className={`text-sm ${gpsAccuracyClass}`}>
                      {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)} &middot; ±{Math.round(position.accuracy)}m
                      {position.accuracy <= 50 ? ' (Good)' : position.accuracy <= 100 ? ' (Fair)' : ' (Poor)'}
                    </p>
                  ) : (
                    <p className="text-amber-600 text-sm">Acquiring GPS signal...</p>
                  )}
                </div>
              </div>
              <button onClick={stopWatching} className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5">
                Stop GPS
              </button>
            </div>
          )}

          {gpsError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm font-medium">{gpsError}</p>
              <button onClick={startWatching} className="text-amber-700 text-xs underline mt-1">Retry GPS</button>
            </div>
          )}

          {position && gpsStarted && (
            <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-8 text-white shadow-lg shadow-red-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <h2 className="text-2xl font-bold font-fraunces mb-2">Send SOS Alert</h2>
                <p className="text-red-100 mb-6">Notify your emergency contacts instantly with your live location</p>
                <div className="space-y-4 max-w-lg">
                  <input type="text" value={sosDescription} onChange={e => setSosDescription(e.target.value)}
                    placeholder="Describe your emergency (optional)"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white/40" />
                  <input type="text" value={sosSymptoms} onChange={e => setSosSymptoms(e.target.value)}
                    placeholder="Symptoms (optional)"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white/40" />
                  <div className="flex gap-4 items-center">
                    <select value={sosContactMethod} onChange={e => setSosContactMethod(e.target.value)}
                      className="px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/40">
                      <option value="SMS" className="text-slate-800">SMS Only</option>
                      <option value="BOTH" className="text-slate-800">SMS + Voice Call</option>
                    </select>
                  </div>
                  <button onClick={handleSos} disabled={activating}
                    className="w-full sm:w-auto bg-white text-red-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                    {activating ? (
                      <span className="flex items-center gap-2"><span className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />Sending...</span>
                    ) : (
                      <span className="flex items-center gap-2"><span className="text-2xl">SOS</span> Call Ambulance Now</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {position && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Nearby Hospitals</h2>
                <div className="flex items-center gap-2">
                  <select value={searchRadius} onChange={e => {
                    setSearchRadius(Number(e.target.value));
                    if (position) searchForHospitals(position.latitude, position.longitude, Number(e.target.value));
                  }} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white">
                    {radiusOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  {searchingHospitals && <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />}
                </div>
              </div>
              {hospitals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500">{searchingHospitals ? 'Searching for nearby hospitals...' : 'No hospitals found in this area. Try expanding the search radius.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {hospitals.map((h, i) => <HospitalCard key={`${h.name}-${i}`} h={h} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => setView('contacts')} className="bg-white border border-slate-200 rounded-xl p-5 text-center hover:shadow-md transition-all">
          <div className="text-3xl mb-2">📞</div>
          <h3 className="text-slate-800 font-semibold">Emergency Contacts</h3>
          <p className="text-slate-500 text-sm mt-1">Manage who gets notified</p>
        </button>
        <button onClick={() => { setShowHistory(true); loadHistory(1); }} className="bg-white border border-slate-200 rounded-xl p-5 text-center hover:shadow-md transition-all">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="text-slate-800 font-semibold">History</h3>
          <p className="text-slate-500 text-sm mt-1">View past emergencies</p>
        </button>
        {isAdmin && (
          <button onClick={() => setView('admin')} className="bg-white border border-slate-200 rounded-xl p-5 text-center hover:shadow-md transition-all">
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="text-slate-800 font-semibold">Admin Dashboard</h3>
            <p className="text-slate-500 text-sm mt-1">Manage emergencies</p>
          </button>
        )}
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-20" onClick={() => setShowHistory(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-3/4 overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 font-fraunces">Emergency History</h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              {historyEvents.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No emergency events found</p>
              ) : (
                <div className="space-y-3">
                  {historyEvents.map((ev: any) => (
                    <div key={ev.id} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          ev.status === 'ACTIVE' ? 'bg-red-100 text-red-700' :
                          ev.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>{ev.status}</span>
                        <span className="text-xs text-slate-400">{new Date(ev.createdAt).toLocaleString()}</span>
                      </div>
                      {ev.description && <p className="text-sm text-slate-600 mt-2">{ev.description}</p>}
                      {ev.locationName && <p className="text-xs text-slate-400 mt-1">📍 {ev.locationName}</p>}
                      {ev.resolvedAt && <p className="text-xs text-slate-400 mt-1">Resolved: {new Date(ev.resolvedAt).toLocaleString()}</p>}
                      {ev.cancelledAt && <p className="text-xs text-slate-400 mt-1">Cancelled: {new Date(ev.cancelledAt).toLocaleString()}</p>}
                    </div>
                  ))}
                </div>
              )}
              {historyTotal > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <button onClick={() => loadHistory(Math.max(1, historyPage - 1))} disabled={historyPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm disabled:opacity-50">Previous</button>
                  <span className="px-3 py-1.5 text-slate-500 text-sm">Page {historyPage} of {historyTotal}</span>
                  <button onClick={() => loadHistory(Math.min(historyTotal, historyPage + 1))} disabled={historyPage === historyTotal}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (view === 'active-sos' && activeEvent) {
    return <ActiveSosView event={activeEvent} onResolve={handleResolve} onCancel={handleCancel} whatsappUrl={whatsappUrl} />;
  }

  if (view === 'contacts') {
    return (
      <div className="space-y-4">
        <button onClick={() => setView('main')} className="text-sky-600 hover:text-sky-700 text-sm font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Emergency
        </button>
        <EmergencyContacts />
      </div>
    );
  }

  if (view === 'admin' && isAdmin) {
    return (
      <div className="space-y-4">
        <button onClick={() => setView('main')} className="text-sky-600 hover:text-sky-700 text-sm font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Emergency
        </button>
        <AdminDashboard />
      </div>
    );
  }

  return mainView();
}
