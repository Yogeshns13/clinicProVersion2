import { Outlet, Navigate, useLocation } from 'react-router-dom';
import styles from './AdminLayout.module.css';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../Contexts/AuthContext';
import { useState } from 'react';

const AdminLayout = () => {

  const { profileName, isAuthenticated, mustChangePassword } = useAuth();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className={styles.dashboardContainer}>
      <div
        className={`${styles.sidebarWrapper} ${sidebarExpanded ? styles.expanded : ''}`}
        onMouseEnter={() => !mustChangePassword && setSidebarExpanded(true)}
        onMouseLeave={() => !mustChangePassword && setSidebarExpanded(false)}
        style={
          mustChangePassword
            ? {
                pointerEvents : "none",
                userSelect    : "none",
                opacity       : 0.25,
                filter        : "blur(3px)",
                transition    : "opacity 0.3s, filter 0.3s",
              }
            : {
                transition    : "opacity 0.3s, filter 0.3s",
              }
        }
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