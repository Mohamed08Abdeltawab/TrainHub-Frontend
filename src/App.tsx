import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/errors/ErrorBoundary';
import AdminDashboard from './pages/AdminDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import Login from './pages/Login';
import NotFoundPage from './pages/NotFoundPage';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  return <Router>
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin/organizations/:orgId" element={<AdminDashboard />} />
        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  </Router>;
}

export default App;
