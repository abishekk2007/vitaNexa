import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: path=', location.pathname, 'loading=', loading, 'user=', !!user, 'role=', user?.role, 'adminOnly=', adminOnly);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loading size="lg" text="Loading your session..." />
    </div>
  );
  if (!user) {
    console.log('ProtectedRoute: no user, redirecting to /login from', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && user?.role !== 'ADMIN') {
    console.log('ProtectedRoute: adminOnly but role is', user?.role, 'redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
