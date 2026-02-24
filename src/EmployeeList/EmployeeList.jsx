// src/components/EmployeeList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { getEmployeeList, getDepartmentList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddEmployee from './AddEmployee.jsx';
import styles from './EmployeeList.module.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
  { id: 3, label: 'Probation' },
  { id: 4, label: 'Suspended' },
  { id: 5, label: 'Retired' },
  { id: 6, label: 'Deleted' },
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

const SEARCH_TYPE_OPTIONS = [
  { value: 'Name',         label: 'Name' },
  { value: 'Mobile',       label: 'Mobile' },
  { value: 'EmployeeCode', label: 'Emp Code' },
];

// ────────────────────────────────────────────────
const EmployeeList = () => {
  const navigate = useNavigate();

  // Data
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter inputs (staged — not applied until Search is clicked)
  const [filterInputs, setFilterInputs] = useState({
    searchType:    'Name',
    searchValue:   '',
    status:        '',
    departmentId:  '',
    designation:   '',
  });

  // Applied filters (drive the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:    'Name',
    searchValue:   '',
    status:        '',
    departmentId:  '',
    designation:   '',
  });

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // ────────────────────────────────────────────────
  // Derived: are any filters actually active?
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.status             !== '' ||
    appliedFilters.departmentId       !== '' ||
    appliedFilters.designation        !== '';

  // ────────────────────────────────────────────────
  // Fetch departments (once)
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

  // ────────────────────────────────────────────────
  // Data fetching — driven by appliedFilters
  const fetchEmployees = async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        BranchID:      branchId,
        EmployeeID:    0,
        Name:          filters.searchType === 'Name'         ? filters.searchValue : '',
        Mobile:        filters.searchType === 'Mobile'       ? filters.searchValue : '',
        EmployeeCode:  filters.searchType === 'EmployeeCode' ? filters.searchValue : '',
        DepartmentID:  filters.departmentId !== '' ? Number(filters.departmentId) : 0,
        Designation:   filters.designation  !== '' ? Number(filters.designation)  : 0,
        Status:        filters.status       !== '' ? Number(filters.status)        : -1,
      };

      const data = await getEmployeeList(clinicId, options);
      setEmployees(data);
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
    fetchEmployees(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getDesignationLabel = (designationId) =>
    DESIGNATION_OPTIONS.find((d) => d.id === designationId)?.label || '—';

  const getStatusClass = (status) => {
    if (status === 'active')   return styles.active;
    if (status === 'inactive') return styles.inactive;
    return styles.inactive;
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const empty = { searchType: 'Name', searchValue: '', status: '', departmentId: '', designation: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
  };

  const handleViewDetails = (employee) => navigate(`/view-employee/${employee.id}`);

  const openAddForm  = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => fetchEmployees(appliedFilters);

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading employees...</div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.listWrapper}>
      <Header title="Employee Management" />

      {/* ── Filter Bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          {/* Search type + value */}
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              {SEARCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${SEARCH_TYPE_OPTIONS.find((o) => o.value === filterInputs.searchType)?.label || ''}...`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          {/* Department */}
          <div className={styles.filterGroup}>
            <select
              name="departmentId"
              value={filterInputs.departmentId}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          {/* Designation */}
          <div className={styles.filterGroup}>
            <select
              name="designation"
              value={filterInputs.designation}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Designations</option>
              {DESIGNATION_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className={styles.filterGroup}>
            <select
              name="status"
              value={filterInputs.status}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={16} />
                Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.addBtn}>
              <FiPlus size={18} />
              Add Emp
            </button>
          </div>

        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
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
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.noData}>
                  {hasActiveFilters ? 'No employees found.' : 'No employees registered yet.'}
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {employee.firstName?.charAt(0).toUpperCase() || 'E'}
                      </div>
                      <div>
                        <div className={styles.name}>
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className={styles.subInfo}>{employee.email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.employeeCode || '—'}</td>
                  <td>{employee.departmentName || '—'}</td>
                  <td>
                    <span className={styles.designationBadge}>
                      {getDesignationLabel(employee.designation)}
                    </span>
                  </td>
                  <td>{employee.mobile || '—'}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(employee.status)}`}>
                      {employee.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleViewDetails(employee)}
                      className={styles.detailsBtn}
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