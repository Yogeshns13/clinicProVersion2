// src/components/AppointmentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiX, FiCheck, FiFilter} from 'react-icons/fi';
import { getAppointmentList, cancelAppointment } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddAppointment from './AddAppointment.jsx';
import AppointmentDetails from './ViewAppointment.jsx';
import './AppointmentList.css';

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
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

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

  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setIsCancelModalOpen(true);
  };

  const closeCancelModal = () => {
    setSelectedAppointment(null);
    setIsCancelModalOpen(false);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    setCancelLoading(true);
    try {
      await cancelAppointment(selectedAppointment.id);
      fetchAppointments();
      closeCancelModal();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setCancelLoading(false);
    }
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

  if (loading) return <div className="clinic-loading">Loading appointments...</div>;
  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  return (
    <div className="clinic-container">
      <Header />

      {/* Main Toolbar */}
      <div className="clinic-toolbar">
        <div className="clinic-toolbar-left">
          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
            className={`filter-toggle-btn ${showAdvancedFilters ? 'active' : ''}`}
          >
            <FiFilter /> {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {hasActiveFilters() && (
            <button onClick={clearAllFilters} className="clear-all-filters-btn">
              <FiX /> Clear All Filters
            </button>
          )}
        </div>

        <div className="clinic-toolbar-right">
          <div className="clinic-search-container">
            <input
              type="text"
              placeholder="Quick search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="clinic-search-input"
            />
            <button onClick={handleSearch} className="clinic-search-btn">
              <FiSearch />
            </button>
          </div>

          <button onClick={openAddForm} className="clinic-add-btn">
            <FiPlus /> New Appointment
          </button>
        </div>
      </div>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div className="advanced-filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Appointment Date</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => {
                  setAppointmentDate(e.target.value);
                  setFromDate('');
                  setToDate('');
                }}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setAppointmentDate('');
                }}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setAppointmentDate('');
                }}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Patient Name</label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={patientNameFilter}
                onChange={(e) => setPatientNameFilter(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Doctor Name</label>
              <input
                type="text"
                placeholder="Enter doctor name"
                value={doctorNameFilter}
                onChange={(e) => setDoctorNameFilter(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group filter-search-btn-group">
              <label className="filter-label">&nbsp;</label>
              <button onClick={handleApplyFilters} className="filter-search-btn">
                <FiSearch /> Apply Filters
              </button>
            </div>
          </div>

          <div className="active-filters">
            {appointmentDate && appointmentDate !== todayDate && (
              <span className="filter-tag">
                Date: {formatDate(appointmentDate)}
                <button onClick={() => setAppointmentDate(todayDate)}><FiX /></button>
              </span>
            )}
            {fromDate && (
              <span className="filter-tag">
                From: {formatDate(fromDate)}
                <button onClick={() => setFromDate('')}><FiX /></button>
              </span>
            )}
            {toDate && (
              <span className="filter-tag">
                To: {formatDate(toDate)}
                <button onClick={() => setToDate('')}><FiX /></button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="filter-tag">
                Status: {statusFilter}
                <button onClick={() => setStatusFilter('all')}><FiX /></button>
              </span>
            )}
            {patientNameFilter && (
              <span className="filter-tag">
                Patient: {patientNameFilter}
                <button onClick={() => setPatientNameFilter('')}><FiX /></button>
              </span>
            )}
            {doctorNameFilter && (
              <span className="filter-tag">
                Doctor: {doctorNameFilter}
                <button onClick={() => setDoctorNameFilter('')}><FiX /></button>
              </span>
            )}
          </div>
        </div>
      )}

      <div className="clinic-table-container">
        <table className="clinic-table">
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
                <td colSpan="6" className="clinic-empty-message">
                  {searchTerm ? 'No appointments found matching your search.' : 'No appointments found.'}
                </td>
              </tr>
            ) : (
              filteredAppointments.map((appt) => (
                <tr key={appt.id}>
                  <td>
                    <div className="clinic-patient-info">
                      <div className="clinic-avatar">
                        {appt.patientName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className="clinic-patient-name">{appt.patientName}</div>
                        <div className="clinic-patient-details">
                          {appt.patientFileNo} • {appt.patientMobile}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="clinic-doctor-name">{appt.doctorFullName}</div>
                    <div className="clinic-doctor-code">{appt.doctorCode || '—'}</div>
                  </td>
                  <td>
                    <div className="clinic-date">{formatDate(appt.appointmentDate)}</div>
                    <div className="clinic-time">
                      <FiCalendar /> {formatTime(appt.appointmentTime)}
                    </div>
                  </td>
                  <td>
                    <div className="clinic-reason">{appt.reason || '—'}</div>
                  </td>
                  <td>
                    <span className={`clinic-status-badge ${getStatusClass(appt.status)}`}>
                      {getStatusString(appt.status).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="clinic-actions">
                      <button
                        onClick={() => handleViewDetails(appt)}
                        className="clinic-details-btn"
                      >
                        View Details
                      </button>
                      {appt.status === 1 && (
                        <button
                          onClick={() => openCancelModal(appt)}
                          className="clinic-details-btn cancel-btn"
                        >
                          Cancel
                        </button>
                      )}
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
      />

      {/* Cancel Appointment Confirmation Modal */}
      {isCancelModalOpen && selectedAppointment && (
        <div className="clinic-modal-overlay">
          <div className="clinic-modal cancel-modal">
            <h2>Cancel Appointment</h2>
            <p>Are you sure you want to cancel this appointment?</p>
            
            <div className="cancel-appointment-details">
              <div className="detail-row">
                <strong>Patient:</strong> <span>{selectedAppointment.patientName}</span>
              </div>
              <div className="detail-row">
                <strong>Doctor:</strong> <span>{selectedAppointment.doctorFullName}</span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong> <span>{formatDate(selectedAppointment.appointmentDate)}</span>
              </div>
              <div className="detail-row">
                <strong>Time:</strong> <span>{formatTime(selectedAppointment.appointmentTime)}</span>
              </div>
              {selectedAppointment.reason && (
                <div className="detail-row">
                  <strong>Reason:</strong> <span>{selectedAppointment.reason}</span>
                </div>
              )}
            </div>

            <p className="warning-text">
              This action cannot be undone. The appointment slot will become available again.
            </p>

            <div className="clinic-modal-actions">
              <button onClick={closeCancelModal} className="clinic-cancel-btn">
                Keep Appointment
              </button>
              <button
                onClick={handleCancelAppointment}
                className="clinic-submit-btn"
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;