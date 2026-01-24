// src/components/ConsultationChargeList.jsx
// Simplified single-view consultation list with invoice generation
import React, { useState, useEffect } from 'react';
import { FiSearch, FiFileText, FiCalendar, FiFilter, FiX } from 'react-icons/fi';
import {
  getConsultationList,
  getConsultingChargeConfigList,
  addConsultationCharge,
  generateConsultationInvoice
} from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './Consultationchargelist.css';

const ConsultationChargeList = () => {
  const [consultations, setConsultations] = useState([]);
  const [chargeConfigs, setChargeConfigs] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Date filter states - default to today
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [showFilters, setShowFilters] = useState(false);
  
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

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      // Build options with date filters
      const options = { 
        BranchID: branchId, 
        PageSize: 100 
      };
      
      // Add date filters - FromDate always required, ToDate optional
      if (fromDate) options.FromDate = fromDate;
      if (toDate) options.ToDate = toDate;
      
      const data = await getConsultationList(clinicId, options);
      
      // Filter out consultations that already have invoices
      const withoutInvoice = data.filter(c => !c.invoiceId);
      
      setConsultations(withoutInvoice);
    } catch (err) {
      setError(err?.status >= 400 ? err : { message: err.message || 'Failed to load consultations' });
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
  }, []);

  useEffect(() => {
    fetchConsultations();
  }, [fromDate, toDate]);

  // Filter consultations based on search term
  const getFilteredConsultations = () => {
    if (!searchTerm.trim()) return consultations;
    
    const term = searchTerm.toLowerCase();
    return consultations.filter(consult =>
      consult.patientName?.toLowerCase().includes(term) ||
      consult.doctorFullName?.toLowerCase().includes(term) ||
      consult.patientFileNo?.toLowerCase().includes(term) ||
      consult.reason?.toLowerCase().includes(term)
    );
  };

  const filteredConsultations = getFilteredConsultations();

  // Calculate statistics
  const getTotalCount = () => filteredConsultations.length;
  
  const getTodayCount = () => {
    return filteredConsultations.filter(c => {
      const consultDate = new Date(c.dateCreated).toISOString().split('T')[0];
      return consultDate === today;
    }).length;
  };

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const applyDateFilters = () => {
    // Just ensure the state is set - useEffect will handle the fetch
    setFromDate(fromDate);
    setToDate(toDate);
  };

  const clearDateFilters = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    setFromDate(todayDate);
    setToDate(todayDate);
  };

  const setTodayFilter = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    setFromDate(todayDate);
    setToDate(todayDate);
  };

  const setThisWeekFilter = () => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    const from = firstDay.toISOString().split('T')[0];
    const to = lastDay.toISOString().split('T')[0];
    
    setFromDate(from);
    setToDate(to);
  };

  const setThisMonthFilter = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const from = firstDay.toISOString().split('T')[0];
    const to = lastDay.toISOString().split('T')[0];
    
    setFromDate(from);
    setToDate(to);
  };

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
    
    // Auto-fill charge amount when charge is selected
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
      
      // Step 1: Add consultation charge
      const chargeResult = await addConsultationCharge({
        clinicId,
        branchId,
        consultationId: Number(invoiceFormData.consultationId),
        chargeId: Number(invoiceFormData.chargeId),
        chargeAmount: Number(invoiceFormData.chargeAmount)
      });
      
      if (!chargeResult.success) {
        throw new Error('Failed to add consultation charge');
      }
      
      // Step 2: Generate invoice
      const invoiceResult = await generateConsultationInvoice({
        clinicId,
        branchId,
        consultationId: Number(invoiceFormData.consultationId),
        invoiceDate: invoiceFormData.invoiceDate,
        discount: Number(invoiceFormData.discount)
      });
      
      if (!invoiceResult.success) {
        throw new Error('Failed to generate invoice');
      }
      
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

  const formatCurrency = (amount) => amount ? `₹${Number(amount).toFixed(2)}` : '₹0.00';
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDateRangeText = () => {
    if (!toDate) {
      return `Showing: ${formatDate(fromDate)}`;
    }
    if (fromDate === toDate) {
      return `Showing: ${formatDate(fromDate)}`;
    }
    return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="charge-list-loading">Loading consultations...</div>;

  return (
    <div className="charge-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Consultation Charges" />

      {formSuccess && !isInvoiceFormOpen && <div className="form-success">{formSuccess}</div>}

      {/* Date Filter Section */}
      <div className="charge-filter-toolbar">
        <div className="filter-toolbar-left">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          >
            <FiFilter size={18} />
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          {(fromDate !== today || toDate !== today) &&(
          <button onClick={clearDateFilters} className="filter-clear-btn">
            <FiX size={16} /> Clear Filters
          </button>)}

        </div>
        <div className="filter-toolbar-right">
          <span className="filter-info">
            <FiCalendar size={16} />
            {getDateRangeText()}
          </span>
        </div>
      </div>

      {showFilters && (
        <div className="charge-date-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">From Date <span className="required">*</span></label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
                className="filter-input" 
                max={today}
                required
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">To Date</label>
              <input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
                className="filter-input" 
                max={today}
              />
            </div>
            <div className="filter-group">
              <button onClick={applyDateFilters} className="filter-apply-btn">
                <FiSearch size={16} /> Apply
              </button>
            </div>
          </div>
          <div className="filter-quick-actions">
            <button onClick={setTodayFilter} className="quick-filter-btn">Today</button>
            <button onClick={setThisWeekFilter} className="quick-filter-btn">This Week</button>
            <button onClick={setThisMonthFilter} className="quick-filter-btn">This Month</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="charge-list-toolbar">
        <div className="charge-list-search-container">
          <input 
            type="text" 
            placeholder="Search by patient, doctor, file no, reason..." 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
            onKeyPress={handleKeyPress} 
            className="charge-list-search-input" 
          />
          <button onClick={handleSearch} className="charge-list-search-btn">
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="charge-list-table-container">
        <table className="charge-list-table">
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
                <td colSpan={7} className="charge-list-no-data">
                  {searchTerm ? 'No consultations found.' : 'No consultations for the selected date range.'}
                </td>
              </tr>
            ) : (
              filteredConsultations.map((consult) => (
                <tr key={consult.id}>
                  <td>
                    <div className="patient-cell">
                      <div>
                        <div className="patient-name">{consult.patientName}</div>
                        <div className="patient-info">{consult.patientFileNo}</div>
                        {consult.patientMobile && (
                          <div className="patient-info">{consult.patientMobile}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="doctor-name">{consult.doctorFullName}</span>
                    {consult.doctorCode && (
                      <div className="charge-code">{consult.doctorCode}</div>
                    )}
                  </td>
                  <td><span className="date-text">{formatDate(consult.dateCreated)}</span></td>
                  <td><span className="reason-text">{consult.reason || '—'}</span></td>
                  <td><span className="symptoms-text">{consult.symptoms || '—'}</span></td>
                  <td>
                    <div className="vitals-cell">
                      {consult.bpReading && <div className="vital-item">BP: {consult.bpReading}</div>}
                      {consult.temperature && <div className="vital-item">Temp: {consult.temperature}°</div>}
                      {consult.weight && <div className="vital-item">Wt: {consult.weight} kg</div>}
                      {!consult.bpReading && !consult.temperature && !consult.weight && '—'}
                    </div>
                  </td>
                  <td>
                    <div className="charge-list-actions-cell">
                      <button 
                        onClick={() => openInvoiceForm(consult)} 
                        className="invoice-btn" 
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

      {/* Generate Invoice Modal */}
      {isInvoiceFormOpen && (
        <div className="charge-list-modal-overlay">
          <div className="charge-list-modal">
            <div className="charge-list-modal-header">
              <h2>Generate Invoice</h2>
              <button onClick={closeForm} className="charge-list-modal-close">×</button>
            </div>
            <form onSubmit={handleGenerateInvoice}>
              <div className="charge-list-modal-body">
                {formError && <div className="form-error">{formError}</div>}
                {formSuccess && <div className="form-success">{formSuccess}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Charge Type <span className="required">*</span></label>
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
                  <div className="form-group">
                    <label>Charge Amount (₹) <span className="required">*</span></label>
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
                  <div className="form-group">
                    <label>Invoice Date <span className="required">*</span></label>
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
                  <div className="form-group">
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
              <div className="charge-list-modal-footer">
                <button type="button" onClick={closeForm} className="btn-cancel" disabled={formLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={formLoading}>
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