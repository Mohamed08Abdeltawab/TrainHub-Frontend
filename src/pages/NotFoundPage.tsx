import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { Button } from '@/components/ui';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Page not found"
      description="We could not find the page you requested."
    >
      <div className="text-center">
        <p className="text-6xl font-bold tracking-tight text-primary">404</p>
        <p className="mt-3 text-sm text-muted-foreground">
          The link may be incorrect, or the page may have moved.
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/')}
          className="mt-6 w-full"
        >
          Return to sign in
        </Button>
      </div>
    </AuthLayout>
  );
}
