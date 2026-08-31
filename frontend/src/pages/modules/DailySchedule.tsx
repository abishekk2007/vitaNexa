import { useState, useMemo } from 'react';
import { useDailySchedule } from '../../hooks/useDailySchedule';
import LiveClock from '../../components/ui/LiveClock';

export default function DailySchedule() {
  const { blocks, addBlock, updateBlock, deleteBlock, toggleComplete, getBlocksForDate, CATEGORIES } = useDailySchedule();
  const [viewDate, setViewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState<ScheduleBlock['category']>('morning');

  const todayBlocks = useMemo(() => getBlocksForDate(viewDate), [viewDate, getBlocksForDate]);

  const changeDay = (delta: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + delta);
    setViewDate(d.toISOString().split('T')[0]);
  };

  const isToday = viewDate === new Date().toISOString().split('T')[0];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addBlock({
      date: viewDate,
      startTime,
      endTime,
      title: title.trim(),
      description: description.trim(),
      category,
      color: CATEGORIES.find((c) => c.value === category)?.color || 'from-slate-400 to-gray-500',
      completed: false,
    });
    setTitle('');
    setDescription('');
    setShowAdd(false);
  };

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const durationMinutes = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const completedCount = todayBlocks.filter((b) => b.completed).length;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-fluid-2xl sm:text-3xl font-bold font-fraunces text-slate-800">Daily Schedule</h1>
          <p className="text-fluid-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Plan your day with time blocking</p>
        </div>
        <LiveClock variant="time" className="text-fluid-sm text-slate-500 tabular-nums" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="lg:col-span-1 space-y-3 sm:space-y-4">
          <div className="r-card">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">Navigation</h2>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => changeDay(-1)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">{isToday ? 'Today' : new Date(viewDate).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                <p className="text-xs text-slate-400">{new Date(viewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <button onClick={() => changeDay(1)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {!isToday && (
              <button
                onClick={() => setViewDate(new Date().toISOString().split('T')[0])}
                className="w-full text-sm text-sky-500 hover:text-sky-600 font-medium py-2"
              >
                Back to Today
              </button>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 mb-2">Categories</p>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => (
                  <div key={cat.value} className="flex items-center gap-2 text-xs text-slate-500">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${cat.color}`} />
                    <span className="capitalize">{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-800">Progress</h2>
              <span className="text-xs text-slate-400">{completedCount}/{todayBlocks.length}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: todayBlocks.length > 0 ? `${(completedCount / todayBlocks.length) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 font-fraunces">
              {isToday ? "Today's Schedule" : `Schedule for ${new Date(viewDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
            </h2>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="btn-primary text-sm px-4 py-2"
            >
              {showAdd ? 'Cancel' : '+ Add Block'}
            </button>
          </div>

          {showAdd && (
            <form onSubmit={handleAdd} className="bg-white border border-sky-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What are you planning?"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ScheduleBlock['category'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                />
              </div>
              <button type="submit" className="btn-primary text-sm px-4 py-2">Add to Schedule</button>
            </form>
          )}

          {todayBlocks.length === 0 && !showAdd ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">No blocks scheduled</p>
              <p className="text-sm mt-1">Click "+ Add Block" to plan your day</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-slate-200" />
              <div className="space-y-3">
                {todayBlocks.map((block, i) => {
                  const cat = CATEGORIES.find((c) => c.value === block.category)!;
                  const dur = durationMinutes(block.startTime, block.endTime);
                  return (
                    <div
                      key={block.id}
                      className={`relative flex items-start gap-4 bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 ${
                        block.completed ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat?.color || 'from-slate-400 to-gray-500'} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 relative z-10`}>
                        {block.title.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-semibold ${block.completed ? 'text-emerald-600 line-through' : 'text-slate-800'}`}>
                              {block.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                              block.category === 'recovery' ? 'bg-emerald-100 text-emerald-700' :
                              block.category === 'morning' ? 'bg-sky-100 text-sky-700' :
                              block.category === 'afternoon' ? 'bg-amber-100 text-amber-700' :
                              block.category === 'evening' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {cat?.label || block.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleComplete(block.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                block.completed ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteBlock(block.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {block.description && (
                          <p className="text-xs text-slate-500 mt-1">{block.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatTime(block.startTime)} - {formatTime(block.endTime)}
                          </span>
                          <span>({dur} min)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ScheduleBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  category: 'morning' | 'afternoon' | 'evening' | 'recovery' | 'custom';
  color: string;
  completed: boolean;
}
