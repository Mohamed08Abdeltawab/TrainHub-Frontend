import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Alert, Button, Input } from '../components/ui';
import { forgotPasswordSchema } from '../validators/authValidator';

type ForgotPasswordValues = { email: string };

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });
  const onSubmit: SubmitHandler<ForgotPasswordValues> = () => setSubmitted(true);

  return <AuthLayout title="Reset your password" description="Enter your account email to request a password reset.">
    <form onSubmit={handleSubmit(onSubmit)} onChange={() => setSubmitted(false)} noValidate className="space-y-4">
      <Input {...register('email')} label="Email address" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} />
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting} loadingLabel="Sending request...">Send reset link</Button>
    </form>
    {submitted && <Alert className="mt-4" variant="info">Your email is valid. Password reset is not connected yet.</Alert>}
    <p className="mt-5 text-center text-xs text-zinc-400"><Link to="/" className="font-medium text-indigo-300 hover:text-indigo-200">Back to sign in</Link></p>
  </AuthLayout>;
}
