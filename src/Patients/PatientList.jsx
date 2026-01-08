// src/components/PatientList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus } from 'react-icons/fi';
import { getPatientsList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddPatient from './AddPatient.jsx';
import './PatientList.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { id: 1, label: 'Male' },
  { id: 2, label: 'Female' },
  { id: 3, label: 'Other' },
];

const BLOOD_GROUP_OPTIONS = [
  { id: 1, label: 'A+' },
  { id: 2, label: 'A-' },
  { id: 3, label: 'B+' },
  { id: 4, label: 'B-' },
  { id: 5, label: 'AB+' },
  { id: 6, label: 'AB-' },
  { id: 7, label: 'O+' },
  { id: 8, label: 'O-' },
  { id: 9, label: 'Others' },
];

// ────────────────────────────────────────────────
const PatientList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [patients, setPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // ────────────────────────────────────────────────
  // Data fetching
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = localStorage.getItem('clinicID');
      const genderFilter = selectedGender === 'all' ? 0 : Number(selectedGender);
      const bloodGroupFilter = selectedBloodGroup === 'all' ? 0 : Number(selectedBloodGroup);

      const data = await getPatientsList(clinicId, {
        PatientID: 0,
        Gender: genderFilter,
        BloodGroup: bloodGroupFilter,
      });

      setPatients(data);
      setAllPatients(data);
    } catch (err) {
      console.error('fetchPatients error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load patients' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [selectedGender, selectedBloodGroup]);

  // ────────────────────────────────────────────────
  // Computed values
  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return allPatients;
    const term = searchTerm.toLowerCase();
    return allPatients.filter(
      (patient) =>
        patient.patientName?.toLowerCase().includes(term) ||
        patient.firstName?.toLowerCase().includes(term) ||
        patient.lastName?.toLowerCase().includes(term) ||
        patient.fileNo?.toLowerCase().includes(term) ||
        patient.mobile?.toLowerCase().includes(term) ||
        patient.email?.toLowerCase().includes(term)
    );
  }, [allPatients, searchTerm]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getGenderLabel = (genderId) => {
    return GENDER_OPTIONS.find((g) => g.id === genderId)?.label || '—';
  };

  const getBloodGroupLabel = (bloodGroupId) => {
    return BLOOD_GROUP_OPTIONS.find((bg) => bg.id === bloodGroupId)?.label || '—';
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleViewDetails = (patient) => {
    navigate(`/view-patient/${patient.id}`);
  };

  const openAddForm = () => setIsAddFormOpen(true);

  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchPatients();
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading patients...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Patient Management" />

      {/* Toolbar */}
      <div className="clinic-toolbar">
        <div className="clinic-select-wrapper">
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="clinic-select"
          >
            <option value="all">All Genders</option>
            {GENDER_OPTIONS.map((gender) => (
              <option key={gender.id} value={gender.id}>
                {gender.label}
              </option>
            ))}
          </select>
        </div>

        <div className="clinic-select-wrapper">
          <select
            value={selectedBloodGroup}
            onChange={(e) => setSelectedBloodGroup(e.target.value)}
            className="clinic-select"
          >
            <option value="all">All Blood Groups</option>
            {BLOOD_GROUP_OPTIONS.map((bg) => (
              <option key={bg.id} value={bg.id}>
                {bg.label}
              </option>
            ))}
          </select>
        </div>

        <div className="clinic-search-container">
          <input
            type="text"
            placeholder="Search by name, file no, mobile..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="clinic-search-input"
          />
          <button onClick={handleSearch} className="clinic-search-btn">
            <FiSearch size={20} />
          </button>
        </div>

        <div className="clinic-add-section">
          <button onClick={openAddForm} className="clinic-add-btn">
            <FiPlus size={22} /> Add Patient
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="clinic-table-container">
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>File No</th>
              <th>Gender</th>
              <th>Age</th>
              <th>Blood Group</th>
              <th>Mobile</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={8} className="clinic-no-data">
                  {searchTerm ? 'No patients found.' : 'No patients registered yet.'}
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div className="clinic-name-cell">
                      <div className="clinic-avatar">
                        {patient.firstName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className="clinic-name">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="clinic-type">{patient.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{patient.fileNo || '—'}</td>
                  <td>{getGenderLabel(patient.gender)}</td>
                  <td>{patient.age || '—'}</td>
                  <td>
                    <span className="branch-type-badge">
                      {getBloodGroupLabel(patient.bloodGroup)}
                    </span>
                  </td>
                  <td>{patient.mobile || '—'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(patient.status)}`}>
                      {patient.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleViewDetails(patient)} 
                      className="clinic-details-btn"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ──────────────── Add Patient Modal ──────────────── */}
      <AddPatient
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default PatientList;