import { useParams } from 'react-router-dom';

export default function AdminDashboard() {
  const { orgId } = useParams(); // لاقتطاع كود المنظومة من الـ URL

  return (
    <div style={{ padding: '20px' }}>
      <h1>Super Admin Dashboard</h1>
      <p>Managing Organization ID: <strong>{orgId}</strong></p>
    </div>
  );
}