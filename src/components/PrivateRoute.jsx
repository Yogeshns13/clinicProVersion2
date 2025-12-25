import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkSession } from "../api/api"; // Adjust path as needed
import { useEffect } from "react";

const ROUTE_PERMISSIONS = {
  "/dashboard": ["admin", "doctor", "receptionist", "nurse"],
  "/clinic-list": ["admin", "doctor", "receptionist"],
  "/branch-list": ["admin", "doctor", "receptionist"],
  "/dept-list": ["admin", "doctor", "receptionist"],
  "/employee-list": ["admin", "doctor", "receptionist"],
  "/patients": ["admin", "doctor", "receptionist"],
  "/appointments": ["admin", "doctor", "receptionist"],
  "/prescriptions": ["admin", "doctor"],
  "/reports": ["admin", "doctor"],
  "/attendance": ["admin","doctor"],
  "/settings": ["admin"],
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, profileName, setAuth } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  // Check session if not authenticated
  const verifySession = async () => {
    if (!isAuthenticated) {
      const sessionValid = await checkSession();
      if (sessionValid) {
        // Update auth context if session is valid
        setAuth({ isAuthenticated: true, profileName: profileName });
        return true;
      }
    }
    return isAuthenticated;
  };

  // Use useEffect to check session on mount
  useEffect(() => {
    verifySession();
  }, []);

  if (!isAuthenticated) {
    // Perform session check before redirecting
    verifySession().then((sessionValid) => {
      if (!sessionValid) {
        return <Navigate to="/login" replace state={{ from: location }} />;
      }
    });
    // Show loading state while checking
    return <div>Verifying session...</div>;
  }

  const allowedProfiles = ROUTE_PERMISSIONS[currentPath];
  if (allowedProfiles && !allowedProfiles.includes(profileName?.toLowerCase())) {
    return <Navigate to="/login" replace />;
  } 

  return children;
};

export default PrivateRoute;