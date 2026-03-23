import { Outlet, Navigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../Contexts/AuthContext';

const AdminLayout = () => {

  const { profileName, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;