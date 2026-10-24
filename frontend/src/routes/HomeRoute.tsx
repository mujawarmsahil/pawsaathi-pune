import { Navigate } from 'react-router-dom';

import { LoadingState } from '../components/common/feedback/FeedbackStates';
import { HomePage } from '../components/public/HomePage';
import { useAuthContext } from '../hooks/useAuthContext';
import { dashboardPath } from '../utils';

export function HomeRoute() {
  const { user, isLoading } = useAuthContext();
  if (isLoading) return <LoadingState label="Checking your session…" />;
  if (user) {
    return (
      <Navigate
        to={user.mustChangePassword ? '/change-password' : dashboardPath(user.role)}
        replace
      />
    );
  }
  return <HomePage />;
}
