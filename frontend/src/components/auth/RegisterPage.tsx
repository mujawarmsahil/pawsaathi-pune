import { ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { endpoints } from '../../api/endpoints';
import { ApiError } from '../../api/errors';
import { useAuthContext } from '../../hooks/useAuthContext';
import { AuthCard } from './AuthCard';
import { emailSchema, strongPasswordSchema } from './authValidation';

export function RegisterPage() {
  const navigate = useNavigate();
  const { reload } = useAuthContext();
  const [registrationError, setRegistrationError] = useState('');
  const [approvalPendingMessage, setApprovalPendingMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const registrationSchema = z.object({
    name: z.string().trim().min(2, 'Enter at least 2 characters.').max(120),
    email: emailSchema,
    phone: z.string().max(20).optional(),
    password: strongPasswordSchema,
    role: z.enum(['CUSTOMER', 'CARETAKER']),
  });
  async function handleRegistrationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const registrationForm = event.currentTarget;
    const registrationFormData = new FormData(registrationForm);
    const registrationValidation = registrationSchema.safeParse({
      name: registrationFormData.get('name'),
      email: registrationFormData.get('email'),
      phone: registrationFormData.get('phone') || undefined,
      password: registrationFormData.get('password'),
      role: registrationFormData.get('role'),
    });
    if (!registrationValidation.success) {
      setFieldErrors(
        Object.fromEntries(
          registrationValidation.error.issues.map((issue) => [
            String(issue.path[0] ?? ''),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setIsSubmitting(true);
    setRegistrationError('');
    setFieldErrors({});
    try {
      const registrationResponse = await endpoints.auth.register(registrationValidation.data);
      registrationForm.reset();
      if (!('token' in registrationResponse)) {
        setApprovalPendingMessage(registrationResponse.message);
        return;
      }
      const user = await reload();
      if (!user) throw new Error('Your session could not be confirmed after registration.');
      navigate('/app/bookings', { replace: true });
    } catch (cause) {
      setRegistrationError(
        cause instanceof ApiError ? cause.message : 'Unable to create your account.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Join the local pet-care community"
      title="Let’s get started."
      description="Create an account to find care or offer your services."
    >
      {approvalPendingMessage ? (
        <div className="pending-panel" role="status">
          <strong>Application submitted</strong>
          <p>{approvalPendingMessage}</p>
          <Link className="button full-button" to="/login">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={(event) => void handleRegistrationSubmit(event)} noValidate>
          <label htmlFor="register-name">Your name</label>
          <input
            id="register-name"
            name="name"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors['name'])}
          />
          {fieldErrors['name'] && <span className="form-error">{fieldErrors['name']}</span>}
          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors['email'])}
          />
          {fieldErrors['email'] && <span className="form-error">{fieldErrors['email']}</span>}
          <label htmlFor="register-phone">
            Phone number <span className="muted-label">(optional)</span>
          </label>
          <input id="register-phone" name="phone" type="tel" autoComplete="tel" />
          <label htmlFor="register-role">I’m here as</label>
          <select id="register-role" name="role" defaultValue="CUSTOMER">
            <option value="CUSTOMER">Pet parent</option>
            <option value="CARETAKER">Caretaker</option>
          </select>
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors['password'])}
            aria-describedby="register-password-help"
          />
          <small id="register-password-help" className="input-hint">
            12–72 characters with uppercase, lowercase, a number, and a symbol.
          </small>
          {fieldErrors['password'] && <span className="form-error">{fieldErrors['password']}</span>}
          <button className="button full-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'} <ArrowRight size={17} />
          </button>
        </form>
      )}
      {registrationError && (
        <div className="alert" role="alert">
          {registrationError}
        </div>
      )}
      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthCard>
  );
}
