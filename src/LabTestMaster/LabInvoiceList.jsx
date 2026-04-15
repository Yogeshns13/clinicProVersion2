// src/components/LabWork/LabInvoiceList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiCalendar, FiFilter, FiEye, FiFileText, FiDollarSign, FiDownload, FiPrinter } from 'react-icons/fi';
import { getLabInvoiceDetailList } from '../Api/ApiLabTests.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './LabInvoiceList.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

const PAGE_SIZE = 20;

const LabInvoiceList = () => {
  const navigate = useNavigate();

  // Data States
  const [invoiceDetails, setInvoiceDetails] = useState([]);

  // Filter inputs (not applied until search)
  const [filterInputs, setFilterInputs] = useState({
    searchType:  'patientName',
    searchValue: '',
    dateFrom:    '',
    dateTo:      '',
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'patientName',
    searchValue: '',
    dateFrom:    '',
    dateTo:      '',
  });

  // Pagination
  const [page, setPage]       = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Modal States
  const [isInvoiceDetailsOpen,  setIsInvoiceDetailsOpen]  = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

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

  // ── Derived: are any filters actually active? ──────────────────────────────
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.dateFrom            !== '' ||
    appliedFilters.dateTo              !== '';

  // ── Fetch Lab Invoice Details ──────────────────────────────────────────────
  const fetchInvoiceDetails = async (pageNum = page) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        Page:        pageNum,
        PageSize:    PAGE_SIZE,
        BranchID:    branchId,
        PatientName: appliedFilters.searchType === 'patientName' ? appliedFilters.searchValue.trim() : '',
        InvoiceNo:   appliedFilters.searchType === 'invoiceNo'   ? appliedFilters.searchValue.trim() : '',
        TestName:    appliedFilters.searchType === 'testName'    ? appliedFilters.searchValue.trim() : '',
        FromDate:    appliedFilters.dateFrom || '',
        ToDate:      appliedFilters.dateTo   || '',
      };

      const data = await getLabInvoiceDetailList(clinicId, options);

      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);
        return dateB - dateA;
      });

      setInvoiceDetails(sortedData);
      setHasNext(sortedData.length === PAGE_SIZE);
    } catch (err) {
      console.error('fetchInvoiceDetails error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load lab invoice details' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetails(1);
    setPage(1);
  }, [appliedFilters]);

  // ── Pagination Handlers ────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
    fetchInvoiceDetails(newPage);
  };

  // ── Group invoice details by invoice ──────────────────────────────────────
  const groupedInvoices = useMemo(() => {
    const groups = {};

    invoiceDetails.forEach(detail => {
      const invoiceId = detail.invoiceId;
      if (!groups[invoiceId]) {
        groups[invoiceId] = {
          invoiceId:      detail.invoiceId,
          invoiceNo:      detail.invoiceNo,
          invoiceDate:    detail.invoiceDate,
          patientId:      detail.patientId,
          patientName:    detail.patientName,
          patientMobile:  detail.patientMobile,
          patientFileNo:  detail.patientFileNo,
          clinicName:     detail.clinicName,
          branchName:     detail.branchName,
          dateCreated:    detail.dateCreated,
          details:        [],
          totalAmount:    0,
          totalCgst:      0,
          totalSgst:      0,
          totalNetAmount: 0,
        };
      }

      groups[invoiceId].details.push(detail);
      groups[invoiceId].totalAmount    += detail.amount     || 0;
      groups[invoiceId].totalCgst      += detail.cgstAmount || 0;
      groups[invoiceId].totalSgst      += detail.sgstAmount || 0;
      groups[invoiceId].totalNetAmount += detail.netAmount  || 0;
    });

    return Object.values(groups);
  }, [invoiceDetails]);

  // ── Summary statistics ─────────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    const uniqueInvoices  = new Set(invoiceDetails.map(d => d.invoiceId)).size;
    const totalRevenue    = invoiceDetails.reduce((sum, d) => sum + (d.netAmount || 0), 0);
    const totalTests      = invoiceDetails.length;
    const avgInvoiceValue = uniqueInvoices > 0 ? totalRevenue / uniqueInvoices : 0;
    return { uniqueInvoices, totalRevenue, totalTests, avgInvoiceValue };
  }, [invoiceDetails]);

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
    const emptyFilters = { searchType: 'patientName', searchValue: '', dateFrom: '', dateTo: '' };
    setFilterInputs(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleViewInvoiceDetails = (invoice) => {
    triggerCooldown(`view-${invoice.invoiceId}`);
    setSelectedInvoiceDetail(invoice);
    setIsInvoiceDetailsOpen(true);
  };

  const handlePrintInvoice = (invoice) => {
    triggerCooldown(`print-${invoice.invoiceId}`);
    console.log('Print invoice:', invoice.invoiceNo);
    showPopup(`Print functionality for Invoice ${invoice.invoiceNo} will be implemented.`, 'warning');
  };

  const handleDownloadInvoice = (invoice) => {
    triggerCooldown(`download-${invoice.invoiceId}`);
    console.log('Download invoice:', invoice.invoiceNo);
    showPopup(`Download functionality for Invoice ${invoice.invoiceNo} will be implemented.`, 'warning');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year:  'numeric',
      month: 'short',
      day:   'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading && !isInvoiceDetailsOpen) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <LoadingPage/>
      </div>
    );
  }

  // Pagination display values
  const startRecord = invoiceDetails.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord   = startRecord + invoiceDetails.length - 1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Invoice Management" />

      {/* ── Filters Container ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="patientName">Patient Name</option>
              <option value="invoiceNo">Invoice No</option>
              <option value="testName">Test Name</option>
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'patientName' ? 'Patient Name' :
                filterInputs.searchType === 'invoiceNo'   ? 'Invoice No'   :
                'Test Name'
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
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
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={!!btnCooldown['search']}
            >
              <FiSearch size={18} />
              Search
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={!!btnCooldown['clear']}
              >
                <FiX size={18} />
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
                <th>Invoice Details</th>
                <th>Patient Details</th>
                <th>Tests Count</th>
                <th>Amount</th>
                <th>Tax (CGST + SGST)</th>
                <th>Net Amount</th>
                <th>Invoice Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.noData}>
                    {hasActiveFilters
                      ? 'No invoices found matching your search.'
                      : 'No lab invoices found.'}
                  </td>
                </tr>
              ) : (
                groupedInvoices.map((invoice) => (
                  <tr key={invoice.invoiceId} className={styles.tableRow}>
                    <td>
                      <div>
                        <div className={styles.name}>{invoice.invoiceNo}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {invoice.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{invoice.patientName}</div>
                          <div className={styles.subText}>
                            {invoice.patientFileNo} • {invoice.patientMobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.testCount}>
                        <span className={styles.badge}>{invoice.details.length}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.amountCell}>
                        <div className={styles.name}>{formatCurrency(invoice.totalAmount)}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.taxCell}>
                        <div className={styles.name}>{formatCurrency(invoice.totalCgst + invoice.totalSgst)}</div>
                        <div className={styles.subText}>
                          CGST: {formatCurrency(invoice.totalCgst)} | SGST: {formatCurrency(invoice.totalSgst)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.netAmountCell}>
                        <div className={styles.name}>{formatCurrency(invoice.totalNetAmount)}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <div className={styles.name}>{formatDate(invoice.invoiceDate)}</div>
                        <div className={styles.subText}>
                          {invoice.invoiceDate
                            ? new Date(invoice.invoiceDate).toLocaleTimeString('en-US', {
                                hour:   '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <div className={styles.actionDropdownWrapper}>
                          <button
                            onClick={() => handleViewInvoiceDetails(invoice)}
                            className={styles.actionBtn}
                            title="View Details"
                            disabled={!!btnCooldown[`view-${invoice.invoiceId}`]}
                          >
                            View Details
                          </button>
                        </div>
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
            {invoiceDetails.length > 0
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

      {/* ── Invoice Details Modal ── */}
      {isInvoiceDetailsOpen && selectedInvoiceDetail && (
        <InvoiceDetailsModal
          invoice={selectedInvoiceDetail}
          onClose={() => {
            setIsInvoiceDetailsOpen(false);
            setSelectedInvoiceDetail(null);
          }}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
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

// ──────────────────────────────────────────────────
// Invoice Details Modal Component
// ──────────────────────────────────────────────────
const InvoiceDetailsModal = ({ invoice, onClose, formatCurrency, formatDate }) => {
  // ── Button cooldown state (2-sec disable) ──
  const [btnCooldown, setBtnCooldown] = useState({});
  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <h2>Invoice Details - {invoice.invoiceNo}</h2>
          <div className={styles.headerRight}>
            <div className={styles.clinicNameone}>
              <FaClinicMedical size={18} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
              {localStorage.getItem('clinicName') || '—'}
            </div>
            <button
              onClick={() => { triggerCooldown('close'); onClose(); }}
              className={styles.closeBtn}
              disabled={!!btnCooldown['close']}
            >
              ×
            </button>
          </div>
        </div>

        <div className={styles.modalBody}>
          {/* Invoice Header Info */}
          <div className={styles.invoiceHeader}>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <label>Invoice No:</label>
                <span>{invoice.invoiceNo}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Invoice Date:</label>
                <span>{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Patient Name:</label>
                <span>{invoice.patientName}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Patient File No:</label>
                <span>{invoice.patientFileNo}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Patient Mobile:</label>
                <span>{invoice.patientMobile}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Clinic:</label>
                <span>{invoice.clinicName}</span>
              </div>
              <div className={styles.detailItem}>
                <label>Branch:</label>
                <span>{invoice.branchName}</span>
              </div>
            </div>
          </div>

          {/* Test Details Table */}
          <div className={styles.testDetailsSection}>
            <h3>Test Details</h3>
            <table className={styles.detailsTable}>
              <thead>
                <tr>
                  <th>Test Name</th>
                  <th>Amount</th>
                  <th>CGST %</th>
                  <th>CGST Amt</th>
                  <th>SGST %</th>
                  <th>SGST Amt</th>
                  <th>Net Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.details.map((detail, index) => (
                  <tr key={index}>
                    <td>
                      <div>
                        <div className={styles.testName}>{detail.testName}</div>
                        {detail.masterTestName && (
                          <div className={styles.masterTestName}>{detail.masterTestName}</div>
                        )}
                      </div>
                    </td>
                    <td>{formatCurrency(detail.amount)}</td>
                    <td>{detail.cgstPercentage ? `${detail.cgstPercentage}%` : '—'}</td>
                    <td>{formatCurrency(detail.cgstAmount)}</td>
                    <td>{detail.sgstPercentage ? `${detail.sgstPercentage}%` : '—'}</td>
                    <td>{formatCurrency(detail.sgstAmount)}</td>
                    <td><strong>{formatCurrency(detail.netAmount)}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.totalRow}>
                  <td><strong>Total</strong></td>
                  <td><strong>{formatCurrency(invoice.totalAmount)}</strong></td>
                  <td>—</td>
                  <td><strong>{formatCurrency(invoice.totalCgst)}</strong></td>
                  <td>—</td>
                  <td><strong>{formatCurrency(invoice.totalSgst)}</strong></td>
                  <td><strong>{formatCurrency(invoice.totalNetAmount)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            onClick={() => { triggerCooldown('modal-close'); onClose(); }}
            className={styles.cancelBtn}
            disabled={!!btnCooldown['modal-close']}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabInvoiceList;