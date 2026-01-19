// src/components/PatientVisitList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiUser, FiActivity, FiFilter, FiDownload } from 'react-icons/fi';
import { getPatientVisitList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddPatientVisit from './AddPatientVisit.jsx';
import PatientVisitDetails from './ViewPatientVisit.jsx';
import './PatientVisitList.css';

const PatientVisitList = () => {
  const navigate = useNavigate();

  // Data & Filter States
  const [visits, setVisits] = useState([]);
  const [allVisits, setAllVisits] = useState([]);
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

  // Fetch visits
  const fetchVisits = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 20,
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

  useEffect(() => {
    fetchVisits();
  }, [dateFilter, fromDate, toDate]);

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

    // Sort by date and time in descending order (most recent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.visitDate + ' ' + (a.visitTime || '00:00:00'));
      const dateB = new Date(b.visitDate + ' ' + (b.visitTime || '00:00:00'));
      return dateB - dateA;
    });
  }, [allVisits, searchTerm]);

  // Statistics calculations
  const statistics = useMemo(() => {
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
  }, [allVisits]);

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

  const openAddForm = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchVisits();
  };

  const handleUpdateClick = (visit) => {
    navigate(`/update-patientvisit/${visit.id}`);
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

  const exportToCSV = () => {
    const headers = ['Patient Name', 'File No', 'Doctor', 'Visit Date', 'Visit Time', 'Reason', 'Symptoms', 'BP', 'Temperature', 'Weight'];
    const csvData = filteredVisits.map(visit => [
      visit.patientName,
      visit.patientFileNo,
      visit.doctorFullName,
      visit.visitDate,
      visit.visitTime,
      visit.reason || '',
      visit.symptoms || '',
      visit.bpReading || '',
      visit.temperature || '',
      visit.weight || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-visits-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="visit-loading">Loading patient visits...</div>;

  if (error) return <div className="visit-error">Error: {error.message || error}</div>;

  return (
    <div className="visit-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Patient Visit Management" />

      {/* Toolbar */}
      <div className="visit-toolbar">
        <div className="visit-toolbar-left">
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

          {(dateFilter !== todayDate || fromDate || toDate) && (
            <button 
              onClick={clearDateFilter} 
              className="visit-clear-btn"
            >
              Clear Dates
            </button>
          )}
        </div>

        <div className="visit-toolbar-right">
          <button onClick={exportToCSV} className="visit-export-btn">
            <FiDownload size={18} />
            Export
          </button>
          <button onClick={openAddForm} className="visit-add-btn">
            <FiPlus size={20} />
            New Visit
          </button>
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
            placeholder="Search by patient, doctor, file no, symptoms..."
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

      {/* Table */}
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

      {/* Add Visit Modal */}
      <AddPatientVisit
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
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