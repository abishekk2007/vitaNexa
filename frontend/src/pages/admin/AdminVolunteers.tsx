import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';

interface Volunteer {
  id: string;
  name: string;
  phone: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
}

const FILTERS = ['', 'PENDING', 'VERIFIED', 'REJECTED'];

export default function AdminVolunteers() {
  const { addToast } = useToast();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadVolunteers = async (status: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/admin/volunteers${status ? `?status=${status}` : ''}`);
      setVolunteers(data.data ?? []);
    } catch {
      setError('Failed to load volunteers');
      addToast('Failed to load volunteers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVolunteers(filter); }, [filter]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/volunteers/${id}`, { status: action === 'approve' ? 'VERIFIED' : 'REJECTED' });
      addToast(`Volunteer ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
      setVolunteers((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: action === 'approve' ? 'VERIFIED' : 'REJECTED' } : v))
      );
    } catch (err: any) {
      addToast(err.response?.data?.error || `Failed to ${action} volunteer`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'badge-success';
      case 'REJECTED': return 'badge-error';
      default: return 'badge-warning';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text font-fraunces mb-2">Volunteer Drivers</h1>
        <p className="text-gray-400">Manage volunteer driver registrations</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                filter === s
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'glass text-gray-300 hover:bg-white/10'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonTable rows={6} />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => loadVolunteers(filter)} className="btn-primary">Retry</button>
          </div>
        ) : volunteers.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">🚗</span>
            <p className="text-gray-400">No volunteer{filter ? ` with status "${filter}"` : ''} found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Registered</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((v) => (
                  <tr key={v.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium text-white">{v.name}</td>
                    <td className="p-3 text-gray-400">{v.phone}</td>
                    <td className="p-3">
                      <span className={statusBadge(v.status)}>{v.status}</span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      {v.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(v.id, 'approve')}
                            disabled={actionLoading === v.id}
                            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                          >
                            {actionLoading === v.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleAction(v.id, 'reject')}
                            disabled={actionLoading === v.id}
                            className="px-4 py-1.5 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
                          >
                            {actionLoading === v.id ? '...' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 italic">
                          {v.status === 'VERIFIED' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </td>
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
