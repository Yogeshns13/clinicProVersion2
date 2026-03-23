// src/components/ConsultationList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiFileText } from 'react-icons/fi';
import { getConsultationList } from '../Api/ApiConsultation.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import AddConsultation from './AddConsultation.jsx';
import styles from './ConsultationList.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

const today = new Date().toISOString().split('T')[0];

const CONSULT_SEARCH_TYPES = [
  { value: 'PatientName', label: 'Patient Name' },
  { value: 'DoctorName',  label: 'Doctor Name' },
];

const ConsultationList = () => {
  const navigate = useNavigate();

  const [consultations, setConsultations]                 = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);

  // ── Pagination ──
  const [consultPage, setConsultPage] = useState(1);
  const pageSize = 20;

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

  const consultHasActiveFilters =
    consultAppliedFilters.searchValue.trim() !== '' ||
    consultAppliedFilters.fromDate            !== today ||
    consultAppliedFilters.toDate              !== today;

  const fetchConsultations = async (filters = consultAppliedFilters, currentPage = consultPage) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const options = { Page: currentPage, PageSize: pageSize, BranchID: branchId };

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
    fetchConsultations(consultAppliedFilters, consultPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh list whenever this page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchConsultations(consultAppliedFilters, consultPage);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultAppliedFilters]);

  // ── Pagination handler ──
  const handleConsultPageChange = (newPage) => {
    if (newPage < 1) return;
    setConsultPage(newPage);
    fetchConsultations(consultAppliedFilters, newPage);
  };

  const handleConsultFilterChange = (e) => {
    const { name, value } = e.target;
    setConsultFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleConsultSearch = () => {
    setConsultPage(1);
    setConsultAppliedFilters({ ...consultFilterInputs });
    fetchConsultations(consultFilterInputs, 1);
  };

  const handleConsultClear = () => {
    const empty = { searchType: 'PatientName', searchValue: '', fromDate: today, toDate: today };
    setConsultPage(1);
    setConsultFilterInputs(empty);
    setConsultAppliedFilters(empty);
    fetchConsultations(empty, 1);
  };

  const handleViewDetails = (consultation) => {
    navigate(`/view-consultation/${consultation.id}`);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    fetchConsultations(consultAppliedFilters, consultPage);
  };

  const handleAddSuccess = () => {
    fetchConsultations(consultAppliedFilters, consultPage);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }
  if (loading) return <div className={styles.loading}><LoadingPage/></div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  // ── Pagination computed values ──
  const consultStart = filteredConsultations.length === 0 ? 0 : (consultPage - 1) * pageSize + 1;
  const consultEnd   = (consultPage - 1) * pageSize + filteredConsultations.length;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Consultation Management" />

      {/* ── Consulted Patients Filter Bar ── */}
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

          <div className={styles.dateWrapper}>
            <input
              type="date"
              name="fromDate"
              value={consultFilterInputs.fromDate}
              onChange={handleConsultFilterChange}
              className={`${styles.filterInput} ${styles.dateInput}`}
            />
          </div>

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

      {/* ── Table + Pagination wrapper ── */}
      <div className={styles.tableSection}>

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
                        <button
                          onClick={() => handleViewDetails(consultation)}
                          className={styles.viewBtn}
                        >
                          Edit Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Bar ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {filteredConsultations.length > 0
              ? `Showing ${consultStart}–${consultEnd} records`
              : 'No records'}
          </div>

          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>

            <button
              className={styles.pageBtn}
              onClick={() => handleConsultPageChange(1)}
              disabled={consultPage === 1}
              title="First page"
            >
              «
            </button>

            <button
              className={styles.pageBtn}
              onClick={() => handleConsultPageChange(consultPage - 1)}
              disabled={consultPage === 1}
              title="Previous page"
            >
              ‹
            </button>

            <span className={styles.pageIndicator}>{consultPage}</span>

            <button
              className={styles.pageBtn}
              onClick={() => handleConsultPageChange(consultPage + 1)}
              disabled={filteredConsultations.length < pageSize}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{pageSize}</strong>
          </div>
        </div>

      </div>

      {/* Modal - Add Consultation */}
      <AddConsultation
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
        preSelectedVisitId={null}
      />
    </div>
  );
};

export default ConsultationList;