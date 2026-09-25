import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { DashboardRole } from '../types/nav';
import { useAuth } from './AuthContext';
import { demoUsers } from '../config/demoUsers';

export default function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: DashboardRole[];
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    const targetPath = demoUsers[user.role]?.path || '/';
    return <Navigate to={targetPath} replace />;
  }

  return <>{children}</>;
}
