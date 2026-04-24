// src/components/BranchList.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiChevronDown,
  FiCheckCircle,
  FiMapPin,
  FiCalendar,
} from 'react-icons/fi';
import { addBranch, getBranchList, getClinicList, deleteBranch } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateBranch from './UpdateBranch.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import ConfirmPopup from '../Hooks/ConfirmPopup.jsx';
import styles from './BranchList.module.css';
import LoadingPage from '../Hooks/LoadingPage.jsx';

// ─── matches backend allowedCharactersRegex exactly ───────────────────────────
const allowedCharactersRegex = /^[A-Za-z0-9\s\-_]+$/;
const MOBILE_REGEX           = /^\d{10}$/;

// ─── Validation messages match backend addBranchValidatorRules word-for-word ──
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'clinicId':
      if (!value || value === '') return 'ClinicID is required';
      if (isNaN(Number(value)) || !Number.isInteger(Number(value)))
        return 'ClinicID must be a positive integer';
      return '';

    case 'branchName':
      if (!value || !value.trim()) return 'BranchName is required';
      if (value.trim().length > 100) return 'BranchName should not exceed 100 characters';
      if (!allowedCharactersRegex.test(value.trim()))
        return 'BranchName contains invalid characters';
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
      if (isNaN(Number(value)) || Number(value) < 1)
        return 'BranchType must be a valid integer (from text table)';
      return '';

    case 'latitude':
      if (value === '') return '';
      // eslint-disable-next-line no-case-declarations
      const lat = Number(value);
      if (isNaN(lat)) return 'Please enter a valid number';
      if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
      return '';

    case 'longitude':
      if (value === '') return '';
      // eslint-disable-next-line no-case-declarations
      const lng = Number(value);
      if (isNaN(lng)) return 'Please enter a valid number';
      if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180';
      return '';

    case 'mobile':
      if (!value || !value.trim()) return 'Mobile is required';
      if (value.trim().length !== 10) return 'Mobile length should be 10';
      if (!MOBILE_REGEX.test(value.trim())) return 'Invalid mobile number';
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
    case 'mobile':
    case 'altMobile':
      return value.replace(/[^0-9]/g, '');
    default:
      return value;
  }
};

const ADD_VALIDATED_FIELDS = ['clinicId', 'branchName', 'address', 'branchType', 'mobile', 'altMobile'];

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
  status:      '1',
};

// ── Status dropdown → API Status integer ──
const buildStatusParam = (status) => {
  if (status === '1')  return 1;
  if (status === '2')  return 2;
  return -1;
};

// ──────────────────────────────────────────────────────────────────────────────
// INDEXEDDB PERSISTENCE HELPERS
// ──────────────────────────────────────────────────────────────────────────────
const IDB_DB_NAME    = 'AppPreferences';
const IDB_STORE_NAME = 'columnPrefs';
const IDB_KEY        = 'branchListColPrefs';

const openIDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });

const idbGet = async (key) => {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req   = store.get(key);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch {
    return undefined;
  }
};

const idbSet = async (key, value) => {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req   = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch {
    // Silently fail — column prefs are non-critical
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic column pool
// ─────────────────────────────────────────────────────────────────────────────
const DYNAMIC_COLS_MAP = {
  address:     { id: 'address',     label: 'Address',      header: 'Address',      icon: <FiMapPin   size={15} />, render: (b) => b.address     || '—' },
  dateCreated: { id: 'dateCreated', label: 'Created Date', header: 'Created Date', icon: <FiCalendar size={15} />, render: (b) => b.dateCreated ? new Date(b.dateCreated).toLocaleDateString('en-IN') : '—' },
};

// Default cells shown when the dynamic col for that slot is NOT active
const SLOT_DEFAULTS = [
  { header: 'Type',     render: (b) => b.branchType ? (BRANCH_TYPES.find(t => t.id === b.branchType)?.label || '—') : '—' },
  { header: 'Location', render: (b) => b.location || b.address?.split(',')[0] || '—' },
];

const INITIAL_ORDER = ['address', 'dateCreated'];

// ────────────────────────────────────────────────
// Reusable Searchable Clinic Dropdown
// ────────────────────────────────────────────────
const ClinicSearchableDropdown = ({
  clinics,
  value,
  onChange,
  placeholder,
  showAllOption,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const wrapperRef        = useRef(null);

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
const BranchList = () => {
  const [branches, setBranches] = useState([]);
  const [clinics,  setClinics]  = useState([]);

  // ── Dynamic columns state ──
  const [activeColumns, setActiveColumns] = useState(new Set());
  const [menuOrder,     setMenuOrder]     = useState(INITIAL_ORDER);
  const [prefsLoaded,   setPrefsLoaded]   = useState(false);

  // ── Central popup ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Add form popup ──
  const [addPopup, setAddPopup] = useState({ visible: false, message: '', type: 'success' });
  const showAddPopup  = (message, type = 'success') => setAddPopup({ visible: true, message, type });
  const closeAddPopup = () => setAddPopup({ visible: false, message: '', type: 'success' });

  // ── ConfirmPopup for delete ──
  const [deleteConfirm,     setDeleteConfirm]     = useState(null);
  const [deleteLoading,     setDeleteLoading]     = useState(false);
  const [deleteBtnCooldown, setDeleteBtnCooldown] = useState(false);

  const [filterInputs,   setFilterInputs]   = useState({ ...DEFAULT_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...DEFAULT_FILTERS });

  const [page, setPage] = useState(1);
  const [pageSize]      = useState(20);

  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [isAddFormOpen, setIsAddFormOpen]   = useState(false);

  const [searchBtnDisabled, setSearchBtnDisabled] = useState(false);
  const [clearBtnDisabled,  setClearBtnDisabled]  = useState(false);

  const [formData, setFormData] = useState({
    clinicId:   '',
    branchName: '',
    address:    '',
    location:   '',
    latitude:   '',
    longitude:  '',
    branchType: 1,
    mobile:     '',
    altMobile:  '',
  });

  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitAttempted,    setSubmitAttempted]    = useState(false);

  const [updateBranchData, setUpdateBranchData] = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.clinicId    !== 'all'     ||
    appliedFilters.branchType  !== '0'       ||
    appliedFilters.status      !== '1';

  // ── Load column prefs from IndexedDB on mount ──
  useEffect(() => {
    (async () => {
      try {
        const saved = await idbGet(IDB_KEY);
        if (saved) {
          const { activeColumns: savedActive, menuOrder: savedOrder } = saved;
          if (Array.isArray(savedActive)) {
            setActiveColumns(new Set(savedActive));
          }
          if (
            Array.isArray(savedOrder) &&
            savedOrder.length === INITIAL_ORDER.length &&
            savedOrder.every((id) => id in DYNAMIC_COLS_MAP)
          ) {
            setMenuOrder(savedOrder);
          }
        }
      } catch {
        // Use defaults — non-critical
      } finally {
        setPrefsLoaded(true);
      }
    })();
  }, []);

  // ── Save column prefs to IndexedDB whenever they change ──
  useEffect(() => {
    if (!prefsLoaded) return;
    idbSet(IDB_KEY, {
      activeColumns: [...activeColumns],
      menuOrder,
    });
  }, [activeColumns, menuOrder, prefsLoaded]);

  // ── tableSlots ──
  const tableSlots = useMemo(() => {
    return SLOT_DEFAULTS.map((def, slotIdx) => {
      const colId  = menuOrder[slotIdx];
      const dynCol = colId ? DYNAMIC_COLS_MAP[colId] : null;
      if (dynCol && activeColumns.has(colId)) {
        return { header: dynCol.header, render: dynCol.render };
      }
      return { header: def.header, render: def.render };
    });
  }, [activeColumns, menuOrder]);

  const toggleDynCol = (id) => {
    setActiveColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMenuReorder = (newOrderIds) => setMenuOrder(newOrderIds);

  // Menu items passed to Header
  const branchMenuItems = menuOrder.map((id) => {
    const col = DYNAMIC_COLS_MAP[id];
    return {
      id:       col.id,
      icon:     col.icon,
      label:    col.label,
      checked:  activeColumns.has(col.id),
      keepOpen: true,
      onClick:  () => toggleDynCol(col.id),
    };
  });

  // ── isFormValid ──
  const isFormValid = useMemo(() => {
    const requiredFields = ['clinicId', 'branchName', 'address', 'branchType', 'mobile'];
    const allFilled = requiredFields.every((f) => {
      const v = formData[f];
      return v !== '' && v !== null && v !== undefined && String(v).trim() !== '';
    });
    if (!allFilled) return false;
    const hasErrors = Object.values(validationMessages).some((msg) => !!msg);
    if (hasErrors) return false;
    return true;
  }, [formData, validationMessages]);

  // ── Load active clinics once ──
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
    fetchBranches(appliedFilters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────────────────────────────────────────────────
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
      showPopup('Failed to load branches. Please try again.', 'error');
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
  const getBranchTypeLabel = (branchTypeId) =>
    BRANCH_TYPES.find((t) => t.id === branchTypeId)?.label || 'Main';

  const getStatusClass = (status) => {
    if (status === 'active')   return styles.active;
    if (status === 'inactive') return styles.inactive;
    return styles.inactive;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleClinicFilterChange = (clinicId) => {
    setFilterInputs((prev) => ({ ...prev, clinicId }));
  };

  const handleSearch = async () => {
    if (searchBtnDisabled) return;
    setSearchBtnDisabled(true);
    const newFilters = { ...filterInputs };
    setAppliedFilters(newFilters);
    setPage(1);
    await fetchBranches(newFilters, 1);
    setTimeout(() => setSearchBtnDisabled(false), 2000);
  };

  const handleClearFilters = async () => {
    if (clearBtnDisabled) return;
    setClearBtnDisabled(true);
    setFilterInputs({ ...DEFAULT_FILTERS });
    setAppliedFilters({ ...DEFAULT_FILTERS });
    setPage(1);
    await fetchBranches({ ...DEFAULT_FILTERS }, 1);
    setTimeout(() => setClearBtnDisabled(false), 2000);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchBranches(appliedFilters, newPage);
  };

  const openDetails = (branch) => setSelectedBranch(branch);
  const closeModal  = ()       => setSelectedBranch(null);

  const openAddForm = () => {
    setFormData({
      clinicId:   '',
      branchName: '',
      address:    '',
      location:   '',
      latitude:   '',
      longitude:  '',
      branchType: 1,
      mobile:     '',
      altMobile:  '',
    });
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

  const handleFormClinicChange = (clinicId) => {
    setFormData((prev) => ({ ...prev, clinicId }));
    const validationMessage = getLiveValidationMessage('clinicId', clinicId);
    setValidationMessages((prev) => ({ ...prev, clinicId: validationMessage }));
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

    if (!isFormValid) {
      setSubmitAttempted(true);
      validateAllAddFields();
      showAddPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    if (!validateAllAddFields()) {
      showAddPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      await addBranch({
        clinicId:   Number(formData.clinicId),
        branchName: formData.branchName.trim(),
        address:    formData.address.trim(),
        location:   formData.location.trim(),
        branchType: Number(formData.branchType),
        mobile:     formData.mobile.trim(),
        altMobile:  formData.altMobile.trim(),
      });

      showAddPopup('Branch added successfully!', 'success');

      setTimeout(() => {
        closeAddForm();
        fetchBranches(appliedFilters, page, true);
      }, 1000);
    } catch (err) {
      console.error('Add branch failed:', err);
      const errMsg = err.message || 'Failed to add branch.';
      showAddPopup(errMsg, 'error');
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

  const handleUpdateError = (message) => {
    console.error('Update branch error (handled by UpdateBranch popup):', message);
  };

  const handleDeleteClick = (branch) => {
    if (deleteBtnCooldown) return;
    setDeleteBtnCooldown(true);
    setTimeout(() => setDeleteBtnCooldown(false), 2000);
    setDeleteConfirm(branch);
  };
  const handleDeleteCancel = () => setDeleteConfirm(null);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteConfirm(null);
    setSelectedBranch(null);
    try {
      setLoading(true);
      await deleteBranch(deleteConfirm.id);
      showPopup('Branch deleted successfully!', 'success');
      fetchBranches(appliedFilters, page, true);
    } catch (err) {
      console.error('Delete branch failed:', err);
      showPopup(err.message || 'Failed to delete branch.', 'error');
    } finally {
      setDeleteLoading(false);
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}><LoadingPage /></div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  const startRecord = branches.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + branches.length;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />

      <Header
        title="Branch Management"
        menuItems={branchMenuItems}
        onMenuReorder={handleMenuReorder}
      />

      {/* ── Central MessagePopup ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      {/* ── ConfirmPopup for delete branch ── */}
      <ConfirmPopup
        visible={!!deleteConfirm}
        message={`Delete branch "${deleteConfirm?.name || 'this branch'}"?`}
        subMessage="This action cannot be undone. The branch will be permanently removed."
        confirmLabel={deleteLoading ? 'Deleting...' : 'Yes, Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* ── Filters ── */}
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
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <ClinicSearchableDropdown
              clinics={clinics}
              value={filterInputs.clinicId}
              onChange={handleClinicFilterChange}
              placeholder="All Clinics"
              showAllOption={true}
            />
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
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={searchBtnDisabled}
              style={{
                opacity: searchBtnDisabled ? 0.6 : 1,
                cursor:  searchBtnDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <FiSearch size={18} /> Search
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
                <FiX size={18} /> Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.addClinicBtn}>
              <FiPlus size={18} /> Add Branch
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
                <th>Branch Name</th>
                <th>Clinic</th>
                {tableSlots.map((slot, i) => <th key={i}>{slot.header}</th>)}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={6 + tableSlots.length} className={styles.clinicNoData}>
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
                        </div>
                      </div>
                    </td>
                    <td>{branch.clinicName || '—'}</td>
                    {tableSlots.map((slot, i) => <td key={i}>{slot.render(branch)}</td>)}
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(branch.status)}`}>
                        {branch.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openDetails(branch)}
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

      </div>

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedBranch && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div
            className={styles.detailModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedBranch.name}</h2>
                <div className={styles.detailHeaderMeta}>
                  <span className={styles.workIdBadge}>
                    {getBranchTypeLabel(selectedBranch.branchType)}
                  </span>
                  <span
                    className={`${styles.workIdBadge} ${
                      selectedBranch.status === 'active'
                        ? styles.activeBadge
                        : styles.inactiveBadge
                    }`}
                  >
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
                      <span className={styles.infoLabel}>Mobile</span>
                      <span className={styles.infoValue}>{selectedBranch.mobile || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Alt Mobile</span>
                      <span className={styles.infoValue}>{selectedBranch.altMobile || '—'}</span>
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
                <button
                  onClick={() => handleDeleteClick(selectedBranch)}
                  disabled={deleteBtnCooldown || deleteLoading}
                  className={styles.btnCancel}
                >
                  Delete Branch
                </button>
                <button
                  onClick={() => handleUpdateClick(selectedBranch)}
                  className={styles.btnUpdate}
                >
                  Update Branch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.detailModalOverlay}>
          <div
            className={styles.addModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <MessagePopup
              visible={addPopup.visible}
              message={addPopup.message}
              type={addPopup.type}
              onClose={closeAddPopup}
            />

            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Add New Branch</h2>
              </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.addModalBody}>

              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Branch Information</h3>
                </div>
                <div className={styles.addFormGrid}>

                  <div className={styles.addFormGroup}>
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

                  <div className={styles.addFormGroup}>
                    <label>Mobile <span className={styles.required}>*</span></label>
                    <input
                      required
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Enter mobile number"
                      maxLength={10}
                    />
                    {validationMessages.mobile && (
                      <span className={styles.validationMsg}>{validationMessages.mobile}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Alternate Mobile</label>
                    <input
                      type="tel"
                      name="altMobile"
                      value={formData.altMobile}
                      onChange={handleInputChange}
                      placeholder="Enter alternate mobile number"
                      maxLength={10}
                    />
                    {validationMessages.altMobile && (
                      <span className={styles.validationMsg}>{validationMessages.altMobile}</span>
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
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`${styles.btnSubmit} ${!isFormValid ? styles.btnSubmitDisabled : ''}`}
                  title={!isFormValid ? 'Please fill all required fields' : ''}
                >
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
          onError={handleUpdateError}
        />
      )}
    </div>
  );
};

export default BranchList;