// src/components/UpdatePatientVisit.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiInfo, FiActivity, FiUser, FiCalendar } from 'react-icons/fi';
import { getPatientVisitList, updatePatientVisit, getEmployeeList, getAppointmentList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import styles from './UpdatePatientVisit.module.css';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'visitDate':
      if (!value) return 'Visit date is required';
      const visitDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      visitDate.setHours(0, 0, 0, 0);
      if (visitDate < today) return 'Visit date cannot be in the past';
      return '';

    case 'visitTime':
      if (!value) return 'Visit time is required';
      return '';

    case 'reason':
      if (value && value.length > 200) return 'Reason must not exceed 200 characters';
      return '';

    case 'symptoms':
      if (value && value.length > 500) return 'Symptoms must not exceed 500 characters';
      return '';

    case 'bpSystolic':
      if (value === '' || value === null || value === undefined) return '';
      const systolic = Number(value);
      if (isNaN(systolic)) return 'Must be a valid number';
      if (systolic < 0) return 'Cannot be negative';
      if (systolic > 0 && systolic < 50) return 'The number should be 50-250 mmHg';
      if (systolic > 250) return 'The number should be 50-250 mmHg';
      return '';

    case 'bpDiastolic':
      if (value === '' || value === null || value === undefined) return '';
      const diastolic = Number(value);
      if (isNaN(diastolic)) return 'Must be a valid number';
      if (diastolic < 0) return 'Cannot be negative';
      if (diastolic > 0 && diastolic < 30) return 'The number should be 30-150 mmHg';
      if (diastolic > 150) return 'The number should be 30-150 mmHg';
      return '';

    case 'temperature':
      if (value === '' || value === null || value === undefined) return '';
      const temp = Number(value);
      if (isNaN(temp)) return 'Must be a valid number';
      if (temp < 0) return 'Cannot be negative';
      if (temp > 0 && temp < 90) return 'The number should be 90-110°F';
      if (temp > 110) return 'The number should be 90-110°F';
      return '';

    case 'weight':
      if (value === '' || value === null || value === undefined) return '';
      const weight = Number(value);
      if (isNaN(weight)) return 'Must be a valid number';
      if (weight < 0) return 'Cannot be negative';
      if (weight > 0 && weight < 1) return 'The number should be 1-500 kg';
      if (weight > 500) return 'The number should be 1-500 kg';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'bpSystolic':
    case 'bpDiastolic':
      return value.replace(/[^0-9]/g, '');

    case 'temperature':
    case 'weight':
      if (value === '') return value;
      const filtered = value.replace(/[^0-9.]/g, '');
      const parts = filtered.split('.');
      if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
      }
      return filtered;

    default:
      return value;
  }
};

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

const UpdatePatientVisit = ({ isOpen, onClose, onSuccess, visitId }) => {
  const [formData, setFormData] = useState({
    visitId: '',
    appointmentId: 0,
    doctorId: '',
    visitDate: '',
    visitTime: '',
    reason: '',
    symptoms: '',
    bpSystolic: '',
    bpDiastolic: '',
    temperature: '',
    weight: '',
    status: ''
  });

  const [doctors, setDoctors] = useState([]);
  const [appointmentInfo, setAppointmentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [hasAppointment, setHasAppointment] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  useEffect(() => {
    if (isOpen && visitId) {
      fetchVisitDetails();
      fetchDoctors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, visitId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        visitId: '', appointmentId: 0, doctorId: '', visitDate: '',
        visitTime: '', reason: '', symptoms: '', bpSystolic: '',
        bpDiastolic: '', temperature: '', weight: '', status: ''
      });
      setAppointmentInfo(null);
      setPatientInfo(null);
      setHasAppointment(false);
      setValidationMessages({});
      setError(null);
    }
  }, [isOpen]);

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  };

  const fetchVisitDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const data = await getPatientVisitList(clinicId, {
        VisitID: Number(visitId),
        BranchID: branchId
      });

      if (data && data.length > 0) {
        const visit = data[0];

        setPatientInfo({
          name: visit.patientName,
          fileNo: visit.patientFileNo,
          mobile: visit.patientMobile,
        });

        const formattedDate = formatDateForInput(visit.visitDate);

        setFormData({
          visitId: visit.id,
          appointmentId: visit.appointmentId || 0,
          doctorId: visit.doctorId || '',
          visitDate: formattedDate,
          visitTime: visit.visitTime?.substring(0, 5) || '',
          reason: visit.reason || '',
          symptoms: visit.symptoms || '',
          bpSystolic: visit.bpSystolic || '',
          bpDiastolic: visit.bpDiastolic || '',
          temperature: visit.temperature || '',
          weight: visit.weight || '',
          status: visit.status ?? 0,
        });

        if (visit.appointmentId && visit.appointmentId !== 0) {
          setHasAppointment(true);
          fetchAppointmentDetails(visit.appointmentId);
        }
      } else {
        setError({ message: 'Visit not found' });
      }
    } catch (err) {
      console.error('fetchVisitDetails error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load visit details' }
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentDetails = async (appointmentId) => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const data = await getAppointmentList(clinicId, {
        BranchID: branchId,
        AppointmentID: appointmentId,
      });

      if (data && data.length > 0) {
        const appointment = data[0];
        appointment.formattedDate = formatDateForInput(appointment.appointmentDate);
        setAppointmentInfo(appointment);
      }
    } catch (err) {
      console.error('Failed to fetch appointment details:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const data = await getEmployeeList(clinicId, {
        BranchID: branchId,
        Designation: 1,
        Status: 1,
        PageSize: 100
      });
      setDoctors(data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);

    setFormData(prev => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({ ...prev, [name]: validationMessage }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let formattedDate = formData.visitDate;
      if (formattedDate && !formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        formattedDate = formatDateForInput(formattedDate);
      }

      const visitData = {
        visitId: formData.visitId,
        appointmentId: formData.appointmentId,
        doctorId: formData.doctorId ? parseInt(formData.doctorId) : 0,
        visitDate: formattedDate,
        visitTime: formData.visitTime,
        reason: formData.reason,
        symptoms: formData.symptoms,
        bpSystolic: formData.bpSystolic ? parseInt(formData.bpSystolic) : 0,
        bpDiastolic: formData.bpDiastolic ? parseInt(formData.bpDiastolic) : 0,
        temperature: formData.temperature ? parseFloat(formData.temperature) : 0,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        status: formData.status ?? 0
      };

      await updatePatientVisit(visitData);

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error('Failed to update visit:', err);
      setError({ message: err.message || 'Failed to update patient visit' });
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className={styles.updateVisitOverlay}>
      <div className={styles.updateVisitModal}>

        {/* Header */}
        <div className={styles.updateVisitHeader}>
          <div className={styles.updateVisitHeaderContent}>
            <FiSave className={styles.updateVisitHeaderIcon} size={24} />
            <h2>Update Patient Visit</h2>
          </div>
          <button onClick={onClose} className={styles.updateVisitClose} disabled={saving}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.updateVisitForm}>
          <div className={styles.updateVisitBody}>

            {/* Error */}
            {error && !loading && !(error?.status >= 400 || error?.code >= 400) && (
              <div className={styles.updateVisitError}>{error.message || String(error)}</div>
            )}

            {/* Loading */}
            {loading ? (
              <div className={styles.appointmentsLoading}>
                <div className={styles.spinner}></div>
                <p>Loading visit details...</p>
              </div>
            ) : error && (error?.status >= 400 || error?.code >= 400) ? (
              <ErrorHandler error={error} />
            ) : (
              <>
                {/* Patient Info Banner */}
                {patientInfo && (
                  <div className={styles.patientInfoBanner}>
                    <div className={styles.patientInfoItem}>
                      <span className={styles.patientInfoLabel}>Patient</span>
                      <span className={styles.patientInfoValue}>{patientInfo.name}</span>
                    </div>
                    <div className={styles.patientInfoDivider} />
                    <div className={styles.patientInfoItem}>
                      <span className={styles.patientInfoLabel}>File No</span>
                      <span className={styles.patientInfoValue}>{patientInfo.fileNo}</span>
                    </div>
                    <div className={styles.patientInfoDivider} />
                    <div className={styles.patientInfoItem}>
                      <span className={styles.patientInfoLabel}>Mobile</span>
                      <span className={styles.patientInfoValue}>{patientInfo.mobile}</span>
                    </div>
                  </div>
                )}

                {/* Appointment Info Banner */}
                {hasAppointment && appointmentInfo && (
                  <div className={styles.appointmentInfoBanner}>
                    <div className={styles.appointmentBannerHeader}>
                      <FiInfo size={18} />
                      <span>This visit is linked to an appointment</span>
                    </div>
                    <div className={styles.appointmentBannerDetails}>
                      <div className={styles.appointmentBannerItem}>
                        <strong>Appointment Date:</strong> {formatDate(appointmentInfo.appointmentDate)}
                      </div>
                      <div className={styles.appointmentBannerItem}>
                        <strong>Appointment Time:</strong> {formatTime(appointmentInfo.appointmentTime)}
                      </div>
                      <div className={styles.appointmentBannerItem}>
                        <strong>Doctor:</strong> {appointmentInfo.doctorFullName}
                      </div>
                      {appointmentInfo.reason && (
                        <div className={styles.appointmentBannerItem}>
                          <strong>Appointment Reason:</strong> {appointmentInfo.reason}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Doctor Section (only if no appointment) */}
                {!hasAppointment && (
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>
                      <FiUser size={18} />
                      Doctor Information
                    </h3>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Doctor</label>
                      <select
                        name="doctorId"
                        value={formData.doctorId}
                        onChange={handleChange}
                        className={styles.formSelect}
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.firstName} {doctor.lastName} - {doctor.employeeCode}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Visit Details Section */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <FiCalendar size={18} />
                    Visit Details
                  </h3>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Visit Date <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="date"
                        name="visitDate"
                        value={formData.visitDate}
                        onChange={handleChange}
                        min={getTodayDate()}
                        required
                        disabled={hasAppointment}
                        className={styles.formInput}
                      />
                      {validationMessages.visitDate && !hasAppointment && (
                        <span className={styles.validationMsg}>{validationMessages.visitDate}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>
                        Visit Time <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="time"
                        name="visitTime"
                        value={formData.visitTime}
                        onChange={handleChange}
                        required
                        disabled={hasAppointment}
                        className={styles.formInput}
                      />
                      {validationMessages.visitTime && !hasAppointment && (
                        <span className={styles.validationMsg}>{validationMessages.visitTime}</span>
                      )}
                    </div>
                  </div>

                  <div className={`${styles.formRow} ${styles.reasonSymptomsRow}`}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Reason for Visit</label>
                      <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="e.g., Regular checkup, Follow-up..."
                        className={`${styles.formTextarea} ${styles.tallTextarea}`}
                        maxLength="200"
                        rows={5}
                      />
                      {validationMessages.reason && (
                        <span className={styles.validationMsg}>{validationMessages.reason}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Symptoms</label>
                      <textarea
                        name="symptoms"
                        value={formData.symptoms}
                        onChange={handleChange}
                        placeholder="Describe patient symptoms..."
                        className={`${styles.formTextarea} ${styles.tallTextarea}`}
                        maxLength="500"
                        rows={5}
                      />
                      {validationMessages.symptoms && (
                        <span className={styles.validationMsg}>{validationMessages.symptoms}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vital Signs Section */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <FiActivity size={18} />
                    Vital Signs
                  </h3>

                  <div className={`${styles.formRow} ${styles.vitalsRow}`}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Systolic BP (mmHg)</label>
                      <input
                        type="text"
                        name="bpSystolic"
                        value={formData.bpSystolic}
                        onChange={handleChange}
                        placeholder='50-250'
                        className={styles.formInput}
                      />
                      {validationMessages.bpSystolic && (
                        <span className={styles.validationMsg}>{validationMessages.bpSystolic}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Diastolic BP (mmHg)</label>
                      <input
                        type="text"
                        name="bpDiastolic"
                        value={formData.bpDiastolic}
                        onChange={handleChange}
                        placeholder='30-150'
                        className={styles.formInput}
                      />
                      {validationMessages.bpDiastolic && (
                        <span className={styles.validationMsg}>{validationMessages.bpDiastolic}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Temperature (°F)</label>
                      <input
                        type="text"
                        name="temperature"
                        value={formData.temperature}
                        onChange={handleChange}
                        placeholder='90-110'
                        className={styles.formInput}
                      />
                      {validationMessages.temperature && (
                        <span className={styles.validationMsg}>{validationMessages.temperature}</span>
                      )}
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Weight (kg)</label>
                      <input
                        type="text"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder='1-500'
                        className={styles.formInput}
                      />
                      {validationMessages.weight && (
                        <span className={styles.validationMsg}>{validationMessages.weight}</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!loading && !(error?.status >= 400 || error?.code >= 400) && (
            <div className={styles.updateVisitFooter}>
              <button
                type="button"
                onClick={onClose}
                className={styles.btnCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default UpdatePatientVisit;