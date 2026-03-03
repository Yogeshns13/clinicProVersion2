// src/components/ClinicList.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
import UpdateClinic from './UpdateClinic.jsx';
import styles from './ClinicList.module.css';

const getLiveValidationMessage = (fieldName, value) => {
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
  // Data & Filter
  const [clinics, setClinics] = useState([]);
  const [allClinics, setAllClinics] = useState([]);

  // Filter inputs (not applied until search)
  const [filterInputs, setFilterInputs] = useState({
    searchType: 'name',
    searchValue: '',
    statusFilter: '',
  });

  // Applied filters (only set when Search is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'name',
    searchValue: '',
    statusFilter: '',
  });

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

  // Update Modal
  const [updateClinicData, setUpdateClinicData] = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

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
    let result = allClinics;

    if (appliedFilters.statusFilter) {
      const targetStatus = appliedFilters.statusFilter === '1' ? 'active' : 'inactive';
      result = result.filter(c => c.status?.toLowerCase() === targetStatus);
    }

    if (!appliedFilters.searchValue.trim()) return result;
    const term = appliedFilters.searchValue.toLowerCase();

    switch (appliedFilters.searchType) {
      case 'name':
        return result.filter(c => c.name?.toLowerCase().includes(term));
      case 'ownerName':
        return result.filter(c => c.ownerName?.toLowerCase().includes(term));
      case 'mobile':
        return result.filter(c => c.mobile?.toLowerCase().includes(term));
      case 'email':
        return result.filter(c => c.email?.toLowerCase().includes(term));
      case 'gstNo':
        return result.filter(c => c.gstNo?.toLowerCase().includes(term));
      default:
        return result.filter(
          c =>
            c.name?.toLowerCase().includes(term) ||
            c.ownerName?.toLowerCase().includes(term) ||
            c.mobile?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) ||
            c.gstNo?.toLowerCase().includes(term)
        );
    }
  }, [allClinics, appliedFilters]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getStatusClass = (status) => {
    if (status === 'active') return styles.active;
    if (status === 'inactive') return styles.inactive;
    return styles.inactive;
  };

  const refreshClinics = () => {
    getClinicList().then((data) => {
      setClinics(data);
      setAllClinics(data);
    });
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const empty = { searchType: 'name', searchValue: '', statusFilter: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
  };

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
        const lat = name === 'latitude' ? filteredValue : prev.latitude || '';
        const lng = name === 'longitude' ? filteredValue : prev.longitude || '';
        updated.location = [lat, lng].filter(Boolean).join(',');
        return updated;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    }

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({ ...prev, [name]: validationMessage }));
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
        refreshClinics();
      }, 1500);
    } catch (err) {
      console.error('Add clinic failed:', err);
      setFormError(err.message || 'Failed to add clinic.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Update handlers ──
  const handleUpdateClick = (clinic) => {
    setUpdateClinicData(clinic);
    setSelectedClinic(null); // close details modal
    setIsUpdateFormOpen(true);
  };

  const handleUpdateClose = () => {
    setIsUpdateFormOpen(false);
    setUpdateClinicData(null);
  };

  const handleUpdateSuccess = () => {
    setIsUpdateFormOpen(false);
    setUpdateClinicData(null);
    refreshClinics();
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}>Loading clinics...</div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  // Has an active search applied
  const hasActiveSearch = !!appliedFilters.searchValue.trim() || !!appliedFilters.statusFilter;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Clinic Management" />

      {/* ── Filters + Add Clinic bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          {/* Search group */}
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="name">Clinic Name</option>
              <option value="ownerName">Owner Name</option>
              <option value="mobile">Mobile</option>
              <option value="email">Email</option>
              <option value="gstNo">GST No</option>
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'name' ? 'Clinic Name' :
                filterInputs.searchType === 'ownerName' ? 'Owner Name' :
                filterInputs.searchType === 'mobile' ? 'Mobile' :
                filterInputs.searchType === 'email' ? 'Email' :
                'GST No'
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              name="statusFilter"
              value={filterInputs.statusFilter}
              onChange={handleFilterChange}
              className={styles.statusFilterSelect}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="2">Inactive</option>
            </select>
          </div>

          <div className={styles.filterActions}>

            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={18} />
              Search
            </button>

            {/* Clear button — only shown when a search has been applied */}
            {hasActiveSearch && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={18} />
                Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.addClinicBtn}>
              <FiPlus size={18} />
              Add Clinic
            </button>
          </div>

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
                  {hasActiveSearch ? 'No clinics found.' : 'No clinics registered yet.'}
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
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>

            {/* Gradient Header */}
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedClinic.name}</h2>
                <div className={styles.detailHeaderMeta}>
                  <span className={styles.workIdBadge}>{selectedClinic.clinicType || 'Clinic'}</span>
                  <span className={`${styles.workIdBadge} ${selectedClinic.status === 'active' ? styles.activeBadge : styles.inactiveBadge}`}>
                    {selectedClinic.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            {/* Info Cards Grid */}
            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>

                {/* Contact Information */}
                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}>
                    <h3>Contact Information</h3>
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Owner Name</span>
                      <span className={styles.infoValue}>{selectedClinic.ownerName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Mobile</span>
                      <span className={styles.infoValue}>{selectedClinic.mobile || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Alt Mobile</span>
                      <span className={styles.infoValue}>{selectedClinic.altMobile || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoValue}>{selectedClinic.email || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Address</span>
                      <span className={styles.infoValue}>{selectedClinic.address || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Location</span>
                      <span className={styles.infoValue}>{selectedClinic.location || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Tax & Billing Information */}
                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}>
                    <h3>Tax & Billing Information</h3>
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>GST No</span>
                      <span className={styles.infoValue}>{selectedClinic.gstNo || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>CGST %</span>
                      <span className={styles.infoValue}>{selectedClinic.cgstPercentage || 0}%</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>SGST %</span>
                      <span className={styles.infoValue}>{selectedClinic.sgstPercentage || 0}%</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>File No Prefix</span>
                      <span className={styles.infoValue}>{selectedClinic.fileNoPrefix || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Invoice Prefix</span>
                      <span className={styles.infoValue}>{selectedClinic.invoicePrefix || '—'}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className={styles.detailModalFooter}>
                <button onClick={closeModal} className={styles.btnCancel}>
                  Close
                </button>
                <button onClick={() => handleUpdateClick(selectedClinic)} className={styles.btnUpdate}>
                  Update Clinic
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.detailModalOverlay} onClick={closeAddForm}>
          <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

            {/* Gradient Header */}
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Add New Clinic</h2>
              </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.addModalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Clinic added successfully!</div>}

              {/* ── Section: Basic Information ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Basic Information</h3>
                </div>
                <div className={styles.addFormGrid}>

                  <div className={styles.addFormGroup}>
                    <label>Clinic Name <span className={styles.required}>*</span></label>
                    <input required name="clinicName" value={formData.clinicName} onChange={handleInputChange} placeholder="Enter clinic name" />
                    {validationMessages.clinicName && (
                      <span className={styles.validationMsg}>{validationMessages.clinicName}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Clinic Type</label>
                    <input name="clinicType" value={formData.clinicType} onChange={handleInputChange} placeholder="e.g. Dental, General" />
                    {validationMessages.clinicType && (
                      <span className={styles.validationMsg}>{validationMessages.clinicType}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Owner Name <span className={styles.required}>*</span></label>
                    <input required name="ownerName" value={formData.ownerName} onChange={handleInputChange} placeholder="Enter owner name" />
                    {validationMessages.ownerName && (
                      <span className={styles.validationMsg}>{validationMessages.ownerName}</span>
                    )}
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Address</label>
                    <textarea name="address" rows={2} value={formData.address} onChange={handleInputChange} placeholder="Enter full address" />
                    {validationMessages.address && (
                      <span className={styles.validationMsg}>{validationMessages.address}</span>
                    )}
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Location Coordinates</label>
                    <div className={styles.coordRow}>
                      <div className={styles.coordField}>
                        <input type="number" step="any" min="-90" max="90" name="latitude" placeholder="Latitude" value={formData.latitude || ''} onChange={handleInputChange} />
                        {validationMessages.latitude && (
                          <span className={styles.validationMsg}>{validationMessages.latitude}</span>
                        )}
                      </div>
                      <div className={styles.coordField}>
                        <input type="number" step="any" min="-180" max="180" name="longitude" placeholder="Longitude" value={formData.longitude || ''} onChange={handleInputChange} />
                        {validationMessages.longitude && (
                          <span className={styles.validationMsg}>{validationMessages.longitude}</span>
                        )}
                      </div>
                    </div>
                    <small className={styles.coordHint}>Example: 9.9252, 78.1198 (Madurai city center)</small>
                  </div>

                </div>
              </div>

              {/* ── Section: Contact Information — 3 columns (Mobile | Alt Mobile | Email) ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Contact Information</h3>
                </div>
                <div className={styles.addFormGridThreeCol}>

                  <div className={styles.addFormGroup}>
                    <label>Mobile <span className={styles.required}>*</span></label>
                    <input required name="mobile" value={formData.mobile} onChange={handleInputChange} maxLength="10" placeholder="10-digit mobile" />
                    {validationMessages.mobile && (
                      <span className={styles.validationMsg}>{validationMessages.mobile}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Alternate Mobile</label>
                    <input name="altMobile" value={formData.altMobile} onChange={handleInputChange} maxLength="10" placeholder="Optional alt number" />
                    {validationMessages.altMobile && (
                      <span className={styles.validationMsg}>{validationMessages.altMobile}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="clinic@example.com" />
                    {validationMessages.email && (
                      <span className={styles.validationMsg}>{validationMessages.email}</span>
                    )}
                  </div>

                </div>
              </div>

              {/* ── Section: Tax Information — 3 columns (GST No | CGST % | SGST %) ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Tax Information</h3>
                </div>
                <div className={styles.addFormGridThreeCol}>

                  <div className={styles.addFormGroup}>
                    <label>GST Number</label>
                    <input name="gstNo" value={formData.gstNo} onChange={handleInputChange} placeholder="e.g. 29ABCDE1234F1Z5" />
                    {validationMessages.gstNo && (
                      <span className={styles.validationMsg}>{validationMessages.gstNo}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>CGST Percentage</label>
                    <input type="number" name="cgstPercentage" value={formData.cgstPercentage} onChange={handleInputChange} min="0" step="0.01" placeholder="0.00" />
                    {validationMessages.cgstPercentage && (
                      <span className={styles.validationMsg}>{validationMessages.cgstPercentage}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>SGST Percentage</label>
                    <input type="number" name="sgstPercentage" value={formData.sgstPercentage} onChange={handleInputChange} min="0" step="0.01" placeholder="0.00" />
                    {validationMessages.sgstPercentage && (
                      <span className={styles.validationMsg}>{validationMessages.sgstPercentage}</span>
                    )}
                  </div>

                </div>
              </div>

              {/* ── Section: Billing Configuration ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Billing Configuration</h3>
                </div>
                <div className={styles.addFormGrid}>

                  <div className={styles.addFormGroup}>
                    <label>File No Prefix</label>
                    <input
                      name="fileNoPrefix"
                      value={formData.fileNoPrefix}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        const char = e.key;
                        if (['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Enter'].includes(char) || e.ctrlKey || e.metaKey) return;
                        if (!/[A-Za-z0-9_-]/.test(char)) e.preventDefault();
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = (e.clipboardData || window.clipboardData).getData('text');
                        const clean = pasted.replace(/[^A-Za-z0-9_-]/g, '');
                        const input = e.target;
                        const newValue = input.value.substring(0, input.selectionStart) + clean + input.value.substring(input.selectionEnd);
                        setFormData((prev) => ({ ...prev, [input.name]: newValue }));
                      }}
                      placeholder="e.g. FILE-2026_DOC"
                      maxLength={20}
                    />
                    {validationMessages.fileNoPrefix && (
                      <span className={styles.validationMsg}>{validationMessages.fileNoPrefix}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Last File Sequence</label>
                    <input type="number" name="lastFileSeq" value={formData.lastFileSeq} onChange={handleInputChange} min="0" placeholder="0" />
                    {validationMessages.lastFileSeq && (
                      <span className={styles.validationMsg}>{validationMessages.lastFileSeq}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Invoice Prefix</label>
                    <input
                      type="text"
                      name="invoicePrefix"
                      value={formData.invoicePrefix || ''}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        const char = e.key;
                        if (['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Enter'].includes(char) || e.ctrlKey || e.metaKey) return;
                        if (!/[A-Za-z0-9_-]/.test(char)) e.preventDefault();
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = (e.clipboardData || window.clipboardData).getData('text');
                        const clean = pasted.replace(/[^A-Za-z0-9_-]/g, '');
                        const input = e.target;
                        const newValue = input.value.substring(0, input.selectionStart) + clean + input.value.substring(input.selectionEnd);
                        setFormData((prev) => ({ ...prev, [input.name]: newValue }));
                      }}
                      placeholder="e.g. INV-2026_ABC"
                      maxLength={20}
                    />
                    {validationMessages.invoicePrefix && (
                      <span className={styles.validationMsg}>{validationMessages.invoicePrefix}</span>
                    )}
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className={styles.detailModalFooter}>
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

      {/* ──────────────── Update Clinic Modal ──────────────── */}
      {isUpdateFormOpen && updateClinicData && (
        <UpdateClinic
          clinic={updateClinicData}
          onClose={handleUpdateClose}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default ClinicList;