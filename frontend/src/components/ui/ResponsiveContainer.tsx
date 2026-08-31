import { useBreakpoint } from '../../hooks/useBreakpoint';

interface Props {
  children: React.ReactNode;
  as?: 'div' | 'section' | 'article' | 'main';
  className?: string;
  maxWidth?: string;
  padding?: boolean;
}

export default function ResponsiveContainer({ children, as: Tag = 'div', className = '', maxWidth, padding = true }: Props) {
  const { isMobile } = useBreakpoint();
  return (
    <Tag
      className={`${padding ? (isMobile ? 'px-3' : 'px-4 lg:px-6') : ''} ${maxWidth ? '' : 'mx-auto'} ${className}`}
      style={maxWidth ? { maxWidth, marginLeft: 'auto', marginRight: 'auto' } : undefined}
    >
      {children}
    </Tag>
  );
}
