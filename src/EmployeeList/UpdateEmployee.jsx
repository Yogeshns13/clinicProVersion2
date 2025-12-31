// src/components/UpdateEmployee.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiArrowLeft, FiSave } from 'react-icons/fi';
import { getEmployeeList, getDepartmentList, updateEmployee } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
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

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
  { id: 3, label: 'Probation' },
  { id: 4, label: 'Suspended' },
  { id: 5, label: 'Retired' },
  { id: 6, label: 'Deleted' },
];

const SHIFT_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
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
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const deptData = await getDepartmentList(0, 0);
        setDepartments(deptData || []);

        const empList = await getEmployeeList(0, {
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
          shiftId: employee.shiftId || 0,
          status: employee.status === 'active' ? 1 : 2,
        });
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
        status: Number(formData.status),
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

  if (error) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Employee" />
        <div className="clinic-error">Error: {error.message || error}</div>
        <button onClick={handleBack} className="clinic-add-btn clinic-back-btn">
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  if (!employeeData) {
    return (
      <div className="clinic-list-wrapper">
        <Header title="Update Employee" />
        <div className="clinic-error">Employee not found</div>
        <button onClick={handleBack} className="clinic-add-btn clinic-back-btn">
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Update Employee" />

      <div className="clinic-toolbar">
        <button onClick={handleBack} className="clinic-add-btn">
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      <div className="clinic-table-container update-employee-container">
        <div className="clinic-modal form-modal update-employee-form">
          <div className="clinic-modal-header update-employee-header">
            <h2>
              Update Employee: {formData.firstName} {formData.lastName}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="clinic-modal-body">
            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">Employee updated successfully!</div>}

            <div className="form-grid">
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
                <input name="altMobile" value={formData.altMobile} onChange={handleInputChange} />
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

              <h3 className="form-section-title">ID Proof Details</h3>

              <div className="form-group">
                <label>ID Proof Type</label>
                <select name="idProofType" value={formData.idProofType} onChange={handleInputChange}>
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
                <input name="idNumber" value={formData.idNumber} onChange={handleInputChange} />
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
                <input name="licenseNo" value={formData.licenseNo} onChange={handleInputChange} />
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
                  {SHIFT_OPTIONS.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  Status <span className="required">*</span>
                </label>
                <select required name="status" value={formData.status} onChange={handleInputChange}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="clinic-modal-footer update-employee-footer">
              <button type="button" onClick={handleBack} className="btn-cancel">
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="btn-submit">
                <FiSave className="btn-icon" />
                {formLoading ? 'Updating...' : 'Update Employee'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateEmployee;