// src/components/AddPatient.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import { addPatient, getPatientsList } from '../api/api.js';
import styles from './AddPatient.module.css';   

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

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'firstName':
      if (!value || !value.trim()) return 'First name is required';
      if (value.trim().length < 2) return 'First name must be at least 2 characters';
      if (value.trim().length > 50) return 'First name must not exceed 50 characters';
      return '';

    case 'lastName':
      if (!value || !value.trim()) return 'Last name is required';
      if (value.trim().length < 2) return 'Last name must be at least 2 characters';
      if (value.trim().length > 50) return 'Last name must not exceed 50 characters';
      return '';

    case 'mobile':
      if (!value || !value.trim()) return 'Mobile number is required';
      if (value.trim().length < 10) return 'Mobile number must be 10 digits';
      if (value.trim().length === 10) {
        if (!/^[6-9]\d{9}$/.test(value.trim())) {
          return 'Mobile number must start with 6-9';
        }
      }
      if (value.trim().length > 10) return 'Mobile number cannot exceed 10 digits';
      return '';

    case 'altMobile':
      if (value && value.trim()) {
        if (value.trim().length < 10) return 'Mobile number must be 10 digits';
        if (value.trim().length === 10) {
          if (!/^[6-9]\d{9}$/.test(value.trim())) {
            return 'Mobile number must start with 6-9';
          }
        }
        if (value.trim().length > 10) return 'Mobile number cannot exceed 10 digits';
      }
      return '';

    case 'emergencyContactNo':
      if (value && value.trim()) {
        if (value.trim().length < 10) return 'Contact number must be 10 digits';
        if (value.trim().length === 10) {
          if (!/^[6-9]\d{9}$/.test(value.trim())) {
            return 'Contact number must start with 6-9';
          }
        }
        if (value.trim().length > 10) return 'Contact number cannot exceed 10 digits';
      }
      return '';

    case 'email':
      if (value && value.trim()) {
        if (!value.includes('@')) return 'Email must contain @';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
        if (value.trim().length > 100) return 'Email must not exceed 100 characters';
      }
      return '';

    case 'age':
      if (value === '' || value === null || value === undefined) return 'Age is required';
      const age = Number(value);
      if (isNaN(age)) return 'Age must be a number';
      if (age <= 0) return 'Age must be greater than 0';
      if (age > 150) return 'Please enter a valid age';
      return '';

    case 'address':
      if (value && value.length > 500) return 'Address must not exceed 500 characters';
      return '';

    case 'allergies':
      if (value && value.length > 500) return 'Allergies must not exceed 500 characters';
      return '';

    case 'existingMedicalConditions':
      if (value && value.length > 500) return 'Medical conditions must not exceed 500 characters';
      return '';

    case 'pastSurgeries':
      if (value && value.length > 500) return 'Past surgeries must not exceed 500 characters';
      return '';

    case 'currentMedications':
      if (value && value.length > 500) return 'Current medications must not exceed 500 characters';
      return '';

    case 'familyMedicalHistory':
      if (value && value.length > 500) return 'Family history must not exceed 500 characters';
      return '';

    case 'immunizationRecords':
      if (value && value.length > 500) return 'Immunization records must not exceed 500 characters';
      return '';

    case 'birthDate':
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        birthDate.setHours(0, 0, 0, 0);
        
        if (birthDate > today) return 'Birth date cannot be in the future';
      }
      return '';  

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'firstName':
    case 'lastName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    
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

// ────────────────────────────────────────────────
const AddPatient = ({ isOpen, onClose, onSuccess }) => {
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
    allergies: 'No Allergies',
    existingMedicalConditions: 'Not reported',
    pastSurgeries: 'Nothing',
    currentMedications: 'NA',
    familyMedicalHistory: '',
    immunizationRecords: 'Not Available',
    familyPatientId: 0,
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
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
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
      allergies: 'No Allergies',
      existingMedicalConditions: 'Not reported',
      pastSurgeries: 'Nothing',
      currentMedications: 'NA',
      familyMedicalHistory: '',
      immunizationRecords: 'Not Available',
      familyPatientId: 0,
    });
    setFormError('');
    setFormSuccess(false);
    setValidationMessages({}); 
    setHasFamilyPatient(false);
    setSearchMobile('');
    setSearchResults([]);
    setSearchError('');
    setSelectedFamilyPatient(null);
  };

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

    if (searchMobile.trim().length !== 10) {
      setSearchError('Mobile number must be exactly 10 digits');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(searchMobile.trim())) {
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
        setSearchResults(patients);
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
    const filteredValue = filterInput(name, value);
    
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      const payload = {
        clinicId: clinicId ? Number(clinicId) : 0,
        branchID: branchId ? Number(branchId) : 0,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: Number(formData.gender),
        birthDate: formData.birthDate,
        age: Number(formData.age),
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
      };

      await addPatient(payload);

      setFormSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Add patient failed:', err);
      setFormError(err.message || 'Failed to add patient.');
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.detailModalOverlay} onClick={onClose}>
      <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

        {/* ── Static Header (does not scroll) ── */}
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <h2>Add New Patient</h2>
            <div className={styles.detailHeaderMeta}>
              <span className={styles.workIdBadge}>Patient Registration</span>
            </div>
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>
            ✕
          </button>
        </div>

        {/* ── Scrollable Form Content ── */}
        <div className={styles.addModalBodyScrollable}>
          <form onSubmit={handleSubmit}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Patient added successfully!</div>}

            {/* Basic Information */}
            <div className={styles.addSection}>
              <div className={styles.addSectionHeader}>
                <h3>Basic Information</h3>
              </div>

              <div className={styles.addFormGrid}>
                <div className={styles.addFormGroup}>
                  <label>First Name <span className={styles.required}>*</span></label>
                  <input
                    required
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                  />
                  {validationMessages.firstName && (
                    <span className={styles.validationMsg}>
                      {validationMessages.firstName}
                    </span>
                  )}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Last Name <span className={styles.required}>*</span></label>
                  <input
                    required
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                  />
                  {validationMessages.lastName && (
                    <span className={styles.validationMsg}>
                      {validationMessages.lastName}
                    </span>
                  )}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Gender <span className={styles.required}>*</span></label>
                  <select
                    required
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="0">Select Gender</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

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
                    <span className={styles.validationMsg}>
                      {validationMessages.birthDate}
                    </span>
                  )}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Age <span className={styles.required}>*</span></label>
                  <input
                    required
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="Enter age"
                  />
                  {validationMessages.age && (
                    <span className={styles.validationMsg}>
                      {validationMessages.age}
                    </span>
                  )}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Blood Group <span className={styles.required}>*</span></label>
                  <select
                    required
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleInputChange}
                  >
                    <option value="0">Select Blood Group</option>
                    {BLOOD_GROUP_OPTIONS.map((bg) => (
                      <option key={bg.id} value={bg.id}>
                        {bg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.addFormGroup}>
                  <label>Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                  >
                    <option value="0">Select Status</option>
                    {MARITAL_STATUS_OPTIONS.map((ms) => (
                      <option key={ms.id} value={ms.id}>
                        {ms.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.addSection}>
              <div className={styles.addSectionHeader}>
                <h3>Contact Information</h3>
              </div>

              <div className={styles.addFormGrid}>
                <div className={styles.addFormGroup}>
                  <label>Mobile <span className={styles.required}>*</span></label>
                  <input
                    required
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter mobile number"
                    maxLength="10"
                  />
                  {validationMessages.mobile && (
                    <span className={styles.validationMsg}>
                      {validationMessages.mobile}
                    </span>
                  )}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Alternate Mobile</label>
                  <input
                    name="altMobile"
                    value={formData.altMobile}
                    onChange={handleInputChange}
                    placeholder="Enter alternate mobile"
                    maxLength="10"
                  />
                  {validationMessages.altMobile && (
                    <span className={styles.validationMsg}>
                      {validationMessages.altMobile}
                    </span>
                  )}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                  />
                  {validationMessages.email && (
                    <span className={styles.validationMsg}>
                      {validationMessages.email}
                    </span>
                  )}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Emergency Contact</label>
                  <input
                    name="emergencyContactNo"
                    value={formData.emergencyContactNo}
                    onChange={handleInputChange}
                    placeholder="Enter emergency contact"
                    maxLength="10"
                  />
                  {validationMessages.emergencyContactNo && (
                    <span className={styles.validationMsg}>
                      {validationMessages.emergencyContactNo}
                    </span>
                  )}
                </div>

                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Address</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                  />
                  {validationMessages.address && (
                    <span className={styles.validationMsg}>
                      {validationMessages.address}
                    </span>
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
                          const patientId = patient.patientId || patient.patientID || patient.id;
                          const isSelected = selectedFamilyPatient?.patientId === patientId || 
                                            selectedFamilyPatient?.patientID === patientId ||
                                            selectedFamilyPatient?.id === patientId;

                          return (
                            <div
                              key={patientId}
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
                              <div style={{ fontWeight: '600' }}>
                                {patient.firstName} {patient.lastName}
                              </div>
                              <div style={{ fontSize: '0.9rem', color: '#555' }}>
                                Mobile: {patient.mobile}
                              </div>
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
                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Allergies</label>
                  <textarea
                    name="allergies"
                    rows={2}
                    value={formData.allergies}
                    onChange={handleInputChange}
                    placeholder="Enter any known allergies"
                  />
                  {validationMessages.allergies && (
                    <span className={styles.validationMsg}>
                      {validationMessages.allergies}
                    </span>
                  )}
                </div>

                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Existing Medical Conditions</label>
                  <textarea
                    name="existingMedicalConditions"
                    rows={2}
                    value={formData.existingMedicalConditions}
                    onChange={handleInputChange}
                    placeholder="Enter existing medical conditions"
                  />
                  {validationMessages.existingMedicalConditions && (
                    <span className={styles.validationMsg}>
                      {validationMessages.existingMedicalConditions}
                    </span>
                  )}
                </div>

                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Past Surgeries</label>
                  <textarea
                    name="pastSurgeries"
                    rows={2}
                    value={formData.pastSurgeries}
                    onChange={handleInputChange}
                    placeholder="Enter past surgeries"
                  />
                  {validationMessages.pastSurgeries && (
                    <span className={styles.validationMsg}>
                      {validationMessages.pastSurgeries}
                    </span>
                  )}
                </div>

                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Current Medications</label>
                  <textarea
                    name="currentMedications"
                    rows={2}
                    value={formData.currentMedications}
                    onChange={handleInputChange}
                    placeholder="Enter current medications"
                  />
                  {validationMessages.currentMedications && (
                    <span className={styles.validationMsg}>
                      {validationMessages.currentMedications}
                    </span>
                  )}
                </div>

                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Family Medical History</label>
                  <textarea
                    name="familyMedicalHistory"
                    rows={2}
                    value={formData.familyMedicalHistory}
                    onChange={handleInputChange}
                    placeholder="Enter family medical history"
                  />
                  {validationMessages.familyMedicalHistory && (
                    <span className={styles.validationMsg}>
                      {validationMessages.familyMedicalHistory}
                    </span>
                  )}
                </div>

                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Immunization Records</label>
                  <textarea
                    name="immunizationRecords"
                    rows={2}
                    value={formData.immunizationRecords}
                    onChange={handleInputChange}
                    placeholder="Enter immunization records"
                  />
                  {validationMessages.immunizationRecords && (
                    <span className={styles.validationMsg}>
                      {validationMessages.immunizationRecords}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer (inside scrollable area) */}
            <div className={styles.detailModalFooter}>
              <button type="button" onClick={onClose} className={styles.btnCancel}>
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                {formLoading ? 'Saving...' : 'Save Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPatient;