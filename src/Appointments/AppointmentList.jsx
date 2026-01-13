// src/components/AppointmentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiX } from 'react-icons/fi';
import { getAppointmentList, cancelAppointment } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddAppointment from './AddAppointment.jsx';
import './AppointmentList.css';

const AppointmentList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, scheduled, cancelled

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = localStorage.getItem('clinicID');

      const options = {
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

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    if (!searchTerm.trim()) return allAppointments;
    const term = searchTerm.toLowerCase();
    return allAppointments.filter(
      (appt) =>
        appt.patientName?.toLowerCase().includes(term) ||
        appt.doctorFullName?.toLowerCase().includes(term) ||
        appt.patientFileNo?.toLowerCase().includes(term) ||
        appt.patientMobile?.toLowerCase().includes(term) ||
        appt.reason?.toLowerCase().includes(term)
    );
  }, [allAppointments, searchTerm]);

  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleViewDetails = (appointment) => {
    navigate(`/appointment/${appointment.id}`);
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
    return timeStr.substring(0, 5); // HH:MM
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const clearDateFilter = () => {
    setDateFilter('');
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
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="clinic-select"
          />
        </div>

        {dateFilter && (
          <button 
            onClick={clearDateFilter} 
            className="clinic-add-btn"
            style={{ 
              width: 'auto', 
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #64748b, #94a3b8)'
            }}
          >
            Clear Date
          </button>
        )}

        <div className="clinic-select-wrapper">
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
          <button 
            onClick={() => setDateFilter(getTodayDate())} 
            className="clinic-add-btn"
            style={{ marginRight: '10px' }}
          >
            <FiCalendar size={22} /> Today
          </button>
          <button onClick={openAddForm} className="clinic-add-btn">
            <FiPlus size={22} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
          padding: '20px',
          borderRadius: '13px',
          border: '2px solid rgba(34, 197, 94, 0.2)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginBottom: '5px' }}>
            SCHEDULED
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>
            {allAppointments.filter(a => a.status === 'scheduled').length}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
          padding: '20px',
          borderRadius: '13px',
          border: '2px solid rgba(239, 68, 68, 0.2)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginBottom: '5px' }}>
            CANCELLED
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>
            {allAppointments.filter(a => a.status === 'cancelled').length}
          </div>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
          padding: '20px',
          borderRadius: '13px',
          border: '2px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginBottom: '5px' }}>
            TOTAL
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>
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
                    <div style={{ 
                      maxWidth: '200px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {appt.reason || '—'}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(appt.status)}`}>
                      {appt.status.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleViewDetails(appt)} 
                        className="clinic-details-btn"
                      >
                        View Details
                      </button>
                      {appt.status === 'scheduled' && (
                        <button 
                          onClick={() => openCancelModal(appt)} 
                          className="clinic-details-btn"
                          style={{ 
                            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
                            marginLeft: '5px'
                          }}
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