// src/components/patients/Patients.jsx
import React, { useState } from "react";
import "./Patients.css";
import {FiSearch} from "react-icons/fi";

const mockPatients = [
  { id: 1, name: "Arun Kumar", age: 42, gender: "Male", phone: "+91 98765 43210", lastVisit: "2025-11-10", status: "Active" },
  { id: 2, name: "Priya Sharma", age: 28, gender: "Female", phone: "+91 87654 32109", lastVisit: "2025-11-15", status: "Active" },
  { id: 3, name: "Ravi Patel", age: 35, gender: "Male", phone: "+91 76543 21098", lastVisit: "2025-10-28", status: "Inactive" },
  { id: 4, name: "Sneha Reddy", age: 19, gender: "Female", phone: "+91 65432 10987", lastVisit: "2025-11-18", status: "Active" },
  { id: 5, name: "Vikram Singh", age: 58, gender: "Male", phone: "+91 54321 09876", lastVisit: "2025-09-20", status: "Inactive" },
  { id: 6, name: "Neha Gupta", age: 31, gender: "Female", phone: "+91 98765 12345", lastVisit: "2025-11-17", status: "Active" },
];

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGender, setFilterGender] = useState("All");
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"

  const filteredPatients = mockPatients.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          patient.phone.includes(searchTerm);
    const matchesGender = filterGender === "All" || patient.gender === filterGender;
    return matchesSearch && matchesGender;
  });

  return (
    <div className="patients-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Patients</h1>
          <p>Manage patient records and history</p>
        </div>
        <button className="btn-new-patient">
          Add New Patient
        </button>
      </div>

      {/* Controls */}
      <div className="patients-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FiSearch className="search-icon" />
        </div>

        <div className="filters">
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="gender-filter"
          >
            <option value="All">All Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <div className="view-toggle">
            <button
              className={viewMode === "table" ? "active" : ""}
              onClick={() => setViewMode("table")}
            >
              Table View
            </button>
            <button
              className={viewMode === "cards" ? "active" : ""}
              onClick={() => setViewMode("cards")}
            >
              Card View
            </button>
          </div>
        </div>
      </div>

      {/* Patients List - Table View */}
      {viewMode === "table" && (
        <div className="patients-table-wrapper">
          <table className="patients-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Last Visit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No patients found</td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className="patient-cell">
                        <span className="avatar">{patient.name[0]}</span>
                        <div>
                          <div className="patient-name">{patient.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>{patient.age}</td>
                    <td>
                      <span className={`gender-badge ${patient.gender.toLowerCase()}`}>
                        {patient.gender === "Male" ? "Male" : "Female"}
                      </span>
                    </td>
                    <td>{patient.phone}</td>
                    <td>{patient.lastVisit}</td>
                    <td>
                      <span className={`status-badge ${patient.status.toLowerCase()}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn view">View</button>
                      <button className="action-btn edit">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Patients List - Card View */}
      {viewMode === "cards" && (
        <div className="patients-grid">
          {filteredPatients.length === 0 ? (
            <div className="no-data-cards">No patients found</div>
          ) : (
            filteredPatients.map((patient) => (
              <div key={patient.id} className="patient-card">
                <div className="card-header">
                  <span className="avatar large">{patient.name[0]}</span>
                  <div>
                    <h3>{patient.name}</h3>
                    <p>{patient.age} years • {patient.gender}</p>
                  </div>
                </div>
                <div className="card-body">
                  <p><strong>Phone:</strong> {patient.phone}</p>
                  <p><strong>Last Visit:</strong> {patient.lastVisit}</p>
                </div>
                <fdiv className="card-footer">
                  <span className={`status-badge ${patient.status.toLowerCase()}`}>
                    {patient.status}
                  </span>
                  <div className="card-actions">
                    <button className="action-btn view">View Profile</button>
                  </div>
                </fdiv>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}