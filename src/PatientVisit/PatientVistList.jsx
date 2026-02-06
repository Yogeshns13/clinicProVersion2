// src/components/PatientVisitList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiFilter, FiCheckCircle, FiX } from 'react-icons/fi';
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
  
  // Update Modal States
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [visitToUpdate, setVisitToUpdate] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    symptoms: '',
    bpSystolic: '',
    bpDiastolic: '',
    temperature: '',
    weight: ''
  });

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

  // Initialize Visit handlers
  const handleInitializeVisit = (visit) => {
    setVisitToUpdate(visit);
    // Pre-fill existing vitals if available
    setFormData({
      symptoms: visit.symptoms || '',
      bpSystolic: visit.bpSystolic || '',
      bpDiastolic: visit.bpDiastolic || '',
      temperature: visit.temperature || '',
      weight: visit.weight || ''
    });
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setVisitToUpdate(null);
    setFormData({
      symptoms: '',
      bpSystolic: '',
      bpDiastolic: '',
      temperature: '',
      weight: ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
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
        symptoms: formData.symptoms.trim(),
        bpSystolic: Number(formData.bpSystolic) || 0,
        bpDiastolic: Number(formData.bpDiastolic) || 0,
        temperature: Number(formData.temperature) || 0,
        weight: Number(formData.weight) || 0,
        status: 1  // Set status to 1 (Ready to Consult)
      };

      console.log('Updating visit with vitals data:', visitData);

      await updatePatientVisit(visitData);

      // Close modal and refresh list
      closeUpdateModal();
      await fetchVisits();
      
      // Show success message (optional)
      console.log('Visit updated successfully - Status changed to Ready to Consult');
    } catch (err) {
      console.error('Failed to update visit:', err);
      setError({
        message: err.message || 'Failed to update visit'
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
                    <div className="visit-actions-cell">
                      {visit.status === 0 ? (
                        <button 
                          onClick={() => handleInitializeVisit(visit)} 
                          className="visit-initialize-btn"
                          title="Initialize Visit"
                        >
                          <FiCheckCircle size={16} />
                          Initialized
                        </button>
                      ) : (
                        <button 
                          className="visit-ready-btn disabled"
                          disabled
                          title="Visit is Ready to Consult"
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

      {/* Update Visit Modal */}
      {showUpdateModal && visitToUpdate && (
        <div className="update-overlay">
          <div className="update-modal">
            <div className="update-header">
              <div className="update-header-content">
                <FiCheckCircle size={24} className="update-icon" />
                <h3>Initialize Visit - Add Vitals</h3>
              </div>
              <button 
                onClick={closeUpdateModal} 
                className="update-close-btn"
                disabled={updating}
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit}>
              <div className="update-body">
                {/* Visit Info Section */}
                <div className="update-info-section">
                  <h4>Visit Information</h4>
                  <div className="update-info-grid">
                    <div className="info-item">
                      <label>Patient:</label>
                      <span>{visitToUpdate.patientName}</span>
                    </div>
                    <div className="info-item">
                      <label>Doctor:</label>
                      <span>{visitToUpdate.doctorFullName}</span>
                    </div>
                    <div className="info-item">
                      <label>Date:</label>
                      <span>{formatDate(visitToUpdate.visitDate)}</span>
                    </div>
                    <div className="info-item">
                      <label>Time:</label>
                      <span>{formatTime(visitToUpdate.visitTime)}</span>
                    </div>
                    {visitToUpdate.reason && (
                      <div className="info-item full-width">
                        <label>Reason:</label>
                        <span>{visitToUpdate.reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vitals Input Section */}
                <div className="update-form-section">
                  <h4>Patient Vitals</h4>
                  
                  <div className="form-group">
                    <label htmlFor="symptoms">Symptoms</label>
                    <textarea
                      id="symptoms"
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleFormChange}
                      placeholder="Enter patient symptoms..."
                      rows="3"
                      className="form-textarea"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="bpSystolic">
                        BP Systolic <span className="unit-label">(mmHg)</span>
                      </label>
                      <input
                        type="number"
                        id="bpSystolic"
                        name="bpSystolic"
                        value={formData.bpSystolic}
                        onChange={handleFormChange}
                        placeholder="120"
                        min="0"
                        max="300"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="bpDiastolic">
                        BP Diastolic <span className="unit-label">(mmHg)</span>
                      </label>
                      <input
                        type="number"
                        id="bpDiastolic"
                        name="bpDiastolic"
                        value={formData.bpDiastolic}
                        onChange={handleFormChange}
                        placeholder="80"
                        min="0"
                        max="200"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="temperature">
                        Temperature <span className="unit-label">(°F)</span>
                      </label>
                      <input
                        type="number"
                        id="temperature"
                        name="temperature"
                        value={formData.temperature}
                        onChange={handleFormChange}
                        placeholder="98.6"
                        min="0"
                        max="120"
                        step="0.1"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="weight">
                        Weight <span className="unit-label">(kg)</span>
                      </label>
                      <input
                        type="number"
                        id="weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleFormChange}
                        placeholder="70"
                        min="0"
                        max="500"
                        step="0.1"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="update-footer">
                <button 
                  type="button"
                  onClick={closeUpdateModal} 
                  className="update-btn-cancel"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="update-btn-submit"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Submit & Mark Ready'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientVisitList;