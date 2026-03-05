// src/components/WorkShift.jsx
import React, { useState, useEffect } from 'react';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiTrash2,
} from 'react-icons/fi';
import { 
  getShiftList,
  addShift,
  deleteShift 
} from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateWorkShift from './UpdateWorkShift.jsx';
import styles from './WorkShift.module.css';

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ── Mirrors backend timeRegex: HH:MM or HH:MM:SS ──
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

const WorkShift = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterInputs, setFilterInputs] = useState({
    searchValue: '',
    status: '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    searchValue: '',
    status: '',
  });

  const [selectedShift, setSelectedShift] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const [formData, setFormData] = useState({
    shiftName: '',
    timeStart: '',
    timeEnd: '',
    workingHours: '',
  });

  // ── Validation errors state ──
  const [formErrors, setFormErrors] = useState({
    shiftName: '',
    timeStart: '',
    timeEnd: '',
    workingHours: '',
  });

  // ── Track whether user has attempted submit (to show errors on untouched fields) ──
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Update Modal
  const [updateShiftData, setUpdateShiftData] = useState(null);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.status !== '';

  const getStoredClinicId = () => {
    const clinicId = localStorage.getItem('clinicID');
    return clinicId ? parseInt(clinicId, 10) : null;
  };

  const calculateWorkingHours = (start, end) => {
    if (!start || !end) return null;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    if (minutes < 0) { hours -= 1; minutes += 60; }
    if (hours < 0) { hours += 24; }
    return hours + (minutes / 60);
  };

  const fetchShifts = async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = getStoredClinicId();

      const options = {
        ShiftName: filters.searchValue || '',
        Status: filters.status !== '' ? Number(filters.status) : -1,
      };

      const data = await getShiftList(clinicId, options);
      setShifts(data);
    } catch (err) {
      console.error('fetchShifts error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load work shifts' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts(appliedFilters);
  }, [appliedFilters]);

  const getStatusClass = (status) => {
    if (status === 'active') return styles.active;
    if (status === 'inactive') return styles.inactive;
    return styles.inactive;
  };

  const formatTime = (time) => {
    if (!time) return '—';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatTimeFor24Hr = (time) => {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    }
    return time;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const empty = { searchValue: '', status: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
  };

  const openDetails = (shift) => setSelectedShift(shift);
  const closeModal  = () => setSelectedShift(null);

  const openAddForm = () => {
    setFormData({ shiftName: '', timeStart: '', timeEnd: '', workingHours: '' });
    setFormErrors({ shiftName: '', timeStart: '', timeEnd: '', workingHours: '' });
    setSubmitAttempted(false);
    setFormError('');
    setFormSuccess(false);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
    setFormErrors({ shiftName: '', timeStart: '', timeEnd: '', workingHours: '' });
    setSubmitAttempted(false);
  };

  // ── Validate a single field by name, returns error string or '' ──
  const validateField = (name, value) => {
    switch (name) {

      case 'shiftName': {
        if (!value || value.trim() === '')
          return 'ShiftName is required';
        if (value.trim().length > 50)
          return 'ShiftName should not exceed 50 characters';
        if (!/^[A-Za-z0-9\s\-_]+$/.test(value.trim()))
          return 'ShiftName contains invalid characters';
        return '';
      }

      case 'timeStart': {
        if (!value || value.trim() === '')
          return 'ShiftTimeStart is required';
        if (!TIME_REGEX.test(value))
          return 'ShiftTimeStart must be a valid time (HH:MM or HH:MM:SS)';
        return '';
      }

      case 'timeEnd': {
        if (!value || value.trim() === '')
          return 'ShiftTimeEnd is required';
        if (!TIME_REGEX.test(value))
          return 'ShiftTimeEnd must be a valid time (HH:MM or HH:MM:SS)';
        return '';
      }

      case 'workingHours': {
        if (value === '' || value === null || value === undefined)
          return 'WorkingHours is required';
        if (!/^\d+(\.\d{1,2})?$/.test(String(value)))
          return 'WorkingHours must be decimal with max 2 places (e.g., 8.50)';
        return '';
      }

      default:
        return '';
    }
  };

  // ── Validate all fields at once, returns errors object ──
  const validateAll = (data) => ({
    shiftName:    validateField('shiftName',    data.shiftName),
    timeStart:    validateField('timeStart',    data.timeStart),
    timeEnd:      validateField('timeEnd',      data.timeEnd),
    workingHours: validateField('workingHours', data.workingHours),
  });

  // ── True when every error string is empty ──
  const isFormValid = (errors) =>
    Object.values(errors).every((msg) => msg === '');

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate working hours when times change
      if (name === 'timeStart' || name === 'timeEnd') {
        if (updated.timeStart && updated.timeEnd) {
          const hours = calculateWorkingHours(updated.timeStart, updated.timeEnd);
          if (hours !== null) {
            updated.workingHours = hours.toFixed(2);
          }
        }
      }

      // Re-validate affected fields whenever a value changes
      setFormErrors((prevErrors) => {
        const newErrors = { ...prevErrors };

        // Validate the changed field
        newErrors[name] = validateField(name, value);

        // If times changed, also re-validate workingHours against the new auto-value
        if (name === 'timeStart' || name === 'timeEnd') {
          newErrors.workingHours = validateField('workingHours', updated.workingHours);
        }

        return newErrors;
      });

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    // Run full validation before sending
    const errors = validateAll(formData);
    setFormErrors(errors);

    if (!isFormValid(errors)) return; // Block submission if any errors

    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      const clinicId = getStoredClinicId();
      if (!clinicId) throw new Error('Clinic ID not found in localStorage');

      const workingHours = formData.workingHours
        ? parseFloat(formData.workingHours)
        : calculateWorkingHours(formData.timeStart, formData.timeEnd);

      await addShift({
        clinicId,
        ShiftName: formData.shiftName.trim(),
        ShiftTimeStart: formatTimeFor24Hr(formData.timeStart),
        ShiftTimeEnd: formatTimeFor24Hr(formData.timeEnd),
        WorkingHours: workingHours,
      });

      setFormSuccess(true);
      setTimeout(() => {
        closeAddForm();
        fetchShifts(appliedFilters);
      }, 1500);
    } catch (err) {
      console.error('Add shift failed:', err);
      setFormError(err.message || 'Failed to add work shift.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Update handlers ──
  const handleUpdateClick = (shift) => {
    setUpdateShiftData(shift);
    setSelectedShift(null);
    setIsUpdateFormOpen(true);
  };

  const handleUpdateClose = () => {
    setIsUpdateFormOpen(false);
    setUpdateShiftData(null);
  };

  const handleUpdateSuccess = () => {
    setIsUpdateFormOpen(false);
    setUpdateShiftData(null);
    fetchShifts(appliedFilters);
  };

  const openDeleteConfirm = (shift) => {
    setShiftToDelete(shift);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setShiftToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleDelete = async () => {
    if (!shiftToDelete) return;
    setDeleteLoading(true);
    setError(null);

    try {
      await deleteShift(shiftToDelete.id);
      fetchShifts(appliedFilters);
      closeDeleteConfirm();
      if (selectedShift?.id === shiftToDelete.id) closeModal();
    } catch (err) {
      console.error('Delete shift failed:', err);
      setError({ message: err.message || 'Failed to delete work shift', status: err.status || 500 });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}>Loading work shifts...</div>;
  if (error)   return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  // ── Derived: should the submit button be disabled? ──
  const submitDisabled =
    formLoading ||
    (submitAttempted && !isFormValid(formErrors));

  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Work Shift Management" />

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchGroup}>
            <input
              type="text"
              name="searchValue"
              placeholder="Search by shift name..."
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              name="status"
              value={filterInputs.status}
              onChange={handleFilterChange}
              className={styles.statusFilterSelect}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
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
              <FiPlus size={18} /> Add Shift
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.clinicTableContainer}>
        <table className={styles.clinicTable}>
          <thead>
            <tr>
              <th>Shift Name</th>
              <th>Clinic</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Working Hours</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.clinicNoData}>
                  {hasActiveFilters ? 'No work shifts found.' : 'No work shifts registered yet.'}
                </td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>
                    <div className={styles.clinicNameCell}>
                      <div className={styles.clinicAvatar}>
                        {shift.shiftName?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className={styles.clinicName}>{shift.shiftName}</div>
                      </div>
                    </div>
                  </td>
                  <td>{shift.clinicName || '—'}</td>
                  <td>{formatTime(shift.timeStart)}</td>
                  <td>{formatTime(shift.timeEnd)}</td>
                  <td>{shift.workingHours ? `${shift.workingHours} hrs` : '—'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(shift.status)}`}>
                      {shift.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(shift)} className={styles.clinicDetailsBtn}>
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
      {selectedShift && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>

            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedShift.shiftName}</h2>
                <div className={styles.detailHeaderMeta}>
                  <span className={styles.workIdBadge}>Work Shift</span>
                  <span className={`${styles.workIdBadge} ${selectedShift.status === 'active' ? styles.activeBadge : styles.inactiveBadge}`}>
                    {selectedShift.status?.toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>
                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}>
                    <h3>Shift Information</h3>
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Clinic</span>
                      <span className={styles.infoValue}>{selectedShift.clinicName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Shift Name</span>
                      <span className={styles.infoValue}>{selectedShift.shiftName}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Start Time</span>
                      <span className={styles.infoValue}>{formatTime(selectedShift.timeStart)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>End Time</span>
                      <span className={styles.infoValue}>{formatTime(selectedShift.timeEnd)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Working Hours</span>
                      <span className={styles.infoValue}>
                        {selectedShift.workingHours ? `${selectedShift.workingHours} hours` : '—'}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Created</span>
                      <span className={styles.infoValue}>
                        {selectedShift.dateCreated ? new Date(selectedShift.dateCreated).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button onClick={() => openDeleteConfirm(selectedShift)} className={styles.btnCancel}>
                  <FiTrash2 style={{ marginRight: '8px' }} /> Delete
                </button>
                <button onClick={() => handleUpdateClick(selectedShift)} className={styles.btnUpdate}>
                  Update Shift
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

            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Add New Work Shift</h2>
              </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.addModalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Work shift added successfully!</div>}

              <div className={styles.addSection}>
                <div className={styles.addSectionHeader}>
                  <h3>Shift Information</h3>
                </div>

                <div className={styles.addFormGrid}>

                  {/* ── Shift Name ── */}
                  <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                    <label>Shift Name <span className={styles.required}>*</span></label>
                    <input
                      required
                      name="shiftName"
                      value={formData.shiftName}
                      onChange={handleInputChange}
                      placeholder="e.g., Morning Shift, Night Shift"
                    />
                    {formErrors.shiftName && (
                      <span className={styles.validationMsg}>{formErrors.shiftName}</span>
                    )}
                  </div>

                  {/* ── Start Time ── */}
                  <div className={styles.addFormGroup}>
                    <label>Start Time <span className={styles.required}>*</span></label>
                    <input
                      required
                      type="time"
                      name="timeStart"
                      value={formData.timeStart}
                      onChange={handleInputChange}
                    />
                    {formErrors.timeStart && (
                      <span className={styles.validationMsg}>{formErrors.timeStart}</span>
                    )}
                  </div>

                  {/* ── End Time ── */}
                  <div className={styles.addFormGroup}>
                    <label>End Time <span className={styles.required}>*</span></label>
                    <input
                      required
                      type="time"
                      name="timeEnd"
                      value={formData.timeEnd}
                      onChange={handleInputChange}
                    />
                    {formErrors.timeEnd && (
                      <span className={styles.validationMsg}>{formErrors.timeEnd}</span>
                    )}
                  </div>

                  {/* ── Working Hours ── */}
                  <div className={styles.addFormGroup}>
                    <label>Working Hours <span className={styles.required}>*</span></label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      name="workingHours"
                      value={formData.workingHours}
                      onChange={handleInputChange}
                      placeholder="Auto-calculated from times"
                    />
                    {formErrors.workingHours && (
                      <span className={styles.validationMsg}>{formErrors.workingHours}</span>
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
                  disabled={submitDisabled}
                  className={styles.btnSubmit}
                >
                  {formLoading ? 'Adding...' : 'Add Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──────────────── Delete Confirmation Modal ──────────────── */}
      {deleteConfirmOpen && shiftToDelete && (
        <div className={styles.detailModalOverlay} onClick={closeDeleteConfirm}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>

            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>Confirm Delete</h2>
              </div>
              <button onClick={closeDeleteConfirm} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <p style={{ margin: '20px 0', color: '#475569' }}>
                Are you sure you want to delete the work shift 
                <strong> "{shiftToDelete.shiftName}"</strong>?<br/>
                This action cannot be undone.
              </p>
            </div>

            <div className={styles.detailModalFooter}>
              <button onClick={closeDeleteConfirm} className={styles.btnCancel} disabled={deleteLoading}>
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className={styles.btnSubmit}
                style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Update Shift Modal ──────────────── */}
      {isUpdateFormOpen && updateShiftData && (
        <UpdateWorkShift
          shift={updateShiftData}
          onClose={handleUpdateClose}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default WorkShift;