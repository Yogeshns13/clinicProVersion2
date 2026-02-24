// src/components/UpdateWorkShift.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave } from 'react-icons/fi';
import { getShiftList, updateShift } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './WorkShift.module.css';

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

const UpdateWorkShift = () => {
  const navigate = useNavigate();
  const params = useParams();
  const shiftId = params.shiftId || params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shiftData, setShiftData] = useState(null);

  const [formData, setFormData] = useState({
    shiftName: '',
    timeStart: '',
    timeEnd: '',
    workingHours: '',
    status: 1,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const shiftList = await getShiftList(0);
        const shift = shiftList.find((s) => s.id === Number(shiftId));

        if (!shift) {
          throw new Error(`Work shift not found with ID: ${shiftId}`);
        }

        setShiftData(shift);

        setFormData({
          shiftName: shift.shiftName || '',
          timeStart: formatTimeForInput(shift.timeStart) || '',
          timeEnd: formatTimeForInput(shift.timeEnd) || '',
          workingHours: shift.workingHours || '',
          status: shift.status === 'active' ? 1 : 2,
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load work shift data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (shiftId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No shift ID provided', status: 400 });
    }
  }, [shiftId]);

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

  const handleClose = () => navigate('/work-shift');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = getStoredClinicId();
      if (!clinicId) {
        throw new Error('Clinic ID not found in localStorage');
      }

      const workingHours = formData.workingHours 
        ? parseFloat(formData.workingHours) 
        : calculateWorkingHours(formData.timeStart, formData.timeEnd);

      await updateShift({
        ShiftID: Number(shiftId),
        ClinicID: clinicId,
        ShiftName: formData.shiftName.trim(),
        ShiftTimeStart: formatTimeFor24Hr(formData.timeStart),
        ShiftTimeEnd: formatTimeFor24Hr(formData.timeEnd),
        WorkingHours: workingHours,
        Status: Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/work-shift');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update work shift.');
    } finally {
      setFormLoading(false);
    }
  };

  if (error && error?.status >= 400) return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.clinicLoading}>Loading work shift data...</div>;

  if (error) {
    return (
      <div className={styles.clinicListWrapper}>
        <Header title="Update Work Shift" />
        <div className={styles.clinicError}>
          {error.message || 'No shift ID provided'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Update Work Shift" />

      <div className={styles.detailModalOverlay} onClick={handleClose}>
        <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

          <div className={styles.detailModalHeader}>
            <div className={styles.detailHeaderContent}>
              <h2>Update Work Shift</h2>
              <div className={styles.detailHeaderMeta}>
                <span className={styles.workIdBadge}>
                  {formData.shiftName || 'Shift'}
                </span>
                <span
                  className={`${styles.workIdBadge} ${
                    formData.status === 1 ? styles.activeBadge : styles.inactiveBadge
                  }`}
                >
                  {formData.status === 1 ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
            <button onClick={handleClose} className={styles.detailCloseBtn}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className={styles.addModalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
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

            <div className={styles.detailModalFooter}>
              <button type="button" onClick={handleClose} className={styles.btnCancel}>
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
    </div>
  );
};

export default UpdateWorkShift;