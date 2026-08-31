import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import type { EmergencyEvent } from '../../types';

export default function AdminEmergency() {
  const [activeEvents, setActiveEvents] = useState<EmergencyEvent[]>([]);
  const [allEvents, setAllEvents] = useState<EmergencyEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EmergencyEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history' | 'analytics'>('active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchActive = useCallback(async () => {
    try {
      const { data } = await api.get('/emergency/admin/active');
      setActiveEvents(Array.isArray(data) ? data : []);
    } catch { setActiveEvents([]); }
  }, []);

  const fetchAll = useCallback(async (p: number, status?: string) => {
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (status) params.set('status', status);
      const { data } = await api.get(`/emergency/admin/events?${params}`);
      setAllEvents(data.events || []);
      setTotalPages(data.totalPages || 1);
    } catch { setAllEvents([]); }
  }, []);

  useEffect(() => { fetchActive(); fetchAll(1); }, [fetchActive, fetchAll]);

  useEffect(() => {
    const interval = setInterval(fetchActive, 10000);
    return () => clearInterval(interval);
  }, [fetchActive]);

  const handleTabChange = (t: typeof tab) => {
    setTab(t);
    if (t === 'active') fetchActive();
    if (t === 'history') fetchAll(page, statusFilter);
  };

  useEffect(() => { if (tab === 'history') fetchAll(page, statusFilter); }, [page, statusFilter, tab, fetchAll]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-fraunces gradient-text">Emergency Management</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor and manage active emergencies across the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-400 text-sm font-medium">{activeEvents.length} Active</span>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-2">
        {(['active', 'history', 'analytics'] as const).map(t => (
          <button key={t} onClick={() => handleTabChange(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-gray-200'
            }`}>
            {t === 'active' ? 'Active Emergencies' : t === 'history' ? 'Event History' : 'Analytics'}
          </button>
        ))}
      </div>

      {tab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-900/50 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">Active Emergencies</h2>
            {activeEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-gray-400">No active emergencies</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEvents.map(ev => (
                  <div key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedEvent?.id === ev.id
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-gray-800/50 border-white/5 hover:border-white/20'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                        <span className="text-gray-200 font-medium">{ev.user?.name || 'Unknown'}</span>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(ev.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-400">{ev.description || 'No description'}</p>
                    {ev.locationName && <p className="text-xs text-gray-500 mt-1">📍 {ev.locationName}</p>}
                    {ev.latitude && ev.longitude && (
                      <a href={`https://maps.google.com/?q=${ev.latitude},${ev.longitude}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 inline-block">
                        View on map
                      </a>
                    )}
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Active</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">{ev.contactMethod}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">Event Details</h2>
            {selectedEvent ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">User</p>
                  <p className="text-gray-200">{selectedEvent.user?.name}</p>
                  <p className="text-sm text-gray-400">{selectedEvent.user?.phone || selectedEvent.user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <span className="text-sm px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{selectedEvent.status}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Description</p>
                  <p className="text-sm text-gray-300">{selectedEvent.description || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Symptoms</p>
                  <p className="text-sm text-gray-300">{selectedEvent.symptoms || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Location</p>
                  <p className="text-sm text-gray-300">{selectedEvent.locationName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Created</p>
                  <p className="text-sm text-gray-300">{new Date(selectedEvent.createdAt).toLocaleString()}</p>
                </div>
                {selectedEvent.notifications && selectedEvent.notifications.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-2">Notifications ({selectedEvent.notifications.length})</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedEvent.notifications.map(n => (
                        <div key={n.id} className="text-xs text-gray-400 flex justify-between">
                          <span>{n.method} • {n.status}</span>
                          <span>{n.sentAt ? new Date(n.sentAt).toLocaleTimeString() : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Select an event to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">Event History</h2>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-gray-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-gray-300">
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          {allEvents.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No events found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left py-3 px-2">User</th>
                    <th className="text-left py-3 px-2">Status</th>
                    <th className="text-left py-3 px-2">Description</th>
                    <th className="text-left py-3 px-2">Location</th>
                    <th className="text-left py-3 px-2">Created</th>
                    <th className="text-left py-3 px-2">Resolved</th>
                  </tr>
                </thead>
                <tbody>
                  {allEvents.map(ev => (
                    <tr key={ev.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-2 text-gray-200">{ev.user?.name || 'Unknown'}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          ev.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400' :
                          ev.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-gray-600/20 text-gray-400'
                        }`}>{ev.status}</span>
                      </td>
                      <td className="py-3 px-2 text-gray-400 max-w-xs truncate">{ev.description || '-'}</td>
                      <td className="py-3 px-2 text-gray-400">{ev.locationName || '-'}</td>
                      <td className="py-3 px-2 text-gray-400">{new Date(ev.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-2 text-gray-400">{ev.resolvedAt ? new Date(ev.resolvedAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm disabled:opacity-50">
                Previous
              </button>
              <span className="px-3 py-1.5 text-gray-400 text-sm">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-sm disabled:opacity-50">
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-3xl text-emerald-400 font-bold font-fraunces">{allEvents.length}</div>
            <p className="text-gray-400 text-sm mt-1">Total Events</p>
          </div>
          <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-3xl text-emerald-400 font-bold font-fraunces">{allEvents.filter(e => e.status === 'RESOLVED').length}</div>
            <p className="text-gray-400 text-sm mt-1">Resolved</p>
          </div>
          <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-3xl text-emerald-400 font-bold font-fraunces">{allEvents.filter(e => e.status === 'CANCELLED').length}</div>
            <p className="text-gray-400 text-sm mt-1">Cancelled</p>
          </div>
        </div>
      )}
    </div>
  );
}
