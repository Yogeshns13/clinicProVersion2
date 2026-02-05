// src/components/AddAppointmentVisit.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiUser, FiCalendar, FiActivity, FiThermometer } from 'react-icons/fi';
import { addPatientVisit } from '../api/api.js';
import styles from './AddAppointmentVisit.module.css';

const AddAppointmentVisit = ({ isOpen, onClose, onSuccess, appointment }) => {
  const [formData, setFormData] = useState({
    reason: '',
    symptoms: '',
    bpSystolic: '',
    bpDiastolic: '',
    temperature: '',
    weight: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal opens with new appointment
  useEffect(() => {
    if (isOpen && appointment) {
      setFormData({
        reason: appointment.reason || '',
        symptoms: '',
        bpSystolic: '',
        bpDiastolic: '',
        temperature: '',
        weight: ''
      });
      setError(null);
    }
  }, [isOpen, appointment]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!appointment) {
      setError('No appointment selected');
      return;
    }

    // Validation
    if (!formData.reason.trim()) {
      setError('Reason for visit is required');
      return;
    }

    setLoading(true);
    setError(null);

    const clinicId = Number(localStorage.getItem('clinicID'));
    const branchId = Number(localStorage.getItem('branchID'));

    try {
      // Convert to YYYY-MM-DD in Asia/Kolkata (IST)
      const visitDate = new Date(appointment.appointmentDate)
        .toLocaleDateString('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });

      const visitData = {
        clinicId: clinicId,
        branchId: branchId,
        appointmentId: appointment.id,
        PatientID: appointment.patientId,
        DoctorID: appointment.doctorId,
        VisitDate: visitDate,
        VisitTime: appointment.appointmentTime,
        reason: formData.reason.trim(),
        symptoms: formData.symptoms.trim(),
        bpSystolic: formData.bpSystolic ? parseFloat(formData.bpSystolic) : 0,
        bpDiastolic: formData.bpDiastolic ? parseFloat(formData.bpDiastolic) : 0,
        temperature: formData.temperature ? parseFloat(formData.temperature) : 0,
        weight: formData.weight ? parseFloat(formData.weight) : 0
      };

      const result = await addPatientVisit(visitData);

      if (result.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          reason: '',
          symptoms: '',
          bpSystolic: '',
          bpDiastolic: '',
          temperature: '',
          weight: ''
        });
      }
    } catch (err) {
      console.error('Failed to add patient visit:', err);
      setError(err.message || 'Failed to add patient visit');
    } finally {
      setLoading(false);
    }
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

  if (!isOpen) return null;

  return (
    <div className={styles.addVisitModalOverlay}>
      <div className={styles.addVisitModal}>
        {/* Header */}
        <div className={styles.addVisitModalHeader}>
          <div className={styles.addVisitHeaderContent}>
            <FiActivity className={styles.addVisitHeaderIcon} size={24} />
            <h2>Add Patient Visit</h2>
          </div>
          <button onClick={onClose} className={styles.addVisitModalClose} disabled={loading}>
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.addVisitModalBody}>
          {appointment && (
            <div className={styles.addVisitAppointmentInfo}>
              <h3>Appointment Details</h3>
              <div className={styles.addVisitInfoGrid}>
                <div className={styles.addVisitInfoItem}>
                  <span className={styles.infoLabel}>Patient:</span>
                  <span className={styles.infoValue}>{appointment.patientName}</span>
                </div>
                <div className={styles.addVisitInfoItem}>
                  <span className={styles.infoLabel}>Doctor:</span>
                  <span className={styles.infoValue}>{appointment.doctorFullName}</span>
                </div>
                <div className={styles.addVisitInfoItem}>
                  <span className={styles.infoLabel}>Date:</span>
                  <span className={styles.infoValue}>{formatDate(appointment.appointmentDate)}</span>
                </div>
                <div className={styles.addVisitInfoItem}>
                  <span className={styles.infoLabel}>Time:</span>
                  <span className={styles.infoValue}>{formatTime(appointment.appointmentTime)}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.addVisitErrorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.addVisitForm}>
            {/* Reason */}
            <div className={styles.addVisitFormGroup}>
              <label className={`${styles.addVisitLabel} ${styles.required}`}>
                <FiUser size={16} />
                Reason for Visit
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Enter reason for visit"
                className={styles.addVisitTextarea}
                rows="3"
                required
              />
            </div>

            {/* Symptoms */}
            <div className={styles.addVisitFormGroup}>
              <label className={styles.addVisitLabel}>
                <FiActivity size={16} />
                Symptoms
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                placeholder="Enter symptoms (optional)"
                className={styles.addVisitTextarea}
                rows="3"
              />
            </div>

            {/* Vitals Section */}
            <div className={styles.addVisitVitalsSection}>
              <h3>
                <FiThermometer size={18} />
                Vital Signs (Optional)
              </h3>

              <div className={styles.addVisitVitalsGrid}>
                {/* Blood Pressure */}
                <div className={styles.addVisitFormGroup}>
                  <label className={styles.addVisitLabel}>BP Systolic (mmHg)</label>
                  <input
                    type="number"
                    name="bpSystolic"
                    value={formData.bpSystolic}
                    onChange={handleInputChange}
                    placeholder="e.g., 120"
                    className={styles.addVisitInput}
                    min="0"
                    step="1"
                  />
                </div>

                <div className={styles.addVisitFormGroup}>
                  <label className={styles.addVisitLabel}>BP Diastolic (mmHg)</label>
                  <input
                    type="number"
                    name="bpDiastolic"
                    value={formData.bpDiastolic}
                    onChange={handleInputChange}
                    placeholder="e.g., 80"
                    className={styles.addVisitInput}
                    min="0"
                    step="1"
                  />
                </div>

                {/* Temperature */}
                <div className={styles.addVisitFormGroup}>
                  <label className={styles.addVisitLabel}>Temperature (°F)</label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    placeholder="e.g., 98.6"
                    className={styles.addVisitInput}
                    min="0"
                    step="0.1"
                  />
                </div>

                {/* Weight */}
                <div className={styles.addVisitFormGroup}>
                  <label className={styles.addVisitLabel}>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="e.g., 70"
                    className={styles.addVisitInput}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className={styles.addVisitModalFooter}>
          <button 
            type="button"
            onClick={onClose} 
            className={styles.addVisitCancelBtn}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            onClick={handleSubmit}
            className={styles.addVisitSubmitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.addVisitSpinner}></div>
                Adding...
              </>
            ) : (
              <>
                <FiSave size={18} />
                Add Visit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAppointmentVisit;