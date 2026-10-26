import type { Booking, Role } from '../types/api';

export function formatINR(value: number | string): string {
  return Number(value).toLocaleString('en-IN');
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN');
}

export function dashboardPath(role: Role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'CARETAKER') return '/caretaker/bookings';
  return '/app/bookings';
}

export function getCaretakerDecisionMessage(status: string) {
  if (status === 'APPROVED') {
    return { title: 'Caretaker approved', message: 'can now sign in and accept bookings.' };
  }
  if (status === 'REJECTED') {
    return { title: 'Caretaker rejected', message: 'was rejected and cannot sign in.' };
  }
  if (status === 'SUSPENDED') {
    return { title: 'Caretaker suspended', message: 'can no longer sign in or accept bookings.' };
  }
  return { title: 'Caretaker updated', message: 'was updated successfully.' };
}

export function getCustomerStatusMessage(status: string) {
  if (status === 'ACTIVE') {
    return {
      title: 'Customer activated',
      message: 'can sign in and book services again.',
    };
  }
  if (status === 'DEACTIVATED') {
    return {
      title: 'Customer deactivated',
      message: 'can no longer sign in or book services.',
    };
  }
  return { title: 'Customer updated', message: 'was updated successfully.' };
}

export function getCaretakerDetailActions(status: string) {
  if (status === 'PENDING') {
    return [
      { label: 'Approve', status: 'APPROVED', className: 'button button-small' },
      { label: 'Reject', status: 'REJECTED', className: 'review-reject' },
    ];
  }
  if (status === 'APPROVED') {
    return [
      { label: 'Suspend', status: 'SUSPENDED', className: 'button button-outline button-small' },
    ];
  }
  if (status === 'SUSPENDED' || status === 'REJECTED') {
    return [{ label: 'Approve', status: 'APPROVED', className: 'button button-small' }];
  }
  return [];
}

export function formatAdminDate(dateString: string | null) {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatAdminTime(dateString: string | null) {
  if (!dateString) return 'Not available';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes < 1) return 'Not available';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
}

export function formatAge(age: number | null) {
  if (age == null) return null;
  return `${Number(age).toFixed(age % 1 === 0 ? 0 : 1)} ${age === 1 ? 'year' : 'years'}`;
}

export function getBookingDisplayName(booking: Booking, key: 'service' | 'pet' | 'caretaker') {
  if (key === 'service') return booking.serviceName ?? booking.service_name ?? 'Pet care';
  if (key === 'pet') return booking.petName ?? booking.pet_name ?? 'Pet';
  return booking.caretakerName ?? booking.caretaker_name ?? 'Caretaker';
}

export const MAX_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;
export const IMAGE_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function readImageFileAsDataUrl(imageFile: File) {
  return new Promise<string>((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(String(fileReader.result));
    fileReader.onerror = () => reject(new Error('Could not read that image.'));
    fileReader.readAsDataURL(imageFile);
  });
}
