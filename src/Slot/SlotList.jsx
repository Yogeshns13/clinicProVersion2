// src/components/SlotList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiCalendar, FiClock, FiCheckCircle, FiXCircle, FiTrash2, FiEdit, FiPlus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getSlotList, getSlotConfigList, getEmployeeList, deleteSlot, updateSlot, addSlot } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './SlotConfigList.css';

const SlotList = () => {
  // Data & Filter
  const [slots, setSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [slotConfigs, setSlotConfigs] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [bookedFilter, setBookedFilter] = useState('all'); // 'all', 'booked', 'available'
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Hover state
  const [hoveredSlotId, setHoveredSlotId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    doctorId: '',
    slotDate: '',
    slotTime: ''
  });

  const [updateFormData, setUpdateFormData] = useState({
    appointmentId: 0,
    isBooked: 0
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    booked: 0,
    available: 0
  });

  // ────────────────────────────────────────────────
  // Data fetching
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const clinicId = localStorage.getItem('clinicID');
        const data = await getEmployeeList(clinicId, {
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

  // Fetch SlotConfigs for calendar display
  useEffect(() => {
    const fetchSlotConfigs = async () => {
      try {
        const clinicId = localStorage.getItem('clinicID');
        const data = await getSlotConfigList(clinicId, {
          Status: 1
        });
        setSlotConfigs(data);
      } catch (err) {
        console.error('Failed to load slot configs:', err);
      }
    };
    fetchSlotConfigs();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = localStorage.getItem('clinicID');
      const doctorId = selectedDoctorId === 'all' ? 0 : Number(selectedDoctorId) || 0;

      const options = {
        DoctorID: doctorId,
      };

      // Add date filter if selected
      if (selectedDate) {
        options.SlotDate = selectedDate;
      }

      // Add booked filter
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
  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getSlotsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return allSlots.filter(slot => slot.slotDate === dateStr);
  };

  const getSlotConfigsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return slotConfigs.filter(config => {
      // Check if slotSpecificDate matches
      if (config.slotSpecificDate === dateStr) return true;
      // Check if slotDate matches
      if (config.slotDate === dateStr) return true;
      return false;
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateClick = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setShowCalendar(false);
  };

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

  // Group slots by date
  const groupedSlots = useMemo(() => {
    const groups = {};
    filteredSlots.forEach(slot => {
      const date = slot.slotDate || 'Unknown';
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(slot);
    });

    // Sort dates
    return Object.keys(groups)
      .sort()
      .reduce((acc, date) => {
        acc[date] = groups[date].sort((a, b) => {
          return (a.slotTime || '').localeCompare(b.slotTime || '');
        });
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

  // ────────────────────────────────────────────────
  // CRUD Handlers
  const handleAddSlot = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const clinicId = localStorage.getItem('clinicID');
      
      await addSlot({
        clinicId: parseInt(clinicId),
        branchId: 0,
        doctorId: parseInt(formData.doctorId),
        slotDate: formData.slotDate,
        slotTime: formData.slotTime + ':00'
      });

      setShowAddModal(false);
      setFormData({ doctorId: '', slotDate: '', slotTime: '' });
      fetchSlots();
    } catch (err) {
      console.error('Add slot error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) {
      return;
    }

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

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
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
      fetchSlots();
    } catch (err) {
      console.error('Update slot error:', err);
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

  // ────────────────────────────────────────────────
  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const clearDateFilter = () => {
    setSelectedDate('');
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="clinic-loading">Loading slots...</div>;

  if (error) return <div className="clinic-error">Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  // Calendar rendering
  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const daySlots = getSlotsForDate(date);
      const dayConfigs = getSlotConfigsForDate(date);
      
      const hasSlots = daySlots.length > 0;
      const hasConfigs = dayConfigs.length > 0;
      const availableSlots = daySlots.filter(s => !s.isBooked).length;

      // Determine day class based on what it has
      let dayClass = 'calendar-day';
      if (hasSlots && hasConfigs) {
        dayClass += ' has-both';
      } else if (hasSlots) {
        dayClass += ' has-slots';
      } else if (hasConfigs) {
        dayClass += ' has-configs';
      }

      days.push(
        <div
          key={day}
          className={dayClass}
          onClick={() => handleDateClick(day)}
        >
          <span className="day-number">{day}</span>
          {(hasSlots || hasConfigs) && (
            <div className="day-indicators">
              {hasConfigs && (
                <div className="config-indicator" title={`${dayConfigs.length} config(s)`}>
                  <span className="config-dot"></span>
                </div>
              )}
              {hasSlots && (
                <div className="slots-indicator" title={`${availableSlots}/${daySlots.length} slots available`}>
                  <span className="slots-count">{availableSlots}/{daySlots.length}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="calendar-modal">
        <div className="calendar-overlay" onClick={() => setShowCalendar(false)}></div>
        <div className="calendar-container">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="calendar-nav-btn">
              <FiChevronLeft size={20} />
            </button>
            <h3>{monthName}</h3>
            <button onClick={handleNextMonth} className="calendar-nav-btn">
              <FiChevronRight size={20} />
            </button>
          </div>
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-color config-color"></span>
              <span>Slot Config</span>
            </div>
            <div className="legend-item">
              <span className="legend-color slot-color"></span>
              <span>Slot Date</span>
            </div>
            <div className="legend-item">
              <span className="legend-color both-color"></span>
              <span>Both</span>
            </div>
          </div>
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {days}
          </div>
          <div className="calendar-footer">
            <button onClick={() => setShowCalendar(false)} className="calendar-close-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────
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
          <div className="stat-icon total">
            <FiCalendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Slots</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon booked">
            <FiCheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.booked}</div>
            <div className="stat-label">Booked</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">
            <FiXCircle size={24} />
          </div>
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
          />
          {selectedDate && (
            <button onClick={clearDateFilter} className="clear-date-btn">
              Clear
            </button>
          )}
          <button onClick={() => setShowCalendar(true)} className="calendar-toggle-btn">
            <FiCalendar size={18} />
            Calendar
          </button>
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
      </div>

      {/* Slots Grouped by Date */}
      <div className="slots-timeline">
        {Object.keys(groupedSlots).length === 0 ? (
          <div className="clinic-no-data">
            {searchTerm ? 'No slots found.' : 'No slots available.'}
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
                {dateSlots.map((slot) => (
                  <div 
                    key={slot.id} 
                    className={`slot-card ${slot.isBooked ? 'booked' : 'available'}`}
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
                      {slot.isBooked ? (
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

                    {/* Hover Actions - Show only on hover */}
                    <div className={`slot-actions ${hoveredSlotId === slot.id ? 'visible' : ''}`}>
                      {/* Update button only for booked slots */}
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
                  </div>
                ))}
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
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
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
              </div>

              <div className="form-group">
                <label>Slot Date *</label>
                <input
                  type="date"
                  value={formData.slotDate}
                  onChange={(e) => setFormData({ ...formData, slotDate: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Slot Time *</label>
                <input
                  type="time"
                  value={formData.slotTime}
                  onChange={(e) => setFormData({ ...formData, slotTime: e.target.value })}
                  required
                  className="form-input"
                />
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
                  value={updateFormData.appointmentId}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, appointmentId: e.target.value })}
                  className="form-input"
                  placeholder="0 for no appointment"
                />
              </div>

              <div className="form-group">
                <label>Booking Status *</label>
                <select
                  value={updateFormData.isBooked}
                  onChange={(e) => setUpdateFormData({ ...updateFormData, isBooked: e.target.value })}
                  required
                  className="form-input"
                >
                  <option value={0}>Available</option>
                  <option value={1}>Booked</option>
                </select>
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

      {/* Calendar Modal */}
      {showCalendar && renderCalendar()}
    </div>
  );
};

export default SlotList;