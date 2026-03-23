// src/components/UpdatePatient.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import { getPatientsList, updatePatient } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './UpdatePatient.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import { FaClinicMedical } from 'react-icons/fa';


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
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {

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

    case 'status':
      if (!value || Number(value) === 0) return 'Status is required';
      if (isNaN(Number(value))) return 'Status must be valid';
      return '';

    case 'lastName':
      if (value && value.trim()) {
        if (!value || !value.trim()) return 'FirstName is required';
        if (value.trim().length > 50) return 'LastName too long';
        if (!nameRegex.test(value.trim())) return 'Invalid characters in LastName';
      }
      return '';

    case 'altMobile':
      if (value && value.trim()) {
        if (!mobileRegex.test(value.trim())) return 'Invalid alternate mobile';
      }
      return '';

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

    case 'email':
      if (value && value.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Invalid email';
      }
      return '';

    case 'address':
      if (value && value.length > 500) return 'Address too long';
      return '';

    case 'emergencyContactNo':
      if (value && value.trim()) {
        if (!mobileRegex.test(value.trim())) return 'Invalid emergency contact';
      }
      return '';

    case 'allergies':
      if (value && value.length > 500) return 'Allergies must not exceed 500 characters';
      return '';

    case 'currentMedications':
      if (value && value.length > 500) return 'Current medications must not exceed 500 characters';
      return '';

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

// ── Required fields that must be filled for the Update button to be enabled ──
const REQUIRED_FIELDS = ['firstName', 'mobile', 'gender', 'age', 'status'];

const getGenderLabel = (genderId) => {
  const found = GENDER_OPTIONS.find(g => g.id === Number(genderId));
  return found ? found.label : '-';
};

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
    age: 0,
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
  const [validationMessages, setValidationMessages] = useState({});
  const [hasFamilyPatient, setHasFamilyPatient] = useState(false);
  const [searchMobile, setSearchMobile] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedFamilyPatient, setSelectedFamilyPatient] = useState(null);

  // ── Checkbox states for conditional medical inputs ────────────────────────
  const [showExistingMedical, setShowExistingMedical] = useState(false);
  const [showCurrentMedications, setShowCurrentMedications] = useState(false);
  const [showImmunization, setShowImmunization] = useState(false);

  // ── MessagePopup state ────────────────────────────────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });

  // ── Button cooldown states ────────────────────────────────────────────────
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const [searchCooldown, setSearchCooldown] = useState(false);

  // ── Track whether user tried to submit with missing required fields ────────
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // ── Derive whether all required fields are filled (no validation errors) ──
  const isRequiredFilled = useCallback(() => {
    return REQUIRED_FIELDS.every((field) => {
      const value = formData[field];
      const msg = getLiveValidationMessage(field, value);
      return !msg;
    });
  }, [formData]);

  const updateButtonEnabled = !formLoading && !submitCooldown;

  // ────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────
  const showPopup = (message, type) => {
    setPopup({ visible: true, message, type });
  };

  const closePopup = () => {
    setPopup({ visible: false, message: '', type: 'success' });
  };

  const startCooldown = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // ────────────────────────────────────────────────
  // Fetch patient data on mount
  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();

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

        // ── Calculate age from birthDate; fall back to stored age if no birthDate ──
        const formattedBirthDate = formatDate(patient.birthDate);
        const computedAge = formattedBirthDate
          ? calculateAge(formattedBirthDate)
          : (patient.age || '');

        const loadedData = {
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          gender: patient.gender || 0,
          birthDate: formattedBirthDate,
          age: computedAge !== '' ? computedAge : (patient.age || ''),
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
        };

        setFormData(loadedData);

        if (loadedData.existingMedicalConditions && loadedData.existingMedicalConditions.trim()) {
          setShowExistingMedical(true);
        }
        if (loadedData.currentMedications && loadedData.currentMedications.trim()) {
          setShowCurrentMedications(true);
        }
        if (loadedData.immunizationRecords && loadedData.immunizationRecords.trim()) {
          setShowImmunization(true);
        }

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
    if (searchCooldown) return;
    startCooldown(setSearchCooldown);

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
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
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
    setAttemptedSubmit(true);

    // If required fields not filled, show warning popup and return
    if (!isRequiredFilled()) {
      showPopup('Please fill all required fields before updating.', 'warning');
      return;
    }

    if (submitCooldown) return;
    startCooldown(setSubmitCooldown);

    if (!validateAllFields()) {
      showPopup('Please correct all errors before submitting.', 'error');
      return;
    }

    setFormLoading(true);

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

      showPopup('Patient updated successfully!', 'success');
      setTimeout(() => {
        closePopup();
        handleSuccessRedirect();
      }, 1200);
    } catch (err) {
      showPopup(err.message || 'Failed to update patient.', 'error');
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
    <>
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <div className={styles.detailModalOverlay}>
        <div className={styles.addModalContent}>

          {/* ── Static Header ── */}
          <div className={styles.detailModalHeader}>
            <div className={styles.detailHeaderContent}>
              <h2>Update Patient</h2>
            </div>
            <div className={styles.clinicNameone}>
              <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
              {localStorage.getItem('clinicName') || '—'}
            </div>
            <button onClick={handleClose} className={styles.detailCloseBtn}>✕</button>
          </div>

          {/* ── Scrollable Form Content ── */}
          <div className={styles.addModalBodyScrollable}>
            <form onSubmit={handleSubmit}>

              {/* Basic Information */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Basic Information</h3>
                </div>
                <div className={styles.addFormGrid}>

                  {/* FirstName — required */}
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

                  {/* LastName — optional */}
                  <div className={styles.addFormGroup}>
                    <label>Last Name <span className={styles.required}>*</span></label>
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                    {validationMessages.lastName && (
                      <span className={styles.validationMsg}>{validationMessages.lastName}</span>
                    )}
                  </div>

                  {/* Gender — required */}
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

                  {/* BirthDate — optional */}
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

                  {/* Age — required */}
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

                  {/* BloodGroup — optional */}
                  <div className={styles.addFormGroup}>
                    <label>Blood Group</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                      <option value="0">Select Blood Group</option>
                      {BLOOD_GROUP_OPTIONS.map((bg) => (
                        <option key={bg.id} value={bg.id}>{bg.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* MaritalStatus — optional */}
                  <div className={styles.addFormGroup}>
                    <label>Marital Status</label>
                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange}>
                      <option value="0">Select Status</option>
                      {MARITAL_STATUS_OPTIONS.map((ms) => (
                        <option key={ms.id} value={ms.id}>{ms.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status — required in update */}
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

                  {/* Mobile — required */}
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

                  {/* AltMobile — optional */}
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

                  {/* Email — optional */}
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

                  {/* EmergencyContactNo — optional */}
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

                  {/* Address — optional */}
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

              {/* ── Family Patient Link ── */}
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
                  <div className={styles.familySearchRow}>
                    {/* Left: 40% — Search input + button */}
                    <div className={styles.familySearchLeft}>
                      <label className={styles.familySearchLabel}>Search by Mobile Number</label>
                      <div className={styles.familySearchInputRow}>
                        <input
                          type="text"
                          value={searchMobile}
                          onChange={handleSearchMobileChange}
                          placeholder="Enter 10-digit mobile"
                          maxLength="10"
                          className={styles.familySearchInput}
                        />
                        <button
                          type="button"
                          onClick={handleSearchPatients}
                          disabled={searchLoading || searchCooldown}
                          className={styles.btnSubmit}
                          style={{ padding: '0 16px', height: '40px', whiteSpace: 'nowrap' }}
                        >
                          <FiSearch style={{ marginRight: '4px' }} />
                          {searchLoading ? 'Searching...' : 'Search'}
                        </button>
                      </div>
                      {searchError && (
                        <span className={styles.validationMsg} style={{ color: '#dc2626' }}>
                          {searchError}
                        </span>
                      )}
                    </div>

                    {/* Right: 60% — Results list */}
                    <div className={styles.familyResultsRight}>
                      {searchResults.length > 0 ? (
                        <>
                          <label className={styles.familySearchLabel}>Select Patient</label>
                          <div className={styles.familyResultsList}>
                            <div className={styles.familyResultsHeader}>
                              <span className={styles.familyResultsHeaderSelect} />
                              <span className={styles.familyResultsHeaderCell} style={{ flex: 2 }}>Patient Name</span>
                              <span className={styles.familyResultsHeaderCell} style={{ flex: 1 }}>Sex</span>
                              <span className={styles.familyResultsHeaderCell} style={{ flex: 1 }}>File No</span>
                            </div>
                            {searchResults.map((patient) => {
                              const pId = patient.patientId || patient.patientID || patient.id;
                              const isSelected =
                                selectedFamilyPatient?.patientId === pId ||
                                selectedFamilyPatient?.patientID === pId ||
                                selectedFamilyPatient?.id === pId;
                              return (
                                <div
                                  key={pId}
                                  className={`${styles.familyResultItem} ${isSelected ? styles.familyResultItemSelected : ''}`}
                                >
                                  <span className={styles.familyResultSelectCell}>
                                    <input
                                      type="radio"
                                      name="familyPatientRadio"
                                      checked={isSelected}
                                      onChange={() => handleSelectFamilyPatient(patient)}
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedFamilyPatient(null);
                                          setFormData((prev) => ({ ...prev, familyPatientId: 0 }));
                                        }
                                      }}
                                      className={styles.familyRadio}
                                    />
                                  </span>
                                  <span className={styles.familyResultCell} style={{ flex: 2, fontWeight: '600' }}>
                                    {patient.firstName} {patient.lastName}
                                  </span>
                                  <span className={styles.familyResultCell} style={{ flex: 1 }}>
                                    {getGenderLabel(patient.gender || patient.genderId)}
                                  </span>
                                  <span className={styles.familyResultCell} style={{ flex: 1 }}>
                                    {patient.fileNo || patient.fileNumber || patient.patientId || patient.patientID || '-'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className={styles.familyResultsEmpty} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Medical Information ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Medical Information</h3>
                </div>

                {/* Row 1: Allergies | Past Surgeries | Family Medical History */}
                <div className={styles.medicalThreeColRow}>
                  <div className={styles.medicalColGroup}>
                    <label className={styles.medicalColLabel}>Allergies</label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleInputChange}
                      placeholder="Enter any known allergies"
                      className={styles.medicalTallTextarea}
                    />
                    {validationMessages.allergies && (
                      <span className={styles.validationMsg}>{validationMessages.allergies}</span>
                    )}
                  </div>

                  <div className={styles.medicalColGroup}>
                    <label className={styles.medicalColLabel}>Past Surgeries</label>
                    <textarea
                      name="pastSurgeries"
                      value={formData.pastSurgeries}
                      onChange={handleInputChange}
                      placeholder="Enter past surgeries"
                      className={styles.medicalTallTextarea}
                    />
                  </div>

                  <div className={styles.medicalColGroup}>
                    <label className={styles.medicalColLabel}>Family Medical History</label>
                    <textarea
                      name="familyMedicalHistory"
                      value={formData.familyMedicalHistory}
                      onChange={handleInputChange}
                      placeholder="Enter family medical history"
                      className={styles.medicalTallTextarea}
                    />
                  </div>
                </div>

                {/* Row 2: Existing Medical Conditions | Current Medications | Immunization Records */}
                <div className={styles.medicalThreeColRow}>
                  <div className={styles.medicalColGroup}>
                    <label className={styles.medicalColLabel}>
                      <input
                        type="checkbox"
                        checked={showExistingMedical}
                        onChange={(e) => setShowExistingMedical(e.target.checked)}
                        className={styles.medicalCheckbox}
                      />
                      Existing Medical Conditions
                    </label>
                    <div className={styles.medicalCheckboxBox}>
                      {showExistingMedical ? (
                        <textarea
                          name="existingMedicalConditions"
                          rows={3}
                          value={formData.existingMedicalConditions}
                          onChange={handleInputChange}
                          placeholder="Enter existing medical conditions"
                          className={styles.medicalTallTextarea}
                        />
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>

                  <div className={styles.medicalColGroup}>
                    <label className={styles.medicalColLabel}>
                      <input
                        type="checkbox"
                        checked={showCurrentMedications}
                        onChange={(e) => setShowCurrentMedications(e.target.checked)}
                        className={styles.medicalCheckbox}
                      />
                      Current Medications
                    </label>
                    <div className={styles.medicalCheckboxBox}>
                      {showCurrentMedications ? (
                        <>
                          <textarea
                            name="currentMedications"
                            rows={3}
                            value={formData.currentMedications}
                            onChange={handleInputChange}
                            placeholder="Enter current medications"
                            className={styles.medicalTallTextarea}
                          />
                          {validationMessages.currentMedications && (
                            <span className={styles.validationMsg}>{validationMessages.currentMedications}</span>
                          )}
                        </>
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>

                  <div className={styles.medicalColGroup}>
                    <label className={styles.medicalColLabel}>
                      <input
                        type="checkbox"
                        checked={showImmunization}
                        onChange={(e) => setShowImmunization(e.target.checked)}
                        className={styles.medicalCheckbox}
                      />
                      Immunization Records
                    </label>
                    <div className={styles.medicalCheckboxBox}>
                      {showImmunization ? (
                        <textarea
                          name="immunizationRecords"
                          rows={3}
                          value={formData.immunizationRecords}
                          onChange={handleInputChange}
                          placeholder="Enter immunization records"
                          className={styles.medicalTallTextarea}
                        />
                      ) : (
                        <div />
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className={styles.detailModalFooter}>
                <button type="button" onClick={handleClose} className={styles.btnCancel}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!updateButtonEnabled}
                  className={styles.btnSubmit}
                  title={!isRequiredFilled() ? 'Please fill all required fields' : ''}
                >
                  {formLoading ? 'Updating...' : 'Update Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdatePatient;