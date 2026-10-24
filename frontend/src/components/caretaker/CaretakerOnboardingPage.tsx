import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { endpoints } from '../../api/endpoints';
import { useAreas, useServices } from '../../hooks/useCaretakerData';
import { ErrorState, LoadingState } from '../common/feedback/FeedbackStates';

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function CaretakerOnboardingPage() {
  const queryClient = useQueryClient();
  const servicesQuery = useServices();
  const areasQuery = useAreas();
  const [successMessage, setSuccessMessage] = useState('');
  const [onboardingError, setOnboardingError] = useState('');
  const onboardingSchema = z
    .object({
      bio: z.string().trim().min(20, 'Tell pet parents a little more about you.').max(2000),
      experienceYears: z.coerce.number().min(0).max(70),
      hourlyRate: z.coerce.number().min(100).max(10000),
      languages: z.string().max(250).optional(),
      startsAt: z.string().min(1),
      endsAt: z.string().min(1),
    })
    .refine((formValues) => formValues.endsAt > formValues.startsAt, {
      path: ['endsAt'],
      message: 'End time must follow start time.',
    });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof onboardingSchema>, unknown, z.output<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { startsAt: '09:00', endsAt: '17:00' },
  });

  if (servicesQuery.isPending || areasQuery.isPending)
    return <LoadingState label="Loading onboarding options…" />;
  if (servicesQuery.isError)
    return (
      <ErrorState
        message={servicesQuery.error.message}
        onRetry={() => void servicesQuery.refetch()}
      />
    );
  if (areasQuery.isError)
    return (
      <ErrorState message={areasQuery.error.message} onRetry={() => void areasQuery.refetch()} />
    );

  async function saveOnboarding(
    onboardingValues: z.infer<typeof onboardingSchema>,
    event?: { target: EventTarget | null },
  ) {
    setOnboardingError('');
    setSuccessMessage('');
    const onboardingFormElement = event?.target as HTMLFormElement | null;
    if (!onboardingFormElement) return;
    const onboardingFormData = new FormData(onboardingFormElement);
    const selectedServiceIds = onboardingFormData.getAll('serviceIds').map(Number);
    const selectedAreaNames = onboardingFormData.getAll('areas').map(String);
    const selectedWeekdays = onboardingFormData.getAll('weekdays').map(Number);
    if (
      selectedServiceIds.length === 0 ||
      selectedAreaNames.length === 0 ||
      selectedWeekdays.length === 0
    ) {
      setOnboardingError('Select at least one service, service area, and availability day.');
      return;
    }
    try {
      const savedCaretakerProfile = await endpoints.caretakerSetup.saveProfile({
        bio: onboardingValues.bio,
        experienceYears: onboardingValues.experienceYears,
        hourlyRate: onboardingValues.hourlyRate,
        serviceAreas: selectedAreaNames.join(', '),
        languages: onboardingValues.languages ?? '',
        serviceTypes: '',
      });
      await endpoints.caretakerSetup.saveServices(selectedServiceIds);
      await endpoints.caretakerSetup.saveAvailability(
        selectedWeekdays.map((weekday) => ({
          weekday,
          startsAt: onboardingValues.startsAt,
          endsAt: onboardingValues.endsAt,
        })),
      );
      queryClient.setQueryData(['caretaker', 'profile'], savedCaretakerProfile);
      setSuccessMessage(
        'Your profile and availability are saved. Your listing is now visible to pet parents.',
      );
    } catch (cause) {
      setOnboardingError(
        cause instanceof Error ? cause.message : 'Could not save onboarding details.',
      );
    }
  }

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Caretaker onboarding</p>
          <h1>Let pet parents get to know you.</h1>
          <p>Complete each step so local pet parents can find and book you.</p>
        </div>
      </div>
      <ol className="onboarding-steps">
        <li>
          <span>1</span>Profile & rates
        </li>
        <li>
          <span>2</span>Services & areas
        </li>
        <li>
          <span>3</span>Availability & documents
        </li>
      </ol>
      <form className="setup-card" onSubmit={handleSubmit(saveOnboarding)}>
        <label htmlFor="caretaker-bio">About you</label>
        <textarea id="caretaker-bio" rows={4} {...register('bio')} />
        {errors.bio && <span className="form-error">{errors.bio.message}</span>}
        <div className="date-time">
          <div>
            <label htmlFor="caretaker-experience">Years of experience</label>
            <input
              id="caretaker-experience"
              type="number"
              min="0"
              max="70"
              step="0.5"
              {...register('experienceYears')}
            />
            {errors.experienceYears && (
              <span className="form-error">{errors.experienceYears.message}</span>
            )}
          </div>
          <div>
            <label htmlFor="caretaker-rate">Hourly rate (₹)</label>
            <input
              id="caretaker-rate"
              type="number"
              min="100"
              max="10000"
              {...register('hourlyRate')}
            />
            {errors.hourlyRate && <span className="form-error">{errors.hourlyRate.message}</span>}
          </div>
        </div>
        <label htmlFor="caretaker-languages">Languages</label>
        <input
          id="caretaker-languages"
          placeholder="English, Hindi, Marathi"
          {...register('languages')}
        />
        <fieldset>
          <legend>Services you offer</legend>
          {servicesQuery.data.map((service) => (
            <label className="check-label" key={service.id}>
              <input type="checkbox" name="serviceIds" value={service.id} />
              {service.name}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Pune areas you serve</legend>
          <div className="onboarding-check-grid">
            {areasQuery.data.map((area) => (
              <label className="check-label" key={area.id}>
                <input type="checkbox" name="areas" value={area.name} />
                {area.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Weekly availability</legend>
          <div className="onboarding-check-grid">
            {weekdays.map((day, index) => (
              <label className="check-label" key={day}>
                <input type="checkbox" name="weekdays" value={index} />
                {day}
              </label>
            ))}
          </div>
          <div className="date-time">
            <div>
              <label htmlFor="available-from">From</label>
              <input id="available-from" type="time" {...register('startsAt')} />
            </div>
            <div>
              <label htmlFor="available-until">Until</label>
              <input id="available-until" type="time" {...register('endsAt')} />
              {errors.endsAt && <span className="form-error">{errors.endsAt.message}</span>}
            </div>
          </div>
        </fieldset>
        <p className="muted-label" role="status">
          Document submission is coming soon. Your profile, services, areas, and availability can be
          saved now.
        </p>
        <button className="button">
          <Upload size={16} /> Save onboarding
        </button>
        {successMessage && (
          <p className="success" role="status">
            {successMessage}
          </p>
        )}
        {onboardingError && (
          <p className="alert" role="alert">
            {onboardingError}
          </p>
        )}
      </form>
    </>
  );
}
