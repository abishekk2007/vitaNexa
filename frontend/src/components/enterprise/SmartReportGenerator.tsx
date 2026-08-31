import { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type ExportFormat = 'json' | 'csv' | 'print';

export default function SmartReportGenerator() {
  const { addToast } = useToast();
  const [period, setPeriod] = useState<ReportPeriod>('weekly');
  const [format, setFormat] = useState<ExportFormat>('json');
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const periods: { value: ReportPeriod; label: string; desc: string }[] = [
    { value: 'daily', label: 'Daily', desc: 'Today\'s health snapshot' },
    { value: 'weekly', label: 'Weekly', desc: '7-day health trends' },
    { value: 'monthly', label: 'Monthly', desc: 'Monthly nutrient analysis' },
    { value: 'quarterly', label: 'Quarterly', desc: 'Quarterly health review' },
    { value: 'yearly', label: 'Yearly', desc: 'Annual health report' },
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    setPreview(null);
    try {
      const { data } = await api.post('/enterprise/reports/generate', { period, format }, {
        responseType: format === 'json' ? 'json' : 'blob',
      });

      if (format === 'json') {
        setPreview(data);
        addToast('Enterprise report generated', 'success');
      } else {
        const blob = data instanceof Blob ? data : new Blob([data], { type: format === 'csv' ? 'text/csv' : 'text/html' });
        const url = URL.createObjectURL(blob);
        if (format === 'print') {
          window.open(url, '_blank');
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = `vitanexa-report-${period}-${new Date().toISOString().split('T')[0]}.${format}`;
          a.click();
        }
        URL.revokeObjectURL(url);
        addToast(`${format.toUpperCase()} report downloaded`, 'success');
      }
    } catch {
      addToast('Report generation failed. Using offline mode.', 'warning');
      const offlineReport = {
        period,
        format,
        generatedAt: new Date().toISOString(),
        note: 'Offline-generated report. Some data may be incomplete.',
      };
      setPreview(offlineReport);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800 font-fraunces">Smart Report Generator</h2>
        <p className="text-xs text-slate-400">Daily, Weekly, Monthly, Quarterly & Yearly Reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Report Period</h3>
            <div className="space-y-2">
              {periods.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                    period === p.value ? 'bg-sky-50 border border-sky-200 text-sky-700' : 'hover:bg-slate-50 border border-transparent text-slate-600'
                  }`}>
                  <div className="font-medium">{p.label}</div>
                  <div className="text-xs text-slate-400">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Export Format</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['json', 'csv', 'print'] as const).map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                    format === f ? 'bg-sky-500 text-white shadow' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}>{f}</button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all disabled:opacity-50">
            {generating ? 'Generating...' : `Generate ${period.charAt(0).toUpperCase() + period.slice(1)} Report`}
          </button>
        </div>

        <div className="lg:col-span-2">
          {preview ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 font-fraunces">Report Preview</h3>
                <span className="text-xs text-slate-400">{new Date(preview.generatedAt).toLocaleString()}</span>
              </div>
              <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                {JSON.stringify(preview, null, 2)}
              </pre>
              {format === 'print' && (
                <button onClick={handleGenerate} className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600">Open Print Version</button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 bg-white border border-slate-200 rounded-2xl text-slate-400">
              <svg className="w-16 h-16 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm font-medium">Select period and format</p>
              <p className="text-xs mt-1">Click Generate to create your report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
