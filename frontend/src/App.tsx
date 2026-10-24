import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from './context/AuthProvider';
import { AppProviders } from './context/providers';
import { router } from './routes/router';

function Bootstrap() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <AppProviders>
      <Bootstrap />
    </AppProviders>
  );
}
