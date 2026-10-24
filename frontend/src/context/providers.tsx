import { QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useEffect } from 'react';

import { clearAccessToken, sessionExpiredEvent } from '../api/client';
import { clearSessionCache, queryClient } from './queryClient';
import { ToastProvider } from './ToastProvider';

function SessionLifecycle({ children }: { children: ReactNode }) {
  useEffect(() => {
    const expireSession = () => {
      clearAccessToken();
      clearSessionCache(queryClient);
      window.dispatchEvent(new Event('pawsaathi:auth-invalidated'));
    };
    window.addEventListener(sessionExpiredEvent, expireSession);
    return () => window.removeEventListener(sessionExpiredEvent, expireSession);
  }, []);
  return children;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionLifecycle>
        <ToastProvider>{children}</ToastProvider>
      </SessionLifecycle>
    </QueryClientProvider>
  );
}
