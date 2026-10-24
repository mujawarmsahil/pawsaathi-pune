import { ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { endpoints } from '../../api/endpoints';
import { ApiError } from '../../api/errors';
import { useAuthContext } from '../../hooks/useAuthContext';
import { dashboardPath } from '../../utils';
import { AuthCard } from './AuthCard';
import { emailSchema } from './authValidation';

export function LoginPage() {
  const navigate = useNavigate();
  const { reload } = useAuthContext();
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [searchParams] = useSearchParams();
  const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Enter your password.'),
  });

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const loginForm = event.currentTarget;
    const loginFormData = new FormData(loginForm);
    const loginValidation = loginSchema.safeParse({
      email: loginFormData.get('email'),
      password: loginFormData.get('password'),
    });
    if (!loginValidation.success) {
      setFieldErrors(
        Object.fromEntries(
          loginValidation.error.issues.map((issue) => [String(issue.path[0] ?? ''), issue.message]),
        ),
      );
      return;
    }
    setIsSubmitting(true);
    setLoginError('');
    setFieldErrors({});
    try {
      await endpoints.auth.login(loginValidation.data);
      loginForm.reset();
      const user = await reload();
      if (!user) throw new Error('Your session could not be confirmed. Please try again.');
      const requestedPath = searchParams.get('from');
      const returnPath =
        requestedPath?.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : null;
      const destination = user.mustChangePassword
        ? '/change-password'
        : returnPath || dashboardPath(user.role);
      navigate(destination, { replace: true });
    } catch (cause) {
      setLoginError(cause instanceof ApiError ? cause.message : 'Unable to log in right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="PawSaathi Pune"
      title="Welcome back."
      description="Sign in to manage your pet-care plans."
    >
      <form onSubmit={(event) => void handleLoginSubmit(event)} noValidate>
        <label htmlFor="login-email">Email address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors['email'])}
        />
        {fieldErrors['email'] && <span className="form-error">{fieldErrors['email']}</span>}
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors['password'])}
        />
        {fieldErrors['password'] && <span className="form-error">{fieldErrors['password']}</span>}
        <p className="muted-label" role="status">
          Password recovery is coming soon. Contact support if you cannot sign in.
        </p>
        <button className="button full-button" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Log in'} <ArrowRight size={17} />
        </button>
      </form>
      {loginError && (
        <div className="alert" role="alert">
          {loginError}
        </div>
      )}
      <p className="auth-switch">
        New to PawSaathi? <Link to="/register">Create an account</Link>
      </p>
    </AuthCard>
  );
}
