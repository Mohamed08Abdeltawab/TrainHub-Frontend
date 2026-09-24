import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/errors/ErrorBoundary';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFoundPage from './pages/NotFoundPage';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  return <Router>
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/admin/organizations/:orgId" element={<AdminDashboard />} />
        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  </Router>;
}

export default App;
