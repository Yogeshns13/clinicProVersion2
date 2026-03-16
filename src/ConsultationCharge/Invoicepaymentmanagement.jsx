// src/components/InvoicePaymentList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiDollarSign, FiCreditCard, FiX } from 'react-icons/fi';
import { getInvoicePaymentList, updateInvoicePayment } from '../Api/ApiInvoicePayment.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './InvoicePaymentManagement.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

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

const SEARCH_TYPE_OPTIONS = [
  { value: 'InvoiceNo',   label: 'Invoice No' },
  { value: 'PatientName', label: 'Patient Name' },
];

const getTodayStr = () => new Date().toISOString().split('T')[0];

const InvoicePaymentList = () => {
  const today = getTodayStr();

  const [payments, setPayments]       = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  // Modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment]     = useState(null);
  const [formLoading, setFormLoading]             = useState(false);
  const [formError, setFormError]                 = useState(null);
  const [formSuccess, setFormSuccess]             = useState(null);
  const [updateData, setUpdateData]               = useState({ status: '', remarks: '' });

  // ── Filter inputs (staged — not applied until Search is clicked) ──
  const [filterInputs, setFilterInputs] = useState({
    searchType:  'InvoiceNo',
    searchValue: '',
    paymentMode: 0,
    dateFrom:    today,
    dateTo:      today,
  });

  // ── Applied filters (drive the API call) ──
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'InvoiceNo',
    searchValue: '',
    paymentMode: 0,
    dateFrom:    today,
    dateTo:      today,
  });

  // ── Derived: are any filters actually active? ──
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.paymentMode        !== 0  ||
    appliedFilters.dateFrom           !== today ||
    appliedFilters.dateTo             !== today;

  // ── Data fetching ──
  const fetchPayments = async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        Page:      1,
        PageSize:  100,
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
    fetchPayments(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  // ── Computed ──
  const filteredPayments = useMemo(() => {
    return [...allPayments].sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  }, [allPayments]);

  const statistics = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return { total, count: filteredPayments.length };
  }, [filteredPayments]);

  // ── Handlers ──
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const defaults = {
      searchType:  'InvoiceNo',
      searchValue: '',
      paymentMode: 0,
      dateFrom:    today,
      dateTo:      today,
    };
    setFilterInputs(defaults);
    setAppliedFilters(defaults);
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
    if (!updateData.status) { setFormError('Please select a status'); return; }
    try {
      setFormLoading(true);
      setFormError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await updateInvoicePayment({
        clinicId, branchId,
        paymentId: selectedPayment.id,
        status:    Number(updateData.status),
        remarks:   updateData.remarks
      });
      setFormSuccess('Payment updated successfully!');
      setTimeout(() => { closeModal(); fetchPayments(); }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update payment');
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency  = (amount)  => amount ? `₹${Number(amount).toFixed(2)}` : '₹0.00';
  const formatDate      = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const getPaymentModeLabel = (mode) => PAYMENT_MODES.find(m => m.id === mode)?.label || 'Unknown';

  const getStatusBadgeClass = (status) => {
    const map = { 1: 'success', 2: 'failed', 3: 'pending', 4: 'refunded', 5: 'cancelled' };
    return `${styles.statusBadge} ${styles[map[status]] || styles.pending}`;
  };
  const getStatusLabel = (status) => PAYMENT_STATUSES.find(s => s.id === status)?.label || 'Unknown';

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.paymentListLoading}>Loading payments...</div>;

  return (
    <div className={styles.paymentWrapper}>
      <ErrorHandler error={error} />
      <Header title="Invoice Payment Management" />

      {formSuccess && !isUpdateModalOpen && (
        <div className={styles.formSuccess}>{formSuccess}</div>
      )}

      {/* ── Filter Bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          {/* Search type + value */}
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
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

          {/* Payment Mode */}
          <div className={styles.filterGroup}>
            <select
              name="paymentMode"
              value={filterInputs.paymentMode}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value={0}>All Modes</option>
              {PAYMENT_MODES.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
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
                max={today}
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
                max={today}
                className={`${styles.filterInput} ${!filterInputs.dateTo ? styles.dateEmpty : ''}`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={16} />
                Clear
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Statistics */}
      <div className={styles.paymentStatsGrid}>
        <div className={`${styles.paymentStatCard} ${styles.statTotal} ${styles.smallStat}`}>
          <div className={styles.statIconWrapper}><FiDollarSign size={20} /></div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Total Payments</div>
            <div className={styles.statValueSmall}>{formatCurrency(statistics.total)}</div>
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
                  {hasActiveFilters ? 'No payments found.' : 'No payments recorded yet.'}
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
                      <button
                        onClick={() => openUpdateModal(payment)}
                        className={styles.paymentUpdateBtn}
                        title="Update Payment"
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

      {/* Update Payment Modal */}
      {isUpdateModalOpen && (
        <div className={styles.paymentModalOverlay}>
          <div className={styles.paymentModal}>
            <div className={styles.paymentModalHeader}>
              <h2>Update Payment Status</h2>
              
              <div className={styles.headerRight}>
              <div className={styles.clinicNameone}>
                             <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />  
                               {localStorage.getItem('clinicName') || '—'}
                          </div>
              <button onClick={closeModal} className={styles.paymentModalClose}>×</button>
            </div>
            </div>
            <form onSubmit={handleUpdatePayment}>
              <div className={styles.paymentModalBody}>
                {formError   && <div className={styles.formError}>{formError}</div>}
                {formSuccess && <div className={styles.formSuccess}>{formSuccess}</div>}
                <div className={styles.invoiceHeader}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailItem}>
                                                        <label>Invoice:</label>
                                                        <span>{selectedPayment?.invoiceNo}</span>
                                                      </div>
                    <div className={styles.detailItem}>
                                                        <label>Patient:</label>
                                                        <span>{selectedPayment?.patientName}</span>
                                                      </div>
                    <div className={styles.detailItem}>
                                                        <label>Amount:</label>
                                                        <span>{formatCurrency(selectedPayment?.amount)}</span>
                                                      </div>
                    <div className={styles.detailItem}>
                                                        <label>Mode:</label>
                                                        <span>{getPaymentModeLabel(selectedPayment?.paymentMode)}</span>
                                                      </div>
                    <div className={styles.detailItem}>
                                                        <label>Date:</label>
                                                        <span>{formatDate(selectedPayment?.paymentDate)}</span>
                                                      </div>
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
                      required
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
                <button type="submit" className={styles.btnSubmit} disabled={formLoading}>
                  {formLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicePaymentList;