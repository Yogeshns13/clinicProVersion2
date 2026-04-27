// src/components/ExternalLabList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { getExternalLabList, addExternalLab, deleteExternalLab } from '../Api/ApiLabTests.js';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateExternalLab from './UpdateExternalLab.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import ConfirmPopup from '../Hooks/ConfirmPopup.jsx';
import styles from './ExternalLabList.module.css';
import LoadingPage from '../Hooks/LoadingPage.jsx';
import { FaClinicMedical } from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'Name':
      if (!value || !value.trim()) return 'Name is required';
      if (value.trim().length > 200) return 'Name should not exceed 200 characters';
      return '';

    case 'Detail':
      if (value && value.trim().length > 500)
        return 'Detail should not exceed 500 characters';
      return '';

    case 'Mobile':
      if (!value || !value.trim()) return 'Mobile is required';
      if (value.trim().length !== 10) return 'Mobile number must be 10 digits';
      if (!/^\d{10}$/.test(value.trim())) return 'Mobile number must contain only digits';
      return '';

    case 'EMail':
      if (value && value.trim()) {
        if (!value.includes('@')) return 'Email must contain @';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return 'Please enter a valid email address';
        if (value.trim().length > 100) return 'Email must not exceed 100 characters';
      }
      return '';

    case 'Address':
      if (value && value.trim().length > 500)
        return 'Address should not exceed 500 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'Mobile':
      return value.replace(/[^0-9]/g, '');
    default:
      return value;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ExternalLabList
// ─────────────────────────────────────────────────────────────────────────────
const ExternalLabList = () => {
  // ── Data ──
  const [labs, setLabs] = useState([]);

  // ── Central popup ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── ConfirmPopup for delete ──
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Filter inputs ──
  const [filterInputs, setFilterInputs] = useState({
    searchValue:  '',
    statusFilter: '-1',
  });

  // ── Applied filters ──
  const [appliedFilters, setAppliedFilters] = useState({
    searchValue:  '',
    statusFilter: '-1',
  });

  // ── Pagination ──
  const [page, setPage]   = useState(1);
  const [pageSize]        = useState(20);

  // ── Table state ──
  const [selectedLab,    setSelectedLab]    = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);

  // ── Button cooldowns ──
  const [searchBtnDisabled, setSearchBtnDisabled] = useState(false);
  const [clearBtnDisabled,  setClearBtnDisabled]  = useState(false);
  const [deleteBtnCooldown, setDeleteBtnCooldown] = useState(false);

  // ── Add Form Modal ──
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    Name: '', Detail: '', Mobile: '', EMail: '', Address: '',
  });
  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitAttempted,    setSubmitAttempted]    = useState(false);

  // ── Update Modal ──
  const [updateLabData,    setUpdateLabData]    = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  // ─────────────────────────────────────────────
  const fetchLabs = async (filters, currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const statusVal = filters.statusFilter !== '' ? Number(filters.statusFilter) : -1;

      const data = await getExternalLabList(clinicId, {
        BranchID: branchId,
        Page:     currentPage,
        PageSize: pageSize,
        Status:   statusVal,
        Search:   filters.searchValue.trim(),
      });
      setLabs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchLabs error:', err);
      showPopup('Failed to fetch external labs. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs(appliedFilters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────
  const isFormValid = useMemo(() => {
    if (!formData.Name || !formData.Name.trim()) return false;
    if (!formData.Mobile || !formData.Mobile.trim()) return false;
    const hasErrors = Object.values(validationMessages).some((msg) => !!msg);
    if (hasErrors) return false;
    return true;
  }, [formData, validationMessages]);

  // ─────────────────────────────────────────────
  const getStatusClass = (status) => {
    // status 0 = Active, 1 = Inactive (from API map)
    if (status === 0) return styles.active;
    if (status === 1) return styles.inactive;
    return styles.inactive;
  };

  const getStatusLabel = (status) => {
    if (status === 0) return 'ACTIVE';
    if (status === 1) return 'INACTIVE';
    return 'UNKNOWN';
  };

  const refreshLabs = () => fetchLabs(appliedFilters, page);

  const validateAllFields = () => {
    const fieldsToValidate = {
      Name: formData.Name, Detail: formData.Detail,
      Mobile: formData.Mobile, EMail: formData.EMail, Address: formData.Address,
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
    await fetchLabs(newFilters, 1);
    setTimeout(() => setSearchBtnDisabled(false), 2000);
  };

  const handleClearFilters = async () => {
    if (clearBtnDisabled) return;
    setClearBtnDisabled(true);
    const defaultState = { searchValue: '', statusFilter: '-1' };
    setFilterInputs(defaultState);
    setAppliedFilters(defaultState);
    setPage(1);
    await fetchLabs(defaultState, 1);
    setTimeout(() => setClearBtnDisabled(false), 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchLabs(appliedFilters, newPage);
  };

  const openDetails = (lab) => setSelectedLab(lab);
  const closeModal  = ()    => setSelectedLab(null);

  const openAddForm = () => {
    setFormData({ Name: '', Detail: '', Mobile: '', EMail: '', Address: '' });
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
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
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
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      await addExternalLab({
        clinicId,
        branchId,
        Name:    formData.Name.trim(),
        Detail:  formData.Detail.trim(),
        Mobile:  formData.Mobile.trim(),
        EMail:   formData.EMail.trim(),
        Address: formData.Address.trim(),
      });

      closeAddForm();
      refreshLabs();
      showPopup('External lab added successfully!', 'success');
    } catch (err) {
      console.error('Add external lab failed:', err);
      const errMsg = err.message || 'Failed to add external lab. Please try again.';
      showPopup(errMsg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = (lab) => {
    setUpdateLabData(lab);
    setSelectedLab(null);
    setIsUpdateFormOpen(true);
  };

  const handleUpdateClose = () => {
    setIsUpdateFormOpen(false);
    setUpdateLabData(null);
  };

  const handleUpdateSuccess = () => {
    setIsUpdateFormOpen(false);
    setUpdateLabData(null);
    refreshLabs();
  };

  const handleUpdateError = (message) => {
    console.error('Update external lab error (handled by UpdateExternalLab popup):', message);
  };

  // ── Delete ──
  const handleDeleteClick = (lab) => {
    if (deleteBtnCooldown) return;
    setDeleteBtnCooldown(true);
    setTimeout(() => setDeleteBtnCooldown(false), 2000);
    setDeleteConfirm(lab);
  };
  const handleDeleteCancel  = () => setDeleteConfirm(null);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteConfirm(null);
    setSelectedLab(null);
    try {
      setLoading(true);
      const clinicId = await getStoredClinicId();
      await deleteExternalLab(deleteConfirm.externalLabId, clinicId);
      showPopup('External lab deleted successfully!', 'success');
      refreshLabs();
    } catch (err) {
      console.error('Delete external lab failed:', err);
      showPopup(err.message || 'Failed to delete external lab.', 'error');
    } finally {
      setDeleteLoading(false);
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.labLoading}><LoadingPage /></div>;

  if (error) return <div className={styles.labError}>Error: {error.message || error}</div>;

  const hasActiveFilter =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.statusFilter !== '-1';

  const startRecord = labs.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + labs.length;
   
  const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';
   
  // ─────────────────────────────────────────────
  return (
    <div className={styles.labListWrapper}>
      <ErrorHandler error={error} />
      <Header title="External Lab Management" />

      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <ConfirmPopup
        visible={!!deleteConfirm}
        message={`Delete external lab "${deleteConfirm?.name || 'this lab'}"?`}
        subMessage="This action cannot be undone. The external lab will be permanently removed."
        confirmLabel={deleteLoading ? 'Deleting...' : 'Yes, Delete'}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* ── Filters + Add bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          <div className={styles.searchGroup}>
            <input
              type="text"
              name="searchValue"
              placeholder="Search by name, mobile or email..."
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
              <option value="-1">All Status</option>
              <option value="0">Active</option>
              <option value="1">Inactive</option>
            </select>
          </div>

          <div className={styles.filterActions}>
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={searchBtnDisabled}
              style={{ opacity: searchBtnDisabled ? 0.6 : 1, cursor: searchBtnDisabled ? 'not-allowed' : 'pointer' }}
            >
              <FiSearch size={18} />
              Search
            </button>

            {hasActiveFilter && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={clearBtnDisabled}
                style={{ opacity: clearBtnDisabled ? 0.6 : 1, cursor: clearBtnDisabled ? 'not-allowed' : 'pointer' }}
              >
                <FiX size={18} />
                Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.addLabBtn}>
              <FiPlus size={18} />
              Add External Lab
            </button>
          </div>

        </div>
      </div>

      {/* ── Table + Pagination ── */}
      <div className={styles.tableSection}>

        <div className={styles.labTableContainer}>
          <table className={styles.labTable}>
            <thead>
              <tr>
                <th>Lab Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {labs.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.labNoData}>
                    {hasActiveFilter ? 'No external labs found.' : 'No external labs registered yet.'}
                  </td>
                </tr>
              ) : (
                labs.map((lab) => (
                  <tr key={lab.externalLabId}>
                    <td>
                      <div className={styles.labNameCell}>
                        <div className={styles.labAvatar}>
                          {lab.name?.charAt(0).toUpperCase() || 'L'}
                        </div>
                        <div>
                          <div className={styles.labName}>{lab.name}</div>
                          <div className={styles.labDetail}>{lab.detail || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{lab.mobile || '—'}</td>
                    <td>{lab.email || '—'}</td>
                    <td className={styles.addressCell}>{lab.address || '—'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(lab.status)}`}>
                        {getStatusLabel(lab.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openDetails(lab)}
                        className={styles.labDetailsBtn}
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
            {labs.length > 0
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
            >«</button>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              title="Previous page"
            >‹</button>

            <span className={styles.pageIndicator}>{page}</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page + 1)}
              disabled={labs.length < pageSize}
              title="Next page"
            >›</button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{pageSize}</strong>
          </div>
        </div>

      </div>

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedLab && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedLab.name}</h2>
                <div className={styles.detailHeaderMeta}>
                  <span className={styles.workIdBadge}>External Lab</span>
                </div>
              </div>
              <div className={styles.addModalHeaderCard}>
                          <div className={styles.clinicInfoIcon}>
                            <FaClinicMedical size={18} />
                          </div>
                          <div className={styles.clinicInfoText}>
                            <span className={styles.clinicInfoName}>{clinicName}</span>
                            <span className={styles.clinicInfoBranch}>{branchName}</span>
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
                      <span className={styles.infoLabel}>Mobile</span>
                      <span className={styles.infoValue}>{selectedLab.mobile || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoValue}>{selectedLab.email || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Address</span>
                      <span className={styles.infoValue}>{selectedLab.address || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Lab Details</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Detail</span>
                      <span className={styles.infoValue}>{selectedLab.detail || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Status</span>
                      <span className={`${styles.statusBadge} ${getStatusClass(selectedLab.status)}`}>
                        {getStatusLabel(selectedLab.status)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className={styles.detailModalFooter}>
                <button
                  onClick={() => handleDeleteClick(selectedLab)}
                  disabled={deleteBtnCooldown || deleteLoading}
                  className={styles.btnCancel}
                >
                  Delete Lab
                </button>
                <button
                  onClick={() => handleUpdateClick(selectedLab)}
                  className={styles.btnUpdate}
                >
                  Update Lab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.detailModalOverlay}>
          <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Add New External Lab</h2>
              </div>
             <div className={styles.addModalHeaderCard}>
                         <div className={styles.clinicInfoIcon}>
                           <FaClinicMedical size={18} />
                         </div>
                         <div className={styles.clinicInfoText}>
                           <span className={styles.clinicInfoName}>{clinicName}</span>
                           <span className={styles.clinicInfoBranch}>{branchName}</span>
                         </div>
                         </div>

              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.addModalBody}>

              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}><h3>Lab Information</h3></div>
                <div className={styles.addFormGrid}>

                  <div className={styles.addFormGroup}>
                    <label>Name <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="Name"
                      value={formData.Name}
                      onChange={handleInputChange}
                      placeholder="Enter lab name"
                    />
                    {validationMessages.Name && (
                      <span className={styles.validationMsg}>{validationMessages.Name}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Mobile <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="Mobile"
                      value={formData.Mobile}
                      onChange={handleInputChange}
                      maxLength={10}
                      placeholder="10-digit mobile number"
                    />
                    {validationMessages.Mobile && (
                      <span className={styles.validationMsg}>{validationMessages.Mobile}</span>
                    )}
                  </div>

                  <div className={styles.addFormGroup}>
                    <label>Email</label>
                    <input
                      type="email"
                      name="EMail"
                      value={formData.EMail}
                      onChange={handleInputChange}
                      placeholder="lab@example.com"
                    />
                    {validationMessages.EMail && (
                      <span className={styles.validationMsg}>{validationMessages.EMail}</span>
                    )}
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Detail</label>
                    <input
                      name="Detail"
                      value={formData.Detail}
                      onChange={handleInputChange}
                      placeholder="Enter lab details"
                    />
                    {validationMessages.Detail && (
                      <span className={styles.validationMsg}>{validationMessages.Detail}</span>
                    )}
                  </div>

                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Address</label>
                    <textarea
                      name="Address"
                      rows={2}
                      value={formData.Address}
                      onChange={handleInputChange}
                      placeholder="Enter full address"
                    />
                    {validationMessages.Address && (
                      <span className={styles.validationMsg}>{validationMessages.Address}</span>
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
                  {formLoading ? 'Adding...' : 'Add External Lab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── Update Modal ──────────────── */}
      {isUpdateFormOpen && updateLabData && (
        <UpdateExternalLab
          lab={updateLabData}
          onClose={handleUpdateClose}
          onSuccess={handleUpdateSuccess}
          onError={handleUpdateError}
        />
      )}
    </div>
  );
};

export default ExternalLabList;