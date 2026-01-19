// src/components/ViewPatient.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { getPatientsList, deletePatient } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
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

const MARITAL_STATUS_OPTIONS = [
  { id: 1, label: 'Single' },
  { id: 2, label: 'Married' },
  { id: 3, label: 'Widowed' },
  { id: 4, label: 'Divorced' },
  { id: 5, label: 'Separated' },
];

// ────────────────────────────────────────────────
const ViewPatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [familyPatientName, setFamilyPatientName] = useState('—');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const data = await getPatientsList(clinicId, {
          PatientID: Number(id),
          BranchID: branchId
        });

        if (data && data.length > 0) {
          const currentPatient = data[0];
          setPatient(currentPatient);

          // Fetch family patient name if familyPatientId exists and is not 0
          if (currentPatient.familyPatientId && currentPatient.familyPatientId !== 0) {
            try {
              const familyData = await getPatientsList(clinicId, {
                PatientID: currentPatient.familyPatientId,
                BranchID: branchId
              });

              if (familyData && familyData.length > 0) {
                const familyPatient = familyData[0];
                setFamilyPatientName(`${familyPatient.firstName} ${familyPatient.lastName}`);
              }
            } catch (familyErr) {
              console.error('Failed to fetch family patient:', familyErr);
              // Don't set error state, just keep default '—' value
            }
          }
        } else {
          setError({ message: 'Patient not found' });
        }
      } catch (err) {
        console.error('fetchPatientDetails error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load patient details' }
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPatientDetails();
    }
  }, [id]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getGenderLabel = (genderId) => {
    return GENDER_OPTIONS.find((g) => g.id === genderId)?.label || '—';
  };

  const getBloodGroupLabel = (bloodGroupId) => {
    return BLOOD_GROUP_OPTIONS.find((b) => b.id === bloodGroupId)?.label || '—';
  };

  const getMaritalStatusLabel = (maritalStatusId) => {
    return MARITAL_STATUS_OPTIONS.find((m) => m.id === maritalStatusId)?.label || '—';
  };

  const 
  formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleUpdateClick = () => {
    navigate(`/update-patient/${patient.id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this patient?')) {
      return;
    }

    try {
      setError(null);
      await deletePatient(patient.id);
      navigate('/patient-list');
    } catch (err) {
      console.error('Delete patient failed:', err);
      setError({ message: err.message || 'Failed to delete patient.' });
    }
  };

  const handleBack = () => {
    navigate('/patient-list');
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading patient details...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  if (!patient) return <div className="clinic-error">Patient not found</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Patient Details" />

      {/* Back Button */}
      <div className="clinic-toolbar">
        <button onClick={handleBack} className="clinic-back-btn">
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      {/* Patient Details Card */}
      <div className="employee-details-card">
        
        {/* Header Section */}
        <div className="details-card-header">
          <div className="employee-header-info">
            <h2>
              {patient.firstName} {patient.lastName}
            </h2>
            <p className="clinic-subtitle">
              File No: {patient.fileNo || '—'} | Age: {patient.age || '—'} | {getGenderLabel(patient.gender)}
            </p>
            <span className={`status-badge large ${getStatusClass(patient.status)}`}>
              {patient.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Details Body */}
        <div className="details-card-body">
          
          {/* Section 1: Basic Information */}
          <div className="details-section">
            <h3 className="section-title">Basic Information</h3>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">File Number</span>
                <span className="detail-value">{patient.fileNo || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Patient Name</span>
                <span className="detail-value">
                  {patient.firstName} {patient.lastName}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Gender</span>
                <span className="detail-value">{getGenderLabel(patient.gender)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date of Birth</span>
                <span className="detail-value">{formatDate(patient.birthDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Age</span>
                <span className="detail-value">{patient.age || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Blood Group</span>
                <span className="detail-value">{getBloodGroupLabel(patient.bloodGroup)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Marital Status</span>
                <span className="detail-value">{getMaritalStatusLabel(patient.maritalStatus)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Family Patient</span>
                <span className="detail-value">{familyPatientName}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="details-section">
            <h3 className="section-title">Contact Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Mobile</span>
                <span className="detail-value">{patient.mobile || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Alternate Mobile</span>
                <span className="detail-value">{patient.altMobile || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{patient.email || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Emergency Contact</span>
                <span className="detail-value">{patient.emergencyContactNo || '—'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Address</span>
                <span className="detail-value">{patient.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Clinic Information */}
          <div className="details-section">
            <h3 className="section-title">Clinic Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Clinic Name</span>
                <span className="detail-value">{patient.clinicName || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Branch Name</span>
                <span className="detail-value">{patient.branchName || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className={`status-badge ${getStatusClass(patient.status)}`}>
                  {patient.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Medical Information */}
          <div className="details-section">
            <h3 className="section-title">Medical Information</h3>
            <div className="details-grid">
              <div className="detail-item full-width">
                <span className="detail-label">Allergies</span>
                <span className="detail-value">{patient.allergies || '—'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Existing Medical Conditions</span>
                <span className="detail-value">{patient.existingMedicalConditions || '—'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Past Surgeries</span>
                <span className="detail-value">{patient.pastSurgeries || '—'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Current Medications</span>
                <span className="detail-value">{patient.currentMedications || '—'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Family Medical History</span>
                <span className="detail-value">{patient.familyMedicalHistory || '—'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Immunization Records</span>
                <span className="detail-value">{patient.immunizationRecords || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 5: Timestamps */}
          <div className="details-section">
            <h3 className="section-title">Record Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Date Created</span>
                <span className="detail-value">{formatDate(patient.dateCreated)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Modified</span>
                <span className="detail-value">{formatDate(patient.dateModified)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="details-card-footer">
          <button onClick={handleDelete} className="btn-hold btn-delete">
            Delete Patient
          </button>
          <button onClick={handleUpdateClick} className="btn-update">
            Update Patient
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPatient;