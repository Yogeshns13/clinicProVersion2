// src/components/InvoiceList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiFileText, FiDollarSign, FiCalendar, FiUser, FiX, FiMoreVertical, FiEye } from 'react-icons/fi';
import { getInvoiceList, cancelInvoice, addInvoicePayment } from '../Api/ApiInvoicePayment.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import ConfirmPopup from '../Hooks/ConfirmPopup.jsx';
import ViewInvoice from './ViewInvoice.jsx';
import styles from './InvoiceManagement.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

const INVOICE_STATUSES = [
  { id: 1, label: 'Draft'          },
  { id: 2, label: 'Issued'         },
  { id: 3, label: 'Paid'           },
  { id: 4, label: 'Partially Paid' },
  { id: 5, label: 'Cancelled'      },
  { id: 6, label: 'Refunded'       },
  { id: 7, label: 'Credit Note'    },
];

const INVOICE_TYPES = [
  { id: 1, label: 'Consultation' },
  { id: 2, label: 'Lab'          },
  { id: 3, label: 'Pharmacy'     },
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

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'paymentDate': {
      if (!value || value === '') return 'Payment date is required';
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate > today) return 'Payment date cannot be in the future';
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setHours(0, 0, 0, 0);
      if (selectedDate < oneYearAgo) return 'Payment date cannot be more than 1 year old';
      return '';
    }
    case 'amount': {
      if (!value || value === '') return 'Amount is required';
      const amount = Number(value);
      if (isNaN(amount))      return 'Must be a valid number';
      if (amount <= 0)        return 'Amount must be greater than zero';
      if (amount > 10000000)  return 'Amount cannot exceed ₹1,00,00,000';
      return '';
    }
    case 'referenceNo':
      if (!value || value === '') return '';
      if (value.trim().length < 3)  return 'Reference number must be at least 3 characters';
      if (value.trim().length > 50) return 'Reference number must not exceed 50 characters';
      return '';
    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'amount': {
      if (value === '') return value;
      const numFiltered = value.replace(/[^0-9.]/g, '');
      const parts = numFiltered.split('.');
      if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
      if (parts.length === 2 && parts[1].length > 2) return parts[0] + '.' + parts[1].substring(0, 2);
      return numFiltered;
    }
    case 'referenceNo':
      return value.replace(/[^a-zA-Z0-9\-_\s]/g, '');
    default:
      return value;
  }
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices]       = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);

  const today = getTodayStr();

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [filterInputs, setFilterInputs] = useState({
    searchType:  'InvoiceNo',
    searchValue: '',
    patientName: '',
    status:      -1,
    invoiceType: 0,
    dateFrom:    today,
    dateTo:      today,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'InvoiceNo',
    searchValue: '',
    patientName: '',
    status:      -1,
    invoiceType: 0,
    dateFrom:    today,
    dateTo:      today,
  });

  const [loading, setLoading]             = useState(true);
  const [error,   setError]               = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen,    setIsViewModalOpen]    = useState(false);
  const [selectedInvoice,    setSelectedInvoice]    = useState(null);
  const [formLoading, setFormLoading]     = useState(false);
  const [paymentData, setPaymentData] = useState({
    paymentDate: today,
    paymentMode: '',
    amount:      '',
    referenceNo: '',
    remarks:     '',
  });
  const [activeDropdown, setActiveDropdown]         = useState(null);
  const [validationMessages, setValidationMessages] = useState({});
  const [confirmCancel, setConfirmCancel]           = useState(null); // invoice to cancel

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

  // ── Payment form required-field gating ─────────────────────────────────────
  // Enabled only when paymentDate, paymentMode and amount are filled
  const paymentAllRequiredFilled =
    paymentData.paymentDate.trim().length > 0 &&
    paymentData.paymentMode !== ''           &&
    paymentData.amount.trim().length > 0     &&
    Number(paymentData.amount) > 0;

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.patientName.trim() !== '' ||
    appliedFilters.status      !== -1 ||
    appliedFilters.invoiceType !== 0  ||
    appliedFilters.dateFrom    !== today ||
    appliedFilters.dateTo      !== today;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchInvoices = async (filters = appliedFilters, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        Page:      currentPage,
        PageSize:  pageSize,
        BranchID:  branchId,
        FromDate:  filters.dateFrom || today,
        ToDate:    filters.dateTo   || today,
      };
      if (filters.patientName.trim()) options.PatientName = filters.patientName.trim();
      if (filters.status !== -1)      options.Status      = filters.status;
      if (filters.invoiceType !== 0)  options.InvoiceType = filters.invoiceType;

      const data = await getInvoiceList(clinicId, options);
      setInvoices(data);
      setAllInvoices(data);
    } catch (err) {
      setError(err?.status >= 400 ? err : { message: err.message || 'Failed to load invoices' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(appliedFilters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.invoiceActionsDropdown}`)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ── Client-side filter ─────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    let filtered = allInvoices;
    if (appliedFilters.searchValue.trim()) {
      const term = appliedFilters.searchValue.toLowerCase();
      filtered = allInvoices.filter(inv => {
        if (appliedFilters.searchType === 'InvoiceNo') return inv.invoiceNo?.toLowerCase().includes(term);
        if (appliedFilters.searchType === 'Patient')   return inv.patientName?.toLowerCase().includes(term);
        if (appliedFilters.searchType === 'Mobile')    return inv.patientMobile?.toLowerCase().includes(term);
        if (appliedFilters.searchType === 'FileNo')    return inv.patientFileNo?.toLowerCase().includes(term);
        return false;
      });
    }
    return filtered.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  }, [allInvoices, appliedFilters.searchValue, appliedFilters.searchType]);

  const statistics = useMemo(() => {
    const total     = filteredInvoices.reduce((sum, inv) => sum + (inv.netAmount || 0), 0);
    const paid      = filteredInvoices.filter(inv => inv.status === 3).length;
    const pending   = filteredInvoices.filter(inv => inv.status === 2).length;
    const cancelled = filteredInvoices.filter(inv => inv.status === 5).length;
    return { total, paid, pending, cancelled, count: filteredInvoices.length };
  }, [filteredInvoices]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
    fetchInvoices(appliedFilters, newPage);
  };

  const startRecord = filteredInvoices.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + filteredInvoices.length;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const calculateBalanceAmount = (netAmount, paidAmount) => {
    return (Number(netAmount) || 0) - (Number(paidAmount) || 0);
  };

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
      searchType: 'InvoiceNo', searchValue: '', patientName: '',
      status: -1, invoiceType: 0, dateFrom: today, dateTo: today,
    };
    setPage(1);
    setFilterInputs(defaults);
    setAppliedFilters(defaults);
  };

  // ── Dropdown ───────────────────────────────────────────────────────────────
  const toggleDropdown = (invoiceId, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === invoiceId ? null : invoiceId);
  };

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const openViewModal = (invoice) => {
    triggerCooldown(`view-${invoice.id}`);
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
    setActiveDropdown(null);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedInvoice(null);
  };

  const openPaymentModal = (invoice) => {
    const balanceAmount = calculateBalanceAmount(invoice.netAmount, invoice.paidAmount);
    setSelectedInvoice(invoice);
    setPaymentData({
      paymentDate: today,
      paymentMode: '',
      amount:      balanceAmount > 0 ? balanceAmount.toString() : invoice.netAmount?.toString() || '',
      referenceNo: '',
      remarks:     '',
    });
    setValidationMessages({});
    setIsPaymentModalOpen(true);
    setActiveDropdown(null);
  };

  const closeModals = () => {
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
    setValidationMessages({});
  };

  // ── Payment input handler ──────────────────────────────────────────────────
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    setPaymentData(prev => ({ ...prev, [name]: filteredValue }));
    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages(prev => ({ ...prev, [name]: validationMessage }));
  };

  // ── Add payment ────────────────────────────────────────────────────────────
  const handleAddPayment = async (e) => {
    e.preventDefault();

    // Guard: required fields
    if (!paymentAllRequiredFilled) {
      const missing = [];
      if (!paymentData.paymentDate)                            missing.push('Payment Date');
      if (!paymentData.paymentMode)                            missing.push('Payment Mode');
      if (!paymentData.amount || Number(paymentData.amount) <= 0) missing.push('Amount');
      showPopup(`Please fill all required fields: ${missing.join(', ')}.`, 'warning');
      return;
    }

    // Additional validations
    const paymentDateValidation = getLiveValidationMessage('paymentDate', paymentData.paymentDate);
    if (paymentDateValidation) { showPopup(paymentDateValidation, 'warning'); return; }

    const amountValidation = getLiveValidationMessage('amount', paymentData.amount);
    if (amountValidation) { showPopup(amountValidation, 'warning'); return; }

    if ([3, 4, 7].includes(Number(paymentData.paymentMode)) && paymentData.referenceNo) {
      const refValidation = getLiveValidationMessage('referenceNo', paymentData.referenceNo);
      if (refValidation) { showPopup(refValidation, 'warning'); return; }
    }

    triggerCooldown('payment-submit');

    try {
      setFormLoading(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await addInvoicePayment({
        clinicId, branchId,
        invoiceId:   selectedInvoice.id,
        paymentDate: paymentData.paymentDate,
        paymentMode: Number(paymentData.paymentMode),
        amount:      Number(paymentData.amount),
        referenceNo: paymentData.referenceNo,
        remarks:     paymentData.remarks,
      });
      showPopup('Payment recorded successfully!', 'success');
      setTimeout(() => { closeModals(); fetchInvoices(); }, 1500);
    } catch (err) {
      showPopup(err.message || 'Failed to record payment.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Cancel invoice ─────────────────────────────────────────────────────────
  const handleCancelInvoice = (invoice) => {
    triggerCooldown(`cancel-${invoice.id}`);
    setActiveDropdown(null);
    setConfirmCancel(invoice);
  };

  const handleConfirmCancelInvoice = async () => {
    if (!confirmCancel) return;
    const invoice = confirmCancel;
    setConfirmCancel(null);
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await cancelInvoice(invoice.id, clinicId, branchId);
      showPopup(`Invoice ${invoice.invoiceNo} cancelled successfully!`, 'success');
      fetchInvoices();
    } catch (err) {
      showPopup(err.message || 'Failed to cancel invoice.', 'error');
    }
  };

  // ── Formatters ─────────────────────────────────────────────────────────────
  const formatCurrency = (amount) => amount ? `₹${Number(amount).toFixed(2)}` : '₹0.00';
  const formatDate     = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = { 1: 'draft', 2: 'issued', 3: 'paid', 4: 'partial', 5: 'cancelled', 6: 'refunded', 7: 'credit' };
    return `${styles.statusBadge} ${styles[statusMap[status]] || styles.draft}`;
  };

  const getStatusLabel = (status) => {
    const statusObj = INVOICE_STATUSES.find(s => s.id === status);
    return statusObj?.label || 'Unknown';
  };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.invoiceLoading}><LoadingPage/></div>;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.invoiceListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Invoice Management" />

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
              <option value="InvoiceNo">Invoice No</option>
              <option value="Patient">Patient</option>
              <option value="Mobile">Mobile</option>
              <option value="FileNo">File No</option>
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'InvoiceNo' ? 'Invoice No'   :
                filterInputs.searchType === 'Patient'   ? 'Patient Name' :
                filterInputs.searchType === 'Mobile'    ? 'Mobile'       : 'File No'}`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select name="invoiceType" value={filterInputs.invoiceType} onChange={handleFilterChange} className={styles.filterInput}>
              <option value={0}>All Types</option>
              {INVOICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select name="status" value={filterInputs.status} onChange={handleFilterChange} className={styles.filterInput}>
              <option value={-1}>All Status</option>
              {INVOICE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
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
        <div className={styles.invoiceTableContainer}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Patient</th>
                <th>Invoice Date</th>
                <th>Net Amount</th>
                <th>Paid Amount</th>
                <th>Balance Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.invoiceNoData}>
                    {hasActiveFilters ? 'No invoices found.' : 'No invoices for today.'}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const balanceAmount = calculateBalanceAmount(invoice.netAmount, invoice.paidAmount);
                  return (
                    <tr key={invoice.id}>
                      <td><div className={styles.invoiceNoBadge}>{invoice.invoiceNo}</div></td>
                      <td>
                        <div className={styles.patientCell}>
                          <FiUser size={16} className={styles.patientIcon} />
                          <div>
                            <div className={styles.patientName}>{invoice.patientName}</div>
                            <div className={styles.patientInfo}>{invoice.patientFileNo}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={styles.dateText}>{formatDate(invoice.invoiceDate)}</span></td>
                      <td><span className={`${styles.amountText} ${styles.total}`}>{formatCurrency(invoice.netAmount)}</span></td>
                      <td><span className={styles.discountText}>{formatCurrency(invoice.paidAmount)}</span></td>
                      <td><span className={styles.amountText}>{formatCurrency(balanceAmount)}</span></td>
                      <td><span className={getStatusBadgeClass(invoice.status)}>{getStatusLabel(invoice.status)}</span></td>
                      <td>
                        <div className={styles.invoiceActionsCell}>
                          <button
                            onClick={() => openViewModal(invoice)}
                            className={styles.invoiceViewBtn}
                            title="View Details"
                            disabled={!!btnCooldown[`view-${invoice.id}`]}
                          >
                            Details
                          </button>
                          <div className={styles.invoiceActionsDropdown}>
                            {invoice.status !== 5 && (
                              <button
                                onClick={(e) => toggleDropdown(invoice.id, e)}
                                className={styles.invoiceActionsBtn}
                                title="Actions"
                              >
                                <FiMoreVertical size={18} />
                              </button>
                            )}
                            {activeDropdown === invoice.id && (
                              <div className={styles.invoiceDropdownMenu}>
                                {invoice.status !== 3 && invoice.status !== 5 && (
                                  <button
                                    onClick={() => openPaymentModal(invoice)}
                                    className={`${styles.invoiceDropdownItem} ${styles.payment}`}
                                  >
                                    <FiDollarSign size={16} /> Add Payment
                                  </button>
                                )}
                                {invoice.status !== 5 && (
                                  <button
                                    onClick={() => handleCancelInvoice(invoice)}
                                    className={`${styles.invoiceDropdownItem} ${styles.cancel}`}
                                    disabled={!!btnCooldown[`cancel-${invoice.id}`]}
                                  >
                                    <FiX size={16} /> Cancel Invoice
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Bar ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {filteredInvoices.length > 0 ? `Showing ${startRecord}–${endRecord} records` : 'No records'}
          </div>
          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(1)}        disabled={page === 1 || !!btnCooldown['page-1']}          title="First page">«</button>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page - 1)} disabled={page === 1 || !!btnCooldown[`page-${page - 1}`]} title="Previous page">‹</button>
            <span className={styles.pageIndicator}>{page}</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page + 1)} disabled={filteredInvoices.length < pageSize || !!btnCooldown[`page-${page + 1}`]} title="Next page">›</button>
          </div>
          <div className={styles.pageSizeInfo}>Total: <strong>{formatCurrency(statistics.total)}</strong></div>
        </div>
      </div>

      {/* ── View Invoice Modal ── */}
      <ViewInvoice
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        invoiceId={selectedInvoice?.id}
      />

      {/* ── Add Payment Modal ── */}
      {isPaymentModalOpen && (
        <div className={styles.invoiceModalOverlay}>
          <div className={styles.invoiceModal}>
            <div className={styles.invoiceModalHeader}>
              <h2>Add Payment</h2>
              <button onClick={closeModals} className={styles.invoiceModalClose} disabled={formLoading}>×</button>
            </div>
            <form onSubmit={handleAddPayment} noValidate>
              <div className={styles.invoiceModalBody}>
                <div className={styles.invoiceHeader}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                      <label>Invoice:</label>
                      <span>{selectedInvoice?.invoiceNo}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Patient:</label>
                      <span>{selectedInvoice?.patientName}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Total:</label>
                      <span>{formatCurrency(selectedInvoice?.netAmount)}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Balance:</label>
                      <span>{formatCurrency(calculateBalanceAmount(selectedInvoice?.netAmount, selectedInvoice?.paidAmount))}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Payment Date <span className={styles.required}>*</span></label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={paymentData.paymentDate}
                      onChange={handlePaymentInputChange}
                      max={today}
                      disabled={formLoading}
                    />
                    {validationMessages.paymentDate && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validationMessages.paymentDate}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Payment Mode <span className={styles.required}>*</span></label>
                    <select
                      name="paymentMode"
                      value={paymentData.paymentMode}
                      onChange={handlePaymentInputChange}
                      disabled={formLoading}
                      className={styles.formSelect}
                    >
                      <option value="">Select mode</option>
                      {PAYMENT_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Amount (₹) <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      name="amount"
                      value={paymentData.amount}
                      onChange={handlePaymentInputChange}
                      placeholder="0.00"
                      disabled={formLoading}
                    />
                    {validationMessages.amount && (
                      <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validationMessages.amount}
                      </span>
                    )}
                  </div>

                  {[3, 4, 7].includes(Number(paymentData.paymentMode)) && (
                    <div className={styles.formGroup}>
                      <label>Reference No</label>
                      <input
                        type="text"
                        name="referenceNo"
                        value={paymentData.referenceNo}
                        onChange={handlePaymentInputChange}
                        placeholder="Transaction ID / Ref No"
                        disabled={formLoading}
                        maxLength="50"
                      />
                      {validationMessages.referenceNo && (
                        <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          {validationMessages.referenceNo}
                        </span>
                      )}
                    </div>
                  )}

                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Remarks</label>
                    <textarea
                      name="remarks"
                      value={paymentData.remarks}
                      onChange={handlePaymentInputChange}
                      placeholder="Additional notes..."
                      rows="3"
                      disabled={formLoading}
                      maxLength="500"
                    />
                  </div>
                </div>
              </div>

              <div className={styles.invoiceModalFooter}>
                <button type="button" onClick={closeModals} className={styles.btnCancel} disabled={formLoading}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={formLoading || !!btnCooldown['payment-submit']}
                  title={!paymentAllRequiredFilled ? 'Please fill all required fields to enable this button' : ''}
                >
                  {formLoading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Cancel Invoice Popup ── */}
      <ConfirmPopup
        visible={!!confirmCancel}
        message={`Cancel Invoice ${confirmCancel?.invoiceNo}?`}
        subMessage="This action cannot be undone. The invoice will be marked as cancelled."
        confirmLabel="Yes, Cancel Invoice"
        cancelLabel="Keep Invoice"
        onConfirm={handleConfirmCancelInvoice}
        onCancel={() => setConfirmCancel(null)}
      />

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

export default InvoiceList;