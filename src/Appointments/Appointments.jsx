// src/components/appointments/Appointments.jsx
import React, { useState } from "react";
import "./Appointments.css"; // We'll add CSS below
import {FiSearch,} from "react-icons/fi";

const mockAppointments = [
  { id: 1, patient: "Arun Kumar", date: "2025-11-18", time: "10:30 AM", type: "Checkup", doctor: "Dr. Sharma", status: "Confirmed" },
  { id: 2, patient: "Priya Sharma", date: "2025-11-18", time: "11:00 AM", type: "Follow-up", doctor: "Dr. Sharma", status: "Pending" },
  { id: 3, patient: "Ravi Patel", date: "2025-11-18", time: "02:00 PM", type: "Surgery", doctor: "Dr. Verma", status: "Confirmed" },
  { id: 4, patient: "Sneha Reddy", date: "2025-11-19", time: "09:15 AM", type: "Consultation", doctor: "Dr. Sharma", status: "Confirmed" },
  { id: 5, patient: "Vikram Singh", date: "2025-11-19", time: "03:30 PM", type: "Dental", doctor: "Dr. Gupta", status: "Cancelled" },
  { id: 6, patient: "Neha Gupta", date: "2025-11-20", time: "10:00 AM", type: "Vaccination", doctor: "Dr. Sharma", status: "Confirmed" },
];

export default function Appointments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredAppointments = mockAppointments.filter((apt) => {
    const matchesSearch = apt.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          apt.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || apt.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  return (
    <div className="appointments-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Appointments</h1>
          <p>Manage and track all patient appointments</p>
        </div>
        <button className="btn-new-appointment">
          New Appointment
        </button>
      </div>

      {/* Filters & Search */}
      <div className="appointments-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search patient or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FiSearch className="search-icon" />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="status-filter"
        >
          <option value="All">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Appointments Table */}
      <div className="appointments-table-wrapper">
        <table className="appointments-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Time</th>
              <th>Type</th>
              <th>Doctor</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No appointments found</td>
              </tr>
            ) : (
              filteredAppointments.map((apt) => (
                <tr key={apt.id}>
                  <td>
                    <div className="patient-cell">
                      <span className="avatar">{apt.patient[0]}</span>
                      <div>
                        <div className="patient-name">{apt.patient}</div>
                      </div>
                    </div>
                  </td>
                  <td>{apt.date}</td>
                  <td>{apt.time}</td>
                  <td>{apt.type}</td>
                  <td>{apt.doctor}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn edit">Edit</button>
                    <button className="action-btn cancel">Cancel</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}