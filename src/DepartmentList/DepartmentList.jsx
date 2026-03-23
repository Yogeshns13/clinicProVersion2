// src/components/DepartmentList.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiChevronDown,
  FiCheckCircle,
} from 'react-icons/fi';
import { addDepartment, getDepartmentList, getClinicList, getBranchList } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateDepartment from './UpdateDepartment.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './DepartmentList.module.css';
import LoadingPage from '../Hooks/LoadingPage.jsx';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'departmentName':
      if (!value || !value.trim()) return 'Department name is required';
      if (value.trim().length < 3) return 'Department name must be at least 3 characters';
      if (value.trim().length > 100) return 'Department name must not exceed 100 characters';
      return '';

    case 'profile':
      if (value && value.length > 100) return 'Description must not exceed 100 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'departmentName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    default:
      return value;
  }
};

const SEARCH_TYPE_OPTIONS = [
  { value: 'departmentName', label: 'Department Name' },
];

const DEFAULT_FILTERS = {
  searchType:  'departmentName',
  searchValue: '',
  clinicId:    'all',
};

// ────────────────────────────────────────────────
// Reusable Searchable Clinic Dropdown
// Used in both the filter bar and the Add Department form
// Only shows active clinics (status === 'active')
// ────────────────────────────────────────────────
const ClinicSearchableDropdown = ({
  clinics,
  value,          // selected clinic id string, or 'all' (filter), or '' (form)
  onChange,       // (idString) => void
  placeholder,    // e.g. 'All Clinics' or 'Select Clinic'
  showAllOption,  // true → render "All Clinics" first option (filter bar only)
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const wrapperRef        = useRef(null);

  // ── Only show active clinics ──
  const activeClinics = clinics.filter(c => c.status === 'active');

  const noneValue      = showAllOption ? 'all' : '';
  const selectedClinic = (value === noneValue || value === '')
    ? null
    : activeClinics.find(c => String(c.id) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = activeClinics.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (clinic) => {
    onChange(clinic ? String(clinic.id) : noneValue);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(noneValue);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className={styles.clinicDropdownWrapper} ref={wrapperRef}>
      <div
        className={`${styles.clinicDropdownTrigger} ${open ? styles.clinicDropdownTriggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <FiSearch className={styles.clinicDropdownSearchIcon} size={14} />

        {open ? (
          <input
            autoFocus
            className={styles.clinicDropdownInput}
            placeholder={selectedClinic ? selectedClinic.name : placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={selectedClinic ? styles.clinicDropdownSelected : styles.clinicDropdownPlaceholder}>
            {selectedClinic ? selectedClinic.name : placeholder}
          </span>
        )}

        <div className={styles.clinicDropdownActions}>
          {selectedClinic && !open && (
            <button type="button" className={styles.clinicDropdownClearBtn} onClick={handleClear}>
              <FiX size={12} />
            </button>
          )}
          <FiChevronDown
            size={14}
            className={`${styles.clinicDropdownChevron} ${open ? styles.clinicDropdownChevronOpen : ''}`}
          />
        </div>
      </div>

      {open && (
        <div className={styles.clinicDropdownMenu}>
          {/* "All Clinics" option — only for filter bar */}
          {showAllOption && (
            <div
              className={`${styles.clinicDropdownOption} ${value === 'all' ? styles.clinicDropdownOptionSelected : ''}`}
              onMouseDown={() => handleSelect(null)}
            >
              <span className={styles.clinicDropdownOptionLabel}>All Clinics</span>
              {value === 'all' && <FiCheckCircle size={13} className={styles.clinicDropdownCheck} />}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className={styles.clinicDropdownNoResults}>No clinics found</div>
          ) : (
            filtered.map(c => (
              <div
                key={c.id}
                className={`${styles.clinicDropdownOption} ${String(c.id) === String(value) ? styles.clinicDropdownOptionSelected : ''}`}
                onMouseDown={() => handleSelect(c)}
              >
                <div className={styles.clinicDropdownAvatar}>
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <span className={styles.clinicDropdownOptionLabel}>{c.name}</span>
                {String(c.id) === String(value) && (
                  <FiCheckCircle size={13} className={styles.clinicDropdownCheck} />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────
const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [clinics,     setClinics]     = useState([]);

  // ── Central popup — used for fetch actions ONLY ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Add form popup — shown ONLY inside the add modal ──
  const [addPopup, setAddPopup] = useState({ visible: false, message: '', type: 'success' });
  const showAddPopup  = (message, type = 'success') => setAddPopup({ visible: true, message, type });
  const closeAddPopup = () => setAddPopup({ visible: false, message: '', type: 'success' });

  const [filterInputs,   setFilterInputs]   = useState({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...DEFAULT_FILTERS });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize]      = useState(20);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading]                       = useState(true);
  const [error, setError]                           = useState(null);
  const [isAddFormOpen, setIsAddFormOpen]           = useState(false);

  // ── Button 2-sec cooldowns ──
  const [searchBtnDisabled, setSearchBtnDisabled] = useState(false);
  const [clearBtnDisabled,  setClearBtnDisabled]  = useState(false);

  const [formData, setFormData] = useState({
    clinicId:       '',
    branchId:       '',
    departmentName: '',
    profile:        '',
  });

  const [branches, setBranches] = useState([]);

  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitAttempted,    setSubmitAttempted]    = useState(false);

  // Update Modal
  const [updateDepartmentData, setUpdateDepartmentData] = useState(null);
  const [isUpdateFormOpen,     setIsUpdateFormOpen]     = useState(false);

  // ── isFormValid: all required add fields filled with no errors ──
  const isFormValid = useMemo(() => {
    const requiredFields = ['clinicId', 'branchId', 'departmentName'];
    const allFilled = requiredFields.every((f) => {
      const v = formData[f];
      return v !== '' && v !== null && v !== undefined && String(v).trim() !== '';
    });
    if (!allFilled) return false;
    const hasErrors = Object.values(validationMessages).some((msg) => !!msg);
    if (hasErrors) return false;
    return true;
  }, [formData, validationMessages]);

  // ────────────────────────────────────────────────
  // Load ACTIVE clinic dropdown once (Status: 1)
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await getClinicList({ Status: 1, PageSize: 200 });
        setClinics(data);
      } catch (err) {
        console.error('Failed to load clinics:', err);
        showPopup('Failed to load clinic list. Please refresh.', 'error');
      }
    };
    fetchClinics();
  }, []);

  // Initial load
  useEffect(() => {
    fetchDepartments(appliedFilters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────────────────────────────────────────────────
  const fetchDepartments = async (filters, currentPage, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = filters.clinicId === 'all' ? 0 : Number(filters.clinicId) || 0;

      const data = await getDepartmentList(clinicId, 0, {
        Page:           currentPage,
        PageSize:       pageSize,
        DepartmentName: filters.searchType === 'departmentName' ? filters.searchValue.trim() : '',
      }, forceRefresh);

      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchDepartments error:', err);
      showPopup('Failed to load departments. Please try again.', 'error');
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load departments' }
      );
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.clinicId           !== 'all';

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for clinic searchable dropdown in filter bar
  const handleClinicFilterChange = (clinicId) => {
    setFilterInputs((prev) => ({ ...prev, clinicId }));
  };

  // Search button — 2-sec cooldown
  const handleSearch = async () => {
    if (searchBtnDisabled) return;
    setSearchBtnDisabled(true);
    const newFilters = { ...filterInputs };
    setAppliedFilters(newFilters);
    setPage(1);
    await fetchDepartments(newFilters, 1);
    setTimeout(() => setSearchBtnDisabled(false), 2000);
  };

  // Clear button — 2-sec cooldown
  const handleClearFilters = async () => {
    if (clearBtnDisabled) return;
    setClearBtnDisabled(true);
    setFilterInputs({ ...DEFAULT_FILTERS });
    setAppliedFilters({ ...DEFAULT_FILTERS });
    setPage(1);
    await fetchDepartments({ ...DEFAULT_FILTERS }, 1);
    setTimeout(() => setClearBtnDisabled(false), 2000);
  };

  // Pagination — reuse appliedFilters, only page changes
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchDepartments(appliedFilters, newPage);
  };

  const openDetails = (department) => setSelectedDepartment(department);
  const closeModal  = ()           => setSelectedDepartment(null);

  const openAddForm = () => {
    setFormData({ clinicId: '', branchId: '', departmentName: '', profile: '' });
    setValidationMessages({});
    setSubmitAttempted(false);
    setAddPopup({ visible: false, message: '', type: 'success' });
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setValidationMessages({});
    setSubmitAttempted(false);
    setAddPopup({ visible: false, message: '', type: 'success' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({ ...prev, [name]: validationMessage }));
  };

  // Handler for clinic searchable dropdown in the Add form
  const handleFormClinicChange = (clinicId) => {
    setFormData((prev) => ({ ...prev, clinicId, branchId: '' }));
    setBranches([]);
  };

  // Load branches when clinic changes inside the add form
  useEffect(() => {
    const fetchBranches = async () => {
      if (formData.clinicId) {
        try {
          const branchData = await getBranchList(Number(formData.clinicId));
          setBranches(branchData || []);
        } catch (err) {
          console.error('Failed to load branches:', err);
          setBranches([]);
        }
      } else {
        setBranches([]);
      }
    };
    fetchBranches();
  }, [formData.clinicId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: form not valid — show popup ONLY inside the add modal
    if (!isFormValid) {
      setSubmitAttempted(true);
      showAddPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      await addDepartment({
        clinicId:       Number(formData.clinicId),
        branchId:       Number(formData.branchId),
        departmentName: formData.departmentName.trim(),
        profile:        formData.profile.trim(),
      });

      // Show success popup ONLY inside the add modal
      showAddPopup('Department added successfully!', 'success');

      // After 1s close the form and refresh — no central popup triggered
      setTimeout(() => {
        closeAddForm();
        fetchDepartments(appliedFilters, page, true);
      }, 1000);
    } catch (err) {
      console.error('Add department failed:', err);
      const errMsg = err.message || 'Failed to add department.';
      // Show error popup ONLY inside the add modal
      showAddPopup(errMsg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = (department) => {
    setUpdateDepartmentData(department);
    setSelectedDepartment(null);
    setIsUpdateFormOpen(true);
  };

  const handleUpdateClose = () => {
    setIsUpdateFormOpen(false);
    setUpdateDepartmentData(null);
  };

  // onSuccess: close modal + refresh ONLY — UpdateDepartment shows its own popup
  const handleUpdateSuccess = () => {
    setIsUpdateFormOpen(false);
    setUpdateDepartmentData(null);
    fetchDepartments(appliedFilters, page, true);
  };

  // onError: log only — UpdateDepartment already shows its own error popup
  const handleUpdateError = (message) => {
    console.error('Update department error (handled by UpdateDepartment popup):', message);
  };

  // ────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}><LoadingPage/></div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  const startRecord = departments.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + departments.length;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Department Management" />

      {/* ── Central MessagePopup (fetch actions ONLY) ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      {/* ── Filter Bar ── */}
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
              placeholder={`Search by ${
                SEARCH_TYPE_OPTIONS.find((o) => o.value === filterInputs.searchType)?.label || ''
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          {/* ── Clinic Searchable Dropdown (filter bar) ── */}
          <div className={styles.filterGroup}>
            <ClinicSearchableDropdown
              clinics={clinics}
              value={filterInputs.clinicId}
              onChange={handleClinicFilterChange}
              placeholder="All Clinics"
              showAllOption={true}
            />
          </div>

          <div className={styles.filterActions}>
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={searchBtnDisabled}
              style={{
                opacity: searchBtnDisabled ? 0.6 : 1,
                cursor:  searchBtnDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <FiSearch size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={clearBtnDisabled}
                style={{
                  opacity: clearBtnDisabled ? 0.6 : 1,
                  cursor:  clearBtnDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                <FiX size={16} />
                Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.addClinicBtn}>
              <FiPlus size={18} />
              Add Dept
            </button>
          </div>

        </div>
      </div>

      {/* ── Table + Pagination wrapper ── */}
      <div className={styles.tableSection}>

        <div className={styles.clinicTableContainer}>
          <table className={styles.clinicTable}>
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Description</th>
                <th>Clinic</th>
                <th>Branch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan={5} className={styles.clinicNoData}>
                    {hasActiveFilters ? 'No departments found.' : 'No departments registered yet.'}
                  </td>
                </tr>
              ) : (
                departments.map((department) => (
                  <tr key={department.id}>
                    <td>
                      <div className={styles.clinicNameCell}>
                        <div className={styles.clinicAvatar}>
                          {department.name?.charAt(0).toUpperCase() || 'D'}
                        </div>
                        <div>
                          <div className={styles.clinicName}>{department.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>{department.profile || '—'}</td>
                    <td>{department.clinicName || '—'}</td>
                    <td>{department.branchName || '—'}</td>
                    <td>
                      <button
                        onClick={() => openDetails(department)}
                        className={styles.clinicDetailsBtn}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Bar ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {departments.length > 0
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
              disabled={departments.length < pageSize}
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

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedDepartment && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div
            className={styles.detailModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedDepartment.name}</h2>
                <div className={styles.detailHeaderMeta}>
                  <span className={styles.workIdBadge}>
                    {selectedDepartment.profile ? 'Department' : 'No Description'}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>
                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}>
                    <h3>Department Information</h3>
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Department Name</span>
                      <span className={styles.infoValue}>{selectedDepartment.name || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Description</span>
                      <span className={styles.infoValue}>{selectedDepartment.profile || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Clinic</span>
                      <span className={styles.infoValue}>{selectedDepartment.clinicName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Branch</span>
                      <span className={styles.infoValue}>{selectedDepartment.branchName || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button onClick={closeModal} className={styles.btnCancel}>
                  Close
                </button>
                <button
                  onClick={() => handleUpdateClick(selectedDepartment)}
                  className={styles.btnUpdate}
                >
                  Update Department
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.detailModalOverlay} >
          <div
            className={styles.addModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Add form's own MessagePopup — renders ONLY inside the modal ── */}
            <MessagePopup
              visible={addPopup.visible}
              message={addPopup.message}
              type={addPopup.type}
              onClose={closeAddPopup}
            />

            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Add New Department</h2>
              </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.addModalBody}>

              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Department Information</h3>
                </div>
                <div className={styles.addFormGrid}>

                  {/* ── Clinic — Searchable Dropdown (same style as filter bar) ── */}
                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Clinic <span className={styles.required}>*</span></label>
                    <div className={styles.addFormClinicDropdown}>
                      <ClinicSearchableDropdown
                        clinics={clinics}
                        value={formData.clinicId}
                        onChange={handleFormClinicChange}
                        placeholder="Select Clinic"
                        showAllOption={false}
                      />
                    </div>
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Branch <span className={styles.required}>*</span></label>
                    <select
                      required
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleInputChange}
                      disabled={!formData.clinicId}
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Department Name <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="departmentName"
                      value={formData.departmentName}
                      onChange={handleInputChange}
                      placeholder="Enter department name"
                    />
                    {validationMessages.departmentName && (
                      <span className={styles.validationMsg}>{validationMessages.departmentName}</span>
                    )}
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Description / Profile</label>
                    <textarea
                      name="profile"
                      rows={3}
                      value={formData.profile}
                      onChange={handleInputChange}
                      placeholder="Enter department description (optional)"
                    />
                    {validationMessages.profile && (
                      <span className={styles.validationMsg}>{validationMessages.profile}</span>
                    )}
                  </div>

                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`${styles.btnSubmit} ${!isFormValid ? styles.btnSubmitDisabled : ''}`}
                  title={!isFormValid ? 'Please fill all required fields' : ''}
                >
                  {formLoading ? 'Adding...' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── Update Department Modal ──────────────── */}
      {isUpdateFormOpen && updateDepartmentData && (
        <UpdateDepartment
          department={updateDepartmentData}
          clinics={clinics}
          onClose={handleUpdateClose}
          onSuccess={handleUpdateSuccess}
          onError={handleUpdateError}
        />
      )}
    </div>
  );
};

export default DepartmentList;