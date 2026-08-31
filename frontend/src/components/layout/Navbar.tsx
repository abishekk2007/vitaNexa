import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import NotificationPanel from '../ui/NotificationPanel';
import ThemeCustomizer from '../ui/ThemeCustomizer';
import SmartSearch from '../ui/SmartSearch';

interface NavbarProps {
  variant: 'user' | 'admin';
}

export default function Navbar({ variant }: NavbarProps) {
  const { user, logout } = useAuth();
  const { toggle } = useTheme();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isUser = variant === 'user';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = useCallback((e?: React.FormEvent) => { e?.preventDefault(); setShowSearch(true); }, []);
  const handleLogout = useCallback(async () => { await logout(); navigate('/login'); }, [logout, navigate]);

  const toggleSidebar = useCallback(() => {
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      const isOpen = sidebar.classList.contains('translate-x-0');
      if (isOpen) {
        sidebar.classList.remove('translate-x-0');
        sidebar.classList.add('-translate-x-full');
      } else {
        sidebar.classList.remove('-translate-x-full');
        sidebar.classList.add('translate-x-0');
      }
    }
  }, []);

  if (isUser) {
    return (
      <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 lg:px-6 sticky top-0 z-30 shadow-sm" style={{ minHeight: 'var(--header-height)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={toggleSidebar}
            className="lg:hidden r-touch text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="hidden sm:flex items-center gap-2 flex-1 max-w-md px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400 hover:text-slate-600 hover:border-sky-200 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search modules & actions...</span>
            <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-slate-100 border border-slate-200 rounded text-slate-400">Ctrl+K</kbd>
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="sm:hidden p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <NotificationPanel />
          <ThemeCustomizer />
          <button onClick={toggle} className="r-touch text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all" title="Toggle dark/light" aria-label="Toggle theme">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="r-touch px-1.5 sm:px-2 text-sm text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-all" aria-label="Profile menu">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 animate-fade-in z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">{user?.role}</span>
                </div>
                <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors r-touch">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  Dashboard
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors r-touch">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {showSearch && <SmartSearch onClose={() => setShowSearch(false)} />}
      </>
    );
  }

  return (
    <header className="h-16 bg-gray-900/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-3 lg:px-6 sticky top-0 z-30" style={{ minHeight: 'var(--header-height)' }}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          onClick={toggleSidebar}
          className="lg:hidden r-touch text-gray-400 hover:text-white rounded-xl hover:bg-white/5"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <button onClick={() => handleSearch()} className="hidden sm:flex items-center flex-1 max-w-md px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-500">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="truncate">Search modules...</span>
        </button>
        <button onClick={() => handleSearch()} className="sm:hidden r-touch text-gray-400 hover:text-white rounded-xl hover:bg-white/5" aria-label="Search">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="r-touch text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all" title="Toggle theme" aria-label="Toggle theme">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="r-touch px-1.5 sm:px-2 text-sm text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all" aria-label="Profile menu">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-gray-800/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium text-gray-200 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <span className="inline-block mt-1 badge-info">{user?.role}</span>
              </div>
              <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors r-touch">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Dashboard
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors r-touch">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
