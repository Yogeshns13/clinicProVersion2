// src/components/EmployeeList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiHome } from 'react-icons/fi';
import { getEmployeeList, getDepartmentList} from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddEmployee from './AddEmployee.jsx';
import './EmployeeList.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
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
const EmployeeList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [employees, setEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // ────────────────────────────────────────────────
  // Data fetching
  useEffect(() => {
    const fetchDepartments = async () => {
        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));
      try {
        const data = await getDepartmentList(clinicId, branchId, {});
        setDepartments(data);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const departmentId = selectedDepartmentId === 'all' ? 0 : Number(selectedDepartmentId) || 0;

      const data = await getEmployeeList(clinicId, {
        BranchID: branchId,
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

  useEffect(() => {
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

  const handleViewDetails = (employee) => {
    navigate(`/view-employee/${employee.id}`);
  };

  const openAddForm = () => setIsAddFormOpen(true);

  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchEmployees();
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
          <FiHome className="clinic-select-icon" size={20} />
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
                    <button 
                      onClick={() => handleViewDetails(employee)} 
                      className="clinic-details-btn"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddEmployee
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        departments={departments}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default EmployeeList;