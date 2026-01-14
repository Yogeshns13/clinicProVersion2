// src/components/AddAppointment.jsx
import React, { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiUser, FiSearch } from 'react-icons/fi';
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
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Filter patients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = patients.filter(patient => {
        const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
        const mobile = patient.mobile || '';
        return fullName.includes(query) || mobile.includes(query);
      });
      setFilteredPatients(filtered);
    }
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    try {
      const clinicId = localStorage.getItem('clinicID');
      const data = await getPatientsList(clinicId, {
        Status: 1,
        PageSize: 100
      });
      setPatients(data);
      setFilteredPatients(data);
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
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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
    setSearchQuery('');
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
      <div className="clinic-modal" style={{ maxWidth: '900px' }}>
        <div className="clinic-modal-header">
          <h2>
            <FiCalendar style={{ marginRight: '10px' }} />
            Book New Appointment
          </h2>
          <button onClick={handleClose} className="clinic-modal-close" disabled={loading}>
            <FiX />
          </button>
        </div>

        <div className="clinic-modal-content">
          {error && (
            <div style={{
              padding: '0px 12px 16px',
              marginBottom: '20px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c00',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '20px',
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              color: '#155724',
              fontSize: '0.875rem'
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className='clinic-modal-body' style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Patient Selection */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '2px solid rgba(34, 43, 108, 0.1)'
              }}>
                <FiUser style={{ color: '#222B6C', fontSize: '1.2rem' }} />
                <h3 style={{ margin: 0, color: '#222B6C', fontSize: '1.1rem' }}>Patient Information</h3>
              </div>

              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#222B6C'
              }}>
                Select Patient <span style={{ color: '#dc2626' }}>*</span>
              </label>

              {/* Search Input */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ position: 'relative' }}>
                  <FiSearch style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                    fontSize: '1rem'
                  }} />
                  <input
                    type="text"
                    placeholder="Search by name or mobile number..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 40px',
                      border: '2px solid rgba(34, 43, 108, 0.2)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#222B6C'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(34, 43, 108, 0.2)'}
                  />
                </div>
              </div>

              
              <select
                name="patientId"
                value={formData.patientId}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid rgba(34, 43, 108, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#222B6C'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(34, 43, 108, 0.2)'}
              >
                <option value="">-- Select Patient --</option>
                {filteredPatients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName} - {patient.fileNo} ({patient.mobile})
                  </option>
                ))}
              </select>

              {searchQuery && filteredPatients.length === 0 && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#92400e'
                }}>
                  No patients found matching "{searchQuery}"
                </div>
              )}

              {patients.length === 0 && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#991b1b'
                }}>
                  No patients found. Please add a patient first.
                </div>
              )}

              {selectedPatient && (
                <div style={{
                  marginTop: '15px',
                  padding: '15px',
                  backgroundColor: 'rgba(34, 43, 108, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 43, 108, 0.1)'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                    fontSize: '0.75rem'
                  }}>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>FILE NO</div>
                      <div style={{ color: '#222B6C', fontWeight: 600 }}>{selectedPatient.fileNo}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>MOBILE</div>
                      <div style={{ color: '#222B6C', fontWeight: 600 }}>{selectedPatient.mobile}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>AGE</div>
                      <div style={{ color: '#222B6C', fontWeight: 600 }}>{selectedPatient.age || '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>BLOOD GROUP</div>
                      <div style={{ color: '#222B6C', fontWeight: 600 }}>{selectedPatient.bloodGroupDesc || '—'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor & Date Selection */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '2px solid rgba(34, 43, 108, 0.1)'
              }}>
                <FiClock style={{ color: '#222B6C', fontSize: '1.2rem' }} />
                <h3 style={{ margin: 0, color: '#222B6C', fontSize: '1.1rem' }}>Appointment Details</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#222B6C'
                  }}>
                    Select Doctor <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleDoctorChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid rgba(34, 43, 108, 0.2)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#222B6C'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(34, 43, 108, 0.2)'}
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.employeeCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#222B6C'
                  }}>
                    Appointment Date <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={getMinDate()}
                    max={getMaxDate()}
                    required
                    disabled={!formData.doctorId}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '2px solid rgba(34, 43, 108, 0.2)',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      cursor: formData.doctorId ? 'pointer' : 'not-allowed',
                      opacity: formData.doctorId ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#222B6C'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(34, 43, 108, 0.2)'}
                  />
                  {!formData.doctorId && (
                    <div style={{
                      marginTop: '6px',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      fontStyle: 'italic'
                    }}>
                      Please select a doctor first
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Available Slots */}
            {formData.doctorId && selectedDate && (
              <>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid rgba(34, 43, 108, 0.1)'
                  }}>
                    <h3 style={{ margin: 0, color: '#222B6C', fontSize: '1.1rem' }}>
                      Available Time Slots
                      {selectedDate && (
                        <span style={{ fontWeight: 400, fontSize: '0.85rem', color: '#64748b', marginLeft: '8px' }}>
                          ({formatSlotDate(selectedDate)})
                        </span>
                      )}
                    </h3>
                  </div>

                  {loadingSlots ? (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center',
                      color: '#64748b',
                      fontSize: '0.875rem'
                    }}>
                      Loading available slots...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{
                      padding: '30px',
                      textAlign: 'center',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #fbbf24'
                    }}>
                      <div style={{ color: '#92400e', fontSize: '0.875rem', marginBottom: '6px' }}>
                        No available slots found for this doctor on {formatSlotDate(selectedDate)}
                      </div>
                      <div style={{ color: '#92400e', fontSize: '0.75rem' }}>
                        Please try a different date or doctor
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      gap: '10px'
                    }}>
                      {availableSlots.map(slot => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, slotId: slot.id.toString() }))}
                          style={{
                            padding: '12px',
                            border: formData.slotId === slot.id.toString()
                              ? '2px solid #222B6C'
                              : '2px solid rgba(34, 43, 108, 0.2)',
                            borderRadius: '8px',
                            backgroundColor: formData.slotId === slot.id.toString()
                              ? 'rgba(34, 43, 108, 0.1)'
                              : 'white',
                            color: formData.slotId === slot.id.toString() ? '#222B6C' : '#64748b',
                            fontSize: '0.875rem',
                            fontWeight: formData.slotId === slot.id.toString() ? 700 : 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            outline: 'none'
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
                          {formatSlotTime(slot.slotTime)}
                        </button>
                      ))}
                    </div>
                  )}

                  {formData.slotId && selectedSlot && (
                    <div style={{
                      marginTop: '15px',
                      padding: '12px',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      borderRadius: '8px',
                      border: '2px solid rgba(34, 197, 94, 0.3)',
                      fontSize: '0.875rem',
                      color: '#059669',
                      fontWeight: 600
                    }}>
                      ✓ Selected: {formatSlotDate(selectedSlot.slotDate)} at {formatSlotTime(selectedSlot.slotTime)}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Reason */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#222B6C'
              }}>
                Reason for Visit
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                rows="3"
                placeholder="Brief description of the reason for visit (optional)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid rgba(34, 43, 108, 0.2)',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#222B6C'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(34, 43, 108, 0.2)'}
              />
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
          <button
            onClick={handleClose}
            className="btn-cancel"
            disabled={loading}
          >
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