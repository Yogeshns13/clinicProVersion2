import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";

const ROUTE_PERMISSIONS = {
  "/dashboard": ["admin","spradmin","frontdesk","nurse","pharmacy","labtech","accounts","doctor"],

  "/clinic-list": ["admin","spradmin","frontdesk","nurse","pharmacy","labtech","accounts","doctor"],
  "/branch-list": ["admin","spradmin","frontdesk","nurse","pharmacy","labtech","accounts","doctor"],
  "/dept-list": ["admin", "spradmin","frontdesk","nurse","pharmacy","labtech","accounts"],

  "/work-shift": ["admin", "doctor", "nurse", "frontdesk"],
  "/employee-list": ["admin", "nurse","frontdesk","nurse"],
  "/admin-employee-list": ["spradmin"],
  "/user-list": ["spradmin"],

  "/patient-list": ["admin", "frontdesk","nurse","accounts","doctor",],
  "/slotconfig-list": ["admin", "frontdesk"],
  "/slot-list": ["admin", "frontdesk","nurse","doctor"],
  "/appointment-list": ["admin", "frontdesk","nurse","doctor"],
  "/patientvisit-list": ["admin", "frontdesk","nurse","doctor"],

  "/consultation-list": ["admin", "doctor"],
  "/consulted-patient": ["frontdesk","nurse","accounts"],
  "/view-consultation/:id": ["admin", "nurse","frontdesk", "doctor", "accounts"],
  "/consultationcharge-config": ["admin", "frontdesk","accounts"],
  "/consultation-charge": ["admin", "frontdesk","accounts"],
  "/external-lab": ["admin","doctor","frontdesk"],
  

  "/labtestmaster": ["admin","labtech","accounts"],
  "/laborder-list": ["admin", "labtech"],
  "/labwork-list": ["admin", "labtech"],
  "/lab-report-list": ["admin", "frontdesk","labtech","doctor"],
  "/lab-invoice": ["admin", "labtech"],

  "/vendor-list": ["admin", "pharmacy"],
  "/medicinemaster-list": ["admin", "pharmacy","accounts","doctor", "frontdesk"],
  "/medicinestock-list": ["admin", "frontdesk","pharmacy","doctor"],
  "/purchaseorder-list": ["admin", "pharmacy"],
  "/purchaseorderitem": ["admin","pharmacy"],
  "/salescart-list": ["admin","pharmacy", "nurse" ],
  "/salescartdetail-list/:id": ["admin", "pharmacy", "nurse"],
  "/pharmacy-invoice": ["admin",  "pharmacy"],

  "/invoice-management": ["admin","frontdesk","pharmacy","labtech","accounts","doctor"],
  "/invoice-payment": ["admin", "pharmacy","labtech","accounts","doctor", "frontdesk"],

  "/view-patient/:id": ["admin",  "doctor", "frontdesk", "nurse", "accounts"],
  "/add-patient": ["admin", "frontdesk"],
  "/update-patient/:id": ["admin", "frontdesk"],
  "/add-slotconfig": ["admin", "frontdesk"],
  "/generate-slots": ["admin", "frontdesk"],
  "/add-appointment": ["admin", "frontdesk"],
  "/view-appointment": ["admin", "frontdesk"],
  "/add-patientvisit": ["admin", "frontdesk", "nurse"],
  "/view-patientvisit": ["admin","frontdesk", "nurse"],
  "/update-patientvisit/:id": ["admin", "frontdesk", "nurse"],
  "/add-consultation": ["admin","doctor"],
  "/update-consultation/:id": ["admin","doctor"],
  "/view-laborder/:id": ["admin", "labtech"],
  "/update-lab-report/:id": ["admin", "labtech"],
  "/add-medicinemaster": ["admin", "pharmacy","accounts"],
  "/update-medicinemaster/:id": ["admin", "pharmacy","accounts"],
  "/medicine-stock/:id": ["admin", "pharmacy"],
  "/view-purchaseorder/:id": ["admin", "pharmacy"],
  "/add-puchaseorder": ["admin", "pharmacy"], 
  "/view-purchaseorderdetail/:id": ["admin", "pharmacy"],
  "/Add-purchaseorderdetail": ["admin", "pharmacy"],
  "/update-purchaseorderdetail/:id": ["admin", "pharmacy"],
  "/view-prescription/:id": ["admin"],
  "/logout": ["admin","spradmin","frontdesk","nurse","pharmacy","labtech","accounts","doctor"]
};

const matchRoute = (pathname, pattern) => {
  const regexPattern = "^" + pattern.replace(/:[^/]+/g, "[^/]+") + "$";
  const regex = new RegExp(regexPattern);
  return regex.test(pathname);
};

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, profileName } = useAuth();
  const location = useLocation();

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