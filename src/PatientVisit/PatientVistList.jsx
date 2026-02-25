// src/components/PatientVisitList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCheckCircle, FiX } from 'react-icons/fi';
import { getPatientVisitList, updatePatientVisit } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddPatientVisit from './AddPatientVisit.jsx';
import PatientVisitDetails from './ViewPatientVisit.jsx';
import styles from './PatientVisitList.module.css';

// ──────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 0, label: 'Initiated' },
  { id: 1, label: 'Ready to Consult' },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'PatientName', label: 'Patient Name' },
  { value: 'DoctorName',  label: 'Doctor Name' },
];

const todayDate = new Date().toISOString().split('T')[0];

// ──────────────────────────────────────────────────
const PatientVisitList = () => {
  const navigate = useNavigate();

  // Data
  const [visits, setVisits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Filter inputs (staged — not applied until Search is clicked)
  const [filterInputs, setFilterInputs] = useState({
    searchType:  'PatientName',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
    visitDate:   todayDate,
  });

  // Applied filters (drive the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'PatientName',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
    visitDate:   todayDate,
  });

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Details Modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit]           = useState(null);

  // Update Modal
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [visitToUpdate, setVisitToUpdate]     = useState(null);
  const [updating, setUpdating]               = useState(false);
  const [formData, setFormData] = useState({
    symptoms:    '',
    bpSystolic:  '',
    bpDiastolic: '',
    temperature: '',
    weight:      '',
  });

  // ──────────────────────────────────────────────────
  // Derived: are any filters active beyond the default today date?
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.status             !== '' ||
    appliedFilters.dateFrom           !== '' ||
    appliedFilters.dateTo             !== '' ||
    appliedFilters.visitDate          !== todayDate;

  // ──────────────────────────────────────────────────
  // Data fetching
  const fetchVisits = async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page:     1,
        PageSize: 100,
        BranchID: branchId,
        Status:   filters.status !== '' ? Number(filters.status) : undefined,
        PatientName: filters.searchType === 'PatientName' ? filters.searchValue : '',
        DoctorName:  filters.searchType === 'DoctorName'  ? filters.searchValue : '',
      };

      // Date logic: if range provided use range, else use single visitDate
      if (filters.dateFrom && filters.dateTo) {
        options.FromVisitDate = filters.dateFrom;
        options.ToVisitDate   = filters.dateTo;
        options.VisitDate     = '';
      } else {
        options.VisitDate     = filters.visitDate || '';
        options.FromVisitDate = '';
        options.ToVisitDate   = '';
      }

      const data = await getPatientVisitList(clinicId, options);

      // Sort newest first
      const sorted = data.sort((a, b) => {
        const da = new Date((a.visitDate || '') + ' ' + (a.visitTime || '00:00:00'));
        const db = new Date((b.visitDate || '') + ' ' + (b.visitTime || '00:00:00'));
        return db - da;
      });

      setVisits(sorted);
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
    fetchVisits(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  // ──────────────────────────────────────────────────
  // Helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return '';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 0) return 'Initiated';
    if (status === 1) return 'Ready to Consult';
    return 'Unknown';
  };

  const getStatusClass = (status) => {
    if (status === 0) return styles.initiated;
    if (status === 1) return styles.ready;
    return styles.initiated;
  };

  // ──────────────────────────────────────────────────
  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => {
      const updated = { ...prev, [name]: value };
      // If single date changes, clear range and vice versa
      if (name === 'visitDate') {
        updated.dateFrom = '';
        updated.dateTo   = '';
      }
      if (name === 'dateFrom' || name === 'dateTo') {
        updated.visitDate = '';
      }
      return updated;
    });
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const defaults = {
      searchType:  'PatientName',
      searchValue: '',
      status:      '',
      dateFrom:    '',
      dateTo:      '',
      visitDate:   todayDate,
    };
    setFilterInputs(defaults);
    setAppliedFilters(defaults);
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

  const openAddForm  = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => fetchVisits(appliedFilters);

  const handleEditFromModal = (visitId) => navigate(`/update-patientvisit/${visitId}`);

  // Initialize Visit handlers
  const handleInitializeVisit = (visit) => {
    setVisitToUpdate(visit);
    setFormData({
      symptoms:    visit.symptoms    || '',
      bpSystolic:  visit.bpSystolic  || '',
      bpDiastolic: visit.bpDiastolic || '',
      temperature: visit.temperature || '',
      weight:      visit.weight      || '',
    });
    setShowUpdateModal(true);
  };

  const closeUpdateModal = () => {
    setShowUpdateModal(false);
    setVisitToUpdate(null);
    setFormData({ symptoms: '', bpSystolic: '', bpDiastolic: '', temperature: '', weight: '' });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

      const visitData = {
        visitId:       visitToUpdate.id,
        appointmentId: visitToUpdate.appointmentId || 0,
        doctorId:      visitToUpdate.doctorId       || 0,
        visitDate:     formattedDate,
        visitTime:     visitToUpdate.visitTime,
        reason:        visitToUpdate.reason         || '',
        symptoms:      formData.symptoms.trim(),
        bpSystolic:    Number(formData.bpSystolic)  || 0,
        bpDiastolic:   Number(formData.bpDiastolic) || 0,
        temperature:   Number(formData.temperature) || 0,
        weight:        Number(formData.weight)       || 0,
        status:        1,
      };

      await updatePatientVisit(visitData);
      closeUpdateModal();
      await fetchVisits(appliedFilters);
    } catch (err) {
      console.error('Failed to update visit:', err);
      setError({ message: err.message || 'Failed to update visit' });
    } finally {
      setUpdating(false);
    }
  };

  // ──────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading visits...</div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  // ──────────────────────────────────────────────────
  return (
    <div className={styles.listWrapper}>
      <Header title="Patient Visit Management" />

      {/* ── Filter Bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          {/* Search type + value */}
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              {SEARCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                SEARCH_TYPE_OPTIONS.find((o) => o.value === filterInputs.searchType)?.label || ''
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          {/* Status */}
          <div className={styles.filterGroup}>
            <select
              name="status"
              value={filterInputs.status}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>


          {/* From Date */}
          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateFrom && (
                <span className={styles.datePlaceholder}>From Date</span>
              )}
              <input
                type="date"
                name="dateFrom"
                value={filterInputs.dateFrom}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateFrom ? styles.dateEmpty : ''}`}
              />
            </div>
          </div>

          {/* To Date */}
          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateTo && (
                <span className={styles.datePlaceholder}>To Date</span>
              )}
              <input
                type="date"
                name="dateTo"
                value={filterInputs.dateTo}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateTo ? styles.dateEmpty : ''}`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={16} />
                Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.addBtn}>
              <FiPlus size={18} />
              Add Visit
            </button>
          </div>

        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Visit Date &amp; Time</th>
              <th>Vitals</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.noData}>
                  {hasActiveFilters ? 'No visits found.' : 'No patient visits recorded yet.'}
                </td>
              </tr>
            ) : (
              visits.map((visit) => (
                <tr key={visit.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {visit.patientName?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className={styles.name}>{visit.patientName}</div>
                        <div className={styles.subInfo}>
                          {visit.patientFileNo} • {visit.patientMobile}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className={styles.name}>{visit.doctorFullName}</div>
                      <div className={styles.subInfo}>{visit.doctorCode || '—'}</div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className={styles.name}>{formatDate(visit.visitDate)}</div>
                      <div className={styles.subInfo}>
                        <span className={styles.timeBadge}>{formatTime(visit.visitTime)}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.vitalsCell}>
                      {visit.bpReading && (
                        <span className={`${styles.vitalBadge} ${styles.bp}`}>{visit.bpReading}</span>
                      )}
                      {visit.temperature && (
                        <span className={`${styles.vitalBadge} ${styles.temp}`}>{visit.temperature}°F</span>
                      )}
                      {visit.weight && (
                        <span className={`${styles.vitalBadge} ${styles.weight}`}>{visit.weight}kg</span>
                      )}
                      {!visit.bpReading && !visit.temperature && !visit.weight && '—'}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(visit.status)}`}>
                      {getStatusLabel(visit.status)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      {visit.status === 0 ? (
                        <button
                          onClick={() => handleInitializeVisit(visit)}
                          className={styles.initializeBtn}
                          title="Initialize Visit"
                        >
                          <FiCheckCircle size={16} />
                          Initialize
                        </button>
                      ) : (
                        <button
                          className={`${styles.readyBtn} ${styles.disabled}`}
                          disabled
                          title="Visit is Ready to Consult"
                        >
                          <FiCheckCircle size={16} />
                          Ready
                        </button>
                      )}
                      <button
                        onClick={() => handleViewDetails(visit)}
                        className={styles.detailsBtn}
                      >
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

      {/* ── Add Visit Modal ── */}
      <AddPatientVisit
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
      />

      {/* ── Visit Details Modal ── */}
      <PatientVisitDetails
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        visitId={selectedVisit?.id}
        onEdit={handleEditFromModal}
      />

      {/* ── Update Visit Modal ── */}
      {showUpdateModal && visitToUpdate && (
        <div className={styles.updateOverlay}>
          <div className={styles.updateModal}>
            <div className={styles.updateHeader}>
              <div className={styles.updateHeaderContent}>
                <FiCheckCircle size={24} className={styles.updateIcon} />
                <h3>Initialize Visit - Add Vitals</h3>
              </div>
              <button
                onClick={closeUpdateModal}
                className={styles.updateCloseBtn}
                disabled={updating}
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit}>
              <div className={styles.updateBody}>
                {/* Visit Info Section */}
                <div className={styles.updateInfoSection}>
                  <h4>Visit Information</h4>
                  <div className={styles.updateInfoGrid}>
                    <div className={styles.infoItem}>
                      <label>Patient:</label>
                      <span>{visitToUpdate.patientName}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Doctor:</label>
                      <span>{visitToUpdate.doctorFullName}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Date:</label>
                      <span>{formatDate(visitToUpdate.visitDate)}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Time:</label>
                      <span>{formatTime(visitToUpdate.visitTime)}</span>
                    </div>
                    {visitToUpdate.reason && (
                      <div className={styles.infoItem}>
                        <label>Reason:</label>
                        <span>{visitToUpdate.reason}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vitals Input Section */}
                <div className={styles.updateFormSection}>
                  <h4>Patient Vitals</h4>

                  <div className={styles.formGroup}>
                    <label htmlFor="symptoms">Symptoms</label>
                    <textarea
                      id="symptoms"
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleFormChange}
                      placeholder="Enter patient symptoms..."
                      rows="3"
                      className={styles.formTextarea}
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="bpSystolic">
                        BP Systolic <span className={styles.unitLabel}>(mmHg)</span>
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
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="bpDiastolic">
                        BP Diastolic <span className={styles.unitLabel}>(mmHg)</span>
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
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="temperature">
                        Temperature <span className={styles.unitLabel}>(°F)</span>
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
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="weight">
                        Weight <span className={styles.unitLabel}>(kg)</span>
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
                        className={styles.formInput}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.updateFooter}>
                <button
                  type="button"
                  onClick={closeUpdateModal}
                  className={styles.updateBtnCancel}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.updateBtnSubmit}
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