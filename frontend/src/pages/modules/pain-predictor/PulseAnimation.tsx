export default function PulseAnimation() {
  return (
    <svg width="40" height="40" viewBox="0 0 100 40" className="opacity-80">
      <defs>
        <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#pulseGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="5,20 15,20 20,10 25,30 30,20 40,20 45,15 50,25 55,20 65,20 70,12 75,28 80,20 95,20"
        className="animate-pulse-path"
      />
      <style>{`
        @keyframes pulsePath {
          0%, 100% { stroke-dashoffset: 0; }
          50% { stroke-dashoffset: -20; }
        }
        .animate-pulse-path {
          stroke-dasharray: 200;
          animation: pulsePath 2s ease-in-out infinite;
        }
      `}</style>
    </svg>
  );
}
