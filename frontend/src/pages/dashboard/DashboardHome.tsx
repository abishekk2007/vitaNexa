import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LiveClock from '../../components/ui/LiveClock';
import { useLiveClockFormat } from '../../hooks/useLiveClock';
import { useAchievements } from '../../hooks/useAchievements';
import { useMoodJournal } from '../../hooks/useMoodJournal';

const modules = [
  { to: '/microbiome', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', title: 'Microbiome Meal Planner', desc: 'Track gut bacteria, get food recommendations', color: 'from-sky-500 to-emerald-500', count: 'Track meals' },
  { to: '/pain-predictor', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Pain Pattern Predictor', desc: 'Log pain, detect patterns, predict outlook', color: 'from-red-500 to-rose-500', count: 'Track pain' },
  { to: '/nutrient', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', title: 'Nutrient Optimizer', desc: 'Manage supplements, check interactions', color: 'from-blue-500 to-indigo-500', count: 'Track supplements' },
  { to: '/energy', icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Energy Ledger', desc: 'Spoon budgeting and activity tracking', color: 'from-amber-500 to-orange-500', count: 'Track energy' },
  { to: '/petcare', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', title: 'Pet Care', desc: 'Pet profiles, mood tracking, vets nearby', color: 'from-violet-500 to-purple-500', count: 'Track pets' },
  { to: '/emergency', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', title: 'Emergency Help', desc: 'Hospitals, ambulances, volunteer drivers', color: 'from-rose-500 to-pink-500', count: 'Get help' },
  { to: '/bloodbank', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', title: 'Blood Bank', desc: 'Donor registration and blood requests', color: 'from-red-500 to-rose-600', count: 'Find donors' },
  { to: '/budget', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Budget Saver', desc: 'Track savings and financial goals', color: 'from-green-500 to-emerald-500', count: 'Track savings' },
  { to: '/mood-journal', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Mood Journal', desc: 'Track mood and daily reflections', color: 'from-violet-500 to-purple-500', count: 'Log mood' },
  { to: '/daily-schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Daily Schedule', desc: 'Plan your day with time blocking', color: 'from-emerald-500 to-teal-500', count: 'Plan day' },
  { to: '/achievements', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', title: 'Achievements', desc: 'Track streaks and milestones', color: 'from-amber-500 to-yellow-500', count: 'View badges' },
  { to: '/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'Reports', desc: 'Generate health reports', color: 'from-sky-500 to-blue-500', count: 'Export data' },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const clock = useLiveClockFormat();
  const { streak } = useAchievements();
  const { entries: moodEntries } = useMoodJournal();

  const todayMood = moodEntries.filter((e) => e.date === new Date().toISOString().split('T')[0])[0];

  return (
    <div className="animate-fade-in">
      <div className={/* responsive-spacing */ 'mb-4 sm:mb-6 lg:mb-8'}>
        <div className="flex items-start justify-between flex-wrap gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-fluid-2xl sm:text-3xl font-bold text-slate-800 font-fraunces">{clock.greeting}, {user?.name?.split(' ')[0] || 'there'}!</h1>
              <span className="px-2 sm:px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-[10px] sm:text-xs font-bold rounded-full animate-pulse">
                {new Date().getHours() < 12 ? '☀️' : new Date().getHours() < 17 ? '🌤️' : '🌙'}
              </span>
            </div>
            <p className="text-fluid-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Here's your health overview</p>
          </div>
          <LiveClock variant="full" className="text-right flex-shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'Streak', value: `${streak.current} days`, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'from-amber-500/20 to-orange-500/20 text-amber-600' },
          { label: 'Best Streak', value: `${streak.best} days`, icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', color: 'from-purple-500/20 to-violet-500/20 text-purple-600' },
          { label: 'Role', value: user?.role || 'USER', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'from-emerald-500/20 to-emerald-600/10 text-emerald-600' },
          { label: 'Account', value: 'Active', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'from-sky-500/20 to-emerald-500/20 text-sky-600' },
        ].map((stat, i) => (
          <div key={stat.label} className={`bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm animate-slide-up`} style={{ animationDelay: `${(i + 1) * 0.1}s` }}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
              <div className="min-w-0">
                <div className={`text-fluid-lg sm:text-lg font-bold ${stat.color.split(' ')[2]} truncate`}>{stat.value}</div>
                <div className="text-xs text-slate-400 truncate">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {todayMood && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{todayMood.mood === 'great' ? '😄' : todayMood.mood === 'good' ? '🙂' : todayMood.mood === 'okay' ? '😐' : todayMood.mood === 'bad' ? '😔' : '😢'}</div>
              <div>
                <p className="text-sm font-semibold text-violet-700">Today's Mood: <span className="capitalize">{todayMood.mood}</span></p>
                <p className="text-xs text-violet-500">Energy: {todayMood.energy}/5 | {todayMood.reflection?.slice(0, 60)}{todayMood.reflection?.length > 60 ? '...' : ''}</p>
              </div>
            </div>
            <Link to="/mood-journal" className="text-xs text-violet-500 hover:text-violet-700 font-medium">View Journal →</Link>
          </div>
        </div>
      )}

      <h2 className="text-fluid-xl font-semibold text-slate-800 mb-3 sm:mb-4 font-fraunces">Your Modules</h2>
      <div className="r-grid">
        {modules.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-sky-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${m.color} opacity-5 rounded-bl-full transition-opacity duration-300 group-hover:opacity-20`} />
            <div className="relative z-10">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-2 sm:mb-3`}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                </svg>
              </div>
              <h3 className="text-fluid-sm sm:text-base font-semibold text-slate-800 mb-0.5 sm:mb-1 group-hover:text-sky-600 transition-colors">
                {m.title}
              </h3>
              <p className="text-fluid-xs text-slate-500">{m.desc}</p>
              <span className="inline-block mt-2 sm:mt-3 text-fluid-xs text-sky-500 group-hover:text-sky-600 transition-colors font-medium">
                {m.count} →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
