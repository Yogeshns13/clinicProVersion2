// src/components/PatientVisitList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiFilter, FiCheckCircle } from 'react-icons/fi';
import { getPatientVisitList, updatePatientVisit } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddPatientVisit from './AddPatientVisit.jsx';
import PatientVisitDetails from './ViewPatientVisit.jsx';
import './PatientVisitList.css';

const PatientVisitList = () => {
  const navigate = useNavigate();

  // Data States
  const [visits, setVisits] = useState([]);
  
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
  
  // Confirmation Modal States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [visitToUpdate, setVisitToUpdate] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Statistics
  const [statistics, setStatistics] = useState({
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

  // Initial load - fetch data for today by default
  useEffect(() => {
    fetchVisits();
  }, []);

  const formatDateForInput = (dateString) => {
    if (!dateString) {
      console.log('formatDateForInput: dateString is empty or null');
      return '';
    }
    
    try {
      // Handle both ISO format and date-only format
      const date = new Date(dateString);
      
      // Check if date is valid
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

  // Handle search button click
  const handleSearch = () => {
    fetchVisits();
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
    fetchVisits();
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
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
  };

  const handleAddSuccess = () => {
    fetchVisits();
  };

  const handleEditFromModal = (visitId) => {
    navigate(`/update-patientvisit/${visitId}`);
  };

  // Ready to Consult handlers
  const handleReadyToConsult = (visit) => {
    setVisitToUpdate(visit);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setVisitToUpdate(null);
  };

  const confirmReadyToConsult = async () => {
    if (!visitToUpdate) return;

    try {
      setUpdating(true);
      setError(null);

      let formattedDate = visitToUpdate.visitDate;
      
      if (formattedDate && !formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        formattedDate = formatDateForInput(formattedDate);
      }

      // Prepare the visit data with all required fields
      const visitData = {
        visitId: visitToUpdate.id,
        appointmentId: visitToUpdate.appointmentId || 0,
        doctorId: visitToUpdate.doctorId || 0,
        visitDate: formattedDate,
        visitTime: visitToUpdate.visitTime,
        reason: visitToUpdate.reason || '',
        symptoms: visitToUpdate.symptoms || '',
        bpSystolic: visitToUpdate.bpSystolic || 0,
        bpDiastolic: visitToUpdate.bpDiastolic || 0,
        temperature: visitToUpdate.temperature || 0,
        weight: visitToUpdate.weight || 0,
        status: 1 
      };

      console.log('Updating visit status to Ready to Consult:', visitData);

      await updatePatientVisit(visitData);

      // Close modal and refresh list
      closeConfirmModal();
      await fetchVisits();
      
      // Show success message (optional)
      console.log('Visit status updated successfully');
    } catch (err) {
      console.error('Failed to update visit status:', err);
      setError({
        message: err.message || 'Failed to update visit status'
      });
    } finally {
      setUpdating(false);
    }
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

  // Get status badge
  const getStatusBadge = (status) => {
    if (status === 1) {
      return <span className="status-badge ready">Ready to Consult</span>;
    }
    return <span className="status-badge initiated">Initiated</span>;
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

        <div className="visit-toolbar-right">
          <button onClick={openAddForm} className="visit-add-btn">
            <FiPlus size={18} />
            Add Visit
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
            placeholder="Search visits by patient name..."
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

      {/* Patient Visits Table */}
      <div className="visit-table-container">
        <table className="visit-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Visit Date & Time</th>
              <th>Reason</th>
              <th>Vitals</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.length === 0 ? (
              <tr>
                <td colSpan={7} className="visit-no-data">
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
                    {getStatusBadge(visit.status)}
                  </td>
                  <td>
                    <div className="visit-actions-cell">
                      {visit.status === 0 ? (
                        <button 
                          onClick={() => handleReadyToConsult(visit)} 
                          className="visit-ready-btn"
                          title="Mark as Ready to Consult"
                        >
                          <FiCheckCircle size={16} />
                          Ready to Consult
                        </button>
                      ) : (
                        <button 
                          className="visit-ready-btn disabled"
                          disabled
                          title="Already marked as Ready to Consult"
                        >
                          <FiCheckCircle size={16} />
                          Ready to Consult
                        </button>
                      )}
                      <button 
                        onClick={() => handleViewDetails(visit)} 
                        className="visit-details-btn"
                      >
                        View
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
        onEdit={handleEditFromModal}
      />

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="confirm-overlay">
          <div className="confirm-modal">
            <div className="confirm-header">
              <FiCheckCircle size={24} className="confirm-icon" />
              <h3>Confirm Status Update</h3>
            </div>
            <div className="confirm-body">
              <p>Are you sure you want to mark this visit as <strong>Ready to Consult</strong>?</p>
              {visitToUpdate && (
                <div className="confirm-details">
                  <p><strong>Patient:</strong> {visitToUpdate.patientName}</p>
                  <p><strong>Doctor:</strong> {visitToUpdate.doctorFullName}</p>
                  <p><strong>Date:</strong> {formatDate(visitToUpdate.visitDate)} at {formatTime(visitToUpdate.visitTime)}</p>
                </div>
              )}
            </div>
            <div className="confirm-footer">
              <button 
                onClick={closeConfirmModal} 
                className="confirm-btn-cancel"
                disabled={updating}
              >
                No, Cancel
              </button>
              <button 
                onClick={confirmReadyToConsult} 
                className="confirm-btn-yes"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientVisitList;