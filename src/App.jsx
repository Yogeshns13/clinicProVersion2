// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import AdminLayout from "./AdminLayout/AdminLayout.jsx";
import LoginPage from "./LoginPage/LoginPage";
import Dashboard from "./Dashboard/Dashboard.jsx";
import ClinicList from "./ClinicList/ClinicList.jsx";
import BranchList from "./BranchList/BranchList.jsx";
import DepartmentList from "./DepartmentList/DepartmentList.jsx";
import EmployeeList from "./EmployeeList/EmployeeList.jsx";
import UpdateEmployee from "./EmployeeList/UpdateEmployee.jsx"
import UpdateClinic from "./ClinicList/UpdateClinic.jsx";
import UpdateBranch from "./BranchList/UpdateBranch.jsx";
import UpdateDepartment from "./DepartmentList/UpdateDepartment.jsx";
import AddEmployee from "./EmployeeList/AddEmployee.jsx";
import ViewEmployee from "./EmployeeList/ViewEmployee.jsx";
import EmployeeProof from "./EmployeeList/EmployeeProof.jsx";
import EmployeeAccount from "./EmployeeList/EmployeeAccount.jsx";
import EmployeeShift from "./EmployeeList/EmployeeShift.jsx";
import WorkShift from "./WorkShiftList/WorkShift.jsx";
import UpdateWorkShift from "./WorkShiftList/UpdateWorkShift.jsx";
import PatientList from "./Patients/PatientList.jsx";
import ViewPatient from "./Patients/ViewPatinet.jsx";
import AddPatient from "./Patients/AddPatient.jsx";
import UpdatePatient from "./Patients/UpdatePatient.jsx";
import AddSlotConfig from "./Slot/AddSlotConfig.jsx";
import GenerateSlots from "./Slot/GenerateSlots.jsx";
import SlotConfigList from "./Slot/SlotConfigList.jsx";
import SlotList from "./Slot/SlotList.jsx";
import AppointmentList from "./Appointments/AppointmentList.jsx";
import AddAppointment from "./Appointments/AddAppointment.jsx";
import ViewAppointment from "./Appointments/ViewAppointment.jsx";
import AddPatientVisit from "./PatientVisit/AddPatientVisit.jsx";
import ViewPatientVisit from "./PatientVisit/ViewPatientVisit.jsx";
import UpdatePatientVisit from "./PatientVisit/UpdatePatientVisit.jsx";
import PatientVisitList from "./PatientVisit/PatientVistList.jsx";
import ConsultationList from "./Consultation/ConsultationList.jsx";
import ViewConsultation from "./Consultation/ViewConsultation.jsx";
import AddConsultation from "./Consultation/AddConsultation.jsx";
import UpdateConsultation from "./Consultation/UpdateConsultation.jsx";
import ConsultationChargeConfig from "./ConsultationCharge/Consultationchargeconfig.jsx";
import ConsultationChargeList from "./ConsultationCharge/Consultationchargelist.jsx";
import InvoiceManagement from "./ConsultationCharge/Invoicemanagement.jsx";
import InvoicePaymentManagement from "./ConsultationCharge/Invoicepaymentmanagement.jsx";
import ViewVendor from "./Vendor/ViewVendor.jsx";
import VendorList from "./Vendor/VendorList.jsx";
import AddVendor from "./Vendor/AddVendor.jsx";
import UpdateVendor from "./Vendor/UpdateVendor.jsx";
import ViewMedicineMaster from "./MedicineMaster/ViewMedicineMaster.jsx";
import MedicineMasterList from "./MedicineMaster/MedicineMasterList.jsx";
import AddMedicineMaster from "./MedicineMaster/Addmedicinemaster.jsx";
import UpdateMedicineMaster from "./MedicineMaster/UpdateMedicineMaster.jsx";
import ViewPrescription from "./Consultation/ViewPrescription.jsx";
import ViewLabOrder from "./Consultation/ViewLabOrder.jsx";
import UpdateLabTestMaster from "./LabTestMaster/Updatelabtestmaster.jsx";
import UpdateLabTestPackage from "./LabTestMaster/Updatelabtestpackage.jsx";
import ViewLabPackage from "./LabTestMaster/ViewLabPackage.jsx";
import ViewLabMaster from "./LabTestMaster/ViewLabMaster.jsx";
import LabMasterList from "./LabTestMaster/Labmasterlist.jsx";
import MedicineStockList from "./MedicineStock/MedicineStocklist.jsx";
import UpdateMedicineStock from "./MedicineStock/UpdateMedicineStock.jsx";
import LabWorkQueue from "./LabWork/LabWorkQueue.jsx";
import MedicineStockByMedicine from "./MedicineMaster/MedicineStockbyMedicine.jsx";
import LabOrderList from "./LabWork/LabOrderList.jsx";
import PurchaseOrderList from "./PurchaseOrder/PurchaseOrderList.jsx";
import AddPurchaseOrder from "./PurchaseOrder/AddPurchaseOrder.jsx";
import ViewPurchaseOrder from "./PurchaseOrder/ViewPurchaseOrder.jsx";
import PurchaseOrderItems from "./PurchaseOrder/PurchaseOrderItems.jsx";
import AddPurchaseOrderDetail from "./PurchaseOrder/AddPurchaseOrderDetail.jsx";
import UpdatePurchaseOrderDetail from "./PurchaseOrder/UpdatePurchaseOrderDetail.jsx";



function App() {
  return (
    <AuthProvider>
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
          <Route path="/update-clinic/:id" element={<UpdateClinic />} />
          <Route path="/branch-list" element={<BranchList />} />
          <Route path="/update-branch/:id" element={<UpdateBranch/>} />
          <Route path="/dept-list" element={<DepartmentList />} />
          <Route path="/update-dept/:id" element={<UpdateDepartment />} />
          <Route path="/work-shift" element={<WorkShift/>} />
          <Route path="/update-shift/:id" element={<UpdateWorkShift />} />
          <Route path="/employee-list" element={<EmployeeList />} />
          <Route path="/add-employee" element={<AddEmployee />} />
          <Route path="/view-employee/:id" element={<ViewEmployee />} />
          <Route path="/update-employee/:id" element={<UpdateEmployee />} />
          <Route path="/employee-proof/:id" element={<EmployeeProof />} />
          <Route path="/employee-account/:id" element={<EmployeeAccount />} />
          <Route path="/employee-shift/:id" element={<EmployeeShift />} />
          <Route path="/patient-list" element={<PatientList />} />
          <Route path="/view-patient/:id" element={<ViewPatient />} />
          <Route path="/add-patient" element={<AddPatient />} />
          <Route path="/update-patient/:id" element={<UpdatePatient />} />
          <Route path="/add-slotconfig" element={<AddSlotConfig/>}/>
          <Route path="/generate-slots" element={<GenerateSlots />} />
          <Route path="/slotconfig-list" element={<SlotConfigList/>}/>
          <Route path="/slot-list" element={<SlotList/>} />
          <Route path="/appointment-list" element={<AppointmentList/>} />
          <Route path="/add-appointment" element={<AddAppointment/>} />
          <Route path="/view-appointment" element={<ViewAppointment/>} />
          <Route path="/patientvisit-list" element={<PatientVisitList/>} />
          <Route path="/add-patientvisit" element={<AddPatientVisit/>} />
          <Route path="/view-patientvisit" element={<ViewPatientVisit/>} />
          <Route path="/update-patientvisit/:id" element={<UpdatePatientVisit/>} />
          <Route path="/consultation-list" element={<ConsultationList/>} />
          <Route path="/view-consultation/:id" element={<ViewConsultation/>} />
          <Route path="/add-consultation" element={<AddConsultation/>} />
          <Route path="/update-consultation/:id" element={<UpdateConsultation/>} />
          <Route path="/consultationcharge-config" element={<ConsultationChargeConfig/>} />
          <Route path="/consultation-charge" element={<ConsultationChargeList/>} />
          <Route path="/invoice-management" element={<InvoiceManagement/>} />
          <Route path="/invoice-payment" element={<InvoicePaymentManagement/>} />
          <Route path="/vendor-list" element={<VendorList/>} />
          <Route path="/view-vendor/:id" element={<ViewVendor/>} />
          <Route path="/add-vendor" element={<AddVendor/>} />
          <Route path="/update-vendor/:id" element={<UpdateVendor/>} />
          <Route path="/medicinemaster-list" element={<MedicineMasterList/>} />
          <Route path="/medicine-stock/:id" element={<MedicineStockByMedicine/>} />
          <Route path="/add-medicinemaster" element={<AddMedicineMaster/>} />
          <Route path="/update-medicinemaster/:id" element={<UpdateMedicineMaster/>} />
          <Route path="/view-medicinemaster/:id" element={<ViewMedicineMaster/>} />
          <Route path="/view-prescription/:id" element={<ViewPrescription/>} />
          <Route path="/view-laborder/:id" element={<ViewLabOrder/>} />
          <Route path="/labtestmaster" element={<LabMasterList/>} />
          <Route path="/update-labmaster/:id" element={<UpdateLabTestMaster/>} />
          <Route path="/update-labpackage/:id" element={<UpdateLabTestPackage/>} />
          <Route path="/view-labpackage/:id" element={<ViewLabPackage/>} />
          <Route path="/view-labmaster/:id" element={<ViewLabMaster/>} />
          <Route path="/labwork-list" element={<LabWorkQueue/>} />
          <Route path="/purchaseorder-list" element={<PurchaseOrderList/>} />
          <Route path="/add-purchaseorder" element={<AddPurchaseOrder/>} />
          <Route path="/view-purchaseorder/:id" element={<ViewPurchaseOrder/>} />
          <Route path="/purchaseorderitem" element={<PurchaseOrderItems/>} />
          <Route path="/add-purchaseorderdetail" element={<AddPurchaseOrderDetail/>} />
          <Route path="/update-purchaseorderdetail/:id" element={<UpdatePurchaseOrderDetail/>} />
          <Route path="/laborder-list" element={<LabOrderList/>} />
          <Route path="/medicinestock-list" element={<MedicineStockList/>} />
          <Route path="/update-medicinestock/:id" element={<UpdateMedicineStock/>} />
          

          {/* Default redirect inside protected area */}
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
        </Route>

        {/* Catch-all - Redirect to login if not found */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;