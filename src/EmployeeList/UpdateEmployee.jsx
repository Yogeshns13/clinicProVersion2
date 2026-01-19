// src/components/UpdateEmployee.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiX, FiUpload } from 'react-icons/fi';
import { getEmployeeList, getDepartmentList, updateEmployee, uploadPhoto } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './UpdateEmployee.css';

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

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
  { id: 3, label: 'Probation' },
  { id: 4, label: 'Suspended' },
  { id: 5, label: 'Retired' },
  { id: 6, label: 'Deleted' },
];

// ────────────────────────────────────────────────
const UpdateEmployee = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const employeeId = params.employeeId || params.id || params.employeeID;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);

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
    status: 1,
    photoFileId: 0,
  });

  // Photo upload states
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [photoUploadStatus, setPhotoUploadStatus] = useState('');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const deptData = await getDepartmentList(clinicId, branchId);
        setDepartments(deptData || []);

        const empList = await getEmployeeList(clinicId, {
          BranchID: branchId,
          EmployeeID: Number(employeeId),
        });

        if (!empList || empList.length === 0) {
          throw new Error(`Employee not found with ID: ${employeeId}`);
        }

        const employee = empList[0];
        setEmployeeData(employee);

        const formatDate = (dateStr) => {
          if (!dateStr) return '';
          try {
            const date = new Date(dateStr);
            return date.toISOString().split('T')[0];
          } catch (err) {
            return '';
          }
        };

        setFormData({
          employeeCode: employee.employeeCode || '',
          firstName: employee.firstName || '',
          lastName: employee.lastName || '',
          gender: employee.gender || 0,
          birthDate: formatDate(employee.birthDate),
          bloodGroup: employee.bloodGroup || 0,
          maritalStatus: employee.maritalStatus || 0,
          address: employee.address || '',
          mobile: employee.mobile || '',
          altMobile: employee.altMobile || '',
          email: employee.email || '',
          idProofType: employee.idProofType || 0,
          idNumber: employee.idNumber || '',
          idExpiry: formatDate(employee.idExpiry),
          departmentId: employee.departmentId || 0,
          designation: employee.designation || 0,
          qualification: employee.qualification || '',
          specialization: employee.specialization || '',
          licenseNo: employee.licenseNo || '',
          licenseExpiryDate: formatDate(employee.licenseExpiryDate),
          experienceYears: employee.experienceYears || 0,
          universityName: employee.universityName || '',
          pfNo: employee.pfNo || '',
          esiNo: employee.esiNo || '',
          status: employee.status === 'active' ? 1 : 2,
          photoFileId: employee.photoFileId || 0,
        });

        // If employee has existing photo, set the photoUploaded flag
        if (employee.photoFileId && employee.photoFileId > 0) {
          setPhotoUploaded(true);
          setPhotoUploadStatus('Existing photo will be retained unless you upload a new one.');
        }
      } catch (err) {
        setError({
          message: err.message || 'Failed to load employee data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No employee ID provided', status: 400 });
    }
  }, [employeeId]);

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
      // Don't reset photoFileId here - keep existing photo if any
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setPhotoUploadStatus('Please upload a valid JPG, JPEG, or PNG file.');
      setPhoto(null);
      setPhotoUrl(null);
      return;
    }

    if (file.size > maxSize) {
      setPhotoUploadStatus('File size exceeds 4MB limit.');
      setPhoto(null);
      setPhotoUrl(null);
      return;
    }

    setPhoto(file);
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoUploadStatus('File selected. Click "Upload Photo" to submit.');
    setPhotoUploaded(false);
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
      setPhotoUploadStatus('Photo uploaded successfully! This will replace the existing photo when you update.');
      setPhotoUploaded(true);
    } catch (err) {
      setPhotoUploaded(false);
      setPhotoUploadStatus(`Failed to upload photo: ${err.message}`);
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoUrl(null);
    setPhotoUploaded(false);
    setPhotoUploadStatus('Photo removed. The existing photo will be retained unless you upload a new one.');
    // Restore original photoFileId from employeeData
    if (employeeData && employeeData.photoFileId) {
      setFormData((prev) => ({ ...prev, photoFileId: employeeData.photoFileId }));
    }
  };

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate('/employee-list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await updateEmployee({
        employeeId: Number(employeeId),
        clinicId: employeeData.clinicId,
        branchId: employeeData.branchId,
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
        status: Number(formData.status),
        photoFileId: Number(formData.photoFileId),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/employee-list');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update employee.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className="clinic-loading">Loading employee data...</div>;
  }

  if (error || !employeeData) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Employee" />
        <div className="clinic-error">
          {error?.message || 'Employee not found'}
        </div>
        <div className="clinic-toolbar">
          <button onClick={handleBack} className="clinic-add-btn">
            <FiArrowLeft size={20} /> Back to List
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Update Employee" />

      {/* Page Header with Back Button */}
      <div className="clinic-toolbar" style={{ justifyContent: 'flex-start', padding: '0 20px' }}>
        <button onClick={handleBack} className="clinic-add-btn">
          Back to List
        </button>
      </div>

      {/* Full-Screen Form Container */}
      <div className="clinic-table-container" style={{ margin: '20px', borderRadius: '17px', padding: '30px' }}>
        <h2 className='clinic-header' style={{ 
          fontSize: '1.5rem',
          fontWeight: '800',
          marginBottom: '30px',
         
        }}>
          Update Employee: {formData.firstName} {formData.lastName}
        </h2>

        <form onSubmit={handleSubmit}>
          {formError && <div className="form-error">{formError}</div>}
          {formSuccess && <div className="form-success">Employee updated successfully!</div>}

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
                      <p>{employeeData.photoFileId ? 'Employee has existing photo' : 'No photo selected'}</p>
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
                    Select New Photo
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

            <h3 className="form-section-title">Basic Information</h3>

            <div className="form-group">
              <label>Employee Code <span className="required">*</span></label>
              <input required name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>First Name <span className="required">*</span></label>
              <input required name="firstName" value={formData.firstName} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Last Name <span className="required">*</span></label>
              <input required name="lastName" value={formData.lastName} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange}>
                <option value="0">Select Gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Birth Date</label>
              <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                <option value="0">Select Blood Group</option>
                {BLOOD_GROUP_OPTIONS.map((bg) => (
                  <option key={bg.id} value={bg.id}>{bg.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Marital Status</label>
              <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange}>
                <option value="0">Select Status</option>
                {MARITAL_STATUS_OPTIONS.map((ms) => (
                  <option key={ms.id} value={ms.id}>{ms.label}</option>
                ))}
              </select>
            </div>

            <h3 className="form-section-title">Contact Information</h3>

            <div className="form-group full-width">
              <label>Address</label>
              <textarea name="address" rows={3} value={formData.address} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Mobile <span className="required">*</span></label>
              <input required name="mobile" value={formData.mobile} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Alternate Mobile</label>
              <input name="altMobile" value={formData.altMobile} onChange={handleInputChange} />
            </div>

            <div className="form-group full-width">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>

            <h3 className="form-section-title">Professional Information</h3>

            <div className="form-group">
              <label>Department <span className="required">*</span></label>
              <select required name="departmentId" value={formData.departmentId} onChange={handleInputChange}>
                <option value="0">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Designation <span className="required">*</span></label>
              <select required name="designation" value={formData.designation} onChange={handleInputChange}>
                <option value="0">Select Designation</option>
                {DESIGNATION_OPTIONS.map((des) => (
                  <option key={des.id} value={des.id}>{des.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Qualification</label>
              <input name="qualification" value={formData.qualification} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Specialization</label>
              <input name="specialization" value={formData.specialization} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>License Number</label>
              <input name="licenseNo" value={formData.licenseNo} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>License Expiry</label>
              <input type="date" name="licenseExpiryDate" value={formData.licenseExpiryDate} onChange={handleInputChange} />
            </div>

            <div className="form-group">
              <label>Experience (Years)</label>
              <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleInputChange} min="0" />
            </div>

            <div className="form-group">
              <label>University Name</label>
              <input name="universityName" value={formData.universityName} onChange={handleInputChange} />
            </div>

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
              <label>Status <span className="required">*</span></label>
              <select required name="status" value={formData.status} onChange={handleInputChange}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons - Full Width */}
          <div className="clinic-modal-footer" style={{ marginTop: '40px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleBack} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="btn-submit">
              {formLoading ? 'Updating...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateEmployee;