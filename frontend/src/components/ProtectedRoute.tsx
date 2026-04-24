import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth, type UserRole } from '../context/AuthContext';

interface Props {
  children: ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="loading-spinner" />
          <p className="auth-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their correct home based on role
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/jobs'} replace />;
  }

  return <>{children}</>;
}
