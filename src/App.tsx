import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/errors/ErrorBoundary';
import ProtectedRoute from './auth/ProtectedRoute';
import OrganizationTenantGuard from './auth/OrganizationTenantGuard';
import PageLoading from './components/ui/PageLoading';
import { ROUTES } from './config/routes';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PlatformDashboard = lazy(() => import('./pages/PlatformDashboard'));
const InstructorDashboard = lazy(() => import('./pages/InstructorDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const DashboardSection = lazy(() => import('./features/dashboard/components/DashboardSection'));

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<PageLoading label="Loading TrainHub..." />}>
          <Routes>
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route
              path={ROUTES.SUPER_ADMIN_DASHBOARD}
              element={
                <ProtectedRoute roles={['SUPER_ADMIN']}>
                  <PlatformDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path=":section" element={<DashboardSection />} />
              <Route path=":section/:courseId" element={<DashboardSection />} />
            </Route>
            <Route
              path={ROUTES.ADMIN_DASHBOARD}
              element={
                <ProtectedRoute roles={['ORG_ADMIN', 'SUPER_ADMIN']}>
                  <OrganizationTenantGuard><AdminDashboard /></OrganizationTenantGuard>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path=":section" element={<DashboardSection />} />
              <Route path=":section/:courseId" element={<DashboardSection />} />
            </Route>
            <Route
              path={ROUTES.INSTRUCTOR_DASHBOARD}
              element={
                <ProtectedRoute roles={['INSTRUCTOR']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path=":section" element={<DashboardSection />} />
              <Route path=":section/:courseId" element={<DashboardSection />} />
            </Route>
            <Route
              path={ROUTES.STUDENT_DASHBOARD}
              element={
                <ProtectedRoute roles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path=":section" element={<DashboardSection />} />
              <Route path=":section/:courseId" element={<DashboardSection />} />
            </Route>
            <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
