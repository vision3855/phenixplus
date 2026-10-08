import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './Feedback.jsx';

/**
 * Guards protected routes. `roles` restricts to specific roles
 * (e.g. ['Admin','Manager']); unauthorized users are sent home.
 */
export default function ProtectedRoute({ roles }) {
  const { user, booting, isManager } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner label="Restoring session…" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (roles && !roles.some((r) => r === user.role)) {
    return <Navigate to="/" replace />;
  }

  // Convenience guard used by manager-only views
  if (roles === 'manager-only' && !isManager) return <Navigate to="/" replace />;

  return <Outlet />;
}
