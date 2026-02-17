// src/components/UpdatePatientVisit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiInfo } from 'react-icons/fi';
import { getPatientVisitList, updatePatientVisit, getEmployeeList, getAppointmentList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './UpdatePatientVisit.css';
import BranchList from '../BranchList/BranchList.jsx';


const getLiveValidationMessage = (fieldName, value) => {
  // Returns validation message while typing (empty string = valid)
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
  const [validationMessages, setValidationMessages] = useState({});

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
      const date = new Date(dateString);
      
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
          weight: visit.weight || '',
        };

        console.log('fetchVisitDetails: Setting form data:', newFormData);
        setFormData(newFormData);

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
  
    const filteredValue = filterInput(name, value);
    
    setFormData(prev => ({
      ...prev,
      [name]: filteredValue
    }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
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
        weight: formData.weight ? parseFloat(formData.weight) : 0,
        status: 0
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
                  min={getTodayDate()}
                  required
                  disabled={hasAppointment}
                  className="form-input"
                />
                
                {validationMessages.visitDate && !hasAppointment && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.visitDate}
                  </span>
                )}
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
                
                {validationMessages.visitTime && !hasAppointment && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.visitTime}
                  </span>
                )}
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
                maxLength="200"
              />
              
              {validationMessages.reason && (
                <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validationMessages.reason}
                </span>
              )}
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
                maxLength="500"
              />
              
              {validationMessages.symptoms && (
                <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validationMessages.symptoms}
                </span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Vital Signs</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Systolic BP (mmHg)</label>
                <input
                  type="text"
                  name="bpSystolic"
                  value={formData.bpSystolic}
                  onChange={handleChange}
                  placeholder="120"
                  className="form-input"
                />
              
                {validationMessages.bpSystolic && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.bpSystolic}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Diastolic BP (mmHg)</label>
                <input
                  type="text"
                  name="bpDiastolic"
                  value={formData.bpDiastolic}
                  onChange={handleChange}
                  placeholder="80"
                  className="form-input"
                />
    
                {validationMessages.bpDiastolic && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.bpDiastolic}
                  </span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Temperature (°F)</label>
                <input
                  type="text"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  placeholder="98.6"
                  className="form-input"
                />
                {validationMessages.temperature && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {validationMessages.temperature}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="70"
                  className="form-input"
                />
                {validationMessages.weight && (
                  <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {validationMessages.weight}
                </span>
                )}
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