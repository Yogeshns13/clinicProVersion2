// src/components/UpdatePatient.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSearch } from 'react-icons/fi';
import { getPatientsList, updatePatient } from '../api/api.js';
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

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ────────────────────────────────────────────────
const UpdatePatient = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const patientId = params.patientId || params.id || params.patientID;

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
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Family Patient linking state
  const [hasFamilyPatient, setHasFamilyPatient] = useState(false);
  const [searchMobile, setSearchMobile] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedFamilyPatient, setSelectedFamilyPatient] = useState(null);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const patientList = await getPatientsList(0, {
          PatientID: Number(patientId),
        });

        if (!patientList || patientList.length === 0) {
          throw new Error(`Patient not found with ID: ${patientId}`);
        }

        const patient = patientList[0];
        setPatientData(patient);

        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          try {
            const date = new Date(dateStr);
            return date.toISOString().split('T')[0];
          } catch (err) {
            return '';
          }
        };

        const familyPatientId = patient.familyPatientId || patient.familyPatientID || 0;

        setFormData({
          firstName: patient.firstName || '',
          lastName: patient.lastName || '',
          gender: patient.gender || 0,
          birthDate: formatDate(patient.birthDate),
          age: patient.age || 0,
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

        // If family patient exists, set the checkbox and load family patient data
        if (familyPatientId > 0) {
          setHasFamilyPatient(true);
          
          try {
            const familyPatientList = await getPatientsList(0, {
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
        // Filter out the current patient from results
        const filteredPatients = patients.filter(p => {
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

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate('/patient-list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        status: Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/patient-list');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update patient.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className="clinic-loading">Loading patient data...</div>;
  }

  if (error || !patientData) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Patient" />
        <div className="clinic-error">
          {error?.message || 'Patient not found'}
        </div>
        <div className="clinic-toolbar">
          <button onClick={handleBack} className="clinic-add-btn">
            <FiArrowLeft size={20} /> Back to List
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Update Patient" />

      {/* Page Header with Back Button */}
      <div className="clinic-toolbar" style={{ justifyContent: 'flex-start', padding: '0 20px' }}>
        <button onClick={handleBack} className="clinic-add-btn">
          Back to List
        </button>
      </div>

      {/* Full-Screen Form Container */}
      <div className="clinic-table-container" style={{ margin: '20px', borderRadius: '17px', padding: '30px' }}>
        <h2 className='clinic-header' style={{ 
          fontSize: '1.5rem',
          fontWeight: '800',
          marginBottom: '30px',
        }}>
          Update Patient: {formData.firstName} {formData.lastName}
        </h2>

        <form onSubmit={handleSubmit}>
          {formError && <div className="form-error">{formError}</div>}
          {formSuccess && <div className="form-success">Patient updated successfully!</div>}

          <div className="form-grid">
            <h3 className="form-section-title">Basic Information</h3>

            <div className="form-group">
              <label>First Name <span className="required">*</span></label>
              <input required name="firstName" value={formData.firstName} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Last Name <span className="required">*</span></label>
              <input required name="lastName" value={formData.lastName} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Gender <span className="required">*</span></label>
              <select required name="gender" value={formData.gender} onChange={handleInputChange}>
                <option value="0">Select Gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Birth Date</label>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Age <span className="required">*</span></label>
              <input required type="number" name="age" value={formData.age} onChange={handleInputChange} min="0" />
            </div>

            <div className="form-group">
              <label>Blood Group <span className="required">*</span></label>
              <select required name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                <option value="0">Select Blood Group</option>
                {BLOOD_GROUP_OPTIONS.map((bg) => (
                  <option key={bg.id} value={bg.id}>{bg.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Marital Status</label>
              <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange}>
                <option value="0">Select Status</option>
                {MARITAL_STATUS_OPTIONS.map((ms) => (
                  <option key={ms.id} value={ms.id}>{ms.label}</option>
                ))}
              </select>
            </div>

            <h3 className="form-section-title">Contact Information</h3>

            <div className="form-group">
              <label>Mobile <span className="required">*</span></label>
              <input required name="mobile" value={formData.mobile} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Alternate Mobile</label>
              <input name="altMobile" value={formData.altMobile} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Emergency Contact</label>
              <input name="emergencyContactNo" value={formData.emergencyContactNo} onChange={handleInputChange} />
            </div>

            <div className="form-group full-width">
              <label>Address</label>
              <textarea name="address" rows={3} value={formData.address} onChange={handleInputChange} />
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
                        const pId = patient.patientId || patient.patientID || patient.id;
                        const isSelected = selectedFamilyPatient && (
                          selectedFamilyPatient.patientId === pId || 
                          selectedFamilyPatient.patientID === pId ||
                          selectedFamilyPatient.id === pId
                        );
                        
                        return (
                          <label
                            key={pId}
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

            <h3 className="form-section-title">Medical Information</h3>

            <div className="form-group full-width">
              <label>Allergies</label>
              <textarea name="allergies" rows={2} value={formData.allergies} onChange={handleInputChange} />
            </div>

            <div className="form-group full-width">
              <label>Existing Medical Conditions</label>
              <textarea name="existingMedicalConditions" rows={2} value={formData.existingMedicalConditions} onChange={handleInputChange} />
            </div>

            <div className="form-group full-width">
              <label>Past Surgeries</label>
              <textarea name="pastSurgeries" rows={2} value={formData.pastSurgeries} onChange={handleInputChange} />
            </div>

            <div className="form-group full-width">
              <label>Current Medications</label>
              <textarea name="currentMedications" rows={2} value={formData.currentMedications} onChange={handleInputChange} />
            </div>

            <div className="form-group full-width">
              <label>Family Medical History</label>
              <textarea name="familyMedicalHistory" rows={2} value={formData.familyMedicalHistory} onChange={handleInputChange} />
            </div>

            <div className="form-group full-width">
              <label>Immunization Records</label>
              <textarea name="immunizationRecords" rows={2} value={formData.immunizationRecords} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Status <span className="required">*</span></label>
              <select required name="status" value={formData.status} onChange={handleInputChange}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons - Full Width */}
          <div className="clinic-modal-footer" style={{ marginTop: '40px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleBack} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="btn-submit">
              {formLoading ? 'Updating...' : 'Update Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePatient;