// src/components/ViewEmployee.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUser, FiArrowLeft } from 'react-icons/fi';
import { getEmployeeList, deleteEmployee, getFile } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './ViewEmployee.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { id: 1, label: 'Male' },
  { id: 2, label: 'Female' },
  { id: 3, label: 'Other' },
];

const DESIGNATION_OPTIONS = [
  { id: 1, label: 'Doctor' },
  { id: 2, label: 'Nurse' },
  { id: 3, label: 'Receptionist' },
  { id: 4, label: 'Pharmacist' },
  { id: 5, label: 'Lab Technician' },
  { id: 6, label: 'Billing Staff' },
  { id: 7, label: 'Manager' },
  { id: 8, label: 'Attendant' },
  { id: 9, label: 'Cleaner' },
  { id: 10, label: 'Others' },
];

const BLOOD_GROUP_OPTIONS = [
  { id: 1, label: 'A+' },
  { id: 2, label: 'A-' },
  { id: 3, label: 'B+' },
  { id: 4, label: 'B-' },
  { id: 5, label: 'O+' },
  { id: 6, label: 'O-' },
  { id: 7, label: 'AB+' },
  { id: 8, label: 'AB-' },
];

const MARITAL_STATUS_OPTIONS = [
  { id: 1, label: 'Single' },
  { id: 2, label: 'Married' },
  { id: 3, label: 'Divorced' },
  { id: 4, label: 'Widowed' },
];

const ID_PROOF_OPTIONS = [
  { id: 1, label: 'Aadhaar Card' },
  { id: 2, label: 'PAN Card' },
  { id: 3, label: 'Voter ID' },
  { id: 4, label: 'Driving License' },
  { id: 5, label: 'Passport' },
];

// ────────────────────────────────────────────────
const ViewEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [employeePhoto, setEmployeePhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  
  const getStoredClinicId = () => {
  const clinicId = localStorage.getItem('clinicID');
  return clinicId ? parseInt(clinicId, 10) : null;
};

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = localStorage.getItem('clinicID');

        const data = await getEmployeeList(clinicId, {
          EmployeeID: Number(id),
          DepartmentID: 0,
        });

        if (data && data.length > 0) {
          setEmployee(data[0]);
        } else {
          setError({ message: 'Employee not found' });
        }
      } catch (err) {
        console.error('fetchEmployeeDetails error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load employee details' }
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployeeDetails();
    }
  }, [id]);

  // Cleanup function for photo URL
  useEffect(() => {
    return () => {
      if (employeePhoto) {
        URL.revokeObjectURL(employeePhoto);
      }
    };
  }, [employeePhoto]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getGenderLabel = (genderId) => {
    return GENDER_OPTIONS.find((g) => g.id === genderId)?.label || '—';
  };

  const getDesignationLabel = (designationId) => {
    return DESIGNATION_OPTIONS.find((d) => d.id === designationId)?.label || '—';
  };

  const getBloodGroupLabel = (bloodGroupId) => {
    return BLOOD_GROUP_OPTIONS.find((b) => b.id === bloodGroupId)?.label || '—';
  };

  const getMaritalStatusLabel = (maritalStatusId) => {
    return MARITAL_STATUS_OPTIONS.find((m) => m.id === maritalStatusId)?.label || '—';
  };

  const getIdProofLabel = (idProofId) => {
    return ID_PROOF_OPTIONS.find((i) => i.id === idProofId)?.label || '—';
  };

  const maskIdNumber = (idNumber) => {
    if (!idNumber) return '—';
    const cleanId = idNumber.replace(/\s|-/g, '');
    if (cleanId.length <= 4) return idNumber;
    const lastFour = cleanId.slice(-4);
    const masked = 'X'.repeat(Math.min(cleanId.length - 4, 8));
    return `${masked}-${lastFour}`;
  };

  const formatDate = (dateString) => {
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
  const handleViewPhoto = async () => {
    if (!employee?.photoFileId || employee.photoFileId <= 0) return;
    
    setPhotoLoading(true);
    try {
      const photoData = await getFile(employee.photoFileId);
      setEmployeePhoto(photoData.url);
    } catch (err) {
      console.error('Failed to load employee photo:', err);
      setEmployeePhoto(null);
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleUpdateClick = () => {
    navigate(`/update-employee/${employee.id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      setError(null);
      await deleteEmployee(employee.id);
      navigate('/employee-list');
    } catch (err) {
      console.error('Delete employee failed:', err);
      setError({ message: err.message || 'Failed to delete employee.' });
    }
  };

  const handleBack = () => {
    navigate('/employee-list');
  };

  const handleTabClick = (tab, path) => {
    if (path) {
      navigate(path);
    } else {
      setActiveTab(tab);
    }
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading employee details...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  if (!employee) return <div className="clinic-error">Employee not found</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Employee Details" />

      {/* Back Button */}
      <div className="clinic-toolbar">
        <button onClick={handleBack} className="clinic-back-btn">
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      {/* Employee Details Card */}
      <div className="employee-details-card">
        
        {/* Header Section with Tabs */}
        <div className="details-card-header">
          <div className="employee-header-info">
            <h2>
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="clinic-subtitle">
              {getDesignationLabel(employee.designation)} - {employee.departmentName}
            </p>
            <span className={`status-badge large ${getStatusClass(employee.status)}`}>
              {employee.status.toUpperCase()}
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="employee-tabs">
            <button
              className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => handleTabClick('details')}
            >
              Employee Details
            </button>
            <button
              className="tab-button"
              onClick={() => handleTabClick('proof', `/employee-proof/${id}`)}
            >
              Employee Proof
            </button>
            <button
              className="tab-button"
              onClick={() => handleTabClick('account', `/employee-account/${id}`)}
            >
              Beneficiary Account
            </button>
            <button
              className="tab-button"
              onClick={() => handleTabClick('shift', `/employee-shift/${id}`)}
            >
              Employee Shift
            </button>
          </div>
        </div>

        {/* Details Body */}
        <div className="details-card-body">
          
          {/* Section 1: Basic Information (Including Photo) */}
          <div className="details-section">
            <h3 className="section-title">Basic Information</h3>
            
            {/* Photo Container */}
            <div className="employee-photo-container">
              <div className="employee-photo-display">
                {photoLoading ? (
                  <div className="photo-loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading photo...</p>
                  </div>
                ) : employeePhoto ? (
                  <img 
                    src={employeePhoto} 
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="employee-photo-img"
                  />
                ) : (
                  <div className="employee-photo-placeholder">
                    <FiUser size={64} />
                    <p>No Photo</p>
                  </div>
                )}
              </div>
              {employee.photoFileId && employee.photoFileId > 0 && !employeePhoto && !photoLoading && (
                <button 
                  onClick={handleViewPhoto}
                  className="btn-view-photo"
                >
                  <FiUser size={16} />
                  View Photo
                </button>
              )}
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Employee Code</span>
                <span className="detail-value">{employee.employeeCode || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Employee Name</span>
                <span className="detail-value">
                  {employee.firstName} {employee.lastName}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Gender</span>
                <span className="detail-value">{getGenderLabel(employee.gender)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date of Birth</span>
                <span className="detail-value">{formatDate(employee.birthDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Blood Group</span>
                <span className="detail-value">{getBloodGroupLabel(employee.bloodGroup)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Marital Status</span>
                <span className="detail-value">{getMaritalStatusLabel(employee.maritalStatus)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Contact Information */}
          <div className="details-section">
            <h3 className="section-title">Contact Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Mobile</span>
                <span className="detail-value">{employee.mobile || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Alternate Mobile</span>
                <span className="detail-value">{employee.altMobile || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{employee.email || '—'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label">Address</span>
                <span className="detail-value">{employee.address || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Work Information */}
          <div className="details-section">
            <h3 className="section-title">Work Information</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Branch Name</span>
                <span className="detail-value">{employee.branchName || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Department</span>
                <span className="detail-value">{employee.departmentName || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Designation</span>
                <span className="detail-value">{getDesignationLabel(employee.designation)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Experience Years</span>
                <span className="detail-value">{employee.experienceYears || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span className={`status-badge ${getStatusClass(employee.status)}`}>
                  {employee.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Qualification & License */}
          <div className="details-section">
            <h3 className="section-title">Qualification & License</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Qualification</span>
                <span className="detail-value">{employee.qualification || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Specialization</span>
                <span className="detail-value">{employee.specialization || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">University Name</span>
                <span className="detail-value">{employee.universityName || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">License Number</span>
                <span className="detail-value">{employee.licenseNo || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">License Expiry Date</span>
                <span className="detail-value">{formatDate(employee.licenseExpiryDate)}</span>
              </div>
            </div>
          </div>

          {/* Section 6: Payroll / Statutory */}
          <div className="details-section">
            <h3 className="section-title">Payroll / Statutory</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">PF Number</span>
                <span className="detail-value">{employee.pfNo || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ESI Number</span>
                <span className="detail-value">{employee.esiNo || '—'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="details-card-footer">
          <button onClick={handleDelete} className="btn-hold btn-delete">
            Delete Employee
          </button>
          <button onClick={handleUpdateClick} className="btn-update">
            Update Employee
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployee;