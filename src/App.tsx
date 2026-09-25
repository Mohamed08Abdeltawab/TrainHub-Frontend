import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/errors/ErrorBoundary';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFoundPage from './pages/NotFoundPage';
import StudentDashboard from './pages/StudentDashboard';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import { Link } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import { Button } from './components/ui';
import { useLanguage } from './i18n/LanguageContext';

function App() {
  const { t } = useLanguage();
  return <Router>
    <AuthProvider>
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/organizations/:orgId" element={<ProtectedRoute roles={['ORG_ADMIN', 'SUPER_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/instructor" element={<ProtectedRoute roles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>} />
        <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/unauthorized" element={<AuthLayout title="Access denied" description="Your current account does not have access to this workspace."><Link to="/"><Button variant="primary" className="w-full">{t('Return to sign in')}</Button></Link></AuthLayout>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
    </AuthProvider>
  </Router>;
}

export default App;
