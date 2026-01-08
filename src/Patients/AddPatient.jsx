// src/components/AddPatient.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiSearch } from 'react-icons/fi';
import { addPatient, getPatientsList } from '../api/api.js';
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

  // Family Patient linking state
  const [hasFamilyPatient, setHasFamilyPatient] = useState(false);
  const [searchMobile, setSearchMobile] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedFamilyPatient, setSelectedFamilyPatient] = useState(null);

  // Reset form when modal closes
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
    setHasFamilyPatient(false);
    setSearchMobile('');
    setSearchResults([]);
    setSearchError('');
    setSelectedFamilyPatient(null);
  };

  // ────────────────────────────────────────────────
  // Family Patient Search Handlers
  // ────────────────────────────────────────────────
  const handleFamilyPatientToggle = (e) => {
    const checked = e.target.checked;
    setHasFamilyPatient(checked);
    
    if (!checked) {
      // Reset family patient data when unchecked
      setSearchMobile('');
      setSearchResults([]);
      setSearchError('');
      setSelectedFamilyPatient(null);
      setFormData((prev) => ({ ...prev, familyPatientId: 0 }));
    }
  };

  const handleSearchMobileChange = (e) => {
    setSearchMobile(e.target.value);
    setSearchError('');
  };

  const handleSearchPatients = async () => {
    if (!searchMobile.trim()) {
      setSearchError('Please enter a mobile number');
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

  // ────────────────────────────────────────────────
  // Form Handlers
  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    <div className="clinic-modal-overlay" onClick={onClose}>
      <div className="clinic-modal form-modal employee-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="clinic-modal-header">
          <h2>Add New Patient</h2>
          <button onClick={onClose} className="clinic-modal-close">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="clinic-modal-body">
          {formError && <div className="form-error">{formError}</div>}
          {formSuccess && <div className="form-success">Patient added successfully!</div>}

          <div className="form-grid">
            {/* Basic Information */}
            <h3 className="form-section-title">Basic Information</h3>

            <div className="form-group">
              <label>
                First Name <span className="required">*</span>
              </label>
              <input
                required
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
              />
            </div>

            <div className="form-group">
              <label>
                Last Name <span className="required">*</span>
              </label>
              <input
                required
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
              />
            </div>

            <div className="form-group">
              <label>
                Gender <span className="required">*</span>
              </label>
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

            <div className="form-group">
              <label>Birth Date</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>
                Age <span className="required">*</span>
              </label>
              <input
                required
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="0"
                placeholder="Enter age"
              />
            </div>

            <div className="form-group">
              <label>
                Blood Group <span className="required">*</span>
              </label>
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

            <div className="form-group">
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

            {/* Contact Information */}
            <h3 className="form-section-title">Contact Information</h3>

            <div className="form-group">
              <label>
                Mobile <span className="required">*</span>
              </label>
              <input
                required
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                placeholder="Enter mobile number"
              />
            </div>

            <div className="form-group">
              <label>Alternate Mobile</label>
              <input
                name="altMobile"
                value={formData.altMobile}
                onChange={handleInputChange}
                placeholder="Enter alternate mobile"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label>Emergency Contact</label>
              <input
                name="emergencyContactNo"
                value={formData.emergencyContactNo}
                onChange={handleInputChange}
                placeholder="Enter emergency contact"
              />
            </div>

            <div className="form-group full-width">
              <label>Address</label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address"
              />
            </div>

            {/* Family Patient Link Section */}
            <h3 className="form-section-title">Family Patient Link</h3>

            <div className="form-group full-width">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasFamilyPatient}
                  onChange={handleFamilyPatientToggle}
                  style={{ width: 'auto', cursor: 'pointer' }}
                />
                <span>Link to existing family patient?</span>
              </label>
            </div>

            {hasFamilyPatient && (
              <>
                <div className="form-group full-width">
                  <label>Search Patient by Mobile Number</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={searchMobile}
                      onChange={handleSearchMobileChange}
                      placeholder="Enter mobile number"
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleSearchPatients}
                      disabled={searchLoading}
                      className="btn-submit"
                      style={{ 
                        width: 'auto', 
                        padding: '0 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <FiSearch />
                      {searchLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  {searchError && (
                    <div style={{ color: '#e74c3c', fontSize: '0.9rem', marginTop: '5px' }}>
                      {searchError}
                    </div>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="form-group full-width">
                    <label>Select Family Patient</label>
                    <div style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto', 
                      border: '1px solid #ddd', 
                      borderRadius: '8px',
                      padding: '10px'
                    }}>
                      {searchResults.map((patient) => {
                        const patientId = patient.patientId || patient.patientID || patient.id;
                        const isSelected = selectedFamilyPatient?.patientId === patientId || 
                                          selectedFamilyPatient?.patientID === patientId ||
                                          selectedFamilyPatient?.id === patientId;
                        
                        return (
                          <label
                            key={patientId}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '10px',
                              marginBottom: '5px',
                              backgroundColor: isSelected ? '#e8f5e9' : '#f9f9f9',
                              border: isSelected ? '2px solid #4caf50' : '1px solid #e0e0e0',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectFamilyPatient(patient)}
                              style={{ width: 'auto', cursor: 'pointer' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', color: '#333' }}>
                                {patient.firstName} {patient.lastName}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                Mobile: {patient.mobile}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedFamilyPatient && (
                  <div className="form-group full-width">
                    <div style={{
                      padding: '15px',
                      backgroundColor: '#e8f5e9',
                      border: '1px solid #4caf50',
                      borderRadius: '8px'
                    }}>
                      <strong style={{ color: '#2e7d32' }}>Selected Family Patient:</strong>
                      <div style={{ marginTop: '5px', color: '#333' }}>
                        {selectedFamilyPatient.firstName} {selectedFamilyPatient.lastName} - {selectedFamilyPatient.mobile}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Medical Information */}
            <h3 className="form-section-title">Medical Information</h3>

            <div className="form-group full-width">
              <label>Allergies</label>
              <textarea
                name="allergies"
                rows={2}
                value={formData.allergies}
                onChange={handleInputChange}
                placeholder="Enter any known allergies"
              />
            </div>

            <div className="form-group full-width">
              <label>Existing Medical Conditions</label>
              <textarea
                name="existingMedicalConditions"
                rows={2}
                value={formData.existingMedicalConditions}
                onChange={handleInputChange}
                placeholder="Enter existing medical conditions"
              />
            </div>

            <div className="form-group full-width">
              <label>Past Surgeries</label>
              <textarea
                name="pastSurgeries"
                rows={2}
                value={formData.pastSurgeries}
                onChange={handleInputChange}
                placeholder="Enter past surgeries"
              />
            </div>

            <div className="form-group full-width">
              <label>Current Medications</label>
              <textarea
                name="currentMedications"
                rows={2}
                value={formData.currentMedications}
                onChange={handleInputChange}
                placeholder="Enter current medications"
              />
            </div>

            <div className="form-group full-width">
              <label>Family Medical History</label>
              <textarea
                name="familyMedicalHistory"
                rows={2}
                value={formData.familyMedicalHistory}
                onChange={handleInputChange}
                placeholder="Enter family medical history"
              />
            </div>

            <div className="form-group full-width">
              <label>Immunization Records</label>
              <textarea
                name="immunizationRecords"
                rows={2}
                value={formData.immunizationRecords}
                onChange={handleInputChange}
                placeholder="Enter immunization records"
              />
            </div>
          </div>

          <div className="clinic-modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="btn-submit">
              {formLoading ? 'Saving...' : 'Save Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;