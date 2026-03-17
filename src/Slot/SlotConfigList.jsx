// src/components/SlotConfigList.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiTrash2, FiCalendar, FiX, FiZap, FiCheckCircle } from 'react-icons/fi';
import { getSlotConfigList, getEmployeeList, getShiftList, deleteSlotConfig, getTaskList, deleteTask } from '../Api/Api.js';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

import Header from '../Header/Header.jsx';
import AddSlotConfig from './AddSlotConfig.jsx';
import GenerateSlots from './GenerateSlots.jsx';
import AutoSlotGeneration from './AutoSlotGeneration.jsx';
import styles from './SlotConfigList.module.css';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';

// ────────────────────────────────────────────────
const TASK_TYPE = 2;
const TASK_NAME = 'GenerateSlots';

const DURATION_OPTIONS = [
  { id: 1, label: 'Daily' },
  { id: 2, label: 'Weekend' },
  { id: 3, label: 'Specific Date' },
];

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'DoctorName', label: 'Doctor Name' },
  { value: 'ShiftName',  label: 'Shift' },
];

const PAGE_SIZE = 20;

const SlotConfigList = () => {
  const navigate = useNavigate();

  // Data
  const [configs,      setConfigs]      = useState([]);
  const [doctors,      setDoctors]      = useState([]);
  const [shifts,       setShifts]       = useState([]);
  const [doctorShifts, setDoctorShifts] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Auto-generation task state
  const [autoTaskExists,     setAutoTaskExists]     = useState(false);
  const [autoTaskData,       setAutoTaskData]       = useState(null);
  const [autoTaskLoading,    setAutoTaskLoading]    = useState(true);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disabling,          setDisabling]          = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  // Filter inputs (staged)
  const [filterInputs, setFilterInputs] = useState({
    doctorId:    'all',
    searchType:  'DoctorName',
    searchValue: '',
    duration:    '',
    status:      '',
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    doctorId:    'all',
    searchType:  'DoctorName',
    searchValue: '',
    duration:    '',
    status:      '',
  });

  // Modals
  const [isAddFormOpen,  setIsAddFormOpen]  = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isAutoGenOpen,  setIsAutoGenOpen]  = useState(false);
  const [isAutoEditOpen, setIsAutoEditOpen] = useState(false);
  const [deleteConfirm,  setDeleteConfirm]  = useState(null);

  // ── Toast helper ──
  const showToast = useCallback((message) => {
    setToast({ message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ────────────────────────────────────────────────
  const hasActiveFilters =
    appliedFilters.doctorId    !== 'all' ||
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.duration    !== '' ||
    appliedFilters.status      !== '';

  // ── Fetch auto task status ──
  const fetchAutoTaskStatus = useCallback(async () => {
    setAutoTaskLoading(true);
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const res = await getTaskList({ clinicId, branchId, taskType: TASK_TYPE });
      const foundTask = res.tasks?.find(
        (t) => t.taskType === TASK_TYPE && t.taskName === TASK_NAME
      );
      setAutoTaskExists(!!foundTask);
      setAutoTaskData(foundTask || null);
    } catch {
      setAutoTaskExists(false);
      setAutoTaskData(null);
    } finally {
      setAutoTaskLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutoTaskStatus();
  }, [fetchAutoTaskStatus]);

  // ── Toggle area click inside the compound button ──
  const handleToggleAreaClick = (e) => {
    e.stopPropagation();
    if (autoTaskExists) {
      setShowDisableConfirm(true);
    } else {
      setIsAutoGenOpen(true);
    }
  };

  const handleLabelAreaClick = () => {
    if (autoTaskExists) {
      setIsAutoEditOpen(true);
    } else {
      setIsAutoGenOpen(true);
    }
  };

  const handleDisableConfirm = async () => {
    setDisabling(true);
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await deleteTask({ clinicId, branchId, taskType: TASK_TYPE, taskName: TASK_NAME });
      setAutoTaskExists(false);
      setAutoTaskData(null);
      setShowDisableConfirm(false);
    } catch (err) {
      console.error('Disable auto generation failed:', err);
    } finally {
      setDisabling(false);
    }
  };

  const handleAutoGenSuccess = () => {
    setIsAutoGenOpen(false);
    fetchAutoTaskStatus();
    showToast('Auto generation enabled successfully!');
  };

  const handleAutoEditSuccess = () => {
    setIsAutoEditOpen(false);
    fetchAutoTaskStatus();
    showToast('Auto generation updated successfully!');
  };

  // ── Fetch reference data ──
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();
        const data = await getEmployeeList(clinicId, { BranchID: branchId, Designation: 1, Status: 1 });
        setDoctors(data);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const clinicId = await getStoredClinicId();
        const data = await getShiftList(clinicId, { Status: 1 });
        setShifts(data);
      } catch (err) {
        console.error('Failed to load shifts:', err);
      }
    };
    fetchShifts();
  }, []);

  useEffect(() => {
    const fetchDoctorShifts = async () => {
      try {
        const clinicId = await getStoredClinicId();
        const { getEmployeeShiftList } = await import('../Api/Api.js');
        const data = await getEmployeeShiftList(clinicId);
        setDoctorShifts(data);
      } catch (err) {
        console.error('Failed to load doctor shifts:', err);
      }
    };
    fetchDoctorShifts();
  }, []);

  // ── Fetch configs with pagination ──
  const fetchConfigs = async (filters = appliedFilters, pageNum = page) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const options = {
        BranchID:   branchId,
        DoctorID:   filters.doctorId !== 'all' ? Number(filters.doctorId) : 0,
        DoctorName: filters.searchType === 'DoctorName' ? filters.searchValue : '',
        ShiftID:    0,
        Duration:   filters.duration  !== '' ? Number(filters.duration) : 0,
        Status:     filters.status    !== '' ? Number(filters.status)   : -1,
        Page:       pageNum,
        PageSize:   PAGE_SIZE,
      };
      const data = await getSlotConfigList(clinicId, options);
      setConfigs(data);
      setHasNext(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('fetchConfigs error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load slot configurations' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs(appliedFilters, 1);
    setPage(1);
  }, [appliedFilters]);

  // ── Client-side ShiftName filter (applied after server fetch) ──
  const filteredConfigs = useMemo(() => {
    if (appliedFilters.searchType !== 'ShiftName' || !appliedFilters.searchValue.trim()) {
      return configs;
    }
    const term = appliedFilters.searchValue.toLowerCase();
    return configs.filter((c) => c.shiftName?.toLowerCase().includes(term));
  }, [configs, appliedFilters]);

  const getDurationLabel = (duration) =>
    DURATION_OPTIONS.find((d) => d.id === duration)?.label || '—';

  const getStatusClass = (status) =>
    status === 'active' ? styles.active : styles.inactive;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
    setPage(1);
  };

  const handleClearFilters = () => {
    const empty = { doctorId: 'all', searchType: 'DoctorName', searchValue: '', duration: '', status: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchConfigs(appliedFilters, newPage);
  };

  const handleDeleteClick  = (config) => setDeleteConfirm(config);
  const handleDeleteCancel = ()        => setDeleteConfirm(null);

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteSlotConfig(deleteConfirm.id);
      setDeleteConfirm(null);
      fetchConfigs(appliedFilters, page);
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err);
    }
  };

  // ────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }
  if (loading) return <div className={styles.loading}>Loading slot configurations...</div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  const startRecord = configs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord   = startRecord + configs.length - 1;

  return (
    <div className={styles.listWrapper}>
      <ErrorHandler error={error} />
      <Header title="Slot Configuration Management" />

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={styles.toast}>
          <FiCheckCircle size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className={styles.toolbar}>
        <div className={styles.filtersRow}>

          <select name="doctorId" value={filterInputs.doctorId} onChange={handleFilterChange} className={styles.selectInput}>
            <option value="all">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.firstName} {doc.lastName} ({doc.employeeCode})
              </option>
            ))}
          </select>

          <div className={styles.searchGroup}>
            <select name="searchType" value={filterInputs.searchType} onChange={handleFilterChange} className={styles.searchTypeSelect}>
              {SEARCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${SEARCH_TYPE_OPTIONS.find((o) => o.value === filterInputs.searchType)?.label || ''}`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <select name="duration" value={filterInputs.duration} onChange={handleFilterChange} className={styles.selectInput}>
            <option value="">All Durations</option>
            {DURATION_OPTIONS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>

          <select name="status" value={filterInputs.status} onChange={handleFilterChange} className={styles.selectInput}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={16} /> Search
            </button>

            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={16} /> Clear
              </button>
            )}

            <button onClick={() => setIsGenerateOpen(true)} className={styles.generateBtn}>
              <FiCalendar size={16} /> Generate Slots
            </button>

            {/* ── Compound Auto Generate Slots button with embedded toggle ── */}
            <div
              className={`${styles.autoGenCompound} ${autoTaskExists ? styles.autoGenCompoundOn : ''} ${autoTaskLoading ? styles.autoGenCompoundDisabled : ''}`}
            >
              <button
                className={styles.autoGenLabel}
                onClick={handleLabelAreaClick}
                disabled={autoTaskLoading}
                title={autoTaskExists ? 'Click to edit auto generation settings' : 'Click to enable auto generation'}
              >
                <FiZap size={14} />
                <span>Auto Generate Slots</span>
              </button>

              <span className={styles.autoGenDivider} />

              <button
                className={styles.autoGenToggleArea}
                onClick={handleToggleAreaClick}
                disabled={autoTaskLoading}
                title={autoTaskExists ? 'Turn off auto generation' : 'Turn on auto generation'}
                aria-label={autoTaskExists ? 'Disable auto generation' : 'Enable auto generation'}
              >
                <span className={`${styles.miniToggle} ${autoTaskExists ? styles.miniToggleOn : styles.miniToggleOff}`}>
                  <span className={styles.miniThumb} />
                </span>
              </button>
            </div>

            <button onClick={() => setIsAddFormOpen(true)} className={styles.addBtn}>
              <FiPlus size={18} /> Add Config
            </button>
          </div>
        </div>
      </div>

      {/* ── Table + Pagination ── */}
      <div className={styles.tableSection}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Shift</th>
                <th>Duration</th>
                <th>Slot Interval</th>
                <th>Create Days</th>
                <th>Slot Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.noData}>
                    {hasActiveFilters ? 'No configurations found.' : 'No slot configurations yet.'}
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((config) => (
                  <tr key={config.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {config.doctorName?.charAt(0).toUpperCase() || 'D'}
                        </div>
                        <div>
                          <div className={styles.name}>{config.doctorFullName}</div>
                          <div className={styles.subInfo}>{config.doctorCode || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.shiftBadge}>{config.shiftName || '—'}</span></td>
                    <td>{getDurationLabel(config.duration)}</td>
                    <td>{config.slotInterval} mins</td>
                    <td>{config.createSlotDays} days</td>
                    <td>
                      {config.slotDate
                        ? new Date(config.slotDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(config.status)}`}>
                        {config.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleDeleteClick(config)} className={styles.btnDelete} title="Delete Configuration">
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {configs.length > 0
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
              disabled={!hasNext}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{PAGE_SIZE}</strong>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <AddSlotConfig
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        doctors={doctors}
        shifts={shifts}
        doctorShifts={doctorShifts}
        onSuccess={() => fetchConfigs(appliedFilters, page)}
      />

      <GenerateSlots
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        onSuccess={() => console.log('Slots generated')}
      />

      <AutoSlotGeneration
        isOpen={isAutoGenOpen}
        onClose={() => setIsAutoGenOpen(false)}
        onSuccess={handleAutoGenSuccess}
        mode="add"
        existingTaskData={null}
      />

      <AutoSlotGeneration
        isOpen={isAutoEditOpen}
        onClose={() => setIsAutoEditOpen(false)}
        onSuccess={handleAutoEditSuccess}
        mode="edit"
        existingTaskData={autoTaskData}
      />

      {/* Disable Auto Generation Confirm */}
      {showDisableConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <div className={styles.confirmHeader}>
              <div className={styles.confirmToggleIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="6" width="22" height="12" rx="6" fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth="1.5"/>
                  <circle cx="8" cy="12" r="4" fill="#ef4444"/>
                </svg>
              </div>
              <div>
                <h3 className={styles.confirmTitle}>Disable Auto Generation?</h3>
                <p className={styles.confirmSub}>The scheduled task will be deleted</p>
              </div>
            </div>
            <p className={styles.confirmMsg}>
              Are you sure you want to turn off Auto Slot Generation? Automatic slot creation will stop immediately.
            </p>
            <div className={styles.confirmActions}>
              <button
                className={styles.confirmNo}
                onClick={() => setShowDisableConfirm(false)}
                disabled={disabling}
              >
                No, Keep It
              </button>
              <button
                className={styles.confirmYes}
                onClick={handleDisableConfirm}
                disabled={disabling}
              >
                {disabling
                  ? <><span className={styles.btnSpinner} />Disabling…</>
                  : 'Yes, Disable'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Config Confirmation */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Delete Slot Configuration</h2>
              <button onClick={handleDeleteCancel} className={styles.modalClose}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.deleteConfirmation}>
                <div className={styles.deleteIcon}><FiTrash2 size={48} /></div>
                <p className={styles.deleteMessage}>Are you sure you want to delete this slot configuration?</p>
                <div className={styles.deleteDetails}>
                  <p><strong>Doctor:</strong> {deleteConfirm.doctorFullName}</p>
                  <p><strong>Shift:</strong> {deleteConfirm.shiftName}</p>
                  <p><strong>Duration:</strong> {deleteConfirm.duration}</p>
                </div>
                <p className={styles.deleteWarning}>This action cannot be undone.</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={handleDeleteCancel} className={styles.btnCancelModal}>Cancel</button>
              <button onClick={handleDeleteConfirm} className={styles.btnDeleteConfirm}>Delete Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotConfigList;