import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { endpoints } from '../../api/endpoints';
import { CaretakerOnboardingPage } from '../../components/caretaker/CaretakerPages';

function renderOnboarding() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CaretakerOnboardingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('caretaker onboarding', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('saves profile, services, areas, and availability from the form', async () => {
    vi.spyOn(endpoints, 'services').mockResolvedValue([
      { id: 1, name: 'Pet walking', description: 'Walks', hourlyRate: 450 },
    ]);
    vi.spyOn(endpoints, 'areas').mockResolvedValue([{ id: 1, name: 'Aundh', city: 'Pune' }]);
    const saveProfile = vi.spyOn(endpoints.caretakerSetup, 'saveProfile').mockResolvedValue({
      id: 1,
      userId: 9,
      bio: 'Patient and reliable local pet care.',
      experienceYears: 3,
      hourlyRate: 450,
      serviceAreas: 'Aundh',
      photoUrl: null,
      languages: 'English',
      serviceTypes: '',
      approvalStatus: 'APPROVED',
      verified: false,
    });
    const saveServices = vi.spyOn(endpoints.caretakerSetup, 'saveServices').mockResolvedValue({});
    const saveAvailability = vi
      .spyOn(endpoints.caretakerSetup, 'saveAvailability')
      .mockResolvedValue({});

    renderOnboarding();
    fireEvent.change(await screen.findByLabelText('About you'), {
      target: { value: 'Patient and reliable local pet care.' },
    });
    fireEvent.change(screen.getByLabelText('Years of experience'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Hourly rate (₹)'), { target: { value: '450' } });
    fireEvent.click(await screen.findByLabelText('Pet walking'));
    fireEvent.click(await screen.findByLabelText('Aundh'));
    fireEvent.click(await screen.findByLabelText('Monday'));
    fireEvent.click(screen.getByRole('button', { name: /save onboarding/i }));

    await waitFor(() => expect(saveAvailability).toHaveBeenCalledOnce());
    expect(saveProfile).toHaveBeenCalledWith(
      expect.objectContaining({ bio: 'Patient and reliable local pet care.', hourlyRate: 450 }),
    );
    expect(saveServices).toHaveBeenCalledWith([1]);
    expect(saveAvailability).toHaveBeenCalledWith([
      expect.objectContaining({ weekday: 0, startsAt: '09:00', endsAt: '17:00' }),
    ]);
    expect(await screen.findByText(/Your profile and availability are saved/)).toBeInTheDocument();
  });
});
