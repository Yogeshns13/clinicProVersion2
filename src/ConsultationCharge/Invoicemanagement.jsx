// src/components/InvoiceList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiFileText, FiDollarSign, FiCalendar, FiUser, FiX, FiMoreVertical, FiEye } from 'react-icons/fi';
import { getInvoiceList, cancelInvoice, addInvoicePayment } from '../api/api-invoicePayment.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import ViewInvoice from './ViewInvoice.jsx';
import './Invoicemanagement.css';

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

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [patientNameFilter, setPatientNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(-1);
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState({ fromDate: '', toDate: '', patientName: '', status: -1, invoiceType: 0 });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true);
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
      if (!event.target.closest('.invoice-actions-dropdown')) {
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
    setFromDate('');
    setToDate('');
    setPatientNameFilter('');
    setStatusFilter(-1);
    setInvoiceTypeFilter(0);
    setAppliedFilters({ fromDate: '', toDate: '', patientName: '', status: -1, invoiceType: 0 });
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
    setIsPaymentModalOpen(true);
    setActiveDropdown(null);
  };

  const closeModals = () => {
    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentData.paymentMode) {
      setFormError('Please select payment mode');
      return;
    }
    if (!paymentData.amount || Number(paymentData.amount) <= 0) {
      setFormError('Please enter valid amount');
      return;
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

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
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
    return `status-badge ${statusMap[status] || 'draft'}`;
  };

  const getStatusLabel = (status) => {
    const statusObj = INVOICE_STATUSES.find(s => s.id === status);
    return statusObj?.label || 'Unknown';
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="invoice-loading">Loading invoices...</div>;

  return (
    <div className="invoice-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Invoice Management" />

      {formSuccess && !isPaymentModalOpen && (
        <div className="form-success">{formSuccess}</div>
      )}

      {/* Toolbar */}
      <div className="invoice-toolbar">
        <div className="invoice-toolbar-left">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`invoice-filter-toggle-btn ${showAdvancedFilters ? 'active' : ''}`}
          >
            <FiFilter size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>
          {(appliedFilters.fromDate || appliedFilters.toDate || appliedFilters.patientName || appliedFilters.status !== -1 || appliedFilters.invoiceType !== 0 || searchTerm) && (
            <button onClick={clearAllFilters} className="invoice-clear-btn">Clear All</button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="invoice-advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="filter-input" />
            </div>
            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="filter-input" />
            </div>
            <div className="filter-group">
              <label className="filter-label">Patient Name</label>
              <input type="text" placeholder="Filter by patient..." value={patientNameFilter} onChange={(e) => setPatientNameFilter(e.target.value)} className="filter-input" />
            </div>
            <div className="filter-group">
              <label className="filter-label">Invoice Type</label>
              <select value={invoiceTypeFilter} onChange={(e) => setInvoiceTypeFilter(Number(e.target.value))} className="filter-input">
                <option value={0}>All Types</option>
                {INVOICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(Number(e.target.value))} className="filter-input">
                <option value={-1}>All Statuses</option>
                {INVOICE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div className="filter-group apply-filter-btn-group">
              <button onClick={applyFilters} className="invoice-add-btn"><FiSearch size={18} /> Search</button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="invoice-search-wrapper">
        <div className="invoice-search-container">
          <input type="text" placeholder="Search by invoice no, patient..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyPress={handleKeyPress} className="invoice-search-input" />
          <button onClick={handleSearch} className="invoice-search-btn"><FiSearch size={20} /></button>
        </div>
      </div>

      {/* Statistics */}
      <div className="invoice-stats-grid">
        <div className="invoice-stat-card stat-total">
          <div className="stat-icon-wrapper"><FiDollarSign size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Amount</div>
            <div className="stat-value">{formatCurrency(statistics.total)}</div>
          </div>
        </div>
        <div className="invoice-stat-card stat-paid">
          <div className="stat-icon-wrapper"><FiFileText size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Paid Invoices</div>
            <div className="stat-value">{statistics.paid}</div>
          </div>
        </div>
        <div className="invoice-stat-card stat-pending">
          <div className="stat-icon-wrapper"><FiCalendar size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{statistics.pending}</div>
          </div>
        </div>
        <div className="invoice-stat-card stat-cancelled">
          <div className="stat-icon-wrapper"><FiX size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Cancelled</div>
            <div className="stat-value">{statistics.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="invoice-table-container">
        <table className="invoice-table">
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
                <td colSpan={8} className="invoice-no-data">
                  {searchTerm || appliedFilters.patientName ? 'No invoices found.' : 'No invoices yet.'}
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => {
                const balanceAmount = calculateBalanceAmount(invoice.netAmount, invoice.paidAmount);
                return (
                  <tr key={invoice.id}>
                    <td><div className="invoice-no-badge">{invoice.invoiceNo}</div></td>
                    <td>
                      <div className="patient-cell">
                        <FiUser size={16} className="patient-icon" />
                        <div>
                          <div className="patient-name">{invoice.patientName}</div>
                          <div className="patient-info">{invoice.patientFileNo}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="date-text">{formatDate(invoice.invoiceDate)}</span></td>
                    <td><span className="amount-text total">{formatCurrency(invoice.netAmount)}</span></td>
                    <td><span className="discount-text">{formatCurrency(invoice.paidAmount)}</span></td>
                    <td><span className="amount-text">{formatCurrency(balanceAmount)}</span></td>
                    <td><span className={getStatusBadgeClass(invoice.status)}>{getStatusLabel(invoice.status)}</span></td>
                    <td>
                      <div className="invoice-actions-cell">
                        <button 
                          onClick={() => openViewModal(invoice)} 
                          className="invoice-view-btn"
                          title="View Details"
                        >
                          <FiEye size={16} />
                          Details
                        </button>
                        <div className="invoice-actions-dropdown">
                          {invoice.status !== 5 && (
                          <button 
                            onClick={(e) => toggleDropdown(invoice.id, e)} 
                            className="invoice-actions-btn"
                            title="Actions"
                          >
                            <FiMoreVertical size={18} />
                          </button>
                          )}
                          {activeDropdown === invoice.id && (
                            <div className="invoice-dropdown-menu">
                              {invoice.status !== 3 && invoice.status !== 5 && (
                                <button 
                                  onClick={() => openPaymentModal(invoice)} 
                                  className="invoice-dropdown-item payment"
                                >
                                  <FiDollarSign size={16} />
                                  Add Payment
                                </button>
                              )}
                              {invoice.status !== 5 && (
                                <button 
                                  onClick={() => handleCancelInvoice(invoice)} 
                                  className="invoice-dropdown-item cancel"
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
        <div className="invoice-modal-overlay">
          <div className="invoice-modal">
            <div className="invoice-modal-header">
              <h2>Add Payment</h2>
              <button onClick={closeModals} className="invoice-modal-close">×</button>
            </div>
            <form onSubmit={handleAddPayment}>
              <div className="invoice-modal-body">
                {formError && <div className="form-error">{formError}</div>}
                {formSuccess && <div className="form-success">{formSuccess}</div>}
                <div className="invoice-info-display">
                  <p><strong>Invoice:</strong> {selectedInvoice?.invoiceNo}</p>
                  <p><strong>Patient:</strong> {selectedInvoice?.patientName}</p>
                  <p><strong>Total:</strong> {formatCurrency(selectedInvoice?.netAmount)}</p>
                  <p><strong>Balance:</strong> {formatCurrency(calculateBalanceAmount(selectedInvoice?.netAmount, selectedInvoice?.paidAmount))}</p>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Payment Date <span className="required">*</span></label>
                    <input type="date" name="paymentDate" value={paymentData.paymentDate} onChange={handlePaymentInputChange} disabled={formLoading} required />
                  </div>
                  <div className="form-group">
                    <label>Payment Mode <span className="required">*</span></label>
                    <select name="paymentMode" value={paymentData.paymentMode} onChange={handlePaymentInputChange} disabled={formLoading} required className="form-select">
                      <option value="">Select mode</option>
                      {PAYMENT_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount (₹) <span className="required">*</span></label>
                    <input type="number" name="amount" value={paymentData.amount} onChange={handlePaymentInputChange} placeholder="0.00" step="0.01" min="0" disabled={formLoading} required />
                  </div>

                  {/* Conditional Reference No field */}
                  {[3, 4, 7].includes(Number(paymentData.paymentMode)) && (
                    <div className="form-group">
                      <label>Reference No</label>
                      <input
                        type="text"
                        name="referenceNo"
                        value={paymentData.referenceNo}
                        onChange={handlePaymentInputChange}
                        placeholder="Transaction ID / Ref No"
                        disabled={formLoading}
                      />
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label>Remarks</label>
                    <textarea name="remarks" value={paymentData.remarks} onChange={handlePaymentInputChange} placeholder="Additional notes..." rows="3" disabled={formLoading} />
                  </div>
                </div>
              </div>
              <div className="invoice-modal-footer">
                <button type="button" onClick={closeModals} className="btn-cancel" disabled={formLoading}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={formLoading}>{formLoading ? 'Recording...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;