import { Outlet, Navigate, useLocation } from 'react-router-dom';
import styles from './AdminLayout.module.css';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../Contexts/AuthContext';
import { useState } from 'react';

const AdminLayout = () => {

  const { profileName, isAuthenticated } = useAuth();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className={styles.dashboardContainer}>
      <div
        className={`${styles.sidebarWrapper} ${sidebarExpanded ? styles.expanded : ''}`}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <Sidebar expanded={sidebarExpanded} />
      </div>
      <main className={`${styles.mainContent} ${sidebarExpanded ? styles.mainContentShifted : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;