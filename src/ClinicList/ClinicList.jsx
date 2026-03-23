// src/components/ClinicList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { getClinicList, addClinic, deleteClinic } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateClinic from './UpdateClinic.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import ConfirmPopup from '../Hooks/ConfirmPopup.jsx';
import styles from './ClinicList.module.css';
import LoadingPage from '../Hooks/LoadingPage.jsx';

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
const allowedCharactersRegex = /^[A-Za-z0-9 ]+$/;

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'clinicName':
      if (!value || !value.trim()) return 'ClinicName is required';
      if (value.trim().length > 100) return 'ClinicName should not exceed 100 characters';
      if (!allowedCharactersRegex.test(value.trim()))
        return 'ClinicName should not contain special characters';
      return '';

    case 'address':
      if (!value || !value.trim()) return 'Address is required';
      if (value.length > 500) return 'Address should not exceed 500 characters';
      return '';

    case 'location':
      if (!value || !value.trim()) return 'Location is required';
      if (value.length > 500) return 'Location should not exceed 500 characters';
      return '';

    case 'clinicType':
      if (!value || !value.trim()) return 'ClinicType is required';
      if (value.length > 500) return 'ClinicType should not exceed 500 characters';
      return '';

    case 'gstNo':
      if (!value || !value.trim()) return 'GstNo is required';
      if (value.trim().length < 15)
        return `GST number must be 15 characters (${value.trim().length}/15 entered)`;
      if (value.trim().length > 15) return 'GST number must not exceed 15 characters';
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.trim()))
        return 'Invalid GST format (e.g. 29ABCDE1234F1Z5)';
      return '';

    case 'cgstPercentage':
      if (value === '' || value === null || value === undefined)
        return 'CgstPercentage is required';
      if (isNaN(Number(value))) return 'CgstPercentage should be a decimal';
      return '';

    case 'sgstPercentage':
      if (value === '' || value === null || value === undefined)
        return 'SgstPercentage is required';
      if (isNaN(Number(value))) return 'SgstPercentage should be a decimal';
      return '';

    case 'ownerName':
      if (!value || !value.trim()) return 'OwnerName is required';
      if (value.trim().length > 100) return 'OwnerName should not exceed 100 characters';
      if (!allowedCharactersRegex.test(value.trim()))
        return 'OwnerName should not contain special characters';
      return '';

    case 'mobile':
      if (!value || !value.trim()) return 'Mobile is required';
      if (value.trim().length !== 10) return 'Mobile number must be 10 digits';
      if (!/^\d{10}$/.test(value.trim())) return 'Mobile number must contain only digits';
      if (value.trim().length > 10) return 'Mobile number cannot exceed 10 digits';
      return '';

    case 'altMobile':
      if (!value || !value.trim()) return 'AltMobile is required';
      if (value.trim().length !== 10) return 'Mobile number must be 10 digits';
      if (!/^\d{10}$/.test(value.trim())) return 'Mobile number must contain only digits';
      if (value.trim().length > 10) return 'Alternate Mobile cannot exceed 10 digits';
      return '';

    case 'email':
      if (!value || !value.trim()) return 'Email is required';
      if (value && value.trim()) {
        if (!value.includes('@')) return 'Email must contain @';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return 'Please enter a valid email address';
        if (value.trim().length > 100) return 'Email must not exceed 100 characters';
      }
      return '';

    case 'fileNoPrefix':
      if (value && value.trim()) {
        if (value.trim().length > 10) return 'FileNoPrefix should not exceed 10 characters';
      }
      return '';

    case 'lastFileSeq':
      if (value === '' || value === null || value === undefined)
        return 'LastFileSeq is required';
      if (!Number.isInteger(Number(value)) || isNaN(Number(value)))
        return 'LastFileSeq should be a number';
      return '';

    case 'invoicePrefix':
      if (value && value.trim()) {
        if (value.trim().length > 10) return 'InvoicePrefix should not exceed 10 characters';
      }
      return '';

    case 'latitude':
      if (value === '') return '';
      // eslint-disable-next-line no-case-declarations
      const lat = Number(value);
      if (isNaN(lat)) return 'Please enter a valid number';
      if (lat < -90 || lat > 90) return 'Latitude must be between -90 and +90';
      return '';

    case 'longitude':
      if (value === '') return '';
      // eslint-disable-next-line no-case-declarations
      const lng = Number(value);
      if (isNaN(lng)) return 'Please enter a valid number';
      if (lng < -180 || lng > 180) return 'Longitude must be between -180 and +180';
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
      // eslint-disable-next-line no-case-declarations
      const filtered = value.replace(/[^A-Z0-9]/g, '');
      return filtered.substring(0, 15), value.toUpperCase();

    case 'fileNoPrefix':
    case 'invoicePrefix':
      return value.replace(/[^A-Za-z0-9_-]/g, ''), value.toUpperCase();

    case 'cgstPercentage':
    case 'sgstPercentage':
    case 'lastFileSeq':
      return value.replace(/[^0-9.]/g, '');

    default:
      return value;
  }
};

// ── Map searchType dropdown → API payload fields ──
const buildSearchPayload = (searchType, searchValue) => {
  const val = searchValue.trim();
  switch (searchType) {
    case 'name':   return { ClinicName: val, Mobile: '',  GstNo: '' };
    case 'mobile': return { ClinicName: '',  Mobile: val, GstNo: '' };
    case 'gstNo':  return { ClinicName: '',  Mobile: '',  GstNo: val };
    default:       return { ClinicName: '',  Mobile: '',  GstNo: '' };
  }
};

// ── Status dropdown → API Status integer ──
const buildStatusParam = (statusFilter) => {
  if (statusFilter === '1') return 1;
  if (statusFilter === '2') return 2;
  return -1;
};

// ─────────────────────────────────────────────────────────────────────────────
// ClinicList
// ─────────────────────────────────────────────────────────────────────────────
const ClinicList = () => {
  // ── Data ──
  const [clinics, setClinics] = useState([]);

  // ── Central popup — used for ClinicList's own actions (fetch, addClinic, deleteClinic) ──
  // NOTE: Update success/error popups are shown by UpdateClinic itself.
  //       handleUpdateSuccess and handleUpdateError must NOT call showPopup.
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── ConfirmPopup for delete ──
  const [deleteConfirm,  setDeleteConfirm]  = useState(null); // holds clinic object or null
  const [deleteLoading,  setDeleteLoading]  = useState(false);

  // ── Filter inputs (not applied until Search is clicked) ──
  const [filterInputs, setFilterInputs] = useState({
    searchType:   'name',
    searchValue:  '',
    statusFilter: '1',
  });

  // ── Applied filters (only set when Search is clicked) ──
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:   'name',
    searchValue:  '',
    statusFilter: '1',
  });

  // ── Pagination ──
  const [page, setPage] = useState(1);
  const [pageSize]      = useState(20);

  // ── Table state ──
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  // ── Button 2-sec cooldowns ──
  const [searchBtnDisabled, setSearchBtnDisabled] = useState(false);
  const [clearBtnDisabled,  setClearBtnDisabled]  = useState(false);
  const [deleteBtnCooldown, setDeleteBtnCooldown] = useState(false);

  // ── Add Form Modal ──
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: '',  address: '',      location: '',  latitude: '',
    longitude: '',   clinicType: '',   gstNo: '',     cgstPercentage: '',
    sgstPercentage: '', ownerName: '', mobile: '',    altMobile: '',
    email: '',       fileNoPrefix: '', lastFileSeq: '', invoicePrefix: '',
  });
  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitAttempted,    setSubmitAttempted]    = useState(false);

  // ── Update Modal ──
  const [updateClinicData, setUpdateClinicData] = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  // ─────────────────────────────────────────────
  const fetchClinics = async (filters, currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const searchPayload = buildSearchPayload(filters.searchType, filters.searchValue);
      const data = await getClinicList({
        Page:     currentPage,
        PageSize: pageSize,
        ...searchPayload,
        Status: buildStatusParam(filters.statusFilter),
      });
      setClinics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchClinics error:', err);
      showPopup('Failed to fetch clinics. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics(appliedFilters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────
  const isFormValid = useMemo(() => {
    const requiredStringFields = [
      'clinicName', 'address', 'clinicType', 'gstNo',
      'ownerName', 'mobile', 'altMobile',
    ];
    const allRequiredFilled = requiredStringFields.every(
      (f) => formData[f] && String(formData[f]).trim()
    );
    if (!allRequiredFilled) return false;
    if (!formData.location || !String(formData.location).trim()) return false;
    const hasErrors = Object.values(validationMessages).some((msg) => !!msg);
    if (hasErrors) return false;
    return true;
  }, [formData, validationMessages]);

  // ─────────────────────────────────────────────
  const getStatusClass = (status) => {
    if (status === 'active')   return styles.active;
    if (status === 'inactive') return styles.inactive;
    return styles.inactive;
  };

  const refreshClinics = () => fetchClinics(appliedFilters, page);

  const validateAllFields = () => {
    const fieldsToValidate = {
      clinicName:     formData.clinicName,
      address:        formData.address,
      location:       formData.location,
      clinicType:     formData.clinicType,
      gstNo:          formData.gstNo,
      cgstPercentage: formData.cgstPercentage,
      sgstPercentage: formData.sgstPercentage,
      ownerName:      formData.ownerName,
      mobile:         formData.mobile,
      altMobile:      formData.altMobile,
      email:          formData.email,
      fileNoPrefix:   formData.fileNoPrefix,
      lastFileSeq:    formData.lastFileSeq,
      invoicePrefix:  formData.invoicePrefix,
      latitude:       formData.latitude,
      longitude:      formData.longitude,
    };
    const messages = {};
    let hasErrors = false;
    for (const [field, value] of Object.entries(fieldsToValidate)) {
      const msg = getLiveValidationMessage(field, value);
      messages[field] = msg;
      if (msg) hasErrors = true;
    }
    setValidationMessages(messages);
    return !hasErrors;
  };

  // ─────────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (searchBtnDisabled) return;
    setSearchBtnDisabled(true);
    const newFilters = { ...filterInputs };
    setAppliedFilters(newFilters);
    setPage(1);
    await fetchClinics(newFilters, 1);
    setTimeout(() => setSearchBtnDisabled(false), 2000);
  };

  const handleClearFilters = async () => {
    if (clearBtnDisabled) return;
    setClearBtnDisabled(true);
    const defaultState = { searchType: 'name', searchValue: '', statusFilter: '1' };
    setFilterInputs(defaultState);
    setAppliedFilters(defaultState);
    setPage(1);
    await fetchClinics(defaultState, 1);
    setTimeout(() => setClearBtnDisabled(false), 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchClinics(appliedFilters, newPage);
  };

  const openDetails = (clinic) => setSelectedClinic(clinic);
  const closeModal  = ()       => setSelectedClinic(null);

  const openAddForm = () => {
    setFormData({
      clinicName: '',  address: '',      location: '',  latitude: '',
      longitude: '',   clinicType: '',   gstNo: '',     cgstPercentage: '',
      sgstPercentage: '', ownerName: '', mobile: '',    altMobile: '',
      email: '',       fileNoPrefix: '', lastFileSeq: '', invoicePrefix: '',
    });
    setValidationMessages({});
    setSubmitAttempted(false);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setValidationMessages({});
    setSubmitAttempted(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);

    if (name === 'latitude' || name === 'longitude') {
      setFormData((prev) => {
        const updated = { ...prev, [name]: filteredValue };
        const lat = name === 'latitude'  ? filteredValue : prev.latitude  || '';
        const lng = name === 'longitude' ? filteredValue : prev.longitude || '';
        updated.location = [lat, lng].filter(Boolean).join(',');
        const locationMsg = getLiveValidationMessage('location', updated.location);
        setValidationMessages((prev2) => ({ ...prev2, location: locationMsg }));
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

    if (!isFormValid) {
      setSubmitAttempted(true);
      validateAllFields();
      showPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    const isValid = validateAllFields();
    if (!isValid) {
      showPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      await addClinic({
        clinicName:     formData.clinicName.trim(),
        address:        formData.address.trim(),
        location:       formData.location.trim(),
        clinicType:     formData.clinicType.trim(),
        gstNo:          formData.gstNo.trim(),
        cgstPercentage: Number(formData.cgstPercentage),
        sgstPercentage: Number(formData.sgstPercentage),
        ownerName:      formData.ownerName.trim(),
        mobile:         formData.mobile.trim(),
        altMobile:      formData.altMobile.trim(),
        email:          formData.email.trim(),
        fileNoPrefix:   formData.fileNoPrefix.trim(),
        lastFileSeq:    Number(formData.lastFileSeq),
        invoicePrefix:  formData.invoicePrefix.trim(),
      });

      // ── FIX: Close the modal first, then show the popup once in the main view ──
      closeAddForm();
      refreshClinics();
      showPopup('Clinic added successfully!', 'success');
    } catch (err) {
      console.error('Add clinic failed:', err);
      const errMsg = err.message || 'Failed to add clinic. Please try again.';
      showPopup(errMsg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = (clinic) => {
    setUpdateClinicData(clinic);
    setSelectedClinic(null);
    setIsUpdateFormOpen(true);
  };

  const handleUpdateClose = () => {
    setIsUpdateFormOpen(false);
    setUpdateClinicData(null);
  };

  // ── onSuccess: close modal + refresh ONLY — no showPopup here ──
  // UpdateClinic already showed its own success popup.
  const handleUpdateSuccess = () => {
    setIsUpdateFormOpen(false);
    setUpdateClinicData(null);
    refreshClinics();
  };

  // ── onError: log if needed — no showPopup here ──
  // UpdateClinic already showed its own error popup.
  const handleUpdateError = (message) => {
    console.error('Update clinic error (handled by UpdateClinic popup):', message);
  };

  // ── Delete: open ConfirmPopup ──
  const handleDeleteClick = (clinic) => {
    if (deleteBtnCooldown) return;
    setDeleteBtnCooldown(true);
    setTimeout(() => setDeleteBtnCooldown(false), 2000);
    setDeleteConfirm(clinic);
  };
  const handleDeleteCancel = () => setDeleteConfirm(null);

  // ── Delete: perform after confirmation ──
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteConfirm(null);
    setSelectedClinic(null);
    try {
      setLoading(true);
      await deleteClinic(deleteConfirm.id);
      showPopup('Clinic deleted successfully!', 'success');
      refreshClinics();
    } catch (err) {
      console.error('Delete clinic failed:', err);
      showPopup(err.message || 'Failed to delete clinic.', 'error');
    } finally {
      setDeleteLoading(false);
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}><LoadingPage/></div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  const hasActiveFilter =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.statusFilter !== '1';

  const startRecord = clinics.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + clinics.length;

  // ─────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Clinic Management" />

      {/* ── ClinicList's own MessagePopup (fetch errors, addClinic, deleteClinic feedback) ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      {/* ── ConfirmPopup for delete clinic ── */}
      <ConfirmPopup
        visible={!!deleteConfirm}
        message={`Delete clinic "${deleteConfirm?.name || 'this clinic'}"?`}
        subMessage="This action cannot be undone. The clinic will be permanently removed."
        confirmLabel={deleteLoading ? 'Deleting...' : 'Yes, Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* ── Filters + Add Clinic bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="name">Clinic Name</option>
              <option value="mobile">Mobile</option>
              <option value="gstNo">GST No</option>
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'name'   ? 'Clinic Name' :
                filterInputs.searchType === 'mobile' ? 'Mobile'      :
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
              <option value="1">Active</option>
              <option value="2">Inactive</option>
              <option value="">All Status</option>
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
              <FiSearch size={18} />
              Search
            </button>

            {hasActiveFilter && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={clearBtnDisabled}
                style={{
                  opacity: clearBtnDisabled ? 0.6 : 1,
                  cursor:  clearBtnDisabled ? 'not-allowed' : 'pointer',
                }}
              >
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

      {/* ── Table + Pagination wrapper ── */}
      <div className={styles.tableSection}>

        <div className={styles.clinicTableContainer}>
          <table className={styles.clinicTable}>
            <thead>
              <tr>
                <th>Clinic Name</th>
                <th>Owner</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>GST No</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clinics.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.clinicNoData}>
                    {hasActiveFilter ? 'No clinics found.' : 'No clinics registered yet.'}
                  </td>
                </tr>
              ) : (
                clinics.map((clinic) => (
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
                    <td>{clinic.email || '—'}</td>
                    <td>{clinic.mobile || '—'}</td>
                    <td>{clinic.gstNo || '—'}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${getStatusClass(clinic.status)}`}
                      >
                        {clinic.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openDetails(clinic)}
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
            {clinics.length > 0
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
              disabled={clinics.length < pageSize}
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
      {selectedClinic && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div
            className={styles.detailModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedClinic.name}</h2>
                <div className={styles.detailHeaderMeta}>
                  <span className={styles.workIdBadge}>
                    {selectedClinic.clinicType || 'Clinic'}
                  </span>
                  <span
                    className={`${styles.workIdBadge} ${
                      selectedClinic.status === 'active'
                        ? styles.activeBadge
                        : styles.inactiveBadge
                    }`}
                  >
                    {selectedClinic.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Contact Information</h3></div>
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

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Tax &amp; Billing Information</h3></div>
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

              {/* Footer — Delete Clinic (left) | Update Clinic (right) */}
              <div className={styles.detailModalFooter}>
                <button
                  onClick={() => handleDeleteClick(selectedClinic)}
                  disabled={deleteBtnCooldown || deleteLoading}
                  className={styles.btnCancel}
                >
                  Delete Clinic
                </button>
                <button
                  onClick={() => handleUpdateClick(selectedClinic)}
                  className={styles.btnUpdate}
                >
                  Update Clinic
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
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Add New Clinic</h2>
              </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.addModalBody}>

              {/* ── Basic Information ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}><h3>Basic Information</h3></div>
                <div className={styles.addFormGrid}>

                  <div className={styles.addFormGroup}>
                    <label>Clinic Name <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="clinicName"
                      value={formData.clinicName}
                      onChange={handleInputChange}
                      placeholder="Enter clinic name"
                    />
                    {validationMessages.clinicName && (
                      <span className={styles.validationMsg}>{validationMessages.clinicName}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Clinic Type <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="clinicType"
                      value={formData.clinicType}
                      onChange={handleInputChange}
                      placeholder="e.g. Dental, General"
                    />
                    {validationMessages.clinicType && (
                      <span className={styles.validationMsg}>{validationMessages.clinicType}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Owner Name <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      placeholder="Enter owner name"
                    />
                    {validationMessages.ownerName && (
                      <span className={styles.validationMsg}>{validationMessages.ownerName}</span>
                    )}
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Address <span className={styles.required}>*</span></label>
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
                    <label>
                      Location Coordinates <span className={styles.required}>*</span>
                    </label>
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
                          required
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
                          required
                        />
                        {validationMessages.longitude && (
                          <span className={styles.validationMsg}>{validationMessages.longitude}</span>
                        )}
                      </div>
                    </div>
                    {validationMessages.location && (
                      <span className={styles.validationMsg}>{validationMessages.location}</span>
                    )}
                    <small className={styles.coordHint}>
                      Example: 9.9252, 78.1198 (Madurai city center)
                    </small>
                  </div>

                </div>
              </div>

              {/* ── Contact Information ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}><h3>Contact Information</h3></div>
                <div className={styles.addFormGridThreeCol}>

                  <div className={styles.addFormGroup}>
                    <label>Mobile <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder="Mobile number"
                    />
                    {validationMessages.mobile && (
                      <span className={styles.validationMsg}>{validationMessages.mobile}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Alternate Mobile <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="altMobile"
                      value={formData.altMobile}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder="Alternate mobile number"
                    />
                    {validationMessages.altMobile && (
                      <span className={styles.validationMsg}>{validationMessages.altMobile}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Email <span className={styles.required}>*</span></label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="clinic@example.com"
                    />
                    {validationMessages.email && (
                      <span className={styles.validationMsg}>{validationMessages.email}</span>
                    )}
                  </div>

                </div>
              </div>

              {/* ── Tax Information ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}><h3>Tax Information</h3></div>
                <div className={styles.addFormGridThreeCol}>

                  <div className={styles.addFormGroup}>
                    <label>GST Number <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="gstNo"
                      value={formData.gstNo}
                      onChange={handleInputChange}
                      placeholder="e.g. 29ABCDE1234F1Z5"
                    />
                    {validationMessages.gstNo && (
                      <span className={styles.validationMsg}>{validationMessages.gstNo}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>CGST Percentage <span className={styles.required}>*</span></label>
                    <input
                      required
                      type="number"
                      name="cgstPercentage"
                      value={formData.cgstPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max={100}
                      step="0.01"
                      placeholder="0.00"
                    />
                    {validationMessages.cgstPercentage && (
                      <span className={styles.validationMsg}>{validationMessages.cgstPercentage}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>SGST Percentage <span className={styles.required}>*</span></label>
                    <input
                      required
                      type="number"
                      name="sgstPercentage"
                      value={formData.sgstPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max={100}
                      step="0.01"
                      placeholder="0.00"
                    />
                    {validationMessages.sgstPercentage && (
                      <span className={styles.validationMsg}>{validationMessages.sgstPercentage}</span>
                    )}
                  </div>

                </div>
              </div>

              {/* ── Billing Configuration ── */}
              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}><h3>Billing Configuration</h3></div>
                <div className={styles.addFormGrid}>

                  <div className={styles.addFormGroup}>
                    <label>File No Prefix</label>
                    <input
                      name="fileNoPrefix"
                      value={formData.fileNoPrefix}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        const char = e.key;
                        if (
                          ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Enter'].includes(char) ||
                          e.ctrlKey || e.metaKey
                        ) return;
                        if (!/[A-Za-z0-9_-]/.test(char)) e.preventDefault();
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = (e.clipboardData || window.clipboardData).getData('text');
                        const clean  = pasted.replace(/[^A-Za-z0-9_-]/g, '');
                        const input  = e.target;
                        const newValue =
                          input.value.substring(0, input.selectionStart) +
                          clean +
                          input.value.substring(input.selectionEnd);
                        setFormData((prev) => ({ ...prev, [input.name]: newValue }));
                      }}
                      placeholder="e.g. CPT"
                    />
                    {validationMessages.fileNoPrefix && (
                      <span className={styles.validationMsg}>{validationMessages.fileNoPrefix}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Last File Sequence <span className={styles.required}>*</span></label>
                    <input
                      required
                      type="number"
                      name="lastFileSeq"
                      value={formData.lastFileSeq}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="e.g. 200000"
                    />
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
                        if (
                          ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Enter'].includes(char) ||
                          e.ctrlKey || e.metaKey
                        ) return;
                        if (!/[A-Za-z0-9_-]/.test(char)) e.preventDefault();
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = (e.clipboardData || window.clipboardData).getData('text');
                        const clean  = pasted.replace(/[^A-Za-z0-9_-]/g, '');
                        const input  = e.target;
                        const newValue =
                          input.value.substring(0, input.selectionStart) +
                          clean +
                          input.value.substring(input.selectionEnd);
                        setFormData((prev) => ({ ...prev, [input.name]: newValue }));
                      }}
                      placeholder="e.g. CPT-INV"
                    />
                    {validationMessages.invoicePrefix && (
                      <span className={styles.validationMsg}>{validationMessages.invoicePrefix}</span>
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
          onError={handleUpdateError}
        />
      )}
    </div>
  );
};

export default ClinicList;