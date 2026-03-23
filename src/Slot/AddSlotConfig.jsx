// src/components/AddSlotConfig.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { addSlotConfig, getSlotConfigList } from '../Api/Api.js';
import styles from './AddSlotConfig.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';

const DURATION_OPTIONS = [
  { id: 1, label: 'Daily', createDays: 30 },
  { id: 2, label: 'Weekend', createDays: 2 },
  { id: 3, label: 'Specific Day', createDays: 1 },
];

// ── Validation messages match backend slotConfigValidator word-for-word ────────
const getLiveValidationMessage = (fieldName, value, formData = {}) => {
  switch (fieldName) {

    case 'doctorId':
      if (!value) return 'Doctor is required';
      if (isNaN(Number(value)) || Number(value) < 1) return 'DoctorID must be valid';
      return '';

    case 'shiftId':
      if (!value) return 'ShiftID is required';
      if (isNaN(Number(value)) || Number(value) < 1) return 'ShiftID must be valid';
      return '';

    case 'duration':
      if (!value) return 'Duration is required';
      if (![1, 2, 3].includes(Number(value))) return 'Duration must be 1=Daily, 2=Weekend, 3=Specific Date';
      return '';

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

    case 'slotInterval':
      if (value === '' || value === null || value === undefined) return 'SlotInterval is required';
      const num = Number(value);
      if (isNaN(num) || !Number.isInteger(num) || num < 5 || num > 120) return 'SlotInterval must be 5–120 minutes';
      return '';

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

// ── Required fields that must pass validation for the submit button to enable ──
const REQUIRED_FIELDS = ['doctorId', 'shiftId', 'duration', 'slotInterval'];

// ── Normalize a date string to YYYY-MM-DD for comparison ──────────────────────
const normalizeDate = (dateStr) => {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
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
  const [validationMessages, setValidationMessages] = useState({});

  // ── MessagePopup state ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Button cooldown ──
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const startCooldown = () => {
    setSubmitCooldown(true);
    setTimeout(() => setSubmitCooldown(false), 2000);
  };

  // ── Derive whether all required fields are filled (no validation errors) ──
  const isRequiredFilled = useMemo(() => {
    const baseOk = REQUIRED_FIELDS.every((field) => {
      const msg = getLiveValidationMessage(field, formData[field], formData);
      return !msg;
    });
    // Also require slotDate when duration === 3
    if (Number(formData.duration) === 3) {
      const slotDateMsg = getLiveValidationMessage('slotDate', formData.slotDate, formData);
      if (slotDateMsg) return false;
    }
    // createSlotDays must be valid
    const createDaysMsg = getLiveValidationMessage('createSlotDays', createSlotDays, formData);
    if (createDaysMsg) return false;
    return baseOk;
  }, [formData, createSlotDays]);

  const submitEnabled = !loading && !submitCooldown;

  useEffect(() => {
    if (isOpen) {
      setFormData({ doctorId: '', shiftId: '', duration: '', slotDate: '', slotInterval: 30 });
      setCreateSlotDays(0);
      setValidationMessages({});
      setPopup({ visible: false, message: '', type: 'success' });
      setSubmitCooldown(false);
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

    setFormData(prev => ({ ...prev, [name]: filteredValue }));

    const message = getLiveValidationMessage(name, filteredValue, { ...formData, [name]: filteredValue });
    setValidationMessages(prev => ({ ...prev, [name]: message }));
  };

  // ── Validate all fields; block submit if any errors exist ─────────────────
  const validateForm = () => {
    const errors = {};

    REQUIRED_FIELDS.forEach(field => {
      const msg = getLiveValidationMessage(field, formData[field], formData);
      if (msg) errors[field] = msg;
    });

    if (Number(formData.duration) === 3) {
      const msg = getLiveValidationMessage('slotDate', formData.slotDate, formData);
      if (msg) errors.slotDate = msg;
    }

    const createDaysMsg = getLiveValidationMessage('createSlotDays', createSlotDays, formData);
    if (createDaysMsg) errors.createSlotDays = createDaysMsg;

    setValidationMessages(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  // ── Duplicate check: only block if an ACTIVE matching record exists ────────
  const checkDuplicate = async (clinicId, branchId) => {
    try {
      const existing = await getSlotConfigList(clinicId, {
        BranchID:  Number(branchId),
        DoctorID:  Number(formData.doctorId),
        ShiftID:   0,
        Duration:  Number(formData.duration),
        Status:    -1,        // fetch ALL statuses
        Page:      1,
        PageSize:  100,
      });

      const duration = Number(formData.duration);
      const selectedDate = normalizeDate(formData.slotDate);

      for (const config of existing) {
        const sameDoctor   = config.doctorId  === Number(formData.doctorId);
        const sameShift    = config.shiftId   === Number(formData.shiftId);
        const sameDuration = config.duration  === duration;

        if (!sameDoctor || !sameShift || !sameDuration) continue;

        // For Specific Date (duration === 3), also compare the date
        if (duration === 3) {
          const existingDate = normalizeDate(config.slotDate || config.slotSpecificDate);
          if (existingDate !== selectedDate) continue;
        }

        // Only block if the existing matching record is ACTIVE
        // If it is inactive, allow the new record to be created
        if (config.status?.toLowerCase() === 'active') {
          return { isDuplicate: true };
        }
      }

      return { isDuplicate: false };
    } catch (err) {
      console.error('Duplicate check failed:', err);
      // If the check itself fails, let the backend enforce its own constraints
      return { isDuplicate: false };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Gate: required fields check
    if (!isRequiredFilled) {
      showPopup('Please fill all required fields before submitting.', 'warning');
      return;
    }

    if (submitCooldown) return;
    startCooldown();

    if (!validateForm()) {
      showPopup('Please correct the errors shown below.', 'error');
      return;
    }

    setLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      // ── Duplicate detection ──────────────────────────────────────────────
      const { isDuplicate } = await checkDuplicate(clinicId, branchId);

      if (isDuplicate) {
        showPopup(
          'A slot configuration with the same Doctor, Shift, and Duration already exists and is Active. Duplicate entries are not allowed.',
          'error'
        );
        setLoading(false);
        return;
      }
      // ────────────────────────────────────────────────────────────────────

      const payload = {
        clinicId:       Number(clinicId),
        branchId:       Number(branchId),
        doctorId:       Number(formData.doctorId),
        shiftId:        Number(formData.shiftId),
        duration:       Number(formData.duration),
        slotDate:       Number(formData.duration) === 3 ? formData.slotDate : '',
        slotInterval:   Number(formData.slotInterval),
        createSlotDays: createSlotDays,
      };

      const result = await addSlotConfig(payload);

      if (result.success) {
        showPopup('Slot configuration added successfully!', 'success');
        setTimeout(() => {
          closePopup();
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Add slot config error:', err);
      showPopup(err.message || 'Failed to add slot configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const showDatePicker = Number(formData.duration) === 3;

  return (
    <>
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <div className={styles.clinicModalOverlay}>
        <div className={styles.clinicModal}>
          <div className={styles.clinicModalHeader}>
            <h2>Add Slot Configuration</h2>
            <div className={styles.headerRight}>
              <div className={styles.clinicNameone}>
                <FaClinicMedical size={20} style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }} />
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

              <div className={styles.formGrid}>

                {/* Doctor Selection */}
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

                {/* Shift Selection */}
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

                {/* Duration Type */}
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

                {/* Slot Interval */}
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

                {/* Specific Date */}
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

                {/* CreateSlotDays — read-only */}
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
                disabled={!submitEnabled}
                title={!isRequiredFilled ? 'Please fill all required fields' : ''}
              >
                {loading ? 'Adding...' : 'Add Configuration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddSlotConfig;