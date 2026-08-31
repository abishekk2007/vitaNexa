import { useState, useRef } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

export default function AdminMicrobiomeImport() {
  const { addToast } = useToast();
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: any[] } | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);

  const importJson = async () => {
    if (!jsonText.trim()) { addToast('Paste JSON data first', 'error'); return; }
    setImporting(true);
    try {
      let data;
      try { data = JSON.parse(jsonText); } catch { addToast('Invalid JSON', 'error'); setImporting(false); return; }
      const res = await api.post('/microbiome/import/json', data);
      setResult(res.data);
      addToast(`Imported ${res.data.imported} effects`, 'success');
    } catch (e: any) { addToast(e.response?.data?.error || 'Import failed', 'error'); }
    finally { setImporting(false); }
  };

  const importFile = async (file: File | undefined, endpoint: string) => {
    if (!file) { addToast('Select a file first', 'error'); return; }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/microbiome/import/${endpoint}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      addToast(`Imported ${res.data.imported} effects`, 'success');
    } catch (e: any) { addToast(e.response?.data?.error || 'Import failed', 'error'); }
    finally { setImporting(false); if (endpoint === 'csv' && csvRef.current) csvRef.current.value = ''; if (endpoint === 'xlsx' && xlsxRef.current) xlsxRef.current.value = ''; }
  };

  const downloadExport = async (format: string) => {
    try {
      const res = await api.get(`/microbiome/export/${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `effects.${format}`; a.click();
      window.URL.revokeObjectURL(url);
      addToast(`Downloaded effects.${format}`, 'success');
    } catch { addToast('Export failed', 'error'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text font-fraunces">Import / Export</h1>
        <p className="text-gray-400 mt-1">Bulk import and export bacteria-food effect relationships</p>
      </div>

      {result && (
        <div className="glass rounded-2xl p-4 border-l-4 border-emerald-500">
          <p className="text-emerald-400 font-medium">Imported {result.imported} effects</p>
          {result.errors.length > 0 && <p className="text-amber-400 text-sm mt-1">{result.errors.length} errors</p>}
          <button onClick={() => setResult(null)} className="text-xs text-gray-400 mt-2 hover:text-white">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Import JSON</h2>
          <p className="text-xs text-gray-400 mb-3">Paste an array of effect objects: [{'{'}speciesName, foodName, effect, evidenceGrade, mechanism{'}'}]</p>
          <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} className="input-field w-full h-40 font-mono text-xs" placeholder='[{"speciesName":"Akkermansia muciniphila","foodName":"Pomegranate","effect":"STRONGLY_INCREASES","evidenceGrade":"A","mechanism":"Polyphenol metabolism"}]' />
          <button onClick={importJson} disabled={importing} className="btn-primary mt-3 disabled:opacity-50">{importing ? 'Importing...' : 'Import JSON'}</button>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Import CSV</h2>
          <p className="text-xs text-gray-400 mb-3">CSV with columns: speciesName, foodName, effect, evidenceGrade, evidenceBasis, mechanism, confidenceScore, keyReference</p>
          <input type="file" ref={csvRef} accept=".csv" onChange={e => importFile(e.target.files?.[0], 'csv')} className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 mb-3 w-full" />
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Import XLSX</h2>
          <p className="text-xs text-gray-400 mb-3">Excel file with first sheet containing the same columns as CSV</p>
          <input type="file" ref={xlsxRef} accept=".xlsx,.xls" onChange={e => importFile(e.target.files?.[0], 'xlsx')} className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 mb-3 w-full" />
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-2">Export</h2>
          <p className="text-xs text-gray-400 mb-3">Download all bacteria-food effect relationships</p>
          <div className="flex gap-3">
            <button onClick={() => downloadExport('effects')} className="btn-primary flex-1">Export JSON</button>
            <button onClick={() => downloadExport('csv')} className="btn-primary flex-1">Export CSV</button>
          </div>
        </div>
      </div>
    </div>
  );
}
