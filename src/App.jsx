// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";

// Layout
import AdminLayout from "./AdminLayout/AdminLayout.jsx";

// Pages
import LoginPage from "./LoginPage/LoginPage";

// Protected Pages (inside AdminLayout)
import Dashboard from "./Dashboard/Dashboard.jsx";
import Patients from "./Patients/Patients.jsx";
import Appointments from "./Appointments/Appointments.jsx";
import Prescriptions from "./Prescriptions/Prescriptions.jsx";
import Reports from "./Reports/Reports.jsx";
import Settings from "./Settings/Settings.jsx";
import Attendance from "./Attendance/Attendance.jsx";
import ClinicList from "./ClinicList/ClinicList.jsx";
import BranchList from "./BranchList/BranchList.jsx";
import DepartmentList from "./DepartmentList/DepartmentList.jsx";
import EmployeeList from "./EmployeeList/EmployeeList.jsx";
import UpdateEmployee from "./EmployeeList/UpdateEmployee.jsx"

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
          <Route path="/branch-list" element={<BranchList />} />
          <Route path="/dept-list" element={<DepartmentList />} />
          <Route path="/employee-list" element={<EmployeeList />} />
          <Route path="/update-employee/:id" element={<UpdateEmployee />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/attendance" element={<Attendance/>}/>
          <Route path="/settings" element={<Settings />} />

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