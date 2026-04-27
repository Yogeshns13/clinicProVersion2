// src/components/InvoicePaymentList.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FiSearch, FiDollarSign, FiCreditCard, FiX, FiPrinter, FiDownload, FiCalendar, FiPhone } from 'react-icons/fi';
import { getInvoicePaymentList, updateInvoicePayment } from '../Api/ApiInvoicePayment.js';
import { createInvoiceBillFile } from '../Api/ApiPdf.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './InvoicePaymentManagement.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId, getStoredFileAccessToken } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

const PAYMENT_STATUSES = [
  { id: 1, label: 'Success'  },
  { id: 4, label: 'Refunded' },
  { id: 5, label: 'Reversed' },
];

const PAYMENT_MODES = [
  { id: 1, label: 'Cash'        },
  { id: 2, label: 'Card'        },
  { id: 3, label: 'UPI'         },
  { id: 4, label: 'Net Banking' },
  { id: 5, label: 'Wallet'      },
  { id: 6, label: 'Cheque'      },
  { id: 7, label: 'Insurance'   },
  { id: 8, label: 'Credit'      },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'InvoiceNo',   label: 'Invoice No'    },
  { value: 'PatientName', label: 'Patient Name'  },
];

const getTodayStr = () => new Date().toISOString().split('T')[0];

// ──────────────────────────────────────────────────
// INDEXEDDB PERSISTENCE HELPERS
//
// Persists: { activeColumns: string[], menuOrder: string[] }
// Survives logout → login because IndexedDB is origin-scoped.
// On every toggle / reorder the prefs are written immediately,
// so the "last changes screen" is always restored on next login.
// ──────────────────────────────────────────────────
const IDB_DB_NAME    = 'AppPreferences';
const IDB_STORE_NAME = 'columnPrefs';
const IDB_KEY        = 'invoicePaymentListColPrefs';

const openIDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });

const idbGet = async (key) => {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req   = store.get(key);
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch {
    return undefined;
  }
};

const idbSet = async (key, value) => {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req   = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch {
    // Silently fail — column prefs are non-critical
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic column pool
// ─────────────────────────────────────────────────────────────────────────────
const DYNAMIC_COLS_MAP = {
  invoiceDate:   { id: 'invoiceDate',   label: 'Invoice Date',    header: 'Invoice Date',    icon: <FiCalendar size={15} />, render: (p) => p.invoiceDate   ? new Date(p.invoiceDate).toLocaleDateString('en-IN')  : '—' },
  patientMobile: { id: 'patientMobile', label: 'Patient Mobile',  header: 'Patient Mobile',  icon: <FiPhone    size={15} />, render: (p) => p.patientMobile || '—' },
};

// Slot defaults — shown when the dynamic col for that slot is OFF
// Slot 0 → Mode   (invoiceDate owns this slot by default)
// Slot 1 → Reference
const SLOT_DEFAULTS = [
  {
    // Slot 0 → Mode
    header: 'Mode',
    render: (p) => (
      <div className={styles.paymentModeCell}>
        <FiCreditCard size={16} style={{ color: '#9333ea', marginRight: '6px' }} />
        <span className={styles.paymentModeText}>
          {PAYMENT_MODES.find(m => m.id === p.paymentMode)?.label || 'Unknown'}
        </span>
      </div>
    ),
  },
  {
    // Slot 1 → Reference
    header: 'Reference',
    render: (p) => <span className={styles.paymentRefBadge}>{p.referenceNo || '—'}</span>,
  },
];

// Default order of dynamic cols in the menu
// Index 0 → owns Mode slot      ← invoiceDate starts here
// Index 1 → owns Reference slot ← patientMobile starts here
const INITIAL_ORDER = ['invoiceDate', 'patientMobile'];

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────

const PdfViewerModal = ({ pdfUrl, title, onClose, onDownload }) => {
  const handlePrint = () => {
    const iframe = document.getElementById('invoicePdfViewerIframe');
    if (iframe) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div
      className={styles.pdfModalOverlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={styles.pdfModalContent}>

        {/* Header */}
        <div className={styles.pdfModalHeader}>
          <div className={styles.pdfHeaderLeft}>
            <div className={styles.pdfHeaderIcon}>
              <FiPrinter size={22} />
            </div>
            <div>
              <h2 className={styles.pdfHeaderTitle}>{title}</h2>
              <p className={styles.pdfHeaderSubtitle}>PDF Preview</p>
            </div>
          </div>
          <button className={styles.pdfCloseBtn} onClick={onClose} title="Close">
            <FiX size={20} />
          </button>
        </div>

        {/* Body — iframe */}
        <div className={styles.pdfModalBody}>
          <iframe
            id="invoicePdfViewerIframe"
            src={pdfUrl}
            title={title}
            className={styles.pdfIframe}
          />
        </div>

        {/* Footer */}
        <div className={styles.pdfModalFooter}>
          <button className={styles.pdfBtnPrint} onClick={handlePrint}>
            <FiPrinter size={16} /> Print
          </button>
          <button className={styles.pdfBtnDownload} onClick={onDownload}>
            <FiDownload size={16} /> Download
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const InvoicePaymentList = () => {
  const today = getTodayStr();

  const [payments, setPayments]       = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState(null);

  // ── Dynamic columns state ──
  const [activeColumns, setActiveColumns] = useState(new Set());
  const [menuOrder,     setMenuOrder]     = useState(INITIAL_ORDER);
  // Guard: don't save to IDB until we've loaded from IDB first
  const [prefsLoaded,   setPrefsLoaded]   = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedPayment,   setSelectedPayment]   = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [updateData, setUpdateData]   = useState({ status: '', remarks: '' });

  // PDF state
  const [pdfModal,    setPdfModal]    = useState(null);   // { url, blob, label }
  const [printingId,  setPrintingId]  = useState(null);
  const [printError,  setPrintError]  = useState(null);

  // Filter inputs
  const [filterInputs, setFilterInputs] = useState({
    searchType:  'InvoiceNo',
    searchValue: '',
    paymentMode: 0,
    dateFrom:    today,
    dateTo:      today,
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'InvoiceNo',
    searchValue: '',
    paymentMode: 0,
    dateFrom:    today,
    dateTo:      today,
  });

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

  // ── Update form required-field gating ──────────────────────────────────────
  const updateAllRequiredFilled = updateData.status !== '' && updateData.status !== undefined;

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.paymentMode        !== 0  ||
    appliedFilters.dateFrom           !== today ||
    appliedFilters.dateTo             !== today;

  // ── Load column prefs from IndexedDB on mount ─────────────────────────────
  // This runs once when the component mounts (i.e. after login).
  // It restores whatever the user had last — surviving logout → login.
  useEffect(() => {
    (async () => {
      try {
        const saved = await idbGet(IDB_KEY);
        if (saved) {
          const { activeColumns: savedActive, menuOrder: savedOrder } = saved;
          if (Array.isArray(savedActive)) {
            setActiveColumns(new Set(savedActive));
          }
          if (
            Array.isArray(savedOrder) &&
            savedOrder.length === INITIAL_ORDER.length &&
            savedOrder.every((id) => id in DYNAMIC_COLS_MAP)
          ) {
            setMenuOrder(savedOrder);
          }
        }
      } catch {
        // Use defaults — non-critical
      } finally {
        setPrefsLoaded(true);
      }
    })();
  }, []);

  // ── Save column prefs to IndexedDB whenever they change ──────────────────
  // The prefsLoaded guard prevents overwriting saved prefs with defaults
  // during the initial render before the IDB read completes.
  useEffect(() => {
    if (!prefsLoaded) return;
    idbSet(IDB_KEY, {
      activeColumns: [...activeColumns],
      menuOrder,
    });
  }, [activeColumns, menuOrder, prefsLoaded]);

  // ── tableSlots — exactly mirrors MedicineMasterList logic ─────────────────
  const tableSlots = useMemo(() => {
    return SLOT_DEFAULTS.map((def, slotIdx) => {
      const colId  = menuOrder[slotIdx];
      const dynCol = colId ? DYNAMIC_COLS_MAP[colId] : null;
      if (dynCol && activeColumns.has(colId)) {
        return { header: dynCol.header, render: dynCol.render };
      }
      return { header: def.header, render: def.render };
    });
  }, [activeColumns, menuOrder]);

  const toggleDynCol = useCallback((id) => {
    setActiveColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleMenuReorder = useCallback(
    (newOrderIds) => setMenuOrder(newOrderIds),
    []
  );

  const invoiceMenuItems = menuOrder.map((id) => {
    const col = DYNAMIC_COLS_MAP[id];
    return {
      id:       col.id,
      icon:     col.icon,
      label:    col.label,
      checked:  activeColumns.has(col.id),
      keepOpen: true,
      onClick:  () => toggleDynCol(col.id),
    };
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPayments = async (filters = appliedFilters, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        Page:      currentPage,
        PageSize:  pageSize,
        BranchID:  branchId,
        FromDate:  filters.dateFrom || '',
        ToDate:    filters.dateTo   || '',
      };

      if (filters.searchValue.trim()) {
        if (filters.searchType === 'InvoiceNo')   options.InvoiceNo   = filters.searchValue.trim();
        if (filters.searchType === 'PatientName') options.PatientName = filters.searchValue.trim();
      }

      if (filters.paymentMode !== 0) options.PaymentMode = filters.paymentMode;

      const data = await getInvoicePaymentList(clinicId, options);
      setPayments(data);
      setAllPayments(data);
    } catch (err) {
      setError(err?.status >= 400 ? err : { message: err.message || 'Failed to load payments' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(appliedFilters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const filteredPayments = useMemo(() => {
    return [...allPayments].sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  }, [allPayments]);

  const statistics = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { total, count: filteredPayments.length };
  }, [filteredPayments]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
    fetchPayments(appliedFilters, newPage);
  };

  const startRecord = filteredPayments.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + filteredPayments.length;

  // ── Filter handlers ────────────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    triggerCooldown('search');
    setPage(1);
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    triggerCooldown('clear');
    const defaults = {
      searchType: 'InvoiceNo', searchValue: '',
      paymentMode: 0, dateFrom: today, dateTo: today,
    };
    setPage(1);
    setFilterInputs(defaults);
    setAppliedFilters(defaults);
  };

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const openUpdateModal = (payment) => {
    triggerCooldown(`update-${payment.id}`);
    setSelectedPayment(payment);
    setUpdateData({ status: payment.status.toString(), remarks: payment.remarks || '' });
    setIsUpdateModalOpen(true);
  };

  const closeModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedPayment(null);
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateData(prev => ({ ...prev, [name]: value }));
  };

  // ── Update payment ─────────────────────────────────────────────────────────
  const handleUpdatePayment = async (e) => {
    e.preventDefault();

    if (!updateAllRequiredFilled) {
      showPopup('Please fill all required fields: Payment Status.', 'warning');
      return;
    }

    triggerCooldown('update-submit');

    try {
      setFormLoading(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await updateInvoicePayment({
        clinicId, branchId,
        paymentId: selectedPayment.id,
        status:    Number(updateData.status),
        remarks:   updateData.remarks,
      });
      showPopup('Payment updated successfully!', 'success');
      setTimeout(() => { closeModal(); fetchPayments(); }, 1500);
    } catch (err) {
      showPopup(err.message || 'Failed to update payment.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Print / PDF handlers ───────────────────────────────────────────────────
  const handlePrintInvoice = async (payment) => {
    try {
      setPrintingId(payment.id);
      setPrintError(null);
      const clinicId        = await getStoredClinicId();
      const branchId        = await getStoredBranchId();
      const fileAccessToken = await getStoredFileAccessToken();

      const result = await createInvoiceBillFile(
        branchId,
        payment.invoiceId,
        clinicId,
        fileAccessToken,
        payment.invoiceType,
        2,  // DocType default
        payment.id  // PaymentID
      );

      setPdfModal({
        url:   result.url,
        blob:  result.blob,
        label: `Invoice #${payment.invoiceNo || payment.invoiceId}`,
      });
    } catch (err) {
      setPrintError(err.message || 'Failed to generate invoice PDF');
    } finally {
      setPrintingId(null);
    }
  };

  const handleDownloadInvoice = () => {
    if (!pdfModal) return;
    const a = document.createElement('a');
    a.href     = pdfModal.url;
    a.download = `${pdfModal.label}.pdf`;
    a.click();
  };

  const handleClosePdfModal = () => {
    if (pdfModal?.url) URL.revokeObjectURL(pdfModal.url);
    setPdfModal(null);
  };

  // ── Formatters ─────────────────────────────────────────────────────────────
  const formatCurrency      = (amount)  => amount ? `₹${Number(amount).toFixed(2)}` : '₹0.00';
  const formatDate          = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const getPaymentModeLabel = (mode) => PAYMENT_MODES.find(m => m.id === mode)?.label || 'Unknown';

  const getStatusBadgeClass = (status) => {
    const map = { 1: 'success', 2: 'failed', 3: 'pending', 4: 'refunded', 5: 'cancelled' };
    return `${styles.statusBadge} ${styles[map[status]] || styles.pending}`;
  };
  const getStatusLabel = (status) => PAYMENT_STATUSES.find(s => s.id === status)?.label || 'Unknown';

  // ── Early returns ──────────────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.paymentListLoading}><LoadingPage/></div>;

  const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.paymentWrapper}>
      <ErrorHandler error={error} />

      <Header
        title="Invoice Payment Management"
        menuItems={invoiceMenuItems}
        onMenuReorder={handleMenuReorder}
      />

      {/* ── PDF Viewer Modal ── */}
      {pdfModal && (
        <PdfViewerModal
          pdfUrl={pdfModal.url}
          title={pdfModal.label}
          onClose={handleClosePdfModal}
          onDownload={handleDownloadInvoice}
        />
      )}

      {/* ── Print Error Banner ── */}
      {printError && (
        <div className={styles.printErrorBanner}>
          {printError}
          <button onClick={() => setPrintError(null)} className={styles.printErrorClose}>✕</button>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          <div className={styles.searchGroup}>
            <select name="searchType" value={filterInputs.searchType} onChange={handleFilterChange} className={styles.searchTypeSelect}>
              {SEARCH_TYPE_OPTIONS.map(opt => (
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

          <div className={styles.filterGroup}>
            <select name="paymentMode" value={filterInputs.paymentMode} onChange={handleFilterChange} className={styles.filterInput}>
              <option value={0}>All Modes</option>
              {PAYMENT_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateFrom && <span className={styles.datePlaceholder}>From Date</span>}
              <input type="date" name="dateFrom" value={filterInputs.dateFrom} onChange={handleFilterChange} max={today}
                className={`${styles.filterInput} ${!filterInputs.dateFrom ? styles.dateEmpty : ''}`} />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateTo && <span className={styles.datePlaceholder}>To Date</span>}
              <input type="date" name="dateTo" value={filterInputs.dateTo} onChange={handleFilterChange} max={today}
                className={`${styles.filterInput} ${!filterInputs.dateTo ? styles.dateEmpty : ''}`} />
            </div>
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton} disabled={!!btnCooldown['search']}>
              <FiSearch size={16} /> Search
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton} disabled={!!btnCooldown['clear']}>
                <FiX size={16} /> Clear
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── Table + Pagination ── */}
      <div className={styles.tableSection}>
        <div className={styles.paymentListTableContainer}>
          <table className={styles.paymentListTable}>
            <thead>
              <tr>
                {/* ── Mandatory columns ── */}
                <th>Invoice No</th>
                <th>Patient</th>
                <th>Payment Date</th>

                {/* ── Dynamic slots
                    slot 0 default → Mode       (invoiceDate owns this slot)
                    slot 1 default → Reference  (patientMobile owns this slot)
                ── */}
                {tableSlots.map((slot, i) => <th key={i}>{slot.header}</th>)}

                {/* ── Mandatory columns ── */}
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.paymentListNoData}>
                    {hasActiveFilters ? 'No payments found.' : 'No payments recorded yet.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    {/* ── Mandatory columns ── */}
                    <td><div className={styles.invoiceNoBadge}>{payment.invoiceNo}</div></td>
                    <td>
                      <div className={styles.patientCell}>
                        <div>
                          <div className={styles.patientName}>{payment.patientName}</div>
                          <div className={styles.patientInfo}>{payment.patientFileNo}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={styles.dateText}>{formatDate(payment.paymentDate)}</span></td>

                    {/* ── Dynamic slots ── */}
                    {tableSlots.map((slot, i) => <td key={i}>{slot.render(payment)}</td>)}

                    {/* ── Mandatory columns ── */}
                    <td><span className={`${styles.amountText} ${styles.total}`}>{formatCurrency(payment.amount)}</span></td>
                    <td><span className={getStatusBadgeClass(payment.status)}>{getStatusLabel(payment.status)}</span></td>
                    <td>
                      <div className={styles.paymentActionsCell}>
                        {/* ── Printer Button ── */}
                        <button
                          onClick={() => handlePrintInvoice(payment)}
                          className={styles.paymentPrintBtn}
                          title="Print Invoice"
                          disabled={printingId === payment.id}
                        >
                          {printingId === payment.id ? (
                            <span className={styles.btnSpinner} />
                          ) : (
                            <FiPrinter size={14} />
                          )}
                        </button>

                        {/* ── Update Status Button ── */}
                        <button
                          onClick={() => openUpdateModal(payment)}
                          className={styles.paymentUpdateBtn}
                          title="Update Payment"
                          disabled={!!btnCooldown[`update-${payment.id}`]}
                        >
                          Update Status
                        </button>
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
            {filteredPayments.length > 0 ? `Showing ${startRecord}–${endRecord} records` : 'No records'}
          </div>
          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(1)}        disabled={page === 1 || !!btnCooldown['page-1']}          title="First page">«</button>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page - 1)} disabled={page === 1 || !!btnCooldown[`page-${page - 1}`]} title="Previous page">‹</button>
            <span className={styles.pageIndicator}>{page}</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page + 1)} disabled={filteredPayments.length < pageSize || !!btnCooldown[`page-${page + 1}`]} title="Next page">›</button>
          </div>
          <div className={styles.pageSizeInfo}>Total: <strong>{formatCurrency(statistics.total)}</strong></div>
        </div>
      </div>

      {/* ── Update Payment Modal ── */}
      {isUpdateModalOpen && (
        <div className={styles.paymentModalOverlay}>
          <div className={styles.paymentModal}>
            <div className={styles.paymentModalHeader}>
              <h2>Update Payment Status</h2>
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
                <button onClick={closeModal} className={styles.paymentModalClose} disabled={formLoading}>×</button>
              </div>
            </div>

            <form onSubmit={handleUpdatePayment} noValidate>
              <div className={styles.paymentModalBody}>
                <div className={styles.invoiceHeader}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}><label>Invoice:</label><span>{selectedPayment?.invoiceNo}</span></div>
                    <div className={styles.detailItem}><label>Patient:</label><span>{selectedPayment?.patientName}</span></div>
                    <div className={styles.detailItem}><label>Amount:</label><span>{formatCurrency(selectedPayment?.amount)}</span></div>
                    <div className={styles.detailItem}><label>Mode:</label><span>{getPaymentModeLabel(selectedPayment?.paymentMode)}</span></div>
                    <div className={styles.detailItem}><label>Date:</label><span>{formatDate(selectedPayment?.paymentDate)}</span></div>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Payment Status <span className={styles.required}>*</span></label>
                    <select
                      name="status"
                      value={updateData.status}
                      onChange={handleUpdateInputChange}
                      disabled={formLoading}
                      className={styles.formSelect}
                    >
                      {PAYMENT_STATUSES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Remarks</label>
                    <textarea
                      name="remarks"
                      value={updateData.remarks}
                      onChange={handleUpdateInputChange}
                      placeholder="Add notes about this status update..."
                      rows="3"
                      disabled={formLoading}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.paymentModalFooter}>
                <button type="button" onClick={closeModal} className={styles.btnCancel} disabled={formLoading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={formLoading || !updateAllRequiredFilled || !!btnCooldown['update-submit']}
                  title={!updateAllRequiredFilled ? 'Please select a status to enable this button' : ''}
                >
                  {formLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
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

export default InvoicePaymentList;