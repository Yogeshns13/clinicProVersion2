import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./Contexts/AuthContext.jsx";
import PrivateRoute from "./Component/PrivateRoute.jsx";
import { useTokenRenewal } from "./Hooks/TokenRenewal";

import AdminLayout from "./AdminLayout/AdminLayout.jsx";
import LoginPage from "./LoginPage/LoginPage.jsx";

import Dashboard from "./Dashboard/Dashboard.jsx";

import ClinicList from "./ClinicList/ClinicList.jsx";
import BranchList from "./BranchList/BranchList.jsx";
import DepartmentList from "./DepartmentList/DepartmentList.jsx";

import WorkShift from "./WorkShiftList/WorkShift.jsx";
import EmployeeList from "./EmployeeList/EmployeeList.jsx";
import AdminEmployeeList from "./AdminEmployeeList/AdminEmployeeList.jsx";
import PatientList from "./Patients/PatientList.jsx";
import SlotConfigList from "./Slot/SlotConfigList.jsx";
import SlotList from "./Slot/SlotList.jsx";
import AppointmentList from "./Appointments/AppointmentList.jsx";
import PatientVisitList from "./PatientVisit/PatientVisitList.jsx";

import ConsultationList from "./Consultation/ConsultationList.jsx";
import ConsultedPatients from "./Consultation/ConsultedPatients.jsx";
import ViewConsultation from "./Consultation/ViewConsultation.jsx";
import ConsultationChargeConfig from "./ConsultationCharge/ConsultationChargeConfig.jsx";
import ConsultationChargeList from "./ConsultationCharge/ConsultationChargeList.jsx";

import LabMasterList from "./LabTestMaster/LabMastersList.jsx";
import LabOrderList from "./LabWork/LabOrderList.jsx";
import LabWorkQueue from "./LabWork/LabWorkQueue.jsx";
import LabReportList from "./LabReport/LabReportList.jsx";
import LabInvoiceList from "./LabTestMaster/LabInvoiceList.jsx";

import VendorList from "./Vendor/VendorList.jsx";
import MedicineMasterList from "./MedicineMaster/MedicineMasterList.jsx";
import MedicineStockList from "./MedicineStock/MedicineStockList.jsx";
import PurchaseOrderList from "./PurchaseOrder/PurchaseOrderList.jsx";
import PurchaseOrderItems from "./PurchaseOrder/PurchaseOrderItems.jsx";
import SalesCartList from "./SalesCart/SalesCartList.jsx";
import SalesCartDetailList from "./SalesCart/SalesCartDetailList.jsx";
import PharmacyInvoiceList from "./MedicineMaster/PharmacyInvoiceList.jsx";

import InvoiceManagement from "./ConsultationCharge/InvoiceManagement.jsx";
import InvoicePaymentManagement from "./ConsultationCharge/InvoicePaymentManagement.jsx";
import Logout from "./Logout/Logout.jsx";

// Inner component so useTokenRenewal runs inside AuthProvider + Router context
function AppInner() {
  useTokenRenewal();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected Routes - All use AdminLayout (Sidebar + Header) */}
      <Route
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/clinic-list" element={<ClinicList />} />
        <Route path="/branch-list" element={<BranchList />} />
        <Route path="/dept-list" element={<DepartmentList />} />

        <Route path="/work-shift" element={<WorkShift />} />
        <Route path="/employee-list" element={<EmployeeList />} />
        <Route path="/admin-employee-list" element={<AdminEmployeeList />} />

        <Route path="/patient-list" element={<PatientList />} />
        <Route path="/slotconfig-list" element={<SlotConfigList />} />
        <Route path="/slot-list" element={<SlotList />} />
        <Route path="/appointment-list" element={<AppointmentList />} />
        <Route path="/patientvisit-list" element={<PatientVisitList />} />

        <Route path="/consultation-list" element={<ConsultationList />} />
        <Route path="/consulted-patient" element={<ConsultedPatients />} />
        <Route path="/view-consultation/:id" element={<ViewConsultation />} />
        <Route path="/consultationcharge-config" element={<ConsultationChargeConfig />} />
        <Route path="/consultation-charge" element={<ConsultationChargeList />} />

        <Route path="/labtestmaster" element={<LabMasterList />} />
        <Route path="/laborder-list" element={<LabOrderList />} />
        <Route path="/labwork-list" element={<LabWorkQueue />} />
        <Route path="/lab-report-list" element={<LabReportList />} />
        <Route path="/lab-invoice" element={<LabInvoiceList />} />

        <Route path="/vendor-list" element={<VendorList />} />
        <Route path="/medicinemaster-list" element={<MedicineMasterList />} />
        <Route path="/medicinestock-list" element={<MedicineStockList />} />
        <Route path="/purchaseorder-list" element={<PurchaseOrderList />} />
        <Route path="/purchaseorderitem/:id" element={<PurchaseOrderItems />} />
        <Route path="/salescart-list" element={<SalesCartList />} />
        <Route path="/salescartdetail-list/:id" element={<SalesCartDetailList />} />
        <Route path="/pharmacy-invoice" element={<PharmacyInvoiceList />} />

        <Route path="/invoice-management" element={<InvoiceManagement />} />
        <Route path="/invoice-payment" element={<InvoicePaymentManagement />} />
        <Route path="/logout" element={<Logout />} />

        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Catch-all - Redirect to login if not found */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;