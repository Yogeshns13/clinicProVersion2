// src/components/AddEmployee.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUpload } from 'react-icons/fi';
import { addEmployee, uploadPhoto } from '../api/api.js';
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

// ────────────────────────────────────────────────
const AddEmployee = ({ isOpen, onClose, departments, onSuccess }) => {
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

  // Photo upload states
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoUploadStatus, setPhotoUploadStatus] = useState('');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
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
    setFormError('');
    setFormSuccess(false);
  };

  // ────────────────────────────────────────────────
  // Photo Upload Handlers
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
  // Form Handlers
  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
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
        FirstName: formData.firstName.trim(),
        LastName: formData.lastName.trim(),
        gender: Number(formData.gender),
        birthDate: formData.birthDate,
        bloodGroup: Number(formData.bloodGroup),
        maritalStatus: Number(formData.maritalStatus),
        address: formData.address.trim(),
        mobile: formData.mobile.trim(),
        altMobile: formData.altMobile.trim(),
        email: formData.email.trim(),
        idProofType: Number(formData.idProofType),
        idNumber: formData.idNumber.trim(),
        idExpiry: formData.idExpiry,
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
        shiftId: Number(formData.shiftId),
        photoFileId: Number(formData.photoFileId),
      };

      await addEmployee(payload);

      setFormSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Add employee failed:', err);
      setFormError(err.message || 'Failed to add employee.');
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="clinic-modal-overlay" onClick={onClose}>
      <div className="clinic-modal form-modal employee-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="clinic-modal-header">
          <h2>Add New Employee</h2>
          <button onClick={onClose} className="clinic-modal-close">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="clinic-modal-body">
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

            {/* ID Proof */}
            <h3 className="form-section-title">ID Proof Details</h3>

            <div className="form-group">
              <label>ID Proof Type</label>
              <select
                name="idProofType"
                value={formData.idProofType}
                onChange={handleInputChange}
              >
                <option value="0">Select ID Type</option>
                {ID_PROOF_OPTIONS.map((id) => (
                  <option key={id.id} value={id.id}>
                    {id.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>ID Number</label>
              <input
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>ID Expiry</label>
              <input
                type="date"
                name="idExpiry"
                value={formData.idExpiry}
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

            <div className="form-group">
              <label>Shift</label>
              <select name="shiftId" value={formData.shiftId} onChange={handleInputChange}>
                <option value="0">Select Shift</option>
                <option value="1">Active</option>
                <option value="2">Inactive</option>
              </select>
            </div>
          </div>

          <div className="clinic-modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="btn-submit">
              {formLoading ? 'Adding...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;