// src/components/PatientVisitList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiCheckCircle, FiX, FiAlertCircle } from 'react-icons/fi';
import { getPatientVisitList, updatePatientVisit } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import AddPatientVisit from './AddPatientVisit.jsx';
import PatientVisitDetails from './ViewPatientVisit.jsx';
import UpdatePatientVisit from './UpdatePatientVisit.jsx';
import styles from './PatientVisitList.module.css';

const STATUS_OPTIONS = [
  { id: 0, label: 'Initiated' },
  { id: 1, label: 'Ready to Consult' },
  { id: 2, label: 'Consulted'}
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'PatientName', label: 'Patient Name' },
  { value: 'DoctorName',  label: 'Doctor Name' },
];

const todayDate = new Date().toISOString().split('T')[0];

const PatientVisitList = () => {
  const navigate = useNavigate();

  const [visits, setVisits]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const [filterInputs, setFilterInputs] = useState({
    searchType:  'PatientName',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
    visitDate:   todayDate,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'PatientName',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
    visitDate:   todayDate,
  });

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit]           = useState(null);

  // Update Modal (full edit form — no routing)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateVisitId, setUpdateVisitId]         = useState(null);

  // Initialize Visit Modal (quick vitals)
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [visitToUpdate, setVisitToUpdate]     = useState(null);
  const [updating, setUpdating]               = useState(false);
  const [submitErrors, setSubmitErrors]       = useState([]);
  const [formData, setFormData] = useState({
    symptoms:    '',
    bpSystolic:  '',
    bpDiastolic: '',
    temperature: '',
    weight:      '',
  });

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.status             !== '' ||
    appliedFilters.dateFrom           !== '' ||
    appliedFilters.dateTo             !== '' ||
    appliedFilters.visitDate          !== todayDate;

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
    if (status === 2) return 'Consulted';
    return 'Unknown';
  };

  const getStatusClass = (status) => {
    if (status === 0) return styles.initiated;
    if (status === 1) return styles.ready;
    if (status === 2) return styles.consulted;
    return styles.initiated;
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => {
      const updated = { ...prev, [name]: value };
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

  const handleViewDetails = (visit) => {
    setSelectedVisit(visit);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedVisit(null);
    setIsDetailsModalOpen(false);
  };

  const openAddForm      = () => setIsAddFormOpen(true);
  const closeAddForm     = () => setIsAddFormOpen(false);
  const handleAddSuccess = () => fetchVisits(appliedFilters);

  // Opens the full UpdatePatientVisit modal instead of navigating
  const handleEditFromModal = (visitId) => {
    setIsDetailsModalOpen(false);
    setSelectedVisit(null);
    setUpdateVisitId(visitId);
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setUpdateVisitId(null);
  };

  const handleUpdateSuccess = () => {
    fetchVisits(appliedFilters);
  };

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

  const closeInitializeModal = () => {
    setShowUpdateModal(false);
    setVisitToUpdate(null);
    setSubmitErrors([]);
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
      setSubmitErrors([]);

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
      closeInitializeModal();
      await fetchVisits(appliedFilters);
    } catch (err) {
      console.error('Failed to update visit:', err);
      const apiErrors = err?.response?.data?.errors || err?.data?.errors || err?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        setSubmitErrors(apiErrors);
      } else {
        setError({ message: err.message || 'Failed to update visit' });
      }
    } finally {
      setUpdating(false);
    }
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading visits...</div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  return (
    <div className={styles.listWrapper}>
      <Header title="Patient Visit Management" />

      {/* ── Filter Bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

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

      {/* ── Update Visit Modal (full form, no routing) ── */}
      <UpdatePatientVisit
        isOpen={isUpdateModalOpen}
        onClose={closeUpdateModal}
        onSuccess={handleUpdateSuccess}
        visitId={updateVisitId}
      />

      {/* ── Initialize Visit Modal ── */}
      {showUpdateModal && visitToUpdate && (
        <div className={styles.updateOverlay}>
          <div className={styles.updateModal}>
            <div className={styles.updateHeader}>
              <div className={styles.updateHeaderContent}>
                <FiCheckCircle size={24} className={styles.updateIcon} />
                <h3>Initialize Visit - Add Vitals</h3>
              </div>
              <button
                onClick={closeInitializeModal}
                className={styles.updateCloseBtn}
                disabled={updating}
              >
                <FiX size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit}>
              <div className={styles.updateBody}>
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
                      required
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
                        placeholder='50-250'
                        required
                        min="50"
                        max="250"
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
                        required
                        onChange={handleFormChange}
                        placeholder='30-150'
                        min="30"
                        max="150"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="temperature">
                        Temperature <span className={styles.unitLabel}>(°F)</span>
                      </label>
                      <input
                        type="number"
                        id="temperature"
                        name="temperature"
                        value={formData.temperature}
                        required
                        onChange={handleFormChange}
                        placeholder='90-110'
                        min="90"
                        max="110"
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
                        placeholder='1-500'
                        required
                        min="1"
                        max="500"
                        step="0.1"
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                </div>

                {/* ── Inline API Error Display ── */}
                {submitErrors.length > 0 && (
                  <div className={styles.modalErrorBox}>
                    <div className={styles.modalErrorTitle}>
                      <FiAlertCircle size={16} />
                      Please fix the following errors:
                    </div>
                    {submitErrors.map((err, i) => (
                      <div key={i} className={styles.modalErrorItem}>
                        <strong>{err.path}:</strong> {err.msg}
                      </div>
                    ))}
                  </div>
                )}

              </div>

              <div className={styles.updateFooter}>
                <button
                  type="button"
                  onClick={closeInitializeModal}
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