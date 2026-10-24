import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Upload } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { endpoints } from '../../api/endpoints';
import demoProfilePhoto from '../../assets/demo-profile.svg';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useToast } from '../../hooks/useToast';
import type { AccountProfile, Role } from '../../types/api';
import { PasswordChangePanel } from '../auth/AuthPages';
import { ErrorState, LoadingState } from '../common/feedback/FeedbackStates';
import { ConfirmDialog } from '../common/ui/ConfirmDialog';
import { ProfileImage } from '../common/ui/ProfileImage';
import { StatusBadge } from '../common/ui/StatusBadge';

const accountProfileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(180),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine(
      (phoneValue) => phoneValue === '' || /^[0-9+()\-\s]{7,30}$/.test(phoneValue),
      'Enter a valid phone number.',
    ),
});

const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const roleDisplayNames: Record<Role, string> = {
  CUSTOMER: 'Pet parent',
  CARETAKER: 'Caretaker',
  ADMIN: 'Administrator',
};

const profileGuidanceByRole: Record<Role, { intro: string; phone: string }> = {
  CUSTOMER: {
    intro: 'Keep these details current so booking updates reach you.',
    phone: 'Optional. Used only for booking coordination.',
  },
  CARETAKER: {
    intro: 'Keep these details current so customers and PawSaathi can reach you.',
    phone: 'Optional. Used only for booking coordination.',
  },
  ADMIN: {
    intro: 'Keep these details current for account and operational communications.',
    phone: 'Optional. Used for account and operational contact.',
  },
};

function readProfilePhotoAsDataUrl(photoFile: File) {
  return new Promise<string>((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => resolve(String(fileReader.result));
    fileReader.onerror = () => reject(new Error('Could not read that image.'));
    fileReader.readAsDataURL(photoFile);
  });
}

function formatProfileDateLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function AccountProfileForm({ profile }: { profile: AccountProfile }) {
  const { reload } = useAuthContext();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [draftPhotoUrl, setDraftPhotoUrl] = useState(profile.photoUrl);
  const [hasPendingPhotoChange, setHasPendingPhotoChange] = useState(false);
  const [photoValidationError, setPhotoValidationError] = useState('');
  const [pendingProfileValues, setPendingProfileValues] = useState<z.infer<
    typeof accountProfileSchema
  > | null>(null);
  const [isSaveConfirmationOpen, setIsSaveConfirmationOpen] = useState(false);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<z.infer<typeof accountProfileSchema>>({
    resolver: zodResolver(accountProfileSchema),
    defaultValues: {
      name: profile.name,
      email: profile.email,
      phone: profile.phone ?? '',
    },
  });
  const profileUpdateMutation = useMutation({ mutationFn: endpoints.account.updateProfile });

  async function handlePhotoSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedPhotoFile = event.target.files?.[0];
    event.target.value = '';
    if (!selectedPhotoFile) return;
    setPhotoValidationError('');
    if (!PROFILE_PHOTO_TYPES.includes(selectedPhotoFile.type)) {
      setPhotoValidationError('Choose a JPG, PNG or WebP image.');
      return;
    }
    if (selectedPhotoFile.size > MAX_PROFILE_PHOTO_BYTES) {
      setPhotoValidationError('Profile picture must be 2 MB or smaller.');
      return;
    }
    try {
      setDraftPhotoUrl(await readProfilePhotoAsDataUrl(selectedPhotoFile));
      setHasPendingPhotoChange(true);
    } catch {
      setPhotoValidationError('Could not read that image. Try another file.');
    }
  }

  function handlePhotoRemoval() {
    setDraftPhotoUrl(null);
    setHasPendingPhotoChange(true);
    setPhotoValidationError('');
  }

  function closeSaveConfirmation() {
    if (profileUpdateMutation.isPending) return;
    setIsSaveConfirmationOpen(false);
    setPendingProfileValues(null);
  }

  async function persistProfileChanges() {
    if (!pendingProfileValues) return;
    try {
      const updatedProfile = await profileUpdateMutation.mutateAsync({
        name: pendingProfileValues.name,
        email: pendingProfileValues.email,
        phone: pendingProfileValues.phone || undefined,
        photoUrl: draftPhotoUrl ?? null,
      });
      queryClient.setQueryData(['account', 'profile'], updatedProfile);
      setDraftPhotoUrl(updatedProfile.photoUrl);
      setHasPendingPhotoChange(false);
      reset({
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone ?? '',
      });
      await reload().catch(() => undefined);
      setIsSaveConfirmationOpen(false);
      setPendingProfileValues(null);
      toast.success('Profile saved', 'Your profile details have been updated.');
    } catch (error) {
      setIsSaveConfirmationOpen(false);
      toast.error(
        'Profile update failed',
        error instanceof Error ? error.message : 'Could not update your profile. Try again.',
      );
    }
  }

  return (
    <section className="profile-setup account-profile-form">
      <h2>Personal details</h2>
      <p>{profileGuidanceByRole[profile.role].intro}</p>
      <form
        onSubmit={handleSubmit((submittedProfileValues) => {
          setPendingProfileValues(submittedProfileValues);
          setIsSaveConfirmationOpen(true);
        })}
      >
        <div className="account-photo-editor">
          <ProfileImage
            className="account-photo-preview"
            src={draftPhotoUrl}
            name={profile.name}
            fallbackSrc={demoProfilePhoto}
            loading="eager"
          />
          <div className="account-photo-controls">
            <strong>Profile picture</strong>
            <span id="account-photo-hint">
              JPG, PNG or WebP up to 2 MB. Without a photo, the PawSaathi demo avatar is used.
            </span>
            <div className="account-photo-actions">
              <button
                type="button"
                className="button button-outline button-small"
                onClick={() => photoFileInputRef.current?.click()}
              >
                <Upload size={15} /> {draftPhotoUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {draftPhotoUrl && (
                <button
                  type="button"
                  className="button button-outline button-small"
                  onClick={handlePhotoRemoval}
                >
                  <Trash2 size={15} /> Remove
                </button>
              )}
            </div>
            <input
              ref={photoFileInputRef}
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Profile picture"
              aria-describedby="account-photo-hint"
              onChange={handlePhotoSelection}
            />
            {photoValidationError && (
              <span className="form-error" role="alert">
                {photoValidationError}
              </span>
            )}
          </div>
        </div>

        <label htmlFor="account-name">Full name</label>
        <input
          id="account-name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          {...register('name')}
        />
        {errors.name && <span className="form-error">{errors.name.message}</span>}

        <label htmlFor="account-email">Email address</label>
        <input
          id="account-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          {...register('email')}
        />
        {errors.email && <span className="form-error">{errors.email.message}</span>}

        <label htmlFor="account-phone">Phone number</label>
        <input
          id="account-phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          {...register('phone')}
        />
        <span className="input-hint">{profileGuidanceByRole[profile.role].phone}</span>
        {errors.phone && <span className="form-error">{errors.phone.message}</span>}

        <button
          className="button"
          disabled={profileUpdateMutation.isPending || (!isDirty && !hasPendingPhotoChange)}
        >
          Save changes
        </button>
      </form>
      <ConfirmDialog
        open={isSaveConfirmationOpen}
        title="Save profile changes?"
        description={
          hasPendingPhotoChange
            ? 'This will update your personal details and profile picture.'
            : 'This will update your personal details on your PawSaathi account.'
        }
        confirmLabel="Save profile"
        cancelLabel="Keep editing"
        busy={profileUpdateMutation.isPending}
        onConfirm={() => void persistProfileChanges()}
        onCancel={closeSaveConfirmation}
      />
    </section>
  );
}

export function AccountProfilePage() {
  const [searchParams] = useSearchParams();
  const accountProfileQuery = useQuery({
    queryKey: ['account', 'profile'],
    queryFn: endpoints.account.profile,
  });
  return (
    <>
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Your profile</h1>
          <p>Manage your personal details and account security.</p>
        </div>
      </div>
      {searchParams.get('security') === 'required' && (
        <div className="alert" role="alert">
          A password update is required before using your account.
        </div>
      )}
      {accountProfileQuery.isPending ? (
        <LoadingState label="Loading your profile…" />
      ) : accountProfileQuery.isError ? (
        <ErrorState
          message={accountProfileQuery.error.message}
          onRetry={() => void accountProfileQuery.refetch()}
        />
      ) : (
        <div className="account-profile-grid">
          <AccountProfileForm profile={accountProfileQuery.data} />
          <aside className="account-summary" aria-label="Account details">
            <div className="account-summary-head">
              <ProfileImage
                className="account-avatar"
                src={accountProfileQuery.data.photoUrl}
                name={accountProfileQuery.data.name}
                fallbackSrc={demoProfilePhoto}
                loading="eager"
              />
              <div>
                <b>{accountProfileQuery.data.name}</b>
                <span>{accountProfileQuery.data.email}</span>
              </div>
            </div>
            <dl className="account-facts">
              <div>
                <dt>Account type</dt>
                <dd>{roleDisplayNames[accountProfileQuery.data.role]}</dd>
              </div>
              <div>
                <dt>Account status</dt>
                <dd>
                  <StatusBadge status={accountProfileQuery.data.status} />
                </dd>
              </div>
              <div>
                <dt>Member since</dt>
                <dd>{formatProfileDateLabel(accountProfileQuery.data.createdAt)}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{formatProfileDateLabel(accountProfileQuery.data.updatedAt)}</dd>
              </div>
            </dl>
            <p className="account-note">
              Your account type and status are managed by PawSaathi. Contact support if something
              needs to change.
            </p>
          </aside>
        </div>
      )}
      <PasswordChangePanel />
    </>
  );
}
