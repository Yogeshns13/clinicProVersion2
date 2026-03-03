// src/components/ConsultationList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiPlus, FiCalendar, FiFileText } from 'react-icons/fi';
import { getPatientVisitList } from '../api/api.js';
import { getConsultationList } from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddConsultation from './AddConsultation.jsx';
import styles from './ConsultationList.module.css';

const today = new Date().toISOString().split('T')[0];

const VISIT_SEARCH_TYPES = [
  { value: 'PatientName', label: 'Patient Name' },
  { value: 'DoctorName',  label: 'Doctor Name' },
  { value: 'Reason',      label: 'Reason' },
];

const CONSULT_SEARCH_TYPES = [
  { value: 'PatientName', label: 'Patient Name' },
  { value: 'DoctorName',  label: 'Doctor Name' },
];

const ConsultationList = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('pending');

  const [patientVisits, setPatientVisits]                 = useState([]);
  const [consultations, setConsultations]                 = useState([]);
  const [filteredVisits, setFilteredVisits]               = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);

  const [visitFilterInputs, setVisitFilterInputs] = useState({
    searchType:  'PatientName',
    searchValue: '',
    fromDate:    today,
    toDate:      today,
  });

  const [visitAppliedFilters, setVisitAppliedFilters] = useState({
    searchType:  'PatientName',
    searchValue: '',
    fromDate:    today,
    toDate:      today,
  });

  const [consultFilterInputs, setConsultFilterInputs] = useState({
    searchType:  'PatientName',
    searchValue: '',
    fromDate:    today,
    toDate:      today,
  });

  const [consultAppliedFilters, setConsultAppliedFilters] = useState({
    searchType:  'PatientName',
    searchValue: '',
    fromDate:    today,
    toDate:      today,
  });

  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState(null);
  const [isAddFormOpen, setIsAddFormOpen]         = useState(false);
  const [consultingVisitId, setConsultingVisitId] = useState(null);

  const visitHasActiveFilters =
    visitAppliedFilters.searchValue.trim() !== '' ||
    visitAppliedFilters.fromDate !== today         ||
    visitAppliedFilters.toDate   !== today;

  const consultHasActiveFilters =
    consultAppliedFilters.searchValue.trim() !== '' ||
    consultAppliedFilters.fromDate            !== today ||
    consultAppliedFilters.toDate              !== today;

  const fetchPatientVisits = async (filters = visitAppliedFilters) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const options = { Page: 1, PageSize: 100, BranchID: branchId };

      if (filters.searchValue.trim()) {
        if (filters.searchType === 'PatientName') options.PatientName = filters.searchValue.trim();
        if (filters.searchType === 'DoctorName')  options.DoctorName  = filters.searchValue.trim();
        if (filters.searchType === 'Reason')      options.Reason      = filters.searchValue.trim();
      }

      if (filters.fromDate && filters.toDate) {
        options.FromVisitDate = filters.fromDate;
        options.ToVisitDate   = filters.toDate;
      } else if (filters.fromDate) {
        options.VisitDate = filters.fromDate;
      } else {
        options.VisitDate = today;
      }

      console.log('Fetching patient visits with options:', options);
      const data = await getPatientVisitList(clinicId, options);

      const unconsultedVisits = data.filter(
        visit => visit.consultationId === 0 && visit.status === 1
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

  const fetchConsultations = async (filters = consultAppliedFilters) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const options = { Page: 1, PageSize: 100, BranchID: branchId };

      if (filters.searchValue.trim()) {
        if (filters.searchType === 'PatientName') options.PatientName = filters.searchValue.trim();
        if (filters.searchType === 'DoctorName')  options.DoctorName  = filters.searchValue.trim();
      }

      if (filters.fromDate) options.FromDate = filters.fromDate;
      if (filters.toDate)   options.ToDate   = filters.toDate;

      console.log('Fetching consultations with options:', options);
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

  useEffect(() => {
    if (activeTab === 'visited') {
      fetchConsultations(consultAppliedFilters);
    } else {
      fetchPatientVisits(visitAppliedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleVisitFilterChange = (e) => {
    const { name, value } = e.target;
    setVisitFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleVisitSearch = () => {
    setVisitAppliedFilters({ ...visitFilterInputs });
    fetchPatientVisits(visitFilterInputs);
  };

  const handleVisitClear = () => {
    const empty = { searchType: 'PatientName', searchValue: '', fromDate: today, toDate: today };
    setVisitFilterInputs(empty);
    setVisitAppliedFilters(empty);
    fetchPatientVisits(empty);
  };

  const handleConsultFilterChange = (e) => {
    const { name, value } = e.target;
    setConsultFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleConsultSearch = () => {
    setConsultAppliedFilters({ ...consultFilterInputs });
    fetchConsultations(consultFilterInputs);
  };

  const handleConsultClear = () => {
    const empty = { searchType: 'PatientName', searchValue: '', fromDate: today, toDate: today };
    setConsultFilterInputs(empty);
    setConsultAppliedFilters(empty);
    fetchConsultations(empty);
  };

  const handleViewDetails = (consultation) => {
    navigate(`/view-consultation/${consultation.id}`);
  };

  const openAddForm  = () => setIsAddFormOpen(true);
  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setConsultingVisitId(null);
  };

  const handleAddSuccess = () => {
    if (activeTab === 'visited') {
      fetchConsultations(consultAppliedFilters);
    } else {
      fetchPatientVisits(visitAppliedFilters);
    }
    setConsultingVisitId(null);
  };

  const handleConsultClick = (visit) => {
    setConsultingVisitId(visit.id);
    setIsAddFormOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }
  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Consultation Management" />

      {/* Tab Navigation — UNCHANGED */}
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

      {/* ── Patient Visits Filter Bar ── */}
      {activeTab === 'pending' && (
        <div className={styles.filtersContainer}>
          <div className={styles.filtersGrid}>

            <div className={styles.searchGroup}>
              <select
                name="searchType"
                value={visitFilterInputs.searchType}
                onChange={handleVisitFilterChange}
                className={styles.searchTypeSelect}
              >
                {VISIT_SEARCH_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                name="searchValue"
                placeholder={`Search by ${VISIT_SEARCH_TYPES.find(o => o.value === visitFilterInputs.searchType)?.label || ''}`}
                value={visitFilterInputs.searchValue}
                onChange={handleVisitFilterChange}
                onKeyDown={e => e.key === 'Enter' && handleVisitSearch()}
                className={styles.searchInput}
              />
            </div>

            {/* ── From Date — SalesCartList style ── */}
            <div className={styles.dateWrapper}>
              <input
                type="date"
                name="fromDate"
                value={visitFilterInputs.fromDate}
                onChange={handleVisitFilterChange}
                className={`${styles.filterInput} ${styles.dateInput}`}
              />
            </div>

            {/* ── To Date — SalesCartList style ── */}
            <div className={styles.dateWrapper}>
              <input
                type="date"
                name="toDate"
                value={visitFilterInputs.toDate}
                onChange={handleVisitFilterChange}
                className={`${styles.filterInput} ${styles.dateInput}`}
              />
            </div>

            <div className={styles.filterActions}>
              <button onClick={handleVisitSearch} className={styles.searchButton}>
                <FiSearch size={16} />
                Search
              </button>
              {visitHasActiveFilters && (
                <button onClick={handleVisitClear} className={styles.clearButton}>
                  <FiX size={16} />
                  Clear
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Consulted Patients Filter Bar ── */}
      {activeTab === 'visited' && (
        <div className={styles.filtersContainer}>
          <div className={styles.filtersGrid}>

            <div className={styles.searchGroup}>
              <select
                name="searchType"
                value={consultFilterInputs.searchType}
                onChange={handleConsultFilterChange}
                className={styles.searchTypeSelect}
              >
                {CONSULT_SEARCH_TYPES.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                name="searchValue"
                placeholder={`Search by ${CONSULT_SEARCH_TYPES.find(o => o.value === consultFilterInputs.searchType)?.label || ''}`}
                value={consultFilterInputs.searchValue}
                onChange={handleConsultFilterChange}
                onKeyDown={e => e.key === 'Enter' && handleConsultSearch()}
                className={styles.searchInput}
              />
            </div>

            {/* ── From Date — SalesCartList style ── */}
            <div className={styles.dateWrapper}>
              <input
                type="date"
                name="fromDate"
                value={consultFilterInputs.fromDate}
                onChange={handleConsultFilterChange}
                className={`${styles.filterInput} ${styles.dateInput}`}
              />
            </div>

            {/* ── To Date — SalesCartList style ── */}
            <div className={styles.dateWrapper}>
              <input
                type="date"
                name="toDate"
                value={consultFilterInputs.toDate}
                onChange={handleConsultFilterChange}
                className={`${styles.filterInput} ${styles.dateInput}`}
              />
            </div>

            <div className={styles.filterActions}>
              <button onClick={handleConsultSearch} className={styles.searchButton}>
                <FiSearch size={16} />
                Search
              </button>
              {consultHasActiveFilters && (
                <button onClick={handleConsultClear} className={styles.clearButton}>
                  <FiX size={16} />
                  Clear
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Table - Patient Visits — UNCHANGED */}
      {activeTab === 'pending' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Visit Date &amp; Time</th>
                <th>Reason &amp; Symptoms</th>
                <th>Vitals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisits.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.noData}>
                    {visitHasActiveFilters ? 'No patient visits found.' : 'No patient visits for this date.'}
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
                          <div className={styles.subText}>{visit.patientFileNo} • {visit.patientMobile}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.name}>{visit.doctorFullName}</div>
                      <div className={styles.subText}>{visit.doctorCode || '—'}</div>
                    </td>
                    <td>
                      <div className={styles.name}>{formatDate(visit.visitDate)}</div>
                      <div className={styles.subText}>{formatTime(visit.visitTime)}</div>
                    </td>
                    <td>
                      <div className={styles.reasonCell}>
                        {visit.reason && <div className={styles.reasonBadge}>{visit.reason}</div>}
                        {visit.symptoms && <div className={styles.subText}>{visit.symptoms}</div>}
                        {!visit.reason && !visit.symptoms && '—'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.vitalsCell}>
                        {visit.bpReading  && <span className={`${styles.vitalBadge} ${styles.bp}`}>{visit.bpReading}</span>}
                        {visit.temperature && <span className={`${styles.vitalBadge} ${styles.temp}`}>{visit.temperature}°F</span>}
                        {visit.weight      && <span className={`${styles.vitalBadge} ${styles.weight}`}>{visit.weight}kg</span>}
                        {!visit.bpReading && !visit.temperature && !visit.weight && '—'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button onClick={() => handleConsultClick(visit)} className={styles.consultBtn}>
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

      {/* Table - Consulted Patients — UNCHANGED */}
      {activeTab === 'visited' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Reason &amp; Symptoms</th>
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
                    {consultHasActiveFilters ? 'No consultations found.' : 'No consultations available yet.'}
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
                          <div className={styles.subText}>{consultation.patientFileNo} • {consultation.patientMobile}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.name}>{consultation.doctorFullName}</div>
                      <div className={styles.subText}>{consultation.doctorCode || '—'}</div>
                    </td>
                    <td>
                      <div className={styles.reasonCell}>
                        {consultation.reason && <div className={styles.reasonBadge}>{consultation.reason}</div>}
                        {consultation.symptoms && <div className={styles.subText}>{consultation.symptoms}</div>}
                        {!consultation.reason && !consultation.symptoms && '—'}
                      </div>
                    </td>
                    <td>
                      <div className={styles.vitalsCell}>
                        {consultation.bpReading   && <span className={`${styles.vitalBadge} ${styles.bp}`}>{consultation.bpReading}</span>}
                        {consultation.temperature  && <span className={`${styles.vitalBadge} ${styles.temp}`}>{consultation.temperature}°F</span>}
                        {consultation.weight       && <span className={`${styles.vitalBadge} ${styles.weight}`}>{consultation.weight}kg</span>}
                        {!consultation.bpReading && !consultation.temperature && !consultation.weight && '—'}
                      </div>
                    </td>
                    <td>
                      {consultation.nextConsultationDate ? (
                        <span className={styles.followupBadge}>{formatDate(consultation.nextConsultationDate)}</span>
                      ) : (
                        <span className={styles.subText}>No follow-up</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.subText}>{formatDate(consultation.dateCreated)}</div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button onClick={() => handleViewDetails(consultation)} className={styles.viewBtn}>
                          View Details
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

      {/* Modal - Add Consultation — UNCHANGED */}
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