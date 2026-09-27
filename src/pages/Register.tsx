import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Alert, Button, Input } from '@/components/ui';
import { registerSchema } from '../validators/authValidator';
import { authApi } from '../api/auth';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

type RegisterValues = {
  name: string;
  organization: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const [error, setError] = useState('');
  const [created, setCreated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit: SubmitHandler<RegisterValues> = async (values) => {
    setError('');
    try {
      await authApi.register({
        name: values.name.trim(),
        organization: values.organization.trim(),
        email: values.email.trim(),
        password: values.password,
      });
    } catch (requestError) {
      const responseMessage = axios.isAxiosError(requestError)
        ? (requestError.response?.data as { message?: unknown } | undefined)?.message
        : undefined;
      const message = typeof responseMessage === 'string'
        ? responseMessage
        : axios.isAxiosError(requestError) && requestError.response?.status === 409
          ? 'An account with this email already exists. Sign in instead.'
          : 'We could not create your account. Check your connection and try again.';
      setError(t(message));
      return;
    }
    setCreated(true);
    window.setTimeout(() => navigate('/', { state: { registeredEmail: values.email.trim() } }), 900);
  };

  return (
    <AuthLayout
      title="Create your account"
      description="Set up your TrainHub workspace access."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => { setError(''); setCreated(false); }}
        noValidate
        className="space-y-4"
      >
        <Input
          {...register('name')}
          label={t('Full name')}
          autoComplete="name"
          placeholder={t('Your name')}
          error={errors.name?.message ? t(errors.name.message) : undefined}
        />
        <Input
          {...register('organization')}
          label={t('Training center')}
          autoComplete="organization"
          placeholder={t('Your organization name')}
          error={errors.organization?.message ? t(errors.organization.message) : undefined}
        />
        <Input
          {...register('email')}
          label={t('Work email')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message ? t(errors.email.message) : undefined}
        />
        <div className="relative">
          <Input
            {...register('password')}
            label={t('Password')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            description={t('Use at least 8 characters.')}
            className="pe-10"
            error={errors.password?.message ? t(errors.password.message) : undefined}
          />
          <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="absolute end-2 top-[1.375rem] flex h-10 w-8 items-center justify-center text-muted-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <Input
          {...register('confirmPassword')}
          label={t('Confirm password')}
          type="password"
          autoComplete="new-password"
          placeholder={t('Enter your password again')}
          error={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingLabel={t('Creating account...')}
        >
          {t('Create account')}
        </Button>
      </form>
      {error && <Alert className="mt-4" variant="error">{error}</Alert>}
      {created && <Alert className="mt-4" variant="success">{t('Account created. Taking you to sign in…')}</Alert>}
      <p className="mt-5 text-center text-xs text-muted-foreground">
        {t('Already have an account?')}{' '}
        <Link
          to="/"
          className="font-medium text-primary transition-colors hover:underline"
        >
          {t('Sign in')}
        </Link>
      </p>
    </AuthLayout>
  );
}
