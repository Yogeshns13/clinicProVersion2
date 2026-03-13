// src/components/AppointmentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiX, FiActivity } from 'react-icons/fi';
import { getAppointmentList } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import AddAppointment from './AddAppointment.jsx';
import AppointmentDetails from './ViewAppointment.jsx';
import styles from './AppointmentList.module.css';
import AddAppointmentVisit from './AddAppointmentVisits.jsx';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';



// ──────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Scheduled' },
  { id: 2, label: 'Confirmed' },
  { id: 3, label: 'InProgress' },
  { id: 4, label: 'Completed' },
  { id: 5, label: 'Cancelled' },
  { id: 6, label: 'NoShow' },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'PatientName', label: 'Patient Name' },
  { value: 'DoctorName',  label: 'Doctor Name'  },
];

const todayDate = new Date().toISOString().split('T')[0];

// ──────────────────────────────────────────────────
const AppointmentList = () => {
  const navigate = useNavigate();

  // Data
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // Filter inputs (staged — not applied until Search is clicked)
  const [filterInputs, setFilterInputs] = useState({
    searchType:      'PatientName',
    searchValue:     '',
    status:          '',
    appointmentDate: todayDate,
    dateFrom:        '',
    dateTo:          '',
  });

  // Applied filters (drive the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:      'PatientName',
    searchValue:     '',
    status:          '',
    appointmentDate: todayDate,
    dateFrom:        '',
    dateTo:          '',
  });

  // Modals
  const [isAddFormOpen,      setIsAddFormOpen]      = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddVisitModalOpen,setIsAddVisitModalOpen]= useState(false);
  const [selectedAppointment,setSelectedAppointment]= useState(null);

  // ──────────────────────────────────────────────────
  // Derived: are any filters actually active?
  const hasActiveFilters =
    appliedFilters.searchValue.trim()           !== '' ||
    appliedFilters.status                        !== '' ||
    appliedFilters.appointmentDate               !== todayDate ||
    appliedFilters.dateFrom                      !== '' ||
    appliedFilters.dateTo                        !== '';

  // ──────────────────────────────────────────────────
  // Data fetching — driven by appliedFilters
  const fetchAppointments = async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        BranchID:  branchId,
        Page:      1,
        PageSize:  100,
        Status:    filters.status !== '' ? Number(filters.status) : -1,
      };

      // Date range takes priority over single appointment date
      if (filters.dateFrom && filters.dateTo) {
        options.FromDate = filters.dateFrom;
        options.ToDate   = filters.dateTo;
      } else if (filters.appointmentDate) {
        options.AppointmentDate = filters.appointmentDate;
      }

      // Search fields
      if (filters.searchType === 'PatientName' && filters.searchValue.trim()) {
        options.PatientName = filters.searchValue.trim();
      }
      if (filters.searchType === 'DoctorName' && filters.searchValue.trim()) {
        options.DoctorName = filters.searchValue.trim();
      }

      const data = await getAppointmentList(clinicId, options);
      setAppointments(data);
    } catch (err) {
      console.error('fetchAppointments error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load appointments' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  // ──────────────────────────────────────────────────
  // Helper functions
  const getStatusLabel = (status) => {
    const found = STATUS_OPTIONS.find((s) => s.id === status);
    return found ? found.label : 'Unknown';
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 1: return styles.scheduled;
      case 2: return styles.confirmed;
      case 3: return styles.inprogress;
      case 4: return styles.completed;
      case 5: return styles.cancelled;
      case 6: return styles.noshow;
      default: return styles.cancelled;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // ──────────────────────────────────────────────────
  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => {
      const updated = { ...prev, [name]: value };
      // If dateFrom or dateTo is set, clear appointmentDate; if appointmentDate is set, clear date range
      if (name === 'dateFrom' || name === 'dateTo') {
        updated.appointmentDate = '';
      }
      if (name === 'appointmentDate' && value) {
        updated.dateFrom = '';
        updated.dateTo   = '';
      }
      return updated;
    });
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const reset = {
      searchType:      'PatientName',
      searchValue:     '',
      status:          '',
      appointmentDate: todayDate,
      dateFrom:        '',
      dateTo:          '',
    };
    setFilterInputs(reset);
    setAppliedFilters(reset);
  };

  const handleViewDetails = (appt) => {
    setSelectedAppointment(appt);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedAppointment(null);
    setIsDetailsModalOpen(false);
  };

  const openAddForm  = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => fetchAppointments(appliedFilters);

  const handleAddVisitClick = (appt) => {
    setSelectedAppointment(appt);
    setIsAddVisitModalOpen(true);
  };

  const closeAddVisitModal = () => {
    setSelectedAppointment(null);
    setIsAddVisitModalOpen(false);
  };

  const handleAddVisitSuccess = () => fetchAppointments(appliedFilters);

  // ──────────────────────────────────────────────────
  // Sorted appointments
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = new Date(a.appointmentDate + ' ' + a.appointmentTime);
      const dateB = new Date(b.appointmentDate + ' ' + b.appointmentTime);
      return dateA - dateB;
    });
  }, [appointments]);

  // ──────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}>Loading appointments...</div>;
  if (error)   return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  // ──────────────────────────────────────────────────
  return (
    <div className={styles.clinicContainer}>
      <Header title="Appointment Management" />

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
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                SEARCH_TYPE_OPTIONS.find((o) => o.value === filterInputs.searchType)?.label || ''
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
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
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

        

          {/* From Date */}
          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateFrom && (
                <span className={styles.datePlaceholder}>From Date</span>
              )}
              <input
                type="date"
                name="dateFrom"
                value={filterInputs.dateFrom}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateFrom ? styles.dateEmpty : ''}`}
              />
            </div>
          </div>

          {/* To Date */}
          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateTo && (
                <span className={styles.datePlaceholder}>To Date</span>
              )}
              <input
                type="date"
                name="dateTo"
                value={filterInputs.dateTo}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateTo ? styles.dateEmpty : ''}`}
              />
            </div>
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
              New Appointment
            </button>
          </div>

        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.clinicTableContainer}>
        <table className={styles.clinicTable}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date &amp; Time</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAppointments.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.clinicEmptyMessage}>
                  {hasActiveFilters
                    ? 'No appointments found matching your filters.'
                    : 'No appointments found for today.'}
                </td>
              </tr>
            ) : (
              sortedAppointments.map((appt) => (
                <tr key={appt.id}>
                  <td>
                    <div className={styles.clinicPatientInfo}>
                      <div className={styles.clinicAvatar}>
                        {appt.patientName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className={styles.clinicPatientName}>{appt.patientName}</div>
                        <div className={styles.clinicPatientDetails}>
                          {appt.patientFileNo} • {appt.patientMobile}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.clinicDoctorName}>{appt.doctorFullName}</div>
                    <div className={styles.clinicDoctorCode}>{appt.doctorCode || '—'}</div>
                  </td>
                  <td>
                    <div className={styles.clinicDate}>{formatDate(appt.appointmentDate)}</div>
                    <div className={styles.clinicTime}>
                      <FiCalendar /> {formatTime(appt.appointmentTime)}
                    </div>
                  </td>
                  <td>
                    <div className={styles.clinicReason}>{appt.reason || '—'}</div>
                  </td>
                  <td>
                    <span className={`${styles.clinicStatusBadge} ${getStatusClass(appt.status)}`}>
                      {getStatusLabel(appt.status).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className={styles.clinicActions}>
                      <button
                        onClick={() => handleViewDetails(appt)}
                        className={styles.clinicDetailsBtn}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleAddVisitClick(appt)}
                        className={`${styles.clinicDetailsBtn} ${styles.addVisitBtn} ${appt.status !== 1 ? styles.disabled : ''}`}
                        disabled={appt.status !== 1}
                      >
                        <FiActivity size={14} /> Add Visit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Add Appointment Modal ── */}
      <AddAppointment
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
      />

      {/* ── Appointment Details Modal ── */}
      <AppointmentDetails
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        appointment={selectedAppointment}
        onRefresh={() => fetchAppointments(appliedFilters)}
      />

      {/* ── Add Patient Visit Modal ── */}
      <AddAppointmentVisit
        isOpen={isAddVisitModalOpen}
        onClose={closeAddVisitModal}
        onSuccess={handleAddVisitSuccess}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default AppointmentList;