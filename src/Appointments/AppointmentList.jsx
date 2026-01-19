// src/components/AppointmentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiX, FiCheck} from 'react-icons/fi';
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
  const todayDate = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(todayDate);
  const [statusFilter, setStatusFilter] = useState('all'); // all, scheduled, cancelled

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

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

      if (dateFilter) {
        options.AppointmentDate = dateFilter;
      }

      if (statusFilter === 'scheduled') {
        options.Status = 1;
      } else if (statusFilter === 'cancelled') {
        options.Status = 0;
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
  }, [dateFilter, statusFilter]);

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
    if (status === 'scheduled') return 'active';
    if (status === 'cancelled') return 'inactive';
    return 'inactive';
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
    
    // Parse HH:MM format
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Convert to 12-hour format
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const clearDateFilter = () => {
    setDateFilter(todayDate);
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading appointments...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Appointment Management" />

      {/* Toolbar */}
      <div className="clinic-toolbar">
        <div className="clinic-select-wrapper">
          <FiCalendar className="clinic-select-icon" size={20} />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="clinic-select"
          />
        </div>

        {dateFilter && dateFilter !== todayDate && (
          <button 
            onClick={clearDateFilter} 
            className="clinic-add-btn clear-date-btn"
          >
            Clear Date
          </button>
        )}

        <div className="clinic-select-wrapper">
          <FiCheck className="clinic-select-icon" size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="clinic-select"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="clinic-search-container">
          <input
            type="text"
            placeholder="Search by patient, doctor, file no..."
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
          <button onClick={openAddForm} className="app-add-btn">
            <FiPlus size={22} /> Appointment
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-scheduled">
          <div className="stat-label">
            SCHEDULED
          </div>
          <div className="stat-value">
            {allAppointments.filter(a => a.status === 'scheduled').length}
          </div>
        </div>
        <div className="stat-card stat-cancelled">
          <div className="stat-label">
            CANCELLED
          </div>
          <div className="stat-value">
            {allAppointments.filter(a => a.status === 'cancelled').length}
          </div>
        </div>
        <div className="stat-card stat-total">
          <div className="stat-label">
            TOTAL
          </div>
          <div className="stat-value">
            {allAppointments.length}
          </div>
        </div>
      </div>

      {/* Table */}
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
                <td colSpan={6} className="clinic-no-data">
                  {searchTerm ? 'No appointments found.' : 'No appointments scheduled yet.'}
                </td>
              </tr>
            ) : (
              filteredAppointments.map((appt) => (
                <tr key={appt.id}>
                  <td>
                    <div className="clinic-name-cell">
                      <div className="clinic-avatar">
                        {appt.patientName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className="clinic-name">{appt.patientName}</div>
                        <div className="clinic-type">
                          {appt.patientFileNo} • {appt.patientMobile}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="clinic-name">{appt.doctorFullName}</div>
                      <div className="clinic-type">{appt.doctorCode || '—'}</div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="clinic-name">{formatDate(appt.appointmentDate)}</div>
                      <div className="clinic-type">
                        <span className="branch-type-badge">
                          {formatTime(appt.appointmentTime)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="reason-cell">
                      {appt.reason || '—'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(appt.status)}`}>
                      {appt.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button 
                        onClick={() => handleViewDetails(appt)} 
                        className="clinic-details-btn"
                      >
                        View Details
                      </button>
                      {appt.status === 'scheduled' && (
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
        appointmentId={selectedAppointment?.id}
      />

      {/* Cancel Appointment Confirmation Modal */}
      {isCancelModalOpen && selectedAppointment && (
        <div className="clinic-modal-overlay">
          <div className="clinic-modal delete-modal">
            <div className="clinic-modal-header">
              <h2>Cancel Appointment</h2>
              <button onClick={closeCancelModal} className="clinic-modal-close">
                <FiX />
              </button>
            </div>

            <div className="clinic-modal-body">
              <div className="delete-confirmation">
                <div className="delete-icon">
                  <FiX size={48} />
                </div>
                <p className="delete-message">
                  Are you sure you want to cancel this appointment?
                </p>
                <div className="delete-details">
                  <p><strong>Patient:</strong> {selectedAppointment.patientName}</p>
                  <p><strong>Doctor:</strong> {selectedAppointment.doctorFullName}</p>
                  <p><strong>Date:</strong> {formatDate(selectedAppointment.appointmentDate)}</p>
                  <p><strong>Time:</strong> {formatTime(selectedAppointment.appointmentTime)}</p>
                  {selectedAppointment.reason && (
                    <p><strong>Reason:</strong> {selectedAppointment.reason}</p>
                  )}
                </div>
                <p className="delete-warning">
                  This action cannot be undone. The appointment slot will become available again.
                </p>
              </div>
            </div>

            <div className="clinic-modal-footer">
              <button 
                onClick={closeCancelModal} 
                className="btn-cancel"
                disabled={cancelLoading}
              >
                Keep Appointment
              </button>
              <button 
                onClick={handleCancelAppointment} 
                className="btn-delete"
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