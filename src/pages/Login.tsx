import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import { Alert, Button, Input, Separator } from '@/components/ui';
import { loginSchema } from '../validators/authValidator';
import { useAuth } from '../auth/AuthContext';
import type { DashboardRole } from '../types/nav';
import { demoUsers } from '../config/demoUsers';
import { useLanguage } from '../i18n/LanguageContext';

type LoginValues = { email: string; password: string };

const demoLinks = [
  { label: 'Organization Admin', to: '/admin/organizations/demo', role: 'ORG_ADMIN' as DashboardRole },
  { label: 'Instructor', to: '/instructor', role: 'INSTRUCTOR' as DashboardRole },
  { label: 'Learner', to: '/student', role: 'STUDENT' as DashboardRole },
];

export default function Login() {
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signIn, enterDemo } = useAuth();
  const { t } = useLanguage();
  const locationState = location.state as { from?: string; registeredEmail?: string } | null;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: locationState?.registeredEmail ?? '' },
  });

  const onSubmit: SubmitHandler<LoginValues> = async (values) => {
    setError('');
    const result = await signIn(values.email, values.password);
    if (result === 'invalid' || result === 'unavailable') {
      if (result === 'unavailable') {
        setError(t('We could not reach the sign-in service. Check your connection and try again.'));
        return;
      }
      setError(t('We couldn’t find an account with that email and password. Check your details or create an account.'));
      return;
    }
    const destination = locationState?.from;
    navigate(destination ?? demoUsers[result].path, { replace: true });
  };

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue to your training workspace."
    >
      {user && <Alert className="mb-4" variant="info">{t('You are signed in as')} {user.name}. {t('Sign out from your workspace to use a different account.')}</Alert>}
      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => setError('')}
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
        <div className="space-y-1.5">
          <div className="relative">
            <Input
              {...register('password')}
              label={t('Password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('Enter your password')}
              className="pe-10"
              error={errors.password?.message ? t(errors.password.message) : undefined}
            />
            <button type="button" onClick={() => setShowPassword((shown) => !shown)} className="absolute end-2 top-[1.375rem] flex h-10 w-8 items-center justify-center text-muted-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs text-primary/80 transition-colors hover:text-primary hover:underline"
            >
              {t('Forgot password?')}
            </Link>
          </div>
        </div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingLabel={t('Checking details...')}
        >
        {t('Sign in')}
        </Button>
      </form>

      {error && <Alert className="mt-4" variant="error">{error}</Alert>}

      <p className="mt-5 text-center text-xs text-muted-foreground">
        {t('New to TrainHub?')}{' '}
        <Link
          to="/register"
          className="font-medium text-primary transition-colors hover:underline"
        >
          {t('Create an account')}
        </Link>
      </p>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t('Preview dashboards')}
          </span>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-1 gap-2">
          {demoLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => enterDemo(item.role)}
              className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:border-border/80 hover:bg-muted/50 hover:text-foreground"
            >
              {t(item.label)}
              <ArrowRight className="size-3.5 text-primary" />
            </Link>
          ))}
        </div>
        <p className="mt-3 text-center text-[10px] text-muted-foreground/80">
          {t('Preview dashboards are open in this MVP.')}
        </p>
      </div>
    </AuthLayout>
  );
}
