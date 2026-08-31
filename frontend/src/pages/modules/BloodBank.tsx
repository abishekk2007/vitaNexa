import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonModule } from '../../components/ui/Skeleton';
import api from '../../api/client';
import type { BloodDonor, BloodRequest } from '../../types';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const COMPATIBILITY: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

export default function BloodBank() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'donate' | 'request' | 'requests'>('donate');
  const [donorForm, setDonorForm] = useState({ bloodGroup: 'O+', phone: user?.phone || '', location: '', lastDonationDate: '' });
  const [requestForm, setRequestForm] = useState({ bloodGroupNeeded: 'O+', hospital: '', urgency: 'MEDIUM', requesterName: user?.name || '', requesterPhone: user?.phone || '' });

  useEffect(() => {
    Promise.all([
      api.get('/blood/donors'),
      api.get('/blood/requests'),
    ]).then(([d, r]) => {
      setDonors(d.data?.data ?? d.data ?? []);
      setRequests(r.data?.data ?? r.data ?? []);
    }).catch(() => addToast('Failed to load blood bank data', 'error'))
    .finally(() => setLoading(false));
  }, []);

  const registerDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/blood/donors', donorForm);
      setDonors([data, ...donors]);
      setDonorForm({ ...donorForm, lastDonationDate: '' });
      addToast('Registered as donor!', 'success');
    } catch (e: any) {
      addToast(e.response?.data?.error || 'Registration failed', 'error');
    }
  };

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/blood/requests', requestForm);
      setRequests([data, ...requests]);
      setRequestForm({ bloodGroupNeeded: 'O+', hospital: '', urgency: 'MEDIUM', requesterName: user?.name || '', requesterPhone: user?.phone || '' });
      addToast('Blood request created', 'success');
    } catch (e: any) {
      addToast(e.response?.data?.error || 'Failed to create request', 'error');
    }
  };

  const urgencyBadge = (u: string) => {
    if (u === 'EMERGENCY') return 'badge-error';
    if (u === 'HIGH') return 'badge-warning';
    return 'badge-info';
  };

  if (loading) return <SkeletonModule />;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-fluid-2xl sm:text-3xl font-bold text-slate-800 font-fraunces">Blood Bank Donor Matching</h1>
        <p className="text-fluid-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Find donors and manage blood requests</p>
      </div>

      <div className="flex gap-1.5 sm:gap-2 flex-wrap">
        {(['donate', 'request', 'requests'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`r-touch px-4 sm:px-5 py-2 rounded-xl text-fluid-sm font-medium transition-all ${tab === t ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
            {t === 'donate' ? 'Register Donor' : t === 'request' ? 'Request Blood' : 'All Requests'}
          </button>
        ))}
      </div>

      {tab === 'donate' && (
        <div className="r-card transition-all hover:shadow-lg hover:border-sky-200">
          <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Register as Blood Donor</h2>
          <form onSubmit={registerDonor} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Blood Group</label>
              <select value={donorForm.bloodGroup} onChange={(e) => setDonorForm({ ...donorForm, bloodGroup: e.target.value })} className="input-field">
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Phone</label>
              <input type="tel" value={donorForm.phone} onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Location (City/Area)</label>
              <input type="text" value={donorForm.location} onChange={(e) => setDonorForm({ ...donorForm, location: e.target.value })} placeholder="e.g., New Delhi" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Last Donation Date</label>
              <input type="date" value={donorForm.lastDonationDate} onChange={(e) => setDonorForm({ ...donorForm, lastDonationDate: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary bg-gradient-to-r from-red-600 to-red-500">Register as Donor</button>
            </div>
          </form>

          <div className="mt-4 sm:mt-6">
            <h3 className="text-fluid-sm font-semibold text-slate-700 mb-2 sm:mb-3">Blood Group Compatibility</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <div key={bg} className="bg-white border border-slate-200 rounded-xl p-2 sm:p-3 text-center shadow-sm">
                  <div className="text-slate-800 font-bold text-fluid-base sm:text-lg">{bg}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Can donate to:</div>
                  <div className="text-[10px] text-emerald-600 leading-tight">{COMPATIBILITY[bg].join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'request' && (
        <div className="r-card transition-all hover:shadow-lg hover:border-sky-200">
          <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Blood Request Form</h2>
          <form onSubmit={createRequest} className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Blood Group Needed</label>
              <select value={requestForm.bloodGroupNeeded} onChange={(e) => setRequestForm({ ...requestForm, bloodGroupNeeded: e.target.value })} className="input-field">
                {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
              </select>
              <div className="text-xs text-slate-400 mt-1">
                Compatible donors: {COMPATIBILITY[requestForm.bloodGroupNeeded]?.join(', ') || 'N/A'}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Urgency</label>
              <select value={requestForm.urgency} onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })} className="input-field">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Hospital</label>
              <input type="text" value={requestForm.hospital} onChange={(e) => setRequestForm({ ...requestForm, hospital: e.target.value })} required placeholder="Hospital name & location" className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Requester Name</label>
              <input type="text" value={requestForm.requesterName} onChange={(e) => setRequestForm({ ...requestForm, requesterName: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Requester Phone</label>
              <input type="tel" value={requestForm.requesterPhone} onChange={(e) => setRequestForm({ ...requestForm, requesterPhone: e.target.value })} required className="input-field" />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary bg-gradient-to-r from-red-600 to-red-500">Submit Request</button>
            </div>
          </form>
        </div>
      )}

      {tab === 'requests' && (
        <div className="r-card transition-all hover:shadow-lg hover:border-sky-200">
          <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4">Blood Requests</h2>
          {requests.length === 0 ? (
            <p className="text-slate-500 text-center py-6 sm:py-8 text-fluid-sm">No blood requests yet. Create one to find donors.</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 animate-slide-up">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="text-slate-800 font-bold text-fluid-base sm:text-lg">{r.bloodGroupNeeded}</span>
                      <span className={urgencyBadge(r.urgency)}>{r.urgency}</span>
                      <span className={`badge ${r.status === 'FULFILLED' ? 'badge-success' : 'badge-warning'}`}>{r.status}</span>
                    </div>
                  </div>
                  <p className="text-fluid-sm text-slate-700">{r.hospital}</p>
                  <p className="text-fluid-xs text-slate-400 mt-1">
                    Requested by {r.requesterName} • {r.requesterPhone} • {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                  {r.status !== 'FULFILLED' && (
                    <div className="mt-2 sm:mt-3">
                      <p className="text-fluid-xs text-slate-500 mb-1 sm:mb-2">Compatible donors available: {COMPATIBILITY[r.bloodGroupNeeded]?.length || 0} groups</p>
                      <a href={`tel:${r.requesterPhone}`} className="btn-primary text-fluid-sm px-4 py-2 inline-block">Contact Requester</a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
