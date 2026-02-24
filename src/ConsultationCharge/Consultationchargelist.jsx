// src/components/ConsultationChargeList.jsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiFileText, FiX } from 'react-icons/fi';
import {
  getConsultationChargeList,
  getConsultingChargeConfigList,
  addConsultationCharge,
  generateConsultationInvoice
} from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ConsultationChargeList.module.css';

const ConsultationChargeList = () => {
  const [consultations, setConsultations] = useState([]);
  const [chargeConfigs, setChargeConfigs] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  // Filter inputs (not applied until Search is clicked)
  const [filterInputs, setFilterInputs] = useState({
    searchType: 'patientName', // patientName | patientMobile | chargeName
    searchValue: '',
    status: '',
    invoicedOnly: '',
    dateFrom: today,
    dateTo: today
  });

  // Applied filters (drive actual API call)
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'patientName',
    searchValue: '',
    status: '',
    invoicedOnly: '',
    dateFrom: '',
    dateTo: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Invoice form data
  const [invoiceFormData, setInvoiceFormData] = useState({
    consultationId: null,
    chargeId: '',
    chargeAmount: '',
    invoiceDate: today,
    discount: '0'
  });

  // ── Derived: are any filters currently applied? ──
  const hasActiveFilters =
    !!appliedFilters.searchValue ||
    !!appliedFilters.status ||
    appliedFilters.invoicedOnly !== '' ||
    !!appliedFilters.dateFrom ||
    !!appliedFilters.dateTo;

  // ────────────────────────────────────────────────
  // Data fetching
  const fetchConsultations = async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = { BranchID: branchId, PageSize: 100 };

      if (filters.searchType === 'patientName' && filters.searchValue)
        options.PatientName = filters.searchValue;
      if (filters.searchType === 'patientMobile' && filters.searchValue)
        options.PatientMobile = filters.searchValue;
      if (filters.searchType === 'chargeName' && filters.searchValue)
        options.ChargeName = filters.searchValue;
      if (filters.status !== '')
        options.Status = Number(filters.status);
      if (filters.invoicedOnly !== '')
        options.InvoicedOnly = Number(filters.invoicedOnly);
      if (filters.dateFrom) options.FromDate = filters.dateFrom;
      if (filters.dateTo)   options.ToDate   = filters.dateTo;

      const data = await getConsultationChargeList(clinicId, options);
      setConsultations(data);
    } catch (err) {
      setError(err?.status >= 400 ? err : { message: err.message || 'Failed to load consultation charges' });
    } finally {
      setLoading(false);
    }
  };

  const fetchChargeConfigs = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const data = await getConsultingChargeConfigList(clinicId, { PageSize: 100, Status: 1 });
      setChargeConfigs(data);
    } catch (err) {
      console.error('fetchChargeConfigs error:', err);
    }
  };

  useEffect(() => {
    fetchChargeConfigs();
    fetchConsultations();
  }, []);

  // ────────────────────────────────────────────────
  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const newFilters = { ...filterInputs };
    setAppliedFilters(newFilters);
    fetchConsultations(newFilters);
  };

  const handleClearFilters = () => {
    const empty = {
      searchType: 'patientName',
      searchValue: '',
      status: '',
      invoicedOnly: '',
      dateFrom: '',
      dateTo: ''
    };
    setFilterInputs({ ...empty, dateFrom: today, dateTo: today });
    setAppliedFilters(empty);
    fetchConsultations(empty);
  };

  // ────────────────────────────────────────────────
  // Invoice form handlers (logic unchanged)
  const openInvoiceForm = (charge) => {
    setInvoiceFormData({
      consultationId: charge.consultationId,
      chargeId: '',
      chargeAmount: '',
      invoiceDate: charge.dateCreated?.split('T')[0] || today,
      discount: '0'
    });
    setFormError(null);
    setFormSuccess(null);
    setIsInvoiceFormOpen(true);
  };

  const closeForm = () => {
    setIsInvoiceFormOpen(false);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleInvoiceInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'chargeId' && value) {
      const config = chargeConfigs.find(c => c.id === Number(value));
      if (config) {
        setInvoiceFormData(prev => ({
          ...prev,
          chargeAmount: config.defaultAmount?.toString() || ''
        }));
      }
    }
  };

  const validateForm = () => {
    if (!invoiceFormData.chargeId) {
      setFormError('Please select a charge type');
      return false;
    }
    const amount = Number(invoiceFormData.chargeAmount);
    if (isNaN(amount) || amount < 0) {
      setFormError('Please enter a valid charge amount');
      return false;
    }
    if (!invoiceFormData.invoiceDate) {
      setFormError('Please select an invoice date');
      return false;
    }
    const discount = Number(invoiceFormData.discount);
    if (isNaN(discount) || discount < 0) {
      setFormError('Please enter a valid discount amount');
      return false;
    }
    return true;
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormLoading(true);
      setFormError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const chargeResult = await addConsultationCharge({
        clinicId,
        branchId,
        consultationId: Number(invoiceFormData.consultationId),
        chargeId: Number(invoiceFormData.chargeId),
        chargeAmount: Number(invoiceFormData.chargeAmount)
      });
      if (!chargeResult.success) throw new Error('Failed to add consultation charge');

      const invoiceResult = await generateConsultationInvoice({
        clinicId,
        branchId,
        consultationId: Number(invoiceFormData.consultationId),
        invoiceDate: invoiceFormData.invoiceDate,
        discount: Number(invoiceFormData.discount)
      });
      if (!invoiceResult.success) throw new Error('Failed to generate invoice');

      setFormSuccess('Invoice generated successfully!');
      setTimeout(() => {
        closeForm();
        fetchConsultations();
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to generate invoice');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Helpers
  const formatCurrency = (amount) =>
    amount != null ? `₹${Number(amount).toFixed(2)}` : '₹0.00';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.chargeListLoading}>Loading consultation charges...</div>;

  if (error) return <div className={styles.chargeListError}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.chargeListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Consultation Charges" />

      {formSuccess && !isInvoiceFormOpen && (
        <div className={styles.formSuccess}>{formSuccess}</div>
      )}

      {/* ── Single-line Filters ── */}
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
              <option value="patientName">Patient Name</option>
              <option value="patientMobile">Mobile No.</option>
              <option value="chargeName">Charge Name</option>
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={
                filterInputs.searchType === 'patientName'   ? 'Search by patient name...'  :
                filterInputs.searchType === 'patientMobile' ? 'Search by mobile number...' :
                                                              'Search by charge name...'
              }
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          {/* Status */}
          <div className={styles.filterGroup}>
            <select
              name="status"
              value={filterInputs.status}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>

          {/* Invoiced Only */}
          <div className={styles.filterGroup}>
            <select
              name="invoicedOnly"
              value={filterInputs.invoicedOnly}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Invoices</option>
              <option value="1">Invoiced Only</option>
              <option value="0">Not Invoiced</option>
            </select>
          </div>

          {/* Date From */}
          <div className={styles.filterGroup}>
            <div className={styles.dateInputWrapper}>
              <input
                type="date"
                name="dateFrom"
                value={filterInputs.dateFrom}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${styles.dateInput}`}
                max={today}
              />
            </div>
          </div>

          {/* Date To */}
          <div className={styles.filterGroup}>
            <div className={styles.dateInputWrapper}>
              <input
                type="date"
                name="dateTo"
                value={filterInputs.dateTo}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${styles.dateInput}`}
                max={today}
              />
            </div>
          </div>

          {/* Actions — Clear only visible when filters are active */}
          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={18} />
              Search
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={18} />
                Clear
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.chargeListTableContainer}>
        <table className={styles.chargeListTable}>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Charge</th>
              <th>Amount</th>
              <th>Invoice</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consultations.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.chargeListNoData}>
                  {hasActiveFilters
                    ? 'No consultation charges found for the applied filters.'
                    : 'No consultation charges available yet.'}
                </td>
              </tr>
            ) : (
              consultations.map((charge) => (
                <tr key={charge.id}>
                  <td>
                    <div className={styles.patientCell}>
                      <div className={styles.patientName}>{charge.patientName || '—'}</div>
                      {charge.patientFileNo && (
                        <div className={styles.patientInfo}>{charge.patientFileNo}</div>
                      )}
                      {charge.patientMobile && (
                        <div className={styles.patientInfo}>{charge.patientMobile}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={styles.doctorName}>{charge.doctorFullName || '—'}</span>
                  </td>
                  <td>
                    <div className={styles.doctorName}>{charge.chargeName || '—'}</div>
                    {charge.chargeCode && (
                      <div className={styles.chargeCode}>{charge.chargeCode}</div>
                    )}
                  </td>
                  <td>
                    <div className={styles.amountCell}>
                      <span className={styles.amountMain}>{formatCurrency(charge.chargeAmount)}</span>
                      {charge.netAmount != null && charge.netAmount !== charge.chargeAmount && (
                        <span className={styles.amountNet}>Net: {formatCurrency(charge.netAmount)}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {charge.isInvoiced ? (
                      <span className={`${styles.statusBadge} ${styles.invoiced}`}>
                        {charge.invoiceNo || 'Invoiced'}
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles.notInvoiced}`}>
                        Not Invoiced
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${charge.status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                      {charge.statusDesc?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td>
                    <span className={styles.dateText}>{formatDate(charge.dateCreated)}</span>
                  </td>
                  <td>
                    <div className={styles.chargeListActionsCell}>
                      {!charge.isInvoiced && (
                        <button
                          onClick={() => openInvoiceForm(charge)}
                          className={styles.invoiceBtn}
                          title="Make Invoice"
                        >
                          <FiFileText size={16} /> Make Invoice
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Generate Invoice Modal ── */}
      {isInvoiceFormOpen && (
        <div className={styles.chargeListModalOverlay}>
          <div className={styles.chargeListModal}>
            <div className={styles.chargeListModalHeader}>
              <h2>Generate Invoice</h2>
              <button onClick={closeForm} className={styles.chargeListModalClose}>×</button>
            </div>
            <form onSubmit={handleGenerateInvoice}>
              <div className={styles.chargeListModalBody}>
                {formError && <div className={styles.formError}>{formError}</div>}
                {formSuccess && <div className={styles.formSuccess}>{formSuccess}</div>}
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Charge Type <span className={styles.required}>*</span></label>
                    <select
                      name="chargeId"
                      value={invoiceFormData.chargeId}
                      onChange={handleInvoiceInputChange}
                      disabled={formLoading}
                      required
                    >
                      <option value="">Select charge type</option>
                      {chargeConfigs.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.chargeName} - {formatCurrency(c.defaultAmount)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Charge Amount (₹) <span className={styles.required}>*</span></label>
                    <input
                      type="number"
                      name="chargeAmount"
                      value={invoiceFormData.chargeAmount}
                      onChange={handleInvoiceInputChange}
                      placeholder="Amount"
                      step="0.01"
                      min="0"
                      disabled={formLoading}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Invoice Date <span className={styles.required}>*</span></label>
                    <input
                      type="date"
                      name="invoiceDate"
                      value={invoiceFormData.invoiceDate}
                      onChange={handleInvoiceInputChange}
                      max={today}
                      disabled={formLoading}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Discount (₹)</label>
                    <input
                      type="number"
                      name="discount"
                      value={invoiceFormData.discount}
                      onChange={handleInvoiceInputChange}
                      placeholder="0"
                      step="0.01"
                      min="0"
                      disabled={formLoading}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.chargeListModalFooter}>
                <button type="button" onClick={closeForm} className={styles.btnCancel} disabled={formLoading}>
                  Cancel
                </button>
                <button type="submit" className={styles.btnSubmit} disabled={formLoading}>
                  {formLoading ? 'Processing...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationChargeList;