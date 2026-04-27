import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiUser, FiCalendar, FiActivity, FiCheckCircle, FiSearch, FiChevronDown, FiUserPlus, FiUsers, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { addPatientVisit, updatePatientVisit, getPatientsList, getEmployeeList, getAppointmentList, addPatient } from '../Api/Api.js';
import styles from './AddPatientVisit.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import TimePicker from '../Hooks/TimePicker.jsx';
import AddPatient from '../Patients/AddPatient.jsx';

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
  if (systolic < 10 || systolic > 250) return 'The value should be between 10-250';
  return '';

case 'bpDiastolic':
  if (value === '' || value === null || value === undefined) return '';
  const diastolic = Number(value);
  if (isNaN(diastolic)) return 'Must be a valid number';
  if (diastolic < 10 || diastolic > 250) return 'The value should be between 10-250';
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

/* ─────────────────────────────────────────────── */
/* Quick Add Patient validation helpers             */
/* ─────────────────────────────────────────────── */
const nameRegex = /^[A-Za-z\s.\-']+$/;
const mobileRegex = /^[6-9]\d{9}$/;

const GENDER_OPTIONS = [
  { id: 1, label: 'Male' },
  { id: 2, label: 'Female' },
  { id: 3, label: 'Other' },
];

const getQuickAddValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'firstName':
      if (!value || !value.trim()) return 'First name is required';
      if (value.trim().length > 50) return 'First name too long';
      if (!nameRegex.test(value.trim())) return 'Invalid characters in first name';
      return '';
    case 'lastName':
      if (value && value.trim()) {
        if (value.trim().length > 50) return 'Last name too long';
        if (!nameRegex.test(value.trim())) return 'Invalid characters in last name';
      }
      return '';
    case 'mobile':
      if (!value || !value.trim()) return 'Mobile is required';
      if (!mobileRegex.test(value.trim())) return 'Invalid mobile number (must start with 6-9, 10 digits)';
      return '';
    case 'gender':
      if (!value || Number(value) === 0) return 'Gender is required';
      return '';
    case 'age':
      if (value === '' || value === null || value === undefined) return 'Age is required';
      const age = Number(value);
      if (isNaN(age) || !Number.isInteger(age) || age < 0 || age > 150) return 'Age must be realistic (0–150)';
      return '';
    default:
      return '';
  }
};

/* ─────────────────────────────────────────────── */
/* Quick Add Patient Modal  (Scenario 2 / Emergency) */
/* ─────────────────────────────────────────────── */
const QuickAddPatientModal = ({ isOpen, onClose, onPatientAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    gender: 0,
    age: '',
  });
  const [validationMessages, setValidationMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (isOpen) {
      setFormData({ firstName: '', lastName: '', mobile: '', gender: 0, age: '' });
      setValidationMessages({});
      setLoading(false);
      setSubmitCooldown(false);
      setPopup({ visible: false, message: '', type: 'success' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let filtered = value;
    if (name === 'mobile' || name === 'age') filtered = value.replace(/[^0-9]/g, '');
    if (name === 'firstName' || name === 'lastName') filtered = value.replace(/[^A-Za-z\s.\-']/g, '');
    setFormData(prev => ({ ...prev, [name]: filtered }));
    setValidationMessages(prev => ({ ...prev, [name]: getQuickAddValidationMessage(name, filtered) }));
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'mobile', 'gender', 'age'];
    return requiredFields.every(f => !getQuickAddValidationMessage(f, formData[f]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const msgs = {};
    ['firstName', 'lastName', 'mobile', 'gender', 'age'].forEach(f => {
      msgs[f] = getQuickAddValidationMessage(f, formData[f]);
    });
    setValidationMessages(msgs);
    if (Object.values(msgs).some(m => m)) return;

    if (submitCooldown) return;
    setSubmitCooldown(true);
    setTimeout(() => setSubmitCooldown(false), 2000);

    setLoading(true);
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const payload = {
        clinicId: parseInt(clinicId),
        branchID: parseInt(branchId),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: Number(formData.gender),
        birthDate: '',
        age: Number(formData.age),
        bloodGroup: 0,
        photoFileId: 0,
        maritalStatus: 0,
        mobile: formData.mobile.trim(),
        altMobile: '',
        email: '',
        address: '',
        emergencyContactNo: '',
        allergies: 'No Allergies',
        existingMedicalConditions: 'Not reported',
        pastSurgeries: 'Nothing',
        currentMedications: 'NA',
        familyMedicalHistory: '',
        immunizationRecords: 'Not Available',
        familyPatientId: 0,
      };

      const result = await addPatient(payload);

      setPopup({ visible: true, message: 'Patient added successfully!', type: 'success' });
      setTimeout(() => {
        onPatientAdded({
          id: result.patientId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          mobile: formData.mobile.trim(),
          fileNo: '',
        });
        onClose();
      }, 900);
    } catch (err) {
      console.error('Quick add patient failed:', err);
      setPopup({ visible: true, message: err.message || 'Failed to add patient.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.quickAddOverlay} onClick={onClose}>
      <div className={styles.quickAddModal} onClick={e => e.stopPropagation()}>

        <MessagePopup
          visible={popup.visible}
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup(prev => ({ ...prev, visible: false }))}
        />

        <div className={styles.quickAddHeader}>
          <div className={styles.quickAddHeaderContent}>
            <FiUserPlus size={18} />
            <span>Quick Add Patient</span>
          </div>
          <button type="button" className={styles.quickAddClose} onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.quickAddForm}>
          <div className={styles.quickAddBody}>

            <div className={styles.quickAddRow}>
              <div className={styles.quickAddGroup}>
                <label className={styles.quickAddLabel}>
                  First Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className={styles.quickAddInput}
                  maxLength={50}
                  autoFocus
                />
                {validationMessages.firstName && (
                  <span className={styles.validationMsg}>{validationMessages.firstName}</span>
                )}
              </div>

              <div className={styles.quickAddGroup}>
                <label className={styles.quickAddLabel}>
                  Last Name <span className={styles.optionalTag}>(Optional)</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className={styles.quickAddInput}
                  maxLength={50}
                />
                {validationMessages.lastName && (
                  <span className={styles.validationMsg}>{validationMessages.lastName}</span>
                )}
              </div>
            </div>

            <div className={styles.quickAddGroup}>
              <label className={styles.quickAddLabel}>
                Mobile <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile"
                className={styles.quickAddInput}
                maxLength={10}
              />
              {validationMessages.mobile && (
                <span className={styles.validationMsg}>{validationMessages.mobile}</span>
              )}
            </div>

            <div className={styles.quickAddRow}>
              <div className={styles.quickAddGroup}>
                <label className={styles.quickAddLabel}>
                  Gender <span className={styles.required}>*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={styles.quickAddSelect}
                >
                  <option value={0}>Select Gender</option>
                  {GENDER_OPTIONS.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
                {validationMessages.gender && (
                  <span className={styles.validationMsg}>{validationMessages.gender}</span>
                )}
              </div>

              <div className={styles.quickAddGroup}>
                <label className={styles.quickAddLabel}>
                  Age <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="Enter age"
                  className={styles.quickAddInput}
                  maxLength={3}
                />
                {validationMessages.age && (
                  <span className={styles.validationMsg}>{validationMessages.age}</span>
                )}
              </div>
            </div>

          </div>

          <div className={styles.quickAddFooter}>
            <button
              type="button"
              className={styles.quickAddBtnCancel}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.quickAddBtnSubmit}
              disabled={loading || submitCooldown}
            >
              {loading ? 'Adding...' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────── */
/* Patient Search Dropdown (Name / Mobile / File No) */
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
  validationMsg,
  setPatients,
}) => {
  const [searchType, setSearchType]   = useState('Name');
  const [searchValue, setSearchValue] = useState('');
  const [open, setOpen]               = useState(false);
  const initialLoadedRef              = useRef(false);
  const wrapperRef                    = useRef(null);

  const [familyLoadingId, setFamilyLoadingId] = useState(null);
  const [familyResults, setFamilyResults]     = useState([]);
  const [familyPopupOpen, setFamilyPopupOpen] = useState(false);
  const [localPopup, setLocalPopup]           = useState({ visible: false, message: '', type: 'error' });

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

  useEffect(() => {
    if (patients.length === 0) {
      initialLoadedRef.current = false;
    }
  }, [patients]);

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

  const handleFamilySearch = async (e, patient) => {
    e.stopPropagation();
    setFamilyLoadingId(patient.id);
    setOpen(false);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const basePayload = { BranchID: branchId, Status: 1, PageSize: 100 };

      const promises = [
        getPatientsList(clinicId, { ...basePayload, FamilyPatientID: patient.id }),
      ];

      if (patient.familyPatientId) {
        promises.push(
          getPatientsList(clinicId, { ...basePayload, FamilyPatientID: patient.familyPatientId })
        );
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

  const showFamilyBtn = searchType !== 'Mobile';

  return (
    <div className={styles.formGroup} ref={wrapperRef}>

      <MessagePopup
        visible={localPopup.visible}
        message={localPopup.message}
        type={localPopup.type}
        onClose={() => setLocalPopup(prev => ({ ...prev, visible: false }))}
      />

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

      <div className={styles.patientSearchOuter}>
        <div className={styles.patientSearchRow}>
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

      {validationMsg && (
        <span className={styles.validationMsg}>{validationMsg}</span>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────── */
/* Doctor SearchableDropdown (unchanged)            */
/* ─────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────── */
/* Main AddPatientVisit Component                   */
/* ─────────────────────────────────────────────── */
const AddPatientVisit = ({ isOpen, onClose, onSuccess, preSelectedAppointmentId = null }) => {
  const [visitMode, setVisitMode] = useState('without');

  // isEmergency = false → Scenario 1 (full AddPatient modal, with vitals)
  // isEmergency = true  → Scenario 2 (QuickAdd modal, no vitals)
  const [isEmergency, setIsEmergency] = useState(false);

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
  const [loadingPatients,     setLoadingPatients]     = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [validationMessages,  setValidationMessages]  = useState({});

  // Scenario 1: open full AddPatient modal
  const [showAddPatient, setShowAddPatient] = useState(false);

  // Scenario 2: open QuickAdd modal (emergency)
  const [showQuickAddPatient, setShowQuickAddPatient] = useState(false);

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
  const isFormComplete = (() => {
    if (!formData.VisitDate || !formData.VisitTime) return false;
    if (preSelectedAppointmentId) return true;
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
        setPatients([]);
        setIsEmergency(false);
        fetchDoctors();
      }
    }
  }, [isOpen, preSelectedAppointmentId]);

  // When toggling emergency off, clear vitals
  const handleEmergencyToggle = () => {
    const next = !isEmergency;
    setIsEmergency(next);
    if (!next) {
      // switching back to Scenario 1 — clear vitals fields
      setFormData(prev => ({
        ...prev,
        bpSystolic:  '',
        bpDiastolic: '',
        temperature: '',
        weight:      '',
      }));
    }
  };

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

  const handlePatientSearch = async (searchType, searchValue) => {
    try {
      setLoadingPatients(true);
      setPatients([]);
      setFormData(prev => ({ ...prev, PatientID: '' }));

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
    setPatients([]);
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

  // ── Scenario 1: called when AddPatient modal successfully adds a patient ──
  const handleAddPatientSuccess = async () => {
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const data = await getPatientsList(clinicId, {
        BranchID: branchId,
        Status: 1,
        PageSize: 20,
      });
      if (data && data.length > 0) {
        setPatients(data);
        handlePatientSelect(data[0]);
      }
    } catch (err) {
      console.error('Failed to refresh patients after add:', err);
    }
    setShowAddPatient(false);
  };

  // ── Scenario 2: called when QuickAddPatientModal adds a patient ──
  const handleQuickPatientAdded = (newPatient) => {
    setPatients(prev => {
      const exists = prev.find(p => String(p.id) === String(newPatient.id));
      if (exists) return prev;
      return [newPatient, ...prev];
    });
    handlePatientSelect(newPatient);
    setShowQuickAddPatient(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!isFormComplete) {
      showPopup('Please fill all required fields before submitting.', 'error');
      return;
    }

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

      // In Scenario 2 (Emergency), vitals are always 0
      const visitData = {
        ...formData,
        VisitDate:   formattedDate,
        clinicId:    parseInt(clinicId),
        branchId:    parseInt(branchId),
        bpSystolic:  (!isEmergency && formData.bpSystolic)  ? parseInt(formData.bpSystolic)   : 0,
        bpDiastolic: (!isEmergency && formData.bpDiastolic) ? parseInt(formData.bpDiastolic)  : 0,
        temperature: (!isEmergency && formData.temperature) ? parseFloat(formData.temperature): 0,
        weight:      (!isEmergency && formData.weight)      ? parseFloat(formData.weight)     : 0,
      };

      const addResult = await addPatientVisit(visitData);

      // ── Emergency: immediately update the visit status to 1 ──
      if (isEmergency) {
        const visitId = addResult?.visitId ?? addResult?.VisitID ?? addResult?.visitID ?? addResult?.id ?? 0;
        await updatePatientVisit({
          visitId:       visitId,
          appointmentId: visitData.appointmentId ?? 0,
          doctorId:      visitData.DoctorID,
          visitDate:     formattedDate,
          visitTime:     visitData.VisitTime,
          reason:        visitData.reason ?? '',
          symptoms:      visitData.symptoms ?? '',
          bpSystolic:    0,
          bpDiastolic:   0,
          temperature:   0,
          weight:        0,
          status:        1,
        });
      }

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
        setPatients([]);
        setValidationMessages({});
        setSubmitAttempted(false);
        setIsEmergency(false);
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

  const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';

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

        {/* ── Scenario 1: Full AddPatient Modal ── */}
        <div className={styles.addPatientWrapper}>
          <AddPatient
            isOpen={showAddPatient}
            onClose={() => setShowAddPatient(false)}
            onSuccess={handleAddPatientSuccess}
          />
        </div>

        {/* ── Scenario 2: Quick Add Patient Modal (Emergency) ── */}
        <QuickAddPatientModal
          isOpen={showQuickAddPatient}
          onClose={() => setShowQuickAddPatient(false)}
          onPatientAdded={handleQuickPatientAdded}
        />

        <div className={styles.addVisitHeader}>
          <div className={styles.addVisitHeaderContent}>
            <FiActivity className={styles.addVisitHeaderIcon} size={20} />
            <h2>
              {preSelectedAppointmentId ? 'Complete Visit from Appointment' : 'Add New Patient Visit'}
            </h2>
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
                  {/* ── Patient Information title with Emergency toggle + Add Patient button ── */}
                  <h3 className={styles.sectionTitleRow}>
                    <span className={styles.sectionTitleLeft}>
                      <FiUser size={18} />
                      Patient Information
                    </span>
                    <span className={styles.sectionTitleRight}>
                      {/* Emergency Patient Toggle */}
                      <button
                        type="button"
                        className={`${styles.emergencyToggleBtn} ${isEmergency ? styles.emergencyToggleBtnOn : ''}`}
                        onClick={handleEmergencyToggle}
                        title={isEmergency ? 'Switch to Normal Visit' : 'Switch to Emergency Visit'}
                      >
                        {isEmergency
                          ? <FiToggleRight size={18} />
                          : <FiToggleLeft size={18} />
                        }
                        <span>Emergency Patient</span>
                      </button>

                      {/* Add Patient button:
                          Scenario 1 (normal) → opens full AddPatient modal
                          Scenario 2 (emergency) → opens QuickAdd modal */}
                      <button
                        type="button"
                        className={styles.addPatientInlineBtn}
                        onClick={() => {
                          if (isEmergency) {
                            setShowQuickAddPatient(true);
                          } else {
                            setShowAddPatient(true);
                          }
                        }}
                        title="Add New Patient"
                      >
                        <FiUserPlus size={13} />
                        <span>Add Patient</span>
                      </button>
                    </span>
                  </h3>
                  <PatientSearchDropdown
                    label="Patient"
                    required
                    patients={patients}
                    selectedId={formData.PatientID}
                    onSelect={handlePatientSelect}
                    onSearch={handlePatientSearch}
                    onInitialLoad={fetchInitialPatients}
                    loadingPatients={loadingPatients}
                    validationMsg={validationMessages.PatientID}
                    setPatients={setPatients}
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

                {/* ── Vital Signs: only shown in Scenario 1 (non-emergency) ── */}
                {!isEmergency && (
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
                )}
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