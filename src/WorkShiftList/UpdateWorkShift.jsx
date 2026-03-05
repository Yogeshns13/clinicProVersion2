// src/components/UpdateWorkShift.jsx
import React, { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { updateShift } from '../api/api.js';
import styles from './WorkShift.module.css';

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ── Mirrors backend timeRegex: HH:MM or HH:MM:SS ──
const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

// ────────────────────────────────────────────────
// Props:
//   shift     — the shift object to edit (required)
//   onClose   — called when user cancels or clicks backdrop
//   onSuccess — called after a successful update (triggers list refresh)
// ────────────────────────────────────────────────
const UpdateWorkShift = ({ shift, onClose, onSuccess }) => {
  const getStoredClinicId = () => {
    const clinicId = localStorage.getItem('clinicID');
    return clinicId ? parseInt(clinicId, 10) : null;
  };

  const formatTimeFor24Hr = (time) => {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length === 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
    }
    if (parts.length === 3) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
    }
    return time;
  };

  const formatTimeForInput = (time) => {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return time;
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

  const [formData, setFormData] = useState({
    shiftName:    shift.shiftName                      || '',
    timeStart:    formatTimeForInput(shift.timeStart)  || '',
    timeEnd:      formatTimeForInput(shift.timeEnd)    || '',
    workingHours: shift.workingHours                   || '',
    status:       shift.status === 'active' ? 1 : 2,
  });

  // ── Validation errors state ──
  const [formErrors, setFormErrors] = useState({
    shiftName:    '',
    timeStart:    '',
    timeEnd:      '',
    workingHours: '',
    status:       '',
  });

  // ── Track whether user has attempted submit ──
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

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
          return 'WorkingHours must be decimal with max 2 places';
        return '';
      }

      case 'status': {
        if (value === '' || value === null || value === undefined)
          return 'Status is required';
        if (!Number.isInteger(Number(value)))
          return 'Status must be a valid integer';
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
    status:       validateField('status',       data.status),
  });

  // ── True when every error string is empty ──
  const isFormValid = (errors) =>
    Object.values(errors).every((msg) => msg === '');

  // ────────────────────────────────────────────────
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

      // Re-validate affected fields on every change
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

    try {
      const clinicId = getStoredClinicId();
      if (!clinicId) throw new Error('Clinic ID not found in localStorage');

      const workingHours = formData.workingHours
        ? parseFloat(formData.workingHours)
        : calculateWorkingHours(formData.timeStart, formData.timeEnd);

      await updateShift({
        ShiftID:        Number(shift.id),
        ClinicID:       clinicId,
        ShiftName:      formData.shiftName.trim(),
        ShiftTimeStart: formatTimeFor24Hr(formData.timeStart),
        ShiftTimeEnd:   formatTimeFor24Hr(formData.timeEnd),
        WorkingHours:   workingHours,
        Status:         Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update work shift.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Derived: should the submit button be disabled? ──
  const submitDisabled =
    formLoading ||
    (submitAttempted && !isFormValid(formErrors));

  // ────────────────────────────────────────────────
  return (
    <div className={styles.detailModalOverlay} onClick={onClose}>
      <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

        {/* ── Gradient Header ── */}
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <h2>Update Work Shift</h2>
            <div className={styles.detailHeaderMeta}>
              <span className={styles.workIdBadge}>
                {formData.shiftName || 'Shift'}
              </span>
              <span className={`${styles.workIdBadge} ${formData.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>
                {formData.status === 1 ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className={styles.addModalBody}>
          {formError   && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Work shift updated successfully!</div>}

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

              {/* ── Status ── */}
              <div className={styles.addFormGroup}>
                <label>Status <span className={styles.required}>*</span></label>
                <select
                  required
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {formErrors.status && (
                  <span className={styles.validationMsg}>{formErrors.status}</span>
                )}
              </div>

            </div>
          </div>

          {/* ── Footer ── */}
          <div className={styles.detailModalFooter}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              className={styles.btnSubmit}
            >
              <FiSave style={{ marginRight: '8px' }} />
              {formLoading ? 'Updating...' : 'Update Shift'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default UpdateWorkShift;