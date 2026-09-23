import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Alert, Button, Input } from '../components/ui';

const demoLinks = [
  { label: 'Organization admin', to: '/admin/organizations/demo' },
  { label: 'Instructor', to: '/instructor' },
  { label: 'Learner', to: '/student' },
];

export default function Login() {
  return <AuthLayout title="Welcome back" description="Sign in to continue to your training workspace.">
    <form onSubmit={(event) => event.preventDefault()} className="space-y-4">
      <Input label="Email address" type="email" name="email" autoComplete="email" placeholder="you@example.com" required />
      <Input label="Password" type="password" name="password" autoComplete="current-password" placeholder="Enter your password" minLength={8} required />
      <Button type="submit" size="lg" className="w-full">Sign in</Button>
    </form>
    <Alert className="mt-4" variant="info">The sign-in form is a UI preview; authentication is not connected yet.</Alert>
    <div className="mt-6"><div className="mb-3 flex items-center gap-3"><span className="h-px flex-1 bg-zinc-800"/><span className="text-[10px] uppercase tracking-wider text-zinc-500">Preview dashboards</span><span className="h-px flex-1 bg-zinc-800"/></div><div className="grid grid-cols-1 gap-2">{demoLinks.map((item) => <Link key={item.to} to={item.to} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900 hover:text-white">{item.label}<span className="text-indigo-300">→</span></Link>)}</div><p className="mt-3 text-center text-[10px] text-zinc-600">Demo navigation only. Authentication is not connected yet.</p></div>
  </AuthLayout>;
}
