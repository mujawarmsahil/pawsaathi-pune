import { LogOut, PawPrint } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuthContext } from '../../hooks/useAuthContext';
import { useLogout } from '../../hooks/useLogout';
import { ProfileIconLink } from './ProfileIconLink';

export function AppLayout() {
  const { user } = useAuthContext();
  const { logout, logoutError } = useLogout();
  const links =
    user?.role === 'CARETAKER'
      ? [
          ['/caretaker/bookings', 'Bookings'],
          ['/caretaker/onboarding', 'Onboarding'],
        ]
      : [
          ['/app/bookings', 'Bookings'],
          ['/app/pets', 'My pets'],
          ['/app/notifications', 'Notifications'],
          ['/app/support', 'Support'],
        ];
  return (
    <>
      <header className="site-header app-header">
        <div className="container nav-wrap">
          <Link className="brand" to="/">
            <span className="brand-mark">
              <PawPrint size={18} />
            </span>
            <span>
              PawSaathi <em>Pune</em>
            </span>
          </Link>
          <nav className="app-nav" aria-label="Account navigation">
            {links.map(([path, label]) => (
              <NavLink key={path} to={path}>
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              className="logout-button"
              aria-label="Log out"
              title="Log out"
              onClick={() => void logout()}
            >
              <LogOut size={15} /> <span className="logout-label">Log out</span>
            </button>
            <ProfileIconLink
              to={user?.role === 'CARETAKER' ? '/caretaker/profile' : '/app/profile'}
            />
          </nav>
        </div>
      </header>
      {logoutError && (
        <div className="container alert" role="alert">
          {logoutError}
        </div>
      )}
      <main className="container dashboard-page">
        <Outlet />
      </main>
    </>
  );
}
