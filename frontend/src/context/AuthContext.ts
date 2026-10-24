import { createContext } from 'react';

import type { CurrentUser } from '../types/api';

export type AuthContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => Promise<CurrentUser | null>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
