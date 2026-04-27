// src/components/AddAppointment.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiCalendar, FiClock, FiUser, FiSearch, FiChevronDown, FiCheckCircle, FiUserPlus, FiUsers } from 'react-icons/fi';
import { addAppointment, getPatientsList, getEmployeeList, getSlotList } from '../Api/Api.js';
import styles from './AddAppointment.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import AddPatient from '../Patients/AddPatient.jsx';


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
/* Patient Searchable Dropdown with tabs + button   */
/* ─────────────────────────────────────────────── */
const SEARCH_TYPES = [
  { key: 'Name',   label: 'Name' },
  { key: 'Mobile', label: 'Mobile' },
  { key: 'FileNo', label: 'File No' },
];

const PatientSearchDropdown = ({
  label,
  required,
  patients,
  selectedId,
  onSelect,
  onSearch,
  onInitialLoad,
  loadingPatients,
  setPatients
}) => {
  const [searchType, setSearchType] = useState('Name');
  const [searchValue, setSearchValue] = useState('');
  const [open, setOpen] = useState(false);
  const initialLoadedRef = useRef(false);
  const wrapperRef = useRef(null);

  // ── Family search state ──
  const [familyLoadingId, setFamilyLoadingId] = useState(null);
  const [familyResults, setFamilyResults] = useState([]);
  const [familyPopupOpen, setFamilyPopupOpen] = useState(false);
  const [localPopup, setLocalPopup] = useState({ visible: false, message: '', type: 'error' });

  const selectedPatientItem = patients.find(p => String(p.id) === String(selectedId));

  const placeholderMap = {
    Name:   'Enter name...',
    Mobile: 'Enter mobile...',
    FileNo: 'Enter file no...',
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset the initial-load flag whenever patients is cleared (form reset on modal close)
  useEffect(() => {
    if (patients.length === 0) {
      initialLoadedRef.current = false;
    }
  }, [patients]);

  // Auto-open dropdown when results arrive
  useEffect(() => {
    if (patients.length > 0) {
      setOpen(true);
    }
  }, [patients]);

  const handleTypeChange = (key) => {
    setSearchType(key);
    setSearchValue('');
  };

  const handleSearch = () => {
    if (!searchValue.trim()) return;
    onSearch(searchType, searchValue.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelect = (patient) => {
    onSelect(patient);
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect(null);
    setOpen(false);
  };

  const handleTriggerClick = () => {
    if (patients.length > 0) setOpen(prev => !prev);
  };

  // ── Family Search handler ──
  const handleFamilySearch = async (e, patient) => {
    e.stopPropagation();
    setFamilyLoadingId(patient.id);
    setOpen(false);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const basePayload = { BranchID: branchId, Status: 1, PageSize: 100 };

      // Always search using this patient's own ID as FamilyPatientID
      const promises = [
        getPatientsList(clinicId, { ...basePayload, FamilyPatientID: patient.id }),
      ];

      // If the patient itself belongs to a family (has familyPatientId set),
      // also search using that family head ID, and fetch the head patient directly
      if (patient.familyPatientId) {
        promises.push(
          getPatientsList(clinicId, { ...basePayload, FamilyPatientID: patient.familyPatientId })
        );
        // Fetch the head/parent patient by their PatientID so they appear in the list too
        promises.push(
          getPatientsList(clinicId, { ...basePayload, PatientID: patient.familyPatientId })
        );
      }

      const settled = await Promise.allSettled(promises);
      const allPatients = [];
      settled.forEach(r => {
        if (r.status === 'fulfilled') {
          allPatients.push(...r.value);
        }
      });

      // Deduplicate by patient id
      const seen = new Set();
      const deduplicated = allPatients.filter(p => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });

      if (deduplicated.length === 0) {
        setLocalPopup({
          visible: true,
          message: 'No family members found for this patient.',
          type: 'error',
        });
      } else {
        setFamilyResults(deduplicated);
        setFamilyPopupOpen(true);
      }
    } catch (err) {
      setLocalPopup({
        visible: true,
        message: 'Failed to search family members.',
        type: 'error',
      });
    } finally {
      setFamilyLoadingId(null);
    }
  };

  const handleFamilyPatientSelect = (patient) => {
  if (setPatients) {
    setPatients(prev => {
      const exists = prev.find(p => String(p.id) === String(patient.id));
      return exists ? prev : [patient, ...prev];
    });
  }

  onSelect(patient);
  setFamilyPopupOpen(false);
  setFamilyResults([]);
};

  const closeFamilyPopup = () => {
    setFamilyPopupOpen(false);
    setFamilyResults([]);
  };

  // Only show the Family Search button for Name and FileNo searches (not Mobile)
  const showFamilyBtn = searchType !== 'Mobile';

  return (
    <div className={styles.formGroup} ref={wrapperRef}>

      {/* ── Local MessagePopup for family search feedback ── */}
      <MessagePopup
        visible={localPopup.visible}
        message={localPopup.message}
        type={localPopup.type}
        onClose={() => setLocalPopup(prev => ({ ...prev, visible: false }))}
      />

      {/* ── Family Results Popup ── */}
      {familyPopupOpen && (
        <div
          className={styles.familyOverlay}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeFamilyPopup(); }}
        >
          <div className={styles.familyCard}>
            <div className={styles.familyCardHeader}>
              <FiUsers size={18} />
              <h4>Family Members</h4>
              <button
                type="button"
                className={styles.familyCardCloseBtn}
                onClick={closeFamilyPopup}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className={styles.familyCardList}>
              {familyResults.length === 0 ? (
                <div className={styles.familyEmptyMsg}>No family members found.</div>
              ) : (
                familyResults.map(patient => {
                  const isSelected = String(patient.id) === String(selectedId);
                  return (
                    <div
                      key={patient.id}
                      className={`${styles.searchableOption} ${isSelected ? styles.searchableOptionSelected : ''}`}
                      onMouseDown={() => handleFamilyPatientSelect(patient)}
                    >
                      <div className={styles.optionAvatar}>
                        {`${patient.firstName} ${patient.lastName}`.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.optionInfo}>
                        <span className={styles.optionLabel}>{patient.firstName} {patient.lastName}</span>
                        <span className={styles.optionSub}>
                          {[patient.fileNo, patient.mobile].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                      {isSelected && <FiCheckCircle className={styles.optionCheck} size={15} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {label && (
        <label className={styles.formLabel}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      {/* ── Search type tabs + input + button, all inline ── */}
      <div className={styles.patientSearchOuter}>
        <div className={styles.patientSearchRow}>
          {/* Tabs */}
          <div className={styles.patientSearchTabs}>
            {SEARCH_TYPES.map(({ key }) => (
              <button
                key={key}
                type="button"
                className={`${styles.patientSearchTab} ${searchType === key ? styles.patientSearchTabActive : ''}`}
                onClick={() => handleTypeChange(key)}
              >
                {key === 'Name' ? 'Name' : key === 'Mobile' ? 'Mobile' : 'File No'}
              </button>
            ))}
          </div>

          {/* Input + search icon button */}
          <div className={styles.patientSearchInputWrap}>
            <input
              type={searchType === 'Mobile' ? 'tel' : 'text'}
              className={styles.patientSearchInput}
              placeholder={placeholderMap[searchType]}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (patients.length > 0) {
                  setOpen(true);
                } else if (!initialLoadedRef.current) {
                  initialLoadedRef.current = true;
                  onInitialLoad();
                }
              }}
            />
            <button
              type="button"
              className={styles.patientSearchIconBtn}
              onClick={handleSearch}
              disabled={loadingPatients || !searchValue.trim()}
              title="Search"
            >
              <FiSearch size={15} />
            </button>
          </div>

          {/* Selected display / chevron trigger */}
          {selectedPatientItem && (
            <div className={styles.patientSelectedTrigger} onClick={handleTriggerClick}>
              <span className={styles.patientSelectedLabel}>
                {selectedPatientItem.firstName} {selectedPatientItem.lastName}
              </span>
              <button type="button" className={styles.clearBtn} onClick={handleClear}>
                <FiX size={13} />
              </button>
            </div>
          )}
        </div>

        {/* ── Dropdown anchored below patientSearchOuter ── */}
        {open && (
          <div className={styles.searchableDropdown}>
            {loadingPatients ? (
              <div className={styles.searchableNoResults}>Searching...</div>
            ) : patients.length === 0 ? (
              <div className={styles.searchableNoResults}>No results found</div>
            ) : (
              patients.map(patient => {
                const isSelected = String(patient.id) === String(selectedId);
                return (
                  <div
                    key={patient.id}
                    className={`${styles.searchableOption} ${isSelected ? styles.searchableOptionSelected : ''}`}
                    onMouseDown={() => handleSelect(patient)}
                  >
                    <div className={styles.optionAvatar}>
                      {`${patient.firstName} ${patient.lastName}`.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.optionInfo}>
                      <span className={styles.optionLabel}>{patient.firstName} {patient.lastName}</span>
                      <span className={styles.optionSub}>
                        {[patient.fileNo, patient.mobile].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    {isSelected && <FiCheckCircle className={styles.optionCheck} size={15} />}
                    {/* Family Search button — only shown for Name / FileNo search types */}
                    {showFamilyBtn && (
                      <button
                        type="button"
                        className={styles.familySearchBtn}
                        disabled={familyLoadingId === patient.id}
                        onMouseDown={(e) => { e.stopPropagation(); handleFamilySearch(e, patient); }}
                        title="Search family members"
                      >
                        <FiUsers size={12} />
                        {familyLoadingId === patient.id ? '...' : 'Family'}
                      </button>
                    )}
                  </div>
                );
              })
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
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [submitCooldown, setSubmitCooldown] = useState(false);
  const startCooldown = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Add Patient modal state
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

  const isFormComplete =
    !!formData.patientId &&
    !!formData.doctorId  &&
    !!selectedDate       &&
    !!formData.slotId;

  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchDoctors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.doctorId && selectedDate) {
      fetchAvailableSlots(formData.doctorId, selectedDate);
    } else {
      setAvailableSlots([]);
      setFormData(prev => ({ ...prev, slotId: '' }));
    }
  }, [formData.doctorId, selectedDate]);

  // fetch initial 20 patients without any search filter — called on first focus of the search input
  const fetchInitialPatients = async () => {
    try {
      setLoadingPatients(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const data = await getPatientsList(clinicId, {
        BranchID: branchId,
        Status: 1,
        PageSize: 20,
      });
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch initial patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handlePatientSearch = async (searchType, searchValue) => {
    try {
      setLoadingPatients(true);
      setPatients([]);
      setFormData(prev => ({ ...prev, patientId: '' }));

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const searchPayload = { BranchID: branchId, Status: 1, PageSize: 100 };
      if (searchType === 'Name')   searchPayload.Name   = searchValue;
      if (searchType === 'Mobile') searchPayload.Mobile = searchValue;
      if (searchType === 'FileNo') searchPayload.FileNo = searchValue;

      const data = await getPatientsList(clinicId, searchPayload);
      setPatients(data);

      if (data.length === 0) {
        showPopup('No patients found for the given search.', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      showPopup('Failed to load patients.', 'error');
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const data = await getEmployeeList(clinicId, { BranchID: branchId, Designation: 1, Status: 1, PageSize: 100 });
      setDoctors(data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
      showPopup('Failed to load doctors.', 'error');
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    setLoadingSlots(true);
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
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

  const handlePatientSelect = (patient) => {
    const id = patient ? String(patient.id) : '';
    setFormData(prev => ({ ...prev, patientId: id }));
    setValidationMessages(prev => ({ ...prev, patientId: getLiveValidationMessage('patientId', id) }));
  };

  const handleDoctorSelect = (doctor) => {
    const id = doctor ? String(doctor.id) : '';
    setFormData(prev => ({ ...prev, doctorId: id, slotId: '' }));
    setValidationMessages(prev => ({
      ...prev,
      doctorId: getLiveValidationMessage('doctorId', id),
      slotId: '',
    }));
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

  // Called when a new patient is successfully added via AddPatient modal
  const handleNewPatientAdded = async () => {
    setIsAddPatientOpen(false);
    try {
      setLoadingPatients(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      // Fetch the most recently added patient (sorted by newest, page size 1)
      const data = await getPatientsList(clinicId, {
        BranchID: branchId,
        Status: 1,
        PageSize: 1,
      });
      if (data && data.length > 0) {
        const newPatient = data[0];
        // Merge into patients list (prepend so it's visible)
        setPatients(prev => {
          const exists = prev.find(p => String(p.id) === String(newPatient.id));
          return exists ? prev : [newPatient, ...prev];
        });
        // Auto-select the newly added patient
        const id = String(newPatient.id);
        setFormData(prev => ({ ...prev, patientId: id }));
        setValidationMessages(prev => ({ ...prev, patientId: '' }));
      }
    } catch (err) {
      console.error('Failed to fetch new patient:', err);
      showPopup('Patient added. Please search to select them.', 'success');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!isFormComplete) {
      showPopup('Please fill all required fields before submitting.', 'error');
      return;
    }

    if (submitCooldown) return;
    startCooldown(setSubmitCooldown);

    setLoading(true);
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await addAppointment({
        clinicId:  parseInt(clinicId),
        branchId:  parseInt(branchId),
        patientId: parseInt(formData.patientId),
        doctorId:  parseInt(formData.doctorId),
        slotId:    parseInt(formData.slotId),
        reason:    formData.reason.trim(),
      });
      showPopup('Appointment booked successfully!', 'success');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1200);
    } catch (err) {
      showPopup(err.message || 'Failed to book appointment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ patientId: '', doctorId: '', slotId: '', reason: '' });
    setSelectedDate(getTodayDate());
    setAvailableSlots([]);
    setPatients([]);
    setValidationMessages({});
    setSubmitAttempted(false);
  };

  const handleClose = () => {
    resetForm();
    closePopup();
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

  const selectedSlot    = availableSlots.find(s => s.id === parseInt(formData.slotId));
  const selectedPatient = patients.find(p => String(p.id) === String(formData.patientId));
  const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.modal}>

          <MessagePopup
            visible={popup.visible}
            message={popup.message}
            type={popup.type}
            onClose={closePopup}
          />

          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <FiCalendar className={styles.headerIcon} size={20} />
              <h2>Book New Appointment</h2>
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
            <button onClick={handleClose} className={styles.closeBtn} disabled={loading}>
              <FiX size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.body}>

              {/* ── Patient Information ── */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <FiUser size={18} />
                  Patient Information
                  <button
                    type="button"
                    className={styles.addPatientBtn}
                    onClick={() => setIsAddPatientOpen(true)}
                    title="Add New Patient"
                  >
                    <FiUserPlus size={16} />
                    Add New Patient
                  </button>
                </h3>

                <PatientSearchDropdown
                  label="Select Patient"
                  required
                  patients={patients}
                  selectedId={formData.patientId}
                  onSelect={handlePatientSelect}
                  onSearch={handlePatientSearch}
                  onInitialLoad={fetchInitialPatients}
                  loadingPatients={loadingPatients}
                  setPatients={setPatients}
                />
                {validationMessages.patientId && !formData.patientId && (
                  <span className={styles.validationMsg}>{validationMessages.patientId}</span>
                )}

                {/* Selected patient card */}
                {selectedPatient && (
                  <div className={styles.infoCard}>
                    <div className={styles.infoCardGrid}>
                      <div className={styles.infoCardItem}>
                        <span className={styles.infoCardKey}>NAME</span>
                        <span className={styles.infoCardValue}>{selectedPatient.firstName} {selectedPatient.lastName}</span>
                      </div>
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

              {submitAttempted && !isFormComplete && (
                <div className={styles.formIncompleteHint}>
                  Please fill all required fields to enable submission.
                </div>
              )}

            </div>

            {/* Footer */}
            <div className={styles.footer}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.btnCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={loading || submitCooldown}
                title={!isFormComplete ? 'Please fill all required fields' : ''}
              >
                {loading ? 'Booking...' : 'Book Appointment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Patient Modal */}
      <AddPatient
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onSuccess={handleNewPatientAdded}
      />
    </>
  );
};

export default AddAppointment;