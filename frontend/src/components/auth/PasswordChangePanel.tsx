import { ShieldCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { endpoints } from '../../api/endpoints';
import { useAuthContext } from '../../hooks/useAuthContext';
import { dashboardPath } from '../../utils';
import { strongPasswordSchema } from './authValidation';

export function PasswordChangePanel() {
  const { user, reload } = useAuthContext();
  const navigate = useNavigate();
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: strongPasswordSchema,
  });

  async function handlePasswordChangeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passwordForm = event.currentTarget;
    const passwordFormData = new FormData(passwordForm);
    const passwordValidation = passwordChangeSchema.safeParse({
      currentPassword: passwordFormData.get('currentPassword'),
      newPassword: passwordFormData.get('newPassword'),
    });
    if (!passwordValidation.success) {
      setFieldErrors(
        Object.fromEntries(
          passwordValidation.error.issues.map((issue) => [
            String(issue.path[0] ?? ''),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setPasswordChangeError('');
    setIsPasswordChanged(false);
    setFieldErrors({});
    try {
      await endpoints.auth.changePassword(passwordValidation.data);
      passwordForm.reset();
      await reload();
      setIsPasswordChanged(true);
      if (user?.mustChangePassword) {
        navigate(dashboardPath(user.role), { replace: true });
      }
    } catch (cause) {
      setPasswordChangeError(cause instanceof Error ? cause.message : 'Password change failed.');
    }
  }

  return (
    <section className="profile-setup">
      <h2>Account security</h2>
      {user?.mustChangePassword && (
        <div className="alert" role="alert">
          <ShieldCheck size={16} /> Change your temporary password before continuing.
        </div>
      )}
      <form onSubmit={(event) => void handlePasswordChangeSubmit(event)}>
        <label htmlFor="current-password">Current password</label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors['currentPassword'])}
        />
        {fieldErrors['currentPassword'] && (
          <span className="form-error">{fieldErrors['currentPassword']}</span>
        )}
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors['newPassword'])}
        />
        {fieldErrors['newPassword'] && (
          <span className="form-error">{fieldErrors['newPassword']}</span>
        )}
        <button className="button">Change password</button>
      </form>
      {isPasswordChanged && (
        <p className="success" role="status">
          Password updated.
        </p>
      )}
      {passwordChangeError && (
        <p className="alert" role="alert">
          {passwordChangeError}
        </p>
      )}
    </section>
  );
}
