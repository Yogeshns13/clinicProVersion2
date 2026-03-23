// src/components/LabReportList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiTrash2, FiEdit } from 'react-icons/fi';
import { getLabTestReportList, deleteLabTestReport } from '../Api/ApiLabTests.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import ConfirmPopup from '../Hooks/ConfirmPopup.jsx';
import UpdateLabReport from './UpdateLabReport.jsx';
import styles from './LabReportList.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

const PAGE_SIZE = 20;

const LabReportList = () => {
  const navigate = useNavigate();

  const [reports, setReports]       = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [clinicName, setClinicName] = useState('—');

  // Pagination
  const [page, setPage]       = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [filterInputs, setFilterInputs] = useState({
    searchType:  'patientName',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'patientName',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
  });

  const [selectedReport, setSelectedReport]   = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [reportToUpdate, setReportToUpdate]   = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [error,   setError]                   = useState(null);

  // ── ConfirmPopup state ──────────────────────────
  const [confirmPopup, setConfirmPopup] = useState({ visible: false, report: null });
  const [deleting, setDeleting]         = useState(false);

  const openConfirmPopup  = (report) => setConfirmPopup({ visible: true, report });
  const closeConfirmPopup = () => { if (!deleting) setConfirmPopup({ visible: false, report: null }); };

  // ── Button cooldown state (2-sec disable after click) ──────────────────────
  const [btnCooldown, setBtnCooldown] = useState({});
  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  // ── MessagePopup state ──────────────────────────────────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.status             !== '' ||
    appliedFilters.dateFrom           !== '' ||
    appliedFilters.dateTo             !== '';

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReports = async (filters = appliedFilters, pageNum = page) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        BranchID: branchId,
        Page:     pageNum,
        PageSize: PAGE_SIZE,
      };

      const data = await getLabTestReportList(clinicId, options);

      setReports(data);
      setAllReports(data);
      setHasNext(data.length === PAGE_SIZE);
    } catch (err) {
      console.error('fetchReports error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load lab reports' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(appliedFilters, 1);
    setPage(1);
  }, [appliedFilters]);

  // ── Client-side filtering ──────────────────────────────────────────────────
  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (appliedFilters.searchValue) {
      const term = appliedFilters.searchValue.toLowerCase();
      switch (appliedFilters.searchType) {
        case 'patientName':
          filtered = filtered.filter(r => r.patientName?.toLowerCase().includes(term));
          break;
        case 'patientMobile':
          filtered = filtered.filter(r => r.patientMobile?.toLowerCase().includes(term));
          break;
        case 'patientFileNo':
          filtered = filtered.filter(r => r.patientFileNo?.toLowerCase().includes(term));
          break;
        case 'doctorName':
          filtered = filtered.filter(r => r.doctorFullName?.toLowerCase().includes(term));
          break;
        default:
          break;
      }
    }

    if (appliedFilters.status) {
      filtered = filtered.filter(r => r.status === Number(appliedFilters.status));
    }

    if (appliedFilters.dateFrom) {
      const fromDate = new Date(appliedFilters.dateFrom);
      filtered = filtered.filter(r => r.dateCreated && new Date(r.dateCreated) >= fromDate);
    }

    if (appliedFilters.dateTo) {
      const toDate = new Date(appliedFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => r.dateCreated && new Date(r.dateCreated) <= toDate);
    }

    return filtered;
  }, [reports, appliedFilters]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getStatusClass = (status) => {
    if (status === 1) return styles.created;
    if (status === 2) return styles.cancelled;
    if (status === 3) return styles.verified;
    return styles.created;
  };

  const getStatusBadgeVariant = (status) => {
    if (status === 1) return styles.detailBadgeInfo;
    if (status === 2) return styles.detailBadgeDanger;
    if (status === 3) return styles.detailBadgeSuccess;
    return '';
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '—';
    try {
      return new Date(dateTime).toLocaleString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateTime;
    }
  };

  // ── Filter handlers ────────────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    triggerCooldown('search');
    setAppliedFilters({ ...filterInputs });
    setPage(1);
  };

  const handleClearFilters = () => {
    triggerCooldown('clear');
    const emptyFilters = { searchType: 'patientName', searchValue: '', status: '', dateFrom: '', dateTo: '' };
    setFilterInputs(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const openDetails = (report) => {
    triggerCooldown(`view-${report.id}`);
    setSelectedReport(report);
  };
  const closeModal = () => setSelectedReport(null);

  const handleUpdateClick = (report) => {
    triggerCooldown('update');
    setReportToUpdate(report);
    setShowUpdateModal(true);
    setSelectedReport(null);
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setReportToUpdate(null);
  };

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    setReportToUpdate(null);
    showPopup('Lab report updated successfully!', 'success');
    fetchReports(appliedFilters, page);
  };

  const handleDeleteClick = (report) => {
    triggerCooldown('delete');
    openConfirmPopup(report);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmPopup.report) return;
    const report = confirmPopup.report;
    closeConfirmPopup();
    try {
      setDeleting(true);
      await deleteLabTestReport(report.id);
      setAllReports(prev => prev.filter(r => r.id !== report.id));
      setReports(prev => prev.filter(r => r.id !== report.id));
      setSelectedReport(null);
      showPopup('Lab report deleted successfully!', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showPopup(err.message || 'Failed to delete report.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
    fetchReports(appliedFilters, newPage);
  };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.clinicLoading}><LoadingPage/></div>;
  if (error)   return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  const startRecord = reports.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord   = startRecord + reports.length - 1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Report Management" />

      {/* ── Filters ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="patientName">Name</option>
              <option value="patientMobile">Mobile</option>
              <option value="patientFileNo">File Code</option>
              <option value="doctorName">Doctor Name</option>
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'patientName'   ? 'Name'      :
                filterInputs.searchType === 'patientMobile' ? 'Mobile'    :
                filterInputs.searchType === 'patientFileNo' ? 'File Code' :
                'Doctor Name'
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select name="status" value={filterInputs.status} onChange={handleFilterChange} className={styles.filterInput}>
              <option value="">All Status</option>
              <option value="1">Created</option>
              <option value="2">Cancelled</option>
              <option value="3">Verified</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateFrom && <span className={styles.datePlaceholder}>From Date</span>}
              <input
                type="date" name="dateFrom" value={filterInputs.dateFrom} onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateFrom ? styles.dateEmpty : ''}`}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateTo && <span className={styles.datePlaceholder}>To Date</span>}
              <input
                type="date" name="dateTo" value={filterInputs.dateTo} onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateTo ? styles.dateEmpty : ''}`}
              />
            </div>
          </div>

          <div className={styles.filterActions}>
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={!!btnCooldown['search']}
            >
              <FiSearch size={18} /> Search
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={!!btnCooldown['clear']}
              >
                <FiX size={18} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table + Pagination ── */}
      <div className={styles.tableSection}>
        <div className={styles.clinicTableContainer}>
          <table className={styles.clinicTable}>
            <thead>
              <tr>
                <th>File Code</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Clinic</th>
                <th>Verified By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.clinicNoData}>
                    {Object.values(appliedFilters).some(v => v)
                      ? 'No lab reports found.'
                      : 'No lab reports available yet.'}
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div className={styles.clinicNameCell}>
                        <div className={styles.clinicAvatar}>
                          {report.patientFileNo ? String(report.patientFileNo).charAt(0).toUpperCase() : 'F'}
                        </div>
                        <div>
                          <div className={styles.clinicName}>{report.patientFileNo || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className={styles.clinicName}>{report.patientName || '—'}</div>
                        <div className={styles.clinicType}>{report.patientMobile || '—'}</div>
                      </div>
                    </td>
                    <td>{report.doctorFullName || '—'}</td>
                    <td>{report.clinicName || '—'}</td>
                    <td>{report.verifiedByName || '—'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(report.status)}`}>
                        {report.statusDesc?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openDetails(report)}
                        className={styles.clinicDetailsBtn}
                        disabled={!!btnCooldown[`view-${report.id}`]}
                      >
                        View Details
                      </button>
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
            {reports.length > 0
              ? `Showing ${startRecord}–${endRecord} records`
              : 'No records'}
          </div>

          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={page === 1 || !!btnCooldown['page-1']}
              title="First page"
            >
              «
            </button>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || !!btnCooldown[`page-${page - 1}`]}
              title="Previous page"
            >
              ‹
            </button>

            <span className={styles.pageIndicator}>{page}</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page + 1)}
              disabled={!hasNext || !!btnCooldown[`page-${page + 1}`]}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{PAGE_SIZE}</strong>
          </div>
        </div>
      </div>

      {/* ── Details Modal ── */}
      {selectedReport && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <div className={styles.detailHeaderTop}>
                  <div className={styles.detailHeaderAvatar}>
                    {selectedReport.patientFileNo
                      ? String(selectedReport.patientFileNo).charAt(0).toUpperCase()
                      : 'F'}
                  </div>
                  <h2 className={styles.detailHeaderTitle}>{selectedReport.patientName || '—'}</h2>
                </div>
                <div className={styles.clinicNameone}>
                  <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
                  {localStorage.getItem('clinicName') || '—'}
                </div>
              </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.detailInfoSection}>

                <div className={styles.detailInfoCard}>
                  <div className={styles.detailInfoHeader}><h3>Patient Information</h3></div>
                  <div className={styles.detailInfoContent}>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Full Name</span>
                      <span className={styles.detailInfoValue}>{selectedReport.patientName || '—'}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Mobile</span>
                      <span className={styles.detailInfoValue}>{selectedReport.patientMobile || '—'}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>File Code</span>
                      <span className={styles.detailInfoValue}>{selectedReport.patientFileNo || '—'}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Consultation ID</span>
                      <span className={styles.detailInfoValue}>{selectedReport.consultationId || '—'}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Visit ID</span>
                      <span className={styles.detailInfoValue}>{selectedReport.visitId || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailInfoCard}>
                  <div className={styles.detailInfoHeader}><h3>Report Details</h3></div>
                  <div className={styles.detailInfoContent}>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>File ID</span>
                      <span className={styles.detailInfoValue}>{selectedReport.fileId || '—'}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Verified By</span>
                      <span className={styles.detailInfoValue}>{selectedReport.verifiedByName || '—'}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Verified Date/Time</span>
                      <span className={styles.detailInfoValue}>{formatDateTime(selectedReport.verifiedDateTime)}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Status</span>
                      <span className={`${styles.detailInlineBadge} ${getStatusBadgeVariant(selectedReport.status)}`}>
                        {selectedReport.statusDesc?.toUpperCase() || '—'}
                      </span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Remarks</span>
                      <span className={styles.detailInfoValue}>{selectedReport.remarks || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailInfoCard}>
                  <div className={styles.detailInfoHeader}><h3>Clinic & Timeline</h3></div>
                  <div className={styles.detailInfoContent}>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Doctor</span>
                      <span className={styles.detailInfoValue}>{selectedReport.doctorFullName || '—'}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Doctor Code</span>
                      <span className={styles.detailInfoValue}>{selectedReport.doctorCode || '—'}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Clinic</span>
                      <span className={styles.detailInfoValue}>{selectedReport.clinicName || '—'}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Branch</span>
                      <span className={styles.detailInfoValue}>{selectedReport.branchName || '—'}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Date Created</span>
                      <span className={styles.detailInfoValue}>{formatDateTime(selectedReport.dateCreated)}</span>
                    </div>
                    <div className={styles.detailInfoRow}>
                      <span className={styles.detailInfoLabel}>Date Modified</span>
                      <span className={styles.detailInfoValue}>{formatDateTime(selectedReport.dateModified)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.detailModalFooter}>
              <button
                onClick={() => handleDeleteClick(selectedReport)}
                className={styles.btnDelete}
                disabled={!!btnCooldown['delete']}
              >
                <FiTrash2 size={15} /> Delete Report
              </button>
              <button
                onClick={() => handleUpdateClick(selectedReport)}
                className={styles.btnUpdate}
                disabled={!!btnCooldown['update']}
              >
                <FiEdit size={15} /> Update Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ConfirmPopup ── */}
      <ConfirmPopup
        visible={confirmPopup.visible}
        message={`Delete report for "${confirmPopup.report?.patientName || '—'}"?`}
        subMessage={`File Code: ${confirmPopup.report?.patientFileNo || '—'}. This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={closeConfirmPopup}
      />

      {/* ── Update Modal ── */}
      {showUpdateModal && reportToUpdate && (
        <UpdateLabReport
          report={reportToUpdate}
          onClose={handleCloseUpdateModal}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {/* ── MessagePopup (at root level so z-index is never blocked) ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />
    </div>
  );
};

export default LabReportList;