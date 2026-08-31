import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';

interface BloodRequest {
  id: string;
  bloodGroupNeeded: string;
  hospital: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
  status: 'PENDING' | 'FULFILLED' | 'CANCELLED';
  requesterName: string;
  requesterPhone: string;
  createdAt: string;
}

interface BloodDonor {
  id: string;
  name: string;
  bloodGroup: string;
  phone: string;
  isAvailable: boolean;
  lastDonationDate: string | null;
}

export default function AdminBlood() {
  const { addToast } = useToast();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [tab, setTab] = useState<'requests' | 'donors'>('requests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, donRes] = await Promise.all([
        api.get('/admin/blood-requests'),
        api.get('/admin/blood-requests/donors'),
      ]);
      setRequests(reqRes.data.data ?? []);
      setDonors(donRes.data.data ?? []);
    } catch {
      setError('Failed to load blood data');
      addToast('Failed to load blood data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const updateStatus = async (id: string, status: 'FULFILLED' | 'CANCELLED') => {
    setUpdating(id);
    try {
      await api.patch(`/admin/blood-requests/${id}`, { status });
      addToast(`Request ${status.toLowerCase()}`, 'success');
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to update request', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const urgencyBadge = (u: string) => {
    switch (u) {
      case 'EMERGENCY': return 'badge-error';
      case 'HIGH': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'FULFILLED': return 'badge-success';
      case 'CANCELLED': return 'badge-error';
      default: return 'badge-warning';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text font-fraunces mb-2">Blood Management</h1>
        <p className="text-gray-400">Manage blood requests and view donors</p>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setTab('requests')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            tab === 'requests'
              ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/20'
              : 'glass text-gray-300 hover:bg-white/10'
          }`}
        >
          Requests ({requests.length})
        </button>
        <button
          onClick={() => setTab('donors')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            tab === 'donors'
              ? 'bg-gradient-to-r from-red-600 to-rose-500 text-white shadow-lg shadow-red-500/20'
              : 'glass text-gray-300 hover:bg-white/10'
          }`}
        >
          Donors ({donors.length})
        </button>
      </div>

      <div className="glass rounded-2xl p-6">
        {loading ? (
          <SkeletonTable rows={6} />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={loadData} className="btn-primary">Retry</button>
          </div>
        ) : tab === 'requests' ? (
          requests.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-3 block">🩸</span>
              <p className="text-gray-400">No blood requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left p-3 font-medium">Blood Group</th>
                    <th className="text-left p-3 font-medium">Hospital</th>
                    <th className="text-left p-3 font-medium">Urgency</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Requester</th>
                    <th className="text-left p-3 font-medium">Phone</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-white">{r.bloodGroupNeeded}</td>
                      <td className="p-3 text-gray-400">{r.hospital}</td>
                      <td className="p-3"><span className={urgencyBadge(r.urgency)}>{r.urgency}</span></td>
                      <td className="p-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                      <td className="p-3 text-gray-400">{r.requesterName}</td>
                      <td className="p-3 text-xs text-gray-500">{r.requesterPhone}</td>
                      <td className="p-3">
                        {r.status === 'PENDING' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(r.id, 'FULFILLED')}
                              disabled={updating === r.id}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                            >
                              {updating === r.id ? '...' : 'Fulfill'}
                            </button>
                            <button
                              onClick={() => updateStatus(r.id, 'CANCELLED')}
                              disabled={updating === r.id}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
                            >
                              {updating === r.id ? '...' : 'Cancel'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Done</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : donors.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">🩸</span>
            <p className="text-gray-400">No blood donors registered</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Blood Group</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Available</th>
                  <th className="text-left p-3 font-medium">Last Donation</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((d) => (
                  <tr key={d.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-medium text-white">{d.name}</td>
                    <td className="p-3">
                      <span className="px-3 py-1 rounded-xl bg-red-500/20 text-red-400 text-xs font-bold">
                        {d.bloodGroup}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">{d.phone}</td>
                    <td className="p-3">
                      <span className={`badge ${d.isAvailable ? 'badge-success' : 'badge-error'}`}>
                        {d.isAvailable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString() : 'Never'}
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
