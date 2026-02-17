// src/components/InvoiceList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiFileText, FiDollarSign, FiCalendar, FiUser, FiX, FiMoreVertical, FiEye } from 'react-icons/fi';
import { getInvoiceList, cancelInvoice, addInvoicePayment } from '../api/api-invoicePayment.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import ViewInvoice from './ViewInvoice.jsx';
import styles from './InvoiceManagement.module.css';

const INVOICE_STATUSES = [
  { id: 1, label: 'Draft' },
  { id: 2, label: 'Issued' },
  { id: 3, label: 'Paid' },
  { id: 4, label: 'Partially Paid' },
  { id: 5, label: 'Cancelled' },
  { id: 6, label: 'Refunded' },
  { id: 7, label: 'Credit Note' }
];

const INVOICE_TYPES = [
  { id: 1, label: 'Consultation' },
  { id: 2, label: 'Lab' },
  { id: 3, label: 'Pharmacy' }
];

const PAYMENT_MODES = [
  { id: 1, label: 'Cash' },
  { id: 2, label: 'Card' },
  { id: 3, label: 'UPI' },
  { id: 4, label: 'Net Banking' },
  { id: 5, label: 'Wallet' },
  { id: 6, label: 'Cheque' },
  { id: 7, label: 'Insurance' },
  { id: 8, label: 'Credit' }
];


const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'paymentDate':
      if (!value || value === '') return 'Payment date is required';
      
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        return 'Payment date cannot be in the future';
      }
      
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      oneYearAgo.setHours(0, 0, 0, 0);
      
      if (selectedDate < oneYearAgo) {
        return 'Payment date cannot be more than 1 year old';
      }
      
      return '';

    case 'amount':
      if (!value || value === '') return 'Amount is required';
      const amount = Number(value);
      if (isNaN(amount)) return 'Must be a valid number';
      if (amount <= 0) return 'Amount must be greater than zero';
      if (amount > 10000000) return 'Amount cannot exceed ₹1,00,00,000';
      return '';

    case 'referenceNo':
      if (!value || value === '') return ''; 
      if (value.trim().length < 3) return 'Reference number must be at least 3 characters';
      if (value.trim().length > 50) return 'Reference number must not exceed 50 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'amount':
      
      if (value === '') return value;
      const numFiltered = value.replace(/[^0-9.]/g, '');

      const parts = numFiltered.split('.');
      if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts.length === 2 && parts[1].length > 2) {
        return parts[0] + '.' + parts[1].substring(0, 2);
      }
      return numFiltered;
    
    case 'referenceNo':
      return value.replace(/[^a-zA-Z0-9\-_\s]/g, '');
    
    default:
      return value;
  }
};

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState();
  const [toDate, setToDate] = useState();
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(-1);
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState({ patientName: '', status: -1, invoiceType: 0 });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: '',
    amount: '',
    referenceNo: '',
    remarks: ''
  });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [validationMessages, setValidationMessages] = useState({});

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const options = { Page: 1, PageSize: 100, BranchID: branchId };
      if (appliedFilters.fromDate) options.FromDate = appliedFilters.fromDate;
      if (appliedFilters.toDate) options.ToDate = appliedFilters.toDate;
      if (appliedFilters.patientName.trim()) options.PatientName = appliedFilters.patientName.trim();
      if (appliedFilters.status !== -1) options.Status = appliedFilters.status;
      if (appliedFilters.invoiceType !== 0) options.InvoiceType = appliedFilters.invoiceType;
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
    fetchInvoices();
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

  const filteredInvoices = useMemo(() => {
    let filtered = allInvoices;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allInvoices.filter(inv =>
        inv.invoiceNo?.toLowerCase().includes(term) ||
        inv.patientName?.toLowerCase().includes(term) ||
        inv.patientFileNo?.toLowerCase().includes(term) ||
        inv.patientMobile?.toLowerCase().includes(term)
      );
    }
    return filtered.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  }, [allInvoices, searchTerm]);

  const statistics = useMemo(() => {
    const total = filteredInvoices.reduce((sum, inv) => sum + (inv.netAmount || 0), 0);
    const paid = filteredInvoices.filter(inv => inv.status === 3).length;
    const pending = filteredInvoices.filter(inv => inv.status === 2).length;
    const cancelled = filteredInvoices.filter(inv => inv.status === 5).length;
    return { total, paid, pending, cancelled, count: filteredInvoices.length };
  }, [filteredInvoices]);

  const calculateBalanceAmount = (netAmount, paidAmount) => {
    const net = Number(netAmount) || 0;
    const paid = Number(paidAmount) || 0;
    return net - paid;
  };

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const applyFilters = () => {
    setAppliedFilters({
      fromDate, toDate,
      patientName: patientNameFilter,
      status: statusFilter,
      invoiceType: invoiceTypeFilter
    });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setFromDate(today);
    setToDate(today);
    setPatientNameFilter('');
    setStatusFilter(-1);
    setInvoiceTypeFilter(0);
    setAppliedFilters({ fromDate: today, toDate: today, patientName: '', status: -1, invoiceType: 0 });
  };

  const toggleDropdown = (invoiceId, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === invoiceId ? null : invoiceId);
  };

  const openViewModal = (invoice) => {
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
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: '',
      amount: balanceAmount > 0 ? balanceAmount.toString() : invoice.netAmount?.toString() || '',
      referenceNo: '',
      remarks: ''
    });
    setFormError(null);
    setFormSuccess(null);
    setValidationMessages({}); 
    setIsPaymentModalOpen(true);
    setActiveDropdown(null);
  };

  const closeModals = () => {
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
    setFormError(null);
    setFormSuccess(null);
    setValidationMessages({}); 
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    
    const filteredValue = filterInput(name, value);
    
    setPaymentData(prev => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    const paymentDateValidation = getLiveValidationMessage('paymentDate', paymentData.paymentDate);
    if (paymentDateValidation) {
      setFormError(paymentDateValidation);
      return;
    }
    
    if (!paymentData.paymentMode) {
      setFormError('Please select payment mode');
      return;
    }
    
    const amountValidation = getLiveValidationMessage('amount', paymentData.amount);
    if (amountValidation) {
      setFormError(amountValidation);
      return;
    }
    
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      setFormError('Please enter valid amount');
      return;
    }

    if ([3, 4, 7].includes(Number(paymentData.paymentMode)) && paymentData.referenceNo) {
      const refValidation = getLiveValidationMessage('referenceNo', paymentData.referenceNo);
      if (refValidation) {
        setFormError(refValidation);
        return;
      }
    }
    
    try {
      setFormLoading(true);
      setFormError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      await addInvoicePayment({
        clinicId, branchId,
        invoiceId: selectedInvoice.id,
        paymentDate: paymentData.paymentDate,
        paymentMode: Number(paymentData.paymentMode),
        amount: Number(paymentData.amount),
        referenceNo: paymentData.referenceNo,
        remarks: paymentData.remarks
      });
      setFormSuccess('Payment recorded successfully!');
      setTimeout(() => {
        closeModals();
        fetchInvoices();
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to record payment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancelInvoice = async (invoice) => {
    if (!window.confirm(`Cancel invoice ${invoice.invoiceNo}?`)) return;
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      await cancelInvoice(invoice.id, clinicId, branchId);
      setActiveDropdown(null);
      fetchInvoices();
    } catch (err) {
      setError({ message: err.message || 'Failed to cancel invoice' });
    }
  };

  const formatCurrency = (amount) => amount ? `₹${Number(amount).toFixed(2)}` : '₹0.00';
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      1: 'draft', 2: 'issued', 3: 'paid', 4: 'partial', 5: 'cancelled', 6: 'refunded', 7: 'credit'
    };
    return `${styles.statusBadge} ${styles[statusMap[status]] || styles.draft}`;
  };

  const getStatusLabel = (status) => {
    const statusObj = INVOICE_STATUSES.find(s => s.id === status);
    return statusObj?.label || 'Unknown';
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.invoiceLoading}>Loading invoices...</div>;

  return (
    <div className={styles.invoiceListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Invoice Management" />

      {formSuccess && !isPaymentModalOpen && (
        <div className={styles.formSuccess}>{formSuccess}</div>
      )}

      {/* Toolbar */}
      <div className={styles.invoiceToolbar}>
        <div className={styles.invoiceToolbarLeft}>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`${styles.invoiceFilterToggleBtn} ${showAdvancedFilters ? styles.active : ''}`}
          >
            <FiFilter size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>
          {(appliedFilters.patientName || appliedFilters.status !== -1 || appliedFilters.invoiceType !== 0 || searchTerm) && (
            <button onClick={clearAllFilters} className={styles.invoiceClearBtn}>Clear All</button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className={styles.invoiceAdvancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From Date</label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
                max={today} 
                className={styles.filterInput} 
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
                max={today} 
                className={styles.filterInput} 
              />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Patient Name</label>
              <input type="text" placeholder="Filter by patient..." value={patientNameFilter} onChange={(e) => setPatientNameFilter(e.target.value)} className={styles.filterInput} />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Invoice Type</label>
              <select value={invoiceTypeFilter} onChange={(e) => setInvoiceTypeFilter(Number(e.target.value))} className={styles.filterInput}>
                <option value={0}>All Types</option>
                {INVOICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(Number(e.target.value))} className={styles.filterInput}>
                <option value={-1}>All Statuses</option>
                {INVOICE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className={`${styles.filterGroup} ${styles.applyFilterBtnGroup}`}>
              <button onClick={applyFilters} className={styles.invoiceAddBtn}><FiSearch size={18} /> Search</button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className={styles.invoiceStatsGrid}>
        <div className={`${styles.invoiceStatCard} ${styles.statTotal}`}>
          <div className={styles.statIconWrapper}><FiDollarSign size={24} /></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total Amount</div>
            <div className={styles.statValue}>{formatCurrency(statistics.total)}</div>
          </div>
        </div>
      </div>

      {/* Table */}
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
                  {searchTerm || appliedFilters.patientName ? 'No invoices found.' : 'No invoices yet.'}
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
                        >
                          <FiEye size={16} />
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
                                  <FiDollarSign size={16} />
                                  Add Payment
                                </button>
                              )}
                              {invoice.status !== 5 && (
                                <button 
                                  onClick={() => handleCancelInvoice(invoice)} 
                                  className={`${styles.invoiceDropdownItem} ${styles.cancel}`}
                                >
                                  <FiX size={16} />
                                  Cancel Invoice
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

      {/* View Invoice Modal */}
      <ViewInvoice
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        invoiceId={selectedInvoice?.id}
      />

      {/* Add Payment Modal */}
      {isPaymentModalOpen && (
        <div className={styles.invoiceModalOverlay}>
          <div className={styles.invoiceModal}>
            <div className={styles.invoiceModalHeader}>
              <h2>Add Payment</h2>
              <button onClick={closeModals} className={styles.invoiceModalClose}>×</button>
            </div>
            <form onSubmit={handleAddPayment}>
              <div className={styles.invoiceModalBody}>
                {formError && <div className={styles.formError}>{formError}</div>}
                {formSuccess && <div className={styles.formSuccess}>{formSuccess}</div>}
                <div className={styles.invoiceInfoDisplay}>
                  <p><strong>Invoice:</strong> {selectedInvoice?.invoiceNo}</p>
                  <p><strong>Patient:</strong> {selectedInvoice?.patientName}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedInvoice?.netAmount)}</p>
                  <p><strong>Balance:</strong> {formatCurrency(calculateBalanceAmount(selectedInvoice?.netAmount, selectedInvoice?.paidAmount))}</p>
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
                      required 
                    />
                    {validationMessages.paymentDate && (
                      <span style={{ 
                        color: '#ef4444', 
                        fontSize: '12px', 
                        marginTop: '4px', 
                        display: 'block' 
                      }}>
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
                      required 
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
                      required 
                    />
                    {validationMessages.amount && (
                      <span style={{ 
                        color: '#ef4444', 
                        fontSize: '12px', 
                        marginTop: '4px', 
                        display: 'block' 
                      }}>
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
                        <span style={{ 
                          color: '#6b7280', 
                          fontSize: '12px', 
                          marginTop: '4px', 
                          display: 'block' 
                        }}>
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
                <button type="button" onClick={closeModals} className={styles.btnCancel} disabled={formLoading}>Cancel</button>
                <button type="submit" className={styles.btnSubmit} disabled={formLoading}>{formLoading ? 'Recording...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;