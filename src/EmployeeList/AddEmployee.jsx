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
  getShiftList  // ADD THIS IMPORT
} from '../api/api.js';
import './EmployeeList.css';

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

// REMOVED SHIFT_OPTIONS CONSTANT - will fetch from API

// ────────────────────────────────────────────────
const AddEmployee = ({ isOpen, onClose, departments, onSuccess }) => {
  // Current step state (1-4)
  const [currentStep, setCurrentStep] = useState(1);
  const [createdEmployeeId, setCreatedEmployeeId] = useState(null);

  // ADD: Shift list state
  const [shifts, setShifts] = useState([]);
  const [shiftsLoading, setShiftsLoading] = useState(false);

  // Step 1: Basic Employee Information
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

  // Photo upload states (Step 1)
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoUploadStatus, setPhotoUploadStatus] = useState('');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  // Step 2: Employee Proof Details
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

  // Step 3: Beneficiary Account Details
  const [beneficiaryData, setBeneficiaryData] = useState({
    AccountHolderName: '',
    AccountNo: '',
    IFSCCode: '',
    BankName: '',
    BankAddress: '',
    IsDefault: false,
  });

  // Step 4: Shift Details
  const [shiftData, setShiftData] = useState({
    ShiftID: 0,
  });

  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ADD: Fetch shifts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchShifts();
    }
  }, [isOpen]);

  // ADD: Function to fetch shifts
  const fetchShifts = async () => {
    setShiftsLoading(true);
    try {
      const clinicId = localStorage.getItem('clinicID');
      const shiftList = await getShiftList(clinicId ? Number(clinicId) : 0, {
        Status: 1 // Only fetch active shifts
      });
      setShifts(shiftList);
    } catch (err) {
      console.error('Failed to fetch shifts:', err);
      setShifts([]);
    } finally {
      setShiftsLoading(false);
    }
  };

  // Reset form when modal closes
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

    setFormError('');
    setFormSuccess(false);
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

  // ────────────────────────────────────────────────
  // ID Proof Upload Handlers (Step 2)
  // ────────────────────────────────────────────────
  const handleProofFileUpload = (e) => {
    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProofInputChange = (e) => {
    const { name, value } = e.target;
    setProofData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBeneficiaryInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBeneficiaryData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleShiftInputChange = (e) => {
    const { name, value } = e.target;
    setShiftData((prev) => ({ ...prev, [name]: value }));
  };

  // ────────────────────────────────────────────────
  // Step 1: Submit Basic Employee Info
  // ────────────────────────────────────────────────
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      const payload = {
        clinicId: clinicId ? Number(clinicId) : 0,
        branchID: branchId ? Number(branchId) : 0,
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
      
      // Move to step 2 after short delay
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

  // ────────────────────────────────────────────────
  // Step 2: Submit Employee Proof
  // ────────────────────────────────────────────────
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
      
      // Move to step 3 after short delay
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

  // ────────────────────────────────────────────────
  // Step 3: Submit Beneficiary Account
  // ────────────────────────────────────────────────
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
      
      // Move to step 4 after short delay
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

  // ────────────────────────────────────────────────
  // Step 4: Submit Employee Shift (Final Step)
  // ────────────────────────────────────────────────
  const handleStep4Submit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = localStorage.getItem('clinicID');

      const payload = {
        ClinicID: clinicId ? Number(clinicId) : 0,
        EmployeeID: createdEmployeeId,
        ShiftID: Number(shiftData.ShiftID),
      };

      await addEmployeeShift(payload);

      setFormSuccess(true);
      setFormError('');
      
      // Close modal and trigger refresh after short delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Add employee shift failed:', err);
      setFormError(err.message || 'Failed to assign employee shift.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Navigation handlers
  // ────────────────────────────────────────────────
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

  // ────────────────────────────────────────────────
  // Render step content
  // ────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <form onSubmit={handleStep1Submit} className="clinic-modal-body">
            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">Employee added successfully!</div>}

            <div className="form-grid">
              {/* Photo Upload Section */}
              <h3 className="form-section-title">Photo Upload</h3>
              
              <div className="form-group full-width">
                <div className="photo-upload-container">
                  <div className="photo-preview-section">
                    {photoUrl ? (
                      <div className="photo-preview">
                        <img src={photoUrl} alt="Employee Preview" />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="remove-photo-btn"
                          title="Remove photo"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <div className="photo-placeholder">
                        <FiUpload size={40} />
                        <p>No photo selected</p>
                      </div>
                    )}
                  </div>

                  <div className="photo-upload-controls">
                    <input
                      type="file"
                      id="photoInput"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="photoInput" className="btn-select-photo">
                      Select Photo
                    </label>
                    
                    {photo && !photoUploaded && (
                      <button
                        type="button"
                        onClick={handlePhotoUploadSubmit}
                        disabled={isPhotoUploading}
                        className="btn-upload-photo"
                      >
                        {isPhotoUploading ? 'Uploading...' : 'Upload Photo'}
                      </button>
                    )}
                    
                    {photoUploadStatus && (
                      <p className={`photo-status ${photoUploaded ? 'success' : 'info'}`}>
                        {photoUploadStatus}
                      </p>
                    )}
                    
                    <p className="photo-hint">
                      JPG, JPEG, or PNG. Max size: 4MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <h3 className="form-section-title">Basic Information</h3>

              <div className="form-group">
                <label>
                  Employee Code <span className="required">*</span>
                </label>
                <input
                  required
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  First Name <span className="required">*</span>
                </label>
                <input
                  required
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  Last Name <span className="required">*</span>
                </label>
                <input
                  required
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
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

              <div className="form-group">
                <label>Birth Date</label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
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

              <div className="form-group">
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
              <h3 className="form-section-title">Contact Information</h3>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  Mobile <span className="required">*</span>
                </label>
                <input
                  required
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Alternate Mobile</label>
                <input
                  name="altMobile"
                  value={formData.altMobile}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              {/* Professional Information */}
              <h3 className="form-section-title">Professional Information</h3>

              <div className="form-group">
                <label>
                  Department <span className="required">*</span>
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

              <div className="form-group">
                <label>
                  Designation <span className="required">*</span>
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

              <div className="form-group">
                <label>Qualification</label>
                <input
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Specialization</label>
                <input
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>License Number</label>
                <input
                  name="licenseNo"
                  value={formData.licenseNo}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>License Expiry</label>
                <input
                  type="date"
                  name="licenseExpiryDate"
                  value={formData.licenseExpiryDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Experience (Years)</label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>University Name</label>
                <input
                  name="universityName"
                  value={formData.universityName}
                  onChange={handleInputChange}
                />
              </div>

              {/* Other Details */}
              <h3 className="form-section-title">Other Details</h3>

              <div className="form-group">
                <label>PF Number</label>
                <input name="pfNo" value={formData.pfNo} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>ESI Number</label>
                <input name="esiNo" value={formData.esiNo} onChange={handleInputChange} />
              </div>
            </div>

            <div className="clinic-modal-footer">
              <button type="button" onClick={onClose} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="btn-submit">
                {formLoading ? 'Saving...' : 'Save & Next'}
              </button>
            </div>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleStep2Submit} className="clinic-modal-body">
            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">Employee proof added successfully!</div>}

            <div className="form-grid">
              <h3 className="form-section-title">Employee ID Proof Details</h3>
              
              {/* File Upload Section */}
              <div className="form-group full-width">
                <div className="photo-upload-container">
                  <div className="photo-preview-section">
                    {proofFileUrl ? (
                      <div className="photo-preview">
                        <img src={proofFileUrl} alt="ID Proof Preview" />
                        <button
                          type="button"
                          onClick={handleRemoveProofFile}
                          className="remove-photo-btn"
                          title="Remove file"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : proofFile && proofFile.type === 'application/pdf' ? (
                      <div className="photo-placeholder">
                        <FiUpload size={40} />
                        <p>PDF Selected: {proofFile.name}</p>
                        <button
                          type="button"
                          onClick={handleRemoveProofFile}
                          className="remove-photo-btn"
                          title="Remove file"
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <div className="photo-placeholder">
                        <FiUpload size={40} />
                        <p>No file selected</p>
                      </div>
                    )}
                  </div>

                  <div className="photo-upload-controls">
                    <input
                      type="file"
                      id="proofFileInput"
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      onChange={handleProofFileUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="proofFileInput" className="btn-select-photo">
                      Select ID Proof File
                    </label>
                    
                    {proofFile && !proofFileUploaded && (
                      <button
                        type="button"
                        onClick={handleProofFileUploadSubmit}
                        disabled={isProofUploading}
                        className="btn-upload-photo"
                      >
                        {isProofUploading ? 'Uploading...' : 'Upload ID Proof'}
                      </button>
                    )}
                    
                    {proofUploadStatus && (
                      <p className={`photo-status ${proofFileUploaded ? 'success' : 'info'}`}>
                        {proofUploadStatus}
                      </p>
                    )}
                    
                    <p className="photo-hint">
                      JPG, JPEG, PNG, or PDF. Max size: 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Proof Type <span className="required">*</span>
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

              <div className="form-group">
                <label>
                  ID Number <span className="required">*</span>
                </label>
                <input
                  required
                  name="idNumber"
                  value={proofData.idNumber}
                  onChange={handleProofInputChange}
                  placeholder="Enter ID number"
                />
              </div>

              <div className="form-group">
                <label>Detail</label>
                <input
                  name="detail"
                  value={proofData.detail}
                  onChange={handleProofInputChange}
                  placeholder="Additional details (optional)"
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={proofData.expiryDate}
                  onChange={handleProofInputChange}
                />
              </div>
            </div>

            <div className="clinic-modal-footer">
              <button type="button" onClick={handlePrevious} className="btn-cancel">
                Previous
              </button>
              <button type="button" onClick={handleSkipStep} className="btn-secondary">
                Skip
              </button>
              <button type="submit" disabled={formLoading} className="btn-submit">
                {formLoading ? 'Saving...' : 'Save & Next'}
              </button>
            </div>
          </form>
        );

      case 3:
        return (
          <form onSubmit={handleStep3Submit} className="clinic-modal-body">
            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">Beneficiary account added successfully!</div>}

            <div className="form-grid">
              <h3 className="form-section-title">Beneficiary Account Details</h3>

              <div className="form-group">
                <label>
                  Account Holder Name <span className="required">*</span>
                </label>
                <input
                  required
                  name="AccountHolderName"
                  value={beneficiaryData.AccountHolderName}
                  onChange={handleBeneficiaryInputChange}
                  placeholder="Enter account holder name"
                />
              </div>

              <div className="form-group">
                <label>
                  Account Number <span className="required">*</span>
                </label>
                <input
                  required
                  name="AccountNo"
                  value={beneficiaryData.AccountNo}
                  onChange={handleBeneficiaryInputChange}
                  placeholder="Enter account number"
                />
              </div>

              <div className="form-group">
                <label>
                  IFSC Code <span className="required">*</span>
                </label>
                <input
                  required
                  name="IFSCCode"
                  value={beneficiaryData.IFSCCode}
                  onChange={handleBeneficiaryInputChange}
                  placeholder="Enter IFSC code"
                />
              </div>

              <div className="form-group">
                <label>Bank Name</label>
                <input
                  name="BankName"
                  value={beneficiaryData.BankName}
                  onChange={handleBeneficiaryInputChange}
                  placeholder="Enter bank name"
                />
              </div>

              <div className="form-group full-width">
                <label>Bank Address</label>
                <textarea
                  name="BankAddress"
                  rows={2}
                  value={beneficiaryData.BankAddress}
                  onChange={handleBeneficiaryInputChange}
                  placeholder="Enter bank address (optional)"
                />
              </div>

              <div className="form-group full-width">
                <label className="checkbox-label">
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

            <div className="clinic-modal-footer">
              <button type="button" onClick={handlePrevious} className="btn-cancel">
                Previous
              </button>
              <button type="button" onClick={handleSkipStep} className="btn-secondary">
                Skip
              </button>
              <button type="submit" disabled={formLoading} className="btn-submit">
                {formLoading ? 'Saving...' : 'Save & Next'}
              </button>
            </div>
          </form>
        );

      case 4:
        return (
          <form onSubmit={handleStep4Submit} className="clinic-modal-body">
            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">Employee shift assigned successfully!</div>}

            <div className="form-grid">
              <h3 className="form-section-title">Employee Shift Assignment</h3>

              <div className="form-group">
                <label>
                  Shift <span className="required">*</span>
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
            </div>

            <div className="clinic-modal-footer">
              <button type="button" onClick={handlePrevious} className="btn-cancel">
                Previous
              </button>
              <button type="button" onClick={handleSkipStep} className="btn-secondary">
                Skip & Finish
              </button>
              <button type="submit" disabled={formLoading} className="btn-submit">
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
    <div className="clinic-modal-overlay" onClick={onClose}>
      <div className="clinic-modal form-modal employee-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="clinic-modal-header">
          <h2>
            Add New Employee - Step {currentStep} of 4
            {createdEmployeeId && <span className="employee-id-badge"> (ID: {createdEmployeeId})</span>}
          </h2>
          <button onClick={onClose} className="clinic-modal-close">
            <FiX />
          </button>
        </div>

        {/* Step indicator */}
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Basic Info</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">ID Proof</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Bank Account</div>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Shift</div>
          </div>
        </div>

        {renderStepContent()}
      </div>
    </div>
  );
};

export default AddEmployee;