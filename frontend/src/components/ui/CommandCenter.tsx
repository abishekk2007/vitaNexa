import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Action {
  id: string;
  label: string;
  icon: string;
  path: string;
  color: string;
}

const actions: Action[] = [
  { id: 'add_activity', label: 'Add Activity', icon: 'M12 4v16m8-8H4', path: '/energy', color: 'from-amber-500 to-orange-500' },
  { id: 'add_meal', label: 'Log Meal', icon: 'M12 4v16m8-8H4', path: '/nutrient', color: 'from-sky-500 to-emerald-500' },
  { id: 'add_mood', label: 'Log Mood', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', path: '/mood-journal', color: 'from-violet-500 to-purple-500' },
  { id: 'add_pain', label: 'Log Pain', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', path: '/pain-predictor', color: 'from-red-500 to-rose-500' },
  { id: 'scan', label: 'Scan Barcode', icon: 'M12 4v16m8-8H4', path: '/nutrient', color: 'from-blue-500 to-indigo-500' },
  { id: 'schedule', label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/daily-schedule', color: 'from-emerald-500 to-teal-500' },
];

export default function CommandCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50">
      <div className={`flex flex-col-reverse gap-2 mb-3 transition-all duration-300 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}>
        {actions.map((action, i) => (
          <button
            key={action.id}
            onClick={() => { navigate(action.path); setOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-lg hover:shadow-xl hover:-translate-x-1 transition-all duration-200 animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={action.icon} />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center ${open ? 'rotate-45' : ''}`}
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={open ? 'M6 18L18 6M6 6l12 12' : 'M12 4v16m8-8H4'} />
        </svg>
      </button>
    </div>
  );
}
