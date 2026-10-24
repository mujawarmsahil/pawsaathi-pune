import { ArrowRight, Menu, PawPrint, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useAuthContext } from '../../hooks/useAuthContext';
import { dashboardPath } from '../../utils';
import { ProfileIconLink } from './ProfileIconLink';

type SiteHeaderProps = {
  profileTo?: string;
};

export function SiteHeader({ profileTo }: SiteHeaderProps = {}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuthContext();
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <PawPrint size={18} />
          </span>
          <span>
            PawSaathi <em>Pune</em>
          </span>
        </Link>
        <button
          className="menu-button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Main navigation">
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/caretakers">Find care</NavLink>
          {user ? (
            <>
              {profileTo && <ProfileIconLink to={profileTo} />}
              <Link className="button button-small" to={dashboardPath(user.role)}>
                My PawSaathi <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <>
              <Link className="nav-login" to="/login">
                Log in
              </Link>
              <Link className="button button-small" to="/register">
                Get started <ArrowRight size={15} />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
