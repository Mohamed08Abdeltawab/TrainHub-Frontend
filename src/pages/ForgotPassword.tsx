import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Alert, Button, Input } from '@/components/ui';
import { forgotPasswordSchema } from '../validators/authValidator';
import { useLanguage } from '../i18n/LanguageContext';
import { authApi } from '../api/auth';
import axios from 'axios';

type ForgotPasswordValues = { email: string };

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit: SubmitHandler<ForgotPasswordValues> = async ({ email }) => {
    setError('');
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSubmitted(true);
    } catch (requestError) {
      const responseMessage = axios.isAxiosError(requestError)
        ? (requestError.response?.data as { message?: unknown } | undefined)?.message
        : undefined;
      setError(typeof responseMessage === 'string' ? t(responseMessage) : t('We could not send the reset request. Check your connection and try again.'));
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your account email to request a password reset."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => { setSubmitted(false); setError(''); }}
        noValidate
        className="space-y-4"
      >
        <Input
          {...register('email')}
          label={t('Email address')}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message ? t(errors.email.message) : undefined}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingLabel={t('Sending request...')}
        >
          {t('Send reset link')}
        </Button>
      </form>
      {error && <Alert className="mt-4" variant="error">{error}</Alert>}
      {submitted && (
        <Alert className="mt-4" variant="info">
          {t('If an account exists for this email, you will receive a password reset link.')}
        </Alert>
      )}
      <p className="mt-5 text-center text-xs text-muted-foreground">
        <Link
          to="/"
          className="font-medium text-primary transition-colors hover:underline"
        >
          {t('Back to sign in')}
        </Link>
      </p>
    </AuthLayout>
  );
}
