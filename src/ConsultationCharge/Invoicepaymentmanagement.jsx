// src/components/InvoicePaymentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiDollarSign, FiCalendar, FiCreditCard, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getInvoicePaymentList, updateInvoicePayment, getInvoiceList } from '../api/api-invoicePayment.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './InvoicePaymentManagement.module.css';

const PAYMENT_STATUSES = [
  { id: 1, label: 'Success' },
  { id: 4, label: 'Refunded' },
  { id: 5, label: 'Reversed' }
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

const InvoicePaymentList = () => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = getTodayDate();

  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState();
  const [toDate, setToDate] = useState();
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState({ patientName: '', paymentMode: 0 });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', remarks: '' });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const options = { Page: 1, PageSize: 100, BranchID: branchId };
      if (appliedFilters.fromDate) options.FromDate = appliedFilters.fromDate;
      if (appliedFilters.toDate) options.ToDate = appliedFilters.toDate;
      if (appliedFilters.patientName.trim()) options.PatientName = appliedFilters.patientName.trim();
      if (appliedFilters.paymentMode !== 0) options.PaymentMode = appliedFilters.paymentMode;
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
    fetchPayments();
  }, [appliedFilters]);

  const filteredPayments = useMemo(() => {
    let filtered = allPayments;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = allPayments.filter(p =>
        p.invoiceNo?.toLowerCase().includes(term) ||
        p.patientName?.toLowerCase().includes(term) ||
        p.referenceNo?.toLowerCase().includes(term) ||
        p.patientFileNo?.toLowerCase().includes(term)
      );
    }
    return filtered.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  }, [allPayments, searchTerm]);

  const statistics = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const success = filteredPayments.filter(p => p.status === 1).length;
    const failed = filteredPayments.filter(p => p.status === 2).length;
    const pending = filteredPayments.filter(p => p.status === 3).length;
    return { total, success, failed, pending, count: filteredPayments.length };
  }, [filteredPayments]);

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const applyFilters = () => {
    setAppliedFilters({ fromDate, toDate, patientName: patientNameFilter, paymentMode: paymentModeFilter });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setFromDate(todayDate);
    setToDate(todayDate);
    setPatientNameFilter('');
    setPaymentModeFilter(0);
    setAppliedFilters({ fromDate: todayDate, toDate: todayDate, patientName: '', paymentMode: 0 });
  };

  const openUpdateModal = (payment) => {
    setSelectedPayment(payment);
    setUpdateData({ status: payment.status.toString(), remarks: payment.remarks || '' });
    setFormError(null);
    setFormSuccess(null);
    setIsUpdateModalOpen(true);
  };

  const closeModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedPayment(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!updateData.status) {
      setFormError('Please select a status');
      return;
    }
    try {
      setFormLoading(true);
      setFormError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      await updateInvoicePayment({
        clinicId, branchId,
        paymentId: selectedPayment.id,
        status: Number(updateData.status),
        remarks: updateData.remarks
      });
      setFormSuccess('Payment updated successfully!');
      setTimeout(() => {
        closeModal();
        fetchPayments();
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update payment');
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency = (amount) => amount ? `₹${Number(amount).toFixed(2)}` : '₹0.00';
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getPaymentModeLabel = (mode) => {
    const modeObj = PAYMENT_MODES.find(m => m.id === mode);
    return modeObj?.label || 'Unknown';
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = { 1: 'success', 2: 'failed', 3: 'pending', 4: 'refunded', 5: 'cancelled' };
    return `${styles.statusBadge} ${styles[statusMap[status]] || styles.pending}`;
  };

  const getStatusLabel = (status) => {
    const statusObj = PAYMENT_STATUSES.find(s => s.id === status);
    return statusObj?.label || 'Unknown';
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.paymentListLoading}>Loading payments...</div>;

  return (
    <div className={styles.paymentWrapper}>
      <ErrorHandler error={error} />
      <Header title="Invoice Payment Management" />

      {formSuccess && !isUpdateModalOpen && <div className={styles.formSuccess}>{formSuccess}</div>}

      {/* Toolbar */}
      <div className={styles.paymentListToolbar}>
        <div className={styles.paymentListToolbarLeft}>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`${styles.paymentFilterToggleBtn} ${showAdvancedFilters ? styles.active : ''}`}
          >
            <FiSearch size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>
          {(appliedFilters.patientName || appliedFilters.paymentMode !== 0 || searchTerm) && (
            <button onClick={clearAllFilters} className={styles.paymentClearBtn}>Clear All</button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className={styles.paymentAdvancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={styles.filterInput} />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={styles.filterInput} />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Patient Name</label>
              <input type="text" placeholder="Filter by patient..." value={patientNameFilter} onChange={(e) => setPatientNameFilter(e.target.value)} className={styles.filterInput} />
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Payment Mode</label>
              <select value={paymentModeFilter} onChange={(e) => setPaymentModeFilter(Number(e.target.value))} className={styles.filterInput}>
                <option value={0}>All Modes</option>
                {PAYMENT_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div className={`${styles.filterGroup} ${styles.applyFilterBtnGroup}`}>
              <button onClick={applyFilters} className={styles.paymentListAddBtn}><FiSearch size={18} /> Search</button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className={styles.paymentStatsGrid}>
        <div className={`${styles.paymentStatCard} ${styles.statTotal}`}>
          <div className={styles.statIconWrapper}><FiDollarSign size={24} /></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total Payments</div>
            <div className={styles.statValue}>{formatCurrency(statistics.total)}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.paymentListTableContainer}>
        <table className={styles.paymentListTable}>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Patient</th>
              <th>Payment Date</th>
              <th>Mode</th>
              <th>Amount</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.paymentListNoData}>
                  {searchTerm || appliedFilters.patientName ? 'No payments found.' : 'No payments recorded yet.'}
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
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
                  <td>
                    <div className={styles.paymentModeCell}>
                      <FiCreditCard size={16} style={{ color: '#9333ea', marginRight: '6px' }} />
                      <span className={styles.paymentModeText}>{getPaymentModeLabel(payment.paymentMode)}</span>
                    </div>
                  </td>
                  <td><span className={`${styles.amountText} ${styles.total}`}>{formatCurrency(payment.amount)}</span></td>
                  <td><span className={styles.paymentRefBadge}>{payment.referenceNo || '—'}</span></td>
                  <td><span className={getStatusBadgeClass(payment.status)}>{getStatusLabel(payment.status)}</span></td>
                  <td>
                    <div className={styles.paymentActionsCell}>
                      <button onClick={() => openUpdateModal(payment)} className={styles.paymentUpdateBtn} title="Update Payment">Update Status</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Update Payment Modal */}
      {isUpdateModalOpen && (
        <div className={styles.paymentModalOverlay}>
          <div className={styles.paymentModal}>
            <div className={styles.paymentModalHeader}>
              <h2>Update Payment Status</h2>
              <button onClick={closeModal} className={styles.paymentModalClose}>×</button>
            </div>
            <form onSubmit={handleUpdatePayment}>
              <div className={styles.paymentModalBody}>
                {formError && <div className={styles.formError}>{formError}</div>}
                {formSuccess && <div className={styles.formSuccess}>{formSuccess}</div>}
                <div className={styles.invoiceInfoDisplay}>
                  <p><strong>Invoice:</strong> {selectedPayment?.invoiceNo}</p>
                  <p><strong>Patient:</strong> {selectedPayment?.patientName}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedPayment?.amount)}</p>
                  <p><strong>Mode:</strong> {getPaymentModeLabel(selectedPayment?.paymentMode)}</p>
                  <p><strong>Date:</strong> {formatDate(selectedPayment?.paymentDate)}</p>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Payment Status <span className={styles.required}>*</span></label>
                    <select 
                      name="status" 
                      value={updateData.status} 
                      onChange={handleUpdateInputChange} 
                      disabled={formLoading} 
                      required 
                      className={styles.formSelect}
                    >
                      {PAYMENT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
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
                <button type="button" onClick={closeModal} className={styles.btnCancel} disabled={formLoading}>Cancel</button>
                <button type="submit" className={styles.btnSubmit} disabled={formLoading}>{formLoading ? 'Updating...' : 'Update Status'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicePaymentList;