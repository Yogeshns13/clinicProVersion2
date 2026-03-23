// src/components/PatientList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { getPatientsList, deletePatient } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import AddPatient from './AddPatient.jsx';
import UpdatePatient from './UpdatePatient.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import ConfirmPopup from '../Hooks/ConfirmPopup.jsx';
import styles from './PatientList.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

// ────────────────────────────────────────────────
// CONSTANTS (shared)
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

const GENDER_OPTIONS = [
  { id: 1, label: 'Male' },
  { id: 2, label: 'Female' },
  { id: 3, label: 'Other' },
];

const BLOOD_GROUP_OPTIONS = [
  { id: 1, label: 'A+' },
  { id: 2, label: 'A-' },
  { id: 3, label: 'B+' },
  { id: 4, label: 'B-' },
  { id: 5, label: 'AB+' },
  { id: 6, label: 'AB-' },
  { id: 7, label: 'O+' },
  { id: 8, label: 'O-' },
  { id: 9, label: 'Others' },
];

const MARITAL_STATUS_OPTIONS = [
  { id: 1, label: 'Single' },
  { id: 2, label: 'Married' },
  { id: 3, label: 'Widowed' },
  { id: 4, label: 'Divorced' },
  { id: 5, label: 'Separated' },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'Name',   label: 'Name' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'FileNo', label: 'File No' },
];

// ────────────────────────────────────────────────
// SHARED HELPERS
// ────────────────────────────────────────────────
const getGenderLabel      = (id) => GENDER_OPTIONS.find((g) => g.id === id)?.label || '—';
const getBloodGroupLabel  = (id) => BLOOD_GROUP_OPTIONS.find((b) => b.id === id)?.label || '—';
const getMaritalLabel     = (id) => MARITAL_STATUS_OPTIONS.find((m) => m.id === id)?.label || '—';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const getStatusClass = (status) =>
  status === 'active' ? styles.active : styles.inactive;

// ════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════
const PatientList = () => {
  const navigate = useNavigate();

  const [patients, setPatients]         = useState([]);
  const [listLoading, setListLoading]   = useState(true);
  const [listError, setListError]       = useState(null);

  const [filterInputs, setFilterInputs] = useState({
    searchType: 'Name', searchValue: '', gender: '', bloodGroup: '', status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'Name', searchValue: '', gender: '', bloodGroup: '', status: '',
  });

  // ── Pagination states ──
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isUpdateFormOpen, setIsUpdateFormOpen] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [familyPatientName, setFamilyPatientName] = useState('—');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError]     = useState(null);

  const [updatePatientId, setUpdatePatientId] = useState(null);

  // ── MessagePopup state ────────────────────────────────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });

  // ── ConfirmPopup state (delete confirmation) ──────────────────────────────
  const [confirmPopup, setConfirmPopup] = useState({ visible: false });

  // ── Button cooldown states ────────────────────────────────────────────────
  const [deleteCooldown, setDeleteCooldown] = useState(false);
  const [updateCooldown, setUpdateCooldown] = useState(false);
  const [searchCooldown, setSearchCooldown] = useState(false);
  const [addCooldown, setAddCooldown]       = useState(false);

  // ── Delete loading state ──────────────────────────────────────────────────
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ────────────────────────────────────────────────
  // Derived: pagination display values
  const startRecord = patients.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + patients.length;

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.gender             !== '' ||
    appliedFilters.bloodGroup         !== '' ||
    appliedFilters.status             !== '';

  // ────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────
  const showPopup = (message, type) => {
    setPopup({ visible: true, message, type });
  };

  const closePopup = () => {
    setPopup({ visible: false, message: '', type: 'success' });
  };

  const startCooldown = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // ────────────────────────────────────────────────
  // Fetch patients list (with pagination)
  // ────────────────────────────────────────────────
  const fetchPatients = async (filters = appliedFilters, currentPage = page) => {
    try {
      setListLoading(true);
      setListError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        BranchID:   branchId,
        PatientID:  0,
        Name:       filters.searchType === 'Name'   ? filters.searchValue : '',
        Mobile:     filters.searchType === 'Mobile' ? filters.searchValue : '',
        FileNo:     filters.searchType === 'FileNo' ? filters.searchValue : '',
        Gender:     filters.gender     !== '' ? Number(filters.gender)     : 0,
        BloodGroup: filters.bloodGroup !== '' ? Number(filters.bloodGroup) : 0,
        Status:     filters.status     !== '' ? Number(filters.status)     : -1,
        Page:       currentPage,
        PageSize:   pageSize,
      };

      const data = await getPatientsList(clinicId, options);
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchPatients error:', err);
      setListError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load patients' }
      );
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(appliedFilters, page);
  }, [appliedFilters, page]);

  // ────────────────────────────────────────────────
  // Fetch single patient details
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedPatient) return;

    const fetchDetail = async () => {
      try {
        setDetailLoading(true);
        setDetailError(null);
        setFamilyPatientName('—');

        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();

        const data = await getPatientsList(clinicId, {
          PatientID: selectedPatient.id,
          BranchID:  branchId,
        });

        if (data && data.length > 0) {
          const current = data[0];
          setSelectedPatient(current);

          if (current.familyPatientId && current.familyPatientId !== 0) {
            try {
              const familyData = await getPatientsList(clinicId, {
                PatientID: current.familyPatientId,
                BranchID:  branchId,
              });
              if (familyData && familyData.length > 0) {
                const fp = familyData[0];
                setFamilyPatientName(`${fp.firstName} ${fp.lastName}`);
              }
            } catch (familyErr) {
              console.error('Failed to fetch family patient:', familyErr);
            }
          }
        } else {
          setDetailError({ message: 'Patient not found' });
        }
      } catch (err) {
        console.error('fetchDetail error:', err);
        setDetailError(
          err?.status >= 400 || err?.code >= 400
            ? err
            : { message: err.message || 'Failed to load patient details' }
        );
      } finally {
        setDetailLoading(false);
      }
    };

    fetchDetail();
  }, [selectedPatient?.id]);

  // ────────────────────────────────────────────────
  // Handlers
  // ────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    if (searchCooldown) return;
    startCooldown(setSearchCooldown);
    setAppliedFilters({ ...filterInputs });
    setPage(1);
  };

  const handleClearFilters = () => {
    const empty = { searchType: 'Name', searchValue: '', gender: '', bloodGroup: '', status: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
  };

  const closeDetailModal = () => {
    setSelectedPatient(null);
    setFamilyPatientName('—');
    setDetailError(null);
  };

  const openAddForm = () => {
    if (addCooldown) return;
    startCooldown(setAddCooldown);
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    fetchPatients(appliedFilters);
  };

  const handleAddSuccess = () => fetchPatients(appliedFilters);

  const handleUpdateClick = () => {
    if (updateCooldown) return;
    startCooldown(setUpdateCooldown);
    if (selectedPatient?.id) {
      setUpdatePatientId(selectedPatient.id);
      closeDetailModal();
      setIsUpdateFormOpen(true);
    }
  };

  const handleUpdateClose = () => {
    setIsUpdateFormOpen(false);
    setUpdatePatientId(null);
  };

  const handleUpdateSuccess = () => {
    setIsUpdateFormOpen(false);
    setUpdatePatientId(null);
    fetchPatients(appliedFilters);
  };

  const handleDelete = () => {
    if (deleteCooldown || deleteLoading) return;
    startCooldown(setDeleteCooldown);
    // Open custom confirm popup — actual deletion only happens in performDelete
    setConfirmPopup({ visible: true });
  };

  const performDelete = async () => {
    setConfirmPopup({ visible: false });
    setDeleteLoading(true);
    try {
      setDetailError(null);
      await deletePatient(selectedPatient.id);
      showPopup('Patient deleted successfully!', 'success');
      setTimeout(() => {
        closePopup();
        closeDetailModal();
        fetchPatients(appliedFilters);
      }, 1200);
    } catch (err) {
      console.error('Delete patient failed:', err);
      showPopup(err.message || 'Failed to delete patient.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Early returns for list
  // ────────────────────────────────────────────────
  if (listError && (listError?.status >= 400 || listError?.code >= 400)) {
    return <ErrorHandler error={listError} />;
  }

  if (listLoading) return <div className={styles.loading}><LoadingPage/></div>;
  if (listError)   return <div className={styles.error}>Error: {listError.message || listError}</div>;

  return (
    <div className={styles.listWrapper}>
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <ConfirmPopup
        visible={confirmPopup.visible}
        message="Delete this patient?"
        subMessage="This action cannot be undone. The patient record will be permanently removed."
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        onConfirm={performDelete}
        onCancel={() => setConfirmPopup({ visible: false })}
      />

      <ErrorHandler error={listError} />
      <Header title="Patient Management" />

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
              {SEARCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${SEARCH_TYPE_OPTIONS.find((o) => o.value === filterInputs.searchType)?.label || ''}`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select name="gender" value={filterInputs.gender} onChange={handleFilterChange} className={styles.filterInput}>
              <option value="">All Genders</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select name="bloodGroup" value={filterInputs.bloodGroup} onChange={handleFilterChange} className={styles.filterInput}>
              <option value="">All Blood Groups</option>
              {BLOOD_GROUP_OPTIONS.map((bg) => (
                <option key={bg.id} value={bg.id}>{bg.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select name="status" value={filterInputs.status} onChange={handleFilterChange} className={styles.filterInput}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterActions}>
            <button
              onClick={handleSearch}
              disabled={searchCooldown}
              className={styles.searchButton}
            >
              <FiSearch size={16} /> Search
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={16} /> Clear
              </button>
            )}
            <button
              onClick={openAddForm}
              disabled={addCooldown}
              className={styles.addBtn}
            >
              <FiPlus size={18} /> Add Patient
            </button>
          </div>
        </div>
      </div>

      {/* Table + Pagination wrapper */}
      <div className={styles.tableSection}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>File No</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Blood Group</th>
                <th>Mobile</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.noData}>
                    {hasActiveFilters ? 'No patients found.' : 'No patients registered yet.'}
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {patient.firstName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{patient.firstName} {patient.lastName}</div>
                          <div className={styles.subInfo}>{patient.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{patient.fileNo || '—'}</td>
                    <td>{getGenderLabel(patient.gender)}</td>
                    <td>{patient.age || '—'}</td>
                    <td>
                      <span className={styles.bloodGroupBadge}>
                        {getBloodGroupLabel(patient.bloodGroup)}
                      </span>
                    </td>
                    <td>{patient.mobile || '—'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(patient.status)}`}>
                        {patient.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleViewDetails(patient)} className={styles.detailsBtn}>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {patients.length > 0
              ? `Showing ${startRecord}–${endRecord} records`
              : 'No records'}
          </div>

          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              title="First page"
            >
              «
            </button>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              title="Previous page"
            >
              ‹
            </button>

            <span className={styles.pageIndicator}>{page}</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page + 1)}
              disabled={patients.length < pageSize}
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

      {/* Add Patient Modal */}
      <AddPatient
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onSuccess={handleAddSuccess}
      />

      {/* Update Patient Modal */}
      {isUpdateFormOpen && updatePatientId && (
        <UpdatePatient
          patientId={updatePatientId}
          onClose={handleUpdateClose}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* Patient Detail Popup Modal */}
      {selectedPatient && (
        <div className={styles.detailModalOverlay} onClick={closeDetailModal}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <div className={styles.shiftAvatarLarge}>
                  {selectedPatient.firstName?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div>
                  <h2>{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                </div>
              </div>
              <div className={styles.clinicNameone}>
                <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
                {localStorage.getItem('clinicName') || '—'}
              </div>

              <button onClick={closeDetailModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            {/* Body */}
            <div className={styles.detailModalBody}>
              {detailLoading && <div>Loading details...</div>}
              {detailError && <div className={styles.error}>{detailError.message}</div>}

              {!detailLoading && !detailError && selectedPatient && (
                <>
                  <div className={styles.infoSection}>
                    <div className={styles.infoCard}>
                      <div className={styles.infoHeader}>
                        <h3>Basic Information</h3>
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>File Number</span>
                          <span className={styles.infoValue}>{selectedPatient.fileNo || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Gender</span>
                          <span className={styles.infoValue}>{getGenderLabel(selectedPatient.gender)}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Date of Birth</span>
                          <span className={styles.infoValue}>{formatDate(selectedPatient.birthDate)}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Age</span>
                          <span className={styles.infoValue}>{selectedPatient.age || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Blood Group</span>
                          <span className={styles.infoValue}>{getBloodGroupLabel(selectedPatient.bloodGroup)}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Marital Status</span>
                          <span className={styles.infoValue}>{getMaritalLabel(selectedPatient.maritalStatus)}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Family Patient</span>
                          <span className={styles.infoValue}>{familyPatientName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.infoSection}>
                    <div className={styles.infoCard}>
                      <div className={styles.infoHeader}>
                        <h3>Contact Information</h3>
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Mobile</span>
                          <span className={styles.infoValue}>{selectedPatient.mobile || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Alternate Mobile</span>
                          <span className={styles.infoValue}>{selectedPatient.altMobile || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Email</span>
                          <span className={styles.infoValue}>{selectedPatient.email || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Emergency Contact</span>
                          <span className={styles.infoValue}>{selectedPatient.emergencyContactNo || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Address</span>
                          <span className={styles.infoValue}>{selectedPatient.address || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.infoSection}>
                    <div className={styles.infoCard}>
                      <div className={styles.infoHeader}>
                        <h3>Clinic Information</h3>
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Clinic Name</span>
                          <span className={styles.infoValue}>{selectedPatient.clinicName || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Branch Name</span>
                          <span className={styles.infoValue}>{selectedPatient.branchName || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.infoSection}>
                    <div className={styles.infoCard}>
                      <div className={styles.infoHeader}>
                        <h3>Medical Information</h3>
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Allergies</span>
                          <span className={styles.infoValue}>{selectedPatient.allergies || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Existing Conditions</span>
                          <span className={styles.infoValue}>{selectedPatient.existingMedicalConditions || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Past Surgeries</span>
                          <span className={styles.infoValue}>{selectedPatient.pastSurgeries || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Current Medications</span>
                          <span className={styles.infoValue}>{selectedPatient.currentMedications || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Family History</span>
                          <span className={styles.infoValue}>{selectedPatient.familyMedicalHistory || '—'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Immunization Records</span>
                          <span className={styles.infoValue}>{selectedPatient.immunizationRecords || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.infoSection}>
                    <div className={styles.infoCard}>
                      <div className={styles.infoHeader}>
                        <h3>Record Information</h3>
                      </div>
                      <div className={styles.infoContent}>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Date Created</span>
                          <span className={styles.infoValue}>{formatDate(selectedPatient.dateCreated)}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Last Modified</span>
                          <span className={styles.infoValue}>{formatDate(selectedPatient.dateModified)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className={styles.detailModalFooter}>
              <button
                onClick={handleDelete}
                disabled={deleteCooldown || deleteLoading}
                className={styles.btnCancel}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Patient'}
              </button>
              <button
                onClick={handleUpdateClick}
                disabled={updateCooldown}
                className={styles.btnUpdate}
              >
                Update Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;