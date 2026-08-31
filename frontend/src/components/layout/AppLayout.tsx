import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ErrorBoundary from '../ui/ErrorBoundary';
import EmergencyFAB from '../ui/EmergencyFAB';
import CommandCenter from '../ui/CommandCenter';
import SmartSearch from '../ui/SmartSearch';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export default function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900" style={{ paddingTop: 'var(--safe-area-top)' }}>
      <Sidebar variant="user" />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <Navbar variant="user" />
        <main className="flex-1 overflow-y-auto r-page">
          <div className="mx-auto animate-fade-in" style={{ maxWidth: 'var(--container-max)' }}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <EmergencyFAB />
      <CommandCenter />
      {searchOpen && <SmartSearch onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
