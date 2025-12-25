// src/components/EmployeeList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { getEmployeeList, addEmployee, updateEmployee } from '../api/api.js';
import './EmployeeList.css';
import { FiSearch, FiPlus, FiX, FiUser, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import ErrorHandler from "../hooks/Errorhandler.jsx";

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [employeeIdForUpdate, setEmployeeIdForUpdate] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeCode: '',
    gender: '1',
    birthDate: '',
    bloodGroup: '',
    maritalStatus: '1',
    mobile: '',
    altMobile: '',
    email: '',
    address: '',
    idProofType: '0',
    idNumber: '',
    idExpiry: '',
    departmentId: '',
    designation: '1',
    qualification: '',
    specialization: '',
    licenseNo: '',
    licenseExpiryDate: '',
    experienceYears: '',
    universityName: '',
    pfNo: '',
    esiNo: '',
    shiftId: '',
    status: 'active'
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEmployeeList();
      setEmployees(data);
      setAllEmployees(data);
    } catch (err) {
      if (err?.status >= 400 || err?.code >= 400) {
        setError(err);
      } else {
        setError({ message: err.message || 'Failed to load employees' });
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return allEmployees;
    const term = searchTerm.toLowerCase();
    return allEmployees.filter(emp =>
      emp.fullName?.toLowerCase().includes(term) ||
      emp.employeeCode?.toLowerCase().includes(term) ||
      emp.mobile?.includes(searchTerm) ||
      emp.email?.toLowerCase().includes(term)
    );
  }, [allEmployees, searchTerm]);

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const openDetails = (emp) => setSelectedEmployee(emp);
  const closeDetails = () => setSelectedEmployee(null);

  const openAddForm = () => {
    setIsUpdateMode(false);
    setEmployeeIdForUpdate(null);
    setFormData({
      firstName: '', lastName: '', employeeCode: '', gender: '1',
      birthDate: '', bloodGroup: '', maritalStatus: '1',
      mobile: '', altMobile: '', email: '', address: '',
      idProofType: '0', idNumber: '', idExpiry: '',
      departmentId: '', designation: '1', qualification: '',
      specialization: '', licenseNo: '', licenseExpiryDate: '',
      experienceYears: '', universityName: '', pfNo: '', esiNo: '', shiftId: '',
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
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      employeeCode: emp.employeeCode || '',
      gender: emp.gender === 'Male' ? '1' : emp.gender === 'Female' ? '2' : '3',
      birthDate: emp.birthDate || '',
      bloodGroup: emp.bloodGroup?.toString() || '',
      maritalStatus: emp.maritalStatus?.toString() || '1',
      mobile: emp.mobile || '',
      altMobile: emp.altMobile || '',
      email: emp.email || '',
      address: emp.address || '',
      idProofType: emp.idProofType?.toString() || '0',
      idNumber: emp.idNumber || '',
      idExpiry: emp.idExpiry || '',
      departmentId: emp.departmentId || '',
      designation: emp.designationId?.toString() || '1',
      qualification: emp.qualification || '',
      specialization: emp.specialization || '',
      licenseNo: emp.licenseNo || '',
      licenseExpiryDate: emp.licenseExpiryDate || '',
      experienceYears: emp.experienceYears || '',
      universityName: emp.universityName || '',
      pfNo: emp.pfNo || '',
      esiNo: emp.esiNo || '',
      shiftId: emp.shiftId || '',
      status: emp.status || 'active'
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

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        employeeCode: formData.employeeCode.trim(),
        gender: Number(formData.gender),
        birthDate: formData.birthDate || null,
        bloodGroup: formData.bloodGroup ? Number(formData.bloodGroup) : 0,
        maritalStatus: Number(formData.maritalStatus),
        mobile: formData.mobile.trim(),
        altMobile: formData.altMobile.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        idProofType: Number(formData.idProofType),
        idNumber: formData.idNumber.trim(),
        idExpiry: formData.idExpiry || null,
        departmentId: Number(formData.departmentId) || 0,
        designation: Number(formData.designation),
        qualification: formData.qualification.trim(),
        specialization: formData.specialization.trim(),
        licenseNo: formData.licenseNo.trim(),
        licenseExpiryDate: formData.licenseExpiryDate || null,
        experienceYears: Number(formData.experienceYears) || 0,
        universityName: formData.universityName.trim(),
        pfNo: formData.pfNo.trim(),
        esiNo: formData.esiNo.trim(),
        shiftId: Number(formData.shiftId) || 0,
      };

      if (isUpdateMode) {
        await updateEmployee({
          employeeId: employeeIdForUpdate,
          ...payload,
          status: formData.status === 'active' ? 1 : 2
        });
      } else {
        await addEmployee(payload);
      }

      setFormSuccess(true);
      setTimeout(() => {
        closeForm();
        fetchEmployees();
      }, 1500);
    } catch (err) {
      console.error("Save failed:", err);
      if (err?.status >= 400 || err?.code >= 400) {
        setError(err);
      } else {
        setFormError(err.message || "Failed to save employee.");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusToggle = (emp) => {
    openUpdateForm({ ...emp, status: emp.status === 'active' ? 'inactive' : 'active' });
  };

  if (error && (error.status >= 400 || error.code >= 400)) return <ErrorHandler error={error} />;
  if (loading) return <div className="employee-loading">Loading employees...</div>;
  if (error) return <div className="employee-error">Error: {error.message}</div>;

  return (
    <div className="employee-list-wrapper">

      <div className="employee-list-header">
        <h1>Employee Management</h1>
        <p>Manage doctors, nurses, and staff across clinics</p>
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

      <div className="employee-add-section">
        <button onClick={openAddForm} className="employee-add-btn">
          <FiPlus size={22} /> Add Employee
        </button>
      </div>

      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Code</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="8" className="employee-no-data">
                  {searchTerm ? 'No employees found.' : 'No employees registered yet.'}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="employee-name-cell">
                      <div className="employee-avatar"><FiUser size={22} /></div>
                      <div>
                        <div className="employee-name">{emp.fullName}</div>
                        <div className="employee-subtitle">{emp.designationDesc || 'Staff'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono">{emp.employeeCode || '—'}</td>
                  <td>{emp.mobile || '—'}</td>
                  <td>{emp.email || '—'}</td>
                  <td>{emp.departmentName || '—'}</td>
                  <td>{emp.designationDesc || '—'}</td>
                  <td>
                    <span className={`status-badge ${emp.status}`}>
                      {emp.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(emp)} className="employee-details-btn">
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedEmployee && (
        <div className="employee-modal-overlay" onClick={closeDetails}>
          <div className="employee-modal" onClick={(e) => e.stopPropagation()}>
            <div className="employee-modal-header">
              <h2>{selectedEmployee.fullName}</h2>
              <button onClick={closeDetails} className="employee-modal-close">×</button>
            </div>
            <div className="employee-modal-body">
              <div className="employee-info-grid">
                <div className="info-item"><label>Employee Code</label><p>{selectedEmployee.employeeCode || '—'}</p></div>
                <div className="info-item"><label>Gender</label><p>{selectedEmployee.gender || '—'}</p></div>
                <div className="info-item"><label>Date of Birth</label><p>{selectedEmployee.birthDate || '—'}</p></div>
                <div className="info-item"><label>Blood Group</label><p>{selectedEmployee.bloodGroup || '—'}</p></div>
                <div className="info-item"><label>Mobile</label><p><FiPhone /> {selectedEmployee.mobile || '—'}</p></div>
                <div className="info-item"><label>Alt Mobile</label><p>{selectedEmployee.altMobile || '—'}</p></div>
                <div className="info-item"><label>Email</label><p><FiMail /> {selectedEmployee.email || '—'}</p></div>
                <div className="info-item"><label>Address</label><p><FiMapPin /> {selectedEmployee.address || '—'}</p></div>
                <div className="info-item"><label>ID Proof</label><p>{selectedEmployee.idNumber || '—'}</p></div>
                <div className="info-item"><label>Department</label><p>{selectedEmployee.departmentName || '—'}</p></div>
                <div className="info-item"><label>Designation</label><p>{selectedEmployee.designationDesc || '—'}</p></div>
                <div className="info-item"><label>Qualification</label><p>{selectedEmployee.qualification || '—'}</p></div>
                <div className="info-item"><label>Specialization</label><p>{selectedEmployee.specialization || '—'}</p></div>
                <div className="info-item"><label>License No</label><p>{selectedEmployee.licenseNo || '—'}</p></div>
                <div className="info-item"><label>Experience</label><p>{selectedEmployee.experienceYears ? `${selectedEmployee.experienceYears} years` : '—'}</p></div>
                <div className="info-item"><label>Status</label>
                  <span className={`status-badge large ${selectedEmployee.status}`}>
                    {selectedEmployee.status.toUpperCase()}
                  </span>
                </div>
                <div className="info-item"><label>Employee ID</label><p>#{selectedEmployee.id}</p></div>
              </div>
            </div>
            <div className="employee-modal-footer">
              <button onClick={() => handleStatusToggle(selectedEmployee)} className="btn-hold">
                {selectedEmployee.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => openUpdateForm(selectedEmployee)} className="btn-update">
                Update Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Update Form Modal */}
      {isFormOpen && (
        <div className="employee-modal-overlay" onClick={closeForm}>
          <div className="employee-modal form-modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="employee-modal-header">
              <h2>{isUpdateMode ? 'Update Employee' : 'Add New Employee'}</h2>
              <button onClick={closeForm} className="employee-modal-close"><FiX size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="employee-modal-body">
              {formError && <div className="form-error">{formError}</div>}
              {formSuccess && <div className="form-success">Employee {isUpdateMode ? 'updated' : 'added'} successfully!</div>}

              <div className="form-grid">
                <div className="form-group">
                  <label>First Name <span className="required">*</span></label>
                  <input required name="firstName" value={formData.firstName} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input name="lastName" value={formData.lastName} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Employee Code</label>
                  <input name="employeeCode" value={formData.employeeCode} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="1">Male</option>
                    <option value="2">Female</option>
                    <option value="3">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Blood Group</label>
                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange}>
                    <option value="">Select</option>
                    <option value="1">A+</option>
                    <option value="2">A-</option>
                    <option value="3">B+</option>
                    <option value="4">B-</option>
                    <option value="5">AB+</option>
                    <option value="6">AB-</option>
                    <option value="7">O+</option>
                    <option value="8">O-</option>
                    <option value="9">Others</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Marital Status</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange}>
                    <option value="1">Single</option>
                    <option value="2">Married</option>
                    <option value="3">Widowed</option>
                    <option value="4">Divorced</option>
                    <option value="5">Separated</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mobile <span className="required">*</span></label>
                  <input required name="mobile" value={formData.mobile} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Alternate Mobile</label>
                  <input name="altMobile" value={formData.altMobile} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea name="address" rows="2" value={formData.address} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>ID Proof Type</label>
                  <select name="idProofType" value={formData.idProofType} onChange={handleInputChange}>
                    <option value="0">None</option>
                    <option value="1">Aadhaar Card</option>
                    <option value="2">Passport</option>
                    <option value="3">Driving License</option>
                    <option value="4">Voter ID</option>
                    <option value="5">PAN Card</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ID Number</label>
                  <input name="idNumber" value={formData.idNumber} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>ID Expiry Date</label>
                  <input type="date" name="idExpiry" value={formData.idExpiry} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Department ID</label>
                  <input type="number" name="departmentId" value={formData.departmentId} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <select name="designation" value={formData.designation} onChange={handleInputChange}>
                    <option value="1">Doctor</option>
                    <option value="2">Nurse</option>
                    <option value="3">Receptionist</option>
                    <option value="4">Pharmacist</option>
                    <option value="5">Lab Technician</option>
                    <option value="6">Billing Staff</option>
                    <option value="7">Manager</option>
                    <option value="8">Attendant</option>
                    <option value="9">Cleaner</option>
                    <option value="10">Others</option>
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
                  <label>License No</label>
                  <input name="licenseNo" value={formData.licenseNo} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>License Expiry</label>
                  <input type="date" name="licenseExpiryDate" value={formData.licenseExpiryDate} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Experience (Years)</label>
                  <input type="number" name="experienceYears" value={formData.experienceYears} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>University / College</label>
                  <input name="universityName" value={formData.universityName} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>PF Number</label>
                  <input name="pfNo" value={formData.pfNo} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>ESI Number</label>
                  <input name="esiNo" value={formData.esiNo} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Shift ID</label>
                  <input type="number" name="shiftId" value={formData.shiftId} onChange={handleInputChange} />
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

export default EmployeeList