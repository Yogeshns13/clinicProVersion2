// src/components/EmployeeList.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiSearch, FiPlus, FiX, FiPhone, FiAward, FiBookOpen, FiClock } from 'react-icons/fi';
import { getEmployeeList, getDepartmentList } from '../Api/Api.js';
import Header from '../Header/Header.jsx';
import AddEmployee from './AddEmployee.jsx';
import ViewEmployee from './ViewEmployee.jsx';
import styles from './EmployeeList.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';
import { getValues, initTables } from '../Api/TableService.js'; // ← NEW

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────
// INDEXEDDB PERSISTENCE HELPERS
// ──────────────────────────────────────────────────
const IDB_DB_NAME    = 'AppPreferences';
const IDB_STORE_NAME = 'columnPrefs';
const IDB_KEY        = 'employeeListColPrefs';

const openIDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });

const idbGet = async (key) => {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req   = store.get(key);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch {
    return undefined;
  }
};

const idbSet = async (key, value) => {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req   = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch {
    // Silently fail — column prefs are non-critical
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic column pool
// ─────────────────────────────────────────────────────────────────────────────
const DYNAMIC_COLS_MAP = {
  altMobile:      { id: 'altMobile',      label: 'Alt Mobile',     header: 'Alt Mobile',     icon: <FiPhone    size={15} />, render: (e) => e.altMobile      || '—' },
  qualification:  { id: 'qualification',  label: 'Qualification',  header: 'Qualification',  icon: <FiBookOpen size={15} />, render: (e) => e.qualification  || '—' },
  specialization: { id: 'specialization', label: 'Specialization', header: 'Specialization', icon: <FiAward    size={15} />, render: (e) => e.specialization || '—' },
  experience:     { id: 'experience',     label: 'Experience',     header: 'Experience',     icon: <FiClock    size={15} />, render: (e) => (e.experienceYears !== undefined && e.experienceYears !== null) ? e.experienceYears : '—' },
};

const SLOT_DEFAULTS = [
  { header: 'Branch',     render: (e) => e.branchName     || '—' },
  { header: 'Department', render: (e) => e.departmentName || '—' },
  { header: 'Mobile',     render: (e) => e.mobile         || '—' },
  { header: 'Status',     render: (e) => e.status         || '—', isStatus: true },
];

const INITIAL_ORDER = ['altMobile', 'qualification', 'specialization', 'experience'];

// ────────────────────────────────────────────────
const EmployeeList = () => {
  // Data
  const [employees,   setEmployees]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── Status options from TableService (Table ID 6) ──
  const [statusOptions, setStatusOptions] = useState([]);

  // ── Dynamic columns state ──
  const [activeColumns, setActiveColumns] = useState(new Set());
  const [menuOrder,     setMenuOrder]     = useState(INITIAL_ORDER);
  const [prefsLoaded,   setPrefsLoaded]   = useState(false);

  // Filter inputs (staged — not applied until Search is clicked)
  const [filterInputs, setFilterInputs] = useState(DEFAULT_FILTERS);

  // Applied filters (drive the API call)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  const [hasSearched, setHasSearched] = useState(false);

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

  const showClearBtn =
    hasSearched && (
      appliedFilters.searchValue.trim() !== DEFAULT_FILTERS.searchValue ||
      appliedFilters.status             !== DEFAULT_FILTERS.status      ||
      appliedFilters.departmentId       !== DEFAULT_FILTERS.departmentId ||
      appliedFilters.designation        !== DEFAULT_FILTERS.designation
    );

  // ── Load status options from TableService (Table ID 6) ───────────────────
  // We await initTables() first to ensure memoryCache is populated before
  // calling getValues(), since the cache may still be empty on first render.
  useEffect(() => {
    const loadStatusOptions = async () => {
      try {
        await initTables();
        const values = getValues(6);
        console.log('Table 6 raw:', values); // ← remove after confirming
        if (values && values.length > 0) {
          setStatusOptions(
            values.map((v) => ({ id: v.textId, label: v.textValue }))
          );
        }
      } catch (err) {
        console.error('Failed to load status options from TableService:', err);
      }
    };
    loadStatusOptions();
  }, []);

  // ── Load column prefs from IndexedDB on mount ─────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const saved = await idbGet(IDB_KEY);
        if (saved) {
          const { activeColumns: savedActive, menuOrder: savedOrder } = saved;
          if (Array.isArray(savedActive)) {
            setActiveColumns(new Set(savedActive));
          }
          if (
            Array.isArray(savedOrder) &&
            savedOrder.length === INITIAL_ORDER.length &&
            savedOrder.every((id) => id in DYNAMIC_COLS_MAP)
          ) {
            setMenuOrder(savedOrder);
          }
        }
      } catch {
        // Use defaults — non-critical
      } finally {
        setPrefsLoaded(true);
      }
    })();
  }, []);

  // ── Save column prefs to IndexedDB whenever they change ──────────────────
  useEffect(() => {
    if (!prefsLoaded) return;
    idbSet(IDB_KEY, {
      activeColumns: [...activeColumns],
      menuOrder,
    });
  }, [activeColumns, menuOrder, prefsLoaded]);

  // ─────────────────────────────────────────────────────────────────────────────
  // tableSlots
  // ─────────────────────────────────────────────────────────────────────────────
  const tableSlots = useMemo(() => {
    return SLOT_DEFAULTS.map((def, slotIdx) => {
      const colId  = menuOrder[slotIdx];
      const dynCol = colId ? DYNAMIC_COLS_MAP[colId] : null;
      if (dynCol && activeColumns.has(colId)) {
        return { header: dynCol.header, render: dynCol.render, isStatus: false };
      }
      return { header: def.header, render: def.render, isStatus: def.isStatus || false };
    });
  }, [activeColumns, menuOrder]);

  const toggleDynCol = useCallback((id) => {
    setActiveColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleMenuReorder = useCallback(
    (newOrderIds) => setMenuOrder(newOrderIds),
    []
  );

  const employeeMenuItems = menuOrder.map((id) => {
    const col = DYNAMIC_COLS_MAP[id];
    return {
      id:       col.id,
      icon:     col.icon,
      label:    col.label,
      checked:  activeColumns.has(col.id),
      keepOpen: true,
      onClick:  () => toggleDynCol(col.id),
    };
  });

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
  // Data fetching
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

  // Resolve status label from TableService data (Table ID 6)
  const getStatusLabel = (statusId) => {
    if (statusId === undefined || statusId === null) return '—';
    const found = statusOptions.find((s) => s.id === Number(statusId));
    return found ? found.label : statusId;
  };

  // textId 1 = Active in Table 6 → active style; everything else → inactive
  const getStatusClass = (statusId) => {
    if (Number(statusId) === 1) return styles.active;
    return styles.inactive;
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    if (searchBtnDisabled) return;
    setSearchBtnDisabled(true);
    const newFilters = { ...filterInputs };
    setAppliedFilters(newFilters);
    setPage(1);
    const isDifferentFromDefault =
      newFilters.searchValue.trim() !== DEFAULT_FILTERS.searchValue ||
      newFilters.status             !== DEFAULT_FILTERS.status      ||
      newFilters.departmentId       !== DEFAULT_FILTERS.departmentId ||
      newFilters.designation        !== DEFAULT_FILTERS.designation;
    setHasSearched(isDifferentFromDefault);
    setTimeout(() => setSearchBtnDisabled(false), 2000);
  };

  const handleClearFilters = () => {
    if (clearBtnDisabled) return;
    setClearBtnDisabled(true);
    setFilterInputs(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setHasSearched(false);
    setPage(1);
    setTimeout(() => setClearBtnDisabled(false), 2000);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
  };

  const handleViewDetails    = (employee) => setViewEmployeeId(employee.id);

  const handleCloseViewEmployee = () => {
    setViewEmployeeId(null);
    fetchEmployees(appliedFilters);
  };

  const openAddForm  = () => setIsAddFormOpen(true);
  const closeAddForm = () => {
    setIsAddFormOpen(false);
    fetchEmployees(appliedFilters);
  };

  const handleAddSuccess      = () => fetchEmployees(appliedFilters);
  const handleEmployeeDeleted = () => { setViewEmployeeId(null); fetchEmployees(appliedFilters); };
  const handleUpdateSuccess   = () => fetchEmployees(appliedFilters);
  const handleActionError     = () => {};

  // ────────────────────────────────────────────────
  if (loading) return <div className={styles.loading}><LoadingPage /></div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.listWrapper}>
      <Header
        title="Employee Management"
        menuItems={employeeMenuItems}
        onMenuReorder={handleMenuReorder}
      />

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

          {/* Status — populated from TableService Table ID 6 */}
          <div className={styles.filterGroup}>
            <select
              name="status"
              value={filterInputs.status}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Status</option>
              {statusOptions.map((s) => (
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

            {showClearBtn && (
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
                <th>Designation</th>
                {tableSlots.map((slot, i) => <th key={i}>{slot.header}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.noData}>
                    {showClearBtn ? 'No employees found.' : 'No employees registered yet.'}
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
                    <td>{employee.clinicName || '—'}</td>
                    <td>
                      <span className={styles.designationBadge}>
                        {getDesignationLabel(employee.designation)}
                      </span>
                    </td>
                    {tableSlots.map((slot, i) =>
                      slot.isStatus ? (
                        <td key={i}>
                          <span className={`${styles.statusBadge} ${getStatusClass(employee.statusId ?? employee.status)}`}>
                            {getStatusLabel(employee.statusId ?? employee.status)}
                          </span>
                        </td>
                      ) : (
                        <td key={i}>{slot.render(employee)}</td>
                      )
                    )}
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