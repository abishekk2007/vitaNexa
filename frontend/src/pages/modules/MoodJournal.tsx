import { useState, useMemo } from 'react';
import { useMoodJournal, MoodEntry } from '../../hooks/useMoodJournal';

export default function MoodJournal() {
  const { entries, addEntry, deleteEntry, getRecent, MOODS, MOOD_EMOJIS, MOOD_COLORS, ENERGY_LABELS } = useMoodJournal();
  const [mood, setMood] = useState<MoodEntry['mood']>('okay');
  const [energy, setEnergy] = useState<MoodEntry['energy']>(3);
  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [viewFilter, setViewFilter] = useState<'all' | 'recent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    let result = viewFilter === 'recent' ? getRecent(7) : entries;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) =>
        e.reflection.toLowerCase().includes(q) ||
        e.gratitude.toLowerCase().includes(q) ||
        e.mood.includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [entries, viewFilter, searchQuery, getRecent]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflection.trim() && !gratitude.trim()) return;
    addEntry({ mood, energy, reflection: reflection.trim(), gratitude: gratitude.trim(), tags });
    setReflection('');
    setGratitude('');
    setTags([]);
  };

  const getMoodScore = (m: string) => MOODS.indexOf(m as MoodEntry['mood']);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-fluid-2xl sm:text-3xl font-bold font-fraunces text-slate-800">Mood Journal</h1>
          <p className="text-fluid-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Track your emotional wellbeing and practice gratitude</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">How are you feeling?</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Mood</label>
                <div className="flex gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`flex-1 py-3 rounded-xl text-center text-lg transition-all ${
                        mood === m
                          ? `bg-gradient-to-br ${MOOD_COLORS[m]} text-white shadow-lg scale-105`
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <div>{MOOD_EMOJIS[m]}</div>
                      <div className="text-[10px] font-medium mt-0.5 capitalize">{m}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Energy Level</label>
                <div className="flex gap-1">
                  {([1, 2, 3, 4, 5] as const).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEnergy(e)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        energy === e
                          ? 'bg-sky-500 text-white shadow'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">{ENERGY_LABELS[energy]}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Daily Reflection</label>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="What happened today? How did it make you feel?"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Gratitude</label>
                <textarea
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  placeholder="What are you grateful for today?"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Tags</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-sky-900">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                  <button type="button" onClick={addTag} className="px-3 py-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 transition-colors">Add</button>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary">
                Save Entry
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewFilter === 'all' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  All Entries
                </button>
                <button
                  onClick={() => setViewFilter('recent')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewFilter === 'recent' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  Past 7 Days
                </button>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search entries..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 w-48"
                />
              </div>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-400">
              <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium">No journal entries yet</p>
              <p className="text-sm mt-1">Start logging your mood to build a history</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${MOOD_COLORS[entry.mood]} flex items-center justify-center text-lg sm:text-xl flex-shrink-0`}>
                      {MOOD_EMOJIS[entry.mood]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-fluid-sm font-semibold text-slate-800 capitalize">{entry.mood}</p>
                      <p className="text-fluid-xs text-slate-400 truncate">{entry.date} at {entry.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-sky-100 text-sky-700 rounded-full text-fluid-xs font-medium whitespace-nowrap">
                      Energy: {entry.energy}/5
                    </span>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="r-touch text-slate-300 hover:text-red-500 transition-all"
                      aria-label="Delete entry"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {entry.reflection && (
                  <p className="text-fluid-sm text-slate-600 mb-1.5 sm:mb-2 leading-relaxed">{entry.reflection}</p>
                )}
                {entry.gratitude && (
                  <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-emerald-50 border border-emerald-100 rounded-xl mb-1.5 sm:mb-2">
                    <span className="text-emerald-500 text-fluid-sm">🙏</span>
                    <p className="text-fluid-sm text-emerald-700">{entry.gratitude}</p>
                  </div>
                )}
                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 sm:gap-1 mt-1.5 sm:mt-2">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="px-2 sm:px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] sm:text-[11px] font-medium">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
