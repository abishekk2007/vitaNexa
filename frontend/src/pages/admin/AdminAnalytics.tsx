import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonStats } from '../../components/ui/Skeleton';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';

interface DailyCount {
  date: string;
  count: number;
}

interface ActiveUserPoint {
  date: string;
  active: number;
  newUsers: number;
}

interface AnalyticsData {
  totalBacteriaResults: number;
  totalFoodLogs: number;
  totalPainLogs: number;
  totalSupplements: number;
  totalMealLogs: number;
  totalSpoonBudgets: number;
  totalActivities: number;
  totalPetProfiles: number;
  totalPetMoodLogs: number;
  totalSavingsEntries: number;
  totalSavingsGoals: number;
  totalNotifications: number;
}

interface MicrobiomeAnalytics {
  speciesCount: number; foodCount: number; effectCount: number; ruleCount: number;
  userCount: number; reportCount: number;
  researchCoverage: { totalSpecies: number; totalFoods: number; totalEffects: number; withEvidence: number; pendingReview: number; coverage: number };
  evidenceDistribution: { grade: string; count: number }[];
  confidenceDistribution: { high: number; medium: number; low: number };
  mostCommonIssues: { bacteriaName: string; count: number }[];
  mostCommonDeficiencies: { bacteriaName: string; count: number }[];
  mostRecommendedFoods: { foodName: string; count: number }[];
  mostAvoidedFoods: { foodName: string; count: number }[];
}

export default function AdminAnalytics() {
  const { addToast } = useToast();
  const [signups, setSignups] = useState<DailyCount[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUserPoint[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [microbiomeAnalytics, setMicrobiomeAnalytics] = useState<MicrobiomeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [sRes, aRes, anRes, mRes] = await Promise.all([
        api.get('/admin/analytics/signups?days=30'),
        api.get('/admin/analytics/active-users?days=30'),
        api.get('/admin/analytics'),
        api.get('/microbiome/analytics').catch(() => ({ data: null })),
      ]);
      setSignups(sRes.data ?? []);
      setActiveUsers(aRes.data ?? []);
      setAnalytics(anRes.data);
      setMicrobiomeAnalytics(mRes.data);
    } catch {
      setError('Failed to load analytics');
      addToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnalytics(); }, []);

  const usageCards: { label: string; value: number }[] = analytics
    ? [
        { label: 'Bacteria Results', value: analytics.totalBacteriaResults },
        { label: 'Food Logs', value: analytics.totalFoodLogs },
        { label: 'Pain Logs', value: analytics.totalPainLogs },
        { label: 'Supplements', value: analytics.totalSupplements },
        { label: 'Meal Logs', value: analytics.totalMealLogs },
        { label: 'Spoon Budgets', value: analytics.totalSpoonBudgets },
        { label: 'Activities', value: analytics.totalActivities },
        { label: 'Pet Profiles', value: analytics.totalPetProfiles },
        { label: 'Pet Mood Logs', value: analytics.totalPetMoodLogs },
        { label: 'Savings Entries', value: analytics.totalSavingsEntries },
        { label: 'Savings Goals', value: analytics.totalSavingsGoals },
        { label: 'Notifications', value: analytics.totalNotifications },
      ]
    : [];

  if (loading) return <SkeletonStats />;

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={loadAnalytics} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text font-fraunces mb-2">System Analytics</h1>
        <p className="text-gray-400">Usage statistics and trends across the platform</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 font-fraunces">Signups (30 days)</h2>
          {signups.length > 0 ? (
            <LineChart
              labels={signups.map((s) => s.date)}
              datasets={[{ label: 'New Users', data: signups.map((s) => s.count), borderColor: '#10b981' }]}
              title="Daily Signups"
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No signup data available</div>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 font-fraunces">Active Users (30 days)</h2>
          {activeUsers.length > 0 ? (
            <BarChart
              labels={activeUsers.map((a) => a.date)}
              datasets={[
                { label: 'Active Sessions', data: activeUsers.map((a) => a.active), backgroundColor: 'rgba(59, 130, 246, 0.7)' },
                { label: 'New Users', data: activeUsers.map((a) => a.newUsers), backgroundColor: 'rgba(16, 185, 129, 0.7)' },
              ]}
              title="Active Users & Signups"
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">No activity data available</div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-6 font-fraunces">Feature Usage Summary</h2>
        {usageCards.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No analytics data available</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {usageCards.map((c) => (
              <div key={c.label} className="glass rounded-xl p-4 text-center hover:bg-white/10 transition-all">
                <div className="text-2xl font-bold gradient-text font-fraunces">{c.value}</div>
                <div className="text-xs text-gray-400 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Microbiome Analytics Section */}
      {microbiomeAnalytics && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold gradient-text font-fraunces">Microbiome Intelligence</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { label: 'Bacteria Species', value: microbiomeAnalytics.speciesCount },
              { label: 'Food Items', value: microbiomeAnalytics.foodCount },
              { label: 'Bacteria-Food Effects', value: microbiomeAnalytics.effectCount },
              { label: 'Clinical Rules', value: microbiomeAnalytics.ruleCount },
              { label: 'User Reports', value: microbiomeAnalytics.reportCount },
              { label: 'Research Coverage', value: `${(microbiomeAnalytics.researchCoverage.coverage * 100).toFixed(1)}%` },
            ].map(c => (
              <div key={c.label} className="glass rounded-xl p-4 text-center">
                <div className="text-2xl font-bold gradient-text font-fraunces">{c.value}</div>
                <div className="text-xs text-gray-400 mt-1">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {microbiomeAnalytics.evidenceDistribution.length > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 font-fraunces">Evidence Distribution</h3>
                <BarChart
                  labels={microbiomeAnalytics.evidenceDistribution.map(e => `Grade ${e.grade}`)}
                  datasets={[{ label: 'Effects', data: microbiomeAnalytics.evidenceDistribution.map(e => e.count), backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(59,130,246,0.7)', 'rgba(245,158,11,0.7)', 'rgba(107,114,128,0.7)'] }]}
                  title="Evidence Grades"
                />
              </div>
            )}

            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 font-fraunces">Confidence Distribution</h3>
              {microbiomeAnalytics.confidenceDistribution && (
                <BarChart
                  labels={['High (70-100)', 'Medium (40-69)', 'Low (0-39)']}
                  datasets={[{ label: 'Effects', data: [microbiomeAnalytics.confidenceDistribution.high, microbiomeAnalytics.confidenceDistribution.medium, microbiomeAnalytics.confidenceDistribution.low], backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)'] }]}
                  title="Confidence Scores"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 font-fraunces">Most Common Issues (HIGH)</h3>
              {microbiomeAnalytics.mostCommonIssues.length > 0 ? (
                <div className="space-y-2">
                  {microbiomeAnalytics.mostCommonIssues.slice(0, 10).map(item => (
                    <div key={item.bacteriaName} className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-sm text-gray-200">{item.bacteriaName}</span>
                      <span className="text-xs text-red-400">{item.count} users</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 text-sm">No data</p>}
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 font-fraunces">Most Common Deficiencies (LOW)</h3>
              {microbiomeAnalytics.mostCommonDeficiencies.length > 0 ? (
                <div className="space-y-2">
                  {microbiomeAnalytics.mostCommonDeficiencies.slice(0, 10).map(item => (
                    <div key={item.bacteriaName} className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-sm text-gray-200">{item.bacteriaName}</span>
                      <span className="text-xs text-amber-400">{item.count} users</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 text-sm">No data</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 font-fraunces">Most Recommended Foods</h3>
              {microbiomeAnalytics.mostRecommendedFoods.length > 0 ? (
                <div className="space-y-2">
                  {microbiomeAnalytics.mostRecommendedFoods.slice(0, 10).map(item => (
                    <div key={item.foodName} className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-sm text-gray-200">{item.foodName}</span>
                      <span className="text-xs text-emerald-400">{item.count} times</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 text-sm">No data</p>}
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 font-fraunces">Most Avoided Foods</h3>
              {microbiomeAnalytics.mostAvoidedFoods.length > 0 ? (
                <div className="space-y-2">
                  {microbiomeAnalytics.mostAvoidedFoods.slice(0, 10).map(item => (
                    <div key={item.foodName} className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-sm text-gray-200">{item.foodName}</span>
                      <span className="text-xs text-red-400">{item.count} times</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 text-sm">No data</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
