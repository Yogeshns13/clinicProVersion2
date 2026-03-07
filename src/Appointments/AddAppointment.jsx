// src/components/AddAppointment.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiCalendar, FiClock, FiUser, FiSearch, FiChevronDown, FiCheckCircle } from 'react-icons/fi';
import { addAppointment, getPatientsList, getEmployeeList, getSlotList } from '../Api/Api.js';
import styles from './AddAppointment.module.css';

const SearchableDropdown = ({
  label,
  required,
  placeholder,
  items,
  selectedId,
  onSelect,
  getItemLabel,
  getItemSubLabel,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedItem = items.find(i => String(i.id) === String(selectedId));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = items.filter(item => {
    const lbl = getItemLabel(item).toLowerCase();
    const sub = getItemSubLabel ? getItemSubLabel(item).toLowerCase() : '';
    const q = query.toLowerCase();
    return lbl.includes(q) || sub.includes(q);
  });

  const handleSelect = (item) => {
    onSelect(item);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect(null);
    setQuery('');
    setOpen(false);
  };

  const handleOpen = () => {
    if (!disabled) setOpen(true);
  };

  return (
    <div className={styles.formGroup} ref={wrapperRef}>
      {label && (
        <label className={styles.formLabel}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.searchableWrapper}>
        <div
          className={`${styles.searchableInput} ${open ? styles.searchableInputOpen : ''} ${disabled ? styles.searchableInputDisabled : ''}`}
          onClick={handleOpen}
        >
          <FiSearch className={styles.searchIcon} size={15} />

          {open ? (
            <input
              autoFocus
              className={styles.searchableInnerInput}
              placeholder={selectedItem ? getItemLabel(selectedItem) : placeholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className={selectedItem ? styles.searchableSelected : styles.searchablePlaceholder}>
              {selectedItem ? getItemLabel(selectedItem) : placeholder}
            </span>
          )}

          <div className={styles.searchableActions}>
            {selectedItem && !open && (
              <button type="button" className={styles.clearBtn} onClick={handleClear}>
                <FiX size={13} />
              </button>
            )}
            <FiChevronDown
              size={15}
              className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
            />
          </div>
        </div>

        {open && (
          <div className={styles.searchableDropdown}>
            {filtered.length === 0 ? (
              <div className={styles.searchableNoResults}>No results found</div>
            ) : (
              filtered.map(item => (
                <div
                  key={item.id}
                  className={`${styles.searchableOption} ${String(item.id) === String(selectedId) ? styles.searchableOptionSelected : ''}`}
                  onMouseDown={() => handleSelect(item)}
                >
                  <div className={styles.optionAvatar}>
                    {getItemLabel(item).charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionLabel}>{getItemLabel(item)}</span>
                    {getItemSubLabel && (
                      <span className={styles.optionSub}>{getItemSubLabel(item)}</span>
                    )}
                  </div>
                  {String(item.id) === String(selectedId) && (
                    <FiCheckCircle className={styles.optionCheck} size={15} />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};


/* ─────────────────────────────────────────────── */
/* Validation                                       */
/* ─────────────────────────────────────────────── */
const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'patientId':
      if (!value || value === '' || value === '0') return 'Please select a patient';
      return '';
    case 'doctorId':
      if (!value || value === '' || value === '0') return 'Please select a doctor';
      return '';
    case 'selectedDate':
      if (!value) return 'Please select an appointment date';
      const selected = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      if (selected < today) return 'Past dates are not allowed';
      return '';
    case 'slotId':
      if (!value || value === '' || value === '0') return 'Please select a time slot';
      return '';
    case 'reason':
      if (value && value.length > 500) return 'Reason must not exceed 500 characters';
      return '';
    default:
      return '';
  }
};

const getTodayDate = () => new Date().toISOString().split('T')[0];


/* ─────────────────────────────────────────────── */
/* Main Component                                   */
/* ─────────────────────────────────────────────── */
const AddAppointment = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    slotId: '',
    reason: '',
  });

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  /* fetch on open */
  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchPatients();
      fetchDoctors();
    }
  }, [isOpen]);

  /* fetch slots when doctor + date change */
  useEffect(() => {
    if (formData.doctorId && selectedDate) {
      fetchAvailableSlots(formData.doctorId, selectedDate);
    } else {
      setAvailableSlots([]);
      setFormData(prev => ({ ...prev, slotId: '' }));
    }
  }, [formData.doctorId, selectedDate]);

  const fetchPatients = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const data = await getPatientsList(clinicId, { BranchID: branchId, Status: 1, PageSize: 100 });
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const data = await getEmployeeList(clinicId, { BranchID: branchId, Designation: 1, Status: 1, PageSize: 100 });
      setDoctors(data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    setLoadingSlots(true);
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const data = await getSlotList(clinicId, {
        BranchID: branchId,
        DoctorID: doctorId,
        SlotDate: date,
        IsBooked: 0,
        Status: 1,
        PageSize: 100,
      });
      setAvailableSlots(data.sort((a, b) => a.slotTime.localeCompare(b.slotTime)));
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  /* handlers */
  const handlePatientSelect = (patient) => {
    const id = patient ? String(patient.id) : '';
    setFormData(prev => ({ ...prev, patientId: id }));
    setValidationMessages(prev => ({ ...prev, patientId: getLiveValidationMessage('patientId', id) }));
    setError(null);
  };

  const handleDoctorSelect = (doctor) => {
    const id = doctor ? String(doctor.id) : '';
    setFormData(prev => ({ ...prev, doctorId: id, slotId: '' }));
    setValidationMessages(prev => ({
      ...prev,
      doctorId: getLiveValidationMessage('doctorId', id),
      slotId: '',
    }));
    setError(null);
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setSelectedDate(dateValue);
    setFormData(prev => ({ ...prev, slotId: '' }));
    setValidationMessages(prev => ({
      ...prev,
      selectedDate: getLiveValidationMessage('selectedDate', dateValue),
      slotId: '',
    }));
    setError(null);
  };

  const handleSlotSelect = (slotId) => {
    const id = slotId.toString();
    setFormData(prev => ({ ...prev, slotId: id }));
    setValidationMessages(prev => ({ ...prev, slotId: getLiveValidationMessage('slotId', id) }));
  };

  const handleReasonChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, reason: value }));
    setValidationMessages(prev => ({ ...prev, reason: getLiveValidationMessage('reason', value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');
      await addAppointment({
        clinicId: parseInt(clinicId),
        branchId: parseInt(branchId),
        patientId: parseInt(formData.patientId),
        doctorId: parseInt(formData.doctorId),
        slotId: parseInt(formData.slotId),
        reason: formData.reason.trim(),
      });
      setSuccess('Appointment booked successfully!');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ patientId: '', doctorId: '', slotId: '', reason: '' });
    setSelectedDate(getTodayDate());
    setAvailableSlots([]);
    setValidationMessages({});
  };

  const handleClose = () => {
    resetForm();
    setError(null);
    setSuccess(null);
    onClose();
  };

  const formatSlotTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.substring(0, 5).split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatSlotDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const selectedSlot = availableSlots.find(s => s.id === parseInt(formData.slotId));
  const selectedPatient = patients.find(p => String(p.id) === String(formData.patientId));
  const selectedDoctor = doctors.find(d => String(d.id) === String(formData.doctorId));

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <FiCalendar className={styles.headerIcon} size={24} />
            <h2>Book New Appointment</h2>
          </div>
          <button onClick={handleClose} className={styles.closeBtn} disabled={loading}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>

            {/* Alerts */}
            {error && <div className={styles.alertError}>{error}</div>}
            {success && <div className={styles.alertSuccess}>{success}</div>}

            {/* ── Patient Information ── */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FiUser size={18} />
                Patient Information
              </h3>

              <SearchableDropdown
                label="Select Patient"
                required
                placeholder="Search by name, file no or mobile..."
                items={patients}
                selectedId={formData.patientId}
                onSelect={handlePatientSelect}
                getItemLabel={p => `${p.firstName} ${p.lastName}`}
                getItemSubLabel={p => `${p.fileNo || ''}${p.mobile ? ` · ${p.mobile}` : ''}`}
              />
              {validationMessages.patientId && (
                <span className={styles.validationMsg}>{validationMessages.patientId}</span>
              )}

              {/* Selected patient card */}
              {selectedPatient && (
                <div className={styles.infoCard}>
                  <div className={styles.infoCardGrid}>
                    <div className={styles.infoCardItem}>
                      <span className={styles.infoCardKey}>FILE NO</span>
                      <span className={styles.infoCardValue}>{selectedPatient.fileNo}</span>
                    </div>
                    <div className={styles.infoCardItem}>
                      <span className={styles.infoCardKey}>MOBILE</span>
                      <span className={styles.infoCardValue}>{selectedPatient.mobile}</span>
                    </div>
                    <div className={styles.infoCardItem}>
                      <span className={styles.infoCardKey}>AGE</span>
                      <span className={styles.infoCardValue}>{selectedPatient.age || '—'}</span>
                    </div>
                    <div className={styles.infoCardItem}>
                      <span className={styles.infoCardKey}>BLOOD GROUP</span>
                      <span className={styles.infoCardValue}>{selectedPatient.bloodGroupDesc || '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Appointment Details ── */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FiClock size={18} />
                Appointment Details
              </h3>

              <div className={styles.formRow}>
                {/* Doctor */}
                <div>
                  <SearchableDropdown
                    label="Select Doctor"
                    required
                    placeholder="Search by name or code..."
                    items={doctors}
                    selectedId={formData.doctorId}
                    onSelect={handleDoctorSelect}
                    getItemLabel={d => d.name || `${d.firstName} ${d.lastName}`}
                    getItemSubLabel={d => d.employeeCode || ''}
                  />
                  {validationMessages.doctorId && (
                    <span className={styles.validationMsg}>{validationMessages.doctorId}</span>
                  )}
                </div>

                {/* Date */}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Appointment Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={getTodayDate()}
                    required
                    className={styles.formInput}
                  />
                  {validationMessages.selectedDate && (
                    <span className={styles.validationMsg}>{validationMessages.selectedDate}</span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Available Slots ── */}
            {formData.doctorId && selectedDate && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <FiCalendar size={18} />
                  Available Time Slots
                  {selectedDate && (
                    <span className={styles.sectionTitleSub}>({formatSlotDate(selectedDate)})</span>
                  )}
                </h3>

                {loadingSlots ? (
                  <div className={styles.slotsLoading}>
                    <div className={styles.spinner} />
                    <p>Loading available slots...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className={styles.noSlots}>
                    <p>No available slots for this doctor on {formatSlotDate(selectedDate)}.</p>
                    <p>Please try a different date or doctor.</p>
                  </div>
                ) : (
                  <div className={styles.slotsGrid}>
                    {availableSlots.map(slot => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleSlotSelect(slot.id)}
                        className={`${styles.slotBtn} ${formData.slotId === slot.id.toString() ? styles.slotBtnSelected : ''}`}
                      >
                        {formatSlotTime(slot.slotTime)}
                      </button>
                    ))}
                  </div>
                )}

                {validationMessages.slotId && !formData.slotId && (
                  <span className={styles.validationMsg}>{validationMessages.slotId}</span>
                )}

                {formData.slotId && selectedSlot && (
                  <div className={styles.slotSelectedBadge}>
                    <FiCheckCircle size={16} />
                    Selected: {formatSlotDate(selectedSlot.slotDate)} at {formatSlotTime(selectedSlot.slotTime)}
                  </div>
                )}
              </div>
            )}

            {/* ── Reason ── */}
            <div className={styles.section}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reason for Visit</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleReasonChange}
                  rows="3"
                  placeholder="Brief description of the reason for visit (optional)"
                  className={styles.formTextarea}
                />
                {validationMessages.reason && (
                  <span className={styles.validationMsg}>{validationMessages.reason}</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button type="button" onClick={handleClose} className={styles.btnCancel} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={loading || !formData.slotId}
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppointment;