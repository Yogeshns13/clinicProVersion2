// src/components/PatientVisitList.jsx
import React, { useState, useEffect, useMemo } from 'react';
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

  // Data & Filter States
  const [visits, setVisits] = useState([]);
  const [allVisits, setAllVisits] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [allPendingAppointments, setAllPendingAppointments] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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

  // Fetch visits
  const fetchVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 50,
        BranchID: branchId
      };

      // Date filtering logic
      if (fromDate && toDate) {
        options.FromVisitDate = fromDate;
        options.ToVisitDate = toDate;
      } else if (dateFilter) {
        options.VisitDate = dateFilter;
      }

      const data = await getPatientVisitList(clinicId, options);

      setVisits(data);
      setAllVisits(data);
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

  // Fetch today's pending appointments
  const fetchPendingAppointments = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        AppointmentDate: todayDate,
        Status: 1 // Only scheduled appointments
      };

      const appointments = await getAppointmentList(clinicId, options);
      
      // Get all today's visits to filter out appointments that already have visits
      const allVisits = await getPatientVisitList(clinicId, { 
        BranchID: branchId,
        VisitDate: todayDate,
        PageSize: 100
      });
      
      const visitedAppointmentIds = new Set(allVisits.map(v => v.appointmentId).filter(id => id > 0));
      const pending = appointments.filter(appt => !visitedAppointmentIds.has(appt.id));
      
      setPendingAppointments(pending);
      setAllPendingAppointments(pending);
    } catch (err) {
      console.error('fetchPendingAppointments error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load based on active tab
  useEffect(() => {
    if (activeTab === 'visited') {
      fetchVisits();
    } else {
      fetchPendingAppointments();
    }
  }, [activeTab, dateFilter, fromDate, toDate]);

  // Filtered and sorted visits
  const filteredVisits = useMemo(() => {
    let filtered = allVisits;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allVisits.filter(
        (visit) =>
          visit.patientName?.toLowerCase().includes(term) ||
          visit.doctorFullName?.toLowerCase().includes(term) ||
          visit.patientFileNo?.toLowerCase().includes(term) ||
          visit.patientMobile?.toLowerCase().includes(term) ||
          visit.reason?.toLowerCase().includes(term) ||
          visit.symptoms?.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.visitDate + ' ' + (a.visitTime || '00:00:00'));
      const dateB = new Date(b.visitDate + ' ' + (b.visitTime || '00:00:00'));
      return dateB - dateA;
    });
  }, [allVisits, searchTerm]);

  // Filtered pending appointments
  const filteredPendingAppointments = useMemo(() => {
    let filtered = allPendingAppointments;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allPendingAppointments.filter(
        (appt) =>
          appt.patientName?.toLowerCase().includes(term) ||
          appt.doctorFullName?.toLowerCase().includes(term) ||
          appt.patientFileNo?.toLowerCase().includes(term) ||
          appt.patientMobile?.toLowerCase().includes(term) ||
          appt.reason?.toLowerCase().includes(term)
      );
    }

    return filtered.sort((a, b) => {
      const timeA = a.appointmentTime || '00:00:00';
      const timeB = b.appointmentTime || '00:00:00';
      return timeA.localeCompare(timeB);
    });
  }, [allPendingAppointments, searchTerm]);

  // Statistics calculations
  const statistics = useMemo(() => {
    if (activeTab === 'pending') {
      return {
        todayPending: allPendingAppointments.length,
        uniquePatients: new Set(allPendingAppointments.map(a => a.patientId)).size,
        uniqueDoctors: new Set(allPendingAppointments.map(a => a.doctorId)).size,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const todayVisits = allVisits.filter(v => v.visitDate === today);
    const uniquePatients = new Set(allVisits.map(v => v.patientId)).size;
    const uniqueDoctors = new Set(allVisits.map(v => v.doctorId)).size;
    
    return {
      todayVisits: todayVisits.length,
      totalVisits: allVisits.length,
      uniquePatients,
      uniqueDoctors
    };
  }, [allVisits, allPendingAppointments, activeTab]);

  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

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
    // Refresh both tabs
    if (activeTab === 'visited') {
      fetchVisits();
    }
    // Always refresh pending appointments when a visit is added
    fetchPendingAppointments();
    setSelectedAppointmentId(null);
  };

  const handleUpdateClick = (visit) => {
    navigate(`/update-patientvisit/${visit.id}`);
  };

  const handleAddVisitClick = (appointment) => {
    setSelectedAppointmentId(appointment.id);
    setIsAddFormOpen(true);
  };

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

  const clearDateFilter = () => {
    setDateFilter(todayDate);
    setFromDate('');
    setToDate('');
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setDateFilter(todayDate);
    setFromDate('');
    setToDate('');
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
          {activeTab === 'visited' && (
            <>
              <div className="visit-select-wrapper">
                <FiCalendar className="visit-select-icon" size={20} />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setFromDate('');
                    setToDate('');
                  }}
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
            </>
          )}

          {(dateFilter !== todayDate || fromDate || toDate || searchTerm) && (
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

      {/* Advanced Filters (only for Visited Patients tab) */}
      {activeTab === 'visited' && showAdvancedFilters && (
        <div className="visit-advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setDateFilter('');
                }}
                className="filter-input"
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setDateFilter('');
                }}
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
                ? 'Search appointments by patient, doctor...'
                : 'Search by patient, doctor, file no, symptoms...'
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

      {/* Statistics Cards */}
      {activeTab === 'pending' ? (
        <div className="visit-stats-grid">
          <div className="visit-stat-card stat-today">
            <div className="stat-icon-wrapper">
              <FiClock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Today's Pending</div>
              <div className="stat-value">{statistics.todayPending}</div>
            </div>
          </div>

          <div className="visit-stat-card stat-patients">
            <div className="stat-icon-wrapper">
              <FiUser size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Unique Patients</div>
              <div className="stat-value">{statistics.uniquePatients}</div>
            </div>
          </div>

          <div className="visit-stat-card stat-doctors">
            <div className="stat-icon-wrapper">
              <FiUser size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Unique Doctors</div>
              <div className="stat-value">{statistics.uniqueDoctors}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="visit-stats-grid">
          <div className="visit-stat-card stat-today">
            <div className="stat-icon-wrapper">
              <FiCalendar size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Today's Visits</div>
              <div className="stat-value">{statistics.todayVisits}</div>
            </div>
          </div>

          <div className="visit-stat-card stat-total">
            <div className="stat-icon-wrapper">
              <FiActivity size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Visits</div>
              <div className="stat-value">{statistics.totalVisits}</div>
            </div>
          </div>

          <div className="visit-stat-card stat-patients">
            <div className="stat-icon-wrapper">
              <FiUser size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Unique Patients</div>
              <div className="stat-value">{statistics.uniquePatients}</div>
            </div>
          </div>

          <div className="visit-stat-card stat-doctors">
            <div className="stat-icon-wrapper">
              <FiUser size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Doctors</div>
              <div className="stat-value">{statistics.uniqueDoctors}</div>
            </div>
          </div>
        </div>
      )}

      {/* Table - Pending Appointments */}
      {activeTab === 'pending' && (
        <div className="visit-table-container">
          <table className="visit-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Appointment Time</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPendingAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="visit-no-data">
                    {searchTerm
                      ? 'No pending appointments found matching your search.'
                      : 'No pending appointments for today.'}
                  </td>
                </tr>
              ) : (
                filteredPendingAppointments.map((appt) => (
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
                      <div className="visit-type">
                        <span className="visit-time-badge">
                          {formatTime(appt.appointmentTime)}
                        </span>
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
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="visit-no-data">
                    {searchTerm ? 'No visits found matching your search.' : 'No patient visits recorded yet.'}
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => (
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