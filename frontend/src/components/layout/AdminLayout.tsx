import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ErrorBoundary from '../ui/ErrorBoundary';

function AdminLayoutInner() {
  return (
    <div className="admin-layout flex h-screen bg-gray-950 text-gray-100" style={{ paddingTop: 'var(--safe-area-top)' }}>
      <Sidebar variant="admin" />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <Navbar variant="admin" />
        <main className="flex-1 overflow-y-auto r-page">
          <div className="mx-auto animate-fade-in" style={{ maxWidth: 'var(--container-max)' }}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <ErrorBoundary fallback="Admin Module Failed To Load">
      <AdminLayoutInner />
    </ErrorBoundary>
  );
}
