// src/components/ConsultationList.jsx
import React, { useState, useEffect, useMemo } from 'react';
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

  // Data & Filter States
  const [consultations, setConsultations] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [pendingVisits, setPendingVisits] = useState([]);
  const [allPendingVisits, setAllPendingVisits] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Advanced Filters
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState('');
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [doctorNameFilter, setDoctorNameFilter] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: today,
    toDate: '',
    patientName: '',
    doctorName: ''
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultingVisitId, setConsultingVisitId] = useState(null);

  // Fetch consultations with applied filters
  const fetchConsultations = async () => {
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

      if (appliedFilters.fromDate) options.FromDate = appliedFilters.fromDate;
      if (appliedFilters.toDate) options.ToDate = appliedFilters.toDate;
      if (appliedFilters.patientName.trim()) options.PatientName = appliedFilters.patientName.trim();
      if (appliedFilters.doctorName.trim()) options.DoctorName = appliedFilters.doctorName.trim();

      const data = await getConsultationList(clinicId, options);
      setConsultations(data);
      setAllConsultations(data);
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

  // Fetch today's pending visits
  const fetchPendingVisits = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 50,
        BranchID: branchId,
        VisitDate: today
      };

      const visits = await getPatientVisitList(clinicId, options);
      
      // Get all consultations to filter out visits that already have consultations
      const allConsults = await getConsultationList(clinicId, { 
        BranchID: branchId,
        FromDate: today,
        ToDate: today,
        PageSize: 100 // Get more to ensure we catch all today's consultations
      });
      
      const consultedVisitIds = new Set(allConsults.map(c => c.visitId));
      const pending = visits.filter(v => !consultedVisitIds.has(v.id));
      
      setPendingVisits(pending);
      setAllPendingVisits(pending);
    } catch (err) {
      console.error('fetchPendingVisits error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load based on active tab
  useEffect(() => {
    if (activeTab === 'visited') {
      fetchConsultations();
    } else {
      fetchPendingVisits();
    }
  }, [appliedFilters, activeTab]);

  // Filtered consultations (client-side search)
  const filteredConsultations = useMemo(() => {
    let filtered = allConsultations;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allConsultations.filter(
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
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.dateModified || a.dateCreated);
      const dateB = new Date(b.dateModified || b.dateCreated);
      return dateB - dateA;
    });
  }, [allConsultations, searchTerm]);

  // Filtered pending visits
  const filteredPendingVisits = useMemo(() => {
    let filtered = allPendingVisits;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allPendingVisits.filter(
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
      const timeA = a.visitTime || '00:00:00';
      const timeB = b.visitTime || '00:00:00';
      return timeA.localeCompare(timeB);
    });
  }, [allPendingVisits, searchTerm]);

  // Statistics calculations
  const statistics = useMemo(() => {
    if (activeTab === 'pending') {
      return {
        todayPending: allPendingVisits.length,
        uniquePatients: new Set(allPendingVisits.map(v => v.patientId)).size,
        uniqueDoctors: new Set(allPendingVisits.map(v => v.doctorId)).size,
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todayConsultations = allConsultations.filter(c => {
      const consultDate = c.dateCreated?.split('T')[0];
      return consultDate === todayStr;
    });

    const uniquePatients = new Set(allConsultations.map(c => c.patientId)).size;
    const uniqueDoctors = new Set(allConsultations.map(c => c.doctorId)).size;
    const withFollowup = allConsultations.filter(c => c.nextConsultationDate).length;

    return {
      todayConsultations: todayConsultations.length,
      totalConsultations: allConsultations.length,
      uniquePatients,
      uniqueDoctors,
      withFollowup
    };
  }, [allConsultations, allPendingVisits, activeTab]);

  // Handlers
  const handleSearch = () => setSearchTerm(searchInput.trim());

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const applyFilters = () => {
    setAppliedFilters({
      fromDate,
      toDate,
      patientName: patientNameFilter,
      doctorName: doctorNameFilter
    });
  };

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
    // Refresh both tabs to update the lists
    if (activeTab === 'visited') {
      fetchConsultations();
    }
    // Always refresh pending visits when a consultation is added
    // to remove the consulted patient from the pending list
    fetchPendingVisits();
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
    setSearchTerm('');
    setFromDate(today);
    setToDate('');
    setPatientNameFilter('');
    setDoctorNameFilter('');
    setAppliedFilters({
      fromDate: today,
      toDate: '',
      patientName: '',
      doctorName: ''
    });
  };

  const exportToCSV = () => {
    if (activeTab === 'pending') {
      const headers = [
        'Patient Name', 'File No', 'Mobile', 'Doctor', 'Visit Time',
        'Reason', 'Symptoms', 'BP', 'Temperature', 'Weight'
      ];
      const csvData = filteredPendingVisits.map(visit => [
        visit.patientName,
        visit.patientFileNo,
        visit.patientMobile,
        visit.doctorFullName,
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
      a.download = `pending-visits-${today}.csv`;
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
          Pending Visits
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
          {activeTab === 'visited' && (
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`consultation-filter-toggle-btn ${showAdvancedFilters ? 'active' : ''}`}
            >
              <FiFilter size={18} />
              {showAdvancedFilters ? 'Hide' : 'Show'} Filters
            </button>
          )}

          {(appliedFilters.fromDate !== today ||
            appliedFilters.toDate ||
            appliedFilters.patientName ||
            appliedFilters.doctorName ||
            searchTerm) && (
            <button onClick={clearAllFilters} className="consultation-clear-btn">
              Clear All
            </button>
          )}
        </div>

        {/* No buttons on the right for either tab */}
        <div className="consultation-toolbar-right">
        </div>
      </div>

      {/* Advanced Filters (only for Visited Patients tab) */}
      {activeTab === 'visited' && showAdvancedFilters && (
        <div className="consultation-advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Patient Name</label>
              <input
                type="text"
                placeholder="Filter by patient..."
                value={patientNameFilter}
                onChange={(e) => setPatientNameFilter(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Doctor Name</label>
              <input
                type="text"
                placeholder="Filter by doctor..."
                value={doctorNameFilter}
                onChange={(e) => setDoctorNameFilter(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group apply-filter-btn-group">
              <button onClick={applyFilters} className="consultation-add-btn">
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
                ? 'Search pending visits...'
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

      {/* Statistics Cards */}
      {activeTab === 'pending' ? (
        <div className="consultation-stats-grid">
          <div className="consultation-stat-card stat-today">
            <div className="stat-icon-wrapper">
              <FiCalendar size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Today's Pending Visits</div>
              <div className="stat-value">{statistics.todayPending}</div>
            </div>
          </div>

          <div className="consultation-stat-card stat-patients">
            <div className="stat-icon-wrapper">
              <FiUser size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Unique Patients</div>
              <div className="stat-value">{statistics.uniquePatients}</div>
            </div>
          </div>

          <div className="consultation-stat-card stat-total">
            <div className="stat-icon-wrapper">
              <FiActivity size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Unique Doctors</div>
              <div className="stat-value">{statistics.uniqueDoctors}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="consultation-stats-grid">
          <div className="consultation-stat-card stat-today">
            <div className="stat-icon-wrapper">
              <FiCalendar size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Today's Consultations</div>
              <div className="stat-value">{statistics.todayConsultations}</div>
            </div>
          </div>

          <div className="consultation-stat-card stat-total">
            <div className="stat-icon-wrapper">
              <FiActivity size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Consultations</div>
              <div className="stat-value">{statistics.totalConsultations}</div>
            </div>
          </div>

          <div className="consultation-stat-card stat-patients">
            <div className="stat-icon-wrapper">
              <FiUser size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Unique Patients</div>
              <div className="stat-value">{statistics.uniquePatients}</div>
            </div>
          </div>

          <div className="consultation-stat-card stat-followup">
            <div className="stat-icon-wrapper">
              <FiCalendar size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">With Follow-up</div>
              <div className="stat-value">{statistics.withFollowup}</div>
            </div>
          </div>
        </div>
      )}

      {/* Table - Pending Visits */}
      {activeTab === 'pending' && (
        <div className="consultation-table-container">
          <table className="consultation-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Visit Time</th>
                <th>Reason & Symptoms</th>
                <th>Vitals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPendingVisits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="consultation-no-data">
                    {searchTerm
                      ? 'No pending visits found matching your search.'
                      : 'No pending visits for today.'}
                  </td>
                </tr>
              ) : (
                filteredPendingVisits.map((visit) => (
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
                      <div className="consultation-type">{formatTime(visit.visitTime)}</div>
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
                          Consultation
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
                    {searchTerm || appliedFilters.patientName || appliedFilters.doctorName
                      ? 'No consultations found matching your filters.'
                      : 'No consultations recorded yet.'}
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