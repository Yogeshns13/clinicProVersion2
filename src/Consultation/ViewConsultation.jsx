// src/components/ViewConsultation.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiCalendar, FiActivity, FiFileText } from 'react-icons/fi';
import { getConsultationList } from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import './ViewConsultation.css';

const ViewConsultation = ({ isOpen, onClose, consultationId }) => {
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && consultationId) {
      fetchConsultationDetails();
    }
  }, [isOpen, consultationId]);

  const fetchConsultationDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 1,
        BranchID: branchId,
        ConsultationID: consultationId
      };

      const data = await getConsultationList(clinicId, options);
      
      if (data && data.length > 0) {
        setConsultation(data[0]);
      } else {
        setError({ message: 'Consultation not found' });
      }
    } catch (err) {
      console.error('fetchConsultationDetails error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  const handleClose = () => {
    setConsultation(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="view-consultation-overlay">
      <div className="view-consultation-modal">
        {/* Header */}
        <div className="view-consultation-header">
          <div>
            <h2>Consultation Details</h2>
            {consultation && (
              <p className="view-consultation-subtitle">
                {consultation.patientName} • {formatDateOnly(consultation.dateCreated)}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="view-consultation-close-btn">
            <FiX size={24} />
          </button>
        </div>

        <ErrorHandler error={error} />

        {/* Body */}
        <div className="view-consultation-body">
          {loading ? (
            <div className="view-consultation-loading">Loading consultation details...</div>
          ) : !consultation ? (
            <div className="view-consultation-error">Consultation not found</div>
          ) : (
            <>
              {/* Patient & Doctor Info */}
              <div className="info-grid">
                <div className="info-card patient-info">
                  <div className="info-card-header">
                    <FiUser size={20} />
                    <span>Patient Information</span>
                  </div>
                  <div className="info-card-body">
                    <div className="info-row">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{consultation.patientName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">File No:</span>
                      <span className="info-value">{consultation.patientFileNo || '—'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Mobile:</span>
                      <span className="info-value">{consultation.patientMobile || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="info-card doctor-info">
                  <div className="info-card-header">
                    <FiUser size={20} />
                    <span>Doctor Information</span>
                  </div>
                  <div className="info-card-body">
                    <div className="info-row">
                      <span className="info-label">Name:</span>
                      <span className="info-value">{consultation.doctorFullName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Code:</span>
                      <span className="info-value">{consultation.doctorCode || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visit Details */}
              <div className="details-section">
                <div className="details-header">
                  <FiActivity size={20} />
                  <span>Visit Details</span>
                </div>
                <div className="details-body">
                  {consultation.reason && (
                    <div className="detail-item">
                      <span className="detail-label">Reason for Visit:</span>
                      <span className="detail-value">{consultation.reason}</span>
                    </div>
                  )}
                  {consultation.symptoms && (
                    <div className="detail-item">
                      <span className="detail-label">Symptoms:</span>
                      <span className="detail-value">{consultation.symptoms}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vitals */}
              {(consultation.bpReading || consultation.temperature || consultation.weight) && (
                <div className="vitals-section">
                  <div className="vitals-header">
                    <FiActivity size={20} />
                    <span>Vital Signs</span>
                  </div>
                  <div className="vitals-grid">
                    {consultation.bpReading && (
                      <div className="vital-card bp-card">
                        <div className="vital-label">Blood Pressure</div>
                        <div className="vital-value">{consultation.bpReading}</div>
                        <div className="vital-unit">mmHg</div>
                      </div>
                    )}
                    {consultation.temperature && (
                      <div className="vital-card temp-card">
                        <div className="vital-label">Temperature</div>
                        <div className="vital-value">{consultation.temperature}</div>
                        <div className="vital-unit">°F</div>
                      </div>
                    )}
                    {consultation.weight && (
                      <div className="vital-card weight-card">
                        <div className="vital-label">Weight</div>
                        <div className="vital-value">{consultation.weight}</div>
                        <div className="vital-unit">kg</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medical Records */}
              {(consultation.emrNotes || consultation.ehrNotes) && (
                <div className="records-section">
                  <div className="records-header">
                    <FiFileText size={20} />
                    <span>Medical Records</span>
                  </div>
                  <div className="records-body">
                    {consultation.emrNotes && (
                      <div className="record-item">
                        <div className="record-label">EMR Notes</div>
                        <div className="record-content">{consultation.emrNotes}</div>
                      </div>
                    )}
                    {consultation.ehrNotes && (
                      <div className="record-item">
                        <div className="record-label">EHR Notes</div>
                        <div className="record-content">{consultation.ehrNotes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Consultation Notes */}
              {consultation.consultationNotes && (
                <div className="notes-section">
                  <div className="notes-header">
                    <FiFileText size={20} />
                    <span>Consultation Notes</span>
                  </div>
                  <div className="notes-content">
                    {consultation.consultationNotes}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {consultation.instructions && (
                <div className="instructions-section">
                  <div className="instructions-header">
                    <FiFileText size={20} />
                    <span>Instructions for Patient</span>
                  </div>
                  <div className="instructions-content">
                    {consultation.instructions}
                  </div>
                </div>
              )}

              {/* Treatment Plan */}
              {consultation.treatmentPlan && (
                <div className="treatment-section">
                  <div className="treatment-header">
                    <FiFileText size={20} />
                    <span>Treatment Plan</span>
                  </div>
                  <div className="treatment-content">
                    {consultation.treatmentPlan}
                  </div>
                </div>
              )}

              {/* Next Consultation */}
              {consultation.nextConsultationDate && (
                <div className="followup-section">
                  <div className="followup-header">
                    <FiCalendar size={20} />
                    <span>Follow-up Appointment</span>
                  </div>
                  <div className="followup-content">
                    <div className="followup-date">
                      {formatDateOnly(consultation.nextConsultationDate)}
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="metadata-section">
                <div className="metadata-item">
                  <span className="metadata-label">Created:</span>
                  <span className="metadata-value">{formatDate(consultation.dateCreated)}</span>
                </div>
                {consultation.dateModified && (
                  <div className="metadata-item">
                    <span className="metadata-label">Last Modified:</span>
                    <span className="metadata-value">{formatDate(consultation.dateModified)}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="view-consultation-footer">
          <button onClick={handleClose} className="btn-close">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewConsultation;