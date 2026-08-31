import { useEffect, useState } from 'react';
import Confetti from './Confetti';

export interface AchievementToastData {
  icon: string;
  title: string;
  description: string;
}

interface AchievementToastProps {
  data: AchievementToastData | null;
  onDismiss: () => void;
}

export default function AchievementToast({ data, onDismiss }: AchievementToastProps) {
  const [show, setShow] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (data) {
      setShowConfetti(true);
      setTimeout(() => setShow(true), 100);
      const hideTimer = setTimeout(() => {
        setShow(false);
        setTimeout(() => { onDismiss(); setShowConfetti(false); }, 500);
      }, 4000);
      return () => clearTimeout(hideTimer);
    }
  }, [data, onDismiss]);

  if (!data) return null;

  return (
    <>
      <Confetti active={showConfetti} duration={3000} />
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] transition-all duration-500 ${
          show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-10 scale-75'
        }`}
      >
        <div className="bg-white border-2 border-amber-200 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[320px]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-2xl animate-bounce">
            {data.icon}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-600 uppercase tracking-wider">Achievement Unlocked!</p>
            <p className="text-lg font-bold text-slate-800">{data.title}</p>
            <p className="text-sm text-slate-500">{data.description}</p>
          </div>
          <button onClick={() => { setShow(false); setTimeout(() => onDismiss(), 500); }} className="text-slate-300 hover:text-slate-500 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
