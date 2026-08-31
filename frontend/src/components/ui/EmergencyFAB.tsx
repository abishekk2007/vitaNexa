import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmergencyFAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-3 animate-fade-in">
          <button
            onClick={() => { navigate('/emergency'); setOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-xl border border-red-200 rounded-xl shadow-lg hover:bg-white hover:shadow-red-200/50 transition-all group"
          >
            <span className="text-sm font-medium text-red-600 whitespace-nowrap">Emergency Help</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </button>
          <button
            onClick={() => { navigate('/bloodbank'); setOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-xl border border-red-200 rounded-xl shadow-lg hover:bg-white hover:shadow-red-200/50 transition-all group"
          >
            <span className="text-sm font-medium text-red-600 whitespace-nowrap">Blood Bank</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-16 h-16 rounded-full bg-white/90 backdrop-blur-xl border border-red-200 flex items-center justify-center shadow-xl hover:shadow-red-200/60 hover:scale-105 transition-all duration-300 group"
        aria-label="Emergency"
      >
        <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
        <svg className="w-8 h-8 text-red-500 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-medium text-red-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Emergency
        </span>
      </button>
    </div>
  );
}
