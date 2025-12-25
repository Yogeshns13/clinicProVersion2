// src/components/prescriptions/Prescriptions.jsx
import React, { useState } from "react";
import "./Prescriptions.css";
import {FiSearch} from "react-icons/fi";

const mockPrescriptions = [
  {
    id: 1,
    patient: "Arun Kumar",
    date: "2025-11-18",
    medicines: ["Paracetamol 500mg", "Amoxicillin 250mg", "Cough Syrup"],
    doctor: "Dr. Sharma",
    status: "Issued",
  },
  {
    id: 2,
    patient: "Priya Sharma",
    date: "2025-11-17",
    medicines: ["Metformin 500mg", "Atorvastatin 10mg"],
    doctor: "Dr. Verma",
    status: "Pending",
  },
  {
    id: 3,
    patient: "Ravi Patel",
    date: "2025-11-15",
    medicines: ["Ibuprofen 400mg", "Ranitidine 150mg"],
    doctor: "Dr. Sharma",
    status: "Issued",
  },
  {
    id: 4,
    patient: "Sneha Reddy",
    date: "2025-11-14",
    medicines: ["Cetirizine 10mg", "Vitamin D3"],
    doctor: "Dr. Gupta",
    status: "Cancelled",
  },
  {
    id: 5,
    patient: "Vikram Singh",
    date: "2025-11-12",
    medicines: ["Aspirin 75mg", "Losartan 50mg"],
    doctor: "Dr. Sharma",
    status: "Issued",
  },
];

export default function Prescriptions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"

  const filteredPrescriptions = mockPrescriptions.filter((pres) => {
    const matchesSearch =
      pres.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pres.doctor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "All" || pres.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="prescriptions-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Prescriptions</h1>
          <p>Manage and issue patient prescriptions</p>
        </div>
        <button className="btn-new-prescription">
          New Prescription
        </button>
      </div>

      {/* Controls */}
      <div className="prescriptions-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search patient or doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FiSearch className="search-icon" />
        </div>

        <div className="filters">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="All">All Status</option>
            <option value="Issued">Issued</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <div className="view-toggle">
            <button
              className={viewMode === "table" ? "active" : ""}
              onClick={() => setViewMode("table")}
            >
              Table
            </button>
            <button
              className={viewMode === "cards" ? "active" : ""}
              onClick={() => setViewMode("cards")}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="prescriptions-table-wrapper">
          <table className="prescriptions-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Medicines</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    No prescriptions found
                  </td>
                </tr>
              ) : (
                filteredPrescriptions.map((pres) => (
                  <tr key={pres.id}>
                    <td>
                      <div className="patient-cell">
                        <span className="avatar">{pres.patient[0]}</span>
                        <span className="patient-name">{pres.patient}</span>
                      </div>
                    </td>
                    <td>{pres.date}</td>
                    <td>
                      <div className="medicines-list">
                        {pres.medicines.map((med, i) => (
                          <span key={i}>{med}</span>
                        ))}
                      </div>
                    </td>
                    <td>{pres.doctor}</td>
                    <td>
                      <span className={`status-badge ${pres.status.toLowerCase()}`}>
                        {pres.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn view">View</button>
                      <button className="action-btn print">Print</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View (Default) */}
      {viewMode === "cards" && (
        <div className="prescriptions-grid">
          {filteredPrescriptions.length === 0 ? (
            <div className="no-data-cards">No prescriptions found</div>
          ) : (
            filteredPrescriptions.map((pres) => (
              <div key={pres.id} className="prescription-card">
                <div className="card-top">
                  <div className="patient-info">
                    <span className="avatar large">{pres.patient[0]}</span>
                    <div>
                      <h3>{pres.patient}</h3>
                      <p>Prescribed by {pres.doctor}</p>
                    </div>
                  </div>
                  <span className={`status-badge card-status ${pres.status.toLowerCase()}`}>
                    {pres.status}
                  </span>
                </div>

                <div className="card-body">
                  <div className="prescription-date">
                    <strong>Date:</strong> {pres.date}
                  </div>
                  <div className="medicines">
                    <strong>Medicines:</strong>
                    <ul>
                      {pres.medicines.map((med, i) => (
                        <li key={i}>{med}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="action-btn view">View Details</button>
                  <button className="action-btn print">Print</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}