// src/components/SlotList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiTrash2, FiEdit, FiPlus } from 'react-icons/fi';
import { getSlotList, getEmployeeList, deleteSlot, updateSlot, addSlot } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './SlotConfigList.css';

const SlotList = () => {
  const [slots, setSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const [bookedFilter, setBookedFilter] = useState('all'); 
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [hoveredSlotId, setHoveredSlotId] = useState(null);
  const [formData, setFormData] = useState({
    doctorId: '',
    slotDate: '',
    slotTime: ''
  });

  const [updateFormData, setUpdateFormData] = useState({
    appointmentId: 0,
    isBooked: 0
  });
  const [addValidationMessages, setAddValidationMessages] = useState({});
  const [updateValidationMessages, setUpdateValidationMessages] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    booked: 0,
    available: 0
  });

  // ────────────────────────────────────────────────
  // VALIDATION UTILITIES (consistent with previous components)
  // ────────────────────────────────────────────────
  const getLiveValidationMessage = (fieldName, value) => {
    switch (fieldName) {
      // Add Slot Modal
      case 'doctorId':
        if (!value) return 'Please select a doctor';
        return '';

      case 'slotDate':
        if (!value) return 'Please select a date';
        const selected = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selected.setHours(0, 0, 0, 0);
        if (selected < today) return 'Past dates are not allowed';
        return '';

      case 'slotTime':
        if (!value) return 'Please select a time';
        return '';

      // Update Slot Modal
      case 'appointmentId':
        if (value && isNaN(Number(value))) return 'Must be a number';
        if (value && Number(value) < 0) return 'Cannot be negative';
        return '';

      case 'isBooked':
        if (value === '' || value === undefined) return 'Please select booking status';
        return '';

      default:
        return '';
    }
  };

  // ────────────────────────────────────────────────
  // Data fetching
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const data = await getEmployeeList(clinicId, {
          BranchID: branchId,
          Designation: 1,
          Status: 1
        });
        setDoctors(data);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const doctorId = selectedDoctorId === 'all' ? 0 : Number(selectedDoctorId) || 0;

      const options = {
        BranchID: branchId,
        DoctorID: doctorId,
      };

      if (selectedDate) {
        options.SlotDate = selectedDate;
      }

      if (bookedFilter === 'booked') {
        options.IsBooked = 1;
      } else if (bookedFilter === 'available') {
        options.IsBooked = 0;
      }

      const data = await getSlotList(clinicId, options);

      setSlots(data);
      setAllSlots(data);

      // Calculate stats
      const total = data.length;
      const booked = data.filter(s => s.isBooked).length;
      const available = total - booked;

      setStats({ total, booked, available });

    } catch (err) {
      console.error('fetchSlots error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load slots' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedDoctorId, selectedDate, bookedFilter]);

  // ────────────────────────────────────────────────
  // Computed values
  const filteredSlots = useMemo(() => {
    if (!searchTerm.trim()) return allSlots;
    const term = searchTerm.toLowerCase();
    return allSlots.filter(
      (slot) =>
        slot.doctorName?.toLowerCase().includes(term) ||
        slot.doctorCode?.toLowerCase().includes(term) ||
        slot.slotDate?.toLowerCase().includes(term) ||
        slot.slotTime?.toLowerCase().includes(term)
    );
  }, [allSlots, searchTerm]);

  const groupedSlots = useMemo(() => {
    const groups = {};
    filteredSlots.forEach(slot => {
      const date = slot.slotDate || 'Unknown';
      if (!groups[date]) groups[date] = [];
      groups[date].push(slot);
    });

    return Object.keys(groups)
      .sort()
      .reduce((acc, date) => {
        acc[date] = groups[date].sort((a, b) => 
          (a.slotTime || '').localeCompare(b.slotTime || '')
        );
        return acc;
      }, {});
  }, [filteredSlots]);

  // ────────────────────────────────────────────────
  // Helper functions
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  const getSlotStatus = (slot) => {
    if (slot.status === 'inactive' || slot.status === 2) {
      return 'deleted';
    }
    return slot.isBooked ? 'booked' : 'available';
  };

  // ────────────────────────────────────────────────
  // Add Slot Handlers with validation
  // ────────────────────────────────────────────────
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    const message = getLiveValidationMessage(name, value);
    setAddValidationMessages(prev => ({
      ...prev,
      [name]: message
    }));
  };

  const validateAddForm = () => {
    const errors = {};

    ['doctorId', 'slotDate', 'slotTime'].forEach(field => {
      const msg = getLiveValidationMessage(field, formData[field]);
      if (msg) errors[field] = msg;
    });

    setAddValidationMessages(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();

    if (!validateAddForm()) {
      return;
    }

    try {
      setLoading(true);
      const clinicId = localStorage.getItem('clinicID');
      const branchId = localStorage.getItem('branchID');
      
      await addSlot({
        clinicId: parseInt(clinicId),
        branchId: parseInt(branchId),
        doctorId: parseInt(formData.doctorId),
        slotDate: formData.slotDate,
        slotTime: formData.slotTime + ':00'
      });

      setShowAddModal(false);
      setFormData({ doctorId: '', slotDate: '', slotTime: '' });
      setAddValidationMessages({});
      fetchSlots();
    } catch (err) {
      console.error('Add slot error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Update Slot Handlers with validation
  // ────────────────────────────────────────────────
  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({ ...prev, [name]: value }));

    const message = getLiveValidationMessage(name, value);
    setUpdateValidationMessages(prev => ({
      ...prev,
      [name]: message
    }));
  };

  const validateUpdateForm = () => {
    const errors = {};

    ['isBooked'].forEach(field => {
      const msg = getLiveValidationMessage(field, updateFormData[field]);
      if (msg) errors[field] = msg;
    });

    const appIdMsg = getLiveValidationMessage('appointmentId', updateFormData.appointmentId);
    if (appIdMsg) errors.appointmentId = appIdMsg;

    setUpdateValidationMessages(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();

    if (!validateUpdateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      await updateSlot({
        slotId: selectedSlot.id,
        appointmentId: parseInt(updateFormData.appointmentId),
        isBooked: parseInt(updateFormData.isBooked)
      });

      setShowUpdateModal(false);
      setSelectedSlot(null);
      setUpdateFormData({ appointmentId: 0, isBooked: 0 });
      setUpdateValidationMessages({});
      fetchSlots();
    } catch (err) {
      console.error('Update slot error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;

    try {
      setLoading(true);
      await deleteSlot(slotId);
      fetchSlots();
    } catch (err) {
      console.error('Delete slot error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (slot) => {
    setSelectedSlot(slot);
    setUpdateFormData({
      appointmentId: slot.appointmentId || 0,
      isBooked: slot.isBooked ? 1 : 0
    });
    setShowUpdateModal(true);
  };

  useEffect(() => {
    if (!showAddModal) setAddValidationMessages({});
    if (!showUpdateModal) setUpdateValidationMessages({});
  }, [showAddModal, showUpdateModal]);

  const handleSearch = () => setSearchTerm(searchInput.trim());

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDateChange = (e) => {
    const selectedValue = e.target.value;
    const selected = new Date(selectedValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    
    if (selected < today) {
      console.warn('Past dates are not allowed');
      return;
    }
    
    setSelectedDate(selectedValue);
  };

  const clearDateFilter = () => {
    setSelectedDate(getTodayDate());
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading slots...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header 
        title="Appointment Slots"
        actions={
          <button onClick={() => setShowAddModal(true)} className="clinic-generate-btn">
            <FiPlus size={18} />
            Add Slot
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon total"><FiCalendar size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Slots</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon booked"><FiCheckCircle size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.booked}</div>
            <div className="stat-label">Booked</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available"><FiXCircle size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{stats.available}</div>
            <div className="stat-label">Available</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="clinic-toolbar">
        <div className="clinic-select-wrapper">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="clinic-select"
          >
            <option value="all">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.firstName} {doc.lastName}
              </option>
            ))}
          </select>
        </div>

        <div className="date-filter-wrapper">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="date-filter-input"
            min={new Date().toISOString().split('T')[0]}
          />
          {selectedDate && selectedDate !== getTodayDate() && (
            <button onClick={clearDateFilter} className="clear-date-btn">
              Clear
            </button>
          )}
        </div>

        <div className="clinic-select-wrapper">
          <select
            value={bookedFilter}
            onChange={(e) => setBookedFilter(e.target.value)}
            className="clinic-select"
          >
            <option value="all">All Slots</option>
            <option value="available">Available Only</option>
            <option value="booked">Booked Only</option>
          </select>
        </div>

        <div className="clinic-search-container">
          <input
            type="text"
            placeholder="Search slots..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="clinic-search-input"
          />
          <button onClick={handleSearch} className="clinic-search-btn">
            <FiSearch size={20} />
          </button>
        </div>
        <button onClick={() => setShowAddModal(true)} className="slot-add-btn">
          <FiPlus size={22} /> Add Slots
        </button>
      </div>

      {/* Slots Grouped by Date */}
      <div className="slots-timeline">
        {Object.keys(groupedSlots).length === 0 ? (
          <div className="clinic-no-data">
            {searchTerm ? 'No slots found.' : 'No slots for selected date.'}
          </div>
        ) : (
          Object.entries(groupedSlots).map(([date, dateSlots]) => (
            <div key={date} className="date-group">
              <div className="date-header">
                <FiCalendar size={18} />
                <h3>{formatDate(date)}</h3>
                <span className="slot-count">
                  {dateSlots.length} slot{dateSlots.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="slots-grid">
                {dateSlots.map((slot) => {
                  const slotStatus = getSlotStatus(slot);
                  return (
                    <div 
                      key={slot.id} 
                      className={`slot-card ${slotStatus}`}
                      onMouseEnter={() => setHoveredSlotId(slot.id)}
                      onMouseLeave={() => setHoveredSlotId(null)}
                    >
                      <div className="slot-time">
                        <FiClock size={14} />
                        {formatTime(slot.slotTime)}
                      </div>

                      <div className="slot-doctor">
                        <div className="doctor-avatar">
                          {slot.doctorName?.charAt(0).toUpperCase() || 'D'}
                        </div>
                        <div className="doctor-info">
                          <div className="doctor-name">{slot.doctorName}</div>
                          <div className="doctor-code">{slot.doctorCode}</div>
                        </div>
                      </div>

                      <div className="slot-status">
                        {slotStatus === 'deleted' ? (
                          <>
                            <FiTrash2 size={14} className="status-icon deleted" />
                            <span className="status-text deleted">Deleted</span>
                          </>
                        ) : slotStatus === 'booked' ? (
                          <>
                            <FiCheckCircle size={14} className="status-icon booked" />
                            <span className="status-text booked">Booked</span>
                          </>
                        ) : (
                          <>
                            <FiXCircle size={14} className="status-icon available" />
                            <span className="status-text available">Available</span>
                          </>
                        )}
                      </div>

                      {slotStatus !== 'deleted' && (
                        <div className={`slot-actions ${hoveredSlotId === slot.id ? 'visible' : ''}`}>
                          {slot.isBooked && (
                            <button 
                              onClick={() => openUpdateModal(slot)}
                              className="btn-icon-edit"
                              title="Update Slot"
                            >
                              <FiEdit size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="btn-icon-delete"
                            title="Delete Slot"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Slot</h2>
              <button onClick={() => setShowAddModal(false)} className="modal-close-btn">×</button>
            </div>
            <form onSubmit={handleAddSlot} className="modal-form">
              <div className="form-group">
                <label>Doctor *</label>
                <select
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleAddChange}
                  required
                  className="form-input"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.firstName} {doc.lastName}
                    </option>
                  ))}
                </select>

                {addValidationMessages.doctorId && (
                  <span style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                    {addValidationMessages.doctorId}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Slot Date *</label>
                <input
                  type="date"
                  name="slotDate"
                  value={formData.slotDate}
                  onChange={handleAddChange}
                  required
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />

                {addValidationMessages.slotDate && (
                  <span style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                    {addValidationMessages.slotDate}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Slot Time *</label>
                <input
                  type="time"
                  name="slotTime"
                  value={formData.slotTime}
                  onChange={handleAddChange}
                  required
                  className="form-input"
                />

                {addValidationMessages.slotTime && (
                  <span style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                    {addValidationMessages.slotTime}
                  </span>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Slot Modal */}
      {showUpdateModal && selectedSlot && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Slot</h2>
              <button onClick={() => setShowUpdateModal(false)} className="modal-close-btn">×</button>
            </div>
            <form onSubmit={handleUpdateSlot} className="modal-form">
              <div className="slot-details-info">
                <p><strong>Doctor:</strong> {selectedSlot.doctorName}</p>
                <p><strong>Date:</strong> {formatDate(selectedSlot.slotDate)}</p>
                <p><strong>Time:</strong> {formatTime(selectedSlot.slotTime)}</p>
              </div>

              <div className="form-group">
                <label>Appointment ID</label>
                <input
                  type="number"
                  name="appointmentId"
                  value={updateFormData.appointmentId}
                  onChange={handleUpdateChange}
                  className="form-input"
                  placeholder="0 for no appointment"
                />

                {updateValidationMessages.appointmentId && (
                  <span style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                    {updateValidationMessages.appointmentId}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>Booking Status *</label>
                <select
                  name="isBooked"
                  value={updateFormData.isBooked}
                  onChange={handleUpdateChange}
                  required
                  className="form-input"
                >
                  <option value={0}>Available</option>
                  <option value={1}>Booked</option>
                </select>

                {updateValidationMessages.isBooked && (
                  <span style={{ color: '#666', fontSize: '0.85rem', marginTop: '5px', display: 'block' }}>
                    {updateValidationMessages.isBooked}
                  </span>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowUpdateModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotList;