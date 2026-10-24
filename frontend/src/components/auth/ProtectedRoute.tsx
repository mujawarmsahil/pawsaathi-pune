import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthContext } from '../../hooks/useAuthContext';
import { ErrorState, LoadingState } from '../common/feedback/FeedbackStates';

export function ProtectedRoute() {
  const auth = useAuthContext();
  const location = useLocation();
  if (auth.isLoading) return <LoadingState label="Checking your session…" />;
  if (auth.error)
    return <ErrorState message={auth.error.message} onRetry={() => void auth.reload()} />;
  if (!auth.user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (auth.user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}
