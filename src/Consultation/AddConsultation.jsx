// src/components/AddConsultation.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiCalendar, FiCheck } from 'react-icons/fi';
import { getPatientVisitList} from '../api/api.js';
import { addConsultation } from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import './AddConsultation.css';

const AddConsultation = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // Step 1: Select Visit, Step 2: Fill Consultation
  const [todayVisits, setTodayVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    emrNotes: '',
    ehrNotes: '',
    instructions: '',
    consultationNotes: '',
    nextConsultationDate: '',
    treatmentPlan: ''
  });

  // Fetch today's patient visits
  useEffect(() => {
    if (isOpen) {
      fetchTodayVisits();
    }
  }, [isOpen]);

  const fetchTodayVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const today = new Date().toISOString().split('T')[0];

      const options = {
        Page: 1,
        PageSize: 50,
        BranchID: branchId,
        VisitDate: today
      };

      const visits = await getPatientVisitList(clinicId, options);
      setTodayVisits(visits);
    } catch (err) {
      console.error('fetchTodayVisits error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitSelect = (visit) => {
    setSelectedVisit(visit);
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedVisit) {
      setError({ message: 'Please select a patient visit' });
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const consultationData = {
        clinicId,
        branchId,
        visitId: selectedVisit.id,
        patientId: selectedVisit.patientId,
        doctorId: selectedVisit.doctorId,
        reason: selectedVisit.reason || '',
        symptoms: selectedVisit.symptoms || '',
        bpSystolic: selectedVisit.bpSystolic || null,
        bpDiastolic: selectedVisit.bpDiastolic || null,
        temperature: selectedVisit.temperature || null,
        weight: selectedVisit.weight || null,
        emrNotes: formData.emrNotes.trim(),
        ehrNotes: formData.ehrNotes.trim(),
        instructions: formData.instructions.trim(),
        consultationNotes: formData.consultationNotes.trim(),
        nextConsultationDate: formData.nextConsultationDate || '',
        treatmentPlan: formData.treatmentPlan.trim()
      };

      await addConsultation(consultationData);
      
      // Reset and close
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('handleSubmit error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedVisit(null);
    setFormData({
      emrNotes: '',
      ehrNotes: '',
      instructions: '',
      consultationNotes: '',
      nextConsultationDate: '',
      treatmentPlan: ''
    });
    setError(null);
    onClose();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (!isOpen) return null;

  return (
    <div className="add-consultation-overlay">
      <div className="add-consultation-modal">
        {/* Header */}
        <div className="add-consultation-header">
          <div>
            <h2>New Consultation</h2>
            <p className="add-consultation-subtitle">
              {step === 1 ? 'Step 1: Select Patient Visit' : 'Step 2: Add Consultation Details'}
            </p>
          </div>
          <button onClick={handleClose} className="add-consultation-close-btn">
            <FiX size={24} />
          </button>
        </div>

        <ErrorHandler error={error} />

        {/* Step 1: Select Visit */}
        {step === 1 && (
          <div className="add-consultation-body">
            {loading ? (
              <div className="add-consultation-loading">Loading today's visits...</div>
            ) : todayVisits.length === 0 ? (
              <div className="add-consultation-no-data">
                <FiCalendar size={48} />
                <p>No patient visits recorded today</p>
                <p className="add-consultation-hint">
                  Please add a patient visit first before creating a consultation
                </p>
              </div>
            ) : (
              <div className="visit-selection-grid">
                {todayVisits.map((visit) => (
                  <div 
                    key={visit.id} 
                    className="visit-card"
                    onClick={() => handleVisitSelect(visit)}
                  >
                    <div className="visit-card-header">
                      <div className="visit-avatar">
                        {visit.patientName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div className="visit-info">
                        <div className="visit-patient-name">{visit.patientName}</div>
                        <div className="visit-details">
                          {visit.patientFileNo} • {visit.patientMobile}
                        </div>
                      </div>
                    </div>
                    
                    <div className="visit-card-body">
                      <div className="visit-field">
                        <span className="visit-label">Doctor:</span>
                        <span className="visit-value">{visit.doctorFullName}</span>
                      </div>
                      <div className="visit-field">
                        <span className="visit-label">Time:</span>
                        <span className="visit-value">
                          {formatDate(visit.visitDate)} at {formatTime(visit.visitTime)}
                        </span>
                      </div>
                      {visit.reason && (
                        <div className="visit-field">
                          <span className="visit-label">Reason:</span>
                          <span className="visit-value">{visit.reason}</span>
                        </div>
                      )}
                      {visit.symptoms && (
                        <div className="visit-field">
                          <span className="visit-label">Symptoms:</span>
                          <span className="visit-value">{visit.symptoms}</span>
                        </div>
                      )}
                      
                      {(visit.bpReading || visit.temperature || visit.weight) && (
                        <div className="visit-vitals">
                          {visit.bpReading && (
                            <span className="vital-badge bp">{visit.bpReading}</span>
                          )}
                          {visit.temperature && (
                            <span className="vital-badge temp">{visit.temperature}°F</span>
                          )}
                          {visit.weight && (
                            <span className="vital-badge weight">{visit.weight}kg</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="visit-card-footer">
                      <button className="select-visit-btn">
                        Select Visit <FiCheck size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Consultation Form */}
        {step === 2 && selectedVisit && (
          <div className="add-consultation-body">
            {/* Selected Visit Summary */}
            <div className="selected-visit-summary">
              <div className="summary-header">
                <FiUser size={20} />
                <span>Selected Visit</span>
              </div>
              <div className="summary-content">
                <div className="summary-row">
                  <span className="summary-label">Patient:</span>
                  <span className="summary-value">{selectedVisit.patientName}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Doctor:</span>
                  <span className="summary-value">{selectedVisit.doctorFullName}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Visit Time:</span>
                  <span className="summary-value">
                    {formatDate(selectedVisit.visitDate)} at {formatTime(selectedVisit.visitTime)}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setStep(1)} 
                className="change-visit-btn"
              >
                Change Visit
              </button>
            </div>

            {/* Consultation Form */}
            <form onSubmit={handleSubmit} className="consultation-form">
              <div className="form-section">
                <h3 className="form-section-title">Medical Records</h3>
                
                <div className="form-group">
                  <label className="form-label">EMR Notes</label>
                  <textarea
                    name="emrNotes"
                    value={formData.emrNotes}
                    onChange={handleInputChange}
                    placeholder="Electronic Medical Record notes..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">EHR Notes</label>
                  <textarea
                    name="ehrNotes"
                    value={formData.ehrNotes}
                    onChange={handleInputChange}
                    placeholder="Electronic Health Record notes..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section-title">Consultation Details</h3>
                
                <div className="form-group">
                  <label className="form-label">Consultation Notes *</label>
                  <textarea
                    name="consultationNotes"
                    value={formData.consultationNotes}
                    onChange={handleInputChange}
                    placeholder="Detailed consultation notes..."
                    className="form-textarea"
                    rows={4}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instructions</label>
                  <textarea
                    name="instructions"
                    value={formData.instructions}
                    onChange={handleInputChange}
                    placeholder="Instructions for patient..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Treatment Plan</label>
                  <textarea
                    name="treatmentPlan"
                    value={formData.treatmentPlan}
                    onChange={handleInputChange}
                    placeholder="Recommended treatment plan..."
                    className="form-textarea"
                    rows={4}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Next Consultation Date</label>
                  <input
                    type="date"
                    name="nextConsultationDate"
                    value={formData.nextConsultationDate}
                    onChange={handleInputChange}
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="form-hint">Optional: Schedule a follow-up consultation</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="add-consultation-actions">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="btn-secondary"
                  disabled={submitLoading}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Saving...' : 'Save Consultation'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddConsultation;