import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkSession } from "../api/api"; // Adjust path as needed
import { useEffect } from "react";

const ROUTE_PERMISSIONS = {
  "/dashboard": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts"],
  "/clinic-list": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts"],
  "/update-clinic/:id": ["admin","spradmin"],
  "/branch-list": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts"],
  "/update-branch/:id": ["admin","spradmin"],
  "/work-shift": ["admin", "doctor","spradmin","nurse"],
  "/update-shift/:id": ["admin", "spradmin"],
  "/dept-list": ["admin", "spradmin","fronttdesk","nurse","pharmacy","labtest","accounts"],
  "/update-dept/:id": ["admin", "spradmin"],
  "/employee-list": ["admin","spradmin","fronttdesk","nurse"],
  "/update-employee/:id": ["admin", "spradmin","fronttdesk"],
  "/employee-proof/:id": ["admin", "spradmin","fronttdesk"],
  "/employee-account/:id": ["admin", "spradmin","fronttdesk"],
  "/employee-shift/:id": ["admin", "spradmin","fronttdesk"],
  "/patient-list": ["admin", "spradmin","fronttdesk","nurse","accounts"],
  "/view-patient/:id": ["admin", "spradmin","fronttdesk"],
  "/add-patient": ["admin", "spradmin","fronttdesk"],
  "/update-patient/:id": ["admin", "spradmin","fronttdesk"],
  "/appointments": ["admin", "spradmin","fronttdesk"],
  "/add-slotconfig": ["admin", "spradmin","fronttdesk"],
  "/generate-slots": ["admin", "spradmin","fronttdesk"],
  "/slotconfig-list": ["admin", "spradmin","fronttdesk"],
  "/slot-list": ["admin", "spradmin","fronttdesk","nurse"],
  "/appointment-list": ["admin", "spradmin","fronttdesk","nurse"],
  "/add-appointment": ["admin", "spradmin","fronttdesk"],
  "/view-appointment": ["admin", "spradmin","fronttdesk"],
  "/patientvisit-list": ["admin", "spradmin","fronttdesk","nurse"],
  "/add-patientvisit": ["admin", "spradmin","fronttdesk"],
  "/view-patientvisit": ["admin", "spradmin","fronttdesk"],
  "/update-patientvisit/:id": ["admin", "spradmin","fronttdesk"],
  "/consultation-list": ["admin", "spradmin","fronttdesk","nurse","accounts"],
  "/view-consultation/:id": ["admin", "spradmin","fronttdesk"],
  "/add-consultation": ["admin", "spradmin"],
  "/update-consultation/:id": ["admin", "spradmin"],
  "/consultationcharge-config": ["admin", "spradmin","fronttdesk","accounts"],
  "/consultation-charge": ["admin", "spradmin","fronttdesk","accounts"],
  "/invoice-management": ["admin", "spradmin","fronttdesk","pharmacy","labtest","accounts"],
  "/invoice-payment": ["admin", "spradmin","pharmacy","labtest","accounts"],
  "/vendor-list": ["admin", "spradmin","pharmacy"],
  "/view-vendor/:id": ["admin", "spradmin","pharmacy"],
  "/add-vendor": ["admin", "spradmin","pharmacy"],
  "/update-vendor/:id": ["admin", "spradmin","pharmacy"],
  "/medicinemaster-list": ["admin", "spradmin","pharmacy","accounts"],
  "/add-medicinemaster": ["admin", "spradmin","pharmacy","accounts"],
  "/update-medicinemaster/:id": ["admin", "spradmin","pharmacy","accounts"],
  "/view-medicinemaster/:id": ["admin", "spradmin","pharmacy","accounts"],
  "/purchaseorder-list": ["admin", "spradmin","pharmacy"],
  "/add-puchaseorder": ["admin", "spradmin","pharmacy"],
  "/view-purchaseorder/:id": ["admin", "spradmin","pharmacy"],
  "/purchaseorderitem": ["admin", "spradmin","pharmacy"],
  "/Add-purchaseorderdetail": ["admin", "spradmin","pharmacy"],
  "/update-purchaseorderdetail/:id": ["admin", "spradmin","pharmacy"],
  "/view-purchaseorderdetail/:id": ["admin", "spradmin","pharmacy"],
  "/view-prescription/:id": ["admin", "spradmin"],
  "/view-laborder/:id": ["admin", "spradmin"],
  "/labtestmaster": ["admin", "spradmin","labtest","accounts"],
  "/labwork-list": ["admin", "spradmin","labtest"],
  "/update-labmaster/:id": ["admin", "spradmin","labtest"],
  "/update-labpackage/:id": ["admin", "spradmin","labtest"],
  "/laborder-list": ["admin", "spradmin","labtest"],
  "/medicinestock-list": ["admin", "spradmin","fronttdesk","pharmacy"],
  "/medicine-stock/:id": ["admin", "spradmin","pharmacy"],
  "/update-medicinestock/:id": ["admin", "spradmin","pharmacy"],
  "/lab-report-list": ["admin", "spradmin","fronttdesk","labtest"],
  "/update-lab-report/:id": ["admin", "spradmin","labtest"],
  "/lab-invoice": ["admin", "spradmin","labtest"],
  "/pharmacy-invoice": ["admin", "spradmin","labtest"],
  "/salescart-list": ["admin", "spradmin","pharmacy" ],
  "/salescartdetail-list/:id": ["admin", "spradmin","pharmacy"],
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