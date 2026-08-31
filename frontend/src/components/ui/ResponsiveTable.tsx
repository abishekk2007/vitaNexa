import { useBreakpoint } from '../../hooks/useBreakpoint';

interface Column {
  key: string;
  label: string;
  render?: (item: any) => React.ReactNode;
  hideOn?: 'mobile' | 'tablet' | 'mobile-tablet';
  priority?: number;
}

interface Props {
  columns: Column[];
  data: any[];
  keyExtractor: (item: any) => string;
  className?: string;
  emptyMessage?: string;
  cardTemplate?: (item: any) => React.ReactNode;
}

export default function ResponsiveTable({ columns, data, keyExtractor, className = '', emptyMessage = 'No data available', cardTemplate }: Props) {
  const { isMobile, isTablet } = useBreakpoint();

  if (data.length === 0) {
    return <div className="text-center py-8 text-slate-400 text-sm">{emptyMessage}</div>;
  }

  const visibleColumns = columns.filter((col) => {
    if (col.hideOn === 'mobile' && isMobile) return false;
    if (col.hideOn === 'tablet' && isTablet) return false;
    if (col.hideOn === 'mobile-tablet' && (isMobile || isTablet)) return false;
    return true;
  });

  if (isMobile && cardTemplate) {
    return (
      <div className="r-stack" role="list">
        {data.map((item) => (
          <div key={keyExtractor(item)} className="r-card" role="listitem">
            {cardTemplate(item)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="r-table-wrap rounded-xl border border-slate-200">
      <table className={`w-full text-sm ${className}`}>
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {visibleColumns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="hover:bg-slate-50 transition-colors">
              {visibleColumns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {col.render ? col.render(item) : item[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
