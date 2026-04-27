// src/components/ConsultationInvoice/ConsultationInvoice.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { getInvoiceList } from '../Api/ApiInvoicePayment.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './ConsultationInvoice.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';
import { FaClinicMedical } from 'react-icons/fa';

const PAGE_SIZE = 20;

const ConsultationInvoice = () => {
  const navigate = useNavigate();

  // Data States
  const [invoices, setInvoices] = useState([]);

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

  // ── Fetch Invoice List (InvoiceType = 1 for Consultation) ─────────────────
  const fetchInvoices = async (pageNum = page) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        Page:        pageNum,
        PageSize:    PAGE_SIZE,
        BranchID:    branchId,
        InvoiceType: 1,
        PatientName: appliedFilters.searchType === 'patientName' ? appliedFilters.searchValue.trim() : '',
        InvoiceNo:   appliedFilters.searchType === 'invoiceNo'   ? appliedFilters.searchValue.trim() : '',
        FromDate:    appliedFilters.dateFrom || '',
        ToDate:      appliedFilters.dateTo   || '',
      };

      const data = await getInvoiceList(clinicId, options);

      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);
        return dateB - dateA;
      });

      setInvoices(sortedData);
      setHasNext(sortedData.length === PAGE_SIZE);
    } catch (err) {
      console.error('fetchInvoices error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load consultation invoices' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
    setPage(1);
  }, [appliedFilters]);

  // ── Pagination Handlers ────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
    fetchInvoices(newPage);
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
    const emptyFilters = { searchType: 'patientName', searchValue: '', dateFrom: '', dateTo: '' };
    setFilterInputs(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ── View Details ──────────────────────────────────────────────────────────
  const handleViewInvoiceDetails = (invoice) => {
    triggerCooldown(`view-${invoice.id}`);
    setSelectedInvoiceDetail(invoice);
    setIsInvoiceDetailsOpen(true);
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
        <LoadingPage />
      </div>
    );
  }

  // Pagination display values
  const startRecord = invoices.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord   = startRecord + invoices.length - 1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Consultation Invoice Management" />

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
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'patientName' ? 'Patient Name' :
                'Invoice No'
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
                <th>Amount</th>
                <th>Tax (CGST + SGST)</th>
                <th>Net Amount</th>
                <th>Status</th>
                <th>Invoice Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.noData}>
                    {hasActiveFilters
                      ? 'No invoices found matching your search.'
                      : 'No consultation invoices found.'}
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className={styles.tableRow}>
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
                      <div className={styles.amountCell}>
                        <div className={styles.name}>{formatCurrency(invoice.totalAmount)}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.taxCell}>
                        <div className={styles.name}>{formatCurrency((invoice.cgstAmount || 0) + (invoice.sgstAmount || 0))}</div>
                        <div className={styles.subText}>
                          CGST: {formatCurrency(invoice.cgstAmount)} | SGST: {formatCurrency(invoice.sgstAmount)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.netAmountCell}>
                        <div className={styles.name}>{formatCurrency(invoice.netAmount)}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.name}>{invoice.statusDesc}</div>
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
                            disabled={!!btnCooldown[`view-${invoice.id}`]}
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
            {invoices.length > 0
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
      {isInvoiceDetailsOpen && (
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

      {/* ── MessagePopup ── */}
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
  const [btnCooldown, setBtnCooldown] = useState({});
  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };
  
  const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <h2>Invoice Details{invoice ? ` - ${invoice.invoiceNo}` : ''}</h2>
          <div className={styles.headerRight}>
           <div className={styles.addModalHeaderCard}>
                       <div className={styles.clinicInfoIcon}>
                         <FaClinicMedical size={18} />
                       </div>
                       <div className={styles.clinicInfoText}>
                         <span className={styles.clinicInfoName}>{clinicName}</span>
                         <span className={styles.clinicInfoBranch}>{branchName}</span>
                       </div>
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
          {invoice && (
            <>
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
                  <div className={styles.detailItem}>
                    <label>Status:</label>
                    <span>{invoice.statusDesc}</span>
                  </div>
                </div>
              </div>

              {/* Amount Summary Section */}
              <div className={styles.amountSummarySection}>
                <h3>Amount Summary</h3>
                <table className={styles.detailsTable}>
                  <thead>
                    <tr>
                      <th>Total Amount</th>
                      <th>CGST Amount</th>
                      <th>SGST Amount</th>
                      <th>Net Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{formatCurrency(invoice.totalAmount)}</td>
                      <td>{formatCurrency(invoice.cgstAmount)}</td>
                      <td>{formatCurrency(invoice.sgstAmount)}</td>
                      <td><strong>{formatCurrency(invoice.netAmount)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
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

export default ConsultationInvoice;