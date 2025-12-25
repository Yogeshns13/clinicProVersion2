// src/components/layout/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import './AdminLayout.css';
import Sidebar from '../Sidebar/sidebar';
import { useTokenRenewal } from '../hooks/TokenRenewal'; // Adjust path if needed

const AdminLayout = () => {
  useTokenRenewal();

  return (
    <div className="dashboard-container">
      {/* Floating Icons */}
      <img src="/assets/scope.svg" alt="" className="floating-icon scope" />
      <img src="/assets/meter.svg" alt="" className="floating-icon meter" />

      <Sidebar />
      <main className="main-content">
        <Outlet /> {/* Renders Dashboard, Patients, Appointments, etc. */}
      </main>
    </div>
  );
};

export default AdminLayout;