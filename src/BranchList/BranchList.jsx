// src/components/BranchList.jsx
import React, { useState, useEffect } from 'react';
import {
  FiSearch,
  FiPlus,
  FiX,
} from 'react-icons/fi';
import { 
  getBranchList, 
  getClinicList, 
} from '../api/cachedApi.js';
import { addBranch } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateBranch from './UpdateBranch.jsx';
import styles from './BranchList.module.css';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'branchName':
      if (!value || !value.trim()) return 'Branch name is required';
      if (value.trim().length < 3) return 'Branch name must be at least 3 characters';
      if (value.trim().length > 100) return 'Branch name must not exceed 100 characters';
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

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'branchName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    case 'latitude':
    case 'longitude':
      return value
        .replace(/[^0-9.-]/g, '')
        .replace(/(\..*)\./g, '$1')
        .replace(/(?!^)-/g, '');
    default:
      return value;
  }
};

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const BRANCH_TYPES = [
  { id: 1, label: 'Main' },
  { id: 2, label: 'Satellite' },
  { id: 3, label: 'Clinic' },
  { id: 4, label: 'Hospital' },
  { id: 5, label: 'Diagnostic Center' },
  { id: 6, label: 'Research Center' },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'branchName', label: 'Branch Name' },
  { value: 'location',   label: 'Location' },
];

const DEFAULT_FILTERS = {
  searchType: 'branchName',
  searchValue: '',
  clinicId:   'all',
  branchType: '0',
  status:     '-1',
};

// ────────────────────────────────────────────────
const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [clinics, setClinics]   = useState([]);

  const [filterInputs, setFilterInputs]     = useState({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...DEFAULT_FILTERS });

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [isAddFormOpen, setIsAddFormOpen]   = useState(false);

  const [formData, setFormData] = useState({
    clinicId:   '',
    branchName: '',
    address:    '',
    location:   '',
    latitude:   '',
    longitude:  '',
    branchType: 1,
  });

  const [formLoading, setFormLoading]               = useState(false);
  const [formError, setFormError]                   = useState('');
  const [formSuccess, setFormSuccess]               = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // Update Modal
  const [updateBranchData, setUpdateBranchData] = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.clinicId    !== 'all'     ||
    appliedFilters.branchType  !== '0'       ||
    appliedFilters.status      !== '-1';

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await getClinicList();
        setClinics(data);
      } catch (err) {
        console.error('Failed to load clinics:', err);
      }
    };
    fetchClinics();
  }, []);

  useEffect(() => {
    fetchBranches(appliedFilters);
  }, [appliedFilters]);

  // forceRefresh = true bypasses cache → always fetches latest data from server
  const fetchBranches = async (filters, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = filters.clinicId === 'all' ? 0 : Number(filters.clinicId) || 0;
      const options = {
        BranchName: filters.searchType === 'branchName' ? filters.searchValue : '',
        Location:   filters.searchType === 'location'   ? filters.searchValue : '',
        BranchType: filters.branchType !== '0' ? Number(filters.branchType) : 0,
        Status:     filters.status !== '' ? Number(filters.status) : -1,
      };

      const data = await getBranchList(clinicId, options, forceRefresh);
      setBranches(data);
    } catch (err) {
      console.error('fetchBranches error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load branches' }
      );
    } finally {
      setLoading(false);
    }
  };

  const getBranchTypeLabel = (branchTypeId) => {
    return BRANCH_TYPES.find((t) => t.id === branchTypeId)?.label || 'Main';
  };

  const getStatusClass = (status) => {
    if (status === 'active') return styles.active;
    if (status === 'inactive') return styles.inactive;
    return styles.inactive;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    setFilterInputs({ ...DEFAULT_FILTERS });
    setAppliedFilters({ ...DEFAULT_FILTERS });
  };

  const openDetails = (branch) => setSelectedBranch(branch);
  const closeModal  = () => setSelectedBranch(null);

  const openAddForm = () => {
    setFormData({
      clinicId: '', branchName: '', address: '',
      location: '', latitude: '', longitude: '', branchType: 1,
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
        const lat = name === 'latitude'  ? filteredValue : (prev.latitude  || '');
        const lng = name === 'longitude' ? filteredValue : (prev.longitude || '');
        updated.location = [lat.trim(), lng.trim()].filter(Boolean).join(',');
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
      await addBranch({
        clinicId:   Number(formData.clinicId),
        branchName: formData.branchName.trim(),
        address:    formData.address.trim(),
        location:   formData.location.trim(),
        branchType: Number(formData.branchType),
      });

      setFormSuccess(true);
      setTimeout(() => {
        closeAddForm();
        fetchBranches(appliedFilters, true); // forceRefresh = true
      }, 1500);
    } catch (err) {
      console.error('Add branch failed:', err);
      setFormError(err.message || 'Failed to add branch.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Update handlers ──
  const handleUpdateClick = (branch) => {
    setUpdateBranchData(branch);
    setSelectedBranch(null);
    setIsUpdateFormOpen(true);
  };

  const handleUpdateClose = () => {
    setIsUpdateFormOpen(false);
    setUpdateBranchData(null);
  };

  const handleUpdateSuccess = () => {
    setIsUpdateFormOpen(false);
    setUpdateBranchData(null);
    fetchBranches(appliedFilters, true); // forceRefresh = true
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}>Loading branches...</div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  const hasActiveSearch = hasActiveFilters;

  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Branch Management" />

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              {SEARCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${SEARCH_TYPE_OPTIONS.find(o => o.value === filterInputs.searchType)?.label || ''}`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              name="clinicId"
              value={filterInputs.clinicId}
              onChange={handleFilterChange}
              className={styles.statusFilterSelect}
            >
              <option value="all">All Clinics</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              name="branchType"
              value={filterInputs.branchType}
              onChange={handleFilterChange}
              className={styles.statusFilterSelect}
            >
              <option value="0">All Types</option>
              {BRANCH_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              name="status"
              value={filterInputs.status}
              onChange={handleFilterChange}
              className={styles.statusFilterSelect}
            >
              <option value="-1">All Status</option>
              <option value="1">Active</option>
              <option value="2">Inactive</option>
            </select>
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={18} /> Search
            </button>

            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={18} /> Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.addClinicBtn}>
              <FiPlus size={18} /> Add Branch
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.clinicTableContainer}>
        <table className={styles.clinicTable}>
          <thead>
            <tr>
              <th>Branch Name</th>
              <th>Clinic</th>
              <th>Type</th>
              <th>Location</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.clinicNoData}>
                  {hasActiveSearch ? 'No branches found.' : 'No branches registered yet.'}
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
                <tr key={branch.id}>
                  <td>
                    <div className={styles.clinicNameCell}>
                      <div className={styles.clinicAvatar}>
                        {branch.name?.charAt(0).toUpperCase() || 'B'}
                      </div>
                      <div>
                        <div className={styles.clinicName}>{branch.name}</div>
                        <div className={styles.clinicType}>
                          {getBranchTypeLabel(branch.branchType)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{branch.clinicName || '—'}</td>
                  <td>
                    <span className={styles.statusBadge}>
                      {getBranchTypeLabel(branch.branchType)}
                    </span>
                  </td>
                  <td>{branch.location || branch.address?.split(',')[0] || '—'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(branch.status)}`}>
                      {branch.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(branch)} className={styles.clinicDetailsBtn}>
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
      {selectedBranch && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div className={styles.detailModalContent} onClick={e => e.stopPropagation()}>

            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedBranch.name}</h2>
                <div className={styles.detailHeaderMeta}>
                  <span className={styles.workIdBadge}>
                    {getBranchTypeLabel(selectedBranch.branchType)}
                  </span>
                  <span className={`${styles.workIdBadge} ${selectedBranch.status === 'active' ? styles.activeBadge : styles.inactiveBadge}`}>
                    {selectedBranch.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>
                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}>
                    <h3>Branch Information</h3>
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Clinic</span>
                      <span className={styles.infoValue}>{selectedBranch.clinicName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Branch Type</span>
                      <span className={styles.infoValue}>
                        {getBranchTypeLabel(selectedBranch.branchType)}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Full Address</span>
                      <span className={styles.infoValue}>{selectedBranch.address || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Location</span>
                      <span className={styles.infoValue}>{selectedBranch.location || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button onClick={closeModal} className={styles.btnCancel}>
                  Close
                </button>
                <button onClick={() => handleUpdateClick(selectedBranch)} className={styles.btnUpdate}>
                  Update Branch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.detailModalOverlay} onClick={closeAddForm}>
          <div className={styles.addModalContent} onClick={e => e.stopPropagation()}>

            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Add New Branch</h2>
              </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.addModalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Branch added successfully!</div>}

              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Branch Information</h3>
                </div>
                <div className={styles.addFormGrid}>

                  <div className={styles.addFormGroup}>
                    <label>Clinic <span className={styles.required}>*</span></label>
                    <select
                      required
                      name="clinicId"
                      value={formData.clinicId}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Clinic</option>
                      {clinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Branch Name <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="branchName"
                      value={formData.branchName}
                      onChange={handleInputChange}
                      placeholder="Enter branch name"
                    />
                    {validationMessages.branchName && (
                      <span className={styles.validationMsg}>{validationMessages.branchName}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Branch Type <span className={styles.required}>*</span></label>
                    <select
                      required
                      name="branchType"
                      value={formData.branchType}
                      onChange={handleInputChange}
                    >
                      {BRANCH_TYPES.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Full Address</label>
                    <textarea
                      name="address"
                      rows={2}
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter full address"
                    />
                    {validationMessages.address && (
                      <span className={styles.validationMsg}>{validationMessages.address}</span>
                    )}
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Location Coordinates (optional)</label>
                    <div className={styles.coordRow}>
                      <div className={styles.coordField}>
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
                          <span className={styles.validationMsg}>{validationMessages.latitude}</span>
                        )}
                      </div>
                      <div className={styles.coordField}>
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
                          <span className={styles.validationMsg}>{validationMessages.longitude}</span>
                        )}
                      </div>
                    </div>
                    <small className={styles.coordHint}>
                      Example: 9.9252, 78.1198 (Madurai city center)
                    </small>
                  </div>

                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                  {formLoading ? 'Adding...' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── Update Branch Modal ──────────────── */}
      {isUpdateFormOpen && updateBranchData && (
        <UpdateBranch
          branch={updateBranchData}
          clinics={clinics}
          onClose={handleUpdateClose}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default BranchList;