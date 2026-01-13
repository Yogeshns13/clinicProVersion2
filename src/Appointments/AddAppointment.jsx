// src/components/AddAppointment.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { addAppointment, getPatientsList, getEmployeeList, getSlotList } from '../api/api.js';
import './AppointmentList.css';

const AddAppointment = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    slotId: '',
    reason: ''
  });

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (isOpen) {
      resetForm();
      fetchPatients();
      fetchDoctors();
    }
  }, [isOpen]);

  // Fetch slots when doctor and date are selected
  useEffect(() => {
    if (formData.doctorId && selectedDate) {
      fetchAvailableSlots(formData.doctorId, selectedDate);
    } else {
      setAvailableSlots([]);
      setFormData(prev => ({ ...prev, slotId: '' }));
    }
  }, [formData.doctorId, selectedDate]);

  const fetchPatients = async () => {
    try {
      const clinicId = localStorage.getItem('clinicID');
      const data = await getPatientsList(clinicId, {
        Status: 1,
        PageSize: 100
      });
      setPatients(data);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const clinicId = localStorage.getItem('clinicID');
      const data = await getEmployeeList(clinicId, {
        Designation: 1, // Assuming 1 is for doctors
        Status: 1,
        PageSize: 100
      });
      setDoctors(data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    setLoadingSlots(true);
    try {
      const clinicId = localStorage.getItem('clinicID');
      
      const data = await getSlotList(clinicId, {
        DoctorID: doctorId,
        SlotDate: date,
        IsBooked: 0, // Only available slots
        Status: 1,
        PageSize: 100
      });
      
      // Sort slots by time
      const sortedSlots = data.sort((a, b) => {
        return a.slotTime.localeCompare(b.slotTime);
      });
      
      setAvailableSlots(sortedSlots);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    setFormData(prev => ({
      ...prev,
      doctorId: doctorId,
      slotId: '' // Reset slot when doctor changes
    }));
    setError(null);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setFormData(prev => ({
      ...prev,
      slotId: '' // Reset slot when date changes
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');

      await addAppointment({
        clinicId: parseInt(clinicId),
        branchId: parseInt(branchId),
        patientId: parseInt(formData.patientId),
        doctorId: parseInt(formData.doctorId),
        slotId: parseInt(formData.slotId),
        reason: formData.reason.trim()
      });

      setSuccess('Appointment booked successfully!');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      slotId: '',
      reason: ''
    });
    setSelectedDate('');
    setAvailableSlots([]);
  };

  const handleClose = () => {
    resetForm();
    setError(null);
    setSuccess(null);
    onClose();
  };

  const formatSlotTime = (timeStr) => {
    if (!timeStr) return '';
    const time = timeStr.substring(0, 5); // HH:MM
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatSlotDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90); // 90 days ahead
    return maxDate.toISOString().split('T')[0];
  };

  const selectedSlot = availableSlots.find(slot => slot.id === parseInt(formData.slotId));
  const selectedPatient = patients.find(p => p.id === parseInt(formData.patientId));
  const selectedDoctor = doctors.find(d => d.id === parseInt(formData.doctorId));

  if (!isOpen) return null;

  return (
    <div className="clinic-modal-overlay">
      <div className="clinic-modal form-modal" style={{ maxWidth: '750px' }}>
        <div className="clinic-modal-header">
          <h2>Book New Appointment</h2>
          <button onClick={handleClose} className="clinic-modal-close">
            <FiX />
          </button>
        </div>

        <div className="clinic-modal-body">
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* Patient Selection */}
            <h3 className="form-section-title">Patient Information</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>
                  <FiUser size={14} style={{ marginRight: '5px' }} />
                  Select Patient <span className="required">*</span>
                </label>
                <select
                  name="patientId"
                  value={formData.patientId}
                  onChange={handleChange}
                  required
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map(patient => (
                    <option key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName} - {patient.fileNo} ({patient.mobile})
                    </option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="photo-hint" style={{ color: '#ef4444', marginTop: '5px' }}>
                    No patients found. Please add a patient first.
                  </p>
                )}
              </div>

              {selectedPatient && (
                <div className="form-group full-width" style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                  padding: '15px',
                  borderRadius: '10px',
                  border: '2px solid rgba(34, 197, 94, 0.2)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#059669' }}>FILE NO</label>
                      <p style={{ margin: '3px 0', fontWeight: 600, color: '#059669' }}>
                        {selectedPatient.fileNo}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#059669' }}>MOBILE</label>
                      <p style={{ margin: '3px 0', fontWeight: 600, color: '#059669' }}>
                        {selectedPatient.mobile}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#059669' }}>AGE</label>
                      <p style={{ margin: '3px 0', fontWeight: 600, color: '#059669' }}>
                        {selectedPatient.age || '—'}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#059669' }}>BLOOD GROUP</label>
                      <p style={{ margin: '3px 0', fontWeight: 600, color: '#059669' }}>
                        {selectedPatient.bloodGroupDesc || '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor & Date Selection */}
            <h3 className="form-section-title">Appointment Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <FiUser size={14} style={{ marginRight: '5px' }} />
                  Select Doctor <span className="required">*</span>
                </label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleDoctorChange}
                  required
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.employeeCode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FiCalendar size={14} style={{ marginRight: '5px' }} />
                  Appointment Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  min={getMinDate()}
                  max={getMaxDate()}
                  required
                  disabled={!formData.doctorId}
                />
                {!formData.doctorId && (
                  <p className="photo-hint" style={{ marginTop: '5px' }}>
                    Please select a doctor first
                  </p>
                )}
              </div>
            </div>

            {/* Available Slots */}
            {formData.doctorId && selectedDate && (
              <>
                <h3 className="form-section-title">
                  <FiClock size={16} style={{ marginRight: '5px' }} />
                  Available Time Slots
                  {selectedDate && (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 500, 
                      marginLeft: '10px',
                      color: '#64748b'
                    }}>
                      ({formatSlotDate(selectedDate)})
                    </span>
                  )}
                </h3>

                {loadingSlots ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '30px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                    borderRadius: '10px'
                  }}>
                    <p style={{ color: '#2563eb', fontWeight: 600 }}>Loading available slots...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '30px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
                    borderRadius: '10px',
                    border: '2px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    <p style={{ color: '#dc2626', fontWeight: 600, margin: 0 }}>
                      No available slots found for this doctor on {formatSlotDate(selectedDate)}
                    </p>
                    <p className="photo-hint" style={{ marginTop: '10px', color: '#64748b' }}>
                      Please try a different date or doctor
                    </p>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    {availableSlots.map(slot => (
                      <label 
                        key={slot.id}
                        className="checkbox-label"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '15px',
                          borderRadius: '10px',
                          border: `2px solid ${formData.slotId === slot.id.toString() ? '#2563eb' : 'rgba(34, 43, 108, 0.2)'}`,
                          background: formData.slotId === slot.id.toString() 
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.1))'
                            : 'rgba(255, 255, 255, 0.7)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.slotId !== slot.id.toString()) {
                            e.currentTarget.style.borderColor = '#94a3b8';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.slotId !== slot.id.toString()) {
                            e.currentTarget.style.borderColor = 'rgba(34, 43, 108, 0.2)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="slotId"
                          value={slot.id}
                          checked={formData.slotId === slot.id.toString()}
                          onChange={handleChange}
                          style={{ display: 'none' }}
                        />
                        <FiClock 
                          size={24} 
                          style={{ 
                            color: formData.slotId === slot.id.toString() ? '#2563eb' : '#64748b',
                            marginBottom: '8px'
                          }} 
                        />
                        <span style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 700,
                          color: formData.slotId === slot.id.toString() ? '#2563eb' : '#1e293b'
                        }}>
                          {formatSlotTime(slot.slotTime)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {formData.slotId && selectedSlot && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
                    padding: '15px',
                    borderRadius: '10px',
                    border: '2px solid rgba(59, 130, 246, 0.3)',
                    marginBottom: '20px'
                  }}>
                    <p style={{ 
                      margin: 0, 
                      fontWeight: 600, 
                      color: '#2563eb',
                      fontSize: '0.85rem'
                    }}>
                      ✓ Selected: {formatSlotDate(selectedSlot.slotDate)} at {formatSlotTime(selectedSlot.slotTime)}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Reason */}
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Reason for Visit</label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter reason for visit (optional)"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Summary */}
            {selectedPatient && selectedDoctor && selectedSlot && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                padding: '20px',
                borderRadius: '13px',
                border: '2px solid rgba(34, 197, 94, 0.3)',
                marginTop: '20px'
              }}>
                <h4 style={{ 
                  margin: '0 0 15px 0', 
                  color: '#059669',
                  fontSize: '1rem',
                  fontWeight: 700
                }}>
                  Appointment Summary
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  fontSize: '0.8rem'
                }}>
                  <div>
                    <strong style={{ color: '#059669' }}>Patient:</strong><br />
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </div>
                  <div>
                    <strong style={{ color: '#059669' }}>Doctor:</strong><br />
                    {selectedDoctor.name}
                  </div>
                  <div>
                    <strong style={{ color: '#059669' }}>Date & Time:</strong><br />
                    {formatSlotDate(selectedSlot.slotDate)}<br />
                    {formatSlotTime(selectedSlot.slotTime)}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="clinic-modal-footer">
          <button onClick={handleClose} className="btn-cancel" disabled={loading}>
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="btn-submit" 
            disabled={loading || !formData.slotId}
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAppointment;