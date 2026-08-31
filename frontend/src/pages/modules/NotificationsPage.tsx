import { useState, useMemo } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = notifications;
    if (filter === 'unread') result = result.filter((n) => !n.read);
    if (filter === 'read') result = result.filter((n) => n.read);
    if (typeFilter !== 'all') result = result.filter((n) => n.type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
    }
    return result;
  }, [notifications, filter, typeFilter, searchQuery]);

  const typeIcons: Record<string, string> = {
    reminder: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    achievement: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    report: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  };

  const typeColors: Record<string, string> = {
    reminder: 'bg-sky-100 text-sky-700 border-sky-200',
    achievement: 'bg-amber-100 text-amber-700 border-amber-200',
    warning: 'bg-red-100 text-red-700 border-red-200',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    info: 'bg-slate-100 text-slate-600 border-slate-200',
    report: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  const typeIconColors: Record<string, string> = {
    reminder: 'bg-sky-500', achievement: 'bg-amber-500',
    warning: 'bg-red-500', success: 'bg-emerald-500',
    info: 'bg-slate-500', report: 'bg-purple-500',
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-fluid-2xl sm:text-3xl font-bold font-fraunces text-slate-800">Notifications</h1>
          <p className="text-fluid-sm sm:text-base text-slate-500 mt-0.5 sm:mt-1">Stay updated with your health platform</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary text-fluid-sm px-3 sm:px-4 py-2 whitespace-nowrap">
            Mark All Read
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {f === 'all' && 'All'}
            {f === 'unread' && `Unread (${unreadCount})`}
            {f === 'read' && 'Read'}
          </button>
        ))}
        <div className="flex-1" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        >
          <option value="all">All Types</option>
          <option value="reminder">Reminders</option>
          <option value="achievement">Achievements</option>
          <option value="warning">Warnings</option>
          <option value="success">Success</option>
          <option value="report">Reports</option>
          <option value="info">Info</option>
        </select>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 w-48"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 sm:py-20 text-slate-400">
          <svg className="w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-fluid-base sm:text-lg font-medium">No notifications</p>
          <p className="text-fluid-sm mt-1">Notifications will appear here when there's activity</p>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white border rounded-2xl p-3 sm:p-5 shadow-sm transition-all duration-200 ${
                notif.read ? 'border-slate-200 opacity-70' : 'border-sky-200 bg-sky-50/20'
              }`}
              onClick={() => markAsRead(notif.id)}
            >
              <div className="flex items-start gap-2 sm:gap-4">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${typeColors[notif.type] || 'bg-slate-100 border border-slate-200'} flex items-center justify-center flex-shrink-0`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={typeIcons[notif.type] || typeIcons.info} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center justify-between gap-1 sm:gap-2 flex-col sm:flex-row">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                      <h3 className={`text-fluid-sm font-semibold ${notif.read ? 'text-slate-600' : 'text-slate-800'}`}>{notif.title}</h3>
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-medium capitalize border whitespace-nowrap ${
                        typeColors[notif.type] || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {notif.type}
                      </span>
                      {!notif.read && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-sky-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 self-end sm:self-auto">
                      <span className="text-fluid-xs text-slate-400 whitespace-nowrap">{timeAgo(notif.createdAt)}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        className="r-touch text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                        aria-label="Delete notification"
                      >
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-fluid-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">{notif.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
