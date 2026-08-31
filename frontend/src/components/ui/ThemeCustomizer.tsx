import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeOption {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  dark: boolean;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'default-dark', label: 'Dark', primary: '#0EA5E9', secondary: '#10B981', dark: true },
  { id: 'default-light', label: 'Light', primary: '#0EA5E9', secondary: '#10B981', dark: false },
  { id: 'midnight', label: 'Midnight', primary: '#8B5CF6', secondary: '#06B6D4', dark: true },
  { id: 'forest', label: 'Forest', primary: '#22C55E', secondary: '#10B981', dark: true },
  { id: 'sunset', label: 'Sunset', primary: '#F59E0B', secondary: '#EF4444', dark: false },
  { id: 'ocean', label: 'Ocean', primary: '#0EA5E9', secondary: '#06B6D4', dark: true },
  { id: 'rose', label: 'Rose', primary: '#EC4899', secondary: '#8B5CF6', dark: false },
  { id: 'slate', label: 'Slate', primary: '#64748B', secondary: '#94A3B8', dark: true },
];

export default function ThemeCustomizer() {
  const { dark, toggle, theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
        title="Customize theme"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-fade-in z-50">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Theme Customizer</h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Dark Mode</span>
              <button
                onClick={toggle}
                className={`relative w-10 h-5 rounded-full transition-colors ${dark ? 'bg-sky-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Color Scheme</p>
              <div className="grid grid-cols-4 gap-2">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id as any)}
                    className={`p-2 rounded-xl border-2 transition-all ${
                      theme === opt.id ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex gap-1 mb-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: opt.primary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: opt.secondary }} />
                    </div>
                    <p className="text-[10px] text-slate-500 text-center">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
