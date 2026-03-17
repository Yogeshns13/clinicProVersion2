// src/components/ConsultationChargeList.jsx
// Simplified single-view consultation list with invoice generation
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiFileText, FiX } from 'react-icons/fi';
import {
  getConsultationList,
  getConsultingChargeConfigList,
  addConsultationCharge,
  generateConsultationInvoice
} from '../Api/ApiConsultation.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ConsultationChargeList.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const ConsultationChargeList = () => {
  const [consultations, setConsultations] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [chargeConfigs, setChargeConfigs] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  // ── Pagination ──
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filter inputs (not applied until Search is clicked)
  const [filterInputs, setFilterInputs] = useState({
    searchType: 'patientName',
    searchValue: '',
    dateFrom: today,
    dateTo: today
  });

  // Applied filters (drive API call + client-side filter)
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'patientName',
    searchValue: '',
    dateFrom: today,
    dateTo: today
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const [invoiceFormData, setInvoiceFormData] = useState({
    consultationId: null,
    chargeId: '',
    chargeAmount: '',
    invoiceDate: today,
    discount: '0'
  });

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.dateFrom           !== today ||
    appliedFilters.dateTo             !== today;

  // ────────────────────────────────────────────────
  const fetchConsultations = async (filters = appliedFilters, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        BranchID: branchId,
        Page: currentPage,
        PageSize: pageSize,
        ...(filters.dateFrom && { FromDate: filters.dateFrom }),
        ...(filters.dateTo   && { ToDate:   filters.dateTo   }),
      };

      const data = await getConsultationList(clinicId, options);

      // Filter out consultations that already have invoices
      const withoutInvoice = data.filter(c => !c.invoiceId);
      setAllConsultations(withoutInvoice);
    } catch (err) {
      setError(err?.status >= 400 ? err : { message: err.message || 'Failed to load consultations' });
    } finally {
      setLoading(false);
    }
  };

  const fetchChargeConfigs = async () => {
    try {
      const clinicId = await getStoredClinicId();
      const data = await getConsultingChargeConfigList(clinicId, { PageSize: 100, Status: 1 });
      setChargeConfigs(data);
    } catch (err) {
      console.error('fetchChargeConfigs error:', err);
    }
  };

  useEffect(() => { fetchChargeConfigs(); }, []);

  useEffect(() => { fetchConsultations(appliedFilters, page); }, [appliedFilters]);

  // ── Client-side filtering by search type/value
  const filteredConsultations = useMemo(() => {
    let filtered = allConsultations;

    if (appliedFilters.searchValue) {
      const term = appliedFilters.searchValue.toLowerCase();
      switch (appliedFilters.searchType) {
        case 'patientName':
          filtered = filtered.filter(c => c.patientName?.toLowerCase().includes(term));
          break;
        case 'patientMobile':
          filtered = filtered.filter(c => c.patientMobile?.toLowerCase().includes(term));
          break;
        case 'patientFileNo':
          filtered = filtered.filter(c => c.patientFileNo?.toLowerCase().includes(term));
          break;
        case 'doctorName':
          filtered = filtered.filter(c => c.doctorFullName?.toLowerCase().includes(term));
          break;
        default:
          break;
      }
    }

    return filtered;
  }, [allConsultations, appliedFilters]);

  // ── Pagination helpers ──
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchConsultations(appliedFilters, newPage);
  };

  const startRecord = filteredConsultations.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + filteredConsultations.length;

  // ────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const defaultFilters = { searchType: 'patientName', searchValue: '', dateFrom: today, dateTo: today };
    setPage(1);
    setFilterInputs(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  // ────────────────────────────────────────────────
  const openInvoiceForm = (consultation) => {
    setInvoiceFormData({
      consultationId: consultation.id,
      chargeId: '',
      chargeAmount: '',
      invoiceDate: consultation.dateCreated?.split('T')[0] || today,
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
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

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
        fetchConsultations(appliedFilters);
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to generate invoice');
    } finally {
      setFormLoading(false);
    }
  };

  const formatCurrency = (amount) => amount ? `₹${Number(amount).toFixed(2)}` : '₹0.00';

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  // ────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.chargeListLoading}>Loading consultations...</div>;
  if (error)   return <div className={styles.chargeListError}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.chargeListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Consultation Charges" />

      {/* ── Filters ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="patientName">Name</option>
              <option value="patientMobile">Mobile</option>
              <option value="patientFileNo">File Code</option>
              <option value="doctorName">Doctor Name</option>
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'patientName'   ? 'Name'        :
                filterInputs.searchType === 'patientMobile' ? 'Mobile'      :
                filterInputs.searchType === 'patientFileNo' ? 'File Code'   :
                'Doctor Name'
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

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

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={18} /> Search
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={18} /> Clear
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── Table + Pagination wrapper ── */}
      <div className={styles.tableSection}>

        <div className={styles.chargeListTableContainer}>
          <table className={styles.chargeListTable}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Visit Date</th>
                <th>Reason</th>
                <th>Symptoms</th>
                <th>Vitals</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.chargeListNoData}>
                    {hasActiveFilters
                      ? 'No consultations found.'
                      : 'No consultations available yet.'}
                  </td>
                </tr>
              ) : (
                filteredConsultations.map((consult) => (
                  <tr key={consult.id}>
                    <td>
                      <div className={styles.patientCell}>
                        <div>
                          <div className={styles.patientName}>{consult.patientName}</div>
                          {consult.patientMobile && (
                            <div className={styles.patientInfo}>{consult.patientMobile}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.doctorName}>{consult.doctorFullName}</span>
                      {consult.doctorCode && (
                        <div className={styles.chargeCode}>{consult.doctorCode}</div>
                      )}
                    </td>
                    <td><span className={styles.dateText}>{formatDate(consult.dateCreated)}</span></td>
                    <td><span className={styles.reasonText}>{consult.reason || '—'}</span></td>
                    <td><span className={styles.symptomsText}>{consult.symptoms || '—'}</span></td>
                    <td>
                      <div className={styles.vitalsCell}>
                        {consult.bpReading  && <span className={styles.vitalItem}>BP: {consult.bpReading}</span>} |
                        {consult.temperature && <span className={styles.vitalItem}>Temp: {consult.temperature}°</span>} |
                        {consult.weight     && <span className={styles.vitalItem}>Wt: {consult.weight} kg</span>}
                      </div>
                    </td>
                    <td>
                      <div className={styles.chargeListActionsCell}>
                        <button
                          onClick={() => openInvoiceForm(consult)}
                          className={styles.invoiceBtn}
                          title="Make Invoice"
                        >
                          <FiFileText size={16} /> Make Invoice
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Bar — pinned to bottom of tableSection ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {filteredConsultations.length > 0
              ? `Showing ${startRecord}–${endRecord} records`
              : 'No records'}
          </div>

          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              title="First page"
            >
              «
            </button>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              title="Previous page"
            >
              ‹
            </button>

            <span className={styles.pageIndicator}>{page}</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page + 1)}
              disabled={filteredConsultations.length < pageSize}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{pageSize}</strong>
          </div>
        </div>

      </div>{/* end tableSection */}

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
                {formError   && <div className={styles.formError}>{formError}</div>}
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
                <button
                  type="button"
                  onClick={closeForm}
                  className={styles.btnCancel}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={formLoading}
                >
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