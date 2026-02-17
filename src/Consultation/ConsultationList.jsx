// src/components/ConsultationList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCalendar, FiFilter, FiDownload, FiFileText } from 'react-icons/fi';
import { getPatientVisitList } from '../api/api.js';
import { getConsultationList, addConsultation } from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddConsultation from './AddConsultation.jsx';
import styles from './ConsultationList.module.css';

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
  const [visitFromDate, setVisitFromDate] = useState(today);
  const [visitToDate, setVisitToDate] = useState(today);
  const [visitPatientNameFilter, setVisitPatientNameFilter] = useState('');
  const [visitDoctorNameFilter, setVisitDoctorNameFilter] = useState('');

  // Date Filters for Consultations
  const [consultFromDate, setConsultFromDate] = useState();
  const [consultToDate, setConsultToDate] = useState();
  const [consultPatientNameFilter, setConsultPatientNameFilter] = useState('');
  const [consultDoctorNameFilter, setConsultDoctorNameFilter] = useState('');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
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

      if (visitFromDate && visitToDate) {
        options.FromVisitDate = visitFromDate;
        options.ToVisitDate = visitToDate;
      } else if (visitFromDate) {
        options.VisitDate = visitFromDate;
      } else {
        options.VisitDate = today;
      }

      if (visitPatientNameFilter.trim()) {
        options.PatientName = visitPatientNameFilter.trim();
      }
      if (visitDoctorNameFilter.trim()) {
        options.DoctorName = visitDoctorNameFilter.trim();
      }

      console.log('Fetching patient visits with options:', options);

      const data = await getPatientVisitList(clinicId, options);

      

      const unconsultedVisits = data.filter(visit => 
  visit.consultationId === 0 && 
  visit.status === 1
);

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

  const applyVisitFilters = () => {
    fetchPatientVisits();
  };

  const applyConsultFilters = () => {
    fetchConsultations();
  };

  const handleViewDetails = (consultation) => {
    // Navigate to view-consultation page with consultation ID as param
    navigate(`/view-consultation/${consultation.id}`);
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
      fetchPatientVisits();
    } else {
      setConsultFromDate(today);
      setConsultToDate(today);
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

  if (loading) return <div className={styles.loading}>Loading...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Consultation Management" />

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'pending' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <FiCalendar size={18} />
          Patient Visits
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'visited' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('visited')}
        >
          <FiFileText size={18} />
          Consulted Patients
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`${styles.filterToggleBtn} ${showAdvancedFilters ? styles.filterToggleBtnActive : ''}`}
          >
            <FiFilter size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>

          {(visitFromDate !== today || visitToDate !== today || visitPatientNameFilter || visitDoctorNameFilter ||
            consultFromDate !== today || consultToDate !== today || consultPatientNameFilter || consultDoctorNameFilter ||
            searchInput) && (
            <button onClick={clearAllFilters} className={styles.clearBtn}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters - Patient Visits */}
      {activeTab === 'pending' && showAdvancedFilters && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From Date</label>
              <input
                type="date"
                value={visitFromDate}
                onChange={(e) => setVisitFromDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input
                type="date"
                value={visitToDate}
                onChange={(e) => setVisitToDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Patient Name</label>
              <input
                type="text"
                placeholder="Filter by patient..."
                value={visitPatientNameFilter}
                onChange={(e) => setVisitPatientNameFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Doctor Name</label>
              <input
                type="text"
                placeholder="Filter by doctor..."
                value={visitDoctorNameFilter}
                onChange={(e) => setVisitDoctorNameFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.applyFilterBtnGroup}>
              <button onClick={applyVisitFilters} className={styles.searchBtn}>
                <FiSearch size={18} /> Search
              </button>
            </div>
          </div>
          <div className={styles.filterInfo}>
            <small className={styles.textMuted}>
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

      {/* Advanced Filters - Consultations */}
      {activeTab === 'visited' && showAdvancedFilters && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From Date</label>
              <input
                type="date"
                value={consultFromDate}
                onChange={(e) => setConsultFromDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input
                type="date"
                value={consultToDate}
                onChange={(e) => setConsultToDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Patient Name</label>
              <input
                type="text"
                placeholder="Filter by patient..."
                value={consultPatientNameFilter}
                onChange={(e) => setConsultPatientNameFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Doctor Name</label>
              <input
                type="text"
                placeholder="Filter by doctor..."
                value={consultDoctorNameFilter}
                onChange={(e) => setConsultDoctorNameFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.applyFilterBtnGroup}>
              <button onClick={applyConsultFilters} className={styles.searchBtn}>
                <FiSearch size={18} /> Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Bar */}
      <div className={styles.searchWrapper}>
        <div className={styles.searchContainer}>
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
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchIconBtn}>
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      {/* Table - Patient Visits */}
      {activeTab === 'pending' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
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
                  <td colSpan={6} className={styles.noData}>
                    No patient visits found.
                  </td>
                </tr>
              ) : (
                filteredVisits.map((visit) => (
                  <tr key={visit.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {visit.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{visit.patientName}</div>
                          <div className={styles.subText}>
                            {visit.patientFileNo} • {visit.patientMobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className={styles.name}>{visit.doctorFullName}</div>
                        <div className={styles.subText}>{visit.doctorCode || '—'}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className={styles.name}>{formatDate(visit.visitDate)}</div>
                        <div className={styles.subText}>{formatTime(visit.visitTime)}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.reasonCell}>
                        {visit.reason && (
                          <div className={styles.reasonBadge}>{visit.reason}</div>
                        )}
                        {visit.symptoms && (
                          <div className={styles.subText}>{visit.symptoms}</div>
                        )}
                        {!visit.reason && !visit.symptoms && '—'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.vitalsCell}>
                        {visit.bpReading && (
                          <span className={`${styles.vitalBadge} ${styles.bp}`}>{visit.bpReading}</span>
                        )}
                        {visit.temperature && (
                          <span className={`${styles.vitalBadge} ${styles.temp}`}>
                            {visit.temperature}°F
                          </span>
                        )}
                        {visit.weight && (
                          <span className={`${styles.vitalBadge} ${styles.weight}`}>
                            {visit.weight}kg
                          </span>
                        )}
                        {!visit.bpReading && !visit.temperature && !visit.weight && '—'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleConsultClick(visit)}
                          className={styles.consultBtn}
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

      {/* Table - Consulted Patients (View only — no Edit button) */}
      {activeTab === 'visited' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
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
                  <td colSpan={7} className={styles.noData}>
                    No consultations found.
                  </td>
                </tr>
              ) : (
                filteredConsultations.map((consultation) => (
                  <tr key={consultation.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {consultation.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{consultation.patientName}</div>
                          <div className={styles.subText}>
                            {consultation.patientFileNo} • {consultation.patientMobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className={styles.name}>{consultation.doctorFullName}</div>
                        <div className={styles.subText}>{consultation.doctorCode || '—'}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.reasonCell}>
                        {consultation.reason && (
                          <div className={styles.reasonBadge}>{consultation.reason}</div>
                        )}
                        {consultation.symptoms && (
                          <div className={styles.subText}>{consultation.symptoms}</div>
                        )}
                        {!consultation.reason && !consultation.symptoms && '—'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.vitalsCell}>
                        {consultation.bpReading && (
                          <span className={`${styles.vitalBadge} ${styles.bp}`}>{consultation.bpReading}</span>
                        )}
                        {consultation.temperature && (
                          <span className={`${styles.vitalBadge} ${styles.temp}`}>
                            {consultation.temperature}°F
                          </span>
                        )}
                        {consultation.weight && (
                          <span className={`${styles.vitalBadge} ${styles.weight}`}>
                            {consultation.weight}kg
                          </span>
                        )}
                        {!consultation.bpReading && !consultation.temperature && !consultation.weight && '—'}
                      </div>
                    </td>
                    <td>
                      {consultation.nextConsultationDate ? (
                        <span className={styles.followupBadge}>
                          {formatDate(consultation.nextConsultationDate)}
                        </span>
                      ) : (
                        <span className={styles.subText}>No follow-up</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.subText}>
                        {formatDate(consultation.dateCreated)}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleViewDetails(consultation)}
                          className={styles.viewBtn}
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
      )}

      {/* Modal - Add Consultation */}
      <AddConsultation
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
        preSelectedVisitId={consultingVisitId}
      />
    </div>
  );
};

export default ConsultationList;