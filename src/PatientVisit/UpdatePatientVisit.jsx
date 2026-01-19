// src/components/UpdatePatientVisit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiInfo } from 'react-icons/fi';
import { getPatientVisitList, updatePatientVisit, getEmployeeList, getAppointmentList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './UpdatePatientVisit.css';
import BranchList from '../BranchList/BranchList.jsx';

const UpdatePatientVisit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
    weight: ''
  });

  const [doctors, setDoctors] = useState([]);
  const [appointmentInfo, setAppointmentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [hasAppointment, setHasAppointment] = useState(false);

  useEffect(() => {
    fetchVisitDetails();
    fetchDoctors();
  }, [id]);

  const formatDateForInput = (dateString) => {
    if (!dateString) {
      console.log('formatDateForInput: dateString is empty or null');
      return '';
    }
    
    try {
      // Handle both ISO format and date-only format
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('formatDateForInput: Invalid date:', dateString);
        return '';
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formatted = `${year}-${month}-${day}`;
      
      console.log('formatDateForInput: Input:', dateString, 'Output:', formatted);
      return formatted;
    } catch (error) {
      console.error('formatDateForInput: Error formatting date:', error);
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
        VisitID: Number(id),
        BranchID: branchId
      });

      console.log('fetchVisitDetails: Raw visit data:', data);

      if (data && data.length > 0) {
        const visit = data[0];
        
        console.log('fetchVisitDetails: Visit details:', visit);
        console.log('fetchVisitDetails: Visit date from API:', visit.visitDate);
        
        setPatientInfo({
          name: visit.patientName,
          fileNo: visit.patientFileNo,
          mobile: visit.patientMobile,
        });

        const formattedDate = formatDateForInput(visit.visitDate);
        console.log('fetchVisitDetails: Formatted date:', formattedDate);

        const newFormData = {
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
          weight: visit.weight || ''
        };

        console.log('fetchVisitDetails: Setting form data:', newFormData);
        setFormData(newFormData);

        // Check if visit has an appointment
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
        // Format the appointment date for display
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Ensure date is in YYYY-MM-DD format
      let formattedDate = formData.visitDate;
      
      // If the date isn't already in YYYY-MM-DD format, format it
      if (formattedDate && !formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        formattedDate = formatDateForInput(formattedDate);
      }
      
      console.log('handleSubmit: Original date:', formData.visitDate);
      console.log('handleSubmit: Formatted date:', formattedDate);
      
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
        weight: formData.weight ? parseFloat(formData.weight) : 0
      };

      console.log('handleSubmit: Submitting visit data:', visitData);

      await updatePatientVisit(visitData);
      navigate('/patientvisit-list');
    } catch (err) {
      console.error('Failed to update visit:', err);
      setError({ message: err.message || 'Failed to update patient visit' });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/patientvisit-list');
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="update-visit-loading">Loading visit details...</div>;

  if (error) return <div className="update-visit-error">Error: {error.message || error}</div>;

  return (
    <div className="update-visit-wrapper">
      <ErrorHandler error={error} />
      <Header title="Update Patient Visit" />

      <div className="update-visit-toolbar">
        <button onClick={handleBack} className="update-visit-back-btn">
          <FiArrowLeft size={20} /> Back to Visits
        </button>
      </div>

      {patientInfo && (
        <div className="patient-info-banner">
          <div className="patient-info-content">
            <div className="patient-info-label">Patient</div>
            <div className="patient-info-value">{patientInfo.name}</div>
          </div>
          <div className="patient-info-content">
            <div className="patient-info-label">File No</div>
            <div className="patient-info-value">{patientInfo.fileNo}</div>
          </div>
          <div className="patient-info-content">
            <div className="patient-info-label">Mobile</div>
            <div className="patient-info-value">{patientInfo.mobile}</div>
          </div>
        </div>
      )}

      {hasAppointment && appointmentInfo && (
        <div className="appointment-info-banner">
          <div className="appointment-banner-header">
            <FiInfo size={20} />
            <span>This visit is linked to an appointment</span>
          </div>
          <div className="appointment-banner-details">
            <div className="appointment-banner-item">
              <strong>Appointment Date:</strong> {formatDate(appointmentInfo.appointmentDate)}
            </div>
            <div className="appointment-banner-item">
              <strong>Appointment Time:</strong> {formatTime(appointmentInfo.appointmentTime)}
            </div>
            <div className="appointment-banner-item">
              <strong>Doctor:</strong> {appointmentInfo.doctorFullName}
            </div>
            {appointmentInfo.reason && (
              <div className="appointment-banner-item">
                <strong>Appointment Reason:</strong> {appointmentInfo.reason}
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="update-visit-form">
        <div className="update-visit-card">
          {!hasAppointment && (
            <div className="form-section">
              <h3 className="section-title">Doctor Information</h3>
              <div className="form-group">
                <label className="form-label">Doctor</label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleChange}
                  className="form-select"
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

          <div className="form-section">
            <h3 className="section-title">Visit Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Visit Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  required
                  disabled={hasAppointment}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Visit Time <span className="required">*</span>
                </label>
                <input
                  type="time"
                  name="visitTime"
                  value={formData.visitTime}
                  onChange={handleChange}
                  required
                  disabled={hasAppointment}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Visit</label>
              <input
                type="text"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="e.g., Regular checkup, Follow-up..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Symptoms</label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleChange}
                rows="4"
                placeholder="Describe patient symptoms..."
                className="form-textarea"
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Vital Signs</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  name="bpSystolic"
                  value={formData.bpSystolic}
                  onChange={handleChange}
                  placeholder="120"
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  name="bpDiastolic"
                  value={formData.bpDiastolic}
                  onChange={handleChange}
                  placeholder="80"
                  min="0"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Temperature (°F)</label>
                <input
                  type="number"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  placeholder="98.6"
                  step="0.1"
                  min="0"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="70"
                  step="0.1"
                  min="0"
                  className="form-input"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleBack}
              className="btn-cancel"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={saving}
            >
              <FiSave size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UpdatePatientVisit;