// src/components/ViewEmployee.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FiEdit2, FiTrash2, FiX, FiUpload, FiUser, FiShield, FiCreditCard,
  FiClock, FiPlus, FiChevronDown, FiCheck, FiArrowLeft, FiSave,
  FiAlertTriangle, FiEye,
} from 'react-icons/fi';
import {
  getEmployeeList,
  updateEmployee,
  deleteEmployee,
  uploadPhoto,
  getFile,
  getEmployeeProofList,
  addEmployeeProof,
  updateEmployeeProof,
  deleteEmployeeProof,
  uploadIDProof,
  getEmployeeBeneficiaryAccountList,
  addEmployeeBeneficiaryAccount,
  updateEmployeeBeneficiaryAccount,
  deleteEmployeeBeneficiaryAccount,
  getEmployeeShiftList,
  addEmployeeShift,
  deleteEmployeeShift,
  getWorkDaysList,
  addWorkDays,
  deleteWorkDays,
  getShiftList,
  getDepartmentList,
  getClinicList,                           // ← NEW IMPORT
} from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import styles from './ViewEmployee.module.css';
import { FaClinicMedical } from 'react-icons/fa'; 
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const NAME_REGEX       = /^[A-Za-z\s\.\-']+$/;
const MOBILE_REGEX     = /^[6-9]\d{9}$/;
const IFSC_REGEX       = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NO_REGEX = /^\d{9,18}$/;

// ────────────────────────────────────────────────
// HELPER — fetch fileAccessToken for a given clinicId
// via getClinicList (no localStorage token needed)
// ────────────────────────────────────────────────
const fetchFileAccessToken = async (clinicId) => {
  const clinicList = await getClinicList({ ClinicID: clinicId });
  const clinic = clinicList.find(c => c.id === clinicId);
  if (!clinic?.fileAccessToken) {
    throw new Error('File access token not available for the given clinic.');
  }
  return clinic.fileAccessToken;
};

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
      if (!value || !value.trim()) return 'Alternate Mobile is required';
      if (value.trim().length < 10 || value.trim().length > 10) return 'AltMobile length should be 10';
      if (!MOBILE_REGEX.test(value.trim())) return 'Invalid alternate mobile number';
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
      return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
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
const GENDER_OPTIONS         = [{ id: 1, label: 'Male' }, { id: 2, label: 'Female' }, { id: 3, label: 'Other' }];
const BLOOD_GROUP_OPTIONS    = [{ id: 1, label: 'A+' }, { id: 2, label: 'A-' }, { id: 3, label: 'B+' }, { id: 4, label: 'B-' }, { id: 5, label: 'AB+' }, { id: 6, label: 'AB-' }, { id: 7, label: 'O+' }, { id: 8, label: 'O-' }, { id: 9, label: 'Others' }];
const MARITAL_STATUS_OPTIONS = [{ id: 1, label: 'Single' }, { id: 2, label: 'Married' }, { id: 3, label: 'Widowed' }, { id: 4, label: 'Divorced' }, { id: 5, label: 'Separated' }];
const ID_PROOF_OPTIONS       = [{ id: 1, label: 'Aadhar' }, { id: 2, label: 'Passport' }, { id: 3, label: 'Driving Licence' }, { id: 4, label: 'Voter ID' }, { id: 5, label: 'PAN Card' }];
const DESIGNATION_OPTIONS    = [{ id: 1, label: 'Doctor' }, { id: 2, label: 'Nurse' }, { id: 3, label: 'Receptionist' }, { id: 4, label: 'Pharmacist' }, { id: 5, label: 'Lab Technician' }, { id: 6, label: 'Billing Staff' }, { id: 7, label: 'Manager' }, { id: 8, label: 'Attendant' }, { id: 9, label: 'Cleaner' }, { id: 10, label: 'Others' }];
const WORK_DAYS              = [{ id: 1, label: 'Sun' }, { id: 2, label: 'Mon' }, { id: 3, label: 'Tue' }, { id: 4, label: 'Wed' }, { id: 5, label: 'Thu' }, { id: 6, label: 'Fri' }, { id: 7, label: 'Sat' }];

const TABS = [
  { key: 'basic', label: 'Basic Info',       icon: <FiUser size={14} /> },
  { key: 'proof', label: 'ID Proof',         icon: <FiShield size={14} /> },
  { key: 'bank',  label: 'Bank Account',     icon: <FiCreditCard size={14} /> },
  { key: 'shift', label: 'Shift & Workdays', icon: <FiClock size={14} /> },
];

const BLANK_PROOF       = () => ({ proofType: 0, idNumber: '', detail: '', expiryDate: '', fileId: 0 });
const BLANK_BENEFICIARY = () => ({ AccountHolderName: '', AccountNo: '', IFSCCode: '', BankName: '', BankAddress: '', IsDefault: false });

// ────────────────────────────────────────────────
// SHIFT DROPDOWN
// ────────────────────────────────────────────────
const ShiftDropdown = ({ shifts, selectedShifts, onToggle, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayText = () => {
    if (!selectedShifts.length) return 'Select shifts...';
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
        <FiChevronDown size={16} className={`${styles.shiftDropdownChevron} ${isOpen ? styles.shiftDropdownChevronOpen : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.shiftDropdownMenu}>
          <div className={`${styles.shiftDropdownItem} ${styles.shiftDropdownItemSelectAll}`} onClick={handleSelectAll}>
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
              <div key={shift.id} className={`${styles.shiftDropdownItem} ${isChecked ? styles.shiftDropdownItemChecked : ''}`} onClick={() => onToggle(shift.id)}>
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
// DELETE CONFIRM MODAL
// ────────────────────────────────────────────────
const DeleteConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.deleteOverlay}>
      <div className={styles.deleteModal}>
        <div className={styles.deleteIconWrapper}>
          <FiAlertTriangle size={32} />
        </div>
        <h3 className={styles.deleteTitle}>{title}</h3>
        <p className={styles.deleteMessage}>{message}</p>
        <div className={styles.deleteActions}>
          <button className={styles.deleteCancelBtn} onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={styles.deleteConfirmBtn} onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────
// MAIN COMPONENT — now a popup, receives props instead of useParams
// Props: isOpen, employeeId, onClose, onDeleted
// ────────────────────────────────────────────────
const ViewEmployee = ({ isOpen, employeeId, onClose, onDeleted }) => {
  const id = employeeId; // alias for minimal diff with original logic

  const [activeTab, setActiveTab]     = useState('basic');
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [successMsg, setSuccessMsg]   = useState('');

  // Edit mode per section
  const [editMode, setEditMode] = useState({ basic: false, proof: false, bank: false, shift: false });

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, type: '', targetId: null, title: '', message: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Departments & Shifts
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts]           = useState([]);

  // ── Employee's own ClinicID (used for file access token when viewing files) ──
  const [employeeClinicId, setEmployeeClinicId] = useState(0);

  // ── Basic Info ──
  const [formData, setFormData] = useState({
    employeeCode: '', firstName: '', lastName: '', gender: 0, birthDate: '',
    bloodGroup: 0, maritalStatus: 0, address: '', mobile: '', altMobile: '',
    email: '', departmentId: 0, designation: 0, qualification: '', specialization: '',
    licenseNo: '', licenseExpiryDate: '', experienceYears: 0, universityName: '',
    pfNo: '', esiNo: '', shiftId: 0, photoFileId: 0,
  });
  const [validationMessages, setValidationMessages] = useState({});
  const [photo, setPhoto]                           = useState(null);
  const [photoUrl, setPhotoUrl]                     = useState(null);
  const [photoUploaded, setPhotoUploaded]           = useState(false);
  const [photoUploadStatus, setPhotoUploadStatus]   = useState('');
  const [isPhotoUploading, setIsPhotoUploading]     = useState(false);

  // ── Fetched photo (view mode) ──
  const [fetchedPhotoUrl, setFetchedPhotoUrl]       = useState(null);
  const [photoFetchLoading, setPhotoFetchLoading]   = useState(false);

  // ── Fetched proof images (view mode, per index) ──
  const [fetchedProofUrls, setFetchedProofUrls]     = useState([]);
  const [proofFetchLoading, setProofFetchLoading]   = useState([]);

  // ── Lightbox ──
  const [lightbox, setLightbox] = useState({ open: false, url: null, title: '' });

  // ── Proofs ──
  const [proofList, setProofList]                             = useState([]);
  const [savedProofIds, setSavedProofIds]                     = useState([]);
  const [proofFiles, setProofFiles]                           = useState([]);
  const [proofFileUrls, setProofFileUrls]                     = useState([]);
  const [proofFilesUploaded, setProofFilesUploaded]           = useState([]);
  const [proofUploadStatuses, setProofUploadStatuses]         = useState([]);
  const [isProofUploading, setIsProofUploading]               = useState([]);
  const [proofValidationMessages, setProofValidationMessages] = useState([]);

  // ── Bank ──
  const [beneficiaryList, setBeneficiaryList]                             = useState([]);
  const [savedBeneficiaryIds, setSavedBeneficiaryIds]                     = useState([]);
  const [beneficiaryValidationMessages, setBeneficiaryValidationMessages] = useState([]);

  // ── Shifts & Workdays ──
  const [selectedShifts, setSelectedShifts]       = useState([]);
  const [selectedWorkDays, setSelectedWorkDays]   = useState([]);
  const [existingShiftMaps, setExistingShiftMaps] = useState([]);
  const [existingWorkDays, setExistingWorkDays]   = useState([]);

  // ────────────────────────────────────────────────
  // Reset & load when popup opens or employeeId changes
  useEffect(() => {
    if (!isOpen || !id) return;
    // Reset tab & edit mode on open
    setActiveTab('basic');
    setEditMode({ basic: false, proof: false, bank: false, shift: false });
    setError(null);
    setSuccessMsg('');
    setFetchedPhotoUrl(null);
    setPhotoFetchLoading(false);
    setFetchedProofUrls([]);
    setProofFetchLoading([]);
    setLightbox({ open: false, url: null, title: '' });
    setEmployeeClinicId(0);
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, id]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // ────────────────────────────────────────────────
  const loadAll = async () => {
    setPageLoading(true);
    setPageError(null);
    try {
      const clinicId   = await getStoredClinicId();
      const branchId   = await getStoredBranchId();
      const employeeId = Number(id);

      const [empList, deptList, shiftList, proofs, beneficiaries, empShifts, workDays] = await Promise.all([
        getEmployeeList(clinicId, { BranchID: branchId, EmployeeID: employeeId }),
        getDepartmentList(clinicId, branchId, {}),
        getShiftList(clinicId, { Status: 1 }),
        getEmployeeProofList(clinicId, { BranchID: branchId, EmployeeID: employeeId }),
        getEmployeeBeneficiaryAccountList(clinicId, { BranchID: branchId, EmployeeID: employeeId }),
        getEmployeeShiftList(clinicId, { EmployeeID: employeeId }),
        getWorkDaysList(clinicId, employeeId),
      ]);

      const emp = empList.find(e => e.id === employeeId) || empList[0];
      if (!emp) throw new Error('Employee not found');

      // Store the employee's own clinicId for use when fetching files
      setEmployeeClinicId(emp.clinicId || clinicId);

      setDepartments(deptList);
      setShifts(shiftList);

      setFormData({
        employeeCode:      emp.employeeCode      || '',
        firstName:         emp.firstName         || '',
        lastName:          emp.lastName          || '',
        gender:            emp.gender            || 0,
        birthDate:         emp.birthDate         ? emp.birthDate.split('T')[0]         : '',
        bloodGroup:        emp.bloodGroup        || 0,
        maritalStatus:     emp.maritalStatus     || 0,
        address:           emp.address           || '',
        mobile:            emp.mobile            || '',
        altMobile:         emp.altMobile         || '',
        email:             emp.email             || '',
        departmentId:      emp.departmentId      || 0,
        designation:       emp.designation       || 0,
        qualification:     emp.qualification     || '',
        specialization:    emp.specialization    || '',
        licenseNo:         emp.licenseNo         || '',
        licenseExpiryDate: emp.licenseExpiryDate ? emp.licenseExpiryDate.split('T')[0] : '',
        experienceYears:   emp.experienceYears   || 0,
        universityName:    emp.universityName    || '',
        pfNo:              emp.pfNo              || '',
        esiNo:             emp.esiNo             || '',
        shiftId:           emp.shiftId           || 0,
        photoFileId:       emp.photoFileId       || 0,
      });
      if (emp.photoFileId) setPhotoUploaded(true);

      // Proofs
      const pList = proofs.length > 0
        ? proofs.map(p => ({
            proofType:  p.proofType,
            idNumber:   p.idNumber   || '',
            detail:     p.detail     || '',
            expiryDate: p.expiryDate ? p.expiryDate.split('T')[0] : '',
            fileId:     p.fileId     || 0,
          }))
        : [BLANK_PROOF()];
      const pIds = proofs.length > 0 ? proofs.map(p => p.proofId) : [null];
      setProofList(pList);
      setSavedProofIds(pIds);
      setProofFiles(pList.map(() => null));
      setProofFileUrls(pList.map(() => null));
      setProofFilesUploaded(pList.map(() => false));
      setProofUploadStatuses(pList.map(() => ''));
      setIsProofUploading(pList.map(() => false));
      setProofValidationMessages(pList.map(() => ({})));

      // Beneficiaries
      const bList = beneficiaries.length > 0
        ? beneficiaries.map(b => ({
            AccountHolderName: b.accountHolderName || '',
            AccountNo:         b.accountNo         || '',
            IFSCCode:          b.ifscCode          || '',
            BankName:          b.bankName          || '',
            BankAddress:       b.bankAddress       || '',
            IsDefault:         b.isDefault         || false,
          }))
        : [BLANK_BENEFICIARY()];
      const bIds = beneficiaries.length > 0 ? beneficiaries.map(b => b.beneficiaryId) : [null];
      setBeneficiaryList(bList);
      setSavedBeneficiaryIds(bIds);
      setBeneficiaryValidationMessages(bList.map(() => ({})));

      // Shifts & workdays
      setExistingShiftMaps(empShifts.map(s => ({ shiftMapId: s.shiftMapId, shiftId: s.shiftId })));
      setSelectedShifts(empShifts.map(s => s.shiftId));
      setExistingWorkDays(workDays.map(d => ({ id: d.id, workDay: d.workDay })));
      setSelectedWorkDays(workDays.map(d => d.workDay));

    } catch (err) {
      setPageError(err);
    } finally {
      setPageLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ── Photo Upload ──
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) { setPhotoUploadStatus('Please upload JPG, JPEG, or PNG.'); return; }
    if (file.size > 4 * 1024 * 1024) { setPhotoUploadStatus('File size exceeds 4MB limit.'); return; }
    setPhoto(file); setPhotoUrl(URL.createObjectURL(file));
    setPhotoUploadStatus('File selected. Click "Upload Photo" to submit.');
    setPhotoUploaded(false);
    setFormData(prev => ({ ...prev, photoFileId: 0 }));
  };

  // ── MODIFIED: fetch fileAccessToken via getClinicList before uploading photo ──
  const handlePhotoUploadSubmit = async () => {
    if (!photo) return;
    setIsPhotoUploading(true); setPhotoUploadStatus('Uploading...');
    try {
      const clinicId = await getStoredClinicId();

      const fileAccessToken = await fetchFileAccessToken(clinicId);
      const res = await uploadPhoto(clinicId, photo, fileAccessToken);

      setFormData(prev => ({ ...prev, photoFileId: res.fileId }));
      setPhotoUploadStatus('Photo uploaded!'); setPhotoUploaded(true);
    } catch (err) { setPhotoUploadStatus(`Failed: ${err.message}`); }
    finally { setIsPhotoUploading(false); }
  };

  const handleRemovePhoto = () => {
    setPhoto(null); setPhotoUrl(null); setPhotoUploaded(false); setPhotoUploadStatus('');
    setFormData(prev => ({ ...prev, photoFileId: 0 }));
  };

  // ── MODIFIED: fetch fileAccessToken using the employee's own clinicId (not localStorage) ──
  const handleViewPhoto = async () => {
    if (!formData.photoFileId || formData.photoFileId <= 0) return;
    setPhotoFetchLoading(true);
    try {
      const clinicId = await getStoredClinicId();

      const fileAccessToken = await fetchFileAccessToken(employeeClinicId);

      const res = await getFile(clinicId, formData.photoFileId, fileAccessToken);

      setFetchedPhotoUrl(res.url);
      setLightbox({ open: true, url: res.url, title: 'Employee Photo' });
    } catch (err) {
      console.error('Failed to load photo:', err);
    } finally {
      setPhotoFetchLoading(false);
    }
  };

  // ── MODIFIED: fetch fileAccessToken using the employee's own clinicId (not localStorage) ──
  const handleViewProofFile = async (index, fileId) => {
    if (!fileId || fileId <= 0) return;
    setProofFetchLoading(prev => { const a = [...prev]; a[index] = true; return a; });
    try {
      const clinicId = await getStoredClinicId();

      const fileAccessToken = await fetchFileAccessToken(employeeClinicId);

      const res = await getFile(clinicId, fileId, fileAccessToken);

      setFetchedProofUrls(prev => { const a = [...prev]; a[index] = res.url; return a; });
      setLightbox({ open: true, url: res.url, title: `Proof ${index + 1}` });
    } catch (err) {
      console.error('Failed to load proof file:', err);
    } finally {
      setProofFetchLoading(prev => { const a = [...prev]; a[index] = false; return a; });
    }
  };

  const closeLightbox = () => setLightbox({ open: false, url: null, title: '' });

  // ── Basic Info ──
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filtered = filterInput(name, value);
    setFormData(prev => ({ ...prev, [name]: filtered }));
    setValidationMessages(prev => ({ ...prev, [name]: getLiveValidationMessage(name, filtered) }));
  };

  const handleBasicSave = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await updateEmployee({
        employeeId: Number(id), clinicId, branchId,
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
      });
      setEditMode(prev => ({ ...prev, basic: false }));
      showSuccess('Basic information updated successfully!');
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  };

  // ── Delete Employee ──
  const handleDeleteEmployee = () => {
    setDeleteConfirm({
      open: true, type: 'employee', targetId: Number(id),
      title: 'Delete Employee',
      message: `Are you sure you want to delete ${formData.firstName} ${formData.lastName}? This action cannot be undone.`,
    });
  };

  // ── Proofs ──
  const handleAddProof = () => {
    setProofList(prev => [...prev, BLANK_PROOF()]);
    setSavedProofIds(prev => [...prev, null]);
    setProofFiles(prev => [...prev, null]);
    setProofFileUrls(prev => [...prev, null]);
    setProofFilesUploaded(prev => [...prev, false]);
    setProofUploadStatuses(prev => [...prev, '']);
    setIsProofUploading(prev => [...prev, false]);
    setProofValidationMessages(prev => [...prev, {}]);
  };

  const handleRemoveProofRow = (index) => {
    const proofId = savedProofIds[index];
    if (proofId) {
      setDeleteConfirm({ open: true, type: 'proof', targetId: proofId, title: 'Delete ID Proof', message: 'Are you sure you want to delete this ID proof record?' });
    } else {
      removeProofFromState(index);
    }
  };

  const removeProofFromState = (index) => {
    setProofList(prev => prev.filter((_, i) => i !== index));
    setSavedProofIds(prev => prev.filter((_, i) => i !== index));
    setProofFiles(prev => prev.filter((_, i) => i !== index));
    setProofFileUrls(prev => prev.filter((_, i) => i !== index));
    setProofFilesUploaded(prev => prev.filter((_, i) => i !== index));
    setProofUploadStatuses(prev => prev.filter((_, i) => i !== index));
    setIsProofUploading(prev => prev.filter((_, i) => i !== index));
    setProofValidationMessages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProofInputChange = (index, e) => {
    const { name, value } = e.target;
    const filtered = filterInput(name, value);
    setProofList(prev => prev.map((p, i) => i === index ? { ...p, [name]: filtered } : p));
    setProofValidationMessages(prev => prev.map((msgs, i) =>
      i === index ? { ...msgs, [name]: getLiveValidationMessage(name, filtered) } : msgs
    ));
  };

  const handleProofFileUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) { updateProofStatus(index, 'Invalid file type.'); return; }
    if (file.size > 5 * 1024 * 1024) { updateProofStatus(index, 'File exceeds 5MB.'); return; }
    setProofFiles(prev => prev.map((f, i) => i === index ? file : f));
    setProofFileUrls(prev => prev.map((u, i) => i === index ? (file.type.startsWith('image/') ? URL.createObjectURL(file) : null) : u));
    setProofFilesUploaded(prev => prev.map((v, i) => i === index ? false : v));
    setProofList(prev => prev.map((p, i) => i === index ? { ...p, fileId: 0 } : p));
    updateProofStatus(index, 'File selected. Click upload to submit.');
  };

  // ── MODIFIED: fetch fileAccessToken via getClinicList before uploading ID proof ──
  const handleProofFileUploadSubmit = async (index) => {
    const file = proofFiles[index];
    if (!file) return;
    setIsProofUploading(prev => prev.map((v, i) => i === index ? true : v));
    updateProofStatus(index, 'Uploading...');
    try {
      const clinicId = await getStoredClinicId();
      const fileAccessToken = await fetchFileAccessToken(clinicId);
      const res = await uploadIDProof(clinicId, file, fileAccessToken);

      setProofList(prev => prev.map((p, i) => i === index ? { ...p, fileId: res.fileId } : p));
      setProofFilesUploaded(prev => prev.map((v, i) => i === index ? true : v));
      updateProofStatus(index, 'Uploaded successfully!');
    } catch (err) { updateProofStatus(index, `Failed: ${err.message}`); }
    finally { setIsProofUploading(prev => prev.map((v, i) => i === index ? false : v)); }
  };

  const handleRemoveProofFile = (index) => {
    setProofFiles(prev => prev.map((f, i) => i === index ? null : f));
    setProofFileUrls(prev => prev.map((u, i) => i === index ? null : u));
    setProofFilesUploaded(prev => prev.map((v, i) => i === index ? false : v));
    setProofList(prev => prev.map((p, i) => i === index ? { ...p, fileId: 0 } : p));
    updateProofStatus(index, '');
  };

  const updateProofStatus = (index, msg) =>
    setProofUploadStatuses(prev => prev.map((s, i) => i === index ? msg : s));

  const handleProofSave = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const updatedIds = [...savedProofIds];
      for (let i = 0; i < proofList.length; i++) {
        const proof = proofList[i];
        const payload = {
          clinicId, branchId, employeeId: Number(id),
          proofType: Number(proof.proofType), idNumber: proof.idNumber.trim(),
          detail: proof.detail.trim(), expiryDate: proof.expiryDate, fileId: Number(proof.fileId),
        };
        if (updatedIds[i]) {
          await updateEmployeeProof({ ...payload, proofId: updatedIds[i] });
        } else {
          const result = await addEmployeeProof(payload);
          if (result?.proofId) updatedIds[i] = result.proofId;
        }
      }
      setSavedProofIds(updatedIds);
      setEditMode(prev => ({ ...prev, proof: false }));
      showSuccess('ID proof(s) updated successfully!');
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  };

  // ── Bank ──
  const handleAddBeneficiary = () => {
    setBeneficiaryList(prev => [...prev, BLANK_BENEFICIARY()]);
    setSavedBeneficiaryIds(prev => [...prev, null]);
    setBeneficiaryValidationMessages(prev => [...prev, {}]);
  };

  const handleRemoveBeneficiary = (index) => {
    const bId = savedBeneficiaryIds[index];
    if (bId) {
      setDeleteConfirm({ open: true, type: 'beneficiary', targetId: bId, title: 'Delete Bank Account', message: 'Are you sure you want to delete this bank account?' });
    } else {
      removeBeneficiaryFromState(index);
    }
  };

  const removeBeneficiaryFromState = (index) => {
    setBeneficiaryList(prev => prev.filter((_, i) => i !== index));
    setSavedBeneficiaryIds(prev => prev.filter((_, i) => i !== index));
    setBeneficiaryValidationMessages(prev => prev.filter((_, i) => i !== index));
  };

  const handleBeneficiaryInputChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setBeneficiaryList(prev => prev.map((b, i) => i === index ? { ...b, [name]: checked } : b));
    } else {
      const filtered = filterInput(name, value);
      setBeneficiaryList(prev => prev.map((b, i) => i === index ? { ...b, [name]: filtered } : b));
      setBeneficiaryValidationMessages(prev => prev.map((msgs, i) =>
        i === index ? { ...msgs, [name]: getLiveValidationMessage(name, filtered) } : msgs
      ));
    }
  };

  const handleBankSave = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const updatedIds = [...savedBeneficiaryIds];
      for (let i = 0; i < beneficiaryList.length; i++) {
        const b = beneficiaryList[i];
        const payload = {
          ClinicID: clinicId, BranchID: branchId, EmployeeID: Number(id),
          AccountHolderName: b.AccountHolderName.trim(), AccountNo: b.AccountNo.trim(),
          IFSCCode: b.IFSCCode.trim(), BankName: b.BankName.trim(),
          BankAddress: b.BankAddress.trim(), IsDefault: b.IsDefault ? 1 : 0,
        };
        if (updatedIds[i]) {
          await updateEmployeeBeneficiaryAccount({ ...payload, BeneficiaryID: updatedIds[i] });
        } else {
          const result = await addEmployeeBeneficiaryAccount(payload);
          if (result?.beneficiaryId) updatedIds[i] = result.beneficiaryId;
        }
      }
      setSavedBeneficiaryIds(updatedIds);
      setEditMode(prev => ({ ...prev, bank: false }));
      showSuccess('Bank account(s) updated successfully!');
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  };

  // ── Shifts ──
  const handleShiftToggle   = (sid) => setSelectedShifts(prev => prev.includes(sid) ? prev.filter(s => s !== sid) : [...prev, sid]);
  const handleWorkDayToggle = (did) => setSelectedWorkDays(prev => prev.includes(did) ? prev.filter(d => d !== did) : [...prev, did]);

  const handleShiftSave = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const clinicId = await getStoredClinicId();
      for (const map of existingShiftMaps) {
        if (!selectedShifts.includes(map.shiftId)) await deleteEmployeeShift(map.shiftMapId);
      }
      for (const shiftId of selectedShifts) {
        if (!existingShiftMaps.find(m => m.shiftId === shiftId))
          await addEmployeeShift({ ClinicID: clinicId, EmployeeID: Number(id), ShiftID: Number(shiftId) });
      }
      for (const wd of existingWorkDays) {
        if (!selectedWorkDays.includes(wd.workDay)) await deleteWorkDays(wd.id);
      }
      for (const dayId of selectedWorkDays) {
        if (!existingWorkDays.find(d => d.workDay === dayId))
          await addWorkDays({ ClinicID: clinicId, EmployeeID: Number(id), WorkDay: dayId });
      }
      const [empShifts, workDays] = await Promise.all([
        getEmployeeShiftList(clinicId, { EmployeeID: Number(id) }),
        getWorkDaysList(clinicId, Number(id)),
      ]);
      setExistingShiftMaps(empShifts.map(s => ({ shiftMapId: s.shiftMapId, shiftId: s.shiftId })));
      setExistingWorkDays(workDays.map(d => ({ id: d.id, workDay: d.workDay })));
      setEditMode(prev => ({ ...prev, shift: false }));
      showSuccess('Shift & workdays updated successfully!');
    } catch (err) { setError(err); }
    finally { setLoading(false); }
  };

  // ── Delete confirm ──
  const handleDeleteConfirm = async () => {
    const { type, targetId } = deleteConfirm;
    setDeleteLoading(true);
    try {
      if (type === 'employee') {
        await deleteEmployee(targetId);
        setDeleteConfirm({ open: false });
        if (onDeleted) onDeleted();
        return;
      }
      if (type === 'proof') {
        await deleteEmployeeProof(targetId);
        const idx = savedProofIds.indexOf(targetId);
        if (idx !== -1) removeProofFromState(idx);
        showSuccess('ID proof deleted.');
      }
      if (type === 'beneficiary') {
        await deleteEmployeeBeneficiaryAccount(targetId);
        const idx = savedBeneficiaryIds.indexOf(targetId);
        if (idx !== -1) removeBeneficiaryFromState(idx);
        showSuccess('Bank account deleted.');
      }
      setDeleteConfirm({ open: false });
    } catch (err) {
      setError(err);
      setDeleteConfirm({ open: false });
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelEdit = (key) => {
    setEditMode(prev => ({ ...prev, [key]: false }));
    loadAll();
    setError(null);
  };

  // ── Inline validation message component ──
  const ValidationMsg = ({ field, msgs }) =>
    msgs[field] ? <span className={styles.validationMsg}>{msgs[field]}</span> : null;

  const currentShiftNames   = existingShiftMaps.map(m => shifts.find(s => s.id === m.shiftId)?.shiftName).filter(Boolean);
  const currentWorkDayNames = existingWorkDays.map(d => WORK_DAYS.find(w => w.id === d.workDay)?.label).filter(Boolean);

  // ────────────────────────────────────────────────
  // Handle backdrop click to close
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // ────────────────────────────────────────────────
  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>

        {/* ── Gradient Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.empAvatar}>
              {formData.firstName?.charAt(0).toUpperCase() || 'E'}
            </div>
            <div className={styles.headerContent}>
              <h2>{pageLoading ? 'Loading...' : `${formData.firstName} ${formData.lastName}`}</h2>
              </div>
              </div>
              <div className={styles.clinicNameone}>
                             <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />  
                               {localStorage.getItem('clinicName') || '—'}
                          </div>
          
            <button className={styles.closeBtn} onClick={onClose}>
              <FiX size={18} />
            </button>
          </div>
        

        {/* ── Tab Bar ── */}
        {!pageLoading && !pageError && (
          <div className={styles.tabBar}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
                onClick={() => { setActiveTab(tab.key); setError(null); setSuccessMsg(''); }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          
        <div className={styles.headerRight}>
            {!pageLoading && !pageError && (
              <button className={styles.deleteEmpBtn} onClick={handleDeleteEmployee}>
                <FiTrash2 size={14} /> Delete
              </button>
            )}
            </div>
            </div>
        )}

        {/* ── Success Banner ── */}
        {successMsg && <div className={styles.successBanner}>{successMsg}</div>}

        {/* ── Content Area ── */}
        <div className={styles.contentArea}>

          {/* Loading State */}
          {pageLoading && (
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <p>Loading employee details...</p>
            </div>
          )}

          {/* Error State */}
          {pageError && !pageLoading && (
            <div className={styles.errorState}>
              <ErrorHandler error={pageError} />
            </div>
          )}

          {/* Error inline */}
          {error && !pageLoading && !pageError && <ErrorHandler error={error} />}

          {/* ══════════ BASIC INFO ══════════ */}
          {!pageLoading && !pageError && activeTab === 'basic' && (
            <form onSubmit={handleBasicSave}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}><FiUser size={15} /> Basic Information</h3>
                <div className={styles.sectionActions}>
                  {editMode.basic ? (
                    <>
                      <button type="button" className={styles.btnCancelEdit} onClick={() => cancelEdit('basic')} disabled={loading}><FiX size={14} /> Cancel</button>
                      <button type="submit" className={styles.btnSave} disabled={loading}><FiSave size={14} /> {loading ? 'Saving...' : 'Save Changes'}</button>
                    </>
                  ) : (
                    <button type="button" className={styles.btnEdit} onClick={() => setEditMode(prev => ({ ...prev, basic: true }))}><FiEdit2 size={14} /> Edit</button>
                  )}
                </div>
              </div>

              <div className={styles.body}>
                {/* Photo */}
                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}><h3><FiUpload size={15} /> Photo</h3></div>
                  <div className={styles.photoUploadContainer}>
                    <div className={styles.photoPreviewSection}>
                      {/* View mode: show fetched photo if available */}
                      {!editMode.basic && fetchedPhotoUrl ? (
                        <div className={styles.photoPreview}>
                          <img src={fetchedPhotoUrl} alt="Employee" />
                        </div>
                      ) : photoUrl ? (
                        <div className={styles.photoPreview}>
                          <img src={photoUrl} alt="Preview" />
                          {editMode.basic && <button type="button" onClick={handleRemovePhoto} className={styles.removePhotoBtn}><FiX size={14} /></button>}
                        </div>
                      ) : (
                        <div className={styles.photoPlaceholder}>
                          <FiUser size={36} />
                          <p>{formData.photoFileId ? 'Photo on file' : 'No photo'}</p>
                        </div>
                      )}
                    </div>
                    {/* View mode: show View Photo button */}
                    {!editMode.basic && formData.photoFileId > 0 && !fetchedPhotoUrl && (
                      <div className={styles.photoUploadControls}>
                        <button
                          type="button"
                          onClick={handleViewPhoto}
                          disabled={photoFetchLoading}
                          className={styles.btnViewFile}
                        >
                          <FiEye size={15} />
                          {photoFetchLoading ? 'Loading...' : 'View Photo'}
                        </button>
                      </div>
                    )}
                    {editMode.basic && (
                      <div className={styles.photoUploadControls}>
                        <input type="file" id="photoInput" accept="image/jpeg,image/jpg,image/png" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                        <label htmlFor="photoInput" className={styles.btnSelectFile}>Select Photo</label>
                        {photo && !photoUploaded && <button type="button" onClick={handlePhotoUploadSubmit} disabled={isPhotoUploading} className={styles.btnUploadFile}>{isPhotoUploading ? 'Uploading...' : 'Upload Photo'}</button>}
                        {photoUploadStatus && <p className={`${styles.fileStatus} ${photoUploaded ? styles.fileStatusSuccess : styles.fileStatusInfo}`}>{photoUploadStatus}</p>}
                        <p className={styles.fileHint}>JPG, JPEG or PNG · Max 4MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal */}
                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}><h3><FiUser size={15} /> Personal Information</h3></div>
                  <div className={styles.formGrid}>

                    <div className={styles.formGroup}>
                      <label>Employee Code</label>
                      <input name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="employeeCode" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>First Name <span className={styles.required}>*</span></label>
                      <input required name="firstName" value={formData.firstName} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="firstName" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Last Name <span className={styles.required}>*</span></label>
                      <input required name="lastName" value={formData.lastName} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="lastName" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Gender <span className={styles.required}>*</span></label>
                      <select required name="gender" value={formData.gender} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''}>
                        <option value={0}>Select Gender</option>
                        {GENDER_OPTIONS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                      </select>
                      <ValidationMsg field="gender" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Birth Date <span className={styles.required}>*</span></label>
                      <input required type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} max={getMaxBirthDate()} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="birthDate" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Blood Group</label>
                      <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''}>
                        <option value={0}>Select Blood Group</option>
                        {BLOOD_GROUP_OPTIONS.map(bg => <option key={bg.id} value={bg.id}>{bg.label}</option>)}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Marital Status</label>
                      <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''}>
                        <option value={0}>Select Status</option>
                        {MARITAL_STATUS_OPTIONS.map(ms => <option key={ms.id} value={ms.id}>{ms.label}</option>)}
                      </select>
                    </div>

                  </div>
                </div>

                {/* Contact */}
                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}><h3>📞 Contact Information</h3></div>
                  <div className={styles.formGrid}>

                    <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                      <label>Address <span className={styles.required}>*</span></label>
                      <textarea required name="address" rows={2} value={formData.address} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="address" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Mobile <span className={styles.required}>*</span></label>
                      <input required name="mobile" value={formData.mobile} onChange={handleInputChange} maxLength="10" disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="mobile" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Alternate Mobile <span className={styles.required}>*</span></label>
                      <input required name="altMobile" value={formData.altMobile} onChange={handleInputChange} maxLength="10" disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="altMobile" msgs={validationMessages} />
                    </div>

                    <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                      <label>Email <span className={styles.required}>*</span></label>
                      <input required type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="email" msgs={validationMessages} />
                    </div>

                  </div>
                </div>

                {/* Professional */}
                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}><h3>🏥 Professional Information</h3></div>
                  <div className={styles.formGrid}>

                    <div className={styles.formGroup}>
                      <label>Department <span className={styles.required}>*</span></label>
                      <select required name="departmentId" value={formData.departmentId} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''}>
                        <option value={0}>Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <ValidationMsg field="department" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Designation <span className={styles.required}>*</span></label>
                      <select required name="designation" value={formData.designation} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''}>
                        <option value={0}>Select Designation</option>
                        {DESIGNATION_OPTIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                      </select>
                      <ValidationMsg field="designation" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Qualification</label>
                      <input name="qualification" value={formData.qualification} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="qualification" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Specialization</label>
                      <input name="specialization" value={formData.specialization} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="specialization" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>License Number</label>
                      <input name="licenseNo" value={formData.licenseNo} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="licenseNo" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>License Expiry</label>
                      <input type="date" name="licenseExpiryDate" value={formData.licenseExpiryDate} onChange={handleInputChange} min={getTodayDate()} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="licenseExpiryDate" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Experience (Years)</label>
                      <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleInputChange} min="0" disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="experienceYears" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>University Name</label>
                      <input name="universityName" value={formData.universityName} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="universityName" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>PF Number</label>
                      <input name="pfNo" value={formData.pfNo} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="pfNo" msgs={validationMessages} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>ESI Number</label>
                      <input name="esiNo" value={formData.esiNo} onChange={handleInputChange} disabled={!editMode.basic || loading} className={!editMode.basic ? styles.inputReadOnly : ''} />
                      <ValidationMsg field="esiNo" msgs={validationMessages} />
                    </div>

                  </div>
                </div>
              </div>
            </form>
          )}

          {/* ══════════ ID PROOF ══════════ */}
          {!pageLoading && !pageError && activeTab === 'proof' && (
            <form onSubmit={handleProofSave}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}><FiShield size={15} /> ID Proof</h3>
                <div className={styles.sectionActions}>
                  {editMode.proof ? (
                    <>
                      <button type="button" className={styles.btnAddProof} onClick={handleAddProof} disabled={loading}><FiPlus size={14} /> Add Proof</button>
                      <button type="button" className={styles.btnCancelEdit} onClick={() => cancelEdit('proof')} disabled={loading}><FiX size={14} /> Cancel</button>
                      <button type="submit" className={styles.btnSave} disabled={loading}><FiSave size={14} /> {loading ? 'Saving...' : 'Save Changes'}</button>
                    </>
                  ) : (
                    <button type="button" className={styles.btnEdit} onClick={() => setEditMode(prev => ({ ...prev, proof: true }))}><FiEdit2 size={14} /> Edit</button>
                  )}
                </div>
              </div>
              <div className={styles.body}>
                <div className={styles.formSection}>
                  {proofList.length === 0 && <p className={styles.emptyMsg}>No ID proofs added yet.</p>}
                  {proofList.map((proof, index) => (
                    <div key={index} className={styles.proofCard}>
                      <div className={styles.proofCardHeader}>
                        <span className={styles.proofCardTitle}><FiShield size={13} /> Proof {index + 1}</span>
                        {editMode.proof && <button type="button" className={styles.btnRemoveProof} onClick={() => handleRemoveProofRow(index)} disabled={loading}><FiTrash2 size={14} /></button>}
                      </div>
                      {/* View mode: show View Proof button */}
                      {!editMode.proof && proof.fileId > 0 && (
                        <div className={styles.proofViewRow}>
                          {fetchedProofUrls[index] ? (
                            <div className={styles.proofThumbWrap}>
                              <img
                                src={fetchedProofUrls[index]}
                                alt={`Proof ${index + 1}`}
                                className={styles.proofThumb}
                                onClick={() => setLightbox({ open: true, url: fetchedProofUrls[index], title: `Proof ${index + 1}` })}
                              />
                              <span className={styles.proofThumbHint}>Click to enlarge</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleViewProofFile(index, proof.fileId)}
                              disabled={proofFetchLoading[index]}
                              className={styles.btnViewFile}
                            >
                              <FiEye size={15} />
                              {proofFetchLoading[index] ? 'Loading...' : 'View Proof File'}
                            </button>
                          )}
                        </div>
                      )}
                      {editMode.proof && (
                        <div className={styles.photoUploadContainer}>
                          <div className={styles.photoPreviewSection}>
                            {proofFileUrls[index] ? (
                              <div className={styles.photoPreview}>
                                <img src={proofFileUrls[index]} alt="Proof" />
                                <button type="button" onClick={() => handleRemoveProofFile(index)} className={styles.removePhotoBtn}><FiX size={14} /></button>
                              </div>
                            ) : (
                              <div className={styles.photoPlaceholder}>
                                <FiUpload size={36} />
                                <p>{proofFiles[index]?.type === 'application/pdf' ? `PDF: ${proofFiles[index].name}` : proof.fileId ? 'File on record' : 'No file'}</p>
                              </div>
                            )}
                          </div>
                          <div className={styles.photoUploadControls}>
                            <input type="file" id={`proofFile_${index}`} accept="image/jpeg,image/jpg,image/png,application/pdf" onChange={(e) => handleProofFileUpload(index, e)} style={{ display: 'none' }} />
                            <label htmlFor={`proofFile_${index}`} className={styles.btnSelectFile}>Select ID Proof File</label>
                            {proofFiles[index] && !proofFilesUploaded[index] && <button type="button" onClick={() => handleProofFileUploadSubmit(index)} disabled={isProofUploading[index]} className={styles.btnUploadFile}>{isProofUploading[index] ? 'Uploading...' : 'Upload ID Proof'}</button>}
                            {proofUploadStatuses[index] && <p className={`${styles.fileStatus} ${proofFilesUploaded[index] ? styles.fileStatusSuccess : styles.fileStatusInfo}`}>{proofUploadStatuses[index]}</p>}
                            <p className={styles.fileHint}>JPG, JPEG, PNG or PDF · Max 5MB</p>
                          </div>
                        </div>
                      )}
                      <div className={styles.formGrid}>

                        <div className={styles.formGroup}>
                          <label>Proof Type <span className={styles.required}>*</span></label>
                          <select required name="proofType" value={proof.proofType} onChange={(e) => handleProofInputChange(index, e)} disabled={!editMode.proof || loading} className={!editMode.proof ? styles.inputReadOnly : ''}>
                            <option value={0}>Select Proof Type</option>
                            {ID_PROOF_OPTIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                          </select>
                          <ValidationMsg field="proofType" msgs={proofValidationMessages[index] || {}} />
                        </div>

                        <div className={styles.formGroup}>
                          <label>ID Number <span className={styles.required}>*</span></label>
                          <input required name="idNumber" value={proof.idNumber} onChange={(e) => handleProofInputChange(index, e)} disabled={!editMode.proof || loading} className={!editMode.proof ? styles.inputReadOnly : ''} />
                          <ValidationMsg field="idNumber" msgs={proofValidationMessages[index] || {}} />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Detail</label>
                          <input name="detail" value={proof.detail} onChange={(e) => handleProofInputChange(index, e)} disabled={!editMode.proof || loading} className={!editMode.proof ? styles.inputReadOnly : ''} />
                          <ValidationMsg field="detail" msgs={proofValidationMessages[index] || {}} />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Expiry Date <span className={styles.required}>*</span></label>
                          <input required type="date" name="expiryDate" value={proof.expiryDate} onChange={(e) => handleProofInputChange(index, e)} min={getTodayDate()} disabled={!editMode.proof || loading} className={!editMode.proof ? styles.inputReadOnly : ''} />
                          <ValidationMsg field="expiryDate" msgs={proofValidationMessages[index] || {}} />
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ══════════ BANK ACCOUNT ══════════ */}
          {!pageLoading && !pageError && activeTab === 'bank' && (
            <form onSubmit={handleBankSave}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}><FiCreditCard size={15} /> Bank Accounts</h3>
                <div className={styles.sectionActions}>
                  {editMode.bank ? (
                    <>
                      <button type="button" className={styles.btnAddProof} onClick={handleAddBeneficiary} disabled={loading}><FiPlus size={14} /> Add Account</button>
                      <button type="button" className={styles.btnCancelEdit} onClick={() => cancelEdit('bank')} disabled={loading}><FiX size={14} /> Cancel</button>
                      <button type="submit" className={styles.btnSave} disabled={loading}><FiSave size={14} /> {loading ? 'Saving...' : 'Save Changes'}</button>
                    </>
                  ) : (
                    <button type="button" className={styles.btnEdit} onClick={() => setEditMode(prev => ({ ...prev, bank: true }))}><FiEdit2 size={14} /> Edit</button>
                  )}
                </div>
              </div>
              <div className={styles.body}>
                <div className={styles.formSection}>
                  {beneficiaryList.length === 0 && <p className={styles.emptyMsg}>No bank accounts added yet.</p>}
                  {beneficiaryList.map((b, index) => (
                    <div key={index} className={styles.proofCard}>
                      <div className={styles.proofCardHeader}>
                        <span className={styles.proofCardTitle}>
                          <FiCreditCard size={13} /> Account {index + 1}
                          {b.IsDefault && <span className={styles.defaultBadge}>Default</span>}
                        </span>
                        {editMode.bank && beneficiaryList.length > 1 && <button type="button" className={styles.btnRemoveProof} onClick={() => handleRemoveBeneficiary(index)} disabled={loading}><FiTrash2 size={14} /></button>}
                      </div>
                      <div className={styles.formGrid}>

                        <div className={styles.formGroup}>
                          <label>Account Holder Name <span className={styles.required}>*</span></label>
                          <input required name="AccountHolderName" value={b.AccountHolderName} onChange={(e) => handleBeneficiaryInputChange(index, e)} disabled={!editMode.bank || loading} className={!editMode.bank ? styles.inputReadOnly : ''} />
                          <ValidationMsg field="AccountHolderName" msgs={beneficiaryValidationMessages[index] || {}} />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Account Number <span className={styles.required}>*</span></label>
                          <input required name="AccountNo" value={b.AccountNo} onChange={(e) => handleBeneficiaryInputChange(index, e)} disabled={!editMode.bank || loading} className={!editMode.bank ? styles.inputReadOnly : ''} />
                          <ValidationMsg field="AccountNo" msgs={beneficiaryValidationMessages[index] || {}} />
                        </div>

                        <div className={styles.formGroup}>
                          <label>IFSC Code <span className={styles.required}>*</span></label>
                          <input required name="IFSCCode" value={b.IFSCCode} onChange={(e) => handleBeneficiaryInputChange(index, e)} maxLength="11" disabled={!editMode.bank || loading} className={!editMode.bank ? styles.inputReadOnly : ''} />
                          <ValidationMsg field="IFSCCode" msgs={beneficiaryValidationMessages[index] || {}} />
                        </div>

                        <div className={styles.formGroup}>
                          <label>Bank Name <span className={styles.required}>*</span></label>
                          <input required name="BankName" value={b.BankName} onChange={(e) => handleBeneficiaryInputChange(index, e)} disabled={!editMode.bank || loading} className={!editMode.bank ? styles.inputReadOnly : ''} />
                          <ValidationMsg field="BankName" msgs={beneficiaryValidationMessages[index] || {}} />
                        </div>

                        <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                          <label>Bank Address</label>
                          <textarea name="BankAddress" rows={2} value={b.BankAddress} onChange={(e) => handleBeneficiaryInputChange(index, e)} disabled={!editMode.bank || loading} className={!editMode.bank ? styles.inputReadOnly : ''} />
                          <ValidationMsg field="BankAddress" msgs={beneficiaryValidationMessages[index] || {}} />
                        </div>

                        {editMode.bank && (
                          <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                            <label className={styles.checkboxLabel}>
                              <input type="checkbox" name="IsDefault" checked={b.IsDefault} onChange={(e) => handleBeneficiaryInputChange(index, e)} disabled={loading} />
                              <span>Set as default account</span>
                            </label>
                          </div>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ══════════ SHIFT & WORKDAYS ══════════ */}
          {!pageLoading && !pageError && activeTab === 'shift' && (
            <form onSubmit={handleShiftSave}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}><FiClock size={15} /> Shift &amp; Workdays</h3>
                <div className={styles.sectionActions}>
                  {editMode.shift ? (
                    <>
                      <button type="button" className={styles.btnCancelEdit} onClick={() => cancelEdit('shift')} disabled={loading}><FiX size={14} /> Cancel</button>
                      <button type="submit" className={styles.btnSave} disabled={loading}><FiSave size={14} /> {loading ? 'Saving...' : 'Save Changes'}</button>
                    </>
                  ) : (
                    <button type="button" className={styles.btnEdit} onClick={() => setEditMode(prev => ({ ...prev, shift: true }))}><FiEdit2 size={14} /> Edit</button>
                  )}
                </div>
              </div>
              <div className={styles.body}>
                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}><h3><FiClock size={15} /> Shift Assignment</h3></div>
                  {editMode.shift ? (
                    <>
                      <div className={styles.formGroup} style={{ maxWidth: 360 }}>
                        <label>Select Shifts</label>
                        <ShiftDropdown shifts={shifts} selectedShifts={selectedShifts} onToggle={handleShiftToggle} disabled={loading} />
                      </div>
                      {selectedShifts.length > 0 && (
                        <div className={styles.selectedShiftsTags}>
                          {selectedShifts.map(sid => {
                            const shift = shifts.find(s => s.id === sid);
                            return shift ? (
                              <span key={sid} className={styles.selectedShiftTag}>
                                {shift.shiftName}
                                <button type="button" className={styles.selectedShiftTagRemove} onClick={() => handleShiftToggle(sid)} disabled={loading}><FiX size={11} /></button>
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      <p className={styles.formHint}>Select one or more shifts for this employee</p>
                    </>
                  ) : (
                    <div className={styles.tagDisplay}>
                      {currentShiftNames.length > 0
                        ? currentShiftNames.map((name, i) => <span key={i} className={styles.viewTag}>{name}</span>)
                        : <span className={styles.emptyMsg}>No shifts assigned.</span>}
                    </div>
                  )}
                </div>

                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}><h3>📅 Work Days</h3></div>
                  {editMode.shift ? (
                    <>
                      <div className={styles.workDaysGroup}>
                        {WORK_DAYS.map(day => (
                          <button key={day.id} type="button"
                            onClick={() => handleWorkDayToggle(day.id)}
                            className={`${styles.dayBtn} ${selectedWorkDays.includes(day.id) ? styles.dayBtnActive : ''}`}
                            disabled={loading}
                          >{day.label}</button>
                        ))}
                      </div>
                      <p className={styles.formHint} style={{ marginTop: 8 }}>Select working days for this employee</p>
                    </>
                  ) : (
                    <div className={styles.tagDisplay}>
                      {currentWorkDayNames.length > 0
                        ? currentWorkDayNames.map((name, i) => <span key={i} className={styles.viewTag}>{name}</span>)
                        : <span className={styles.emptyMsg}>No work days assigned.</span>}
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Lightbox */}
        {lightbox.open && (
          <div className={styles.lightboxOverlay} onClick={closeLightbox}>
            <div className={styles.lightboxModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.lightboxHeader}>
                <span className={styles.lightboxTitle}>{lightbox.title}</span>
                <button className={styles.lightboxCloseBtn} onClick={closeLightbox}><FiX size={20} /></button>
              </div>
              <div className={styles.lightboxBody}>
                <img src={lightbox.url} alt={lightbox.title} className={styles.lightboxImg} />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm (nested inside modal) */}
        <DeleteConfirmModal
          isOpen={deleteConfirm.open}
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm({ open: false })}
          loading={deleteLoading}
        />
      </div>
    </div>
  );
};

export default ViewEmployee;