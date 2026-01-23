// src/components/ConsultationList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiUser, FiActivity, FiFilter, FiDownload, FiFileText } from 'react-icons/fi';
import { getPatientVisitList } from '../api/api.js';
import { getConsultationList, addConsultation } from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddConsultation from './AddConsultation.jsx';
import ViewConsultation from './ViewConsultation.jsx';
import './ConsultationList.css';

const ConsultationList = () => {
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'visited'

  // Data States
  const [consultations, setConsultations] = useState([]);
  const [patientVisits, setPatientVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);

  // Search State
  const [searchInput, setSearchInput] = useState('');

  // Date Filters for Patient Visits
  const today = new Date().toISOString().split('T')[0];
  const [visitFromDate, setVisitFromDate] = useState('');
  const [visitToDate, setVisitToDate] = useState('');
  const [visitPatientNameFilter, setVisitPatientNameFilter] = useState('');
  const [visitDoctorNameFilter, setVisitDoctorNameFilter] = useState('');

  // Date Filters for Consultations
  const [consultFromDate, setConsultFromDate] = useState(today);
  const [consultToDate, setConsultToDate] = useState(today);
  const [consultPatientNameFilter, setConsultPatientNameFilter] = useState('');
  const [consultDoctorNameFilter, setConsultDoctorNameFilter] = useState('');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultingVisitId, setConsultingVisitId] = useState(null);

  // Fetch Patient Visits with filters
  const fetchPatientVisits = async () => {
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

      // Apply date filters logic
      if (visitFromDate && visitToDate) {
        // Use date range when both dates are specified
        options.FromVisitDate = visitFromDate;
        options.ToVisitDate = visitToDate;
      } else if (visitFromDate) {
        // Use FromVisitDate as single date
        options.VisitDate = visitFromDate;
      } else {
        // Default to today's visits
        options.VisitDate = today;
      }

      // Apply name filters
      if (visitPatientNameFilter.trim()) {
        options.PatientName = visitPatientNameFilter.trim();
      }
      if (visitDoctorNameFilter.trim()) {
        options.DoctorName = visitDoctorNameFilter.trim();
      }

      console.log('Fetching patient visits with options:', options);

      const data = await getPatientVisitList(clinicId, options);
      
      // Filter: Only show visits where consultationId is 0 (not yet consulted)
      const unconsultedVisits = data.filter(visit => visit.consultationId === 0);
      
      // Sort by visit time
      const sortedData = unconsultedVisits.sort((a, b) => {
        const timeA = a.visitTime || '00:00:00';
        const timeB = b.visitTime || '00:00:00';
        return timeA.localeCompare(timeB);
      });

      setPatientVisits(sortedData);
      setFilteredVisits(sortedData);
    } catch (err) {
      console.error('fetchPatientVisits error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load patient visits' }
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch Consultations with filters
  const fetchConsultations = async () => {
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

      if (consultFromDate) options.FromDate = consultFromDate;
      if (consultToDate) options.ToDate = consultToDate;
      if (consultPatientNameFilter.trim()) options.PatientName = consultPatientNameFilter.trim();
      if (consultDoctorNameFilter.trim()) options.DoctorName = consultDoctorNameFilter.trim();

      const data = await getConsultationList(clinicId, options);
      
      // Sort by date (most recent first)
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dateModified || a.dateCreated);
        const dateB = new Date(b.dateModified || b.dateCreated);
        return dateB - dateA;
      });

      setConsultations(sortedData);
      setFilteredConsultations(sortedData);
    } catch (err) {
      console.error('fetchConsultations error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load consultations' }
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load based on active tab
  useEffect(() => {
    if (activeTab === 'visited') {
      fetchConsultations();
    } else {
      fetchPatientVisits();
    }
  }, [activeTab]);

  // Apply search filter
  const handleSearch = () => {
    const term = searchInput.trim().toLowerCase();

    if (activeTab === 'pending') {
      if (!term) {
        setFilteredVisits(patientVisits);
        return;
      }

      const filtered = patientVisits.filter(
        (visit) =>
          visit.patientName?.toLowerCase().includes(term) ||
          visit.doctorFullName?.toLowerCase().includes(term) ||
          visit.patientFileNo?.toLowerCase().includes(term) ||
          visit.patientMobile?.toLowerCase().includes(term) ||
          visit.reason?.toLowerCase().includes(term) ||
          visit.symptoms?.toLowerCase().includes(term)
      );
      setFilteredVisits(filtered);
    } else {
      if (!term) {
        setFilteredConsultations(consultations);
        return;
      }

      const filtered = consultations.filter(
        (consult) =>
          consult.patientName?.toLowerCase().includes(term) ||
          consult.doctorFullName?.toLowerCase().includes(term) ||
          consult.patientFileNo?.toLowerCase().includes(term) ||
          consult.patientMobile?.toLowerCase().includes(term) ||
          consult.reason?.toLowerCase().includes(term) ||
          consult.symptoms?.toLowerCase().includes(term) ||
          consult.consultationNotes?.toLowerCase().includes(term) ||
          consult.instructions?.toLowerCase().includes(term)
      );
      setFilteredConsultations(filtered);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Apply advanced filters for Patient Visits
  const applyVisitFilters = () => {
    fetchPatientVisits();
  };

  // Apply advanced filters for Consultations
  const applyConsultFilters = () => {
    fetchConsultations();
  };

  // Calculate statistics
  const getStatistics = () => {
    if (activeTab === 'pending') {
      return {
        totalVisits: filteredVisits.length,
        uniquePatients: new Set(filteredVisits.map(v => v.patientId)).size,
        uniqueDoctors: new Set(filteredVisits.map(v => v.doctorId)).size,
        todayVisits: filteredVisits.filter(v => v.visitDate === today).length
      };
    }

    const todayConsultations = filteredConsultations.filter(c => {
      const consultDate = c.dateCreated?.split('T')[0];
      return consultDate === today;
    });

    return {
      todayConsultations: todayConsultations.length,
      totalConsultations: filteredConsultations.length,
      uniquePatients: new Set(filteredConsultations.map(c => c.patientId)).size,
      uniqueDoctors: new Set(filteredConsultations.map(c => c.doctorId)).size,
      withFollowup: filteredConsultations.filter(c => c.nextConsultationDate).length
    };
  };

  const statistics = getStatistics();

  const handleViewDetails = (consultation) => {
    setSelectedConsultation(consultation);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedConsultation(null);
    setIsDetailsModalOpen(false);
  };

  const openAddForm = () => setIsAddFormOpen(true);
  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setConsultingVisitId(null);
  };

  const handleAddSuccess = () => {
    if (activeTab === 'visited') {
      fetchConsultations();
    } else {
      fetchPatientVisits();
    }
    setConsultingVisitId(null);
  };

  const handleUpdateClick = (consultation) => {
    navigate(`/update-consultation/${consultation.id}`);
  };

  const handleConsultClick = (visit) => {
    setConsultingVisitId(visit.id);
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

  const clearAllFilters = () => {
    setSearchInput('');
    
    if (activeTab === 'pending') {
      setVisitFromDate('');
      setVisitToDate('');
      setVisitPatientNameFilter('');
      setVisitDoctorNameFilter('');
      // Reset to today's data
      fetchPatientVisits();
    } else {
      setConsultFromDate(today);
      setConsultToDate('');
      setConsultPatientNameFilter('');
      setConsultDoctorNameFilter('');
      fetchConsultations();
    }
  };

  const exportToCSV = () => {
    if (activeTab === 'pending') {
      const headers = [
        'Patient Name', 'File No', 'Mobile', 'Doctor', 'Visit Date', 'Visit Time',
        'Reason', 'Symptoms', 'BP', 'Temperature', 'Weight'
      ];
      const csvData = filteredVisits.map(visit => [
        visit.patientName,
        visit.patientFileNo,
        visit.patientMobile,
        visit.doctorFullName,
        formatDate(visit.visitDate),
        formatTime(visit.visitTime),
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
      a.download = `patient-visits-${today}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      const headers = [
        'Patient Name', 'File No', 'Doctor', 'Reason', 'Symptoms',
        'BP', 'Temperature', 'Weight', 'Consultation Notes', 'Instructions',
        'Treatment Plan', 'Next Consultation', 'Date Created'
      ];
      const csvData = filteredConsultations.map(consult => [
        consult.patientName,
        consult.patientFileNo,
        consult.doctorFullName,
        consult.reason || '',
        consult.symptoms || '',
        consult.bpReading || '',
        consult.temperature || '',
        consult.weight || '',
        consult.consultationNotes || '',
        consult.instructions || '',
        consult.treatmentPlan || '',
        consult.nextConsultationDate || '',
        consult.dateCreated
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consultations-${today}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="consultation-loading">Loading...</div>;

  if (error) return <div className="consultation-error">Error: {error.message || error}</div>;

  return (
    <div className="consultation-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Consultation Management" />

      {/* Tab Navigation */}
      <div className="consultation-tabs">
        <button
          className={`consultation-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <FiCalendar size={18} />
          Patient Visits
        </button>
        <button
          className={`consultation-tab ${activeTab === 'visited' ? 'active' : ''}`}
          onClick={() => setActiveTab('visited')}
        >
          <FiFileText size={18} />
          Consulted Patients
        </button>
      </div>

      {/* Toolbar */}
      <div className="consultation-toolbar">
        <div className="consultation-toolbar-left">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`consultation-filter-toggle-btn ${showAdvancedFilters ? 'active' : ''}`}
          >
            <FiFilter size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>

          {(visitFromDate || visitToDate || visitPatientNameFilter || visitDoctorNameFilter || 
            consultFromDate !== today || consultToDate || consultPatientNameFilter || consultDoctorNameFilter || 
            searchInput) && (
            <button onClick={clearAllFilters} className="consultation-clear-btn">
              Clear All
            </button>
          )}
        </div>

        <div className="consultation-toolbar-right">
          <button onClick={exportToCSV} className="consultation-export-btn">
            <FiDownload size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Advanced Filters for Patient Visits */}
      {activeTab === 'pending' && showAdvancedFilters && (
        <div className="consultation-advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                value={visitFromDate}
                onChange={(e) => setVisitFromDate(e.target.value)}
                className="filter-input"
                placeholder="Select start date"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                value={visitToDate}
                onChange={(e) => setVisitToDate(e.target.value)}
                className="filter-input"
                placeholder="Select end date"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Patient Name</label>
              <input
                type="text"
                placeholder="Filter by patient..."
                value={visitPatientNameFilter}
                onChange={(e) => setVisitPatientNameFilter(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Doctor Name</label>
              <input
                type="text"
                placeholder="Filter by doctor..."
                value={visitDoctorNameFilter}
                onChange={(e) => setVisitDoctorNameFilter(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group apply-filter-btn-group">
              <button onClick={applyVisitFilters} className="consultation-add-btn">
                <FiSearch size={18} /> Search
              </button>
            </div>
          </div>
          
          <div className="filter-info">
            <small className="text-muted">
              {visitFromDate && visitToDate 
                ? `Showing visits from ${formatDate(visitFromDate)} to ${formatDate(visitToDate)}`
                : visitFromDate 
                ? `Showing visits for ${formatDate(visitFromDate)}`
                : `Showing today's visits (${formatDate(today)})`
              }
            </small>
          </div>
        </div>
      )}

      {/* Advanced Filters for Consultations */}
      {activeTab === 'visited' && showAdvancedFilters && (
        <div className="consultation-advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                value={consultFromDate}
                onChange={(e) => setConsultFromDate(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                value={consultToDate}
                onChange={(e) => setConsultToDate(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Patient Name</label>
              <input
                type="text"
                placeholder="Filter by patient..."
                value={consultPatientNameFilter}
                onChange={(e) => setConsultPatientNameFilter(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Doctor Name</label>
              <input
                type="text"
                placeholder="Filter by doctor..."
                value={consultDoctorNameFilter}
                onChange={(e) => setConsultDoctorNameFilter(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group apply-filter-btn-group">
              <button onClick={applyConsultFilters} className="consultation-add-btn">
                <FiSearch size={18} /> Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Bar */}
      <div className="consultation-search-wrapper">
        <div className="consultation-search-container">
          <input
            type="text"
            placeholder={
              activeTab === 'pending'
                ? 'Search patient visits...'
                : 'Search by patient, doctor, symptoms, notes...'
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="consultation-search-input"
          />
          <button onClick={handleSearch} className="consultation-search-btn">
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      {/* Table - Patient Visits */}
      {activeTab === 'pending' && (
        <div className="consultation-table-container">
          <table className="consultation-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Visit Date & Time</th>
                <th>Reason & Symptoms</th>
                <th>Vitals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="consultation-no-data">
                    No patient visits found.
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => (
                  <tr key={visit.id}>
                    <td>
                      <div className="consultation-name-cell">
                        <div className="consultation-avatar">
                          {visit.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className="consultation-name">{visit.patientName}</div>
                          <div className="consultation-type">
                            {visit.patientFileNo} • {visit.patientMobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="consultation-name">{visit.doctorFullName}</div>
                        <div className="consultation-type">{visit.doctorCode || '—'}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="consultation-name">{formatDate(visit.visitDate)}</div>
                        <div className="consultation-type">{formatTime(visit.visitTime)}</div>
                      </div>
                    </td>
                    <td>
                      <div className="consultation-reason-cell">
                        {visit.reason && (
                          <div className="reason-badge">{visit.reason}</div>
                        )}
                        {visit.symptoms && (
                          <div className="consultation-type">{visit.symptoms}</div>
                        )}
                        {!visit.reason && !visit.symptoms && '—'}
                      </div>
                    </td>
                    <td>
                      <div className="consultation-vitals-cell">
                        {visit.bpReading && (
                          <span className="vital-badge bp">{visit.bpReading}</span>
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
                        {!visit.bpReading &&
                          !visit.temperature &&
                          !visit.weight &&
                          '—'}
                      </div>
                    </td>
                    <td>
                      <div className="consultation-actions-cell">
                        <button
                          onClick={() => handleConsultClick(visit)}
                          className="consultation-add-btn"
                        >
                          <FiPlus size={16} />
                          Consult
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
        <div className="consultation-table-container">
          <table className="consultation-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Reason & Symptoms</th>
                <th>Vitals</th>
                <th>Next Follow-up</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="consultation-no-data">
                    No consultations found.
                  </td>
                </tr>
              ) : (
                filteredConsultations.map((consultation) => (
                  <tr key={consultation.id}>
                    <td>
                      <div className="consultation-name-cell">
                        <div className="consultation-avatar">
                          {consultation.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className="consultation-name">{consultation.patientName}</div>
                          <div className="consultation-type">
                            {consultation.patientFileNo} • {consultation.patientMobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="consultation-name">{consultation.doctorFullName}</div>
                        <div className="consultation-type">{consultation.doctorCode || '—'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="consultation-reason-cell">
                        {consultation.reason && (
                          <div className="reason-badge">{consultation.reason}</div>
                        )}
                        {consultation.symptoms && (
                          <div className="consultation-type">{consultation.symptoms}</div>
                        )}
                        {!consultation.reason && !consultation.symptoms && '—'}
                      </div>
                    </td>
                    <td>
                      <div className="consultation-vitals-cell">
                        {consultation.bpReading && (
                          <span className="vital-badge bp">{consultation.bpReading}</span>
                        )}
                        {consultation.temperature && (
                          <span className="vital-badge temp">
                            {consultation.temperature}°F
                          </span>
                        )}
                        {consultation.weight && (
                          <span className="vital-badge weight">
                            {consultation.weight}kg
                          </span>
                        )}
                        {!consultation.bpReading &&
                          !consultation.temperature &&
                          !consultation.weight &&
                          '—'}
                      </div>
                    </td>
                    <td>
                      {consultation.nextConsultationDate ? (
                        <span className="followup-badge">
                          {formatDate(consultation.nextConsultationDate)}
                        </span>
                      ) : (
                        <span className="consultation-type">No follow-up</span>
                      )}
                    </td>
                    <td>
                      <div className="consultation-type">
                        {formatDate(consultation.dateCreated)}
                      </div>
                    </td>
                    <td>
                      <div className="consultation-actions-cell">
                        <button
                          onClick={() => handleViewDetails(consultation)}
                          className="consultation-details-btn"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleUpdateClick(consultation)}
                          className="consultation-edit-btn"
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

      {/* Modals */}
      <AddConsultation
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
        preSelectedVisitId={consultingVisitId}
      />

      <ViewConsultation
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        consultationId={selectedConsultation?.id}
      />
    </div>
  );
};

export default ConsultationList;