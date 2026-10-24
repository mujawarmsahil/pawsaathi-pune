import { Navigate, Outlet } from 'react-router-dom';

import { useAuthContext } from '../../hooks/useAuthContext';
import type { Role } from '../../types/api';
import { dashboardPath } from '../../utils';

export function RoleRoute({ roles }: { roles: Role[] }) {
  const { user } = useAuthContext();
  if (!user) return <Navigate to="/login" replace />;
  return roles.includes(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to={dashboardPath(user.role)} replace />
  );
}
