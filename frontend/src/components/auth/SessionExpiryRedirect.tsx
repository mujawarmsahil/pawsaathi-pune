import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

export function SessionExpiryRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const redirect = () => navigate('/login', { replace: true });
    window.addEventListener('pawsaathi:auth-invalidated', redirect);
    return () => window.removeEventListener('pawsaathi:auth-invalidated', redirect);
  }, [navigate]);
  return <Outlet />;
}
