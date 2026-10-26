import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { RoleRoute } from '../components/auth/RoleRoute';
import { SessionExpiryRedirect } from '../components/auth/SessionExpiryRedirect';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { PublicLayout } from '../components/layout/PublicLayout';
import {
  AdminCaretakerDetailPage,
  AdminCaretakersPage,
  AdminCustomerDetailPage,
  AdminCustomersPage,
  AdminOverviewPage,
  AdminProfilePage,
  AdminResourcePage,
  AdminReviewsPage,
  AdminSupportPage,
  BookingDetailPage as AdminBookingDetailPage,
  BookingsPage,
} from '../pages/admin/AdminPages';
import { LoginPage, PasswordChangePage, RegisterPage } from '../pages/auth/AuthPages';
import {
  CaretakerBookingsPage,
  CaretakerEarningsPage,
  CaretakerOnboardingPage,
  CaretakerProfileEditorPage,
} from '../pages/caretaker/CaretakerPages';
import {
  BookingDetailPage as CustomerBookingDetailPage,
  CustomerBookingsPage,
  CustomerProfilePage,
  NotificationsPage,
  PetsPage,
  SupportPage,
} from '../pages/customer/CustomerPages';
import {
  CaretakerDirectoryPage,
  CaretakerProfilePage,
  ServicesPage,
} from '../pages/public/DiscoveryPages';
import type { Role } from '../types/api';
import { HomeRoute } from './HomeRoute';

const roleGate = (roles: Role[]) => <RoleRoute roles={roles} />;

export const router = createBrowserRouter([
  {
    element: <SessionExpiryRedirect />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: '/', element: <HomeRoute /> },
          { path: '/services', element: <ServicesPage /> },
          { path: '/caretakers', element: <CaretakerDirectoryPage /> },
          { path: '/caretakers/:id', element: <CaretakerProfilePage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/change-password', element: <PasswordChangePage /> },
          {
            element: roleGate(['CUSTOMER']),
            children: [
              {
                element: <AppLayout />,
                children: [
                  { path: '/app/bookings', element: <CustomerBookingsPage /> },
                  { path: '/app/bookings/:id', element: <CustomerBookingDetailPage /> },
                  { path: '/app/notifications', element: <NotificationsPage /> },
                  { path: '/app/pets', element: <PetsPage /> },
                  { path: '/app/profile', element: <CustomerProfilePage /> },
                  { path: '/app/support', element: <SupportPage /> },
                ],
              },
            ],
          },
          {
            element: roleGate(['CARETAKER']),
            children: [
              {
                element: <AppLayout />,
                children: [
                  { path: '/caretaker/onboarding', element: <CaretakerOnboardingPage /> },
                  { path: '/caretaker/bookings', element: <CaretakerBookingsPage /> },
                  { path: '/caretaker/profile', element: <CaretakerProfileEditorPage /> },
                  { path: '/caretaker/earnings', element: <CaretakerEarningsPage /> },
                ],
              },
            ],
          },
          {
            element: roleGate(['ADMIN']),
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { path: '/admin', element: <AdminOverviewPage /> },
                  { path: '/admin/customers', element: <AdminCustomersPage /> },
                  { path: '/admin/customers/:id', element: <AdminCustomerDetailPage /> },
                  { path: '/admin/caretakers', element: <AdminCaretakersPage /> },
                  { path: '/admin/caretakers/:id', element: <AdminCaretakerDetailPage /> },
                  { path: '/admin/bookings/:id', element: <AdminBookingDetailPage /> },
                  { path: '/admin/reviews', element: <AdminReviewsPage /> },
                  { path: '/admin/support', element: <AdminSupportPage /> },
                  { path: '/admin/profile', element: <AdminProfilePage /> },
                  { path: '/admin/bookings', element: <BookingsPage /> },
                  { path: '/admin/users', element: <AdminResourcePage /> },
                  { path: '/admin/services', element: <AdminResourcePage /> },
                  { path: '/admin/payments', element: <AdminResourcePage /> },
                  { path: '/admin/audit', element: <AdminResourcePage /> },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
