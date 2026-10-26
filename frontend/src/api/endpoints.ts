import type {
  AccountProfile,
  AdminBookingDetail,
  AdminBookingSummary,
  AdminCaretakerDetail,
  AdminSummary,
  ApiRecord,
  Booking,
  Caretaker,
  CaretakerCandidate,
  CaretakerProfile,
  CurrentUser,
  Notification,
  Pet,
  Review,
  Service,
  ServiceArea,
  SupportTicket,
} from '../types/api';
import { apiRequest, clearAccessToken, setAccessToken } from './client';

export type AuthResponse = { token: string; user: CurrentUser };
export type RegistrationResponse = AuthResponse | { status: 'PENDING_APPROVAL'; message: string };

export const endpoints = {
  auth: {
    me: () => apiRequest<CurrentUser>('/auth/me'),
    login: async (body: { email: string; password: string }) => {
      const loginResponse = await apiRequest<AuthResponse>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(body) },
        false,
      );
      setAccessToken(loginResponse.token);
      return loginResponse;
    },
    register: async (body: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      role: 'CUSTOMER' | 'CARETAKER';
    }) => {
      const registrationResponse = await apiRequest<RegistrationResponse>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(body) },
        false,
      );
      if ('token' in registrationResponse) setAccessToken(registrationResponse.token);
      return registrationResponse;
    },
    logout: async () => {
      await apiRequest<void>('/auth/logout', { method: 'POST' }, false);
      clearAccessToken();
    },
    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      apiRequest<void>('/auth/password/change', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  account: {
    profile: () => apiRequest<AccountProfile>('/account/profile'),
    updateProfile: (body: {
      name: string;
      email: string;
      phone?: string;
      photoUrl?: string | null;
    }) =>
      apiRequest<AccountProfile>('/account/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
  },
  services: () => apiRequest<Service[]>('/services'),
  areas: () => apiRequest<ServiceArea[]>('/areas'),
  caretakers: (filters: URLSearchParams = new URLSearchParams()) =>
    apiRequest<Caretaker[]>(`/caretakers${filters.size ? `?${filters.toString()}` : ''}`),
  caretaker: (id: number) => apiRequest<Caretaker>(`/caretakers/${id}`),
  caretakerSetup: {
    profile: () => apiRequest<CaretakerProfile>('/caretaker/profile'),
    saveProfile: (body: ApiRecord) =>
      apiRequest<CaretakerProfile>('/caretaker/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    saveServices: (serviceIds: number[]) =>
      apiRequest<ApiRecord>('/caretaker/services', {
        method: 'PUT',
        body: JSON.stringify(serviceIds),
      }),
    saveAvailability: (availability: { weekday: number; startsAt: string; endsAt: string }[]) =>
      apiRequest<ApiRecord>('/caretaker/availability', {
        method: 'PUT',
        body: JSON.stringify(availability),
      }),
  },
  bookings: {
    list: () => apiRequest<Booking[]>('/bookings'),
    create: (body: ApiRecord) =>
      apiRequest<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    updateStatus: (id: number, status: string, reason?: string) =>
      apiRequest<Booking>(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
  },
  payments: {
    createOrder: (body: { bookingId: number }) =>
      apiRequest<{ keyId: string; orderId: string; amount: number; currency: string }>(
        '/payments/orders',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      ),
    verify: (body: ApiRecord) =>
      apiRequest<void>('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  pets: {
    list: () => apiRequest<Pet[]>('/pets'),
    create: (body: ApiRecord) =>
      apiRequest<Pet>('/pets', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: ApiRecord) =>
      apiRequest<Pet>(`/pets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
    archive: (id: number) => apiRequest<void>(`/pets/${id}`, { method: 'DELETE' }),
  },
  support: {
    list: () => apiRequest<SupportTicket[]>('/support/tickets'),
    create: (body: ApiRecord) =>
      apiRequest<SupportTicket>('/support/tickets', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: number, body: ApiRecord) =>
      apiRequest<SupportTicket>(`/admin/support/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
  },
  reviews: {
    create: (body: ApiRecord) =>
      apiRequest<{ submitted: string }>('/reviews', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  notifications: {
    list: () => apiRequest<Notification[]>('/notifications'),
    markRead: (id: number) => apiRequest<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
  },
  admin: {
    overview: () => apiRequest<AdminSummary>('/admin/overview'),
    caretakers: () => apiRequest<CaretakerCandidate[]>('/admin/caretakers'),
    bookings: () => apiRequest<AdminBookingSummary[]>('/bookings/admin'),
    caretakerDetail: (id: number) => apiRequest<AdminCaretakerDetail>(`/admin/caretakers/${id}`),
    caretakerBookings: (id: number) =>
      apiRequest<AdminBookingSummary[]>(`/bookings/admin/caretakers/${id}`),
    bookingDetail: (id: number) => apiRequest<AdminBookingDetail>(`/bookings/admin/${id}`),
    updateCaretaker: (id: number, status: string) =>
      apiRequest<void>(`/admin/caretakers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    reviews: () => apiRequest<Review[]>('/admin/reviews'),
    supportTickets: () => apiRequest<SupportTicket[]>('/support/tickets'),
  },
};
