import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonStats } from '../../components/ui/Skeleton';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  inactiveUsers: number;
  newUsersToday: number;
  adminCount: number;
  usersByRole: Record<string, number>;
  pendingVolunteers: number;
  verifiedVolunteers: number;
  totalDonors: number;
  pendingBloodRequests: number;
  totalHospitals: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data);
      } catch {
        setError('Failed to load dashboard stats');
        addToast('Failed to load dashboard stats', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <SkeletonStats />;

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
      </div>
    );
  }

  const roleDist = stats?.usersByRole ?? {};
  const roleColors: Record<string, string> = { USER: 'from-blue-500 to-cyan-500', ADMIN: 'from-red-500 to-rose-500', MODERATOR: 'from-amber-500 to-orange-500', RESEARCHER: 'from-emerald-500 to-teal-500', NUTRITIONIST: 'from-green-500 to-emerald-500', DOCTOR: 'from-purple-500 to-violet-500' };

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: '👥', color: 'from-emerald-500 to-cyan-500' },
    { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: '✅', color: 'from-green-500 to-emerald-500' },
    { label: 'New Today', value: stats?.newUsersToday ?? 0, icon: '🆕', color: 'from-sky-500 to-blue-500' },
    { label: 'Suspended', value: stats?.suspendedUsers ?? 0, icon: '🚫', color: 'from-red-500 to-rose-500' },
    { label: 'Pending Volunteers', value: stats?.pendingVolunteers ?? 0, icon: '⏳', color: 'from-amber-500 to-orange-500' },
    { label: 'Verified Volunteers', value: stats?.verifiedVolunteers ?? 0, icon: '🚗', color: 'from-blue-500 to-indigo-500' },
    { label: 'Blood Donors', value: stats?.totalDonors ?? 0, icon: '🩸', color: 'from-red-500 to-rose-500' },
    { label: 'Hospitals', value: stats?.totalHospitals ?? 0, icon: '🏥', color: 'from-teal-500 to-cyan-500' },
  ];

  const navLinks = [
    { to: '/admin/users', label: 'Manage Users', desc: 'View, search, enable/disable users', icon: '👥' },
    { to: '/admin/volunteers', label: 'Volunteer Drivers', desc: `${stats?.pendingVolunteers ?? 0} pending approvals`, icon: '🚗' },
    { to: '/admin/blood', label: 'Blood Management', desc: `${stats?.pendingBloodRequests ?? 0} pending requests`, icon: '🩸' },
    { to: '/admin/analytics', label: 'Analytics', desc: 'Signup trends and system usage', icon: '📈' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold gradient-text font-fraunces mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Overview of your VitaNexa platform</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={s.label} className={`card animate-slide-up stagger-${i + 1}`}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <div className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${s.color} font-fraunces`}>
              {s.value}
            </div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 font-fraunces">Users By Role</h2>
          <div className="space-y-3">
            {Object.entries(roleDist).filter(([,v]) => v > 0).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{role}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 lg:w-48 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${roleColors[role] || 'from-gray-500 to-gray-400'}`} style={{ width: `${(count / Math.max(1, stats?.totalUsers ?? 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-white w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
            {Object.keys(roleDist).length === 0 && <p className="text-gray-500 text-sm">No data</p>}
          </div>
        </div>
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 font-fraunces">Users By Status</h2>
          <div className="space-y-3">
            {[
              { label: 'Active', value: stats?.activeUsers ?? 0, color: 'from-green-500 to-emerald-500' },
              { label: 'Suspended', value: stats?.suspendedUsers ?? 0, color: 'from-red-500 to-rose-500' },
              { label: 'Inactive', value: stats?.inactiveUsers ?? 0, color: 'from-gray-500 to-gray-400' },
            ].filter(s => s.value > 0).map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{s.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 lg:w-48 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${s.color}`} style={{ width: `${(s.value / Math.max(1, stats?.totalUsers ?? 1)) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-white w-8 text-right">{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4 font-fraunces">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="card flex items-center gap-4 hover:-translate-y-1 transition-all duration-300"
            >
              <span className="text-3xl">{link.icon}</span>
              <div>
                <h3 className="text-white font-semibold">{link.label}</h3>
                <p className="text-sm text-gray-400">{link.desc}</p>
              </div>
              <span className="ml-auto text-gray-500 text-xl">&rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
