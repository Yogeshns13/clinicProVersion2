// src/components/SlotList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiCalendar, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getSlotList, getEmployeeList, deleteSlot } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './SlotConfigList.css';

const SlotList = () => {
  // Data & Filter
  const [slots, setSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [bookedFilter, setBookedFilter] = useState('all'); // 'all', 'booked', 'available'
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    return timeStr.substring(0, 5); // HH:MM
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
  return (
    <div className="clinic-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Appointment Slots" />

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
                <FiCalendar size={20} />
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
                  >
                    <div className="slot-time">
                      <FiClock size={16} />
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
                          <FiCheckCircle size={16} className="status-icon booked" />
                          <span className="status-text booked">Booked</span>
                        </>
                      ) : (
                        <>
                          <FiXCircle size={16} className="status-icon available" />
                          <span className="status-text available">Available</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SlotList;