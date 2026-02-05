// src/components/AppointmentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiX, FiCheck, FiFilter, FiActivity} from 'react-icons/fi';
import { getAppointmentList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddAppointment from './AddAppointment.jsx';
import AppointmentDetails from './ViewAppointment.jsx';
import AddAppointmentVisit from './Addappointmentvisit.jsx';
import styles from './AppointmentList.module.css';

const AppointmentList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Filters
  const todayDate = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(todayDate);
  const [statusFilter, setStatusFilter] = useState('all');
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [doctorNameFilter, setDoctorNameFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Helper function to get status string from status code
  const getStatusString = (status) => {
    switch (status) {
      case 1:
        return 'scheduled';
      case 2:
        return 'confirmed';
      case 3:
        return 'inprogress';
      case 4:
        return 'completed';
      case 5:
        return 'cancelled';
      default:
        return 'cancelled';
    }
  };

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        BranchID: branchId,
        Page: 1,
        PageSize: 100
      };

      // If user has set date range filters, use FromDate/ToDate
      // Otherwise, use AppointmentDate for today's appointments
      if (fromDate && toDate) {
        options.FromDate = fromDate;
        options.ToDate = toDate;
      } else if (appointmentDate) {
        options.AppointmentDate = appointmentDate;
      }

      // Status Filter
      if (statusFilter === 'scheduled') {
        options.Status = 1;
      } else if (statusFilter === 'confirmed') {
        options.Status = 2;
      } else if (statusFilter === 'inprogress') {
        options.Status = 3;
      } else if (statusFilter === 'completed') {
        options.Status = 4;
      } else if (statusFilter === 'cancelled') {
        options.Status = 5;
      }

      // Patient Name Filter
      if (patientNameFilter.trim()) {
        options.PatientName = patientNameFilter.trim();
      }

      // Doctor Name Filter
      if (doctorNameFilter.trim()) {
        options.DoctorName = doctorNameFilter.trim();
      }

      const data = await getAppointmentList(clinicId, options);
      setAppointments(data);
      setAllAppointments(data);
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
    fetchAppointments();
  }, []);

  // Filtered and sorted appointments
  const filteredAppointments = useMemo(() => {
    let filtered = allAppointments;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allAppointments.filter(
        (appt) =>
          appt.patientName?.toLowerCase().includes(term) ||
          appt.doctorFullName?.toLowerCase().includes(term) ||
          appt.patientFileNo?.toLowerCase().includes(term) ||
          appt.patientMobile?.toLowerCase().includes(term) ||
          appt.reason?.toLowerCase().includes(term)
      );
    }

    // Sort by date and time in ascending order
    return filtered.sort((a, b) => {
      const dateA = new Date(a.appointmentDate + ' ' + a.appointmentTime);
      const dateB = new Date(b.appointmentDate + ' ' + b.appointmentTime);
      return dateA - dateB;
    });
  }, [allAppointments, searchTerm]);

  // Handlers
  const handleApplyFilters = () => {
    fetchAppointments();
  };

  const handleSearch = () => setSearchTerm(searchInput.trim());

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedAppointment(null);
    setIsDetailsModalOpen(false);
  };

  const openAddForm = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchAppointments();
  };

  const handleAddVisitClick = (appointment) => {
    setSelectedAppointment(appointment);
    setIsAddVisitModalOpen(true);
  };

  const closeAddVisitModal = () => {
    setSelectedAppointment(null);
    setIsAddVisitModalOpen(false);
  };

  const handleAddVisitSuccess = () => {
    fetchAppointments();
  };

  const getStatusClass = (status) => {
    const statusStr = getStatusString(status);
    return statusStr;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const clearAllFilters = () => {
    setFromDate('');
    setToDate('');
    setAppointmentDate(todayDate);
    setStatusFilter('all');
    setPatientNameFilter('');
    setDoctorNameFilter('');
    setSearchInput('');
    setSearchTerm('');
  };

  const hasActiveFilters = () => {
    return fromDate || toDate || appointmentDate !== todayDate || statusFilter !== 'all' || patientNameFilter || doctorNameFilter || searchTerm;
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}>Loading appointments...</div>;
  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  return (
    <div className={styles.clinicContainer}>
      <Header title="Appointment Management"/>

      {/* Main Toolbar */}
      <div className={styles.clinicToolbar}>
        <div className={styles.clinicToolbarLeft}>
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
            className={`${styles.filterToggleBtn} ${showAdvancedFilters ? styles.active : ''}`}
          >
            <FiFilter /> {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {hasActiveFilters() && (
            <button onClick={clearAllFilters} className={styles.clearAllFiltersBtn}>
              <FiX /> Clear All Filters
            </button>
          )}
        </div>

        <div className={styles.clinicToolbarRight}>
          <div className={styles.clinicSearchContainer}>
            <input
              type="text"
              placeholder="Quick search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.clinicSearchInput}
            />
            <button onClick={handleSearch} className={styles.clinicSearchBtn}>
              <FiSearch />
            </button>
          </div>

          <button onClick={openAddForm} className={styles.clinicAddBtn}>
            <FiPlus /> New Appointment
          </button>
        </div>
      </div>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div className={styles.advancedFiltersSection}>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Appointment Date</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => {
                  setAppointmentDate(e.target.value);
                  setFromDate('');
                  setToDate('');
                }}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setAppointmentDate('');
                }}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setAppointmentDate('');
                }}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Patient Name</label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={patientNameFilter}
                onChange={(e) => setPatientNameFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Doctor Name</label>
              <input
                type="text"
                placeholder="Enter doctor name"
                value={doctorNameFilter}
                onChange={(e) => setDoctorNameFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={`${styles.filterGroup} ${styles.filterSearchBtnGroup}`}>
              <label className={styles.filterLabel}>&nbsp;</label>
              <button onClick={handleApplyFilters} className={styles.filterSearchBtn}>
                <FiSearch /> Apply Filters
              </button>
            </div>
          </div>

          <div className={styles.activeFilters}>
            {appointmentDate && appointmentDate !== todayDate && (
              <span className={styles.filterTag}>
                Date: {formatDate(appointmentDate)}
                <button onClick={() => setAppointmentDate(todayDate)}><FiX /></button>
              </span>
            )}
            {fromDate && (
              <span className={styles.filterTag}>
                From: {formatDate(fromDate)}
                <button onClick={() => setFromDate('')}><FiX /></button>
              </span>
            )}
            {toDate && (
              <span className={styles.filterTag}>
                To: {formatDate(toDate)}
                <button onClick={() => setToDate('')}><FiX /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className={styles.filterTag}>
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')}><FiX /></button>
              </span>
            )}
            {patientNameFilter && (
              <span className={styles.filterTag}>
                Patient: {patientNameFilter}
                <button onClick={() => setPatientNameFilter('')}><FiX /></button>
              </span>
            )}
            {doctorNameFilter && (
              <span className={styles.filterTag}>
                Doctor: {doctorNameFilter}
                <button onClick={() => setDoctorNameFilter('')}><FiX /></button>
              </span>
            )}
          </div>
        </div>
      )}

      <div className={styles.clinicTableContainer}>
        <table className={styles.clinicTable}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date & Time</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.clinicEmptyMessage}>
                  {searchTerm ? 'No appointments found matching your search.' : 'No appointments found.'}
                </td>
              </tr>
            ) : (
              filteredAppointments.map((appt) => (
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
                    <span className={`${styles.clinicStatusBadge} ${styles[getStatusClass(appt.status)]}`}>
                      {getStatusString(appt.status).toUpperCase()}
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

      {/* Add Appointment Modal */}
      <AddAppointment
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetails
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        appointment={selectedAppointment}
        onRefresh={fetchAppointments}
      />

      {/* Add Patient Visit Modal */}
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