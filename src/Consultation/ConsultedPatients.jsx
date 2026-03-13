// src/components/ConsultedPatients.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { getConsultationList } from '../Api/ApiConsultation.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ConsultedPatients.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const today = new Date().toISOString().split('T')[0];

const CONSULT_SEARCH_TYPES = [
  { value: 'PatientName', label: 'Patient Name' },
  { value: 'DoctorName',  label: 'Doctor Name' },
];

const ConsultedPatients = () => {
  const navigate = useNavigate();

  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);

  const [filterInputs, setFilterInputs] = useState({
    searchType:  'PatientName',
    searchValue: '',
    fromDate:    today,
    toDate:      today,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'PatientName',
    searchValue: '',
    fromDate:    today,
    toDate:      today,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.fromDate !== today ||
    appliedFilters.toDate !== today;

  const fetchConsultations = async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
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
        return dateB - dateA; // newest first
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
    fetchConsultations(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
    fetchConsultations(filterInputs);
  };

  const handleClear = () => {
    const empty = { searchType: 'PatientName', searchValue: '', fromDate: today, toDate: today };
    setFilterInputs(empty);
    setAppliedFilters(empty);
    fetchConsultations(empty);
  };

  const handleViewDetails = (consultation) => {
    navigate(`/view-consultation/${consultation.id}`);
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
  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Consulted Patients" />

      {/* Filter Bar */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              {CONSULT_SEARCH_TYPES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${CONSULT_SEARCH_TYPES.find(o => o.value === filterInputs.searchType)?.label || ''}`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.dateWrapper}>
            <input
              type="date"
              name="fromDate"
              value={filterInputs.fromDate}
              onChange={handleFilterChange}
              className={`${styles.filterInput} ${styles.dateInput}`}
            />
          </div>

          <div className={styles.dateWrapper}>
            <input
              type="date"
              name="toDate"
              value={filterInputs.toDate}
              onChange={handleFilterChange}
              className={`${styles.filterInput} ${styles.dateInput}`}
            />
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={16} />
              Search
            </button>
            {hasActiveFilters && (
              <button onClick={handleClear} className={styles.clearButton}>
                <FiX size={16} />
                Clear
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Table - Consulted Patients */}
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
                  {hasActiveFilters ? 'No consultations found.' : 'No consultations available yet.'}
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
    </div>
  );
};

export default ConsultedPatients;