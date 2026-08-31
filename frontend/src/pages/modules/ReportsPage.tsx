import { useState } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type ReportMetric = 'energy' | 'pain' | 'meals' | 'supplements' | 'mood' | 'all';
type ExportFormat = 'pdf' | 'csv' | 'json';

export default function ReportsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [metrics, setMetrics] = useState<ReportMetric>('all');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    return { start, end };
  });
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setPreview(null);
    try {
      const { data } = await api.post('/reports/generate', {
        type: reportType,
        metrics,
        format,
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      if (format === 'json') {
        setPreview(data);
        addToast('Report generated successfully', 'success');
      } else {
        const blob = format === 'pdf'
          ? new Blob([data], { type: 'application/pdf' })
          : new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vitanexa-report-${reportType}-${dateRange.start}-to-${dateRange.end}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        addToast(`${format.toUpperCase()} report downloaded`, 'success');
      }
    } catch {
      addToast('Failed to generate report - using local data', 'warning');
      generateLocalReport();
    } finally {
      setGenerating(false);
    }
  };

  const generateLocalReport = () => {
    const localData: any = {
      generatedAt: new Date().toISOString(),
      user: user?.name,
      reportType,
      dateRange,
      summary: {
        totalDays: Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / 86400000),
        metricsIncluded: metrics,
      },
    };

    if (metrics === 'energy' || metrics === 'all') {
      const energyData = JSON.parse(localStorage.getItem('spoonBudgets') || '[]');
      const recentEnergy = energyData.filter((e: any) =>
        e.date >= dateRange.start && e.date <= dateRange.end
      );
      localData.energy = {
        totalEntries: recentEnergy.length,
        avgRemaining: recentEnergy.length > 0
          ? (recentEnergy.reduce((s: number, e: any) => s + (e.remainingSpoons || 0), 0) / recentEnergy.length).toFixed(1)
          : 0,
        entries: recentEnergy,
      };
    }

    if (metrics === 'mood' || metrics === 'all') {
      const moodData = JSON.parse(localStorage.getItem('vitanexa_mood_journal') || '[]');
      const recentMood = moodData.filter((e: any) =>
        e.date >= dateRange.start && e.date <= dateRange.end
      );
      localData.mood = {
        totalEntries: recentMood.length,
        entries: recentMood,
      };
    }

    if (metrics === 'meals' || metrics === 'all') {
      const mealData = JSON.parse(localStorage.getItem('mealLogs') || '[]');
      const recentMeals = mealData.filter((e: any) =>
        e.date >= dateRange.start && e.date <= dateRange.end
      );
      localData.meals = {
        totalEntries: recentMeals.length,
        entries: recentMeals,
      };
    }

    localData.achievements = JSON.parse(localStorage.getItem('vitanexa_achievements') || '[]');
    localData.streak = JSON.parse(localStorage.getItem('vitanexa_streak') || '{}');

    setPreview(localData);

    if (format === 'csv') {
      const csv = convertToCSV(localData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vitanexa-report-${reportType}-${dateRange.start}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    addToast('Report generated from local data', 'success');
  };

  const convertToCSV = (data: any): string => {
    let csv = 'Section,Field,Value\n';
    const addRow = (section: string, field: string, value: any) => {
      csv += `"${section}","${field}","${String(value).replace(/"/g, '""')}"\n`;
    };

    addRow('Report', 'Generated At', data.generatedAt);
    addRow('Report', 'User', data.user || 'N/A');
    addRow('Report', 'Type', data.reportType);
    addRow('Report', 'Date Range', `${data.dateRange.start} to ${data.dateRange.end}`);

    if (data.energy) {
      addRow('Energy', 'Total Entries', data.energy.totalEntries);
      addRow('Energy', 'Avg Remaining Spoons', data.energy.avgRemaining);
    }
    if (data.mood) {
      addRow('Mood', 'Total Entries', data.mood.totalEntries);
    }
    if (data.meals) {
      addRow('Meals', 'Total Entries', data.meals.totalEntries);
    }

    return csv;
  };

  const reportTypes: { value: ReportType; label: string; icon: string }[] = [
    { value: 'daily', label: 'Daily', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { value: 'weekly', label: 'Weekly', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { value: 'monthly', label: 'Monthly', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { value: 'quarterly', label: 'Quarterly', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
    { value: 'yearly', label: 'Yearly', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-fluid-2xl sm:text-3xl font-bold font-fraunces text-slate-800">Reports</h1>
          <p className="text-fluid-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Generate and export health reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1 space-y-3 sm:space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Report Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Report Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {reportTypes.map((rt) => (
                    <button
                      key={rt.value}
                      onClick={() => setReportType(rt.value)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        reportType === rt.value
                          ? 'bg-sky-100 text-sky-700 border border-sky-200'
                          : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={rt.icon} />
                      </svg>
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Metrics</label>
                <select
                  value={metrics}
                  onChange={(e) => setMetrics(e.target.value as ReportMetric)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                >
                  <option value="all">All Metrics</option>
                  <option value="energy">Energy Only</option>
                  <option value="pain">Pain Only</option>
                  <option value="meals">Meals Only</option>
                  <option value="supplements">Supplements Only</option>
                  <option value="mood">Mood Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">Export Format</label>
                <div className="flex gap-2">
                  {(['csv', 'pdf', 'json'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                        format === f
                          ? 'bg-sky-500 text-white shadow'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full btn-primary text-sm disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Quick Reports</h2>
            <div className="space-y-2">
              {[
                { label: 'This Week', type: 'weekly' as ReportType },
                { label: 'This Month', type: 'monthly' as ReportType },
                { label: 'Last 30 Days', type: 'daily' as ReportType },
              ].map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => {
                    setReportType(qr.type);
                    const end = new Date().toISOString().split('T')[0];
                    const start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
                    setDateRange({ start, end });
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 min-w-0">
          {preview ? (
            <div className="r-card">
              <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 font-fraunces">Report Preview</h2>
                <span className="text-fluid-xs text-slate-400 whitespace-nowrap">Generated {new Date(preview.generatedAt).toLocaleString()}</span>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl">
                  <h3 className="text-fluid-sm font-semibold text-slate-700 mb-1.5 sm:mb-2">Report Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-fluid-sm">
                    <div><span className="text-slate-400">Type:</span> <span className="text-slate-700 capitalize">{preview.reportType}</span></div>
                    <div><span className="text-slate-400">Period:</span> <span className="text-slate-700">{preview.dateRange.start} to {preview.dateRange.end}</span></div>
                    <div><span className="text-slate-400">Total Days:</span> <span className="text-slate-700">{preview.summary?.totalDays || 0}</span></div>
                    <div><span className="text-slate-400">User:</span> <span className="text-slate-700">{preview.user || 'N/A'}</span></div>
                  </div>
                </div>

                {preview.energy && (
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                    <h3 className="text-sm font-semibold text-amber-700 mb-2">⚡ Energy Summary</h3>
                    <p className="text-sm text-amber-600">Total entries: {preview.energy.totalEntries}</p>
                    <p className="text-sm text-amber-600">Avg remaining spoons: {preview.energy.avgRemaining}</p>
                  </div>
                )}

                {preview.mood && (
                  <div className="p-4 bg-violet-50/50 border border-violet-100 rounded-xl">
                    <h3 className="text-sm font-semibold text-violet-700 mb-2">😊 Mood Summary</h3>
                    <p className="text-sm text-violet-600">Total entries: {preview.mood.totalEntries}</p>
                  </div>
                )}

                {preview.meals && (
                  <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl">
                    <h3 className="text-sm font-semibold text-sky-700 mb-2">🍽️ Meals Summary</h3>
                    <p className="text-sm text-sky-600">Total entries: {preview.meals.totalEntries}</p>
                  </div>
                )}

                {preview.achievements && (
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                    <h3 className="text-sm font-semibold text-amber-700 mb-2">🏆 Achievements</h3>
                    <p className="text-sm text-amber-600">Unlocked: {preview.achievements.filter((a: any) => a.unlocked).length}/{preview.achievements.length}</p>
                  </div>
                )}

                {preview.streak && (
                  <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl">
                    <h3 className="text-sm font-semibold text-purple-700 mb-2">🔥 Streak</h3>
                    <p className="text-sm text-purple-600">Current: {preview.streak.current} day(s) | Best: {preview.streak.best}</p>
                  </div>
                )}

                {format === 'json' && (
                  <div className="mt-3 sm:mt-4">
                    <details>
                      <summary className="text-fluid-sm text-slate-500 cursor-pointer hover:text-slate-700">View Raw JSON</summary>
                      <pre className="mt-2 p-3 sm:p-4 bg-slate-900 text-emerald-400 rounded-xl text-fluid-xs overflow-auto max-h-72 sm:max-h-96">
                        {JSON.stringify(preview, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 sm:py-20 text-slate-400">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-fluid-base sm:text-lg font-medium">No report generated yet</p>
              <p className="text-fluid-sm mt-1">Configure settings and click Generate Report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
