import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { endpoints } from '../api/endpoints';
import { clearSessionCache } from '../context/queryClient';

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [logoutError, setLogoutError] = useState('');

  async function logout() {
    try {
      await endpoints.auth.logout();
      clearSessionCache(queryClient);
      navigate('/login', { replace: true });
    } catch (cause) {
      setLogoutError(cause instanceof Error ? cause.message : 'Unable to log out. Please retry.');
    }
  }

  return { logout, logoutError };
}
