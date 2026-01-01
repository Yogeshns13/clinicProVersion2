// src/components/EmployeeList.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiEdit,
  FiEye,
} from 'react-icons/fi';
import { 
  getEmployeeList, 
  getDepartmentList, 
  addEmployee, 
  deleteEmployee 
} from '../api/api.js';
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

// ────────────────────────────────────────────────
const EmployeeList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected / Modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
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
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  // Data fetching
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartmentList(0, 0);
        setDepartments(data);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const departmentId = selectedDepartmentId === 'all' ? 0 : Number(selectedDepartmentId) || 0;
        
        const data = await getEmployeeList(0, {
          EmployeeID: 0,
          DepartmentID: departmentId,
        });
        
        setEmployees(data);
        setAllEmployees(data);
      } catch (err) {
        console.error('fetchEmployees error:', err);
        setError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load employees' }
        );
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [selectedDepartmentId]);

  // ────────────────────────────────────────────────
  // Computed values
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return allEmployees;
    const term = searchTerm.toLowerCase();
    return allEmployees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(term) ||
        emp.firstName?.toLowerCase().includes(term) ||
        emp.lastName?.toLowerCase().includes(term) ||
        emp.employeeCode?.toLowerCase().includes(term) ||
        emp.mobile?.toLowerCase().includes(term) ||
        emp.email?.toLowerCase().includes(term) ||
        emp.departmentName?.toLowerCase().includes(term) ||
        emp.designationDesc?.toLowerCase().includes(term)
    );
  }, [allEmployees, searchTerm]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getGenderLabel = (genderId) => {
    return GENDER_OPTIONS.find((g) => g.id === genderId)?.label || '—';
  };

  const getDesignationLabel = (designationId) => {
    return DESIGNATION_OPTIONS.find((d) => d.id === designationId)?.label || '—';
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openDetails = (employee) => setSelectedEmployee(employee);
  
  const closeModal = () => setSelectedEmployee(null);

  const openAddForm = () => {
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
    });
    setFormError('');
    setFormSuccess(false);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      await addEmployee({
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
      });

      setFormSuccess(true);
      setTimeout(() => {
        closeAddForm();
        const departmentId = selectedDepartmentId === 'all' ? 0 : Number(selectedDepartmentId) || 0;
        getEmployeeList(0, { EmployeeID: 0, DepartmentID: departmentId }).then((data) => {
          setEmployees(data);
          setAllEmployees(data);
        });
      }, 1500);
    } catch (err) {
      console.error('Add employee failed:', err);
      setFormError(err.message || 'Failed to add employee.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = (employee) => {
    navigate(`/update-employee/${employee.id}`);
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      setError(null);
      await deleteEmployee(employeeId);
      
      const departmentId = selectedDepartmentId === 'all' ? 0 : Number(selectedDepartmentId) || 0;
      const data = await getEmployeeList(0, { EmployeeID: 0, DepartmentID: departmentId });
      setEmployees(data);
      setAllEmployees(data);
      
      setSelectedEmployee(null);
    } catch (err) {
      console.error('Delete employee failed:', err);
      setError({ message: err.message || 'Failed to delete employee.' });
    }
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading employees...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Employee Management" />

      {/* Toolbar */}
      <div className="clinic-toolbar">
        <div className="clinic-select-wrapper">
          <select
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            className="clinic-select"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div className="clinic-search-container">
          <input
            type="text"
            placeholder="Search by name, code, mobile, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="clinic-search-input"
          />
          <button onClick={handleSearch} className="clinic-search-btn">
            <FiSearch size={20} />
          </button>
        </div>

        <div className="clinic-add-section">
          <button onClick={openAddForm} className="clinic-add-btn">
            <FiPlus size={22} /> Add Emp
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="clinic-table-container">
        <table className="clinic-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Code</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Mobile</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} className="clinic-no-data">
                  {searchTerm ? 'No employees found.' : 'No employees registered yet.'}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className="clinic-name-cell">
                      <div className="clinic-avatar">
                        {employee.firstName?.charAt(0).toUpperCase() || 'E'}
                      </div>
                      <div>
                        <div className="clinic-name">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="clinic-type">{employee.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.employeeCode || '—'}</td>
                  <td>{employee.departmentName || '—'}</td>
                  <td>
                    <span className="branch-type-badge">
                      {getDesignationLabel(employee.designation)}
                    </span>
                  </td>
                  <td>{employee.mobile || '—'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(employee.status)}`}>
                      {employee.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(employee)} className="clinic-details-btn">
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedEmployee && (
        <div className="clinic-modal-overlay" onClick={closeModal}>
          <div className="clinic-modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <div className="details-header-content">
                <div className="clinic-avatar-large">
                  {selectedEmployee.firstName?.charAt(0).toUpperCase() || 'E'}
                </div>
                <div>
                  <h2>
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <p className="clinic-subtitle">
                    {getDesignationLabel(selectedEmployee.designation)} - {selectedEmployee.departmentName}
                  </p>
                </div>
              </div>
              <div className="status-badge-large-wrapper">
                <span className={`status-badge large ${getStatusClass(selectedEmployee.status)}`}>
                  {selectedEmployee.status.toUpperCase()}
                </span>
              </div>
              <button onClick={closeModal} className="clinic-modal-close">
                ×
              </button>
            </div>

            <div className="details-modal-body">
              <table className="details-table">
                <tbody>
                  <tr>
                    <td className="label">Employee Code</td>
                    <td className="value">{selectedEmployee.employeeCode || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Department</td>
                    <td className="value">{selectedEmployee.departmentName || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Designation</td>
                    <td className="value">{getDesignationLabel(selectedEmployee.designation)}</td>
                  </tr>
                  <tr>
                    <td className="label">Gender</td>
                    <td className="value">{getGenderLabel(selectedEmployee.gender)}</td>
                  </tr>
                  <tr>
                    <td className="label">Mobile</td>
                    <td className="value">{selectedEmployee.mobile || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Email</td>
                    <td className="value">{selectedEmployee.email || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Branch</td>
                    <td className="value">{selectedEmployee.branchName || '—'}</td>
                  </tr>
                  <tr>
                    <td className="label">Clinic</td>
                    <td className="value">{selectedEmployee.clinicName || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="clinic-modal-footer">
              <button onClick={() => handleDelete(selectedEmployee.id)} className="btn-hold btn-delete">
                Delete Employee
              </button>
              <button onClick={() => handleUpdateClick(selectedEmployee)} className="btn-update">
                Update Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className="clinic-modal-overlay" onClick={closeAddForm}>
          <div className="clinic-modal form-modal employee-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="clinic-modal-header">
              <h2>Add New Employee</h2>
              <button onClick={closeAddForm} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="clinic-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">Employee added successfully!</div>}

              <div className="form-grid">
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
                <button type="button" onClick={closeAddForm} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={formLoading} className="btn-submit">
                  {formLoading ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;