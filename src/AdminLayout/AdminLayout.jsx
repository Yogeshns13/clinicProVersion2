import { Outlet } from 'react-router-dom';
import './AdminLayout.css';
import Sidebar from '../Sidebar/sidebar';
import { useTokenRenewal } from '../hooks/TokenRenewal'; // Adjust path if needed

const AdminLayout = () => {
  useTokenRenewal();

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <Outlet /> {/* Renders Dashboard, Patients, Appointments, etc. */}
      </main>
    </div>
  );
};

export default AdminLayout;