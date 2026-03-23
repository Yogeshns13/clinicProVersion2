import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";

const ROUTE_PERMISSIONS = {
  "/dashboard": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts","doctor"],

  "/clinic-list": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts","doctor"],
  "/branch-list": ["admin","spradmin","fronttdesk","nurse","pharmacy","labtest","accounts","doctor"],
  "/dept-list": ["admin", "spradmin","fronttdesk","nurse","pharmacy","labtest","accounts"],

  "/work-shift": ["admin", "doctor", "nurse", "fronttdesk"],
  "/employee-list": ["admin","fronttdesk","nurse"],
  "/admin-employee-list": ["spradmin"],

  "/patient-list": ["admin", "fronttdesk","nurse","accounts","doctor",],
  "/slotconfig-list": ["admin", "fronttdesk"],
  "/slot-list": ["admin", "fronttdesk","nurse","doctor"],
  "/appointment-list": ["admin", "fronttdesk","nurse","doctor"],
  "/patientvisit-list": ["admin", "fronttdesk","nurse","doctor"],

  "/consultation-list": ["admin", "doctor"],
  "/consulted-patient": ["fronttdesk","nurse","accounts"],
  "/view-consultation/:id": ["admin", "nurse","fronttdesk", "doctor", "accounts"],
  "/consultationcharge-config": ["admin", "fronttdesk","accounts"],
  "/consultation-charge": ["admin", "fronttdesk","accounts"],

  "/labtestmaster": ["admin","labtest","accounts"],
  "/laborder-list": ["admin", "labtest"],
  "/labwork-list": ["admin", "labtest"],
  "/lab-report-list": ["admin", "fronttdesk","labtest","doctor"],
  "/lab-invoice": ["admin", "labtest"],

  "/vendor-list": ["admin", "pharmacy"],
  "/medicinemaster-list": ["admin", "pharmacy","accounts","doctor", "fronttdesk"],
  "/medicinestock-list": ["admin", "fronttdesk","pharmacy","doctor"],
  "/purchaseorder-list": ["admin", "pharmacy"],
  "/purchaseorderitem": ["admin","pharmacy"],
  "/salescart-list": ["admin","pharmacy" ],
  "/salescartdetail-list/:id": ["admin", "pharmacy"],
  "/pharmacy-invoice": ["admin",  "pharmacy"],

  "/invoice-management": ["admin","fronttdesk","pharmacy","labtest","accounts","doctor"],
  "/invoice-payment": ["admin", "pharmacy","labtest","accounts","doctor", "fronttdesk"],

  "/view-patient/:id": ["admin",  "doctor", "fronttdesk", "nurse", "accounts"],
  "/add-patient": ["admin", "fronttdesk"],
  "/update-patient/:id": ["admin", "fronttdesk"],
  "/add-slotconfig": ["admin", "fronttdesk"],
  "/generate-slots": ["admin", "fronttdesk"],
  "/add-appointment": ["admin", "fronttdesk"],
  "/view-appointment": ["admin", "fronttdesk"],
  "/add-patientvisit": ["admin", "fronttdesk", "nurse"],
  "/view-patientvisit": ["admin","fronttdesk", "nurse"],
  "/update-patientvisit/:id": ["admin", "fronttdesk", "nurse"],
  "/add-consultation": ["admin","doctor"],
  "/update-consultation/:id": ["admin","doctor"],
  "/view-laborder/:id": ["admin", "labtest"],
  "/update-lab-report/:id": ["admin", "labtest"],
  "/add-medicinemaster": ["admin", "pharmacy","accounts"],
  "/update-medicinemaster/:id": ["admin", "pharmacy","accounts"],
  "/medicine-stock/:id": ["admin", "pharmacy"],
  "/view-purchaseorder/:id": ["admin", "pharmacy"],
  "/add-puchaseorder": ["admin", "pharmacy"], 
  "/view-purchaseorderdetail/:id": ["admin", "pharmacy"],
  "/Add-purchaseorderdetail": ["admin", "pharmacy"],
  "/update-purchaseorderdetail/:id": ["admin", "pharmacy"],
  "/view-prescription/:id": ["admin"],
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