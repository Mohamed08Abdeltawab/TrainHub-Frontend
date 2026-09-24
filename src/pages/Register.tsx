import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Alert, Button, Input } from '@/components/ui';
import { registerSchema } from '../validators/authValidator';

type RegisterValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function Register() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit: SubmitHandler<RegisterValues> = () => setSubmitted(true);

  return (
    <AuthLayout
      title="Create your account"
      description="Set up your TrainHub workspace access."
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => setSubmitted(false)}
        noValidate
        className="space-y-4"
      >
        <Input
          {...register('name')}
          label="Full name"
          autoComplete="name"
          placeholder="Your name"
          error={errors.name?.message}
        />
        <Input
          {...register('email')}
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
        />
        <Input
          {...register('password')}
          label="Password"
          type="password"
          autoComplete="new-password"
          description="Use at least 8 characters."
          error={errors.password?.message}
        />
        <Input
          {...register('confirmPassword')}
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your password again"
          error={errors.confirmPassword?.message}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isSubmitting}
          loadingLabel="Creating account..."
        >
          Create account
        </Button>
      </form>
      {submitted && (
        <Alert className="mt-4" variant="info">
          Your details are valid. Account creation is not connected yet.
        </Alert>
      )}
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link
          to="/"
          className="font-medium text-primary transition-colors hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
