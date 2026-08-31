import { useState, useRef, useEffect, useCallback } from 'react';
import { useSmartSearch, SearchResult } from '../../hooks/useSmartSearch';

interface SmartSearchProps {
  onClose: () => void;
}

export default function SmartSearch({ onClose }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { search, navigateTo } = useSmartSearch();
  const results = search(query);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIndex]) {
      navigateTo(results[selectedIndex]);
      onClose();
    }
    if (e.key === 'Escape') onClose();
  }, [results, selectedIndex, navigateTo, onClose]);

  const handleSelect = (result: SearchResult) => {
    navigateTo(result);
    onClose();
  };

  const categoryIcons: Record<string, string> = {
    module: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z',
    action: 'M12 4v16m8-8H4',
    setting: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  };

  const categoryColors: Record<string, string> = {
    module: 'from-sky-500/20 to-emerald-500/20 text-sky-600',
    action: 'from-amber-500/20 to-orange-500/20 text-amber-600',
    setting: 'from-slate-500/20 to-gray-500/20 text-slate-600',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, actions, settings..."
            className="flex-1 text-base text-slate-800 placeholder-slate-400 bg-transparent border-none outline-none focus:ring-0"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-slate-400 bg-slate-100 rounded-md">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center py-8 text-slate-400">
              <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}
          {!query.trim() && (
            <div className="p-3">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Ctrl+K', desc: 'Open search' },
                  { label: 'G then D', desc: 'Go to Dashboard' },
                  { label: 'G then N', desc: 'Go to Nutrient' },
                  { label: 'G then E', desc: 'Go to Energy' },
                ].map((shortcut) => (
                  <div key={shortcut.label} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                    <kbd className="px-1.5 py-0.5 text-xs bg-white border border-slate-200 rounded font-mono text-slate-500">{shortcut.label}</kbd>
                    <span className="text-xs text-slate-500">{shortcut.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {results.map((result, i) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 ${
                i === selectedIndex ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50 border border-transparent'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${categoryColors[result.category]} flex items-center justify-center flex-shrink-0`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={categoryIcons[result.category] || categoryIcons.module} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${i === selectedIndex ? 'text-sky-700' : 'text-slate-700'}`}>{result.title}</p>
                <p className="text-xs text-slate-400 truncate">{result.description}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                result.category === 'module' ? 'bg-sky-100 text-sky-600' :
                result.category === 'action' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
              }`}>
                {result.category}
              </span>
            </button>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
