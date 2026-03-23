// src/components/AddAppointmentVisit.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiUser, FiActivity } from 'react-icons/fi';
import { addPatientVisit } from '../Api/Api.js';
import styles from './AddAppointmentVisit.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';


const AddAppointmentVisit = ({ isOpen, onClose, onSuccess, onError, appointment }) => {
  const [formData, setFormData] = useState({
    reason:      '',
    symptoms:    '',
    bpSystolic:  '',
    bpDiastolic: '',
    temperature: '',
    weight:      '',
  });

  const [loading, setLoading] = useState(false);

  // ── MessagePopup state ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Submit attempted flag ──
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // ── Button cooldown ──
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const startCooldown = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // ── Form completeness: reason is the only required field ──
  const isFormComplete = !!formData.reason.trim();

  // Reset form when modal opens with new appointment
  useEffect(() => {
    if (isOpen && appointment) {
      setFormData({
        reason:      appointment.reason || '',
        symptoms:    '',
        bpSystolic:  '',
        bpDiastolic: '',
        temperature: '',
        weight:      '',
      });
      setSubmitAttempted(false);
      closePopup();
    }
  }, [isOpen, appointment]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

    if (!appointment) {
      showPopup('No appointment selected.', 'error');
      return;
    }

    if (!isFormComplete) {
      showPopup('Please fill all required fields before submitting.', 'error');
      return;
    }

    if (submitCooldown) return;
    startCooldown(setSubmitCooldown);

    setLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      // Convert to YYYY-MM-DD in Asia/Kolkata (IST)
      const visitDate = new Date(appointment.appointmentDate)
        .toLocaleDateString('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

      const visitData = {
        clinicId:      clinicId,
        branchId:      branchId,
        appointmentId: appointment.id,
        PatientID:     appointment.patientId,
        DoctorID:      appointment.doctorId,
        VisitDate:     visitDate,
        VisitTime:     appointment.appointmentTime,
        reason:        formData.reason.trim(),
        symptoms:      formData.symptoms.trim(),
        bpSystolic:    formData.bpSystolic,
        bpDiastolic:   formData.bpDiastolic,
        temperature:   formData.temperature,
        weight:        formData.weight,
      };

      const result = await addPatientVisit(visitData);

      if (result.success) {
        showPopup('Patient visit added successfully!', 'success');
        setTimeout(() => {
          onSuccess();
          onClose();
          setFormData({
            reason: '', symptoms: '', bpSystolic: '',
            bpDiastolic: '', temperature: '', weight: '',
          });
          setSubmitAttempted(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to add patient visit:', err);
      const msg = err.message || 'Failed to add patient visit.';
      showPopup(msg, 'error');
      if (onError) onError(msg);
    } finally {
      setLoading(false);
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

  if (!isOpen) return null;

  return (
    <div className={styles.addVisitModalOverlay}>
      <div className={styles.addVisitModal}>

        {/* ── MessagePopup ── */}
        <MessagePopup
          visible={popup.visible}
          message={popup.message}
          type={popup.type}
          onClose={closePopup}
        />

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

            {/* Incomplete hint */}
            {submitAttempted && !isFormComplete && (
              <div className={styles.formIncompleteHint}>
                Please fill all required fields to enable submission.
              </div>
            )}
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
            disabled={loading || !isFormComplete || submitCooldown}
            title={!isFormComplete ? 'Please fill all required fields' : ''}
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