export type Role = 'CUSTOMER' | 'CARETAKER' | 'ADMIN';

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
};

export type AccountProfile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  role: Role;
  status: string;
  verified: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Service = {
  id: number;
  name: string;
  description: string;
  hourlyRate: number;
};

export type ServiceArea = {
  id: number;
  name: string;
  city: string;
};

export type CaretakerProfile = {
  id: number;
  userId: number;
  bio: string | null;
  experienceYears: number | null;
  hourlyRate: number;
  serviceAreas: string;
  photoUrl: string | null;
  languages: string | null;
  serviceTypes: string | null;
  approvalStatus: string;
  verified: boolean;
};

export type Caretaker = {
  id: number;
  name: string;
  bio: string | null;
  experienceYears: number | null;
  hourlyRate: number;
  serviceAreas: string;
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number;
  services?: Service[];
  areas?: ServiceArea[];
};

export type Pet = {
  id: number;
  name: string;
  species: string;
  breed?: string;
  ageYears?: number;
  notes?: string;
};

export type Booking = {
  id: number;
  caretakerId?: number;
  customerId?: number;
  petId?: number;
  serviceId?: number;
  status: string;
  startsAt: string;
  endsAt: string;
  hourlyRate: number;
  serviceName?: string;
  service_name?: string;
  petName?: string;
  pet_name?: string;
  customerName?: string;
  customer_name?: string;
  caretakerName?: string;
  caretaker_name?: string;
};

export type PageResult<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type AdminSummary = {
  customers: number;
  caretakers: number;
  pendingCaretakers: number;
  bookings: number;
  openTickets: number;
};

export type AdminCaretakerReview = {
  id: number;
  rating: number;
  comment: string | null;
  moderationStatus: string;
  bookingId: number;
  author: string;
  caretaker: string;
  createdAt: string;
};

export type AdminCaretakerDetail = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  bio: string | null;
  experienceYears: number | null;
  hourlyRate: number;
  serviceAreas: string;
  languages: string | null;
  approvalStatus: string;
  verified: boolean;
  registeredAt: string;
  updatedAt: string;
  rating: number;
  reviewCount: number;
  services: Service[];
  areas: ServiceArea[];
  reviews: AdminCaretakerReview[];
};

export type AdminBookingSummary = {
  id: number;
  status: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  hourlyRate: number;
  totalAmount: number;
  serviceName: string;
  petName: string;
  customerName: string;
  createdAt: string;
};

export type AdminBookingCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

export type AdminBookingCaretaker = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
};

export type AdminBookingPet = {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  ageYears: number | null;
  notes: string | null;
  photoUrl: string | null;
};

export type AdminBookingPayment = {
  status: string;
  amount: number;
  currency: string;
};

export type AdminBookingDetail = {
  id: number;
  status: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  hourlyRate: number;
  totalAmount: number;
  location: string | null;
  notes: string | null;
  createdAt: string;
  serviceName: string;
  serviceDescription: string | null;
  customer: AdminBookingCustomer;
  caretaker: AdminBookingCaretaker;
  pet: AdminBookingPet;
  payment: AdminBookingPayment | null;
};

export type CaretakerCandidate = {
  id: number;
  name: string;
  email: string;
  photoUrl: string | null;
  hourlyRate: number;
  serviceAreas: string;
  approvalStatus: string;
  verified: boolean;
};

export type SupportTicket = {
  id: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
};

export type Notification = {
  id: number;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
};

export type Review = {
  id: number;
  rating: number;
  comment: string;
  moderationStatus: string;
  createdAt: string;
};

export type ApiRecord = Record<string, unknown>;
