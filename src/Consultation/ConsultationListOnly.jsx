// src/components/ConsultationList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiDownload, FiFileText } from 'react-icons/fi';
import { getConsultationList } from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddConsultation from './AddConsultation.jsx';
import styles from './ConsultationList.module.css';

const ConsultationList = () => {
  const navigate = useNavigate();

  // Data States
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);

  // Search & Filter States
  const [searchInput, setSearchInput] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [doctorNameFilter, setDoctorNameFilter] = useState('');

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Fetch Consultations
  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
      };

      if (fromDate) options.FromDate = fromDate;
      if (toDate) options.ToDate = toDate;
      if (patientNameFilter.trim()) options.PatientName = patientNameFilter.trim();
      if (doctorNameFilter.trim()) options.DoctorName = doctorNameFilter.trim();

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

  // Initial load + refetch when filters change (you can also add a manual button)
  useEffect(() => {
    fetchConsultations();
  }, []); // ← you can keep auto-fetch on mount only, or add dependencies

  // Quick search
  const handleSearch = () => {
    const term = searchInput.trim().toLowerCase();
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
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const applyFilters = () => {
    fetchConsultations();
  };

  const handleViewDetails = (consultation) => {
    navigate(`/view-consultation/${consultation.id}`);
  };

  const openAddForm = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchConsultations();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setFromDate(today);
    setToDate(today);
    setPatientNameFilter('');
    setDoctorNameFilter('');
    fetchConsultations();
  };

  const exportToCSV = () => {
    const headers = [
      'Patient Name',
      'File No',
      'Doctor',
      'Reason',
      'Symptoms',
      'BP',
      'Temperature',
      'Weight',
      'Consultation Notes',
      'Instructions',
      'Treatment Plan',
      'Next Consultation',
      'Date Created',
    ];

    const csvData = filteredConsultations.map((consult) => [
      consult.patientName || '',
      consult.patientFileNo || '',
      consult.doctorFullName || '',
      consult.reason || '',
      consult.symptoms || '',
      consult.bpReading || '',
      consult.temperature || '',
      consult.weight || '',
      consult.consultationNotes || '',
      consult.instructions || '',
      consult.treatmentPlan || '',
      consult.nextConsultationDate || '',
      consult.dateCreated || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultations-${today}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Consultation Management" />

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

          {(fromDate !== today || toDate !== today || patientNameFilter || doctorNameFilter || searchInput) && (
            <button onClick={clearAllFilters} className={styles.clearBtn}>
              Clear All
            </button>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <button onClick={openAddForm} className={styles.addBtn}>
            <FiFileText size={18} /> New Consultation
          </button>
          <button onClick={exportToCSV} className={styles.exportBtn}>
            <FiDownload size={18} /> Export CSV
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Patient Name</label>
              <input
                type="text"
                placeholder="Filter by patient..."
                value={patientNameFilter}
                onChange={(e) => setPatientNameFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Doctor Name</label>
              <input
                type="text"
                placeholder="Filter by doctor..."
                value={doctorNameFilter}
                onChange={(e) => setDoctorNameFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>
            <div className={styles.applyFilterBtnGroup}>
              <button onClick={applyFilters} className={styles.searchBtn}>
                <FiSearch size={18} /> Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Search */}
      <div className={styles.searchWrapper}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by patient, doctor, symptoms, notes..."
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

      {/* Consultations Table */}
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
              filteredConsultations.map((consult) => (
                <tr key={consult.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {consult.patientName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className={styles.name}>{consult.patientName}</div>
                        <div className={styles.subText}>
                          {consult.patientFileNo} • {consult.patientMobile}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className={styles.name}>{consult.doctorFullName}</div>
                      <div className={styles.subText}>{consult.doctorCode || '—'}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.reasonCell}>
                      {consult.reason && <div className={styles.reasonBadge}>{consult.reason}</div>}
                      {consult.symptoms && <div className={styles.subText}>{consult.symptoms}</div>}
                      {!consult.reason && !consult.symptoms && '—'}
                    </div>
                  </td>
                  <td>
                    <div className={styles.vitalsCell}>
                      {consult.bpReading && (
                        <span className={`${styles.vitalBadge} ${styles.bp}`}>{consult.bpReading}</span>
                      )}
                      {consult.temperature && (
                        <span className={`${styles.vitalBadge} ${styles.temp}`}>
                          {consult.temperature}°F
                        </span>
                      )}
                      {consult.weight && (
                        <span className={`${styles.vitalBadge} ${styles.weight}`}>
                          {consult.weight}kg
                        </span>
                      )}
                      {!consult.bpReading && !consult.temperature && !consult.weight && '—'}
                    </div>
                  </td>
                  <td>
                    {consult.nextConsultationDate ? (
                      <span className={styles.followupBadge}>
                        {formatDate(consult.nextConsultationDate)}
                      </span>
                    ) : (
                      <span className={styles.subText}>No follow-up</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.subText}>{formatDate(consult.dateCreated)}</div>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button onClick={() => handleViewDetails(consult)} className={styles.viewBtn}>
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

      {/* Add Consultation Modal */}
      <AddConsultation
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
        // preSelectedVisitId={null}   ← removed since no visits anymore
      />
    </div>
  );
};

export default ConsultationList;