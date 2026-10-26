import { LogOut } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useLogout } from '../../hooks/useLogout';
import { SiteHeader } from './SiteHeader';

const adminLinks = [
  ['/admin', 'Overview'],
  ['/admin/customers', 'Customers'],
  ['/admin/caretakers', 'Caretakers'],
  ['/admin/bookings', 'Bookings'],
  ['/admin/reviews', 'Reviews'],
  ['/admin/support', 'Support'],
];

export function AdminLayout() {
  const { logout, logoutError } = useLogout();

  return (
    <div className="admin-layout">
      <SiteHeader profileTo="/admin/profile" />
      {logoutError && (
        <div className="container alert" role="alert">
          {logoutError}
        </div>
      )}
      <div className="container admin-shell">
        <aside className="admin-nav" aria-label="Admin navigation">
          {adminLinks.map(([to, label]) => (
            <NavLink key={to} end={to === '/admin'} to={to}>
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            className="logout-button admin-logout"
            onClick={() => void logout()}
          >
            <LogOut size={15} /> Log out
          </button>
        </aside>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
      <footer className="admin-footer">
        <Link to="/">PawSaathi Pune</Link> · Administration
      </footer>
    </div>
  );
}
