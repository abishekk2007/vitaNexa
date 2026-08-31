import { useMemo } from 'react';
import { useAchievements } from '../../hooks/useAchievements';
import { useNotifications } from '../../hooks/useNotifications';
import Confetti from '../../components/ui/Confetti';

export default function Achievements() {
  const { achievements, streak, doCheckIn, justUnlocked, clearJustUnlocked } = useAchievements();
  const { addNotification } = useNotifications();

  const handleCheckIn = () => {
    const today = doCheckIn();
    if (today) {
      addNotification({ title: 'Daily Check-In Complete', message: 'You checked in for today! Keep your streak alive.', type: 'success' });
    }
  };

  const isCheckedInToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return streak.dailyLog.includes(today);
  }, [streak.dailyLog]);

  const allUnlocked = achievements.filter((a) => a.unlocked).length;
  const totalAchievements = achievements.length;
  const progress = Math.round((allUnlocked / totalAchievements) * 100);

  const categoryIcon: Record<string, string> = {
    streak: '🔥',
    milestone: '⭐',
    mastery: '💪',
    special: '🎖️',
  };

  const recentUnlocks = achievements.filter((a) => a.unlocked).sort((a, b) => {
    if (!a.unlockedAt || !b.unlockedAt) return 0;
    return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
  }).slice(0, 5);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      <Confetti active={!!justUnlocked} duration={3000} />
      {justUnlocked && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-amber-200 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[320px] animate-slide-up"
          onClick={clearJustUnlocked}
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-3xl animate-bounce">
            {justUnlocked.icon}
          </div>
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Achievement Unlocked!</p>
            <p className="text-lg font-bold text-slate-800">{justUnlocked.title}</p>
            <p className="text-sm text-slate-500">{justUnlocked.description}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-fluid-2xl sm:text-3xl font-bold font-fraunces text-slate-800">Achievements</h1>
          <p className="text-fluid-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Track your milestones and streaks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="r-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-base sm:text-lg flex-shrink-0">🔥</div>
            <div className="min-w-0">
              <div className="text-fluid-lg sm:text-xl font-bold text-slate-800">{streak.current}</div>
              <div className="text-fluid-xs text-slate-400">Current Streak</div>
            </div>
          </div>
        </div>
        <div className="r-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-base sm:text-lg flex-shrink-0">🏆</div>
            <div className="min-w-0">
              <div className="text-fluid-lg sm:text-xl font-bold text-slate-800">{streak.best}</div>
              <div className="text-fluid-xs text-slate-400">Best Streak</div>
            </div>
          </div>
        </div>
        <div className="r-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-base sm:text-lg flex-shrink-0">🎯</div>
            <div className="min-w-0">
              <div className="text-fluid-lg sm:text-xl font-bold text-slate-800">{allUnlocked}/{totalAchievements}</div>
              <div className="text-fluid-xs text-slate-400">Achievements</div>
            </div>
          </div>
        </div>
        <div className="r-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <button
                onClick={handleCheckIn}
                disabled={isCheckedInToday}
                className={`text-fluid-sm font-semibold transition-colors whitespace-nowrap ${isCheckedInToday ? 'text-emerald-600' : 'text-sky-600 hover:text-sky-700'}`}
              >
                {isCheckedInToday ? 'Checked In ✓' : 'Check In'}
              </button>
              <div className="text-fluid-xs text-slate-400">Daily</div>
            </div>
          </div>
        </div>
      </div>

      <div className="r-card">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 font-fraunces">Overall Progress</h2>
          <span className="text-fluid-sm text-slate-500">{progress}%</span>
        </div>
        <div className="w-full h-2 sm:h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-emerald-500 to-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-fluid-base sm:text-lg font-semibold text-slate-800 font-fraunces mb-3 sm:mb-4">All Achievements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`relative overflow-hidden bg-white border rounded-2xl p-3 sm:p-4 shadow-sm transition-all duration-300 ${
                  ach.unlocked ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg sm:text-xl flex-shrink-0 ${
                    ach.unlocked ? 'from-amber-400 to-yellow-500 shadow-md' : 'from-slate-200 to-slate-300'
                  }`}>
                    {ach.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-fluid-sm sm:text-sm font-semibold ${ach.unlocked ? 'text-slate-800' : 'text-slate-500'}`}>{ach.title}</h3>
                    <p className="text-fluid-xs text-slate-400 mt-0.5">{ach.description}</p>
                    {!ach.unlocked && (
                      <div className="mt-1.5 sm:mt-2">
                        <div className="flex items-center justify-between text-fluid-xs text-slate-400 mb-0.5 sm:mb-1">
                          <span>Progress</span>
                          <span>{ach.progress}/{ach.maxProgress}</span>
                        </div>
                        <div className="w-full h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${(ach.progress / ach.maxProgress) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {ach.unlocked && ach.unlockedAt && (
                      <p className="text-[10px] text-amber-600 mt-0.5 sm:mt-1">
                        Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {ach.unlocked && (
                    <span className="text-amber-500 flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="r-card">
            <h2 className="text-fluid-base font-semibold text-slate-800 font-fraunces mb-2 sm:mb-3">Recent Unlocks</h2>
            {recentUnlocks.length === 0 ? (
              <p className="text-fluid-sm text-slate-400 text-center py-3 sm:py-4">No achievements unlocked yet</p>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {recentUnlocks.map((ach) => (
                  <div key={ach.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 bg-amber-50/50 rounded-xl">
                    <span className="text-lg sm:text-xl">{ach.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-fluid-sm font-medium text-slate-700 truncate">{ach.title}</p>
                      <p className="text-[10px] text-amber-600">
                        {ach.unlockedAt ? new Date(ach.unlockedAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="r-card">
            <h2 className="text-fluid-base font-semibold text-slate-800 font-fraunces mb-2 sm:mb-3">Streak History</h2>
            <div className="flex flex-wrap gap-0.5 sm:gap-1">
              {Array.from({ length: 30 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                const dateStr = d.toISOString().split('T')[0];
                const logged = streak.dailyLog.includes(dateStr);
                const isCurrent = dateStr === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={dateStr}
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm text-[6px] sm:text-[7px] flex items-center justify-center font-bold ${
                      logged
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                          ? 'bg-sky-200 text-sky-600'
                          : 'bg-slate-100 text-slate-300'
                    }`}
                    title={dateStr}
                  >
                    {d.getDate()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
