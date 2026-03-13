// src/components/AddSlotConfig.jsx
import React, { useState, useEffect } from 'react';
import { addSlotConfig } from '../Api/Api.js';
import styles from './AddSlotConfig.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const DURATION_OPTIONS = [
  { id: 1, label: 'Daily', createDays: 30 },
  { id: 2, label: 'Weekend', createDays: 2 },
  { id: 3, label: 'Specific Day', createDays: 1 },
];

// ── Validation messages match backend slotConfigValidator word-for-word ────────
const getLiveValidationMessage = (fieldName, value, formData = {}) => {
  switch (fieldName) {

    // DoctorID — required, isInt min:1
    case 'doctorId':
      if (!value) return 'Doctor is required';
      if (isNaN(Number(value)) || Number(value) < 1) return 'DoctorID must be valid';
      return '';

    // ShiftID — required, isInt min:1
    case 'shiftId':
      if (!value) return 'ShiftID is required';
      if (isNaN(Number(value)) || Number(value) < 1) return 'ShiftID must be valid';
      return '';

    // Duration — required, isIn([1,2,3])
    case 'duration':
      if (!value) return 'Duration is required';
      if (![1, 2, 3].includes(Number(value))) return 'Duration must be 1=Daily, 2=Weekend, 3=Specific Date';
      return '';

    // SlotDate — required only when Duration === 3, isDate YYYY-MM-DD
    case 'slotDate':
      if (Number(formData.duration) === 3 && !value) {
        return 'SlotDate is required when Duration = 3 (Specific Date)';
      }
      if (value) {
        const selected = new Date(value);
        if (isNaN(selected.getTime())) return 'Invalid SlotDate format';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selected.setHours(0, 0, 0, 0);
        if (selected < today) return 'Invalid SlotDate format';
      }
      return '';

    // SlotInterval — required, isInt min:5 max:120
    case 'slotInterval':
      if (value === '' || value === null || value === undefined) return 'SlotInterval is required';
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num) || num < 5 || num > 120) return 'SlotInterval must be 5–120 minutes';
      return '';

    // CreateSlotDays — required, isInt min:1 max:365
    case 'createSlotDays':
      if (value === '' || value === null || value === undefined || value === 0) return 'CreateSlotDays is required';
      const days = Number(value);
      if (isNaN(days) || !Number.isInteger(days) || days < 1 || days > 365) return 'CreateSlotDays must be 1–365';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'slotInterval':
      return value.replace(/[^0-9]/g, '');
    case 'slotDate':
      return value;
    default:
      return value;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
const AddSlotConfig = ({ isOpen, onClose, doctors, shifts, doctorShifts, onSuccess }) => {
  const [formData, setFormData] = useState({
    doctorId: '',
    shiftId: '',
    duration: '',
    slotDate: '',
    slotInterval: 30,
  });

  const [createSlotDays, setCreateSlotDays] = useState(0);
  const [availableShifts, setAvailableShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationMessages, setValidationMessages] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        doctorId: '',
        shiftId: '',
        duration: '',
        slotDate: '',
        slotInterval: 30,
      });
      setCreateSlotDays(0);
      setError('');
      setSuccess('');
      setValidationMessages({});
    }
  }, [isOpen]);

  // Update createSlotDays based on duration
  useEffect(() => {
    const durationOption = DURATION_OPTIONS.find(d => d.id === Number(formData.duration));
    if (durationOption) {
      setCreateSlotDays(durationOption.createDays);
    } else {
      setCreateSlotDays(0);
    }
  }, [formData.duration]);

  // Update available shifts when doctor is selected
  useEffect(() => {
    if (formData.doctorId && doctorShifts && shifts) {
      const doctorShiftMappings = doctorShifts.filter(
        ds => ds.employeeId === Number(formData.doctorId)
      );

      const doctorShiftIds = doctorShiftMappings.map(ds => ds.shiftId);

      const filtered = shifts.filter(shift => doctorShiftIds.includes(shift.id));

      setAvailableShifts(filtered);

      if (formData.shiftId && !doctorShiftIds.includes(Number(formData.shiftId))) {
        setFormData(prev => ({ ...prev, shiftId: '' }));
      }
    } else {
      setAvailableShifts([]);
      if (formData.shiftId) {
        setFormData(prev => ({ ...prev, shiftId: '' }));
      }
    }
  }, [formData.doctorId, doctorShifts, shifts, formData.shiftId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);

    setFormData(prev => ({
      ...prev,
      [name]: filteredValue
    }));

    // Live validation
    const message = getLiveValidationMessage(name, filteredValue, { ...formData, [name]: filteredValue });
    setValidationMessages(prev => ({
      ...prev,
      [name]: message
    }));

    setError('');
    setSuccess('');
  };

  // ── Validate all fields; block submit if any errors exist ─────────────────
  const validateForm = () => {
    const errors = {};

    // All required fields from backend
    ['doctorId', 'shiftId', 'duration', 'slotInterval'].forEach(field => {
      const msg = getLiveValidationMessage(field, formData[field], formData);
      if (msg) errors[field] = msg;
    });

    // SlotDate only required when Duration === 3
    if (Number(formData.duration) === 3) {
      const msg = getLiveValidationMessage('slotDate', formData.slotDate, formData);
      if (msg) errors.slotDate = msg;
    }

    // CreateSlotDays — required in backend
    const createDaysMsg = getLiveValidationMessage('createSlotDays', createSlotDays, formData);
    if (createDaysMsg) errors.createSlotDays = createDaysMsg;

    setValidationMessages(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setError('Please correct the errors shown below');
      return;
    }

    setLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const payload = {
        clinicId: Number(clinicId),
        branchId: Number(branchId),
        doctorId: Number(formData.doctorId),
        shiftId: Number(formData.shiftId),
        duration: Number(formData.duration),
        slotDate: Number(formData.duration) === 3 ? formData.slotDate : '',
        slotInterval: Number(formData.slotInterval),
        createSlotDays: createSlotDays
      };

      const result = await addSlotConfig(payload);

      if (result.success) {
        setSuccess('Slot configuration added successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Add slot config error:', err);
      setError(err.message || 'Failed to add slot configuration');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const showDatePicker = Number(formData.duration) === 3;

  return (
    <div className={styles.clinicModalOverlay}>
      <div className={styles.clinicModal}>
        <div className={styles.clinicModalHeader}>
          <h2>Add Slot Configuration</h2>
           <div className={styles.headerRight}>
    <div className={styles.clinicNameone}>
      <FaClinicMedical size={20} style={{ verticalAlign: "middle", margin: "6px" }} />
      {localStorage.getItem("clinicName") || "—"}
    </div>

          <button
            onClick={onClose}
            className={styles.clinicModalClose}
            disabled={loading}
          >
            ×
          </button>
        </div>
        </div>  

        <form onSubmit={handleSubmit}>
          <div className={styles.clinicModalBody}>
            {error && <div className={styles.formError}>{error}</div>}
            {success && <div className={styles.formSuccess}>{success}</div>}

            <div className={styles.formGrid}>

              {/* Doctor Selection — required in backend */}
              <div className={styles.formGroup}>
                <label>
                  Doctor <span className={styles.required}>*</span>
                </label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.firstName} {doc.lastName} - {doc.employeeCode}
                    </option>
                  ))}
                </select>
                {validationMessages.doctorId && (
                  <span className={styles.validationMsg}>{validationMessages.doctorId}</span>
                )}
              </div>

              {/* Shift Selection — required in backend */}
              <div className={styles.formGroup}>
                <label>
                  Shift <span className={styles.required}>*</span>
                </label>
                <select
                  name="shiftId"
                  value={formData.shiftId}
                  onChange={handleChange}
                  required
                  disabled={loading || !formData.doctorId || availableShifts.length === 0}
                >
                  <option value="">
                    {!formData.doctorId
                      ? 'Select a doctor first'
                      : availableShifts.length === 0
                        ? 'No shifts assigned to this doctor'
                        : 'Select Shift'}
                  </option>
                  {availableShifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shiftName} ({shift.timeStart} - {shift.timeEnd})
                    </option>
                  ))}
                </select>
                {validationMessages.shiftId && (
                  <span className={styles.validationMsg}>{validationMessages.shiftId}</span>
                )}
              </div>

              {/* Duration Type — required in backend, isIn([1,2,3]) */}
              <div className={styles.formGroup}>
                <label>
                  Duration Type <span className={styles.required}>*</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select Duration</option>
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {validationMessages.duration && (
                  <span className={styles.validationMsg}>{validationMessages.duration}</span>
                )}
              </div>

              {/* Slot Interval — required in backend, isInt min:5 max:120 */}
              <div className={styles.formGroup}>
                <label>
                  Slot Interval (minutes) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="slotInterval"
                  value={formData.slotInterval}
                  onChange={handleChange}
                  min="5"
                  max="120"
                  step="5"
                  required
                  disabled={loading}
                  placeholder="e.g., 15"
                />
                {validationMessages.slotInterval && (
                  <span className={styles.validationMsg}>{validationMessages.slotInterval}</span>
                )}
              </div>

              {/* Specific Date — required only when Duration === 3 */}
              {showDatePicker && (
                <div className={styles.formGroup}>
                  <label>
                    Specific Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    name="slotDate"
                    value={formData.slotDate}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {validationMessages.slotDate && (
                    <span className={styles.validationMsg}>{validationMessages.slotDate}</span>
                  )}
                </div>
              )}

              {/* CreateSlotDays — required in backend, auto-calculated, read-only */}
              <div className={styles.formGroup}>
                <label>Create Slots For (Days)</label>
                <input
                  type="number"
                  value={createSlotDays}
                  disabled
                  readOnly
                  className={styles.readonlyInput}
                />
                {validationMessages.createSlotDays && (
                  <span className={styles.validationMsg}>{validationMessages.createSlotDays}</span>
                )}
              </div>

            </div>

            {/* Summary box */}
            <div className={styles.configInfoBox}>
              <h4>Configuration Summary</h4>
              <p>
                <strong>Duration Type:</strong>{' '}
                {formData.duration
                  ? DURATION_OPTIONS.find(d => d.id === Number(formData.duration))?.label
                  : 'Not selected'}
              </p>
              <p>
                <strong>Slots will be created for:</strong> {createSlotDays || 0} days
              </p>
              {showDatePicker && formData.slotDate && (
                <p>
                  <strong>Specific Date:</strong> {formData.slotDate}
                </p>
              )}
            </div>
          </div>

          <div className={styles.clinicModalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSlotConfig;