import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../lib/firebase';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // If Firebase isn't configured, don't block the UI behind auth.
  if (!isFirebaseConfigured) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="loading-spinner" />
          <p className="auth-subtitle">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
