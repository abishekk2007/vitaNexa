import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

interface PainAssessment {
  id: string;
  userId: string;
  location: string | null;
  whenStarted: string | null;
  assessmentDate: string | null;
  painLevel: number | null;
  doctorConsulted: string | null;
  medication: string | null;
  painCategory: string | null;
  riskLevel: string | null;
  reportStatus: string;
  notes: string | null;
  conversation: string | null;
  reportFile: string | null;
  reportAnalysis: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string; phone?: string };
}

function ViewModal({ assessment, open, onClose }: { assessment: PainAssessment | null; open: boolean; onClose: () => void }) {
  if (!open || !assessment) return null;
  const conversation = assessment.conversation ? (() => { try { return JSON.parse(assessment.conversation); } catch { return null; } })() : null;
  const analysis = assessment.reportAnalysis ? (() => { try { return JSON.parse(assessment.reportAnalysis); } catch { return null; } })() : null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto border border-slate-200 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 font-fraunces">Assessment Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Patient</p>
              <p className="text-sm font-medium text-slate-800">{assessment.user?.name || 'Unknown'}</p>
              <p className="text-xs text-slate-500">{assessment.user?.email}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Pain Location</p>
              <p className="text-sm font-medium text-slate-800 truncate">{assessment.location || 'N/A'}</p>
              {assessment.painCategory && <p className="text-xs text-slate-500">{assessment.painCategory.replace(/_/g, ' ')}</p>}
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Pain Level</p>
              <p className="text-sm font-medium text-slate-800">{assessment.painLevel || 0}/10</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Risk Level</p>
              <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                assessment.riskLevel === 'High' ? 'bg-red-50 text-red-600 border border-red-200' :
                assessment.riskLevel === 'Moderate' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>{assessment.riskLevel || 'Not assessed'}</span>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Date</p>
              <p className="text-sm font-medium text-slate-800">{assessment.assessmentDate || new Date(assessment.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Status</p>
              <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium capitalize ${
                assessment.reportStatus === 'reviewed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                'bg-sky-50 text-sky-600 border border-sky-200'
              }`}>{assessment.reportStatus}</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-[10px] text-slate-400 font-mono uppercase mb-1.5">When Started</p>
            <p className="text-sm text-slate-700">{assessment.whenStarted || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Doctor Consulted</p>
              <p className="text-sm text-slate-700">{assessment.doctorConsulted || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase">Medication</p>
              <p className="text-sm text-slate-700">{assessment.medication || 'N/A'}</p>
            </div>
          </div>
          {assessment.notes && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase mb-1">Admin Notes</p>
              <p className="text-sm text-slate-700">{assessment.notes}</p>
            </div>
          )}
          {conversation && Array.isArray(conversation) && conversation.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-[10px] text-slate-400 font-mono uppercase mb-2">Conversation Summary</p>
              <div className="space-y-1 max-h-[160px] overflow-y-auto">
                {conversation.slice(-10).map((msg: any, i: number) => (
                  <p key={i} className={`text-xs ${msg.sender === 'assistant' ? 'text-slate-500' : 'text-sky-600 font-medium'}`}>
                    <span className="text-[10px] text-slate-400">{msg.sender === 'assistant' ? 'Bot: ' : 'User: '}</span>
                    {msg.text?.substring(0, 80)}{msg.text?.length > 80 ? '...' : ''}
                  </p>
                ))}
              </div>
            </div>
          )}
          {analysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-[10px] text-blue-500 font-mono uppercase mb-1.5">Uploaded Report Analysis</p>
              {analysis.diagnosis && <p className="text-xs text-slate-600">Diagnosis: <span className="font-medium text-slate-800">{analysis.diagnosis}</span></p>}
              {analysis.medication && <p className="text-xs text-slate-600">Medication: <span className="font-medium text-slate-800">{analysis.medication}</span></p>}
              {analysis.doctorName && <p className="text-xs text-slate-600">Doctor: <span className="font-medium text-slate-800">{analysis.doctorName}</span></p>}
              {analysis.hospital && <p className="text-xs text-slate-600">Hospital: <span className="font-medium text-slate-800">{analysis.hospital}</span></p>}
            </div>
          )}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:from-sky-400 hover:to-emerald-400 transition-all shadow-sm">Close</button>
      </div>
    </div>
  );
}

function EditModal({ assessment, open, onClose, onSaved }: { assessment: PainAssessment | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const { addToast } = useToast();
  const [painLevel, setPainLevel] = useState('');
  const [doctorConsulted, setDoctorConsulted] = useState('');
  const [medication, setMedication] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [reportStatus, setReportStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (assessment) {
      setPainLevel(String(assessment.painLevel || ''));
      setDoctorConsulted(assessment.doctorConsulted || '');
      setMedication(assessment.medication || '');
      setRiskLevel(assessment.riskLevel || '');
      setReportStatus(assessment.reportStatus || 'pending');
      setNotes(assessment.notes || '');
    }
  }, [assessment]);

  const handleSave = async () => {
    if (!assessment) return;
    setSaving(true);
    try {
      await api.put(`/admin/pain/${assessment.id}`, { painLevel: parseInt(painLevel) || 0, doctorConsulted, medication, riskLevel, reportStatus, notes });
      addToast('Assessment updated successfully', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to update', 'error');
    } finally { setSaving(false); }
  };

  if (!open || !assessment) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-200 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-900 font-fraunces mb-4">Edit Assessment</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Pain Level (1-10)</label>
            <input value={painLevel} onChange={e => setPainLevel(e.target.value)} type="number" min="1" max="10" className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Doctor Consulted</label>
            <input value={doctorConsulted} onChange={e => setDoctorConsulted(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500" placeholder="Yes / No / Dr. Name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Medication</label>
            <input value={medication} onChange={e => setMedication(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Risk Level</label>
            <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500">
              <option value="">Not assessed</option>
              <option value="Low">Low Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Report Status</label>
            <select value={reportStatus} onChange={e => setReportStatus(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500">
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Admin Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:from-sky-400 hover:to-emerald-400 transition-all shadow-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPainManagement() {
  const { addToast } = useToast();
  const [assessments, setAssessments] = useState<PainAssessment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [viewAssessment, setViewAssessment] = useState<PainAssessment | null>(null);
  const [editAssessment, setEditAssessment] = useState<PainAssessment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, highRisk: 0, moderateRisk: 0, lowRisk: 0, pending: 0 });

  const limit = 20;

  const loadAssessments = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (riskFilter) params.set('riskLevel', riskFilter);
      const { data } = await api.get(`/admin/pain?${params}`);
      setAssessments(Array.isArray(data?.data) ? data.data : []);
      setTotal(data?.pagination?.total || 0);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to load assessments';
      setError(msg);
      addToast(msg, 'error');
    } finally { setLoading(false); }
  };

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/pain/stats');
      setStats(data);
    } catch {}
  };

  useEffect(() => { loadAssessments(); }, [page, search, statusFilter, riskFilter]);
  useEffect(() => { loadStats(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/pain/${id}`);
      setAssessments(prev => prev.filter(a => a.id !== id));
      setTotal(prev => prev - 1);
      addToast('Assessment deleted', 'success');
      loadStats();
    } catch (err: any) {
      addToast(err?.response?.data?.error || 'Failed to delete', 'error');
    } finally { setConfirmDelete(null); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 font-fraunces mb-2">Pain Assessment Management</h1>
        <p className="text-slate-500">View, edit, and manage all patient pain assessment records</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3"><p className="text-xs text-slate-400 font-mono">Total</p><p className="text-xl font-bold text-slate-900">{stats.total}</p></div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3"><p className="text-xs text-slate-400 font-mono">High Risk</p><p className="text-xl font-bold text-red-500">{stats.highRisk}</p></div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3"><p className="text-xs text-slate-400 font-mono">Moderate</p><p className="text-xl font-bold text-amber-500">{stats.moderateRisk}</p></div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3"><p className="text-xs text-slate-400 font-mono">Low Risk</p><p className="text-xl font-bold text-emerald-500">{stats.lowRisk}</p></div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3"><p className="text-xs text-slate-400 font-mono">Pending</p><p className="text-xl font-bold text-sky-500">{stats.pending}</p></div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <div className="flex flex-wrap gap-3 mb-4 items-center">
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by location, medication, notes..." className="flex-1 min-w-[200px] bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="archived">Archived</option>
          </select>
          <select value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setPage(1); }} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50">
            <option value="">All Risk Levels</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => loadAssessments()} className="mt-2 text-xs font-medium text-red-600 hover:text-red-700 underline">Retry</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : assessments.length === 0 && !error ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">📋</span>
            <p className="text-slate-500">No pain assessments found</p>
            {(search || statusFilter || riskFilter) && (
              <button onClick={() => { setSearch(''); setStatusFilter(''); setRiskFilter(''); }} className="mt-4 text-sm text-sky-600 hover:text-sky-700 underline">Clear Filters</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200">
                  <th className="text-left p-3 font-medium">Patient</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Pain Level</th>
                  <th className="text-left p-3 font-medium">Risk</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-900">{a.user?.name || 'Unknown'}</td>
                    <td className="p-3 text-slate-500">{a.user?.email || '-'}</td>
                    <td className="p-3">
                      <span className="text-slate-700 truncate max-w-[120px] inline-block">{a.location || '-'}</span>
                      {a.painCategory && <p className="text-[10px] text-slate-400">{a.painCategory.replace(/_/g, ' ')}</p>}
                    </td>
                    <td className="p-3">{a.painLevel || 0}/10</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                        a.riskLevel === 'High' ? 'bg-red-50 text-red-600 border border-red-200' :
                        a.riskLevel === 'Moderate' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                        a.riskLevel === 'Low' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}>{a.riskLevel || '-'}</span>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{a.assessmentDate || new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium capitalize ${
                        a.reportStatus === 'reviewed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        a.reportStatus === 'archived' ? 'bg-slate-50 text-slate-500 border border-slate-200' :
                        'bg-sky-50 text-sky-600 border border-sky-200'
                      }`}>{a.reportStatus}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => setViewAssessment(a)} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 transition-all">View</button>
                        <button onClick={() => setEditAssessment(a)} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-all">Edit</button>
                        <button onClick={() => setConfirmDelete(a.id)} className="px-2.5 py-1 rounded-xl text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && assessments.length > 0 && (
          <div className="flex justify-between items-center mt-6 text-sm text-slate-500">
            <span>Total: {total} assessment{total !== 1 ? 's' : ''}</span>
            <div className="flex gap-2 items-center">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs disabled:opacity-30 hover:bg-slate-50 transition-all">Prev</button>
              <span className="px-3 text-xs text-slate-400">Page {page} of {totalPages || 1}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs disabled:opacity-30 hover:bg-slate-50 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      <ViewModal assessment={viewAssessment} open={!!viewAssessment} onClose={() => setViewAssessment(null)} />
      <EditModal assessment={editAssessment} open={!!editAssessment} onClose={() => setEditAssessment(null)} onSaved={() => { loadAssessments(); loadStats(); }} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 border border-slate-200 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 font-fraunces mb-2">Delete Assessment</h3>
            <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete this assessment? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
