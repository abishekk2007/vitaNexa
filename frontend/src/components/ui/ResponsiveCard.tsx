import { useBreakpoint } from '../../hooks/useBreakpoint';

interface Props {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
  onClick?: () => void;
  role?: string;
  ariaLabel?: string;
}

export default function ResponsiveCard({ children, className = '', padding = true, hover = false, onClick, role, ariaLabel }: Props) {
  const { isMobile } = useBreakpoint();

  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl ${padding ? (isMobile ? 'p-3' : 'p-4 lg:p-5') : ''} ${hover ? 'hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
