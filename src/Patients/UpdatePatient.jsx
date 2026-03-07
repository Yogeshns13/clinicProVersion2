// src/components/UpdatePatient.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { getPatientsList, updatePatient } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './UpdatePatient.module.css';

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

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ── Backend: nameRegex = /^[A-Za-z\s\.\-']+$/
const nameRegex = /^[A-Za-z\s.\-']+$/;
// ── Backend: mobileRegex = /^[6-9]\d{9}$/
const mobileRegex = /^[6-9]\d{9}$/;

// ── Validation messages match backend patientValidator word-for-word ──────────
// updatePatientValidatorRules = Status(required) + all addPatientRules from FirstName onward
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {

    // ── Required in backend (notEmpty) ────────────────────────────────────────
    case 'firstName':
      if (!value || !value.trim()) return 'FirstName is required';
      if (value.trim().length > 50) return 'FirstName too long';
      if (!nameRegex.test(value.trim())) return 'Invalid characters in FirstName';
      return '';

    case 'mobile':
      if (!value || !value.trim()) return 'Mobile is required';
      if (!mobileRegex.test(value.trim())) return 'Invalid mobile number';
      return '';

    case 'gender':
      if (!value || Number(value) === 0) return 'Gender is required';
      if (isNaN(Number(value))) return 'Gender must be valid ID';
      return '';

    case 'age':
      if (value === '' || value === null || value === undefined) return 'Age is required';
      const age = Number(value);
      if (isNaN(age) || !Number.isInteger(age) || age < 0 || age > 150) return 'Age must be realistic';
      return '';

    // Status — required only in updatePatientValidatorRules
    case 'status':
      if (!value || Number(value) === 0) return 'Status is required';
      if (isNaN(Number(value))) return 'Status must be valid';
      return '';

    // ── Optional in backend ───────────────────────────────────────────────────
    // LastName: optional, max 50, nameRegex
    case 'lastName':
      if (value && value.trim()) {
        if (value.trim().length > 50) return 'LastName too long';
        if (!nameRegex.test(value.trim())) return 'Invalid characters in LastName';
      }
      return '';

    // AltMobile: optional, matches mobileRegex
    case 'altMobile':
      if (value && value.trim()) {
        if (!mobileRegex.test(value.trim())) return 'Invalid alternate mobile';
      }
      return '';

    // BirthDate: optional, isDate
    case 'birthDate':
      if (value) {
        const d = new Date(value);
        if (isNaN(d.getTime())) return 'Invalid BirthDate';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        if (d > today) return 'Invalid BirthDate';
      }
      return '';

    // Email: optional, isEmail
    case 'email':
      if (value && value.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Invalid email';
      }
      return '';

    // Address: optional, max 500
    case 'address':
      if (value && value.length > 500) return 'Address too long';
      return '';

    // EmergencyContactNo: optional, matches mobileRegex
    case 'emergencyContactNo':
      if (value && value.trim()) {
        if (!mobileRegex.test(value.trim())) return 'Invalid emergency contact';
      }
      return '';

    // Allergies: optional, max 500 (no backend message — silent cap)
    case 'allergies':
      if (value && value.length > 500) return 'Allergies must not exceed 500 characters';
      return '';

    // CurrentMedications: optional, max 500 (no backend message — silent cap)
    case 'currentMedications':
      if (value && value.length > 500) return 'Current medications must not exceed 500 characters';
      return '';

    // Fields below are NOT in backend validator — no validation needed
    case 'existingMedicalConditions':
    case 'pastSurgeries':
    case 'familyMedicalHistory':
    case 'immunizationRecords':
      return '';

    default:
      return '';
  }
};

// ── filterInput matches backend nameRegex (allows . - ') ─────────────────────
const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'firstName':
    case 'lastName':
      // Allow letters, spaces, dots, hyphens, apostrophes — matches nameRegex
      return value.replace(/[^A-Za-z\s.\-']/g, '');

    case 'mobile':
    case 'altMobile':
    case 'emergencyContactNo':
      return value.replace(/[^0-9]/g, '');

    case 'age':
      return value.replace(/[^0-9]/g, '');

    default:
      return value;
  }
};

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const calculateAge = (birthDateString) => {
  if (!birthDateString) return '';
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : '';
};

// ── Fields validated on submit ────────────────────────────────────────────────
const VALIDATED_FIELDS = [
  'firstName', 'lastName', 'mobile', 'altMobile',
  'gender', 'birthDate', 'age', 'status',
  'email', 'address', 'emergencyContactNo',
  'allergies', 'currentMedications',
];

// ─────────────────────────────────────────────────────────────────────────────
const UpdatePatient = ({ patientId: propPatientId, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const params = useParams();

  const patientId = propPatientId || params.patientId || params.id || params.patientID;

  const handleClose = () => {
    if (onClose) onClose();
    else navigate('/patient-list');
  };

  const handleSuccessRedirect = () => {
    if (onSuccess) onSuccess();
    else navigate('/patient-list');
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [patientData, setPatientData] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 0,
    birthDate: '',
    age: '',
    bloodGroup: 0,
    maritalStatus: 0,
    mobile: '',
    altMobile: '',
    email: '',
    address: '',
    emergencyContactNo: '',
    allergies: '',
    existingMedicalConditions: '',
    pastSurgeries: '',
    currentMedications: '',
    familyMedicalHistory: '',
    immunizationRecords: '',
    familyPatientId: 0,
    status: 1,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [hasFamilyPatient, setHasFamilyPatient] = useState(false);
  const [searchMobile, setSearchMobile] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedFamilyPatient, setSelectedFamilyPatient] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const patientList = await getPatientsList(clinicId, {
          BranchID: branchId,
          PatientID: Number(patientId),
        });

        if (!patientList || patientList.length === 0) {
          throw new Error(`Patient not found with ID: ${patientId}`);
        }

        const patient = patientList[0];
        setPatientData(patient);

        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const familyPatientId = patient.familyPatientId || patient.familyPatientID || 0;

        setFormData({
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          gender: patient.gender || 0,
          birthDate: formatDate(patient.birthDate),
          age: patient.age || '',
          bloodGroup: patient.bloodGroup || 0,
          maritalStatus: patient.maritalStatus || 0,
          mobile: patient.mobile || '',
          altMobile: patient.altMobile || '',
          email: patient.email || '',
          address: patient.address || '',
          emergencyContactNo: patient.emergencyContactNo || '',
          allergies: patient.allergies || '',
          existingMedicalConditions: patient.existingMedicalConditions || '',
          pastSurgeries: patient.pastSurgeries || '',
          currentMedications: patient.currentMedications || '',
          familyMedicalHistory: patient.familyMedicalHistory || '',
          immunizationRecords: patient.immunizationRecords || '',
          familyPatientId: familyPatientId,
          status: patient.status === 'active' ? 1 : 2,
        });

        if (familyPatientId > 0) {
          setHasFamilyPatient(true);
          try {
            const familyPatientList = await getPatientsList(clinicId, {
              BranchID: branchId,
              PatientID: familyPatientId,
            });
            if (familyPatientList && familyPatientList.length > 0) {
              setSelectedFamilyPatient(familyPatientList[0]);
            }
          } catch (err) {
            console.error('Failed to load family patient:', err);
          }
        }
      } catch (err) {
        setError({
          message: err.message || 'Failed to load patient data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No patient ID provided', status: 400 });
    }
  }, [patientId]);

  const handleFamilyPatientToggle = (e) => {
    const checked = e.target.checked;
    setHasFamilyPatient(checked);
    if (!checked) {
      setSearchMobile('');
      setSearchResults([]);
      setSearchError('');
      setSelectedFamilyPatient(null);
      setFormData((prev) => ({ ...prev, familyPatientId: 0 }));
    }
  };

  const handleSearchMobileChange = (e) => {
    const value = e.target.value;
    const filteredValue = filterInput('mobile', value);
    setSearchMobile(filteredValue);
    setSearchError('');
  };

  const handleSearchPatients = async () => {
    if (!searchMobile.trim()) {
      setSearchError('Please enter a mobile number');
      return;
    }
    if (!mobileRegex.test(searchMobile.trim())) {
      setSearchError('Please enter a valid mobile number starting with 6-9');
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const patients = await getPatientsList(clinicId, {
        Mobile: searchMobile.trim(),
        BranchID: branchId,
      });
      if (!patients || patients.length === 0) {
        setSearchError('No patients found with this mobile number');
        setSearchResults([]);
      } else {
        const filteredPatients = patients.filter((p) => {
          const pId = p.patientId || p.patientID || p.id;
          return pId !== Number(patientId);
        });
        if (filteredPatients.length === 0) {
          setSearchError('No other patients found with this mobile number');
          setSearchResults([]);
        } else {
          setSearchResults(filteredPatients);
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchError(err.message || 'Failed to search patients');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectFamilyPatient = (patient) => {
    setSelectedFamilyPatient(patient);
    setFormData((prev) => ({
      ...prev,
      familyPatientId: patient.patientId || patient.patientID || patient.id,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let filteredValue = filterInput(name, value);

    if (name === 'birthDate') {
      const calculatedAge = calculateAge(value);
      setFormData((prev) => ({
        ...prev,
        birthDate: value,
        age: calculatedAge !== '' ? calculatedAge : '',
      }));
      setValidationMessages((prev) => ({
        ...prev,
        [name]: getLiveValidationMessage(name, value),
        age: calculatedAge === '' ? '' : getLiveValidationMessage('age', String(calculatedAge)),
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    setValidationMessages((prev) => ({
      ...prev,
      [name]: getLiveValidationMessage(name, filteredValue),
    }));
  };

  // ── Validate all fields; block submit if any errors exist ─────────────────
  const validateAllFields = () => {
    const messages = {};
    let isValid = true;
    VALIDATED_FIELDS.forEach((field) => {
      const msg = getLiveValidationMessage(field, formData[field]);
      messages[field] = msg;
      if (msg) isValid = false;
    });
    setValidationMessages((prev) => ({ ...prev, ...messages }));
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAllFields()) {
      setFormError('Please correct all errors before submitting.');
      return;
    }

    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await updatePatient({
        patientId: Number(patientId),
        clinicId: patientData.clinicId,
        branchId: patientData.branchId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: Number(formData.gender),
        birthDate: formData.birthDate,
        age: Number(formData.age || 0),
        bloodGroup: Number(formData.bloodGroup),
        photoFileId: 0,
        maritalStatus: Number(formData.maritalStatus),
        mobile: formData.mobile.trim(),
        altMobile: formData.altMobile.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        emergencyContactNo: formData.emergencyContactNo.trim(),
        allergies: formData.allergies.trim(),
        existingMedicalConditions: formData.existingMedicalConditions.trim(),
        pastSurgeries: formData.pastSurgeries.trim(),
        currentMedications: formData.currentMedications.trim(),
        familyMedicalHistory: formData.familyMedicalHistory.trim(),
        immunizationRecords: formData.immunizationRecords.trim(),
        familyPatientId: Number(formData.familyPatientId),
        status: Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        handleSuccessRedirect();
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update patient.');
    } finally {
      setFormLoading(false);
    }
  };

  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className={styles.loading}>Loading patient data...</div>;
  }

  if (error || !patientData) {
    return (
      <div className={styles.shiftWrapper}>
        <Header title="Update Patient" />
        <div className={styles.error}>{error?.message || 'Patient not found'}</div>
      </div>
    );
  }

  return (
    <div className={styles.detailModalOverlay}>
      <div className={styles.addModalContent}>

        {/* Static Header */}
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <h2>Update Patient</h2>
            <div className={styles.detailHeaderMeta}>
              <span className={styles.workIdBadge}>
                {formData.firstName} {formData.lastName}
              </span>
              <span className={`${styles.workIdBadge} ${formData.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>
                {formData.status === 1 ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          <button onClick={handleClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        {/* Scrollable Body */}
        <div className={styles.addModalBodyScrollable}>
          <form onSubmit={handleSubmit}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Patient updated successfully!</div>}

            {/* Basic Information */}
            <div className={styles.addSection}>
              <div className={styles.addSectionHeader}>
                <h3>Basic Information</h3>
              </div>
              <div className={styles.addFormGrid}>

                {/* FirstName — required in backend */}
                <div className={styles.addFormGroup}>
                  <label>First Name <span className={styles.required}>*</span></label>
                  <input
                    required
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                  {validationMessages.firstName && (
                    <span className={styles.validationMsg}>{validationMessages.firstName}</span>
                  )}
                </div>

                {/* LastName — optional in backend (no * / no required) */}
                <div className={styles.addFormGroup}>
                  <label>Last Name</label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                  {validationMessages.lastName && (
                    <span className={styles.validationMsg}>{validationMessages.lastName}</span>
                  )}
                </div>

                {/* Gender — required in backend */}
                <div className={styles.addFormGroup}>
                  <label>Gender <span className={styles.required}>*</span></label>
                  <select required name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="0">Select Gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                  </select>
                  {validationMessages.gender && (
                    <span className={styles.validationMsg}>{validationMessages.gender}</span>
                  )}
                </div>

                {/* BirthDate — optional in backend */}
                <div className={styles.addFormGroup}>
                  <label>Birth Date</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    max={getTodayDate()}
                  />
                  {validationMessages.birthDate && (
                    <span className={styles.validationMsg}>{validationMessages.birthDate}</span>
                  )}
                </div>

                {/* Age — required in backend */}
                <div className={styles.addFormGroup}>
                  <label>Age <span className={styles.required}>*</span></label>
                  <input
                    required
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="0"
                    readOnly={!!formData.birthDate}
                  />
                  {validationMessages.age && (
                    <span className={styles.validationMsg}>{validationMessages.age}</span>
                  )}
                </div>

                {/* BloodGroup — optional in backend (no * / no required) */}
                <div className={styles.addFormGroup}>
                  <label>Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                    <option value="0">Select Blood Group</option>
                    {BLOOD_GROUP_OPTIONS.map((bg) => (
                      <option key={bg.id} value={bg.id}>{bg.label}</option>
                    ))}
                  </select>
                </div>

                {/* MaritalStatus — optional in backend */}
                <div className={styles.addFormGroup}>
                  <label>Marital Status</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange}>
                    <option value="0">Select Status</option>
                    {MARITAL_STATUS_OPTIONS.map((ms) => (
                      <option key={ms.id} value={ms.id}>{ms.label}</option>
                    ))}
                  </select>
                </div>

                {/* Status — required in updatePatientValidatorRules */}
                <div className={styles.addFormGroup}>
                  <label>Status <span className={styles.required}>*</span></label>
                  <select required name="status" value={formData.status} onChange={handleInputChange}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  {validationMessages.status && (
                    <span className={styles.validationMsg}>{validationMessages.status}</span>
                  )}
                </div>

              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.addSection}>
              <div className={styles.addSectionHeader}>
                <h3>Contact Information</h3>
              </div>
              <div className={styles.addFormGrid}>

                {/* Mobile — required in backend */}
                <div className={styles.addFormGroup}>
                  <label>Mobile <span className={styles.required}>*</span></label>
                  <input
                    required
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    maxLength="10"
                  />
                  {validationMessages.mobile && (
                    <span className={styles.validationMsg}>{validationMessages.mobile}</span>
                  )}
                </div>

                {/* AltMobile — optional in backend */}
                <div className={styles.addFormGroup}>
                  <label>Alternate Mobile</label>
                  <input
                    name="altMobile"
                    value={formData.altMobile}
                    onChange={handleInputChange}
                    maxLength="10"
                  />
                  {validationMessages.altMobile && (
                    <span className={styles.validationMsg}>{validationMessages.altMobile}</span>
                  )}
                </div>

                {/* Email — optional in backend */}
                <div className={styles.addFormGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {validationMessages.email && (
                    <span className={styles.validationMsg}>{validationMessages.email}</span>
                  )}
                </div>

                {/* EmergencyContactNo — optional in backend */}
                <div className={styles.addFormGroup}>
                  <label>Emergency Contact</label>
                  <input
                    name="emergencyContactNo"
                    value={formData.emergencyContactNo}
                    onChange={handleInputChange}
                    maxLength="10"
                  />
                  {validationMessages.emergencyContactNo && (
                    <span className={styles.validationMsg}>{validationMessages.emergencyContactNo}</span>
                  )}
                </div>

                {/* Address — optional in backend */}
                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Address</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                  {validationMessages.address && (
                    <span className={styles.validationMsg}>{validationMessages.address}</span>
                  )}
                </div>

              </div>
            </div>

            {/* Family Patient Link */}
            <div className={styles.addSection}>
              <div className={styles.addSectionHeader}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={hasFamilyPatient}
                      onChange={handleFamilyPatientToggle}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Family Patient Link
                  </label>
                </h3>
              </div>

              {hasFamilyPatient && (
                <div className={styles.addFormGrid}>
                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Search by Mobile Number</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        type="text"
                        value={searchMobile}
                        onChange={handleSearchMobileChange}
                        placeholder="Enter 10-digit mobile"
                        maxLength="10"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={handleSearchPatients}
                        disabled={searchLoading}
                        className={styles.btnSubmit}
                        style={{ padding: '0 20px' }}
                      >
                        <FiSearch />
                        {searchLoading ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                    {searchError && (
                      <span className={styles.validationMsg} style={{ color: '#dc2626' }}>
                        {searchError}
                      </span>
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                      <label>Select Family Patient</label>
                      <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px',
                        background: '#f8fafc'
                      }}>
                        {searchResults.map((patient) => {
                          const pId = patient.patientId || patient.patientID || patient.id;
                          const isSelected = selectedFamilyPatient && (
                            selectedFamilyPatient.patientId === pId ||
                            selectedFamilyPatient.patientID === pId ||
                            selectedFamilyPatient.id === pId
                          );
                          return (
                            <div
                              key={pId}
                              onClick={() => handleSelectFamilyPatient(patient)}
                              style={{
                                padding: '10px',
                                marginBottom: '8px',
                                background: isSelected ? '#e8f5e9' : 'white',
                                border: isSelected ? '2px solid #4caf50' : '1px solid #e0e0e0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              <div style={{ fontWeight: '600' }}>{patient.firstName} {patient.lastName}</div>
                              <div style={{ fontSize: '0.9rem', color: '#555' }}>Mobile: {patient.mobile}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedFamilyPatient && (
                    <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                      <div style={{
                        padding: '12px',
                        background: '#e8f5e9',
                        border: '1px solid #4caf50',
                        borderRadius: '10px'
                      }}>
                        <strong>Selected:</strong> {selectedFamilyPatient.firstName} {selectedFamilyPatient.lastName} - {selectedFamilyPatient.mobile}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Medical Information */}
            <div className={styles.addSection}>
              <div className={styles.addSectionHeader}>
                <h3>Medical Information</h3>
              </div>
              <div className={styles.addFormGrid}>

                {/* Allergies — optional, max 500 */}
                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Allergies</label>
                  <textarea
                    name="allergies"
                    rows={2}
                    value={formData.allergies}
                    onChange={handleInputChange}
                  />
                  {validationMessages.allergies && (
                    <span className={styles.validationMsg}>{validationMessages.allergies}</span>
                  )}
                </div>

                {/* ExistingMedicalConditions — NOT in backend validator */}
                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Existing Medical Conditions</label>
                  <textarea
                    name="existingMedicalConditions"
                    rows={2}
                    value={formData.existingMedicalConditions}
                    onChange={handleInputChange}
                  />
                </div>

                {/* PastSurgeries — NOT in backend validator */}
                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Past Surgeries</label>
                  <textarea
                    name="pastSurgeries"
                    rows={2}
                    value={formData.pastSurgeries}
                    onChange={handleInputChange}
                  />
                </div>

                {/* CurrentMedications — optional, max 500 */}
                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Current Medications</label>
                  <textarea
                    name="currentMedications"
                    rows={2}
                    value={formData.currentMedications}
                    onChange={handleInputChange}
                  />
                  {validationMessages.currentMedications && (
                    <span className={styles.validationMsg}>{validationMessages.currentMedications}</span>
                  )}
                </div>

                {/* FamilyMedicalHistory — NOT in backend validator */}
                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Family Medical History</label>
                  <textarea
                    name="familyMedicalHistory"
                    rows={2}
                    value={formData.familyMedicalHistory}
                    onChange={handleInputChange}
                  />
                </div>

                {/* ImmunizationRecords — NOT in backend validator */}
                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Immunization Records</label>
                  <textarea
                    name="immunizationRecords"
                    rows={2}
                    value={formData.immunizationRecords}
                    onChange={handleInputChange}
                  />
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className={styles.detailModalFooter}>
              <button type="button" onClick={handleClose} className={styles.btnCancel}>
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                {formLoading ? 'Updating...' : 'Update Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePatient;