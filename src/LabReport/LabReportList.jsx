// src/components/LabReportList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiTrash2 } from 'react-icons/fi';
import { getLabTestReportList, deleteLabTestReport } from '../api/api-labtest.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateLabReport from './UpdateLabReport.jsx';
import styles from './LabReportList.module.css';

// ────────────────────────────────────────────────
const LabReportList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [reports, setReports] = useState([]);
  const [allReports, setAllReports] = useState([]);
  
  // Filter inputs (not applied until search)
  const [filterInputs, setFilterInputs] = useState({
    searchType: 'patientName', // patientName, patientMobile, patientFileNo, doctorName
    searchValue: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'patientName',
    searchValue: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Selected / Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [reportToUpdate, setReportToUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ────────────────────────────────────────────────
  // Data fetching
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID')) || 0;
      const branchId = Number(localStorage.getItem('branchID'));
      const options = {
        BranchID: branchId,
      }
      const data = await getLabTestReportList(clinicId, options);

      setReports(data);
      setAllReports(data);
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

  // ────────────────────────────────────────────────
  // Computed values
  const filteredReports = useMemo(() => {
    let filtered = allReports;

    // Apply search filter based on search type
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
      filtered = filtered.filter(r => {
        if (!r.dateCreated) return false;
        const reportDate = new Date(r.dateCreated);
        return reportDate >= fromDate;
      });
    }

    if (appliedFilters.dateTo) {
      const toDate = new Date(appliedFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => {
        if (!r.dateCreated) return false;
        const reportDate = new Date(r.dateCreated);
        return reportDate <= toDate;
      });
    }

    return filtered;
  }, [allReports, appliedFilters]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getStatusClass = (status) => {
    if (status === 1) return styles.created;
    if (status === 2) return styles.cancelled;
    if (status === 3) return styles.verified;
    return styles.created;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '—';
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateTime;
    }
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      searchType: 'patientName',
      searchValue: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilterInputs(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const openDetails = (report) => setSelectedReport(report);
  const closeModal = () => setSelectedReport(null);

  const handleUpdateClick = (report) => {
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
    fetchReports(); // Refresh the list
  };

  const handleDeleteClick = (report) => {
    setDeleteConfirm(report);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setDeleting(true);
      await deleteLabTestReport(deleteConfirm.id);
      
      // Remove from local state
      setAllReports(prev => prev.filter(r => r.id !== deleteConfirm.id));
      setReports(prev => prev.filter(r => r.id !== deleteConfirm.id));
      
      setDeleteConfirm(null);
      setSelectedReport(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError({
        message: err.message || 'Failed to delete report',
        status: err.status || 500
      });
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.clinicLoading}>Loading lab reports...</div>;

  if (error) return <div className={styles.clinicError}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Report Management" />

      {/* Filters */}
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
                filterInputs.searchType === 'patientName' ? 'Name' :
                filterInputs.searchType === 'patientMobile' ? 'Mobile' :
                filterInputs.searchType === 'patientFileNo' ? 'File Code' :
                'Doctor Name'
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select
              name="status"
              value={filterInputs.status}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Status</option>
              <option value="1">Created</option>
              <option value="2">Cancelled</option>
              <option value="3">Verified</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <input
              type="date"
              name="dateFrom"
              placeholder="Date From"
              value={filterInputs.dateFrom}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <input
              type="date"
              name="dateTo"
              placeholder="Date To"
              value={filterInputs.dateTo}
              onChange={handleFilterChange}
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={18} />
              Search
            </button>
            <button onClick={handleClearFilters} className={styles.clearButton}>
              <FiX size={18} />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
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
                  {Object.values(appliedFilters).some(v => v) ? 'No lab reports found.' : 'No lab reports available yet.'}
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
                    <button onClick={() => openDetails(report)} className={styles.clinicDetailsBtn}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedReport && (
        <div className={styles.clinicModalOverlay} onClick={closeModal}>
          <div className={`${styles.clinicModal} ${styles.detailsModal} ${styles.wideModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsModalHeader}>
              <div className={styles.detailsHeaderContent}>
                <div className={styles.clinicAvatarLarge}>
                  {selectedReport.patientFileNo ? String(selectedReport.patientFileNo).charAt(0).toUpperCase() : 'F'}
                </div>
                <div>
                  <h2>File: {selectedReport.patientFileNo || '—'}</h2>
                  <p className={styles.clinicSubtitle}>{selectedReport.patientName}</p>
                </div>
              </div>
              <div className={styles.statusBadgeLargeWrapper}>
                <span className={`${styles.statusBadge} ${styles.large} ${getStatusClass(selectedReport.status)}`}>
                  {selectedReport.statusDesc?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <button onClick={closeModal} className={styles.clinicModalClose}>
                ×
              </button>
            </div>

            <div className={styles.detailsModalBody}>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Patient Name</span>
                  <span className={styles.detailValue}>{selectedReport.patientName || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Patient Mobile</span>
                  <span className={styles.detailValue}>{selectedReport.patientMobile || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Patient File Code</span>
                  <span className={styles.detailValue}>{selectedReport.patientFileNo || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Doctor</span>
                  <span className={styles.detailValue}>{selectedReport.doctorFullName || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Doctor Code</span>
                  <span className={styles.detailValue}>{selectedReport.doctorCode || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Clinic</span>
                  <span className={styles.detailValue}>{selectedReport.clinicName || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Branch</span>
                  <span className={styles.detailValue}>{selectedReport.branchName || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Order ID</span>
                  <span className={styles.detailValue}>{selectedReport.orderId || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Consultation ID</span>
                  <span className={styles.detailValue}>{selectedReport.consultationId || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Visit ID</span>
                  <span className={styles.detailValue}>{selectedReport.visitId || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>File ID</span>
                  <span className={styles.detailValue}>{selectedReport.fileId || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Verified By</span>
                  <span className={styles.detailValue}>{selectedReport.verifiedByName || '—'}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Verified Date/Time</span>
                  <span className={styles.detailValue}>{formatDateTime(selectedReport.verifiedDateTime)}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Date Created</span>
                  <span className={styles.detailValue}>{formatDateTime(selectedReport.dateCreated)}</span>
                </div>
                
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Date Modified</span>
                  <span className={styles.detailValue}>{formatDateTime(selectedReport.dateModified)}</span>
                </div>
                
                <div className={`${styles.detailItem} ${styles.fullWidth}`}>
                  <span className={styles.detailLabel}>Remarks</span>
                  <span className={styles.detailValue}>{selectedReport.remarks || '—'}</span>
                </div>
              </div>
            </div>

            <div className={styles.clinicModalFooter}>
              <button onClick={() => handleDeleteClick(selectedReport)} className={styles.btnDelete}>
                <FiTrash2 className={styles.btnIcon} />
                Delete Report
              </button>
              <button onClick={() => handleUpdateClick(selectedReport)} className={styles.btnUpdate}>
                Update Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Delete Confirmation Modal ──────────────── */}
      {deleteConfirm && (
        <div className={styles.clinicModalOverlay} onClick={cancelDelete}>
          <div className={styles.clinicModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.clinicModalHeader}>
              <h2>Confirm Delete</h2>
              <button onClick={cancelDelete} className={styles.clinicModalClose}>
                ×
              </button>
            </div>
            <div className={styles.clinicModalBody}>
              <p>Are you sure you want to delete this lab report?</p>
              <p><strong>File Code:</strong> {deleteConfirm.patientFileNo || '—'}</p>
              <p><strong>Patient:</strong> {deleteConfirm.patientName || '—'}</p>
              <p className={styles.warningText}>This action cannot be undone.</p>
            </div>
            <div className={styles.clinicModalFooter}>
              <button onClick={cancelDelete} className={styles.btnCancel} disabled={deleting}>
                Cancel
              </button>
              <button onClick={confirmDelete} className={styles.btnDeleteConfirm} disabled={deleting}>
                <FiTrash2 className={styles.btnIcon} />
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Update Modal ──────────────── */}
      {showUpdateModal && reportToUpdate && (
        <UpdateLabReport
          report={reportToUpdate}
          onClose={handleCloseUpdateModal}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default LabReportList;