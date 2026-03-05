// src/components/AddEmployee.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiUpload, FiUser, FiShield, FiCreditCard, FiClock, FiPlus, FiTrash2, FiChevronDown, FiCheck } from 'react-icons/fi';
import {
  addEmployee,
  uploadPhoto,
  addEmployeeProof,
  uploadIDProof,
  addEmployeeBeneficiaryAccount,
  addEmployeeShift,
  getShiftList,
  addWorkDays,
  updateEmployee,
  updateEmployeeProof,
  updateEmployeeBeneficiaryAccount,
} from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import styles from './AddEmployee.module.css';

// ────────────────────────────────────────────────
// VALIDATION — mirrors backend rules exactly
// ────────────────────────────────────────────────
const NAME_REGEX   = /^[A-Za-z\s\.\-']+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const IFSC_REGEX   = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NO_REGEX = /^\d{9,18}$/;

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {

    // ── Step 1 : Employee fields ──
    case 'employeeCode':
      if (value && value.trim()) {
        if (value.trim().length > 20) return 'EmployeeCode cannot exceed 20 characters';
        if (!/^[A-Za-z0-9\-_]+$/.test(value.trim())) return 'EmployeeCode contains invalid characters';
      }
      return '';

    case 'firstName':
      if (!value || !value.trim()) return 'FirstName is required';
      if (value.trim().length > 50) return 'FirstName too long';
      if (!NAME_REGEX.test(value.trim())) return 'FirstName contains invalid characters';
      return '';

    case 'lastName':
      if (!value || !value.trim()) return 'LastName is required';
      if (value.trim().length > 50) return 'LastName too long';
      if (!NAME_REGEX.test(value.trim())) return 'LastName contains invalid characters';
      return '';

    case 'department':
      if (!value || !value.trim()) return 'Department is required';
      return '';

    case 'designation':
      if (!value || !value.trim()) return 'Designation is required';
      return '';

    case 'gender':
      if (!value || Number(value) < 1) return 'Gender is required';
      return '';

    case 'birthDate':
      if (!value) return 'BirthDate is required';
      if (isNaN(new Date(value).getTime())) return 'BirthDate must be a valid date (YYYY-MM-DD)';
      return '';

    case 'address':
      if (!value || !value.trim()) return 'Address is required';
      if (value.length > 1000) return 'Address too long';
      return '';

    case 'mobile':
      if (!value || !value.trim()) return 'Mobile is required';
      if (value.trim().length < 10 || value.trim().length > 10) return 'Mobile length should be 10';
      if (!MOBILE_REGEX.test(value.trim())) return 'Invalid mobile number';
      return '';

    case 'altMobile':
      if (value && value.trim()) {
        if (value.trim().length < 10 || value.trim().length > 10) return 'AltMobile length should be 10';
        if (!MOBILE_REGEX.test(value.trim())) return 'Invalid alternate mobile number';
      }
      return '';

    case 'email':
      if (value && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
        return 'Invalid email format';
      return '';

    case 'qualification':
    case 'specialization':
      return value && value.length > 100 ? 'Field must not exceed 100 characters' : '';

    case 'universityName':
      if (value && value.trim() && value.trim().length < 3) return 'University name must be at least 3 characters';
      if (value && value.length > 100) return 'University name must not exceed 100 characters';
      return '';

    case 'licenseNo': case 'pfNo': case 'esiNo':
      return value && value.length > 50 ? 'Field must not exceed 50 characters' : '';

    case 'licenseExpiryDate':
      if (value) {
        const expiry = new Date(value);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (expiry < today) return 'Expiry date must be in the future';
      }
      return '';

    case 'experienceYears':
      if (value !== '' && value !== null && value !== undefined) {
        const y = Number(value);
        if (isNaN(y)) return 'Must be a number';
        if (y < 0) return 'Cannot be negative';
        if (y > 50) return 'Experience cannot exceed 50 years';
      }
      return '';

    // ── Step 2 : Proof fields ──
    case 'proofType':
      if (!value || Number(value) < 1) return 'ProofType is required';
      return '';

    case 'idNumber':
      if (!value || !value.trim()) return 'IdNumber is required';
      if (value.trim().length > 20) return 'IdNumber cannot exceed 20 characters';
      if (!/^[ A-Za-z0-9\/\-]+$/.test(value.trim())) return 'Invalid characters in IdNumber';
      return '';

    case 'detail':
      if (value && value.length > 500) return 'Detail too long';
      return '';

    case 'expiryDate':
      if (value && isNaN(new Date(value).getTime())) return 'ExpiryDate must be valid date';
      return '';

    // ── Step 3 : Beneficiary fields ──
    case 'AccountHolderName':
      if (!value || !value.trim()) return 'AccountHolderName is required';
      if (value.trim().length > 100) return 'AccountHolderName too long';
      if (!/^[A-Za-z\s\.\-']+$/.test(value.trim())) return 'Invalid characters in AccountHolderName';
      return '';

    case 'AccountNo':
      if (!value || !value.trim()) return 'AccountNo is required';
      if (!ACCOUNT_NO_REGEX.test(value.trim())) return 'AccountNo must be 9–18 digits';
      return '';

    case 'BankName':
      if (!value || !value.trim()) return 'BankName is required';
      if (value.trim().length > 100) return 'BankName too long';
      return '';

    case 'IFSCCode':
      if (value && value.trim() && !IFSC_REGEX.test(value.trim()))
        return 'Invalid IFSC code format (e.g., SBIN0001234)';
      return '';

    case 'BankAddress':
      if (value && value.length > 500) return 'BankAddress too long';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'firstName': case 'lastName': case 'AccountHolderName': case 'BankName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    case 'mobile': case 'altMobile': case 'AccountNo':
      return value.replace(/[^0-9]/g, '');
    case 'employeeCode':
      return value.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase();
    case 'qualification': case 'specialization':
      return value.replace(/[^a-zA-Z\s.,()]/g, '');
    case 'universityName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    case 'licenseNo': case 'pfNo': case 'esiNo':
      return value.replace(/[^A-Za-z0-9-_]/g, '');
    case 'idNumber':
      return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    case 'IFSCCode':
  return value
    .replace(/[^a-zA-Z0-9]/g, '')  
    .toUpperCase();               
    case 'experienceYears':
      return value.replace(/[^0-9]/g, '');
    default:
      return value;
  }
};

const getMaxBirthDate = () => {
  const today = new Date();
  return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];
};
const getTodayDate = () => new Date().toISOString().split('T')[0];

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const GENDER_OPTIONS        = [{ id:1,label:'Male'},{id:2,label:'Female'},{id:3,label:'Other'}];
const BLOOD_GROUP_OPTIONS   = [{id:1,label:'A+'},{id:2,label:'A-'},{id:3,label:'B+'},{id:4,label:'B-'},{id:5,label:'AB+'},{id:6,label:'AB-'},{id:7,label:'O+'},{id:8,label:'O-'},{id:9,label:'Others'}];
const MARITAL_STATUS_OPTIONS= [{id:1,label:'Single'},{id:2,label:'Married'},{id:3,label:'Widowed'},{id:4,label:'Divorced'},{id:5,label:'Separated'}];
const ID_PROOF_OPTIONS      = [{id:1,label:'Aadhar'},{id:2,label:'Passport'},{id:3,label:'Driving Licence'},{id:4,label:'Voter ID'},{id:5,label:'PAN Card'}];
const DESIGNATION_OPTIONS   = [{id:1,label:'Doctor'},{id:2,label:'Nurse'},{id:3,label:'Receptionist'},{id:4,label:'Pharmacist'},{id:5,label:'Lab Technician'},{id:6,label:'Billing Staff'},{id:7,label:'Manager'},{id:8,label:'Attendant'},{id:9,label:'Cleaner'},{id:10,label:'Others'}];
const WORK_DAYS             = [{id:1,label:'Sun'},{id:2,label:'Mon'},{id:3,label:'Tue'},{id:4,label:'Wed'},{id:5,label:'Thu'},{id:6,label:'Fri'},{id:7,label:'Sat'}];

const BLANK_PROOF = () => ({ proofType: 0, idNumber: '', detail: '', expiryDate: '', fileId: 0 });

// ── Step 1 required fields (backend) ──
const STEP1_FIELDS = [
  'employeeCode','firstName','lastName','gender','birthDate','address',
  'mobile','altMobile','email','qualification','specialization','licenseNo',
  'licenseExpiryDate','experienceYears','universityName','pfNo','esiNo',
];

// ── Step 2 proof fields ──
const STEP2_PROOF_FIELDS = ['proofType','idNumber','detail','expiryDate'];

// ── Step 3 beneficiary fields ──
const STEP3_FIELDS = ['AccountHolderName','AccountNo','BankName','IFSCCode','BankAddress'];

// ────────────────────────────────────────────────
// SHIFT DROPDOWN COMPONENT
// ────────────────────────────────────────────────
const ShiftDropdown = ({ shifts, selectedShifts, onToggle, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayText = () => {
    if (selectedShifts.length === 0) return 'Select shifts...';
    if (selectedShifts.length === 1) {
      const shift = shifts.find(s => s.id === selectedShifts[0]);
      return shift ? shift.shiftName : 'Select shifts...';
    }
    return `${selectedShifts.length} shifts selected`;
  };

  const handleSelectAll = () => {
    if (selectedShifts.length === shifts.length) {
      shifts.forEach(s => { if (selectedShifts.includes(s.id)) onToggle(s.id); });
    } else {
      shifts.forEach(s => { if (!selectedShifts.includes(s.id)) onToggle(s.id); });
    }
  };

  const allSelected  = shifts.length > 0 && selectedShifts.length === shifts.length;
  const someSelected = selectedShifts.length > 0 && selectedShifts.length < shifts.length;

  return (
    <div className={styles.shiftDropdownWrapper} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.shiftDropdownTrigger} ${isOpen ? styles.shiftDropdownTriggerOpen : ''} ${disabled ? styles.shiftDropdownTriggerDisabled : ''}`}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        disabled={disabled}
      >
        <span className={`${styles.shiftDropdownTriggerText} ${selectedShifts.length > 0 ? styles.shiftDropdownTriggerTextActive : ''}`}>
          {getDisplayText()}
        </span>
        {selectedShifts.length > 0 && (
          <span className={styles.shiftDropdownBadge}>{selectedShifts.length}</span>
        )}
        <FiChevronDown
          size={16}
          className={`${styles.shiftDropdownChevron} ${isOpen ? styles.shiftDropdownChevronOpen : ''}`}
        />
      </button>

      {isOpen && (
        <div className={styles.shiftDropdownMenu}>
          <div
            className={`${styles.shiftDropdownItem} ${styles.shiftDropdownItemSelectAll}`}
            onClick={handleSelectAll}
          >
            <span className={`${styles.shiftCheckbox} ${allSelected ? styles.shiftCheckboxChecked : someSelected ? styles.shiftCheckboxIndeterminate : ''}`}>
              {allSelected && <FiCheck size={11} />}
              {someSelected && !allSelected && <span className={styles.indeterminateDash} />}
            </span>
            <span className={styles.shiftDropdownItemLabel}>Select All</span>
          </div>

          <div className={styles.shiftDropdownDivider} />

          {shifts.map(shift => {
            const isChecked = selectedShifts.includes(shift.id);
            return (
              <div
                key={shift.id}
                className={`${styles.shiftDropdownItem} ${isChecked ? styles.shiftDropdownItemChecked : ''}`}
                onClick={() => onToggle(shift.id)}
              >
                <span className={`${styles.shiftCheckbox} ${isChecked ? styles.shiftCheckboxChecked : ''}`}>
                  {isChecked && <FiCheck size={11} />}
                </span>
                <span className={styles.shiftDropdownItemLabel}>{shift.shiftName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────
const AddEmployee = ({ isOpen, onClose, departments, onSuccess }) => {
  const [currentStep, setCurrentStep]              = useState(1);
  const [createdEmployeeId, setCreatedEmployeeId]  = useState(null);
  const [savedProofIds, setSavedProofIds]          = useState([]);
  const [savedBeneficiaryId, setSavedBeneficiaryId] = useState(null);
  const [shifts, setShifts]                        = useState([]);
  const [shiftsLoading, setShiftsLoading]          = useState(false);
  const [loading, setLoading]                      = useState(false);
  const [error, setError]                          = useState(null);
  const [stepSuccess, setStepSuccess]              = useState('');

  // ── Submit-attempt flag (reset on step navigation) ──
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [formData, setFormData] = useState({
    employeeCode:'', firstName:'', lastName:'', gender:0, birthDate:'',
    bloodGroup:0, maritalStatus:0, address:'', mobile:'', altMobile:'',
    email:'', idProofType:0, idNumber:'', idExpiry:'', departmentId:0,
    designation:0, qualification:'', specialization:'', licenseNo:'',
    licenseExpiryDate:'', experienceYears:0, universityName:'',
    pfNo:'', esiNo:'', shiftId:0, photoFileId:0,
  });

  const [photo, setPhoto]                           = useState(null);
  const [photoUrl, setPhotoUrl]                     = useState(null);
  const [photoUploaded, setPhotoUploaded]           = useState(false);
  const [photoUploadStatus, setPhotoUploadStatus]   = useState('');
  const [isPhotoUploading, setIsPhotoUploading]     = useState(false);

  // ── Multi-proof state ──
  const [proofList, setProofList]                                 = useState([BLANK_PROOF()]);
  const [proofFiles, setProofFiles]                               = useState([null]);
  const [proofFileUrls, setProofFileUrls]                         = useState([null]);
  const [proofFilesUploaded, setProofFilesUploaded]               = useState([false]);
  const [proofUploadStatuses, setProofUploadStatuses]             = useState(['']);
  const [isProofUploading, setIsProofUploading]                   = useState([false]);
  const [proofValidationMessages, setProofValidationMessages]     = useState([{}]);

  const [beneficiaryData, setBeneficiaryData] = useState({
    AccountHolderName:'', AccountNo:'', IFSCCode:'', BankName:'', BankAddress:'', IsDefault:0,
  });

  // ── Multi-shift state ──
  const [selectedShifts, setSelectedShifts]       = useState([]);
  const [selectedWorkDays, setSelectedWorkDays]   = useState([]);
  const [validationMessages, setValidationMessages]                         = useState({});
  const [beneficiaryValidationMessages, setBeneficiaryValidationMessages]   = useState({});

  useEffect(() => { if (isOpen) fetchShifts(); }, [isOpen]);
  useEffect(() => { if (!isOpen) resetForm(); }, [isOpen]);

  const fetchShifts = async () => {
    setShiftsLoading(true);
    try {
      const clinicId = localStorage.getItem('clinicID');
      const list = await getShiftList(clinicId ? Number(clinicId) : 0, { Status: 1 });
      setShifts(list);
    } catch { setShifts([]); }
    finally { setShiftsLoading(false); }
  };

  const resetForm = () => {
    setCurrentStep(1); setCreatedEmployeeId(null);
    setSavedProofIds([]); setSavedBeneficiaryId(null);
    setFormData({ employeeCode:'',firstName:'',lastName:'',gender:0,birthDate:'',bloodGroup:0,maritalStatus:0,address:'',mobile:'',altMobile:'',email:'',idProofType:0,idNumber:'',idExpiry:'',departmentId:0,designation:0,qualification:'',specialization:'',licenseNo:'',licenseExpiryDate:'',experienceYears:0,universityName:'',pfNo:'',esiNo:'',shiftId:0,photoFileId:0 });
    setPhoto(null); setPhotoUrl(null); setPhotoUploaded(false); setPhotoUploadStatus('');
    setProofList([BLANK_PROOF()]);
    setProofFiles([null]); setProofFileUrls([null]);
    setProofFilesUploaded([false]); setProofUploadStatuses(['']);
    setIsProofUploading([false]); setProofValidationMessages([{}]);
    setBeneficiaryData({ AccountHolderName:'',AccountNo:'',IFSCCode:'',BankName:'',BankAddress:'',IsDefault:false });
    setSelectedShifts([]); setSelectedWorkDays([]);
    setError(null); setStepSuccess('');
    setValidationMessages({}); setBeneficiaryValidationMessages({});
    setSubmitAttempted(false);
  };

  // ── Photo ──
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) { setPhotoUploadStatus('No file selected.'); return; }
    if (!['image/jpeg','image/jpg','image/png'].includes(file.type)) { setPhotoUploadStatus('Please upload JPG, JPEG, or PNG.'); return; }
    if (file.size > 4*1024*1024) { setPhotoUploadStatus('File size exceeds 4MB limit.'); return; }
    setPhoto(file); setPhotoUrl(URL.createObjectURL(file));
    setPhotoUploadStatus('File selected. Click "Upload Photo" to submit.'); setPhotoUploaded(false);
    setFormData(prev => ({ ...prev, photoFileId:0 }));
  };
  const handlePhotoUploadSubmit = async () => {
    if (!photo) { setPhotoUploadStatus('Please select a photo first.'); return; }
    setIsPhotoUploading(true); setPhotoUploadStatus('Uploading photo...');
    try {
      const res = await uploadPhoto(photo);
      setFormData(prev => ({ ...prev, photoFileId: res.fileId }));
      setPhotoUploadStatus('Photo uploaded successfully!'); setPhotoUploaded(true);
    } catch (err) { setPhotoUploaded(false); setPhotoUploadStatus(`Failed: ${err.message}`); }
    finally { setIsPhotoUploading(false); }
  };
  const handleRemovePhoto = () => {
    setPhoto(null); setPhotoUrl(null); setPhotoUploaded(false); setPhotoUploadStatus('');
    setFormData(prev => ({ ...prev, photoFileId:0 }));
  };

  // ── Multi-Proof Helpers ──
  const handleAddProof = () => {
    setProofList(prev => [...prev, BLANK_PROOF()]);
    setProofFiles(prev => [...prev, null]);
    setProofFileUrls(prev => [...prev, null]);
    setProofFilesUploaded(prev => [...prev, false]);
    setProofUploadStatuses(prev => [...prev, '']);
    setIsProofUploading(prev => [...prev, false]);
    setProofValidationMessages(prev => [...prev, {}]);
  };

  const handleRemoveProof = (index) => {
    if (proofList.length === 1) return;
    setProofList(prev => prev.filter((_, i) => i !== index));
    setProofFiles(prev => prev.filter((_, i) => i !== index));
    setProofFileUrls(prev => prev.filter((_, i) => i !== index));
    setProofFilesUploaded(prev => prev.filter((_, i) => i !== index));
    setProofUploadStatuses(prev => prev.filter((_, i) => i !== index));
    setIsProofUploading(prev => prev.filter((_, i) => i !== index));
    setProofValidationMessages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProofFileUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) { updateProofUploadStatus(index, 'No file selected.'); return; }
    const validTypes = ['image/jpeg','image/jpg','image/png','application/pdf'];
    if (!validTypes.includes(file.type)) { updateProofUploadStatus(index, 'Please upload JPG, JPEG, PNG, or PDF.'); return; }
    if (file.size > 5*1024*1024) { updateProofUploadStatus(index, 'File size exceeds 5MB limit.'); return; }
    setProofFiles(prev => prev.map((f, i) => i === index ? file : f));
    setProofFileUrls(prev => prev.map((u, i) => i === index ? (file.type.startsWith('image/') ? URL.createObjectURL(file) : null) : u));
    updateProofUploadStatus(index, 'File selected. Click "Upload ID Proof" to submit.');
    setProofFilesUploaded(prev => prev.map((v, i) => i === index ? false : v));
    setProofList(prev => prev.map((p, i) => i === index ? { ...p, fileId: 0 } : p));
  };

  const handleProofFileUploadSubmit = async (index) => {
    const file = proofFiles[index];
    if (!file) { updateProofUploadStatus(index, 'Please select a file first.'); return; }
    setIsProofUploading(prev => prev.map((v, i) => i === index ? true : v));
    updateProofUploadStatus(index, 'Uploading ID proof...');
    try {
      const res = await uploadIDProof(file);
      setProofList(prev => prev.map((p, i) => i === index ? { ...p, fileId: res.fileId } : p));
      updateProofUploadStatus(index, 'ID proof uploaded successfully!');
      setProofFilesUploaded(prev => prev.map((v, i) => i === index ? true : v));
    } catch (err) {
      setProofFilesUploaded(prev => prev.map((v, i) => i === index ? false : v));
      updateProofUploadStatus(index, `Failed: ${err.message}`);
    } finally {
      setIsProofUploading(prev => prev.map((v, i) => i === index ? false : v));
    }
  };

  const handleRemoveProofFile = (index) => {
    setProofFiles(prev => prev.map((f, i) => i === index ? null : f));
    setProofFileUrls(prev => prev.map((u, i) => i === index ? null : u));
    setProofFilesUploaded(prev => prev.map((v, i) => i === index ? false : v));
    updateProofUploadStatus(index, '');
    setProofList(prev => prev.map((p, i) => i === index ? { ...p, fileId: 0 } : p));
  };

  const updateProofUploadStatus = (index, msg) => {
    setProofUploadStatuses(prev => prev.map((s, i) => i === index ? msg : s));
  };

  // ── Input Handlers ──
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filtered = filterInput(name, value);
    setFormData(prev => ({ ...prev, [name]: filtered }));
    setValidationMessages(prev => ({ ...prev, [name]: getLiveValidationMessage(name, filtered) }));
  };

  const handleProofInputChange = (index, e) => {
    const { name, value } = e.target;
    const filtered = filterInput(name, value);
    setProofList(prev => prev.map((p, i) => i === index ? { ...p, [name]: filtered } : p));
    setProofValidationMessages(prev => prev.map((msgs, i) =>
      i === index ? { ...msgs, [name]: getLiveValidationMessage(name, filtered) } : msgs
    ));
  };

  const handleBeneficiaryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setBeneficiaryData(prev => ({ ...prev, [name]: checked }));
    } else {
      const filtered = filterInput(name, value);
      setBeneficiaryData(prev => ({ ...prev, [name]: filtered }));
      setBeneficiaryValidationMessages(prev => ({ ...prev, [name]: getLiveValidationMessage(name, filtered) }));
    }
  };

  // ── Multi-shift toggle ──
  const handleShiftToggle = (shiftId) => {
    setSelectedShifts(prev =>
      prev.includes(shiftId) ? prev.filter(id => id !== shiftId) : [...prev, shiftId]
    );
  };

  const handleWorkDayToggle = (dayId) => {
    setSelectedWorkDays(prev => prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId]);
  };

  // ────────────────────────────────────────────────
  // VALIDATE-ALL HELPERS (called on submit attempt)
  // ────────────────────────────────────────────────
  const validateAllStep1 = () => {
    const errors = {};
    STEP1_FIELDS.forEach(field => {
      const val = formData[field] !== undefined ? formData[field] : '';
      const msg = getLiveValidationMessage(field, val);
      if (msg) errors[field] = msg;
    });
    // gender is a number — validate separately
    const genderMsg = getLiveValidationMessage('gender', formData.gender);
    if (genderMsg) errors.gender = genderMsg;
    return errors;
  };

  const validateAllStep2 = () => {
    return proofList.map((proof) => {
      const msgs = {};
      STEP2_PROOF_FIELDS.forEach(field => {
        const val = proof[field] !== undefined ? proof[field] : '';
        const msg = getLiveValidationMessage(field, val);
        if (msg) msgs[field] = msg;
      });
      return msgs;
    });
  };

  const validateAllStep3 = () => {
    const errors = {};
    STEP3_FIELDS.forEach(field => {
      const val = beneficiaryData[field] !== undefined ? beneficiaryData[field] : '';
      const msg = getLiveValidationMessage(field, val);
      if (msg) errors[field] = msg;
    });
    return errors;
  };

  const hasStep1Errors  = (msgs) => Object.values(msgs).some(m => m);
  const hasStep2Errors  = (msgs) => msgs.some(m => Object.values(m).some(v => v));
  const hasStep3Errors  = (msgs) => Object.values(msgs).some(m => m);

  // ── Step Submissions ──
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const errors = validateAllStep1();
    setValidationMessages(errors);
    if (hasStep1Errors(errors)) return;

    setLoading(true); setError(null); setStepSuccess('');
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const payload = {
        clinicId, branchId,
        employeeCode: formData.employeeCode.trim(),
        firstName: formData.firstName.trim(), lastName: formData.lastName.trim(),
        gender: Number(formData.gender), birthDate: formData.birthDate,
        bloodGroup: Number(formData.bloodGroup), maritalStatus: Number(formData.maritalStatus),
        address: formData.address.trim(), mobile: formData.mobile.trim(),
        altMobile: formData.altMobile.trim(), email: formData.email.trim(),
        departmentId: Number(formData.departmentId), designation: Number(formData.designation),
        qualification: formData.qualification.trim(), specialization: formData.specialization.trim(),
        licenseNo: formData.licenseNo.trim(), licenseExpiryDate: formData.licenseExpiryDate,
        experienceYears: Number(formData.experienceYears), universityName: formData.universityName.trim(),
        pfNo: formData.pfNo.trim(), esiNo: formData.esiNo.trim(),
        shiftId: 0, photoFileId: Number(formData.photoFileId),
      };

      let result;
      if (createdEmployeeId) {
        result = await updateEmployee({ ...payload, employeeId: createdEmployeeId });
      } else {
        result = await addEmployee(payload);
        setCreatedEmployeeId(result.employeeId);
      }

      setStepSuccess('Employee information saved successfully!');
      setTimeout(() => { setStepSuccess(''); setSubmitAttempted(false); setCurrentStep(2); }, 1000);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const proofErrors = validateAllStep2();
    setProofValidationMessages(proofErrors);
    if (hasStep2Errors(proofErrors)) return;

    setLoading(true); setError(null); setStepSuccess('');
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const updatedSavedIds = [...savedProofIds];

      for (let i = 0; i < proofList.length; i++) {
        const proof = proofList[i];
        const payload = {
          clinicId, branchId, employeeId: createdEmployeeId,
          proofType: Number(proof.proofType),
          idNumber: proof.idNumber.trim(),
          detail: proof.detail.trim(),
          expiryDate: proof.expiryDate,
          fileId: Number(proof.fileId),
        };

        if (updatedSavedIds[i]) {
          await updateEmployeeProof({ ...payload, proofId: updatedSavedIds[i] });
        } else {
          const result = await addEmployeeProof(payload);
          if (result?.proofId) updatedSavedIds[i] = result.proofId;
        }
      }

      setSavedProofIds(updatedSavedIds);
      setStepSuccess(`${proofList.length} ID proof(s) saved successfully!`);
      setTimeout(() => { setStepSuccess(''); setSubmitAttempted(false); setCurrentStep(3); }, 1000);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    const errors = validateAllStep3();
    setBeneficiaryValidationMessages(errors);
    if (hasStep3Errors(errors)) return;

    setLoading(true); setError(null); setStepSuccess('');
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const payload = {
        ClinicID: clinicId, BranchID: branchId, EmployeeID: createdEmployeeId,
        AccountHolderName: beneficiaryData.AccountHolderName.trim(),
        AccountNo: beneficiaryData.AccountNo.trim(), IFSCCode: beneficiaryData.IFSCCode.trim(),
        BankName: beneficiaryData.BankName.trim(), BankAddress: beneficiaryData.BankAddress.trim(),
        IsDefault: beneficiaryData.IsDefault ? 1 : 0,
      };

      if (savedBeneficiaryId) {
        await updateEmployeeBeneficiaryAccount({ ...payload, BeneficiaryID: savedBeneficiaryId });
      } else {
        const result = await addEmployeeBeneficiaryAccount(payload);
        if (result?.beneficiaryId) setSavedBeneficiaryId(result.beneficiaryId);
      }

      setStepSuccess('Bank account saved successfully!');
      setTimeout(() => { setStepSuccess(''); setSubmitAttempted(false); setCurrentStep(4); }, 1000);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  };

  const handleStep4Submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setStepSuccess('');
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      for (const shiftId of selectedShifts) {
        await addEmployeeShift({ ClinicID: clinicId, EmployeeID: createdEmployeeId, ShiftID: Number(shiftId) });
      }
      for (const dayId of selectedWorkDays) {
        await addWorkDays({ ClinicID: clinicId, EmployeeID: createdEmployeeId, WorkDay: dayId });
      }
      setStepSuccess('Shift & workdays assigned successfully!');
      setTimeout(() => { onSuccess?.(); onClose(); }, 1500);
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null); setStepSuccess('');
      setSubmitAttempted(false);
    }
  };
  const handleSkipStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setError(null); setStepSuccess('');
      setSubmitAttempted(false);
    } else { onSuccess?.(); onClose(); }
  };

  if (!isOpen) return null;

  // ── Inline validation message component ──
  const ValidationMsg = ({ field, msgs }) =>
    msgs[field] ? <span className={styles.validationMsg}>{msgs[field]}</span> : null;

  // ── Derived disabled flags per step ──
  const step1SubmitDisabled = submitAttempted && hasStep1Errors(validationMessages);
  const step2SubmitDisabled = submitAttempted && hasStep2Errors(proofValidationMessages);
  const step3SubmitDisabled = submitAttempted && hasStep3Errors(beneficiaryValidationMessages);

  // ── Step Configs ──
  const STEPS = [
    { label: 'Basic Info',       icon: <FiUser size={14} /> },
    { label: 'ID Proof',         icon: <FiShield size={14} /> },
    { label: 'Bank Account',     icon: <FiCreditCard size={14} /> },
    { label: 'Shift & Workdays', icon: <FiClock size={14} /> },
  ];

  // ── Footer ──
  const renderFooter = (submitLabel, isFirst = false, isLast = false, submitDisabled = false) => (
    <div className={styles.footer}>
      {!isFirst && (
        <button type="button" onClick={handlePrevious} className={styles.btnSecondary} disabled={loading}>
          Previous
        </button>
      )}
      {isFirst && (
        <button type="button" onClick={handleClose} className={styles.btnCancel} disabled={loading}>
          Cancel
        </button>
      )}
      {!isFirst && (
        <button type="button" onClick={handleSkipStep} className={styles.btnSkip} disabled={loading}>
          {isLast ? 'Skip & Finish' : 'Skip'}
        </button>
      )}
      <button type="submit" className={styles.btnSubmit} disabled={loading || submitDisabled}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </div>
  );

  const handleClose = () => { resetForm(); onClose(); };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2>Add New Employee</h2>
            <p className={styles.subtitle}>
              Step {currentStep} of 4 — {STEPS[currentStep - 1].label}
              {createdEmployeeId && <span className={styles.idBadge}> · ID: {createdEmployeeId}</span>}
            </p>
          </div>
          <button onClick={handleClose} className={styles.closeBtn}><FiX size={22} /></button>
        </div>

        {/* ── Step Indicator ── */}
        <div className={styles.stepBar}>
          {STEPS.map((s, i) => (
            <div key={i} className={`${styles.stepItem} ${currentStep === i+1 ? styles.stepActive : ''} ${currentStep > i+1 ? styles.stepDone : ''}`}>
              <div className={styles.stepCircle}>
                {currentStep > i+1 ? '✓' : i+1}
              </div>
              <span className={styles.stepLabel}>{s.label}</span>
              {i < STEPS.length - 1 && <div className={`${styles.stepConnector} ${currentStep > i+1 ? styles.stepConnectorDone : ''}`} />}
            </div>
          ))}
        </div>

        <ErrorHandler error={error} />
        {stepSuccess && <div className={styles.successBanner}>{stepSuccess}</div>}

        {/* ────────── STEP 1 ────────── */}
        {currentStep === 1 && (
          <form className={styles.form} onSubmit={handleStep1Submit}>
            <div className={styles.body}>

              {/* Photo Upload */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}><h3><FiUpload size={15}/> Photo Upload</h3></div>
                <div className={styles.photoUploadContainer}>
                  <div className={styles.photoPreviewSection}>
                    {photoUrl ? (
                      <div className={styles.photoPreview}>
                        <img src={photoUrl} alt="Preview" />
                        <button type="button" onClick={handleRemovePhoto} className={styles.removePhotoBtn}><FiX size={14}/></button>
                      </div>
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        <FiUpload size={36}/>
                        <p>No photo selected</p>
                      </div>
                    )}
                  </div>
                  <div className={styles.photoUploadControls}>
                    <input type="file" id="photoInput" accept="image/jpeg,image/jpg,image/png" onChange={handlePhotoUpload} style={{display:'none'}}/>
                    <label htmlFor="photoInput" className={styles.btnSelectFile}>Select Photo</label>
                    {photo && !photoUploaded && (
                      <button type="button" onClick={handlePhotoUploadSubmit} disabled={isPhotoUploading} className={styles.btnUploadFile}>
                        {isPhotoUploading ? 'Uploading...' : 'Upload Photo'}
                      </button>
                    )}
                    {photoUploadStatus && (
                      <p className={`${styles.fileStatus} ${photoUploaded ? styles.fileStatusSuccess : styles.fileStatusInfo}`}>{photoUploadStatus}</p>
                    )}
                    <p className={styles.fileHint}>JPG, JPEG or PNG · Max 4MB</p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}><h3><FiUser size={15}/> Basic Information</h3></div>
                <div className={styles.formGrid}>

                  {/* EmployeeCode — optional in backend */}
                  <div className={styles.formGroup}>
                    <label>Employee Code</label>
                    <input name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} placeholder="e.g. EMP001" disabled={loading}/>
                    <ValidationMsg field="employeeCode" msgs={validationMessages}/>
                  </div>

                  {/* FirstName — required */}
                  <div className={styles.formGroup}>
                    <label>First Name <span className={styles.required}>*</span></label>
                    <input required name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Enter first name" disabled={loading}/>
                    <ValidationMsg field="firstName" msgs={validationMessages}/>
                  </div>

                  {/* LastName — optional in backend */}
                  <div className={styles.formGroup}>
                    <label>Last Name <span className={styles.required}>*</span></label>
                    <input required name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Enter last name" disabled={loading}/>
                    <ValidationMsg field="lastName" msgs={validationMessages}/>
                  </div>

                  {/* Gender — required */}
                  <div className={styles.formGroup}>
                    <label>Gender <span className={styles.required}>*</span></label>
                    <select required name="gender" value={formData.gender} onChange={handleInputChange} disabled={loading}>
                      <option value={0}>Select Gender</option>
                      {GENDER_OPTIONS.map(g=><option key={g.id} value={g.id}>{g.label}</option>)}
                    </select>
                    <ValidationMsg field="gender" msgs={validationMessages}/>
                  </div>

                  {/* BirthDate — required */}
                  <div className={styles.formGroup}>
                    <label>Birth Date <span className={styles.required}>*</span></label>
                    <input required type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} max={getMaxBirthDate()} disabled={loading}/>
                    <ValidationMsg field="birthDate" msgs={validationMessages}/>
                  </div>

                  {/* BloodGroup — optional */}
                  <div className={styles.formGroup}>
                    <label>Blood Group</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} disabled={loading}>
                      <option value={0}>Select Blood Group</option>
                      {BLOOD_GROUP_OPTIONS.map(bg=><option key={bg.id} value={bg.id}>{bg.label}</option>)}
                    </select>
                  </div>

                  {/* MaritalStatus — optional */}
                  <div className={styles.formGroup}>
                    <label>Marital Status</label>
                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} disabled={loading}>
                      <option value={0}>Select Status</option>
                      {MARITAL_STATUS_OPTIONS.map(ms=><option key={ms.id} value={ms.id}>{ms.label}</option>)}
                    </select>
                  </div>

                </div>
              </div>

              {/* Contact Information */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}><h3>📞 Contact Information</h3></div>
                <div className={styles.formGrid}>

                  {/* Address — required */}
                  <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                    <label>Address <span className={styles.required}>*</span></label>
                    <textarea required name="address" rows={2} value={formData.address} onChange={handleInputChange} placeholder="Enter address" disabled={loading}/>
                    <ValidationMsg field="address" msgs={validationMessages}/>
                  </div>

                  {/* Mobile — required */}
                  <div className={styles.formGroup}>
                    <label>Mobile <span className={styles.required}>*</span></label>
                    <input required name="mobile" value={formData.mobile} onChange={handleInputChange} maxLength="10" placeholder="10-digit number" disabled={loading}/>
                    <ValidationMsg field="mobile" msgs={validationMessages}/>
                  </div>

                  {/* AltMobile — optional */}
                  <div className={styles.formGroup}>
                    <label>Alternate Mobile <span className={styles.required}>*</span></label>
                    <input required name="altMobile" value={formData.altMobile} onChange={handleInputChange} maxLength="10" placeholder="10-digit number" disabled={loading}/>
                    <ValidationMsg field="altMobile" msgs={validationMessages}/>
                  </div>

                  {/* Email — optional */}
                  <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                    <label>Email <span className={styles.required}>*</span></label>
                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Enter email address" disabled={loading}/>
                    <ValidationMsg field="email" msgs={validationMessages}/>
                  </div>

                </div>
              </div>

              {/* Professional Information */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}><h3>🏥 Professional Information</h3></div>
                <div className={styles.formGrid}>

                  {/* DepartmentID — optional in backend */}
                  <div className={styles.formGroup}>
                    <label>Department <span className={styles.required}>*</span></label>
                    <select name="departmentId" value={formData.departmentId} onChange={handleInputChange} disabled={loading} required>
                      <ValidationMsg field="department" msgs={validationMessages}/>
                      <option value="">Select Department</option>
                      {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  {/* Designation — optional in backend */}
                  <div className={styles.formGroup}>
                    <label>Designation <span className={styles.required}>*</span></label>
                    <select required name="designation" value={formData.designation} onChange={handleInputChange} disabled={loading} >
                      <ValidationMsg field="designation" msgs={validationMessages}/>
                      <option value="">Select Designation</option>
                      {DESIGNATION_OPTIONS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Qualification</label>
                    <input name="qualification" value={formData.qualification} onChange={handleInputChange} placeholder="e.g. MBBS, B.Pharm" disabled={loading}/>
                    <ValidationMsg field="qualification" msgs={validationMessages}/>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Specialization</label>
                    <input name="specialization" value={formData.specialization} onChange={handleInputChange} placeholder="Area of specialization" disabled={loading}/>
                    <ValidationMsg field="specialization" msgs={validationMessages}/>
                  </div>

                  <div className={styles.formGroup}>
                    <label>License Number</label>
                    <input name="licenseNo" value={formData.licenseNo} onChange={handleInputChange} placeholder="Enter license no." disabled={loading}/>
                    <ValidationMsg field="licenseNo" msgs={validationMessages}/>
                  </div>

                  <div className={styles.formGroup}>
                    <label>License Expiry</label>
                    <input type="date" name="licenseExpiryDate" value={formData.licenseExpiryDate} onChange={handleInputChange} min={getTodayDate()} disabled={loading}/>
                    <ValidationMsg field="licenseExpiryDate" msgs={validationMessages}/>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Experience (Years)</label>
                    <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleInputChange} min="0" disabled={loading}/>
                    <ValidationMsg field="experienceYears" msgs={validationMessages}/>
                  </div>

                  <div className={styles.formGroup}>
                    <label>University Name</label>
                    <input name="universityName" value={formData.universityName} onChange={handleInputChange} placeholder="Enter university name" disabled={loading}/>
                    <ValidationMsg field="universityName" msgs={validationMessages}/>
                  </div>

                  <div className={styles.formGroup}>
                    <label>PF Number</label>
                    <input name="pfNo" value={formData.pfNo} onChange={handleInputChange} placeholder="Enter PF number" disabled={loading}/>
                    <ValidationMsg field="pfNo" msgs={validationMessages}/>
                  </div>

                  <div className={styles.formGroup}>
                    <label>ESI Number</label>
                    <input name="esiNo" value={formData.esiNo} onChange={handleInputChange} placeholder="Enter ESI number" disabled={loading}/>
                    <ValidationMsg field="esiNo" msgs={validationMessages}/>
                  </div>

                </div>
              </div>

            </div>
            {renderFooter('Save & Next', true, false, step1SubmitDisabled)}
          </form>
        )}

        {/* ────────── STEP 2 ────────── */}
        {currentStep === 2 && (
          <form className={styles.form} onSubmit={handleStep2Submit}>
            <div className={styles.body}>
              <div className={styles.formSection}>

                <div className={styles.formSectionHeader}>
                  <div className={styles.sectionHeaderRow}>
                    <h3><FiShield size={15}/> Employee ID Proof</h3>
                    <button
                      type="button"
                      className={styles.btnAddProof}
                      onClick={handleAddProof}
                      disabled={loading}
                    >
                      <FiPlus size={14}/> Add Proof
                    </button>
                  </div>
                </div>

                {proofList.map((proof, index) => (
                  <div key={index} className={styles.proofCard}>
                    <div className={styles.proofCardHeader}>
                      <span className={styles.proofCardTitle}>
                        <FiShield size={13}/> Proof {index + 1}
                      </span>
                      {proofList.length > 1 && (
                        <button
                          type="button"
                          className={styles.btnRemoveProof}
                          onClick={() => handleRemoveProof(index)}
                          disabled={loading}
                          title="Remove this proof"
                        >
                          <FiTrash2 size={14}/>
                        </button>
                      )}
                    </div>

                    {/* File Upload */}
                    <div className={styles.photoUploadContainer}>
                      <div className={styles.photoPreviewSection}>
                        {proofFileUrls[index] ? (
                          <div className={styles.photoPreview}>
                            <img src={proofFileUrls[index]} alt={`ID Proof ${index + 1} Preview`}/>
                            <button type="button" onClick={() => handleRemoveProofFile(index)} className={styles.removePhotoBtn}><FiX size={14}/></button>
                          </div>
                        ) : proofFiles[index] && proofFiles[index].type === 'application/pdf' ? (
                          <div className={styles.photoPlaceholder}>
                            <FiUpload size={36}/>
                            <p style={{fontSize:'0.78rem', marginTop:8}}>PDF: {proofFiles[index].name}</p>
                            <button type="button" onClick={() => handleRemoveProofFile(index)} className={styles.removePhotoBtn} style={{position:'relative',marginTop:8}}><FiX size={14}/></button>
                          </div>
                        ) : (
                          <div className={styles.photoPlaceholder}>
                            <FiUpload size={36}/>
                            <p>No file selected</p>
                          </div>
                        )}
                      </div>
                      <div className={styles.photoUploadControls}>
                        <input
                          type="file"
                          id={`proofFileInput_${index}`}
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={(e) => handleProofFileUpload(index, e)}
                          style={{display:'none'}}
                        />
                        <label htmlFor={`proofFileInput_${index}`} className={styles.btnSelectFile}>Select ID Proof File</label>
                        {proofFiles[index] && !proofFilesUploaded[index] && (
                          <button
                            type="button"
                            onClick={() => handleProofFileUploadSubmit(index)}
                            disabled={isProofUploading[index]}
                            className={styles.btnUploadFile}
                          >
                            {isProofUploading[index] ? 'Uploading...' : 'Upload ID Proof'}
                          </button>
                        )}
                        {proofUploadStatuses[index] && (
                          <p className={`${styles.fileStatus} ${proofFilesUploaded[index] ? styles.fileStatusSuccess : styles.fileStatusInfo}`}>
                            {proofUploadStatuses[index]}
                          </p>
                        )}
                        <p className={styles.fileHint}>JPG, JPEG, PNG or PDF · Max 5MB</p>
                      </div>
                    </div>

                    {/* Proof fields */}
                    <div className={styles.formGrid}>

                      {/* ProofType — required */}
                      <div className={styles.formGroup}>
                        <label>Proof Type <span className={styles.required}>*</span></label>
                        <select
                          required
                          name="proofType"
                          value={proof.proofType}
                          onChange={(e) => handleProofInputChange(index, e)}
                          disabled={loading}
                        >
                          <option value={0}>Select Proof Type</option>
                          {ID_PROOF_OPTIONS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                        <ValidationMsg field="proofType" msgs={proofValidationMessages[index] || {}}/>
                      </div>

                      {/* IdNumber — required */}
                      <div className={styles.formGroup}>
                        <label>ID Number <span className={styles.required}>*</span></label>
                        <input
                          required
                          name="idNumber"
                          value={proof.idNumber}
                          onChange={(e) => handleProofInputChange(index, e)}
                          onKeyDown={(e) => {
                            const char = e.key;
                            if (['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter'].includes(char) || e.ctrlKey || e.metaKey) return;
                            if (!/^[A-Za-z0-9]$/.test(char)) e.preventDefault();
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const clean = (e.clipboardData||window.clipboardData).getData('text').toUpperCase().replace(/[^A-Z0-9]/g,'');
                            const start = e.target.selectionStart; const end = e.target.selectionEnd;
                            const newVal = proof.idNumber.substring(0,start)+clean+proof.idNumber.substring(end);
                            handleProofInputChange(index, { target:{ name:'idNumber', value:newVal }});
                          }}
                          placeholder="Enter ID number"
                          disabled={loading}
                        />
                        <ValidationMsg field="idNumber" msgs={proofValidationMessages[index] || {}}/>
                      </div>

                      {/* Detail — optional */}
                      <div className={styles.formGroup}>
                        <label>Detail</label>
                        <input
                          name="detail"
                          value={proof.detail}
                          onChange={(e) => handleProofInputChange(index, e)}
                          placeholder="Additional details (optional)"
                          disabled={loading}
                        />
                        <ValidationMsg field="detail" msgs={proofValidationMessages[index] || {}}/>
                      </div>

                      {/* ExpiryDate — optional */}
                      <div className={styles.formGroup}>
                        <label>Expiry Date <span className={styles.required}>*</span></label>
                        <input
                          required
                          type="date"
                          name="expiryDate"
                          value={proof.expiryDate}
                          onChange={(e) => handleProofInputChange(index, e)}
                          min={getTodayDate()}
                          disabled={loading}
                        />
                        <ValidationMsg field="expiryDate" msgs={proofValidationMessages[index] || {}}/>
                      </div>

                    </div>
                  </div>
                ))}

              </div>
            </div>
            {renderFooter(savedProofIds.length > 0 ? 'Update & Next' : 'Save & Next', false, false, step2SubmitDisabled)}
          </form>
        )}

        {/* ────────── STEP 3 ────────── */}
        {currentStep === 3 && (
          <form className={styles.form} onSubmit={handleStep3Submit}>
            <div className={styles.body}>
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}><h3><FiCreditCard size={15}/> Beneficiary Account Details</h3></div>
                <div className={styles.formGrid}>

                  {/* AccountHolderName — required */}
                  <div className={styles.formGroup}>
                    <label>Account Holder Name <span className={styles.required}>*</span></label>
                    <input required name="AccountHolderName" value={beneficiaryData.AccountHolderName} onChange={handleBeneficiaryInputChange} placeholder="Full account holder name" disabled={loading}/>
                    <ValidationMsg field="AccountHolderName" msgs={beneficiaryValidationMessages}/>
                  </div>

                  {/* AccountNo — required */}
                  <div className={styles.formGroup}>
                    <label>Account Number <span className={styles.required}>*</span></label>
                    <input required name="AccountNo" value={beneficiaryData.AccountNo} onChange={handleBeneficiaryInputChange} placeholder="Enter account number" disabled={loading}/>
                    <ValidationMsg field="AccountNo" msgs={beneficiaryValidationMessages}/>
                  </div>

                  {/* IFSCCode — optional in backend */}
                  <div className={styles.formGroup}>
                    <label>IFSC Code <span className={styles.required}>*</span></label>
                    <input required name="IFSCCode" value={beneficiaryData.IFSCCode} onChange={handleBeneficiaryInputChange} placeholder="e.g. SBIN0001234" maxLength="11" disabled={loading}/>
                    <ValidationMsg field="IFSCCode" msgs={beneficiaryValidationMessages}/>
                  </div>

                  {/* BankName — required */}
                  <div className={styles.formGroup}>
                    <label>Bank Name <span className={styles.required}>*</span></label>
                    <input required name="BankName" value={beneficiaryData.BankName} onChange={handleBeneficiaryInputChange} placeholder="Enter bank name" disabled={loading}/>
                    <ValidationMsg field="BankName" msgs={beneficiaryValidationMessages}/>
                  </div>

                  {/* BankAddress — optional */}
                  <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                    <label>Bank Address</label>
                    <textarea name="BankAddress" rows={2} value={beneficiaryData.BankAddress} onChange={handleBeneficiaryInputChange} placeholder="Enter bank address (optional)" disabled={loading}/>
                    <ValidationMsg field="BankAddress" msgs={beneficiaryValidationMessages}/>
                  </div>

                  {/* IsDefault — required (0 or 1) */}
                  <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" name="IsDefault" checked={beneficiaryData.IsDefault} onChange={handleBeneficiaryInputChange} disabled={loading}/>
                      <span>Set as default account</span>
                    </label>
                  </div>

                </div>
              </div>
            </div>
            {renderFooter(savedBeneficiaryId ? 'Update & Next' : 'Save & Next', false, false, step3SubmitDisabled)}
          </form>
        )}

        {/* ────────── STEP 4 ────────── */}
        {currentStep === 4 && (
          <form className={styles.form} onSubmit={handleStep4Submit}>
            <div className={styles.body}>

              {/* Shift Dropdown */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}>
                  <h3><FiClock size={15}/> Shift Assignment</h3>
                </div>
                {shiftsLoading ? (
                  <p className={styles.formHint}>Loading shifts...</p>
                ) : shifts.length === 0 ? (
                  <p className={styles.formHint}>No shifts available.</p>
                ) : (
                  <>
                    <div className={styles.formGroup} style={{ maxWidth: 360 }}>
                      <label>Select Shifts</label>
                      <ShiftDropdown
                        shifts={shifts}
                        selectedShifts={selectedShifts}
                        onToggle={handleShiftToggle}
                        disabled={loading}
                      />
                    </div>
                    {selectedShifts.length > 0 && (
                      <div className={styles.selectedShiftsTags}>
                        {selectedShifts.map(id => {
                          const shift = shifts.find(s => s.id === id);
                          return shift ? (
                            <span key={id} className={styles.selectedShiftTag}>
                              {shift.shiftName}
                              <button
                                type="button"
                                className={styles.selectedShiftTagRemove}
                                onClick={() => handleShiftToggle(id)}
                                disabled={loading}
                              >
                                <FiX size={11}/>
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    <p className={styles.formHint}>Select one or more shifts for this employee</p>
                  </>
                )}
              </div>

              {/* Work Days */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}><h3>📅 Work Days</h3></div>
                <div className={styles.workDaysGroup}>
                  {WORK_DAYS.map(day=>(
                    <button
                      key={day.id} type="button"
                      onClick={() => handleWorkDayToggle(day.id)}
                      className={`${styles.dayBtn} ${selectedWorkDays.includes(day.id) ? styles.dayBtnActive : ''}`}
                      disabled={loading}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className={styles.formHint} style={{marginTop:8}}>Select the working days for this employee</p>
              </div>

            </div>
            {renderFooter('Save & Finish', false, true)}
          </form>
        )}

      </div>
    </div>
  );
};

export default AddEmployee;