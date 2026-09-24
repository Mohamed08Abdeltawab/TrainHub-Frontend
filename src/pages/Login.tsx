import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Alert, Button, Input } from '../components/ui';
import { loginSchema } from '../validators/authValidator';

type LoginValues = { email: string; password: string };

const demoLinks = [
  { label: 'Organization admin', to: '/admin/organizations/demo' },
  { label: 'Instructor', to: '/instructor' },
  { label: 'Learner', to: '/student' },
];

export default function Login() {
  const [validationPassed, setValidationPassed] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginValues> = () => setValidationPassed(true);

  return <AuthLayout title="Welcome back" description="Sign in to continue to your training workspace.">
    <form onSubmit={handleSubmit(onSubmit)} onChange={() => setValidationPassed(false)} noValidate className="space-y-4">
      <Input {...register('email')} label="Email address" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} />
      <div className="space-y-1.5"><Input {...register('password')} label="Password" type="password" autoComplete="current-password" placeholder="Enter your password" error={errors.password?.message} /><div className="text-right"><Link to="/forgot-password" className="text-xs text-indigo-300 hover:text-indigo-200">Forgot password?</Link></div></div>
      <Button type="submit" size="lg" className="w-full" loading={isSubmitting} loadingLabel="Checking details...">Sign in</Button>
    </form>
    {validationPassed
      ? <Alert className="mt-4" variant="success">Your details passed validation. Authentication is not connected yet.</Alert>
      : <Alert className="mt-4" variant="info">The sign-in form is a preview; authentication is not connected yet.</Alert>}
    <p className="mt-5 text-center text-xs text-zinc-400">New to TrainHub? <Link to="/register" className="font-medium text-indigo-300 hover:text-indigo-200">Create an account</Link></p>
    <div className="mt-6"><div className="mb-3 flex items-center gap-3"><span className="h-px flex-1 bg-zinc-800"/><span className="text-[10px] uppercase tracking-wider text-zinc-500">Preview dashboards</span><span className="h-px flex-1 bg-zinc-800"/></div><div className="grid grid-cols-1 gap-2">{demoLinks.map((item) => <Link key={item.to} to={item.to} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white">{item.label}<span className="text-indigo-300">→</span></Link>)}</div><p className="mt-3 text-center text-[10px] text-zinc-600">Dashboard preview links are available without signing in.</p></div>
  </AuthLayout>;
}
