// src/components/PatientVisitList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiUser, FiActivity, FiFilter, FiClock } from 'react-icons/fi';
import { getPatientVisitList, getAppointmentList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddPatientVisit from './AddPatientVisit.jsx';
import PatientVisitDetails from './ViewPatientVisit.jsx';
import './PatientVisitList.css';

const PatientVisitList = () => {
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'visited'

  // Data States
  const [visits, setVisits] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const todayDate = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState(todayDate);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  // Statistics
  const [statistics, setStatistics] = useState({
    todayPending: 0,
    todayVisits: 0,
    totalVisits: 0,
    uniquePatients: 0,
    uniqueDoctors: 0
  });

  // Fetch visits with filters
  const fetchVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId
      };

      // Apply search filter
      if (searchInput.trim()) {
        options.PatientName = searchInput.trim();
      }

      // Date filtering logic
      if (fromDate && toDate) {
        options.FromVisitDate = fromDate;
        options.ToVisitDate = toDate;
      } else if (dateFilter) {
        options.VisitDate = dateFilter;
      }

      const data = await getPatientVisitList(clinicId, options);

      // Sort by date and time (newest first)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.visitDate + ' ' + (a.visitTime || '00:00:00'));
        const dateB = new Date(b.visitDate + ' ' + (b.visitTime || '00:00:00'));
        return dateB - dateA;
      });

      setVisits(sortedData);

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const todayVisits = sortedData.filter(v => v.visitDate === today);
      const uniquePatients = new Set(sortedData.map(v => v.patientId)).size;
      const uniqueDoctors = new Set(sortedData.map(v => v.doctorId)).size;

      setStatistics({
        todayVisits: todayVisits.length,
        totalVisits: sortedData.length,
        uniquePatients,
        uniqueDoctors
      });
    } catch (err) {
      console.error('fetchVisits error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load patient visits' }
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch appointments with filters
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Status: 1 // Only scheduled appointments
      };

      // Apply search filter
      if (searchInput.trim()) {
        options.PatientName = searchInput.trim();
      }

      // Date filtering logic
      if (fromDate && toDate) {
        options.FromDate = fromDate;
        options.ToDate = toDate;
      } else if (dateFilter) {
        options.AppointmentDate = dateFilter;
      }

      const data = await getAppointmentList(clinicId, options);

      // Sort by appointment time (earliest first)
      const sortedData = data.sort((a, b) => {
        const timeA = a.appointmentTime || '00:00:00';
        const timeB = b.appointmentTime || '00:00:00';
        return timeA.localeCompare(timeB);
      });

      setAppointments(sortedData);

      // Calculate statistics
      const uniquePatients = new Set(sortedData.map(a => a.patientId)).size;
      const uniqueDoctors = new Set(sortedData.map(a => a.doctorId)).size;

      setStatistics({
        todayPending: sortedData.length,
        uniquePatients,
        uniqueDoctors
      });
    } catch (err) {
      console.error('fetchAppointments error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load - fetch data for today by default
  useEffect(() => {
    if (activeTab === 'visited') {
      fetchVisits();
    } else {
      fetchAppointments();
    }
  }, [activeTab]); // Only trigger on tab change

  // Handle search button click
  const handleSearch = () => {
    if (activeTab === 'visited') {
      fetchVisits();
    } else {
      fetchAppointments();
    }
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    setFromDate('');
    setToDate('');
  };

  // Handle from date change
  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
    setDateFilter('');
  };

  // Handle to date change
  const handleToDateChange = (e) => {
    setToDate(e.target.value);
    setDateFilter('');
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchInput('');
    setDateFilter(todayDate);
    setFromDate('');
    setToDate('');
    
    // Re-fetch with default filters (today's data)
    if (activeTab === 'visited') {
      fetchVisits();
    } else {
      fetchAppointments();
    }
  };

  // Modal handlers
  const handleViewDetails = (visit) => {
    setSelectedVisit(visit);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedVisit(null);
    setIsDetailsModalOpen(false);
  };

  const openAddForm = () => {
    setSelectedAppointmentId(null);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setSelectedAppointmentId(null);
  };

  const handleAddSuccess = () => {
    // Refresh current tab
    if (activeTab === 'visited') {
      fetchVisits();
    } else {
      fetchAppointments();
    }
    setSelectedAppointmentId(null);
  };

  const handleUpdateClick = (visit) => {
    navigate(`/update-patientvisit/${visit.id}`);
  };

  const handleAddVisitClick = (appointment) => {
    setSelectedAppointmentId(appointment.id);
    setIsAddFormOpen(true);
  };

  // Formatting functions
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="visit-loading">Loading...</div>;

  if (error) return <div className="visit-error">Error: {error.message || error}</div>;

  return (
    <div className="visit-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Patient Visit Management" />

      {/* Tab Navigation */}
      <div className="visit-tabs">
        <button
          className={`visit-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <FiClock size={18} />
          Pending Appointments
        </button>
        <button
          className={`visit-tab ${activeTab === 'visited' ? 'active' : ''}`}
          onClick={() => setActiveTab('visited')}
        >
          <FiActivity size={18} />
          Visited Patients
        </button>
      </div>

      {/* Toolbar */}
      <div className="visit-toolbar">
        <div className="visit-toolbar-left">
          <div className="visit-select-wrapper">
            <FiCalendar className="visit-select-icon" size={20} />
            <input
              type="date"
              value={dateFilter}
              onChange={handleDateFilterChange}
              className="visit-select"
            />
          </div>

          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} 
            className={`visit-filter-toggle-btn ${showAdvancedFilters ? 'active' : ''}`}
          >
            <FiFilter size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>

          {(dateFilter !== todayDate || fromDate || toDate || searchInput) && (
            <button 
              onClick={clearAllFilters} 
              className="visit-clear-btn"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Add Visit Button - Only for Visited Patients tab */}
        <div className="visit-toolbar-right">
          {activeTab === 'visited' && (
            <button onClick={openAddForm} className="visit-add-btn">
              <FiPlus size={18} />
              Add Visit
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="visit-advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                className="filter-input"
              />
            </div>
            <div className="filter-actions">
              <button onClick={clearAllFilters} className="filter-clear-btn">
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="visit-search-wrapper">
        <div className="visit-search-container">
          <input
            type="text"
            placeholder={
              activeTab === 'pending'
                ? 'Search appointments by patient name...'
                : 'Search visits by patient name...'
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="visit-search-input"
          />
          <button onClick={handleSearch} className="visit-search-btn">
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      {/* Table - Pending Appointments */}
      {activeTab === 'pending' && (
        <div className="visit-table-container">
          <table className="visit-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Appointment Date & Time</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="visit-no-data">
                    {searchInput
                      ? 'No appointments found matching your search.'
                      : 'No appointments found for the selected date.'}
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>
                      <div className="visit-name-cell">
                        <div className="visit-avatar">
                          {appt.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className="visit-name">{appt.patientName}</div>
                          <div className="visit-type">
                            {appt.patientFileNo} • {appt.patientMobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="visit-name">{appt.doctorFullName}</div>
                        <div className="visit-type">{appt.doctorCode || '—'}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="visit-name">{formatDate(appt.appointmentDate)}</div>
                        <div className="visit-type">
                          <span className="visit-time-badge">
                            {formatTime(appt.appointmentTime)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="visit-reason-cell">
                        {appt.reason || '—'}
                      </div>
                    </td>
                    <td>
                      <div className="visit-actions-cell">
                        <button
                          onClick={() => handleAddVisitClick(appt)}
                          className="visit-add-btn"
                        >
                          <FiPlus size={16} />
                          Add Visit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table - Visited Patients */}
      {activeTab === 'visited' && (
        <div className="visit-table-container">
          <table className="visit-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Visit Date & Time</th>
                <th>Reason</th>
                <th>Vitals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="visit-no-data">
                    {searchInput ? 'No visits found matching your search.' : 'No patient visits recorded yet.'}
                  </td>
                </tr>
              ) : (
                visits.map((visit) => (
                  <tr key={visit.id}>
                    <td>
                      <div className="visit-name-cell">
                        <div className="visit-avatar">
                          {visit.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className="visit-name">{visit.patientName}</div>
                          <div className="visit-type">
                            {visit.patientFileNo} • {visit.patientMobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="visit-name">{visit.doctorFullName}</div>
                        <div className="visit-type">{visit.doctorCode || '—'}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="visit-name">{formatDate(visit.visitDate)}</div>
                        <div className="visit-type">
                          <span className="visit-time-badge">
                            {formatTime(visit.visitTime)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="visit-reason-cell">
                        {visit.reason || '—'}
                      </div>
                    </td>
                    <td>
                      <div className="visit-vitals-cell">
                        {visit.bpReading && (
                          <span className="vital-badge bp">
                            {visit.bpReading}
                          </span>
                        )}
                        {visit.temperature && (
                          <span className="vital-badge temp">
                            {visit.temperature}°F
                          </span>
                        )}
                        {visit.weight && (
                          <span className="vital-badge weight">
                            {visit.weight}kg
                          </span>
                        )}
                        {!visit.bpReading && !visit.temperature && !visit.weight && '—'}
                      </div>
                    </td>
                    <td>
                      <div className="visit-actions-cell">
                        <button 
                          onClick={() => handleViewDetails(visit)} 
                          className="visit-details-btn"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleUpdateClick(visit)} 
                          className="visit-edit-btn"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Visit Modal */}
      <AddPatientVisit
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
        preSelectedAppointmentId={selectedAppointmentId}
      />

      {/* Visit Details Modal */}
      <PatientVisitDetails
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        visitId={selectedVisit?.id}
      />
    </div>
  );
};

export default PatientVisitList;