import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkSession } from "../api/api"; // Adjust path as needed
import { useEffect } from "react";

const ROUTE_PERMISSIONS = {
  "/dashboard": ["admin", "doctor", "receptionist", "nurse"],
  "/clinic-list": ["admin", "doctor", "receptionist"],
  "/update-clinic/:id": ["admin", "doctor", "receptionist"],
  "/branch-list": ["admin", "doctor", "receptionist"],
  "/update-branch/:id": ["admin", "doctor", "receptionist"],
  "/work-shift": ["admin", "doctor", "receptionist"],
  "/update-shift/:id": ["admin", "doctor", "receptionist"],
  "/dept-list": ["admin", "doctor", "receptionist"],
  "/update-dept/:id": ["admin", "doctor", "receptionist"],
  "/employee-list": ["admin", "doctor", "receptionist"],
  "/update-employee/:id": ["admin", "doctor", "receptionist"],
  "/app-employee": ["admin", "doctor", "receptionist"],
  "/employee-proof/:id": ["admin", "doctor", "receptionist"],
  "/employee-account/:id": ["admin", "doctor", "receptionist"],
  "/employee-shift/:id": ["admin", "doctor", "receptionist"],
  "/patient-list": ["admin", "doctor", "receptionist"],
  "/view-patient/:id": ["admin", "doctor", "receptionist"],
  "/add-patient": ["admin", "doctor", "receptionist"],
  "/update-patient/:id": ["admin", "doctor", "receptionist"],
  "/appointments": ["admin", "doctor", "receptionist"],
  "/prescriptions": ["admin", "doctor"],
  "/reports": ["admin", "doctor"],
  "/attendance": ["admin","doctor"],
  "/settings": ["admin"],
  "/add-slotconfig": ["admin", "doctor", "receptionist"],
  "/generate-slots": ["admin", "doctor", "receptionist"],
  "/slotconfig-list": ["admin", "doctor", "receptionist"],
  "/slot-list": ["admin", "doctor", "receptionist"],
  "/appointment-list": ["admin", "doctor", "receptionist"],
  "/add-appointment": ["admin", "doctor", "receptionist"],
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