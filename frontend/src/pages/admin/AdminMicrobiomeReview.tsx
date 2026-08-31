import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonTable } from '../../components/ui/Skeleton';

interface ReviewItem {
  id: string; speciesId: string; foodId: string;
  effect: string; evidenceGrade: string | null; evidenceBasis: string | null;
  mechanism: string | null; confidenceScore: number | null; reviewStatus: string;
  species: { name: string }; food: { name: string };
}

export default function AdminMicrobiomeReview() {
  const { addToast } = useToast();
  const [tab, setTab] = useState<'pending' | 'low'>('pending');
  const [pending, setPending] = useState<ReviewItem[]>([]);
  const [lowConf, setLowConf] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, lRes] = await Promise.all([
        api.get('/microbiome/review/pending'), api.get('/microbiome/review/low-confidence')
      ]);
      setPending(Array.isArray(pRes.data) ? pRes.data : []);
      setLowConf(Array.isArray(lRes.data) ? lRes.data : []);
    } catch (err) {
      console.error('AdminMicrobiomeReview: load failed', err);
      addToast('Failed to load review data', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const review = async (id: string, status: string) => {
    setActionId(id);
    try {
      await api.put(`/microbiome/effects/${id}/review`, { reviewStatus: status });
      addToast(`Marked as ${status}`, 'success');
      load();
    } catch (err) {
      console.error('AdminMicrobiomeReview: action failed', err);
      addToast('Review action failed', 'error'); }
    finally { setActionId(null); }
  };

  const items = tab === 'pending' ? pending : lowConf;

  if (loading) return <SkeletonTable />;

  const statusColor = (s: string) => s === 'approved' ? 'text-emerald-400' : s === 'pending_review' ? 'text-amber-400' : s === 'archived' ? 'text-gray-500' : 'text-sky-400';
  const effectColor = (eff: string) => eff.includes('INCREASES') ? 'text-emerald-400' : eff.includes('DECREASES') ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text font-fraunces">Scientific Review</h1>
        <p className="text-gray-400 mt-1">Review and approve bacteria-food effect relationships</p>
      </div>

      <div className="flex gap-2 border-b border-white/10">
        <button onClick={() => setTab('pending')} className={`px-4 py-2 text-sm font-medium transition-colors ${tab === 'pending' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}>
          Pending Review ({pending.length})
        </button>
        <button onClick={() => setTab('low')} className={`px-4 py-2 text-sm font-medium transition-colors ${tab === 'low' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}>
          Low Confidence ({lowConf.length})
        </button>
      </div>

      {items.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-gray-400">{tab === 'pending' ? 'No items pending review.' : 'No low-confidence items flagged.'}</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
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
                {items.map((item, i) => (
                  <tr key={item.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-white/5' : ''}`}>
                    <td className="p-3 text-white font-medium text-xs italic">{item.species.name}</td>
                    <td className="p-3 text-gray-200 text-xs">{item.food.name}</td>
                    <td className="p-3 text-xs"><span className={effectColor(item.effect)}>{item.effect}</span></td>
                    <td className="p-3 text-center">{item.evidenceGrade || '—'}</td>
                    <td className="p-3 text-center text-xs">{item.confidenceScore !== null ? `${item.confidenceScore}%` : '—'}</td>
                    <td className="p-3 text-gray-400 text-xs max-w-[150px] truncate">{item.mechanism || '—'}</td>
                    <td className="p-3 text-center"><span className={`text-xs ${statusColor(item.reviewStatus)}`}>{item.reviewStatus}</span></td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => review(item.id, 'approved')} disabled={actionId === item.id} className="text-emerald-400 hover:text-emerald-300 text-xs disabled:opacity-50">Approve</button>
                      <button onClick={() => review(item.id, 'pending_review')} disabled={actionId === item.id} className="text-amber-400 hover:text-amber-300 text-xs disabled:opacity-50">Flag</button>
                      <button onClick={() => review(item.id, 'archived')} disabled={actionId === item.id} className="text-gray-400 hover:text-gray-300 text-xs disabled:opacity-50">Archive</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
