// src/components/AppointmentDetails.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiUser, FiPhone, FiFileText, FiClock } from 'react-icons/fi';
import { getAppointmentList } from '../api/api.js';
import './ViewAppointment.css';

// ────────────────────────────────────────────────
// Helper function to convert status code to string
// ────────────────────────────────────────────────
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
      return 'unknown';
  }
};

// ────────────────────────────────────────────────
const ViewAppointment = ({ isOpen, onClose, appointment: passedAppointment }) => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      // If appointment is passed as prop, use it directly
      if (passedAppointment) {
        setAppointment(passedAppointment);
        setLoading(false);
        return;
      }

      // Otherwise, fetch it (this handles the appointmentId prop case)
      if (!isOpen) return;

      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const data = await getAppointmentList(clinicId, {
          BranchID: branchId,
          AppointmentID: Number(passedAppointment?.id || 0),
        });

        if (data && data.length > 0) {
          setAppointment(data[0]);
        } else {
          setError({ message: 'Appointment not found' });
        }
      } catch (err) {
        console.error('fetchAppointmentDetails error:', err);
        setError({
          message: err.message || 'Failed to load appointment details',
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchAppointmentDetails();
    }
  }, [passedAppointment, isOpen]);

  // ────────────────────────────────────────────────
  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    } catch {
      return dateString;
    }
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

  const getStatusClass = (status) => {
    const statusStr = getStatusString(status);
    if (statusStr === 'scheduled') return 'active';
    if (statusStr === 'confirmed') return 'active';
    if (statusStr === 'inprogress') return 'active';
    if (statusStr === 'completed') return 'completed';
    if (statusStr === 'cancelled') return 'inactive';
    return 'inactive';
  };

  // ────────────────────────────────────────────────
  // Don't render if not open
  if (!isOpen) return null;

  // ────────────────────────────────────────────────
  return (
    <div className="appointment-modal-overlay">
      <div className="appointment-modal">
        {/* Header */}
        <div className="appointment-modal-header">
          <div className="appointment-header-content">
            <FiCalendar className="appointment-header-icon" size={24} />
            <h2>Appointment Details</h2>
          </div>
          <button onClick={onClose} className="appointment-modal-close">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="appointment-modal-body">
          {loading && (
            <div className="appointment-loading">
              <div className="appointment-spinner"></div>
              <p>Loading appointment details...</p>
            </div>
          )}

          {error && (
            <div className="appointment-error">
              <p>Error: {error.message || error}</p>
            </div>
          )}

          {!loading && !error && appointment && (
            <>
              {/* Status Badge */}
              <div className="appointment-status-section">
                <span className={`appointment-status-badge ${getStatusClass(appointment.status)}`}>
                  {getStatusString(appointment.status).toUpperCase()}
                </span>
              </div>

              {/* Patient Information */}
              <div className="appointment-details-section">
                <h3 className="appointment-section-title">
                  <FiUser size={18} />
                  Patient Information
                </h3>
                <div className="appointment-details-grid">
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Patient Name</span>
                    <span className="appointment-detail-value">{appointment.patientName || '—'}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">File Number</span>
                    <span className="appointment-detail-value">{appointment.patientFileNo || '—'}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Mobile</span>
                    <span className="appointment-detail-value">{appointment.patientMobile || '—'}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Email</span>
                    <span className="appointment-detail-value">{appointment.patientEmail || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Doctor Information */}
              <div className="appointment-details-section">
                <h3 className="appointment-section-title">
                  <FiUser size={18} />
                  Doctor Information
                </h3>
                <div className="appointment-details-grid">
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Doctor Name</span>
                    <span className="appointment-detail-value">{appointment.doctorFullName || '—'}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Doctor Code</span>
                    <span className="appointment-detail-value">{appointment.doctorCode || '—'}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Specialization</span>
                    <span className="appointment-detail-value">{appointment.doctorSpecialization || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Appointment Information */}
              <div className="appointment-details-section">
                <h3 className="appointment-section-title">
                  <FiCalendar size={18} />
                  Appointment Information
                </h3>
                <div className="appointment-details-grid">
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Date</span>
                    <span className="appointment-detail-value">{formatDate(appointment.appointmentDate)}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Time</span>
                    <span className="appointment-detail-value">{formatTime(appointment.appointmentTime)}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Duration</span>
                    <span className="appointment-detail-value">{appointment.duration ? `${appointment.duration} minutes` : '—'}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Appointment Type</span>
                    <span className="appointment-detail-value">{appointment.appointmentType || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Reason & Notes */}
              <div className="appointment-details-section">
                <h3 className="appointment-section-title">
                  <FiFileText size={18} />
                  Reason & Notes
                </h3>
                <div className="appointment-details-grid">
                  <div className="appointment-detail-item appointment-full-width">
                    <span className="appointment-detail-label">Reason for Visit</span>
                    <span className="appointment-detail-value">{appointment.reason || '—'}</span>
                  </div>
                  <div className="appointment-detail-item appointment-full-width">
                    <span className="appointment-detail-label">Additional Notes</span>
                    <span className="appointment-detail-value">{appointment.notes || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Clinic Information */}
              <div className="appointment-details-section">
                <h3 className="appointment-section-title">
                  <FiFileText size={18} />
                  Clinic Information
                </h3>
                <div className="appointment-details-grid">
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Clinic Name</span>
                    <span className="appointment-detail-value">{appointment.clinicName || '—'}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Branch Name</span>
                    <span className="appointment-detail-value">{appointment.branchName || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Record Information */}
              <div className="appointment-details-section">
                <h3 className="appointment-section-title">
                  <FiClock size={18} />
                  Record Information
                </h3>
                <div className="appointment-details-grid">
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Date Created</span>
                    <span className="appointment-detail-value">{formatDate(appointment.dateCreated)}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Last Modified</span>
                    <span className="appointment-detail-value">{formatDate(appointment.dateModified)}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Created By</span>
                    <span className="appointment-detail-value">{appointment.createdBy || '—'}</span>
                  </div>
                  <div className="appointment-detail-item">
                    <span className="appointment-detail-label">Modified By</span>
                    <span className="appointment-detail-value">{appointment.modifiedBy || '—'}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="appointment-modal-footer">
          <button onClick={onClose} className="appointment-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAppointment;