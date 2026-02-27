import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkSession } from "../api/api"; 
import { useEffect, useState } from "react";

const ROUTE_PERMISSIONS = {
  "/dashboard": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts","doctor"],
  "/clinic-list": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts","doctor"],
  "/update-clinic/:id": ["admin","spradmin"],
  "/branch-list": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts","doctor"],
  "/update-branch/:id": ["admin","spradmin"],
  "/dept-list": ["admin", "spradmin","fronttdesk","nurse","pharmacy","labtest","accounts"],
  "/update-dept/:id": ["admin", "spradmin", "fronttdesk"],

  "/work-shift": ["admin", "doctor","spradmin","nurse", "fronttdesk"],
  "/update-shift/:id": ["admin", "spradmin", "fronttdesk"],
  "/employee-list": ["admin","spradmin","fronttdesk","nurse"],
  "/update-employee/:id": ["admin", "spradmin","fronttdesk"],
  "/employee-proof/:id": ["admin", "spradmin","fronttdesk"],
  "/employee-account/:id": ["admin", "spradmin","fronttdesk"],
  "/employee-shift/:id": ["admin", "spradmin","fronttdesk"],

  "/patient-list": ["admin", "spradmin","fronttdesk","nurse","accounts","doctor",],
  "/view-patient/:id": ["admin", "spradmin", "doctor", "fronttdesk", "nurse", "accounts"],
  "/add-patient": ["admin", "spradmin","fronttdesk"],
  "/update-patient/:id": ["admin", "spradmin","fronttdesk"],
  "/slotconfig-list": ["admin", "spradmin","fronttdesk"],
  "/add-slotconfig": ["admin", "spradmin","fronttdesk"],
  "/generate-slots": ["admin", "spradmin","fronttdesk"],
  "/slot-list": ["admin", "spradmin","fronttdesk","nurse","doctor"],
  "/appointment-list": ["admin", "spradmin","fronttdesk","nurse","doctor"],
  "/add-appointment": ["admin", "spradmin","fronttdesk"],
  "/view-appointment": ["admin", "spradmin","fronttdesk"],
  "/patientvisit-list": ["admin", "spradmin","fronttdesk","nurse"],
  "/add-patientvisit": ["admin", "spradmin","fronttdesk", "nurse"],
  "/view-patientvisit": ["admin", "spradmin","fronttdesk", "nurse"],
  "/update-patientvisit/:id": ["admin", "spradmin","fronttdesk", "nurse"],

  "/consultation-list": ["admin", "spradmin","fronttdesk","nurse","accounts","doctor"],
  "/view-consultation/:id": ["admin", "spradmin", "nurse","fronttdesk", "doctor", "accounts"],
  "/add-consultation": ["admin", "spradmin", "doctor"],
  "/update-consultation/:id": ["admin", "spradmin", "doctor"],

  "/consultationcharge-config": ["admin", "spradmin","fronttdesk","accounts"],
  "/consultation-charge": ["admin", "spradmin","fronttdesk","accounts"],

  "/labtestmaster": ["admin", "spradmin","labtest","accounts"],

  "/laborder-list": ["admin", "spradmin","labtest"],
  "/view-laborder/:id": ["admin", "spradmin", "labtest"],
  "/labwork-list": ["admin", "spradmin","labtest"],
  "/lab-report-list": ["admin", "spradmin","fronttdesk","labtest","doctor"],
  "/update-lab-report/:id": ["admin", "spradmin","labtest"],
  "/lab-invoice": ["admin", "spradmin","labtest"],

  "/vendor-list": ["admin", "spradmin","pharmacy"],
  
  "/medicinemaster-list": ["admin", "spradmin","pharmacy","accounts","doctor", "fronttdesk"],
  "/view-medicinemaster/:id": ["admin", "spradmin","pharmacy","accounts"],
  "/add-medicinemaster": ["admin", "spradmin","pharmacy","accounts"],
  "/update-medicinemaster/:id": ["admin", "spradmin","pharmacy","accounts"],

  "/medicinestock-list": ["admin", "spradmin","fronttdesk","pharmacy","doctor"],
  "/medicine-stock/:id": ["admin", "spradmin","pharmacy"],
  
  "/purchaseorder-list": ["admin", "spradmin","pharmacy"],
  "/view-purchaseorder/:id": ["admin", "spradmin","pharmacy"],
  "/add-puchaseorder": ["admin", "spradmin","pharmacy"], 
  "/purchaseorderitem": ["admin", "spradmin","pharmacy"],
  "/view-purchaseorderdetail/:id": ["admin", "spradmin","pharmacy"],
  "/Add-purchaseorderdetail": ["admin", "spradmin","pharmacy"],
  "/update-purchaseorderdetail/:id": ["admin", "spradmin","pharmacy"],
 
  "/view-prescription/:id": ["admin", "spradmin"],
  "/salescart-list": ["admin", "spradmin","pharmacy" ],
  "/salescartdetail-list/:id": ["admin", "spradmin","pharmacy"],
  "/pharmacy-invoice": ["admin", "spradmin", "pharmacy"],
  

  "/invoice-management": ["admin", "spradmin","fronttdesk","pharmacy","labtest","accounts","doctor"],
  "/invoice-payment": ["admin", "spradmin","pharmacy","labtest","accounts","doctor", "fronttdesk"],
};

const matchRoute = (pathname, pattern) => {
  const regexPattern = "^" + pattern.replace(/:[^/]+/g, "[^/]+") + "$";
  const regex = new RegExp(regexPattern);
  return regex.test(pathname);
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, profileName, setAuth } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (!isAuthenticated) {
        try {
          const sessionValid = await checkSession();
          if (sessionValid) {
            setAuth({ isAuthenticated: true, profileName: profileName || "unknown" });
          }
        } catch (err) {
          console.error("Session check failed", err);
        }
      }
      setIsChecking(false);
    };

    verify();
  }, [isAuthenticated, setAuth, profileName]);

  if (isChecking) {
    return <div>Verifying session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const currentPath = location.pathname;
  let allowedRoles = null;

  for (const [pattern, roles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (matchRoute(currentPath, pattern)) {
      allowedRoles = roles;
      break;
    }
  }

  if (allowedRoles && !allowedRoles.includes(profileName?.toLowerCase())) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;