// src/components/AddEmployee.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';
import { 
  addEmployee, 
  uploadPhoto, 
  addEmployeeProof, 
  uploadIDProof,
  addEmployeeBeneficiaryAccount,
  addEmployeeShift,
  getShiftList,
  addWorkDays  
} from '../api/api.js';
import styles from './AddEmployee.module.css';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'employeeCode':
      if (!value || !value.trim()) return 'Employee code is required';
      if (value.trim().length < 3) return 'Employee code must be at least 3 characters';
      if (value.trim().length > 20) return 'Employee code must not exceed 20 characters';
      return '';

    case 'firstName':
    case 'lastName':
      if (!value || !value.trim()) return `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`;
      if (value.trim().length < 2) return `${fieldName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
      if (value.trim().length > 50) return `${fieldName === 'firstName' ? 'First' : 'Last'} name must not exceed 50 characters`;
      return '';

    case 'mobile':
      if (!value || !value.trim()) return 'Mobile number is required';
      if (value.trim().length < 10) return 'Mobile number must be 10 digits';
      if (value.trim().length === 10) {
        if (!/^[6-9]\d{9}$/.test(value.trim())) {
          return 'Mobile number must start with 6-9';
        }
      }
      if (value.trim().length > 10) return 'Mobile number cannot exceed 10 digits';
      return '';

    case 'altMobile':
      if (value && value.trim()) {
        if (value.trim().length < 10) return 'Mobile number must be 10 digits';
        if (value.trim().length === 10) {
          if (!/^[6-9]\d{9}$/.test(value.trim())) {
            return 'Mobile number must start with 6-9';
          }
        }
        if (value.trim().length > 10) return 'Mobile number cannot exceed 10 digits';
      }
      return '';

    case 'email':
      if (value && value.trim()) {
        if (!value.includes('@')) return 'Email must contain @';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address';
        }
      }
      return '';

    case 'birthDate':
      if (value) {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
        
        if (actualAge < 18) return 'Employee must be at least 18 years old';
        if (actualAge > 100) return 'Please enter a valid birth date';
      }
      return '';

    case 'licenseExpiryDate':
      if (value) {
        const expiryDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (expiryDate < today) return 'License expiry date must be in the future';
      }
      return '';

    case 'address':
      if (value && value.length > 500) return 'Address must not exceed 500 characters';
      return '';

    case 'qualification':
    case 'specialization':
      if (value && value.length > 100) return 'Field must not exceed 100 characters';
      return '';

    case 'universityName':
      if (!value || !value.trim()) return 'University name is required';
      if (value.trim().length < 3) return 'University name must be at least 3 characters';
      if (value.trim().length > 100) return 'University name must not exceed 100 characters';
      return '';

    case 'licenseNo':
    case 'pfNo':
    case 'esiNo':
      if (value && value.length > 50) return 'Field must not exceed 50 characters';
      return '';

    case 'experienceYears':
      if (value !== '' && value !== null && value !== undefined) {
        const years = Number(value);
        if (isNaN(years)) return 'Must be a number';
        if (years < 0) return 'Cannot be negative';
        if (years > 50) return 'Experience cannot exceed 50 years';
      }
      return '';

  case 'idNumber':
  return value.replace(/[^A-Z0-9]/g, '');

    case 'detail':
      if (value && value.length > 100) return 'Field must not exceed 100 characters';
      return '';

    case 'expiryDate':
      if (value) {
        const expiryDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (expiryDate < today) return 'Expiry date must be in the future';
      }
      return '';

    case 'AccountHolderName':
      if (!value || !value.trim()) return 'Account holder name is required';
      if (value.trim().length < 3) return 'Name must be at least 3 characters';
      if (value.trim().length > 100) return 'Name must not exceed 100 characters';
      return '';
case 'AccountNo':
  if (!value || !value.trim()) return 'Account number is required';
  if (!/^\d+$/.test(value.trim())) return 'Account number must contain only digits';
  if (value.trim().length < 9) return 'Account number must be at least 9 digits';
  return '';

case 'IFSCCode':
  if (!value || !value.trim()) return 'IFSC code is required';

  const ifscValue = value.trim();
  
  if (ifscValue.length > 0 && ifscValue.length <= 4) {
    if (!/^[A-Z]+$/.test(ifscValue)) {
      return 'First 4 characters must be letters only';
    }
  }
  
  if (ifscValue.length === 5) {
    if (!/^[A-Z]{4}0$/.test(ifscValue)) {
      return '5th character must be 0';
    }
  }
  
if (ifscValue.length > 5) {
  if (!/^[A-Z]{4}0\d*$/.test(ifscValue)) {
    return 'After 5th character, only numbers allowed (no letters or special characters)';
  }
}
  if (ifscValue.length < 11) return 'IFSC code must be 11 characters';
  if (ifscValue.length === 11) {
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscValue)) {
      return 'Invalid IFSC format (e.g., HDFC0000269)';
    }
  }
  if (ifscValue.length > 11) return 'IFSC code must be exactly 11 characters';
  
  return '';

    case 'BankName':
      if (value && value.length > 100) return 'Bank name must not exceed 100 characters';
      return '';

    case 'BankAddress':
      if (value && value.length > 500) return 'Bank address must not exceed 500 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  // Returns filtered value based on field type
  switch (fieldName) {
    case 'firstName':
    case 'lastName':
    case 'AccountHolderName':
    case 'BankName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    
    case 'mobile':
    case 'altMobile':
    case 'AccountNo':
      return value.replace(/[^0-9]/g, '');

    case 'employeeCode':
      return value
        .replace(/[^A-Za-z0-9_-]/g, '') 
        .toUpperCase();                   

    case 'qualification':
    case 'specialization':
      return value.replace(/[^a-zA-Z\s.,()]/g, '');

    case 'universityName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    
    case 'licenseNo':
    case 'pfNo':
    case 'esiNo':
      return value.replace(/[^A-Za-z0-9-_]/g, '');

    case 'idNumber':
      return value.replace(/[^A-Za-z0-9]/g, ''),value.toUpperCase();
    
    case 'IFSCCode':
      return value.replace(/[^A-Z0-9]/g, ''),value.toUpperCase();
    
    case 'experienceYears':
      return value.replace(/[^0-9]/g, '');
    
    default:
      return value;
  }
};

const getMaxBirthDate = () => {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return maxDate.toISOString().split('T')[0];
};

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { id: 1, label: 'Male' },
  { id: 2, label: 'Female' },
  { id: 3, label: 'Other' },
];

const BLOOD_GROUP_OPTIONS = [
  { id: 1, label: 'A+' },
  { id: 2, label: 'A-' },
  { id: 3, label: 'B+' },
  { id: 4, label: 'B-' },
  { id: 5, label: 'AB+' },
  { id: 6, label: 'AB-' },
  { id: 7, label: 'O+' },
  { id: 8, label: 'O-' },
  { id: 9, label: 'Others' },
];

const MARITAL_STATUS_OPTIONS = [
  { id: 1, label: 'Single' },
  { id: 2, label: 'Married' },
  { id: 3, label: 'Widowed' },
  { id: 4, label: 'Divorced' },
  { id: 5, label: 'Separated' },
];

const ID_PROOF_OPTIONS = [
  { id: 1, label: 'Aadhar' },
  { id: 2, label: 'Passport' },
  { id: 3, label: 'Driving Licence' },
  { id: 4, label: 'Voter ID' },
  { id: 5, label: 'PAN Card' },
];

const DESIGNATION_OPTIONS = [
  { id: 1, label: 'Doctor' },
  { id: 2, label: 'Nurse' },
  { id: 3, label: 'Receptionist' },
  { id: 4, label: 'Pharmacist' },
  { id: 5, label: 'Lab Technician' },
  { id: 6, label: 'Billing Staff' },
  { id: 7, label: 'Manager' },
  { id: 8, label: 'Attendant' },
  { id: 9, label: 'Cleaner' },
  { id: 10, label: 'Others' },
];

const WORK_DAYS = [
  { id: 1, label: 'Sunday' },
  { id: 2, label: 'Monday' },
  { id: 3, label: 'Tuesday' },
  { id: 4, label: 'Wednesday' },
  { id: 5, label: 'Thursday' },
  { id: 6, label: 'Friday' },
  { id: 7, label: 'Saturday' },
];

// ────────────────────────────────────────────────
const AddEmployee = ({ isOpen, onClose, departments, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [createdEmployeeId, setCreatedEmployeeId] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeCode: '',
    firstName: '',
    lastName: '',
    gender: 0,
    birthDate: '',
    bloodGroup: 0,
    maritalStatus: 0,
    address: '',
    mobile: '',
    altMobile: '',
    email: '',
    idProofType: 0,
    idNumber: '',
    idExpiry: '',
    departmentId: 0,
    designation: 0,
    qualification: '',
    specialization: '',
    licenseNo: '',
    licenseExpiryDate: '',
    experienceYears: 0,
    universityName: '',
    pfNo: '',
    esiNo: '',
    shiftId: 0,
    photoFileId: 0,
  });

  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoUploadStatus, setPhotoUploadStatus] = useState('');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  const [proofData, setProofData] = useState({
    proofType: 0,
    idNumber: '',
    detail: '',
    expiryDate: '',
    fileId: 0,
  });

  const [proofFile, setProofFile] = useState(null);
  const [proofFileUrl, setProofFileUrl] = useState(null);
  const [proofFileUploaded, setProofFileUploaded] = useState(false);
  const [proofUploadStatus, setProofUploadStatus] = useState('');
  const [isProofUploading, setIsProofUploading] = useState(false);

  const [beneficiaryData, setBeneficiaryData] = useState({
    AccountHolderName: '',
    AccountNo: '',
    IFSCCode: '',
    BankName: '',
    BankAddress: '',
    IsDefault: false,
  });

  const [shiftData, setShiftData] = useState({
    ShiftID: 0,
  });

  const [selectedWorkDays, setSelectedWorkDays] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [proofValidationMessages, setProofValidationMessages] = useState({});
  const [beneficiaryValidationMessages, setBeneficiaryValidationMessages] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchShifts();
    }
  }, [isOpen]);

  const fetchShifts = async () => {
    setShiftsLoading(true);
    try {
      const clinicId = localStorage.getItem('clinicID');
      const shiftList = await getShiftList(clinicId ? Number(clinicId) : 0, {
        Status: 1 
      });
      setShifts(shiftList);
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
      setShifts([]);
    } finally {
      setShiftsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setCurrentStep(1);
    setCreatedEmployeeId(null);
    setFormData({
      employeeCode: '',
      firstName: '',
      lastName: '',
      gender: 0,
      birthDate: '',
      bloodGroup: 0,
      maritalStatus: 0,
      address: '',
      mobile: '',
      altMobile: '',
      email: '',
      idProofType: 0,
      idNumber: '',
      idExpiry: '',
      departmentId: 0,
      designation: 0,
      qualification: '',
      specialization: '',
      licenseNo: '',
      licenseExpiryDate: '',
      experienceYears: 0,
      universityName: '',
      pfNo: '',
      esiNo: '',
      shiftId: 0,
      photoFileId: 0,
    });
    setPhoto(null);
    setPhotoUrl(null);
    setPhotoUploaded(false);
    setPhotoUploadStatus('');
    
    setProofData({
      proofType: 0,
      idNumber: '',
      detail: '',
      expiryDate: '',
      fileId: 0,
    });
    setProofFile(null);
    setProofFileUrl(null);
    setProofFileUploaded(false);
    setProofUploadStatus('');

    setBeneficiaryData({
      AccountHolderName: '',
      AccountNo: '',
      IFSCCode: '',
      BankName: '',
      BankAddress: '',
      IsDefault: false,
    });

    setShiftData({
      ShiftID: 0,
    });

    setSelectedWorkDays([]);

    setFormError('');
    setFormSuccess(false);
    setValidationMessages({});
    setProofValidationMessages({});
    setBeneficiaryValidationMessages({});
  };

  // ────────────────────────────────────────────────
  // Photo Upload Handlers (Step 1)
  // ────────────────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    const maxSize = 4 * 1024 * 1024; // 4MB

    if (!file) {
      setPhotoUploadStatus('No file selected.');
      setPhoto(null);
      setPhotoUploaded(false);
      setPhotoUrl(null);
      setFormData((prev) => ({ ...prev, photoFileId: 0 }));
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setPhotoUploadStatus('Please upload a valid JPG, JPEG, or PNG file.');
      setPhoto(null);
      setPhotoUploaded(false);
      setPhotoUrl(null);
      setFormData((prev) => ({ ...prev, photoFileId: 0 }));
      return;
    }

    if (file.size > maxSize) {
      setPhotoUploadStatus('File size exceeds 4MB limit.');
      setPhoto(null);
      setPhotoUploaded(false);
      setPhotoUrl(null);
      setFormData((prev) => ({ ...prev, photoFileId: 0 }));
      return;
    }

    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoUploadStatus('File selected. Click "Upload Photo" to submit.');
    setPhotoUploaded(false);
    setFormData((prev) => ({ ...prev, photoFileId: 0 }));
  };

  const handlePhotoUploadSubmit = async () => {
    if (!photo) {
      setPhotoUploadStatus('Please select a photo first.');
      return;
    }

    setIsPhotoUploading(true);
    setPhotoUploadStatus('Uploading photo...');

    try {
      const response = await uploadPhoto(photo);
      setFormData((prev) => ({ ...prev, photoFileId: response.fileId }));
      setPhotoUploadStatus('Photo uploaded successfully!');
      setPhotoUploaded(true);
    } catch (err) {
      setPhotoUploaded(false);
      setFormData((prev) => ({ ...prev, photoFileId: 0 }));
      setPhotoUploadStatus(`Failed to upload photo: ${err.message}`);
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoUrl(null);
    setPhotoUploaded(false);
    setPhotoUploadStatus('');
    setFormData((prev) => ({ ...prev, photoFileId: 0 }));
  };

  const handleProofFileUpload = (e) => {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; 

    if (!file) {
      setProofUploadStatus('No file selected.');
      setProofFile(null);
      setProofFileUploaded(false);
      setProofFileUrl(null);
      setProofData((prev) => ({ ...prev, fileId: 0 }));
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setProofUploadStatus('Please upload a valid JPG, JPEG, PNG, or PDF file.');
      setProofFile(null);
      setProofFileUploaded(false);
      setProofFileUrl(null);
      setProofData((prev) => ({ ...prev, fileId: 0 }));
      return;
    }

    if (file.size > maxSize) {
      setProofUploadStatus('File size exceeds 5MB limit.');
      setProofFile(null);
      setProofFileUploaded(false);
      setProofFileUrl(null);
      setProofData((prev) => ({ ...prev, fileId: 0 }));
      return;
    }

    setProofFile(file);
    if (file.type.startsWith('image/')) {
      setProofFileUrl(URL.createObjectURL(file));
    } else {
      setProofFileUrl(null); // PDF - no preview
    }
    setProofUploadStatus('File selected. Click "Upload ID Proof" to submit.');
    setProofFileUploaded(false);
    setProofData((prev) => ({ ...prev, fileId: 0 }));
  };

  const handleProofFileUploadSubmit = async () => {
    if (!proofFile) {
      setProofUploadStatus('Please select an ID proof file first.');
      return;
    }

    setIsProofUploading(true);
    setProofUploadStatus('Uploading ID proof...');

    try {
      const response = await uploadIDProof(proofFile);
      setProofData((prev) => ({ ...prev, fileId: response.fileId }));
      setProofUploadStatus('ID proof uploaded successfully!');
      setProofFileUploaded(true);
    } catch (err) {
      setProofFileUploaded(false);
      setProofData((prev) => ({ ...prev, fileId: 0 }));
      setProofUploadStatus(`Failed to upload ID proof: ${err.message}`);
    } finally {
      setIsProofUploading(false);
    }
  };

  const handleRemoveProofFile = () => {
    setProofFile(null);
    setProofFileUrl(null);
    setProofFileUploaded(false);
    setProofUploadStatus('');
    setProofData((prev) => ({ ...prev, fileId: 0 }));
  };

  // ────────────────────────────────────────────────
  // Form Handlers
  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    const filteredValue = filterInput(name, value);
    
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
  };

  const handleProofInputChange = (e) => {
    const { name, value } = e.target;
    
    const filteredValue = filterInput(name, value);
    
    setProofData((prev) => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setProofValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
  };

  const handleBeneficiaryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setBeneficiaryData((prev) => ({ 
        ...prev, 
        [name]: checked 
      }));
    } else {
      const filteredValue = filterInput(name, value);
      
      setBeneficiaryData((prev) => ({ 
        ...prev, 
        [name]: filteredValue 
      }));

      const validationMessage = getLiveValidationMessage(name, filteredValue);
      setBeneficiaryValidationMessages((prev) => ({
        ...prev,
        [name]: validationMessage,
      }));
    }
  };

  const handleShiftInputChange = (e) => {
    const { name, value } = e.target;
    setShiftData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkDayToggle = (dayId) => {
    setSelectedWorkDays((prev) => {
      if (prev.includes(dayId)) {
        return prev.filter((id) => id !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const payload = {
        clinicId:  clinicId,
        branchID: branchId,
        employeeCode: formData.employeeCode.trim(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        gender: Number(formData.gender),
        birthDate: formData.birthDate,
        bloodGroup: Number(formData.bloodGroup),
        maritalStatus: Number(formData.maritalStatus),
        address: formData.address.trim(),
        mobile: formData.mobile.trim(),
        altMobile: formData.altMobile.trim(),
        email: formData.email.trim(),
        departmentId: Number(formData.departmentId),
        designation: Number(formData.designation),
        qualification: formData.qualification.trim(),
        specialization: formData.specialization.trim(),
        licenseNo: formData.licenseNo.trim(),
        licenseExpiryDate: formData.licenseExpiryDate,
        experienceYears: Number(formData.experienceYears),
        universityName: formData.universityName.trim(),
        pfNo: formData.pfNo.trim(),
        esiNo: formData.esiNo.trim(),
        shiftId: 0,
        photoFileId: Number(formData.photoFileId),
      };

      const result = await addEmployee(payload);

      setCreatedEmployeeId(result.employeeId);
      setFormSuccess(true);
      setFormError('');
      setTimeout(() => {
        setFormSuccess(false);
        setCurrentStep(2);
      }, 1000);
    } catch (err) {
      console.error('Add employee failed:', err);
      setFormError(err.message || 'Failed to add employee.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {

      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      const payload = {
        clinicId: clinicId ? Number(clinicId) : 0,
        branchId: branchId ? Number(branchId) : 0,
        employeeId: createdEmployeeId,
        proofType: Number(proofData.proofType),
        idNumber: proofData.idNumber.trim(),
        detail: proofData.detail.trim(),
        expiryDate: proofData.expiryDate,
        fileId: Number(proofData.fileId),
      };

      await addEmployeeProof(payload);

      setFormSuccess(true);
      setFormError('');
      
      setTimeout(() => {
        setFormSuccess(false);
        setCurrentStep(3);
      }, 1000);
    } catch (err) {
      console.error('Add employee proof failed:', err);
      setFormError(err.message || 'Failed to add employee proof.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      const payload = {
        ClinicID: clinicId ? Number(clinicId) : 0,
        BranchID: branchId ? Number(branchId) : 0,
        EmployeeID: createdEmployeeId,
        AccountHolderName: beneficiaryData.AccountHolderName.trim(),
        AccountNo: beneficiaryData.AccountNo.trim(),
        IFSCCode: beneficiaryData.IFSCCode.trim(),
        BankName: beneficiaryData.BankName.trim(),
        BankAddress: beneficiaryData.BankAddress.trim(),
        IsDefault: beneficiaryData.IsDefault,
      };

      await addEmployeeBeneficiaryAccount(payload);

      setFormSuccess(true);
      setFormError('');
      
      setTimeout(() => {
        setFormSuccess(false);
        setCurrentStep(4);
      }, 1000);
    } catch (err) {
      console.error('Add beneficiary account failed:', err);
      setFormError(err.message || 'Failed to add beneficiary account.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStep4Submit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = localStorage.getItem('clinicID');

      // 1. Add Employee Shift
      const shiftPayload = {
        ClinicID: clinicId ? Number(clinicId) : 0,
        EmployeeID: createdEmployeeId,
        ShiftID: Number(shiftData.ShiftID),
      };

      await addEmployeeShift(shiftPayload);

      // 2. Add Workdays (loop through selected days)
      if (selectedWorkDays.length > 0) {
        for (const dayId of selectedWorkDays) {
          const workdayPayload = {
            ClinicID: clinicId ? Number(clinicId) : 0,
            EmployeeID: createdEmployeeId,
            WorkDay: dayId,
          };
          
          await addWorkDays(workdayPayload);
        }
      }

      setFormSuccess(true);
      setFormError('');
      
      // Close modal and trigger refresh after short delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Add employee shift/workdays failed:', err);
      setFormError(err.message || 'Failed to assign employee shift or workdays.');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setFormError('');
      setFormSuccess(false);
    }
  };

  const handleSkipStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setFormError('');
      setFormSuccess(false);
    } else {
      // Last step - just close
      onSuccess?.();
      onClose();
    }
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleStep1Submit} className={styles.clinicModalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Employee added successfully!</div>}

            <div className={styles.formGrid}>
              {/* Photo Upload Section */}
              <h3 className={styles.formSectionTitle}>Photo Upload</h3>
              
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <div className={styles.photoUploadContainer}>
                  <div className={styles.photoPreviewSection}>
                    {photoUrl ? (
                      <div className={styles.photoPreview}>
                        <img src={photoUrl} alt="Employee Preview" />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className={styles.removePhotoBtn}
                          title="Remove photo"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        <FiUpload size={40} />
                        <p>No photo selected</p>
                      </div>
                    )}
                  </div>

                  <div className={styles.photoUploadControls}>
                    <input
                      type="file"
                      id="photoInput"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="photoInput" className={styles.btnSelectPhoto}>
                      Select Photo
                    </label>
                    
                    {photo && !photoUploaded && (
                      <button
                        type="button"
                        onClick={handlePhotoUploadSubmit}
                        disabled={isPhotoUploading}
                        className={styles.btnUploadPhoto}
                      >
                        {isPhotoUploading ? 'Uploading...' : 'Upload Photo'}
                      </button>
                    )}
                    
                    {photoUploadStatus && (
                      <p className={`${styles.photoStatus} ${photoUploaded ? styles.success : styles.info}`}>
                        {photoUploadStatus}
                      </p>
                    )}
                    
                    <p className={styles.photoHint}>
                      JPG, JPEG, or PNG. Max size: 4MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <h3 className={styles.formSectionTitle}>Basic Information</h3>

              <div className={styles.formGroup}>
                <label>
                  Employee Code <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={handleInputChange}
                />
                
                {validationMessages.employeeCode && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.employeeCode}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  First Name <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
                
                {validationMessages.firstName && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.firstName}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  Last Name <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
                
                {validationMessages.lastName && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.lastName}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="0">Select Gender</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Birth Date</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  max={getMaxBirthDate()}
                />
                
                {validationMessages.birthDate && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.birthDate}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                  <option value="0">Select Blood Group</option>
                  {BLOOD_GROUP_OPTIONS.map((bg) => (
                    <option key={bg.id} value={bg.id}>
                      {bg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Marital Status</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus}
                  onChange={handleInputChange}
                >
                  <option value="0">Select Status</option>
                  {MARITAL_STATUS_OPTIONS.map((ms) => (
                    <option key={ms.id} value={ms.id}>
                      {ms.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact Information */}
              <h3 className={styles.formSectionTitle}>Contact Information</h3>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                />
                
                {validationMessages.address && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.address}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  Mobile <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  maxLength="10"
                />
                
                {validationMessages.mobile && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.mobile}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Alternate Mobile</label>
                <input
                  name="altMobile"
                  value={formData.altMobile}
                  onChange={handleInputChange}
                  maxLength="10"
                />
                
                {validationMessages.altMobile && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.altMobile}
                  </span>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                
                {validationMessages.email && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.email}
                  </span>
                )}
              </div>

              {/* Professional Information */}
              <h3 className={styles.formSectionTitle}>Professional Information</h3>

              <div className={styles.formGroup}>
                <label>
                  Department <span className={styles.required}>*</span>
                </label>
                <select
                  required
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleInputChange}
                >
                  <option value="0">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  Designation <span className={styles.required}>*</span>
                </label>
                <select
                  required
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                >
                  <option value="0">Select Designation</option>
                  {DESIGNATION_OPTIONS.map((des) => (
                    <option key={des.id} value={des.id}>
                      {des.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Qualification</label>
                <input
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                />
                
                {validationMessages.qualification && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.qualification}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Specialization</label>
                <input
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                />
                
                {validationMessages.specialization && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.specialization}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>License Number</label>
                <input
                  name="licenseNo"
                  value={formData.licenseNo}
                  onChange={handleInputChange}
                />
                
                {validationMessages.licenseNo && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.licenseNo}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>License Expiry</label>
                <input
                  type="date"
                  name="licenseExpiryDate"
                  value={formData.licenseExpiryDate}
                  onChange={handleInputChange}
                  min={getTodayDate()}
                />
                
                {validationMessages.licenseExpiryDate && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.licenseExpiryDate}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Experience (Years)</label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  min="0"
                />
                
                {validationMessages.experienceYears && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.experienceYears}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>University Name</label>
                <input
                  name="universityName"
                  value={formData.universityName}
                  onChange={handleInputChange}
                />
                
                {validationMessages.universityName && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.universityName}
                  </span>
                )}
              </div>

              {/* Other Details */}
              <h3 className={styles.formSectionTitle}>Other Details</h3>

              <div className={styles.formGroup}>
                <label>PF Number</label>
                <input name="pfNo" value={formData.pfNo} onChange={handleInputChange} />
                
                {validationMessages.pfNo && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.pfNo}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>ESI Number</label>
                <input name="esiNo" value={formData.esiNo} onChange={handleInputChange} />
                
                {validationMessages.esiNo && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.esiNo}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.clinicModalFooter}>
              <button type="button" onClick={onClose} className={styles.btnCancel}>
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                {formLoading ? 'Saving...' : 'Save & Next'}
              </button>
            </div>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleStep2Submit} className={styles.clinicModalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Employee proof added successfully!</div>}

            <div className={styles.formGrid}>
              <h3 className={styles.formSectionTitle}>Employee ID Proof Details</h3>
              
              {/* File Upload Section */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <div className={styles.photoUploadContainer}>
                  <div className={styles.photoPreviewSection}>
                    {proofFileUrl ? (
                      <div className={styles.photoPreview}>
                        <img src={proofFileUrl} alt="ID Proof Preview" />
                        <button
                          type="button"
                          onClick={handleRemoveProofFile}
                          className={styles.removePhotoBtn}
                          title="Remove file"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : proofFile && proofFile.type === 'application/pdf' ? (
                      <div className={styles.photoPlaceholder}>
                        <FiUpload size={40} />
                        <p>PDF Selected: {proofFile.name}</p>
                        <button
                          type="button"
                          onClick={handleRemoveProofFile}
                          className={styles.removePhotoBtn}
                          title="Remove file"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.photoPlaceholder}>
                        <FiUpload size={40} />
                        <p>No file selected</p>
                      </div>
                    )}
                  </div>

                  <div className={styles.photoUploadControls}>
                    <input
                      type="file"
                      id="proofFileInput"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleProofFileUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="proofFileInput" className={styles.btnSelectPhoto}>
                      Select ID Proof File
                    </label>
                    
                    {proofFile && !proofFileUploaded && (
                      <button
                        type="button"
                        onClick={handleProofFileUploadSubmit}
                        disabled={isProofUploading}
                        className={styles.btnUploadPhoto}
                      >
                        {isProofUploading ? 'Uploading...' : 'Upload ID Proof'}
                      </button>
                    )}
                    
                    {proofUploadStatus && (
                      <p className={`${styles.photoStatus} ${proofFileUploaded ? styles.success : styles.info}`}>
                        {proofUploadStatus}
                      </p>
                    )}
                    
                    <p className={styles.photoHint}>
                      JPG, JPEG, PNG, or PDF. Max size: 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>
                  Proof Type <span className={styles.required}>*</span>
                </label>
                <select
                  required
                  name="proofType"
                  value={proofData.proofType}
                  onChange={handleProofInputChange}
                >
                  <option value="0">Select Proof Type</option>
                  {ID_PROOF_OPTIONS.map((proof) => (
                    <option key={proof.id} value={proof.id}>
                      {proof.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  ID Number <span className={styles.required}>*</span>
                </label>
               <input
  required
  name="idNumber"
  value={proofData.idNumber}
  onChange={handleProofInputChange}
  onKeyDown={(e) => {
    const char = e.key;
    
    if (
      char === 'Backspace' ||
      char === 'Delete' ||
      char === 'ArrowLeft' ||
      char === 'ArrowRight' ||
      char === 'Tab' ||
      char === 'Enter' ||
      e.ctrlKey || e.metaKey
    ) {
      return;
    }

    if (!/^[A-Za-z0-9]$/.test(char)) {
      e.preventDefault(); 
    }
  }}
  onPaste={(e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const clean = pasted.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const input = e.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue =
      proofData.idNumber.substring(0, start) +
      clean +
      proofData.idNumber.substring(end);
    
    handleProofInputChange({
      target: {
        name: 'idNumber',
        value: newValue
      }
    });
  }}
  placeholder="Enter ID number"
/>
              </div>

              <div className={styles.formGroup}>
                <label>Detail</label>
                <input
                  name="detail"
                  value={proofData.detail}
                  onChange={handleProofInputChange}
                  placeholder="Additional details (optional)"
                />
                
                {proofValidationMessages.detail && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {proofValidationMessages.detail}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={proofData.expiryDate}
                  onChange={handleProofInputChange}
                  min={getTodayDate()}
                />
                
                {proofValidationMessages.expiryDate && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {proofValidationMessages.expiryDate}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.clinicModalFooter}>
              <button type="button" onClick={handlePrevious} className={styles.btnCancel}>
                Previous
              </button>
              <button type="button" onClick={handleSkipStep} className={styles.btnSecondary}>
                Skip
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                {formLoading ? 'Saving...' : 'Save & Next'}
              </button>
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleStep3Submit} className={styles.clinicModalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Beneficiary account added successfully!</div>}

            <div className={styles.formGrid}>
              <h3 className={styles.formSectionTitle}>Beneficiary Account Details</h3>

              <div className={styles.formGroup}>
                <label>
                  Account Holder Name <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="AccountHolderName"
                  value={beneficiaryData.AccountHolderName}
                  onChange={handleBeneficiaryInputChange}
                  placeholder="Enter account holder name"
                />
                
                {beneficiaryValidationMessages.AccountHolderName && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {beneficiaryValidationMessages.AccountHolderName}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  Account Number <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="AccountNo"
                  value={beneficiaryData.AccountNo}
                  onChange={handleBeneficiaryInputChange}
                  placeholder="Enter account number"
                />
                
                {beneficiaryValidationMessages.AccountNo && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {beneficiaryValidationMessages.AccountNo}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  IFSC Code <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="IFSCCode"
                  value={beneficiaryData.IFSCCode}
                  onChange={handleBeneficiaryInputChange}
                  placeholder="e.g., HDFC0000269"
                  maxLength="11"
                />
                
                {beneficiaryValidationMessages.IFSCCode && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {beneficiaryValidationMessages.IFSCCode}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Bank Name</label>
                <input
                  name="BankName"
                  value={beneficiaryData.BankName}
                  onChange={handleBeneficiaryInputChange}
                  placeholder="Enter bank name"
                />
                
                {beneficiaryValidationMessages.BankName && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {beneficiaryValidationMessages.BankName}
                  </span>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Bank Address</label>
                <textarea
                  name="BankAddress"
                  rows={2}
                  value={beneficiaryData.BankAddress}
                  onChange={handleBeneficiaryInputChange}
                  placeholder="Enter bank address (optional)"
                />
                
                {beneficiaryValidationMessages.BankAddress && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {beneficiaryValidationMessages.BankAddress}
                  </span>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="IsDefault"
                    checked={beneficiaryData.IsDefault}
                    onChange={handleBeneficiaryInputChange}
                  />
                  <span>Set as default account</span>
                </label>
              </div>
            </div>

            <div className={styles.clinicModalFooter}>
              <button type="button" onClick={handlePrevious} className={styles.btnCancel}>
                Previous
              </button>
              <button type="button" onClick={handleSkipStep} className={styles.btnSecondary}>
                Skip
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                {formLoading ? 'Saving...' : 'Save & Next'}
              </button>
            </div>
          </form>
        );

      case 4:
        return (
          <form onSubmit={handleStep4Submit} className={styles.clinicModalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Employee shift and workdays assigned successfully!</div>}

            <div className={styles.formGrid}>
              <h3 className={styles.formSectionTitle}>Employee Shift Assignment</h3>

              <div className={styles.formGroup}>
                <label>
                  Shift <span className={styles.required}>*</span>
                </label>
                <select
                  required
                  name="ShiftID"
                  value={shiftData.ShiftID}
                  onChange={handleShiftInputChange}
                  disabled={shiftsLoading}
                >
                  <option value="0">{shiftsLoading ? 'Loading shifts...' : 'Select Shift'}</option>
                  {shifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shiftName}
                    </option>
                  ))}
                </select>
              </div>

              <h3 className={styles.formSectionTitle}>Work Days</h3>
              
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <div className={styles.workdaysContainer}>
                  {WORK_DAYS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      className={`${styles.workdayBox} ${selectedWorkDays.includes(day.id) ? styles.selected : ''}`}
                      onClick={() => handleWorkDayToggle(day.id)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className={styles.workdaysHint}>
                  Select the days this employee will work
                </p>
              </div>
            </div>

            <div className={styles.clinicModalFooter}>
              <button type="button" onClick={handlePrevious} className={styles.btnCancel}>
                Previous
              </button>
              <button type="button" onClick={handleSkipStep} className={styles.btnSecondary}>
                Skip & Finish
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                {formLoading ? 'Saving...' : 'Save & Finish'}
              </button>
            </div>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.clinicModalOverlay} onClick={onClose}>
      <div className={styles.clinicModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.clinicModalHeader}>
          <h2>
            Add New Employee - Step {currentStep} of 4
            {createdEmployeeId && <span className={styles.employeeIdBadge}> (ID: {createdEmployeeId})</span>}
          </h2>
          <button onClick={onClose} className={styles.clinicModalClose}>
            <FiX />
          </button>
        </div>

        {/* Step indicator */}
        <div className={styles.stepIndicator}>
          <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''} ${currentStep > 1 ? styles.completed : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepLabel}>Basic Info</div>
          </div>
          <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''} ${currentStep > 2 ? styles.completed : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepLabel}>ID Proof</div>
          </div>
          <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''} ${currentStep > 3 ? styles.completed : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepLabel}>Bank Account</div>
          </div>
          <div className={`${styles.step} ${currentStep >= 4 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepLabel}>Shift & Workdays</div>
          </div>
        </div>

        {renderStepContent()}
      </div>
    </div>
  );
};

export default AddEmployee;