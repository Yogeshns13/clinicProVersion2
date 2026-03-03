// src/components/UpdateWorkShift.jsx
import React, { useState } from 'react';
import { FiSave } from 'react-icons/fi';
import { updateShift } from '../api/api.js';
import styles from './WorkShift.module.css';

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

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

  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'timeStart' || name === 'timeEnd') {
        if (updated.timeStart && updated.timeEnd) {
          const hours = calculateWorkingHours(updated.timeStart, updated.timeEnd);
          updated.workingHours = hours !== null ? hours.toFixed(2) : '';
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Shift Name <span className={styles.required}>*</span></label>
                <input
                  required
                  name="shiftName"
                  value={formData.shiftName}
                  onChange={handleInputChange}
                  placeholder="e.g., Morning Shift, Night Shift"
                />
              </div>

              <div className={styles.addFormGroup}>
                <label>Start Time <span className={styles.required}>*</span></label>
                <input
                  required
                  type="time"
                  name="timeStart"
                  value={formData.timeStart}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.addFormGroup}>
                <label>End Time <span className={styles.required}>*</span></label>
                <input
                  required
                  type="time"
                  name="timeEnd"
                  value={formData.timeEnd}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.addFormGroup}>
                <label>Working Hours</label>
                <input
                  type="number"
                  step="0.01"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleInputChange}
                  placeholder="Auto-calculated from times"
                />
              </div>

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
              </div>

            </div>
          </div>

          {/* ── Footer ── */}
          <div className={styles.detailModalFooter}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
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