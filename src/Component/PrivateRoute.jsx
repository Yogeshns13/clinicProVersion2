import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";

const ROUTE_PERMISSIONS = {
  "/dashboard": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts","doctor"],

  "/clinic-list": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts","doctor"],
  "/branch-list": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts","doctor"],
  "/dept-list": ["admin", "spradmin","fronttdesk","nurse","pharmacy","labtest","accounts"],

  "/work-shift": ["admin", "doctor","spradmin","nurse", "fronttdesk"],
  "/employee-list": ["admin","spradmin","fronttdesk","nurse"],

  "/patient-list": ["admin", "spradmin","fronttdesk","nurse","accounts","doctor",],
  "/slotconfig-list": ["admin", "spradmin","fronttdesk"],
  "/slot-list": ["admin", "spradmin","fronttdesk","nurse","doctor"],
  "/appointment-list": ["admin", "spradmin","fronttdesk","nurse","doctor"],
  "/patientvisit-list": ["admin", "spradmin","fronttdesk","nurse"],

  "/consultation-list": ["admin", "spradmin", "doctor"],
  "/consulted-patient": ["admin", "spradmin","fronttdesk","nurse","accounts"],
  "/view-consultation/:id": ["admin", "spradmin", "nurse","fronttdesk", "doctor", "accounts"],
  "/consultationcharge-config": ["admin", "spradmin","fronttdesk","accounts"],
  "/consultation-charge": ["admin", "spradmin","fronttdesk","accounts"],

  "/labtestmaster": ["admin", "spradmin","labtest","accounts"],
  "/laborder-list": ["admin", "spradmin","labtest"],
  "/labwork-list": ["admin", "spradmin","labtest"],
  "/lab-report-list": ["admin", "spradmin","fronttdesk","labtest","doctor"],
  "/lab-invoice": ["admin", "spradmin","labtest"],

  "/vendor-list": ["admin", "spradmin","pharmacy"],
  "/medicinemaster-list": ["admin", "spradmin","pharmacy","accounts","doctor", "fronttdesk"],
  "/medicinestock-list": ["admin", "spradmin","fronttdesk","pharmacy","doctor"],
  "/purchaseorder-list": ["admin", "spradmin","pharmacy"],
  "/purchaseorderitem": ["admin", "spradmin","pharmacy"],
  "/salescart-list": ["admin", "spradmin","pharmacy" ],
  "/salescartdetail-list/:id": ["admin", "spradmin","pharmacy"],
  "/pharmacy-invoice": ["admin", "spradmin", "pharmacy"],

  "/invoice-management": ["admin", "spradmin","fronttdesk","pharmacy","labtest","accounts","doctor"],
  "/invoice-payment": ["admin", "spradmin","pharmacy","labtest","accounts","doctor", "fronttdesk"],

  "/view-patient/:id": ["admin", "spradmin", "doctor", "fronttdesk", "nurse", "accounts"],
  "/add-patient": ["admin", "spradmin","fronttdesk"],
  "/update-patient/:id": ["admin", "spradmin","fronttdesk"],
  "/add-slotconfig": ["admin", "spradmin","fronttdesk"],
  "/generate-slots": ["admin", "spradmin","fronttdesk"],
  "/add-appointment": ["admin", "spradmin","fronttdesk"],
  "/view-appointment": ["admin", "spradmin","fronttdesk"],
  "/add-patientvisit": ["admin", "spradmin","fronttdesk", "nurse"],
  "/view-patientvisit": ["admin", "spradmin","fronttdesk", "nurse"],
  "/update-patientvisit/:id": ["admin", "spradmin","fronttdesk", "nurse"],
  "/add-consultation": ["admin", "spradmin", "doctor"],
  "/update-consultation/:id": ["admin", "spradmin", "doctor"],
  "/view-laborder/:id": ["admin", "spradmin", "labtest"],
  "/update-lab-report/:id": ["admin", "spradmin","labtest"],
  "/add-medicinemaster": ["admin", "spradmin","pharmacy","accounts"],
  "/update-medicinemaster/:id": ["admin", "spradmin","pharmacy","accounts"],
  "/medicine-stock/:id": ["admin", "spradmin","pharmacy"],
  "/view-purchaseorder/:id": ["admin", "spradmin","pharmacy"],
  "/add-puchaseorder": ["admin", "spradmin","pharmacy"], 
  "/view-purchaseorderdetail/:id": ["admin", "spradmin","pharmacy"],
  "/Add-purchaseorderdetail": ["admin", "spradmin","pharmacy"],
  "/update-purchaseorderdetail/:id": ["admin", "spradmin","pharmacy"],
  "/view-prescription/:id": ["admin", "spradmin"],
  "/logout": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts","doctor"]
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