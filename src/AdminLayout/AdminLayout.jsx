import { Outlet, Navigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';
import Sidebar from '../Sidebar/Sidebar';
import { useAuth } from '../Contexts/AuthContext';
import { checkSession } from '../Api/Api';
import { useEffect, useState } from 'react';

const AdminLayout = () => {

  const { profileName, setAuth } = useAuth();
  const location = useLocation();

  const [isChecking, setIsChecking] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [verifiedPath, setVerifiedPath] = useState('');

  useEffect(() => {
    const pathToVerify = location.pathname;
    setIsChecking(true);
    setIsSessionValid(false);
    setVerifiedPath('');

    const verify = async () => {
      try {
        const sessionValid = await checkSession();

        if (location.pathname === pathToVerify) {
          if (sessionValid) {
            setAuth({ isAuthenticated: true, profileName: profileName || "unknown" });
            setIsSessionValid(true);
          } else {
            setAuth({ isAuthenticated: false, profileName: null });
            setIsSessionValid(false);
          }
          setVerifiedPath(pathToVerify);
        }
      } catch (err) {
        console.error("Session check failed", err);
        if (location.pathname === pathToVerify) {
          setAuth({ isAuthenticated: false, profileName: null });
          setIsSessionValid(false);
          setVerifiedPath(pathToVerify);
        }
      } finally {
        if (location.pathname === pathToVerify) {
          setIsChecking(false);
        }
      }
    };

    verify();
  }, [location.pathname]);

  // === CRITICAL BLOCK ===
  // Show loading screen (with full layout) until THIS exact path has been verified
  if (isChecking || verifiedPath !== location.pathname) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <div>Verifying session...</div>
        </main>
      </div>
    );
  }

  if (!isSessionValid) {
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