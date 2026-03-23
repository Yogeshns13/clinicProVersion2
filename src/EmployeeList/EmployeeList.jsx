// src/components/EmployeeList.jsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { getEmployeeList, getDepartmentList } from '../Api/Api.js';
import Header from '../Header/Header.jsx';
import AddEmployee from './AddEmployee.jsx';
import ViewEmployee from './ViewEmployee.jsx';
import styles from './EmployeeList.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

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
  { id: 1,  label: 'Doctor' },
  { id: 2,  label: 'Nurse' },
  { id: 3,  label: 'Receptionist' },
  { id: 4,  label: 'Pharmacist' },
  { id: 5,  label: 'Lab Technician' },
  { id: 6,  label: 'Billing Staff' },
  { id: 7,  label: 'Manager' },
  { id: 8,  label: 'Attendant' },
  { id: 9,  label: 'Cleaner' },
  { id: 10, label: 'Others' },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'Name',         label: 'Name' },
  { value: 'Mobile',       label: 'Mobile' },
  { value: 'EmployeeCode', label: 'Emp Code' },
];

// ── Default to status = 1 (Active) ───────────────
const DEFAULT_FILTERS = {
  searchType:   'Name',
  searchValue:  '',
  status:       '1',
  departmentId: '',
  designation:  '',
};

// ────────────────────────────────────────────────
const EmployeeList = () => {
  // Data
  const [employees,   setEmployees]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // Filter inputs (staged — not applied until Search is clicked)
  const [filterInputs, setFilterInputs] = useState(DEFAULT_FILTERS);

  // Applied filters (drive the API call) — start with Active
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // ── Button 2-sec cooldowns ──
  const [searchBtnDisabled, setSearchBtnDisabled] = useState(false);
  const [clearBtnDisabled,  setClearBtnDisabled]  = useState(false);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // View Employee Modal
  const [viewEmployeeId, setViewEmployeeId] = useState(null);

  // ────────────────────────────────────────────────
  // Derived: pagination display values
  const startRecord = employees.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + employees.length;

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.status             !== '' ||
    appliedFilters.departmentId       !== '' ||
    appliedFilters.designation        !== '';

  // ────────────────────────────────────────────────
  // Fetch departments (once)
  useEffect(() => {
    const fetchDepartments = async () => {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
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
  // Data fetching — includes pagination
  const fetchEmployees = async (filters = appliedFilters, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        BranchID:     branchId,
        EmployeeID:   0,
        Name:         filters.searchType === 'Name'         ? filters.searchValue : '',
        Mobile:       filters.searchType === 'Mobile'       ? filters.searchValue : '',
        EmployeeCode: filters.searchType === 'EmployeeCode' ? filters.searchValue : '',
        DepartmentID: filters.departmentId !== '' ? Number(filters.departmentId) : 0,
        Designation:  filters.designation  !== '' ? Number(filters.designation)  : 0,
        Status:       filters.status       !== '' ? Number(filters.status)        : -1,
        Page:         currentPage,
        PageSize:     pageSize,
      };

      const data = await getEmployeeList(clinicId, options);
      setEmployees(Array.isArray(data) ? data : []);
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
    fetchEmployees(appliedFilters, page);
  }, [appliedFilters, page]);

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

  // Search button — 2-sec cooldown
  const handleSearch = () => {
    if (searchBtnDisabled) return;
    setSearchBtnDisabled(true);
    setAppliedFilters({ ...filterInputs });
    setPage(1);
    setTimeout(() => setSearchBtnDisabled(false), 2000);
  };

  // Clear button — resets to default (Active) filters
  const handleClearFilters = () => {
    if (clearBtnDisabled) return;
    setClearBtnDisabled(true);
    setFilterInputs(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setPage(1);
    setTimeout(() => setClearBtnDisabled(false), 2000);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
  };

  const handleViewDetails = (employee) => setViewEmployeeId(employee.id);

  const handleCloseViewEmployee = () => {
    setViewEmployeeId(null);
    fetchEmployees(appliedFilters);
  };

  const openAddForm  = () => setIsAddFormOpen(true);
  const closeAddForm = () => {
    setIsAddFormOpen(false);
    fetchEmployees(appliedFilters);
  };

  // ── All callbacks just refresh the list ──────────────────────────────────
  // ── Every popup (success AND error) is shown inside the child component ──
  const handleAddSuccess = () => fetchEmployees(appliedFilters);

  const handleEmployeeDeleted = () => {
    setViewEmployeeId(null);
    fetchEmployees(appliedFilters);
  };

  const handleUpdateSuccess = () => fetchEmployees(appliedFilters);

  const handleActionError = () => {
    // intentionally empty — errors shown inside AddEmployee / ViewEmployee
  };

  // ────────────────────────────────────────────────
  // Early returns

  if (loading) return <div className={styles.loading}><LoadingPage/></div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.listWrapper}>
      <Header title="Employee Management" />

      {/* ── No MessagePopup here — all popups live inside AddEmployee / ViewEmployee ── */}

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

          {/* Status — defaults to Active */}
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
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={searchBtnDisabled}
              style={{
                opacity: searchBtnDisabled ? 0.6 : 1,
                cursor:  searchBtnDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              <FiSearch size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={clearBtnDisabled}
                style={{
                  opacity: clearBtnDisabled ? 0.6 : 1,
                  cursor:  clearBtnDisabled ? 'not-allowed' : 'pointer',
                }}
              >
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

      {/* ── Table + Pagination wrapper ── */}
      <div className={styles.tableSection}>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Code</th>
                <th>Clinic</th>
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
                    <td>{employee.clinicName|| '—'}</td>
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

        {/* ── Pagination Bar ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {employees.length > 0
              ? `Showing ${startRecord}–${endRecord} records`
              : 'No records'}
          </div>

          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              title="First page"
            >
              «
            </button>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              title="Previous page"
            >
              ‹
            </button>

            <span className={styles.pageIndicator}>{page}</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page + 1)}
              disabled={employees.length < pageSize}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{pageSize}</strong>
          </div>
        </div>

      </div>

      {/* ── Add Employee Modal ── */}
      <AddEmployee
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        departments={departments}
        onSuccess={handleAddSuccess}
        onError={handleActionError}
      />

      {/* ── View Employee Modal ── */}
      {viewEmployeeId !== null && (
        <ViewEmployee
          isOpen={viewEmployeeId !== null}
          employeeId={viewEmployeeId}
          onClose={handleCloseViewEmployee}
          onDeleted={handleEmployeeDeleted}
          onSuccess={handleUpdateSuccess}
          onError={handleActionError}
        />
      )}
    </div>
  );
};

export default EmployeeList;