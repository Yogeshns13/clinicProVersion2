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
} from '../Api/CachedApi.js';
import { addBranch } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateBranch from './UpdateBranch.jsx';
import styles from './BranchList.module.css';

// ─── matches backend allowedCharactersRegex exactly ───────────────────────────
const allowedCharactersRegex = /^[A-Za-z0-9\s\-_]+$/;

// ─── Validation messages match backend addBranchValidatorRules word-for-word ──
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'clinicId':
      if (!value || value === '') return 'ClinicID is required';
      if (isNaN(Number(value)) || !Number.isInteger(Number(value))) return 'ClinicID must be a positive integer';
      return '';

    case 'branchName':
      if (!value || !value.trim()) return 'BranchName is required';
      if (value.trim().length > 100) return 'BranchName should not exceed 100 characters';
      if (!allowedCharactersRegex.test(value.trim())) return 'BranchName contains invalid characters';
      return '';

    case 'address':
      if (!value || !value.trim()) return 'Address is required';
      if (value.length > 500) return 'Address should not exceed 500 characters';
      return '';

    case 'location':
      if (value && value.length > 500) return 'Location should not exceed 500 characters';
      return '';

    case 'branchType':
      if (!value) return 'BranchType is required';
      if (isNaN(Number(value)) || Number(value) < 1) return 'BranchType must be a valid integer (from text table)';
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
      return value.replace(/[^A-Za-z0-9\s\-_]/g, '');
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

const ADD_VALIDATED_FIELDS = ['clinicId', 'branchName', 'address', 'branchType'];

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
  searchType:  'branchName',
  searchValue: '',
  clinicId:    'all',
  branchType:  '0',
  status:      '1',          // default Active
};

// ── Status dropdown → API Status integer ──
const buildStatusParam = (status) => {
  if (status === '1')  return 1;
  if (status === '2')  return 2;
  return -1;  // '-1' or anything else → All
};

// ────────────────────────────────────────────────
const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [clinics, setClinics]   = useState([]);

  const [filterInputs, setFilterInputs]     = useState({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...DEFAULT_FILTERS });

  // Pagination
  const [page, setPage]       = useState(1);
  const [pageSize]            = useState(20);

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

  const [updateBranchData, setUpdateBranchData] = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.clinicId    !== 'all'     ||
    appliedFilters.branchType  !== '0'       ||
    appliedFilters.status      !== '1';

  // ────────────────────────────────────────────────
  // Load clinic dropdown once
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

  // Initial load
  useEffect(() => {
    fetchBranches(appliedFilters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────────────────────────────────────────────────
  // Core fetch — explicit filters + page, no stale closures
  const fetchBranches = async (filters, currentPage, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = filters.clinicId === 'all' ? 0 : Number(filters.clinicId) || 0;

      const options = {
        Page:       currentPage,
        PageSize:   pageSize,
        BranchName: filters.searchType === 'branchName' ? filters.searchValue.trim() : '',
        Location:   filters.searchType === 'location'   ? filters.searchValue.trim() : '',
        BranchType: filters.branchType !== '0' ? Number(filters.branchType) : 0,
        Status:     buildStatusParam(filters.status),
      };

      const data = await getBranchList(clinicId, options, forceRefresh);
      setBranches(Array.isArray(data) ? data : []);
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

  // ────────────────────────────────────────────────
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

  // Search button → apply filters, reset to page 1, call API
  const handleSearch = () => {
    const newFilters = { ...filterInputs };
    setAppliedFilters(newFilters);
    setPage(1);
    fetchBranches(newFilters, 1);
  };

  const handleClearFilters = () => {
    setFilterInputs({ ...DEFAULT_FILTERS });
    setAppliedFilters({ ...DEFAULT_FILTERS });
    setPage(1);
    fetchBranches({ ...DEFAULT_FILTERS }, 1);
  };

  // Pagination — reuse appliedFilters, only page changes
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchBranches(appliedFilters, newPage);
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

  const validateAllAddFields = () => {
    const messages = {};
    let isValid = true;

    ADD_VALIDATED_FIELDS.forEach((field) => {
      const msg = getLiveValidationMessage(field, formData[field]);
      messages[field] = msg;
      if (msg) isValid = false;
    });

    setValidationMessages((prev) => ({ ...prev, ...messages }));
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAllAddFields()) {
      setFormError('Please correct all errors before submitting.');
      return;
    }

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
        fetchBranches(appliedFilters, page, true);
      }, 1500);
    } catch (err) {
      console.error('Add branch failed:', err);
      setFormError(err.message?.split(':')[1]?.trim() || 'Failed to add branch.');
    } finally {
      setFormLoading(false);
    }
  };

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
    fetchBranches(appliedFilters, page, true);
  };

  // ────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}>Loading branches...</div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  const startRecord = branches.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + branches.length;

  // ────────────────────────────────────────────────
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
              <option value="1">Active</option>
              <option value="2">Inactive</option>
              <option value="-1">All Status</option>
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

      {/* Table + Pagination wrapper */}
      <div className={styles.tableSection}>

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
                    {hasActiveFilters ? 'No branches found.' : 'No branches registered yet.'}
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

        {/* Pagination Bar — always at bottom */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {branches.length > 0
              ? `Showing ${startRecord}–${endRecord} records`
              : 'No records'}
          </div>

          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              title="First page"
            >
              «
            </button>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              title="Previous page"
            >
              ‹
            </button>

            <span className={styles.pageIndicator}>{page}</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page + 1)}
              disabled={branches.length < pageSize}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{pageSize}</strong>
          </div>
        </div>

      </div>{/* end tableSection */}

      {/* Details Modal */}
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

      {/* Add Form Modal */}
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
                    {validationMessages.clinicId && (
                      <span className={styles.validationMsg}>{validationMessages.clinicId}</span>
                    )}
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
                    {validationMessages.branchType && (
                      <span className={styles.validationMsg}>{validationMessages.branchType}</span>
                    )}
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Full Address <span className={styles.required}>*</span></label>
                    <textarea
                      required
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