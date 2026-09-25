import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { DashboardRole } from '../types/nav';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children, roles }: { children: ReactNode; roles: DashboardRole[] }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
