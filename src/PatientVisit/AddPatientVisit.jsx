// src/components/AddPatientVisit.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiUser, FiCalendar, FiActivity, FiCheckCircle, FiSearch, FiChevronDown } from 'react-icons/fi';
import { addPatientVisit, getPatientsList, getEmployeeList, getAppointmentList } from '../Api/Api.js';
import styles from './AddPatientVisit.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import TimePicker from '../Hooks/TimePicker.jsx';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'PatientID':
      if (!value) return 'Please select a patient';
      return '';

    case 'DoctorID':
      if (!value) return 'Please select a doctor';
      return '';

    case 'VisitDate':
      if (!value) return 'Visit date is required';
      const visitDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      visitDate.setHours(0, 0, 0, 0);
      if (visitDate < today) return 'Visit date cannot be in the past';
      return '';

    case 'VisitTime':
      if (!value) return 'Visit time is required';
      return '';

    case 'reason':
      if (value && value.length > 200) return 'Reason must not exceed 200 characters';
      return '';

    case 'symptoms':
      if (value && value.length > 500) return 'Symptoms must not exceed 500 characters';
      return '';

    case 'bpSystolic':
      if (value === '' || value === null || value === undefined) return '';
      const systolic = Number(value);
      if (isNaN(systolic)) return 'Must be a valid number';
      if (systolic < 0) return 'Cannot be negative';
      if (systolic > 0 && systolic < 50) return 'The number should be 50-250 mmHg';
      if (systolic > 250) return 'The number should be 50-250 mmHg';
      return '';

    case 'bpDiastolic':
      if (value === '' || value === null || value === undefined) return '';
      const diastolic = Number(value);
      if (isNaN(diastolic)) return 'Must be a valid number';
      if (diastolic < 0) return 'Cannot be negative';
      if (diastolic > 0 && diastolic < 30) return 'The number should be 30-150 mmHg';
      if (diastolic > 150) return 'The number should be 30-150 mmHg';
      return '';

    case 'temperature':
      if (value === '' || value === null || value === undefined) return '';
      const temp = Number(value);
      if (isNaN(temp)) return 'Must be a valid number';
      if (temp < 0) return 'Cannot be negative';
      if (temp > 0 && temp < 90) return 'The number should be 90-110°F';
      if (temp > 110) return 'The number should be 90-110°F';
      return '';

    case 'weight':
      if (value === '' || value === null || value === undefined) return '';
      const weight = Number(value);
      if (isNaN(weight)) return 'Must be a valid number';
      if (weight < 0) return 'Cannot be negative';
      if (weight > 0 && weight < 1) return 'The number should be 1-500 kg';
      if (weight > 500) return 'The number should be 1-500 kg';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'bpSystolic':
    case 'bpDiastolic':
      return value.replace(/[^0-9]/g, '');
    case 'temperature':
    case 'weight':
      if (value === '') return value;
      const filtered = value.replace(/[^0-9.]/g, '');
      const parts = filtered.split('.');
      if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
      }
      return filtered;
    default:
      return value;
  }
};

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

const SearchableDropdown = ({ label, required, placeholder, items, selectedId, onSelect, getItemLabel, getItemSubLabel, validationMsg }) => {
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

  return (
    <div className={styles.formGroup} ref={wrapperRef}>
      <label className={styles.formLabel}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>

      <div className={styles.searchableWrapper}>
        <div
          className={`${styles.searchableInput} ${open ? styles.searchableInputOpen : ''}`}
          onClick={() => setOpen(true)}
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

      {validationMsg && (
        <span className={styles.validationMsg}>{validationMsg}</span>
      )}
    </div>
  );
};

const AddPatientVisit = ({ isOpen, onClose, onSuccess, preSelectedAppointmentId = null }) => {
  const [visitMode, setVisitMode] = useState('without');

  const [formData, setFormData] = useState({
    appointmentId: 0,
    PatientID:    '',
    DoctorID:     '',
    VisitDate:    new Date().toISOString().split('T')[0],
    VisitTime:    new Date().toTimeString().split(' ')[0].substring(0, 5),
    reason:       '',
    symptoms:     '',
    bpSystolic:   '',
    bpDiastolic:  '',
    temperature:  '',
    weight:       '',
  });

  const [patients,            setPatients]            = useState([]);
  const [doctors,             setDoctors]             = useState([]);
  const [appointments,        setAppointments]        = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [loading,             setLoading]             = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [validationMessages,  setValidationMessages]  = useState({});

  // ── MessagePopup ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Submit attempted flag ──
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ── Button cooldowns ──
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const startCooldown = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // ── Form completeness ──
  // Required: PatientID + DoctorID (when not pre-selected), VisitDate, VisitTime
  const isFormComplete = (() => {
    if (!formData.VisitDate || !formData.VisitTime) return false;
    if (preSelectedAppointmentId) return true; // patient+doctor come from appointment
    if (visitMode === 'with' && selectedAppointment) return true;
    return !!formData.PatientID && !!formData.DoctorID;
  })();

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year  = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day   = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (preSelectedAppointmentId) {
        fetchSingleAppointment(preSelectedAppointmentId);
      } else {
        setVisitMode('without');
        fetchPatients();
        fetchDoctors();
      }
    }
  }, [isOpen, preSelectedAppointmentId]);

  const fetchSingleAppointment = async (appointmentId) => {
    try {
      setLoadingAppointments(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const data = await getAppointmentList(clinicId, {
        BranchID:      branchId,
        AppointmentID: appointmentId,
        PageSize:      1,
      });
      if (data && data.length > 0) {
        const appointment = data[0];
        setSelectedAppointment(appointment);
        setVisitMode('with');
        setFormData({
          appointmentId: appointment.id,
          PatientID:     appointment.patientId,
          DoctorID:      appointment.doctorId,
          VisitDate:     formatDateForInput(appointment.appointmentDate),
          VisitTime:     appointment.appointmentTime.substring(0, 5),
          reason:        appointment.reason || '',
          symptoms:      '',
          bpSystolic:    '',
          bpDiastolic:   '',
          temperature:   '',
          weight:        '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch appointment:', err);
      showPopup('Failed to load appointment details.', 'error');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const data = await getPatientsList(clinicId, { BranchID: branchId, Status: 1, PageSize: 100 });
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      showPopup('Failed to load patients.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const data = await getEmployeeList(clinicId, {
        BranchID:    branchId,
        Designation: 1,
        Status:      1,
        PageSize:    100,
      });
      setDoctors(data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      showPopup('Failed to load doctors.', 'error');
    }
  };

  const handleModeChange = (mode) => {
    setVisitMode(mode);
    setSelectedAppointment(null);
    setValidationMessages({});
    setSubmitAttempted(false);
    setFormData({
      appointmentId: 0,
      PatientID:     '',
      DoctorID:      '',
      VisitDate:     new Date().toISOString().split('T')[0],
      VisitTime:     new Date().toTimeString().split(' ')[0].substring(0, 5),
      reason:        '',
      symptoms:      '',
      bpSystolic:    '',
      bpDiastolic:   '',
      temperature:   '',
      weight:        '',
    });
  };

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      appointmentId: appointment.id,
      PatientID:     appointment.patientId,
      DoctorID:      appointment.doctorId,
      VisitDate:     formatDateForInput(appointment.appointmentDate),
      VisitTime:     appointment.appointmentTime.substring(0, 5),
      reason:        appointment.reason || '',
      symptoms:      '',
      bpSystolic:    '',
      bpDiastolic:   '',
      temperature:   '',
      weight:        '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    setFormData(prev => ({ ...prev, [name]: filteredValue }));
    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages(prev => ({ ...prev, [name]: validationMessage }));
  };

  const handlePatientSelect = (patient) => {
    const id = patient ? patient.id : '';
    setFormData(prev => ({ ...prev, PatientID: id }));
    setValidationMessages(prev => ({ ...prev, PatientID: getLiveValidationMessage('PatientID', id) }));
  };

  const handleDoctorSelect = (doctor) => {
    const id = doctor ? doctor.id : '';
    setFormData(prev => ({ ...prev, DoctorID: id }));
    setValidationMessages(prev => ({ ...prev, DoctorID: getLiveValidationMessage('DoctorID', id) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!isFormComplete) {
      showPopup('Please fill all required fields before submitting.', 'error');
      return;
    }

    // Validate all required fields
    const newMessages = {};
    let hasError = false;

    if (visitMode !== 'with' || !preSelectedAppointmentId) {
      if (!formData.PatientID) {
        newMessages.PatientID = getLiveValidationMessage('PatientID', formData.PatientID);
        hasError = true;
      }
      if (!formData.DoctorID) {
        newMessages.DoctorID = getLiveValidationMessage('DoctorID', formData.DoctorID);
        hasError = true;
      }
    }

    const visitDateMsg = getLiveValidationMessage('VisitDate', formData.VisitDate);
    if (visitDateMsg) { newMessages.VisitDate = visitDateMsg; hasError = true; }

    const visitTimeMsg = getLiveValidationMessage('VisitTime', formData.VisitTime);
    if (visitTimeMsg) { newMessages.VisitTime = visitTimeMsg; hasError = true; }

    if (hasError) {
      setValidationMessages(prev => ({ ...prev, ...newMessages }));
      return;
    }

    if (submitCooldown) return;
    startCooldown(setSubmitCooldown);

    setLoading(true);
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const formattedDate = formatDateForInput(formData.VisitDate);
      const visitData = {
        ...formData,
        VisitDate:   formattedDate,
        clinicId:    parseInt(clinicId),
        branchId:    parseInt(branchId),
        bpSystolic:  formData.bpSystolic  ? parseInt(formData.bpSystolic)   : 0,
        bpDiastolic: formData.bpDiastolic ? parseInt(formData.bpDiastolic)  : 0,
        temperature: formData.temperature ? parseFloat(formData.temperature): 0,
        weight:      formData.weight      ? parseFloat(formData.weight)     : 0,
      };
      await addPatientVisit(visitData);
      showPopup('Patient visit booked successfully!', 'success');
      setTimeout(() => {
        setFormData({
          appointmentId: 0,
          PatientID:     '',
          DoctorID:      '',
          VisitDate:     new Date().toISOString().split('T')[0],
          VisitTime:     new Date().toTimeString().split(' ')[0].substring(0, 5),
          reason:        '',
          symptoms:      '',
          bpSystolic:    '',
          bpDiastolic:   '',
          temperature:   '',
          weight:        '',
        });
        setVisitMode('without');
        setSelectedAppointment(null);
        setValidationMessages({});
        setSubmitAttempted(false);
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to add visit:', err);
      showPopup(err.message || 'Failed to add patient visit.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (!isOpen) return null;

  return (
    <div className={styles.addVisitOverlay}>
      <div className={styles.addVisitModal}>

        {/* ── MessagePopup ── */}
        <MessagePopup
          visible={popup.visible}
          message={popup.message}
          type={popup.type}
          onClose={closePopup}
        />

        <div className={styles.addVisitHeader}>
          <div className={styles.addVisitHeaderContent}>
            <FiActivity className={styles.addVisitHeaderIcon} size={20} />
            <h2>
              {preSelectedAppointmentId ? 'Complete Visit from Appointment' : 'Add New Patient Visit'}
            </h2>
          </div>
          <div className={styles.clinicNameone}>
            <FaClinicMedical size={20} style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }} />
            {localStorage.getItem("clinicName") || "—"}
          </div>
          <button onClick={onClose} className={styles.addVisitClose}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.addVisitForm}>
          <div className={styles.addVisitBody}>

            {loadingAppointments && (
              <div className={styles.appointmentsLoading}>
                <div className={styles.spinner}></div>
                <p>Loading appointment details...</p>
              </div>
            )}

            {visitMode === 'with' && !preSelectedAppointmentId && !loadingAppointments && (
              <div className={styles.appointmentsSection}>
                <h3 className={styles.sectionTitle}>
                  <FiCalendar size={18} />
                  Today's Appointments
                </h3>
                {appointments.length === 0 ? (
                  <div className={styles.noAppointments}>
                    <p>No scheduled appointments found for today.</p>
                  </div>
                ) : (
                  <div className={styles.appointmentsList}>
                    {appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className={`${styles.appointmentCard} ${selectedAppointment?.id === appt.id ? styles.selected : ''}`}
                        onClick={() => handleAppointmentSelect(appt)}
                      >
                        <div className={styles.appointmentHeader}>
                          <div className={styles.appointmentPatient}>
                            <div className={styles.patientAvatar}>
                              {appt.patientName?.charAt(0).toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className={styles.patientName}>{appt.patientName}</div>
                              <div className={styles.patientInfo}>{appt.patientMobile}</div>
                            </div>
                          </div>
                          {selectedAppointment?.id === appt.id && (
                            <FiCheckCircle className={styles.selectedIcon} size={24} />
                          )}
                        </div>
                        <div className={styles.appointmentDetails}>
                          <div className={styles.appointmentDetail}>
                            <strong>Doctor:</strong> {appt.doctorFullName}
                          </div>
                          <div className={styles.appointmentDetail}>
                            <strong>Time:</strong> {formatTime(appt.appointmentTime)}
                          </div>
                          {appt.reason && (
                            <div className={styles.appointmentDetail}>
                              <strong>Reason:</strong> {appt.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {preSelectedAppointmentId && selectedAppointment && !loadingAppointments && (
              <div className={styles.selectedAppointmentSummary}>
                <div className={styles.summaryHeader}>
                  <FiCalendar size={20} />
                  <span>Appointment Details</span>
                </div>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Patient:</span>
                    <span className={styles.summaryValue}>{selectedAppointment.patientName}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Mobile:</span>
                    <span className={styles.summaryValue}>{selectedAppointment.patientMobile}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Doctor:</span>
                    <span className={styles.summaryValue}>{selectedAppointment.doctorFullName}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Scheduled Time:</span>
                    <span className={styles.summaryValue}>{formatTime(selectedAppointment.appointmentTime)}</span>
                  </div>
                  {selectedAppointment.reason && (
                    <div className={styles.summaryRow}>
                      <span className={styles.summaryLabel}>Reason:</span>
                      <span className={styles.summaryValue}>{selectedAppointment.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!preSelectedAppointmentId && !loadingAppointments && (
              <div className={styles.formRow}>
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <FiUser size={18} />
                    Patient Information
                  </h3>
                  <SearchableDropdown
                    label="Patient"
                    required
                    placeholder="Search by name or file no..."
                    items={patients}
                    selectedId={formData.PatientID}
                    onSelect={handlePatientSelect}
                    getItemLabel={p => `${p.firstName} ${p.lastName}`}
                    getItemSubLabel={p => p.fileNo || ''}
                    validationMsg={validationMessages.PatientID}
                  />
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <FiUser size={18} />
                    Doctor Information
                  </h3>
                  <SearchableDropdown
                    label="Doctor"
                    required
                    placeholder="Search by name or code..."
                    items={doctors}
                    selectedId={formData.DoctorID}
                    onSelect={handleDoctorSelect}
                    getItemLabel={d => `${d.firstName} ${d.lastName}`}
                    getItemSubLabel={d => d.employeeCode || ''}
                    validationMsg={validationMessages.DoctorID}
                  />
                </div>
              </div>
            )}

            {!loadingAppointments && (
              <>
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <FiCalendar size={18} />
                    Visit Details
                  </h3>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Visit Date <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="date"
                        name="VisitDate"
                        value={formData.VisitDate}
                        onChange={handleChange}
                        min={getTodayDate()}
                        required
                        className={styles.formInput}
                      />
                      {validationMessages.VisitDate && (
                        <span className={styles.validationMsg}>{validationMessages.VisitDate}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Visit Time <span className={styles.required}>*</span>
                      </label>
                      <TimePicker
                        name="VisitTime"
                        value={formData.VisitTime}
                        onChange={handleChange}
                      />
                      {validationMessages.VisitTime && (
                        <span className={styles.validationMsg}>{validationMessages.VisitTime}</span>
                      )}
                    </div>
                  </div>

                  <div className={`${styles.formRow} ${styles.reasonSymptomsRow}`}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Reason for Visit <span className={styles.required}>*</span></label>
                      <textarea
                        required
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="e.g., Regular checkup, Follow-up..."
                        className={`${styles.formTextarea} ${styles.tallTextarea}`}
                        maxLength="200"
                        rows={5}
                      />
                      {validationMessages.reason && (
                        <span className={styles.validationMsg}>{validationMessages.reason}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Symptoms</label>
                      <textarea
                        name="symptoms"
                        value={formData.symptoms}
                        onChange={handleChange}
                        placeholder="Describe patient symptoms..."
                        className={`${styles.formTextarea} ${styles.tallTextarea}`}
                        maxLength="500"
                        rows={5}
                      />
                      {validationMessages.symptoms && (
                        <span className={styles.validationMsg}>{validationMessages.symptoms}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <FiActivity size={18} />
                    Vital Signs
                  </h3>

                  <div className={`${styles.formRow} ${styles.vitalsRow}`}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Systolic BP (mmHg)</label>
                      <input
                        type="text"
                        name="bpSystolic"
                        value={formData.bpSystolic}
                        onChange={handleChange}
                        placeholder="120"
                        className={styles.formInput}
                      />
                      {validationMessages.bpSystolic && (
                        <span className={styles.validationMsg}>{validationMessages.bpSystolic}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Diastolic BP (mmHg)</label>
                      <input
                        type="text"
                        name="bpDiastolic"
                        value={formData.bpDiastolic}
                        onChange={handleChange}
                        placeholder="80"
                        className={styles.formInput}
                      />
                      {validationMessages.bpDiastolic && (
                        <span className={styles.validationMsg}>{validationMessages.bpDiastolic}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Temperature (°F)</label>
                      <input
                        type="text"
                        name="temperature"
                        value={formData.temperature}
                        onChange={handleChange}
                        placeholder="98.6"
                        className={styles.formInput}
                      />
                      {validationMessages.temperature && (
                        <span className={styles.validationMsg}>{validationMessages.temperature}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Weight (kg)</label>
                      <input
                        type="text"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="70"
                        className={styles.formInput}
                      />
                      {validationMessages.weight && (
                        <span className={styles.validationMsg}>{validationMessages.weight}</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Incomplete hint */}
            {submitAttempted && !isFormComplete && (
              <div className={styles.formIncompleteHint}>
                Please fill all required fields to enable submission.
              </div>
            )}

          </div>

          <div className={styles.addVisitFooter}>
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
              disabled={loading || loadingAppointments || submitCooldown}
              title={!isFormComplete ? 'Please fill all required fields' : ''}
            >
              {loading ? 'Booking Visit...' : 'Book Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientVisit;