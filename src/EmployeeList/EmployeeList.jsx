// src/components/EmployeeList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  getEmployeeList,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  getClinicList,
  getDepartmentList
} from '../api/api.js';
import './EmployeeList.css';
import { FiSearch, FiPlus, FiUser, FiX, FiEdit2, FiTrash2 } from "react-icons/fi";
import ErrorHandler from '../hooks/Errorhandler.jsx';

const GENDER_MAP = {
  1: "Male",
  2: "Female",
  0: "Not Specified"
};

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState("all");
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [error, setError] = useState(null);

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [employeeIdForUpdate, setEmployeeIdForUpdate] = useState(null);

  const [formData, setFormData] = useState({
    clinicId: '',
    FirstName: '',
    LastName: '',
    employeeCode: '',
    mobile: '',
    altMobile: '',
    email: '',
    gender: 0,
    departmentId: 0,
    designation: 0,
    birthDate: '',
    bloodGroup: 0,
    maritalStatus: 0,
    address: '',
    idProofType: 0,
    idNumber: '',
    idExpiry: '',
    qualification: '',
    specialization: '',
    licenseNo: '',
    licenseExpiryDate: '',
    experienceYears: 0,
    universityName: '',
    pfNo: '',
    esiNo: '',
    shiftId: 0,
    status: 'active'
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Load clinics
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await getClinicList();
        setClinics(data);
      } catch (err) {
        console.error("Failed to load clinics:", err);
      }
    };
    fetchClinics();
  }, []);

  // Load departments whenever the clinic filter changes
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const clinicId = selectedClinicId === "all" ? 0 : parseInt(selectedClinicId) || 0;
        const deptData = await getDepartmentList(clinicId);
        setDepartments(deptData);
      } catch (err) {
        console.error("Failed to load departments:", err);
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [selectedClinicId]);

  // Load employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);
        const clinicId = selectedClinicId === "all" ? 0 : parseInt(selectedClinicId) || 0;
        const data = await getEmployeeList(clinicId);
        setEmployees(data);
        setAllEmployees(data);
      } catch (err) {
        setError(err);
        console.error('fetchEmployees error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [selectedClinicId]);

  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return allEmployees;
    const term = searchTerm.toLowerCase();
    return allEmployees.filter(emp =>
      emp.name?.toLowerCase().includes(term) ||
      emp.employeeCode?.toLowerCase().includes(term) ||
      emp.mobile?.includes(term) ||
      emp.email?.toLowerCase().includes(term) ||
      emp.clinicName?.toLowerCase().includes(term) ||
      emp.departmentName?.toLowerCase().includes(term)
    );
  }, [allEmployees, searchTerm]);

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const openDetails = (emp) => setSelectedEmployee(emp);
  const closeModal = () => setSelectedEmployee(null);

  const openAddForm = () => {
    setIsUpdateMode(false);
    setEmployeeIdForUpdate(null);
    setFormData({
      clinicId: '',
      FirstName: '',
      LastName: '',
      employeeCode: '',
      mobile: '',
      altMobile: '',
      email: '',
      gender: 0,
      departmentId: 0,
      designation: 0,
      birthDate: '',
      bloodGroup: 0,
      maritalStatus: 0,
      address: '',
      idProofType: 0,
      idNumber: '',
      idExpiry: '',
      qualification: '',
      specialization: '',
      licenseNo: '',
      licenseExpiryDate: '',
      experienceYears: 0,
      universityName: '',
      pfNo: '',
      esiNo: '',
      shiftId: 0,
      status: 'active'
    });
    setFormError('');
    setFormSuccess(false);
    setIsFormOpen(true);
  };

  const openUpdateForm = (emp) => {
    setIsUpdateMode(true);
    setEmployeeIdForUpdate(emp.id);

    setFormData({
      clinicId: emp.clinicId || '',
      FirstName: emp.firstName || '',
      LastName: emp.lastName || '',
      employeeCode: emp.employeeCode || '',
      mobile: emp.mobile || '',
      altMobile: emp.altMobile || '',
      email: emp.email || '',
      gender: emp.gender || 0,
      departmentId: emp.departmentId || 0,
      designation: emp.designation || 0,
      birthDate: emp.birthDate || '',
      bloodGroup: emp.bloodGroup || 0,
      maritalStatus: emp.maritalStatus || 0,
      address: emp.address || '',
      idProofType: emp.idProofType || 0,
      idNumber: emp.idNumber || '',
      idExpiry: emp.idExpiry || '',
      qualification: emp.qualification || '',
      specialization: emp.specialization || '',
      licenseNo: emp.licenseNo || '',
      licenseExpiryDate: emp.licenseExpiryDate || '',
      experienceYears: emp.experienceYears || 0,
      universityName: emp.universityName || '',
      pfNo: emp.pfNo || '',
      esiNo: emp.esiNo || '',
      shiftId: emp.shiftId || 0,
      status: emp.status
    });

    setFormError('');
    setFormSuccess(false);
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      const payload = {
        EmployeeCode: formData.employeeCode.trim(),
        FirstName: formData.FirstName.trim(),
        LastName: formData.LastName.trim(),
        PhotoFileID: 0,
        Gender: parseInt(formData.gender),
        BirthDate: formData.birthDate || "",
        BloodGroup: parseInt(formData.bloodGroup),
        MaritalStatus: parseInt(formData.maritalStatus),
        Address: formData.address.trim(),
        Mobile: formData.mobile.trim(),
        AltMobile: formData.altMobile.trim(),
        Email: formData.email.trim(),
        IdProofType: parseInt(formData.idProofType),
        IdNumber: formData.idNumber.trim(),
        IdExpiry: formData.idExpiry || "",
        DepartmentID: parseInt(formData.departmentId),
        Designation: parseInt(formData.designation),
        Qualification: formData.qualification.trim(),
        Specialization: formData.specialization.trim(),
        LicenseNo: formData.licenseNo.trim(),
        LicenseExpiryDate: formData.licenseExpiryDate || "",
        ExperienceYears: parseInt(formData.experienceYears),
        UniversityName: formData.universityName.trim(),
        PFNo: formData.pfNo.trim(),
        ESINo: formData.esiNo.trim(),
        ShiftID: parseInt(formData.shiftId),
      };

      if (isUpdateMode) {
        payload.EmployeeID = employeeIdForUpdate;  // Correct key name required by updateEmployee
        payload.ClinicID = parseInt(formData.clinicId);
        payload.BranchID = parseInt(selectedClinicId) || 0;
        payload.Status = formData.status === 'active' ? 1 : 0;
        await updateEmployee(payload);
      } else {
        payload.ClinicID = parseInt(formData.clinicId);
        payload.BranchID = parseInt(selectedClinicId) || 0;
        await addEmployee(payload);
      }

      setFormSuccess(true);
      setTimeout(() => {
        closeForm();
        const clinicId = selectedClinicId === "all" ? 0 : parseInt(selectedClinicId) || 0;
        getEmployeeList(clinicId).then(data => {
          setEmployees(data);
          setAllEmployees(data);
        });
      }, 1400);

    } catch (err) {
      console.error("Save employee failed:", err);
      setFormError(err.message || "Failed to save employee.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      await deleteEmployee(employeeId);
      const clinicId = selectedClinicId === "all" ? 0 : parseInt(selectedClinicId) || 0;
      const updated = await getEmployeeList(clinicId);
      setEmployees(updated);
      setAllEmployees(updated);
      setSelectedEmployee(null);
    } catch (err) {
      setError(err);
      console.error("Delete failed:", err);
    }
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="employee-loading">Loading employees...</div>;
  if (error) return <div className="employee-error">Error: {error.message || error}</div>;

  return (
    <div className="employee-list-wrapper">
      <div className="employee-list-header">
        <div>
          <h1>Employee Management</h1>
          <p>Manage staff members across all clinics</p>
        </div>
      </div>

      <div className="employee-controls">
        <div className="employee-clinic-filter">
          <div className="clinic-select-wrapper">
            <FiUser className="clinic-select-icon" size={20} />
            <select
              value={selectedClinicId}
              onChange={(e) => setSelectedClinicId(e.target.value)}
              className="clinic-select"
            >
              <option value="all">All Clinics</option>
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="employee-search-section">
          <div className="employee-search-container">
            <input
              type="text"
              placeholder="Search by name, code, mobile, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="employee-search-input"
            />
            <button onClick={handleSearch} className="employee-search-btn">
              <FiSearch size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="employee-add-section">
        <button onClick={openAddForm} className="employee-add-btn-full">
          <FiPlus size={22} /> Add Employee
        </button>
      </div>

      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Clinic</th>
              <th>Department</th>
              <th>Mobile</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="7" className="employee-no-data">
                  {searchTerm ? 'No employees match your search.' : 'No employees found.'}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="employee-name-cell">
                      <div className="employee-avatar">
                        {emp.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className="employee-name">{emp.name}</div>
                        <div className="employee-code">#{emp.employeeCode || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{emp.employeeCode || '—'}</td>
                  <td>{emp.clinicName || '—'}</td>
                  <td>{emp.departmentName || '—'}</td>
                  <td>{emp.mobile || '—'}</td>
                  <td>
                    <span className={`status-badge ${emp.status}`}>
                      {emp.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(emp)} className="employee-details-btn">
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedEmployee && (
        <div className="employee-modal-overlay" onClick={closeModal}>
          <div className="employee-modal" onClick={e => e.stopPropagation()}>
            <div className="employee-modal-header">
              <h2>{selectedEmployee.name}</h2>
              <button onClick={closeModal} className="employee-modal-close">×</button>
            </div>
            <div className="employee-modal-body">
              <div className="employee-info-grid">
                <div className="info-item"><label>Employee Code</label><p>{selectedEmployee.employeeCode || '—'}</p></div>
                <div className="info-item"><label>Clinic</label><p>{selectedEmployee.clinicName || '—'}</p></div>
                <div className="info-item"><label>Department</label><p>{selectedEmployee.departmentName || '—'}</p></div>
                <div className="info-item"><label>Designation</label><p>{selectedEmployee.designationDesc || '—'}</p></div>
                <div className="info-item"><label>Mobile</label><p>{selectedEmployee.mobile || '—'}</p></div>
                <div className="info-item"><label>Email</label><p>{selectedEmployee.email || '—'}</p></div>
                <div className="info-item"><label>Gender</label><p>{GENDER_MAP[selectedEmployee.gender] || '—'}</p></div>
                <div className="info-item"><label>Status</label>
                  <span className={`status-badge large ${selectedEmployee.status}`}>
                    {selectedEmployee.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="employee-modal-footer">
              <button onClick={() => openUpdateForm(selectedEmployee)} className="btn-update">
                <FiEdit2 /> Update
              </button>
              <button onClick={() => handleDelete(selectedEmployee.id)} className="btn-delete">
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="employee-modal-overlay" onClick={closeForm}>
          <div className="employee-modal form-modal" onClick={e => e.stopPropagation()}>
            <div className="employee-modal-header">
              <h2>{isUpdateMode ? 'Update Employee' : 'Add New Employee'}</h2>
              <button onClick={closeForm} className="employee-modal-close">
                <FiX size={28} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="employee-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">Employee successfully {isUpdateMode ? 'updated' : 'added'}!</div>}

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Clinic <span className="required">*</span></label>
                  <select
                    name="clinicId"
                    value={formData.clinicId}
                    onChange={handleInputChange}
                    required
                    disabled={isUpdateMode}
                  >
                    <option value="">Select Clinic</option>
                    {clinics.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input required name="FirstName" value={formData.FirstName} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Last Name <span className="required">*</span></label>
                  <input required name="LastName" value={formData.LastName} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Employee Code</label>
                  <input name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Mobile</label>
                  <input name="mobile" value={formData.mobile} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Alt Mobile</label>
                  <input name="altMobile" value={formData.altMobile} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value={0}>Not Specified</option>
                    <option value={1}>Male</option>
                    <option value={2}>Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Department</label>
                  {loadingDepartments ? (
                    <div className="loading-select">Loading departments...</div>
                  ) : departments.length === 0 ? (
                    <select disabled>
                      <option value={0}>No departments available</option>
                    </select>
                  ) : (
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleInputChange}
                    >
                      <option value={0}>— Select Department —</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Designation</label>
                  <input type="number" name="designation" value={formData.designation} onChange={handleInputChange} min="0" />
                </div>

                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} />
                </div>

                {isUpdateMode && (
                  <div className="form-group full-width">
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="employee-modal-footer">
                <button type="button" onClick={closeForm} className="btn-cancel">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn-submit">
                  {formLoading ? 'Saving...' : (isUpdateMode ? 'Update Employee' : 'Add Employee')}
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