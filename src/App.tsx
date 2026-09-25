import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/errors/ErrorBoundary';
import ProtectedRoute from './auth/ProtectedRoute';
import PageLoading from './components/ui/PageLoading';
import { ROUTES } from './config/routes';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
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
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route
              path={ROUTES.ADMIN_DASHBOARD}
              element={
                <ProtectedRoute roles={['ORG_ADMIN', 'SUPER_ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path=":section" element={<DashboardSection />} />
            </Route>
            <Route
              path={ROUTES.INSTRUCTOR_DASHBOARD}
              element={
                <ProtectedRoute roles={['INSTRUCTOR', 'SUPER_ADMIN']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path=":section" element={<DashboardSection />} />
            </Route>
            <Route
              path={ROUTES.STUDENT_DASHBOARD}
              element={
                <ProtectedRoute roles={['STUDENT', 'SUPER_ADMIN']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="overview" replace />} />
              <Route path=":section" element={<DashboardSection />} />
            </Route>
            <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
