import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';

interface MicrobiomeReport {
  id: string;
  filename: string;
  type: string;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  createdAt: string;
}

interface AnalyticsData {
  mostCommonBacteria: { name: string; count: number }[];
  mostRecommendedFoods: { name: string; count: number }[];
  deficiencyStats: { nutrient: string; count: number }[];
}

export default function AdminMicrobiomeReports() {
  const { addToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'reports' | 'analytics'>('reports');
  const [reports, setReports] = useState<MicrobiomeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/microbiome/reports');
      setReports(data.data ?? data ?? []);
    } catch {
      setError('Failed to load reports');
      addToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const { data } = await api.get('/microbiome/analytics');
      setAnalytics(data.data ?? data);
    } catch {
      addToast('Failed to load analytics', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'reports') loadReports();
    else loadAnalytics();
  }, [tab]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/microbiome/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Report uploaded successfully', 'success');
      loadReports();
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to upload report', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    setDeleting(id);
    try {
      await api.delete(`/microbiome/reports/${id}`);
      addToast('Report deleted successfully', 'success');
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to delete report', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'PROCESSED': return 'badge-success';
      case 'FAILED': return 'badge-error';
      default: return 'badge-warning';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text font-fraunces mb-2">Microbiome Reports</h1>
        <p className="text-gray-400">Manage uploaded microbiome reports and view analytics</p>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setTab('reports')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            tab === 'reports'
              ? 'bg-gradient-to-r from-emerald-600 to-cyan-500 text-white shadow-lg shadow-emerald-500/20'
              : 'glass text-gray-300 hover:bg-white/10'
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => setTab('analytics')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
            tab === 'analytics'
              ? 'bg-gradient-to-r from-emerald-600 to-cyan-500 text-white shadow-lg shadow-emerald-500/20'
              : 'glass text-gray-300 hover:bg-white/10'
          }`}
        >
          Analytics
        </button>
      </div>

      {tab === 'reports' ? (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
            <div>
              <input ref={fileRef} type="file" accept=".pdf,.csv,.xlsx" onChange={handleUpload} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-primary text-sm"
              >
                {uploading ? 'Uploading...' : '+ Upload Report'}
              </button>
            </div>
          </div>

          {loading ? (
            <SkeletonTable rows={6} />
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={loadReports} className="btn-primary">Retry</button>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="text-left p-3 font-medium">Filename</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Date</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 text-gray-300 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-medium text-white">{r.filename}</td>
                      <td className="p-3 text-gray-400">{r.type || 'N/A'}</td>
                      <td className="p-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                      <td className="p-3 text-xs text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deleting === r.id}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50"
                        >
                          {deleting === r.id ? '...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {analyticsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-6 animate-shimmer h-48" />
              ))}
            </div>
          ) : !analytics ? (
            <div className="glass rounded-2xl p-6 text-center py-12">
              <p className="text-gray-400">No analytics data available</p>
              <button onClick={loadAnalytics} className="btn-primary mt-4">Retry</button>
            </div>
          ) : (
            <>
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 font-fraunces">Most Common Bacteria Issues</h2>
                {analytics.mostCommonBacteria.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No data</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.mostCommonBacteria.map((b, i) => (
                      <div key={b.name} className="flex items-center gap-4">
                        <span className="text-sm font-bold gradient-text w-6">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-gray-200">{b.name}</span>
                            <span className="text-sm text-gray-400">{b.count}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: `${Math.min((b.count / Math.max(...analytics.mostCommonBacteria.map((x) => x.count))) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 font-fraunces">Most Recommended Foods</h2>
                  {analytics.mostRecommendedFoods.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No data</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {analytics.mostRecommendedFoods.map((f) => (
                        <div key={f.name} className="px-4 py-2 glass rounded-xl text-sm flex items-center gap-2">
                          <span className="text-gray-200">{f.name}</span>
                          <span className="badge-info text-[10px]">{f.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 font-fraunces">Deficiency Stats</h2>
                  {analytics.deficiencyStats.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No data</p>
                  ) : (
                    <div className="space-y-3">
                      {analytics.deficiencyStats.map((d) => (
                        <div key={d.nutrient} className="flex items-center gap-4">
                          <span className="text-sm text-gray-200 flex-1">{d.nutrient}</span>
                          <div className="flex-1">
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" style={{ width: `${Math.min((d.count / Math.max(...analytics.deficiencyStats.map((x) => x.count))) * 100, 100)}%` }} />
                            </div>
                          </div>
                          <span className="text-sm text-gray-400 w-8 text-right">{d.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
