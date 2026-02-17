// src/components/ClinicList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
} from 'react-icons/fi';
import { 
  getClinicList, 
  addClinic, 
} from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ClinicList.module.css';

const getLiveValidationMessage = (fieldName, value) => {
  // Returns validation message while typing (empty string = valid)
  switch (fieldName) {
    case 'clinicName':
      if (!value || !value.trim()) return 'Clinic name is required';
      if (value.trim().length < 3) return 'Clinic name must be at least 3 characters';
      if (value.trim().length > 100) return 'Clinic name must not exceed 100 characters';
      return '';

    case 'ownerName':
      if (!value || !value.trim()) return 'Owner name is required';
      if (value.trim().length < 3) return 'Owner name must be at least 3 characters';
      if (value.trim().length > 100) return 'Owner name must not exceed 100 characters';
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

    case 'email':
      if (value && value.trim()) {
        if (!value.includes('@')) return 'Email must contain @';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
      }
      return '';

  case 'gstNo':
  if (!value || value === '') return '';
  
  const len = value.length;
  
  if (len >= 1) {
    if (!/^[0-9]$/.test(value[0])) {
      return 'Char 1: Must be digit (State Code)';
    }
  }
  
  if (len >= 2) {
    if (!/^[0-9]$/.test(value[1])) {
      return 'Char 2: Must be digit (State Code)';
    }
  }
  
  if (len >= 3) {
    if (!/^[A-Z]$/.test(value[2])) {
      return 'Char 3: Must be uppercase letter (PAN letter 1/5)';
    }
  }
  
  if (len >= 4) {
    if (!/^[A-Z]$/.test(value[3])) {
      return 'Char 4: Must be uppercase letter (PAN letter 2/5)';
    }
  }
  
  if (len >= 5) {
    if (!/^[A-Z]$/.test(value[4])) {
      return 'Char 5: Must be uppercase letter (PAN letter 3/5)';
    }
  }
  
  if (len >= 6) {
    if (!/^[A-Z]$/.test(value[5])) {
      return 'Char 6: Must be uppercase letter (PAN letter 4/5)';
    }
  }
  
  if (len >= 7) {
    if (!/^[A-Z]$/.test(value[6])) {
      return 'Char 7: Must be uppercase letter (PAN letter 5/5)';
    }
  }
  
  if (len >= 8) {
    if (!/^[0-9]$/.test(value[7])) {
      return 'Char 8: Must be digit (PAN number 1/4)';
    }
  }
  
  if (len >= 9) {
    if (!/^[0-9]$/.test(value[8])) {
      return 'Char 9: Must be digit (PAN number 2/4)';
    }
  }
  
  if (len >= 10) {
    if (!/^[0-9]$/.test(value[9])) {
      return 'Char 10: Must be digit (PAN number 3/4)';
    }
  }
  
  if (len >= 11) {
    if (!/^[0-9]$/.test(value[10])) {
      return 'Char 11: Must be digit (PAN number 4/4)';
    }
  }
  
  if (len >= 12) {
    if (!/^[A-Z]$/.test(value[11])) {
      return 'Char 12: Must be uppercase letter (PAN last letter)';
    }
  }
  
  if (len >= 13) {
    if (!/^[1-9A-Z]$/.test(value[12])) {
      return 'Char 13: Must be 1-9 or A-Z (Entity number, not 0)';
    }
  }
  
  if (len >= 14) {
    if (value[13] !== 'Z') {
      return 'Char 14: Must be Z (fixed)';
    }
  }
  
  if (len >= 15) {
    if (!/^[0-9A-Z]$/.test(value[14])) {
      return 'Char 15: Must be digit or uppercase letter (Checksum)';
    }
  }
  
  if (len < 15) {
    return `${len}/15 characters entered`;
  }

  if (len === 15) {
    return 'Valid GST format (29ABCDE1234F1Z5)';
  }
  
  return '';

    case 'cgstPercentage':
    case 'sgstPercentage':
      if (value === '' || value === null || value === undefined) return '';
      const num = Number(value);
      if (isNaN(num)) return 'Must be a number';
      if (num < 0) return 'Cannot be negative';
      if (num > 100) return 'Cannot exceed 100';
      return '';

    case 'fileNoPrefix':
    case 'invoicePrefix':
      if (value && value.trim()) {
        if (value.trim().length > 10) return 'Must not exceed 10 characters';
    if (/[^A-Za-z0-9-_]/.test(value)) {
        return 'Only letters, numbers, hyphen (-) and underscore (_) allowed';
      }
      }
      return '';

    case 'lastFileSeq':
      if (value === '' || value === null || value === undefined) return '';
      const seq = Number(value);
      if (isNaN(seq)) return 'Must be a number';
      if (seq < 0) return 'Cannot be negative';
      return '';

    case 'address':
      if (value && value.length > 500) return 'Address must not exceed 500 characters';
      return '';

    case 'latitude':
      if (value === '') return '';
      const lat = Number(value);
      if (isNaN(lat)) return 'Please enter a valid number';
      if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
      return '';

    case 'longitude':
      if (value === '') return '';
      const lng = Number(value);
      if (isNaN(lng)) return 'Please enter a valid number';
      if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180';
      return '';

    case 'clinicType':
      if (value && value.length > 50) return 'Clinic type must not exceed 50 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'clinicName':
    case 'ownerName':
    case 'clinicType':
      return value.replace(/[^a-zA-Z\s]/g, '');
    
    case 'latitude':
    case 'longitude':
      
      return value
        .replace(/[^0-9.-]/g, '')
        .replace(/(\..*?)\./g, '$1')   
        .replace(/(?!^)-/g, '');       

    case 'mobile':
    case 'altMobile':
      
      return value.replace(/[^0-9]/g, '');
    
    case 'gstNo':
      
      const filtered = value.replace(/[^A-Z0-9]/g, '');
      return filtered.substring(0, 15),value.toUpperCase();
      
    case 'fileNoPrefix':
    case 'invoicePrefix':
      
      return value.replace(/[^A-Za-z0-9_-]/g, ''),value.toUpperCase();
    
    case 'cgstPercentage':
    case 'sgstPercentage':
    case 'lastFileSeq':
      
      return value.replace(/[^0-9.]/g, '');
    
    default:
      return value;
  }
};

// ────────────────────────────────────────────────
const ClinicList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [clinics, setClinics] = useState([]);
  const [allClinics, setAllClinics] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected / Modal
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
const [formData, setFormData] = useState({
  clinicName: '',
  address: '',
  location: '',
  latitude: '',      
  longitude: '',     
  clinicType: '',
  gstNo: '',
  cgstPercentage: 0,
  sgstPercentage: 0,
  ownerName: '',
  mobile: '',
  altMobile: '',
  email: '',
  fileNoPrefix: '',
  lastFileSeq: 0,
  invoicePrefix: '',
});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  
  const [validationMessages, setValidationMessages] = useState({});

  // ────────────────────────────────────────────────
  // Data fetching
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await getClinicList();
        
        setClinics(data);
        setAllClinics(data);
      } catch (err) {
        console.error('fetchClinics error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load clinics' }
        );
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);

  // ────────────────────────────────────────────────
  // Computed values
  const filteredClinics = useMemo(() => {
    if (!searchTerm.trim()) return allClinics;
    const term = searchTerm.toLowerCase();
    return allClinics.filter(
      (clinic) =>
        clinic.name?.toLowerCase().includes(term) ||
        clinic.ownerName?.toLowerCase().includes(term) ||
        clinic.mobile?.toLowerCase().includes(term) ||
        clinic.email?.toLowerCase().includes(term) ||
        clinic.location?.toLowerCase().includes(term) ||
        clinic.gstNo?.toLowerCase().includes(term)
    );
  }, [allClinics, searchTerm]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getStatusClass = (status) => {
    if (status === 'active') return styles.active;
    if (status === 'inactive') return styles.inactive;
    return styles.inactive;
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openDetails = (clinic) => setSelectedClinic(clinic);
  
  const closeModal = () => setSelectedClinic(null);

  const openAddForm = () => {
setFormData({
  clinicName: '',
  address: '',
  location: '',
  latitude: '',      
  longitude: '',     
  clinicType: '',
  gstNo: '',
  cgstPercentage: 0,
  sgstPercentage: 0,
  ownerName: '',
  mobile: '',
  altMobile: '',
  email: '',
  fileNoPrefix: '',
  lastFileSeq: 0,
  invoicePrefix: '',
});
    setFormError('');
    setFormSuccess(false);
    setValidationMessages({}); 
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
    setValidationMessages({}); 
  };

const handleInputChange = (e) => {
  const { name, value } = e.target;
  const filteredValue = filterInput(name, value);

  if (name === 'latitude' || name === 'longitude') {
    setFormData((prev) => {
      const updated = { ...prev, [name]: filteredValue };

      // Combine into location string
      const lat = name === 'latitude' ? filteredValue : prev.latitude || '';
      const lng = name === 'longitude' ? filteredValue : prev.longitude || '';

      updated.location = [lat, lng].filter(Boolean).join(',');

      return updated;
    });
  } else {
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
  }

  // Live validation
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
    setError(null);

    try {
      await addClinic({
        clinicName: formData.clinicName.trim(),
        address: formData.address.trim(),
        location: formData.location.trim(),
        clinicType: formData.clinicType.trim(),
        gstNo: formData.gstNo.trim(),
        cgstPercentage: Number(formData.cgstPercentage),
        sgstPercentage: Number(formData.sgstPercentage),
        ownerName: formData.ownerName.trim(),
        mobile: formData.mobile.trim(),
        altMobile: formData.altMobile.trim(),
        email: formData.email.trim(),
        fileNoPrefix: formData.fileNoPrefix.trim(),
        lastFileSeq: Number(formData.lastFileSeq),
        invoicePrefix: formData.invoicePrefix.trim(),
      });

      setFormSuccess(true);
      setTimeout(() => {
        closeAddForm();
        getClinicList().then((data) => {
          setClinics(data);
          setAllClinics(data);
        });
      }, 1500);
    } catch (err) {
      console.error('Add clinic failed:', err);
      setFormError(err.message || 'Failed to add clinic.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = (clinic) => {
    navigate(`/update-clinic/${clinic.id}`);
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}>Loading clinics...</div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Clinic Management" />

      {/* Toolbar */}
      <div className={styles.clinicToolbar}>
        <div className={styles.clinicSearchContainer}>
          <input
            type="text"
            placeholder="Search by name, owner, mobile, GST..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.clinicSearchInput}
          />
          <button onClick={handleSearch} className={styles.clinicSearchBtn}>
            <FiSearch size={20} />
          </button>
        </div>

        <div className={styles.clinicAddSection}>
          <button onClick={openAddForm} className={styles.clinicAddBtn}>
            <FiPlus size={22} /> Add Clinic
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.clinicTableContainer}>
        <table className={styles.clinicTable}>
          <thead>
            <tr>
              <th>Clinic Name</th>
              <th>Owner</th>
              <th>Location</th>
              <th>Mobile</th>
              <th>GST No</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClinics.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.clinicNoData}>
                  {searchTerm ? 'No clinics found.' : 'No clinics registered yet.'}
                </td>
              </tr>
            ) : (
              filteredClinics.map((clinic) => (
                <tr key={clinic.id}>
                  <td>
                    <div className={styles.clinicNameCell}>
                      <div className={styles.clinicAvatar}>
                        {clinic.name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div>
                        <div className={styles.clinicName}>{clinic.name}</div>
                        <div className={styles.clinicType}>{clinic.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{clinic.ownerName || '—'}</td>
                  <td>{clinic.location || '—'}</td>
                  <td>{clinic.mobile || '—'}</td>
                  <td>{clinic.gstNo || '—'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(clinic.status)}`}>
                      {clinic.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(clinic)} className={styles.clinicDetailsBtn}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedClinic && (
        <div className={styles.clinicModalOverlay} onClick={closeModal}>
          <div className={`${styles.clinicModal} ${styles.detailsModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsModalHeader}>
              <div className={styles.detailsHeaderContent}>
                <div className={styles.clinicAvatarLarge}>
                  {selectedClinic.name?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <h2>{selectedClinic.name}</h2>
                  <p className={styles.clinicSubtitle}>{selectedClinic.clinicType || 'Clinic'}</p>
                </div>
              </div>
              <div className={styles.statusBadgeLargeWrapper}>
                <span className={`${styles.statusBadge} ${styles.large} ${getStatusClass(selectedClinic.status)}`}>
                  {selectedClinic.status.toUpperCase()}
                </span>
              </div>
              <button onClick={closeModal} className={styles.clinicModalClose}>
                ×
              </button>
            </div>

            <div className={styles.detailsModalBody}>
              <table className={styles.detailsTable}>
                <tbody>
                  <tr>
                    <td className={styles.label}>Owner Name</td>
                    <td className={styles.value}>{selectedClinic.ownerName || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Mobile</td>
                    <td className={styles.value}>{selectedClinic.mobile || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Alt Mobile</td>
                    <td className={styles.value}>{selectedClinic.altMobile || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Email</td>
                    <td className={styles.value}>{selectedClinic.email || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Address</td>
                    <td className={styles.value}>{selectedClinic.address || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Location</td>
                    <td className={styles.value}>{selectedClinic.location || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>GST No</td>
                    <td className={styles.value}>{selectedClinic.gstNo || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>CGST %</td>
                    <td className={styles.value}>{selectedClinic.cgstPercentage || 0}%</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>SGST %</td>
                    <td className={styles.value}>{selectedClinic.sgstPercentage || 0}%</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>File No Prefix</td>
                    <td className={styles.value}>{selectedClinic.fileNoPrefix || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Invoice Prefix</td>
                    <td className={styles.value}>{selectedClinic.invoicePrefix || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.clinicModalFooter}>
              <button onClick={() => handleUpdateClick(selectedClinic)} className={styles.btnUpdate}>
                Update Clinic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.clinicModalOverlay} onClick={closeAddForm}>
          <div className={`${styles.clinicModal} ${styles.formModal} ${styles.employeeFormModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.clinicModalHeader}>
              <h2>Add New Clinic</h2>
              <button onClick={closeAddForm} className={styles.clinicModalClose}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.clinicModalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Clinic added successfully!</div>}

              <div className={styles.formGrid}>
                {/* Basic Information */}
                <h3 className={styles.formSectionTitle}>Basic Information</h3>

                <div className={styles.formGroup}>
                  <label>
                    Clinic Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleInputChange}
                  />
                  
                  {validationMessages.clinicName && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.clinicName}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Clinic Type</label>
                  <input
                    name="clinicType"
                    value={formData.clinicType}
                    onChange={handleInputChange}
                  />
                  
                  {validationMessages.clinicType && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.clinicType}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Owner Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="ownerName"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                  />
                  
                  {validationMessages.ownerName && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.ownerName}
                    </span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Address</label>
                  <textarea
                    name="address"
                    rows={2}
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                  
                  {validationMessages.address && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.address}
                    </span>
                  )}
                </div>

   {/* New Location Coordinates */}
<div className={`${styles.formGroup} ${styles.fullWidth}`}>
  <label>Location Coordinates</label>
  <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
    <div style={{ flex: 1 }}>
      <input
        type="number"
        step="any"
        min="-90"
        max="90"
        name="latitude"
        placeholder="Latitude"
        value={formData.latitude || ''}
        onChange={handleInputChange}
      />
      {validationMessages.latitude && (
        <span style={{ color: '#55575c', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          {validationMessages.latitude}
        </span>
      )}
    </div>

    <div style={{ flex: 1 }}>
      <input
        type="number"
        step="any"
        min="-180"
        max="180"
        name="longitude"
        placeholder="Longitude"
        value={formData.longitude || ''}
        onChange={handleInputChange}
      />
      {validationMessages.longitude && (
        <span style={{ color: '#4c4e53', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          {validationMessages.longitude}
        </span>
      )}
    </div>
  </div>
  <small style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px', display: 'block' }}>
    Example: 9.9252,78.1198 (Madurai city center)
  </small>
</div>

                {/* Contact Information */}
                <h3 className={styles.formSectionTitle}>Contact Information</h3>

                <div className={styles.formGroup}>
                  <label>
                    Mobile <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    maxLength="10"
                  />
                  
                  {validationMessages.mobile && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.mobile}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Alternate Mobile</label>
                  <input
                    name="altMobile"
                    value={formData.altMobile}
                    onChange={handleInputChange}
                    maxLength="10"
                  />
                  
                  {validationMessages.altMobile && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.altMobile}
                    </span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  
                  {validationMessages.email && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.email}
                    </span>
                  )}
                </div>

                {/* Tax Information */}
                <h3 className={styles.formSectionTitle}>Tax Information</h3>

                <div className={styles.formGroup}>
                  <label>GST Number</label>
                  <input
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleInputChange}
                  />
                  
                  {validationMessages.gstNo && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.gstNo}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>CGST Percentage</label>
                  <input
                    type="number"
                    name="cgstPercentage"
                    value={formData.cgstPercentage}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                  
                  {validationMessages.cgstPercentage && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.cgstPercentage}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>SGST Percentage</label>
                  <input
                    type="number"
                    name="sgstPercentage"
                    value={formData.sgstPercentage}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                  
                  {validationMessages.sgstPercentage && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.sgstPercentage}
                    </span>
                  )}
                </div>

                {/* Billing Configuration */}
                <h3 className={styles.formSectionTitle}>Billing Configuration</h3>

                <div className={styles.formGroup}>
                  <label>File No Prefix</label>
                  <input
                    name="fileNoPrefix"
                    value={formData.fileNoPrefix}
                    onChange={handleInputChange}
                     onKeyDown={(e) => {
    const char = e.key;

    if (
      char === 'Backspace' ||
      char === 'Delete' ||
      char === 'ArrowLeft' ||
      char === 'ArrowRight' ||
      char === 'ArrowUp' ||
      char === 'ArrowDown' ||
      char === 'Tab' ||
      char === 'Enter' ||
      e.ctrlKey || e.metaKey 
    ) {
      return; 
    }


    if (!/[A-Za-z0-9_-]/.test(char)) {
      e.preventDefault(); 
    }
  }}
  onPaste={(e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const clean = pasted.replace(/[^A-Za-z0-9_-]/g, '');
    const input = e.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue =
      input.value.substring(0, start) +
      clean +
      input.value.substring(end);
    setFormData((prev) => ({ ...prev, [input.name]: newValue }));
  }}
  placeholder="e.g. FILE-2026_DOC"
  maxLength={20}
                  />
                  
                  {validationMessages.fileNoPrefix && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.fileNoPrefix}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Last File Sequence</label>
                  <input
                    type="number"
                    name="lastFileSeq"
                    value={formData.lastFileSeq}
                    onChange={handleInputChange}
                    min="0"
                  />
  
                  {validationMessages.lastFileSeq && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.lastFileSeq}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Invoice Prefix</label>
                <input
  type="text"
  name="invoicePrefix"
  value={formData.invoicePrefix || ''}
  onChange={handleInputChange}           
  onKeyDown={(e) => {
    const char = e.key;

    if (
      char === 'Backspace' ||
      char === 'Delete' ||
      char === 'ArrowLeft' ||
      char === 'ArrowRight' ||
      char === 'ArrowUp' ||
      char === 'ArrowDown' ||
      char === 'Tab' ||
      char === 'Enter' ||
      e.ctrlKey || e.metaKey   
    ) {
      return; 
    }

    if (!/[A-Za-z0-9_-]/.test(char)) {
      e.preventDefault(); 
    }
  }}
  onPaste={(e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const clean = pasted.replace(/[^A-Za-z0-9_-]/g, '');
    const input = e.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue =
      input.value.substring(0, start) +
      clean +
      input.value.substring(end);
    setFormData((prev) => ({ ...prev, [input.name]: newValue }));
  }}
  placeholder="e.g. INV-2026_ABC"
  maxLength={20}
/>
                  {validationMessages.invoicePrefix && (
                    <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {validationMessages.invoicePrefix}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.clinicModalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                  {formLoading ? 'Adding...' : 'Add Clinic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicList;