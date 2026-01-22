// src/components/AddPatientVisit.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiCalendar, FiActivity, FiCheckCircle } from 'react-icons/fi';
import { addPatientVisit, getPatientsList, getEmployeeList, getAppointmentList } from '../api/api.js';
import './AddPatientVisit.css';

const AddPatientVisit = ({ isOpen, onClose, onSuccess, preSelectedAppointmentId = null }) => {
  const [visitMode, setVisitMode] = useState('without'); // 'with' or 'without'
  
  const [formData, setFormData] = useState({
    appointmentId: 0,
    PatientID: '',
    DoctorID: '',
    VisitDate: new Date().toISOString().split('T')[0],
    VisitTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
    reason: '',
    symptoms: '',
    bpSystolic: '',
    bpDiastolic: '',
    temperature: '',
    weight: ''
  });

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  
  const [searchPatient, setSearchPatient] = useState('');
  const [searchDoctor, setSearchDoctor] = useState('');

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (isOpen) {
      // If preSelectedAppointmentId exists, we're coming from pending appointments
      if (preSelectedAppointmentId) {
        fetchSingleAppointment(preSelectedAppointmentId);
      } else {
        // When opened from "Add Visit" button in Visited Patients, always go without appointment
        setVisitMode('without');
        fetchPatients();
        fetchDoctors();
      }
    }
  }, [isOpen, preSelectedAppointmentId]);

  // Fetch single appointment for pending appointment workflow
  const fetchSingleAppointment = async (appointmentId) => {
    try {
      setLoadingAppointments(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const data = await getAppointmentList(clinicId, {
        BranchID: branchId,
        AppointmentID: appointmentId,
        PageSize: 1
      });

      if (data && data.length > 0) {
        const appointment = data[0];
        setSelectedAppointment(appointment);
        setVisitMode('with');
        
        setFormData({
          appointmentId: appointment.id,
          PatientID: appointment.patientId,
          DoctorID: appointment.doctorId,
          VisitDate: formatDateForInput(appointment.appointmentDate),
          VisitTime: appointment.appointmentTime.substring(0, 5),
          reason: appointment.reason || '',
          symptoms: '',
          bpSystolic: '',
          bpDiastolic: '',
          temperature: '',
          weight: ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch appointment:', err);
      setError('Failed to load appointment details');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const data = await getPatientsList(clinicId, { BranchID: branchId, Status: 1, PageSize: 100 });
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
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

  const fetchTodayAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const today = new Date().toISOString().split('T')[0];
      
      const data = await getAppointmentList(clinicId, {
        BranchID: branchId,
        AppointmentDate: today,
        Status: 1,
        PageSize: 100
      });
      
      setAppointments(data);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to load appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleModeChange = (mode) => {
    setVisitMode(mode);
    setSelectedAppointment(null);
    setError(null);
    setFormData({
      appointmentId: 0,
      PatientID: '',
      DoctorID: '',
      VisitDate: new Date().toISOString().split('T')[0],
      VisitTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
      reason: '',
      symptoms: '',
      bpSystolic: '',
      bpDiastolic: '',
      temperature: '',
      weight: ''
    });
  };

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      appointmentId: appointment.id,
      PatientID: appointment.patientId,
      DoctorID: appointment.doctorId,
      VisitDate: formatDateForInput(appointment.appointmentDate),
      VisitTime: appointment.appointmentTime.substring(0, 5),
      reason: appointment.reason || '',
      symptoms: '',
      bpSystolic: '',
      bpDiastolic: '',
      temperature: '',
      weight: ''
    });
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
    setLoading(true);
    setError(null);

    try {
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      const formattedDate = formatDateForInput(formData.VisitDate);

      const visitData = {
        ...formData,
        VisitDate: formattedDate,
        clinicId: parseInt(clinicId),
        branchId: parseInt(branchId),
        bpSystolic: formData.bpSystolic ? parseInt(formData.bpSystolic) : 0,
        bpDiastolic: formData.bpDiastolic ? parseInt(formData.bpDiastolic) : 0,
        temperature: formData.temperature ? parseFloat(formData.temperature) : 0,
        weight: formData.weight ? parseFloat(formData.weight) : 0
      };

      console.log('Submitting visit data:', visitData);

      await addPatientVisit(visitData);
      
      // Reset form
      setFormData({
        appointmentId: 0,
        PatientID: '',
        DoctorID: '',
        VisitDate: new Date().toISOString().split('T')[0],
        VisitTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
        reason: '',
        symptoms: '',
        bpSystolic: '',
        bpDiastolic: '',
        temperature: '',
        weight: ''
      });
      setVisitMode('without');
      setSelectedAppointment(null);

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add visit:', err);
      setError(err.message || 'Failed to add patient visit');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const filteredPatients = patients.filter(p =>
    p.firstName?.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.lastName?.toLowerCase().includes(searchPatient.toLowerCase()) ||
    p.fileNo?.toLowerCase().includes(searchPatient.toLowerCase())
  );

  const filteredDoctors = doctors.filter(d =>
    d.firstName?.toLowerCase().includes(searchDoctor.toLowerCase()) ||
    d.lastName?.toLowerCase().includes(searchDoctor.toLowerCase()) ||
    d.employeeCode?.toLowerCase().includes(searchDoctor.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="add-visit-overlay">
      <div className="add-visit-modal">
        <div className="add-visit-header">
          <div className="add-visit-header-content">
            <FiActivity className="add-visit-header-icon" size={24} />
            <h2>
              {preSelectedAppointmentId ? 'Complete Visit from Appointment' : 'Add New Patient Visit'}
            </h2>
          </div>
          <button onClick={onClose} className="add-visit-close">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="add-visit-form">
          <div className="add-visit-body">
            {error && (
              <div className="add-visit-error">
                {error}
              </div>
            )}

            {loadingAppointments && (
              <div className="appointments-loading">
                <div className="spinner"></div>
                <p>Loading appointment details...</p>
              </div>
            )}

            {/* Visit Mode Selection - Only show when coming from pending appointments */}
            {!preSelectedAppointmentId && !loadingAppointments && false && (
              <div className="visit-mode-section">
                <h3 className="mode-title">Select Visit Type</h3>
                <div className="mode-options">
                  <label className={`mode-option ${visitMode === 'with' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="visitMode"
                      value="with"
                      checked={visitMode === 'with'}
                      onChange={() => handleModeChange('with')}
                    />
                    <div className="mode-content">
                      <FiCheckCircle size={20} />
                      <span>With Appointment</span>
                    </div>
                  </label>
                  <label className={`mode-option ${visitMode === 'without' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="visitMode"
                      value="without"
                      checked={visitMode === 'without'}
                      onChange={() => handleModeChange('without')}
                    />
                    <div className="mode-content">
                      <FiUser size={20} />
                      <span>Without Appointment</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* With Appointment - Show Today's Appointments */}
            {visitMode === 'with' && !preSelectedAppointmentId && !loadingAppointments && (
              <div className="appointments-section">
                <h3 className="section-title">
                  <FiCalendar size={18} />
                  Today's Appointments
                </h3>
                
                {appointments.length === 0 ? (
                  <div className="no-appointments">
                    <p>No scheduled appointments found for today.</p>
                  </div>
                ) : (
                  <div className="appointments-list">
                    {appointments.map((appt) => (
                      <div
                        key={appt.id}
                        className={`appointment-card ${selectedAppointment?.id === appt.id ? 'selected' : ''}`}
                        onClick={() => handleAppointmentSelect(appt)}
                      >
                        <div className="appointment-header">
                          <div className="appointment-patient">
                            <div className="patient-avatar">
                              {appt.patientName?.charAt(0).toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className="patient-name">{appt.patientName}</div>
                              <div className="patient-info">{appt.patientMobile}</div>
                            </div>
                          </div>
                          {selectedAppointment?.id === appt.id && (
                            <FiCheckCircle className="selected-icon" size={24} />
                          )}
                        </div>
                        <div className="appointment-details">
                          <div className="appointment-detail">
                            <strong>Doctor:</strong> {appt.doctorFullName}
                          </div>
                          <div className="appointment-detail">
                            <strong>Time:</strong> {formatTime(appt.appointmentTime)}
                          </div>
                          {appt.reason && (
                            <div className="appointment-detail">
                              <strong>Reason:</strong> {appt.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Show selected appointment summary if pre-selected */}
            {preSelectedAppointmentId && selectedAppointment && !loadingAppointments && (
              <div className="selected-appointment-summary">
                <div className="summary-header">
                  <FiCalendar size={20} />
                  <span>Appointment Details</span>
                </div>
                <div className="summary-content">
                  <div className="summary-row">
                    <span className="summary-label">Patient:</span>
                    <span className="summary-value">{selectedAppointment.patientName}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Mobile:</span>
                    <span className="summary-value">{selectedAppointment.patientMobile}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Doctor:</span>
                    <span className="summary-value">{selectedAppointment.doctorFullName}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Scheduled Time:</span>
                    <span className="summary-value">
                      {formatTime(selectedAppointment.appointmentTime)}
                    </span>
                  </div>
                  {selectedAppointment.reason && (
                    <div className="summary-row">
                      <span className="summary-label">Reason:</span>
                      <span className="summary-value">{selectedAppointment.reason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Without Appointment - Show Patient/Doctor Selection */}
            {!preSelectedAppointmentId && !loadingAppointments && (
              <>
                <div className="form-section">
                  <h3 className="section-title">
                    <FiUser size={18} />
                    Patient Information
                  </h3>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Patient <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Search patient..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                      className="form-input"
                    />
                    <select
                      name="PatientID"
                      value={formData.PatientID}
                      onChange={handleChange}
                      required
                      className="form-select"
                    >
                      <option value="">Select Patient</option>
                      {filteredPatients.map(patient => (
                        <option key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName} - {patient.fileNo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <FiUser size={18} />
                    Doctor Information
                  </h3>
                  
                  <div className="form-group">
                    <label className="form-label">
                      Doctor <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Search doctor..."
                      value={searchDoctor}
                      onChange={(e) => setSearchDoctor(e.target.value)}
                      className="form-input"
                    />
                    <select
                      name="DoctorID"
                      value={formData.DoctorID}
                      onChange={handleChange}
                      required
                      className="form-select"
                    >
                      <option value="">Select Doctor</option>
                      {filteredDoctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.firstName} {doctor.lastName} - {doctor.employeeCode}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Visit Details - Show for all cases */}
            {!loadingAppointments && (
              <>
                <div className="form-section">
                  <h3 className="section-title">
                    <FiCalendar size={18} />
                    Visit Details
                  </h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Visit Date <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        name="VisitDate"
                        value={formData.VisitDate}
                        onChange={handleChange}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Visit Time <span className="required">*</span>
                      </label>
                      <input
                        type="time"
                        name="VisitTime"
                        value={formData.VisitTime}
                        onChange={handleChange}
                        required
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
                      readOnly={preSelectedAppointmentId && formData.reason}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Symptoms</label>
                    <textarea
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Describe patient symptoms..."
                      className="form-textarea"
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3 className="section-title">
                    <FiActivity size={18} />
                    Vital Signs
                  </h3>
                  
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
              </>
            )}
          </div>

          <div className="add-visit-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading || loadingAppointments}
            >
              {loading ? 'Booking Visit...' : 'Book Visit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientVisit;