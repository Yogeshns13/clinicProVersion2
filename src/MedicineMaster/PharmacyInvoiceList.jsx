// src/components/Pharmacy/PharmacyInvoiceList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiCalendar, FiFilter, FiEye, FiFileText, FiDollarSign, FiDownload, FiPrinter, FiPackage } from 'react-icons/fi';
import { getPharmacyInvoiceDetailList } from '../Api/ApiPharmacy.js';
import { getInvoiceList } from '../Api/ApiInvoicePayment.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './PharmacyInvoiceList.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

const SEARCH_TYPE_OPTIONS = [
  { value: 'customerName', label: 'Customer Name' },
  { value: 'invoiceNo',    label: 'Invoice No'    },
];

const PAGE_SIZE = 20;

const PharmacyInvoiceList = () => {
  const navigate = useNavigate();

  // Data States
  const [invoices, setInvoices] = useState([]);

  // Pagination
  const [page, setPage]       = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // Filter inputs (staged — not applied until Search is clicked)
  const [filterInputs, setFilterInputs] = useState({
    searchType:  'customerName',
    searchValue: '',
    dateFrom:    '',
    dateTo:      '',
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'customerName',
    searchValue: '',
    dateFrom:    '',
    dateTo:      '',
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Modal States
  const [isInvoiceDetailsOpen,  setIsInvoiceDetailsOpen]  = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);
  const [detailsLoading,        setDetailsLoading]        = useState(false);
  const [detailsError,          setDetailsError]          = useState(null);

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

  // ── Fetch Invoice List (InvoiceType = 3 for Pharmacy) ──────────────────────
  const fetchInvoices = async (pageNum = page) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        Page:         pageNum,
        PageSize:     PAGE_SIZE,
        BranchID:     branchId,
        InvoiceType:  3,
        PatientName:  appliedFilters.searchType === 'customerName' ? appliedFilters.searchValue.trim() : '',
        InvoiceNo:    appliedFilters.searchType === 'invoiceNo'    ? appliedFilters.searchValue.trim() : '',
        FromDate:     appliedFilters.dateFrom || '',
        ToDate:       appliedFilters.dateTo   || '',
      };

      const data = await getInvoiceList(clinicId, options);

      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.invoiceDate);
        const dateB = new Date(b.invoiceDate);
        return dateB - dateA;
      });

      setInvoices(sortedData);
      setHasNext(sortedData.length === PAGE_SIZE);
    } catch (err) {
      console.error('fetchInvoices error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load pharmacy invoices' }
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

  // ── Summary statistics ─────────────────────────────────────────────────────
  const summaryStats = useMemo(() => {
    const totalRevenue    = invoices.reduce((sum, inv) => sum + (inv.netAmount || 0), 0);
    const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;
    return { uniqueInvoices: invoices.length, totalRevenue, avgInvoiceValue };
  }, [invoices]);

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.dateFrom            !== '' ||
    appliedFilters.dateTo              !== '';

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
    const empty = { searchType: 'customerName', searchValue: '', dateFrom: '', dateTo: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  // ── View Details: fetch detail lines for this specific invoice ─────────────
  const handleViewInvoiceDetails = async (invoice) => {
    triggerCooldown(`view-${invoice.id}`);
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      setIsInvoiceDetailsOpen(true);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const details = await getPharmacyInvoiceDetailList(clinicId, {
        BranchID:  branchId,
        InvoiceID: invoice.id,
        Page:      1,
        PageSize:  100,
      });

      // Aggregate totals from detail lines
      const totalQuantity  = details.reduce((s, d) => s + (d.quantity        || 0), 0);
      const totalAmount    = details.reduce((s, d) => s + (d.amount          || 0), 0);
      const totalCgst      = details.reduce((s, d) => s + (d.cgstAmount      || 0), 0);
      const totalSgst      = details.reduce((s, d) => s + (d.sgstAmount      || 0), 0);
      const totalNetAmount = details.reduce((s, d) => s + (d.totalLineAmount || 0), 0);

      setSelectedInvoiceDetail({
        invoiceId:     invoice.id,
        invoiceNo:     invoice.invoiceNo,
        invoiceDate:   invoice.invoiceDate,
        patientId:     invoice.patientId,
        customerName:  invoice.patientName,
        patientMobile: invoice.patientMobile,
        patientFileNo: invoice.patientFileNo,
        clinicName:    invoice.clinicName,
        branchName:    invoice.branchName,
        details,
        totalQuantity,
        totalAmount,
        totalCgst,
        totalSgst,
        totalNetAmount,
      });
    } catch (err) {
      console.error('fetchInvoiceDetails error:', err);
      setDetailsError({ message: err.message || 'Failed to load invoice details' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePrintInvoice = (invoice) => {
    triggerCooldown(`print-${invoice.id}`);
    console.log('Print invoice:', invoice.invoiceNo);
    showPopup(`Print functionality for Invoice ${invoice.invoiceNo} will be implemented.`, 'warning');
  };

  const handleDownloadInvoice = (invoice) => {
    triggerCooldown(`download-${invoice.id}`);
    console.log('Download invoice:', invoice.invoiceNo);
    showPopup(`Download functionality for Invoice ${invoice.invoiceNo} will be implemented.`, 'warning');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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

  const startRecord = invoices.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord   = startRecord + invoices.length - 1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Pharmacy Invoice Management" />

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
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${SEARCH_TYPE_OPTIONS.find(o => o.value === filterInputs.searchType)?.label || ''}`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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

          <div className={styles.filterActions}>
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={!!btnCooldown['search']}
            >
              <FiSearch size={16} />
              Search
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={!!btnCooldown['clear']}
              >
                <FiX size={16} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Invoices Table + Pagination ── */}
      <div className={styles.tableSection}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Customer Details</th>
                <th>Amount</th>
                <th>Discount</th>
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
                  <td colSpan={9} className={styles.noData}>
                    {hasActiveFilters
                      ? 'No invoices found matching your search.'
                      : 'No pharmacy invoices found.'}
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.name}>{invoice.invoiceNo}</div>
                    </td>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {invoice.patientName?.charAt(0).toUpperCase() || 'C'}
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
                      <div className={styles.name}>{formatCurrency(invoice.discount)}</div>
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
                            className={styles.actionBtn}
                            onClick={() => handleViewInvoiceDetails(invoice)}
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
          loading={detailsLoading}
          error={detailsError}
          onClose={() => {
            setIsInvoiceDetailsOpen(false);
            setSelectedInvoiceDetail(null);
            setDetailsError(null);
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
const InvoiceDetailsModal = ({ invoice, loading, error, onClose, formatCurrency, formatDate }) => {
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
          <h2>Invoice Details{invoice ? ` - ${invoice.invoiceNo}` : ''}</h2>

          <div className={styles.headerRight}>
            <div className={styles.clinicNameone}>
              <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
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
          {/* Loading state */}
          {loading && (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <p>Loading invoice details...</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className={styles.errorMessage}>
              {error.message || 'Failed to load invoice details.'}
            </div>
          )}

          {/* Content */}
          {!loading && !error && invoice && (
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
                    <label>Customer Name:</label>
                    <span>{invoice.customerName}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>File No:</label>
                    <span>{invoice.patientFileNo}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Mobile:</label>
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

              {/* Medicine Details Table */}
              <div className={styles.medicineDetailsSection}>
                <h3>Medicine Details</h3>
                <table className={styles.detailsTable}>
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Batch No</th>
                      <th>Expiry</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Amount</th>
                      <th>CGST</th>
                      <th>SGST</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.details.map((detail, index) => (
                      <tr key={index}>
                        <td>
                          <div>
                            <div className={styles.medicineName}>{detail.medicineName}</div>
                            {detail.genericName && (
                              <div className={styles.genericName}>{detail.genericName}</div>
                            )}
                            {detail.manufacturer && (
                              <div className={styles.manufacturer}>Mfr: {detail.manufacturer}</div>
                            )}
                          </div>
                        </td>
                        <td>{detail.batchNo || '—'}</td>
                        <td>{formatDate(detail.expiryDate)}</td>
                        <td><strong>{detail.quantity}</strong></td>
                        <td>{formatCurrency(detail.unitPrice)}</td>
                        <td>{formatCurrency(detail.amount)}</td>
                        <td>
                          <div>
                            <div>{detail.cgstPercentage ? `${detail.cgstPercentage}%` : '—'}</div>
                            <div className={styles.taxAmount}>{formatCurrency(detail.cgstAmount)}</div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div>{detail.sgstPercentage ? `${detail.sgstPercentage}%` : '—'}</div>
                            <div className={styles.taxAmount}>{formatCurrency(detail.sgstAmount)}</div>
                          </div>
                        </td>
                        <td><strong>{formatCurrency(detail.totalLineAmount)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className={styles.totalRow}>
                      <td colSpan="3"><strong>Total</strong></td>
                      <td><strong>{invoice.totalQuantity}</strong></td>
                      <td>—</td>
                      <td><strong>{formatCurrency(invoice.totalAmount)}</strong></td>
                      <td><strong>{formatCurrency(invoice.totalCgst)}</strong></td>
                      <td><strong>{formatCurrency(invoice.totalSgst)}</strong></td>
                      <td><strong>{formatCurrency(invoice.totalNetAmount)}</strong></td>
                    </tr>
                  </tfoot>
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

export default PharmacyInvoiceList;