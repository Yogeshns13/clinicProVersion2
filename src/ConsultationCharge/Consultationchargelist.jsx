// src/components/ConsultationChargeList.jsx
// Enhanced with tabs: PendingCharges and ChargedPatients
// Added date filters with today's default
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiPlus, FiX, FiCheck, FiDollarSign, FiFileText, FiFilter, FiCalendar } from 'react-icons/fi';
import {
  getConsultationChargeList, addConsultationCharge, cancelConsultationCharge,
  getConsultationList, getConsultingChargeConfigList, generateConsultationInvoice
} from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './Consultationchargelist.css';

const ConsultationChargeList = () => {
  const [charges, setCharges] = useState([]);
  const [allCharges, setAllCharges] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [pendingConsultations, setPendingConsultations] = useState([]);
  const [chargeConfigs, setChargeConfigs] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date filter states - default to today
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [appliedFromDate, setAppliedFromDate] = useState(today);
  const [appliedToDate, setAppliedToDate] = useState(today);
  const [showFilters, setShowFilters] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formData, setFormData] = useState({ consultationId: '', chargeId: '', chargeAmount: '' });
  const [invoiceFormData, setInvoiceFormData] = useState({ consultationId: '', invoiceDate: '', discount: '0' });
  
  // Tab management
  const [activeTab, setActiveTab] = useState('pending'); // Start with 'pending' to show today's consultations first

  const fetchCharges = async () => {
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
      
      // Only add date filters if they are set
      if (appliedFromDate) options.FromDate = appliedFromDate;
      if (appliedToDate) options.ToDate = appliedToDate;
      
      const data = await getConsultationChargeList(clinicId, options);
      setCharges(data);
      setAllCharges(data);
    } catch (err) {
      setError(err?.status >= 400 ? err : { message: err.message || 'Failed to load charges' });
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      // Build options with date filters
      const options = { 
        BranchID: branchId, 
        PageSize: 100 
      };
      
      // Only add date filters if they are set
      if (appliedFromDate) options.FromDate = appliedFromDate;
      if (appliedToDate) options.ToDate = appliedToDate;
      
      const data = await getConsultationList(clinicId, options);
      
      // Separate consultations into those without invoices (for adding charges)
      // and those without any charges at all (pending)
      const withoutInvoice = data.filter(c => !c.invoiceId);
      setConsultations(withoutInvoice);
      
      // Get consultation IDs that already have charges
      const consultationIdsWithCharges = [...new Set(allCharges.map(ch => ch.consultationId))];
      
      // Pending consultations are those without any charges yet
      const pending = data.filter(c => !consultationIdsWithCharges.includes(c.id));
      setPendingConsultations(pending);
    } catch (err) {
      console.error('fetchConsultations error:', err);
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

  // Fetch data when applied date filters change
  useEffect(() => {
    fetchCharges();
  }, [appliedFromDate, appliedToDate]);

  useEffect(() => {
    // Re-fetch consultations whenever charges change to update pending list
    if (allCharges.length >= 0) {
      fetchConsultations();
    }
  }, [allCharges, appliedFromDate, appliedToDate]);

  const filteredCharges = useMemo(() => {
    if (!searchTerm.trim()) return allCharges;
    const term = searchTerm.toLowerCase();
    return allCharges.filter(charge =>
      charge.patientName?.toLowerCase().includes(term) ||
      charge.doctorFullName?.toLowerCase().includes(term) ||
      charge.chargeName?.toLowerCase().includes(term) ||
      charge.patientFileNo?.toLowerCase().includes(term)
    );
  }, [allCharges, searchTerm]);

  const filteredPendingConsultations = useMemo(() => {
    if (!searchTerm.trim()) return pendingConsultations;
    const term = searchTerm.toLowerCase();
    return pendingConsultations.filter(consult =>
      consult.patientName?.toLowerCase().includes(term) ||
      consult.doctorFullName?.toLowerCase().includes(term) ||
      consult.patientFileNo?.toLowerCase().includes(term)
    );
  }, [pendingConsultations, searchTerm]);

  const statistics = useMemo(() => {
    const total = filteredCharges.reduce((sum, c) => sum + (c.netAmount || 0), 0);
    const invoiced = filteredCharges.filter(c => c.isInvoiced).length;
    const pending = filteredCharges.filter(c => !c.isInvoiced).length;
    return { total, invoiced, pending, count: filteredCharges.length };
  }, [filteredCharges]);

  const pendingStatistics = useMemo(() => {
    return {
      count: filteredPendingConsultations.length,
      today: filteredPendingConsultations.filter(c => {
        const consultDate = new Date(c.dateCreated).toISOString().split('T')[0];
        return consultDate === today;
      }).length
    };
  }, [filteredPendingConsultations, today]);

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const applyDateFilters = () => {
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const clearDateFilters = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    setFromDate(todayDate);
    setToDate(todayDate);
    setAppliedFromDate(todayDate);
    setAppliedToDate(todayDate);
  };

  const setTodayFilter = () => {
    const todayDate = new Date().toISOString().split('T')[0];
    setFromDate(todayDate);
    setToDate(todayDate);
    setAppliedFromDate(todayDate);
    setAppliedToDate(todayDate);
  };

  const setThisWeekFilter = () => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
    
    const from = firstDay.toISOString().split('T')[0];
    const to = lastDay.toISOString().split('T')[0];
    
    setFromDate(from);
    setToDate(to);
    setAppliedFromDate(from);
    setAppliedToDate(to);
  };

  const setThisMonthFilter = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const from = firstDay.toISOString().split('T')[0];
    const to = lastDay.toISOString().split('T')[0];
    
    setFromDate(from);
    setToDate(to);
    setAppliedFromDate(from);
    setAppliedToDate(to);
  };

  const openAddForm = (preselectedConsultationId = null) => {
    setFormData({ 
      consultationId: preselectedConsultationId ? preselectedConsultationId.toString() : '', 
      chargeId: '', 
      chargeAmount: '' 
    });
    setFormError(null);
    setFormSuccess(null);
    setIsFormOpen(true);
  };

  const openInvoiceForm = (charge) => {
    const consultation = consultations.find(c => c.id === charge.consultationId);
    setInvoiceFormData({
      consultationId: charge.consultationId,
      invoiceDate: consultation?.dateCreated?.split('T')[0] || new Date().toISOString().split('T')[0],
      discount: '0'
    });
    setFormError(null);
    setFormSuccess(null);
    setIsInvoiceFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setIsInvoiceFormOpen(false);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'chargeId' && value) {
      const config = chargeConfigs.find(c => c.id === Number(value));
      if (config && !formData.chargeAmount) {
        setFormData(prev => ({ ...prev, chargeAmount: config.defaultAmount?.toString() || '' }));
      }
    }
  };

  const handleInvoiceInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.consultationId) {
      setFormError('Please select a consultation');
      return false;
    }
    if (!formData.chargeId) {
      setFormError('Please select a charge type');
      return false;
    }
    const amount = Number(formData.chargeAmount);
    if (isNaN(amount) || amount < 0) {
      setFormError('Please enter a valid amount');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setFormLoading(true);
      setFormError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      let finalAmount = Number(formData.chargeAmount);
      if (finalAmount === 0) {
        const config = chargeConfigs.find(c => c.id === Number(formData.chargeId));
        finalAmount = config?.defaultAmount || 0;
      }
      await addConsultationCharge({
        clinicId, branchId,
        consultationId: Number(formData.consultationId),
        chargeId: Number(formData.chargeId),
        chargeAmount: finalAmount
      });
      setFormSuccess('Charge added successfully!');
      setTimeout(() => {
        closeForm();
        fetchCharges();
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to add charge');
    } finally {
      setFormLoading(false);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      setFormError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      await generateConsultationInvoice({
        clinicId, branchId,
        consultationId: Number(invoiceFormData.consultationId),
        invoiceDate: invoiceFormData.invoiceDate,
        discount: Number(invoiceFormData.discount)
      });
      setFormSuccess('Invoice generated successfully!');
      setTimeout(() => {
        closeForm();
        fetchCharges();
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to generate invoice');
    } finally {
      setFormLoading(false);
    }
  };

  const handleCancel = async (charge) => {
    if (!window.confirm(`Cancel charge "${charge.chargeName}" for ${charge.patientName}?`)) return;
    try {
      await cancelConsultationCharge(charge.id);
      fetchCharges();
    } catch (err) {
      setError({ message: err.message || 'Failed to cancel charge' });
    }
  };

  const formatCurrency = (amount) => amount ? `₹${Number(amount).toFixed(2)}` : '₹0.00';
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="charge-list-loading">Loading charges...</div>;

  return (
    <div className="charge-list-wrapper">
      <ErrorHandler error={error} />
      <Header title="Consultation Charges" />

      {formSuccess && !isFormOpen && !isInvoiceFormOpen && <div className="form-success">{formSuccess}</div>}

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
          <button onClick={clearDateFilters} className="filter-clear-btn">
            <FiX size={16} /> Clear Filters
          </button>
        </div>
        <div className="filter-toolbar-right">
          <span className="filter-info">
            <FiCalendar size={16} />
            {appliedFromDate === appliedToDate 
              ? `Showing: ${formatDate(appliedFromDate)}`
              : `${formatDate(appliedFromDate)} - ${formatDate(appliedToDate)}`
            }
          </span>
        </div>
      </div>

      {showFilters && (
        <div className="charge-date-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">From Date</label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
                className="filter-input" 
                max={today}
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

      {/* Tab Navigation */}
      <div className="charge-tabs">
        <button 
          className={`charge-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Charges
          {pendingStatistics.count > 0 && (
            <span className="tab-badge">{pendingStatistics.count}</span>
          )}
        </button>
        <button 
          className={`charge-tab ${activeTab === 'charged' ? 'active' : ''}`}
          onClick={() => setActiveTab('charged')}
        >
          Charged Patients
          {statistics.count > 0 && (
            <span className="tab-badge">{statistics.count}</span>
          )}
        </button>
      </div>

      {/* Statistics */}
      {activeTab === 'pending' && (
        <div className="charge-stats-grid">
          <div className="charge-stat-card stat-count">
            <div className="stat-icon-wrapper"><FiFileText size={24} /></div>
            <div className="stat-content">
              <div className="stat-label">Pending Consultations</div>
              <div className="stat-value">{pendingStatistics.count}</div>
            </div>
          </div>
          <div className="charge-stat-card stat-today">
            <div className="stat-icon-wrapper"><FiCalendar size={24} /></div>
            <div className="stat-content">
              <div className="stat-label">Today's Consultations</div>
              <div className="stat-value">{pendingStatistics.today}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'charged' && (
        <div className="charge-stats-grid">
          <div className="charge-stat-card stat-total">
            <div className="stat-icon-wrapper"><FiDollarSign size={24} /></div>
            <div className="stat-content">
              <div className="stat-label">Total Amount</div>
              <div className="stat-value">{formatCurrency(statistics.total)}</div>
            </div>
          </div>
          <div className="charge-stat-card stat-count">
            <div className="stat-icon-wrapper"><FiFileText size={24} /></div>
            <div className="stat-content">
              <div className="stat-label">Total Charges</div>
              <div className="stat-value">{statistics.count}</div>
            </div>
          </div>
          <div className="charge-stat-card stat-invoiced">
            <div className="stat-icon-wrapper"><FiCheck size={24} /></div>
            <div className="stat-content">
              <div className="stat-label">Invoiced</div>
              <div className="stat-value">{statistics.invoiced}</div>
            </div>
          </div>
          <div className="charge-stat-card stat-pending">
            <div className="stat-icon-wrapper"><FiX size={24} /></div>
            <div className="stat-content">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{statistics.pending}</div>
            </div>
          </div>
        </div>
      )}

      <div className="charge-list-toolbar">
        <div className="charge-list-search-container">
          <input 
            type="text" 
            placeholder={activeTab === 'pending' ? "Search consultations..." : "Search by patient, doctor, charge..."} 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
            onKeyPress={handleKeyPress} 
            className="charge-list-search-input" 
          />
          <button onClick={handleSearch} className="charge-list-search-btn"><FiSearch size={20} /></button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'pending' ? (
        // Pending Consultations Table
        <div className="charge-list-table-container">
          <table className="charge-list-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Visit Date</th>
                <th>Reason</th>
                <th>Symptoms</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPendingConsultations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="charge-list-no-data">
                    {searchTerm ? 'No pending consultations found.' : 'No pending consultations.'}
                  </td>
                </tr>
              ) : (
                filteredPendingConsultations.map((consult) => (
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
                      <div className="charge-list-actions-cell">
                        <button 
                          onClick={() => openAddForm(consult.id)} 
                          className="add-charge-btn" 
                          title="Add Charge"
                        >
                          <FiPlus size={16} /> Add Charge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        // Charged Patients Table (Original)
        <div className="charge-list-table-container">
          <table className="charge-list-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Charge</th>
                <th>Amount</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Net Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCharges.length === 0 ? (
                <tr><td colSpan={10} className="charge-list-no-data">{searchTerm ? 'No charges found.' : 'No charges recorded yet.'}</td></tr>
              ) : (
                filteredCharges.map((charge) => (
                  <tr key={charge.id}>
                    <td>
                      <div className="patient-cell">
                        <div>
                          <div className="patient-name">{charge.patientName}</div>
                          <div className="patient-info">{charge.patientFileNo}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="doctor-name">{charge.doctorFullName}</span></td>
                    <td>
                      <div className="charge-badge">{charge.chargeName}</div>
                      <div className="charge-code">{charge.chargeCode}</div>
                    </td>
                    <td><span className="amount-text">{formatCurrency(charge.chargeAmount)}</span></td>
                    <td><span className="tax-amount">{formatCurrency(charge.cgstAmount)}</span></td>
                    <td><span className="tax-amount">{formatCurrency(charge.sgstAmount)}</span></td>
                    <td><span className="amount-text total">{formatCurrency(charge.netAmount)}</span></td>
                    <td>
                      {charge.isInvoiced ? (
                        <span className="status-badge invoiced">Invoiced</span>
                      ) : (
                        <span className="status-badge pending">Pending</span>
                      )}
                    </td>
                    <td><span className="date-text">{formatDate(charge.dateCreated)}</span></td>
                    <td>
                      <div className="charge-list-actions-cell">
                        {!charge.isInvoiced && (
                          <>
                            <button onClick={() => openInvoiceForm(charge)} className="invoice-btn" title="Generate Invoice"><FiFileText size={16} /></button>
                            <button onClick={() => handleCancel(charge)} className="cancel-btn" title="Cancel Charge"><FiX size={16} /></button>
                          </>
                        )}
                        {charge.isInvoiced && <span className="action-disabled">—</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Charge Modal */}
      {isFormOpen && (
        <div className="charge-list-modal-overlay">
          <div className="charge-list-modal">
            <div className="charge-list-modal-header">
              <h2>Add Consultation Charge</h2>
              <button onClick={closeForm} className="charge-list-modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="charge-list-modal-body">
                {formError && <div className="form-error">{formError}</div>}
                {formSuccess && <div className="form-success">{formSuccess}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Consultation <span className="required">*</span></label>
                    <select 
                      name="consultationId" 
                      value={formData.consultationId} 
                      onChange={handleInputChange} 
                      disabled={formLoading || !!formData.consultationId} 
                      required
                    >
                      <option value="">Select consultation</option>
                      {consultations.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.patientName} - {c.doctorFullName} ({formatDate(c.dateCreated)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Charge Type <span className="required">*</span></label>
                    <select name="chargeId" value={formData.chargeId} onChange={handleInputChange} disabled={formLoading} required>
                      <option value="">Select charge</option>
                      {chargeConfigs.map(c => (
                        <option key={c.id} value={c.id}>{c.chargeName} - {formatCurrency(c.defaultAmount)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Amount (₹) <span className="required">*</span></label>
                    <input type="number" name="chargeAmount" value={formData.chargeAmount} onChange={handleInputChange} placeholder="Enter 0 for default amount" step="0.01" min="0" disabled={formLoading} required />
                    <small>Enter 0 to use default amount from charge configuration</small>
                  </div>
                </div>
              </div>
              <div className="charge-list-modal-footer">
                <button type="button" onClick={closeForm} className="btn-cancel" disabled={formLoading}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={formLoading}>{formLoading ? 'Adding...' : 'Add Charge'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <label>Invoice Date <span className="required">*</span></label>
                    <input type="date" name="invoiceDate" value={invoiceFormData.invoiceDate} onChange={handleInvoiceInputChange} disabled={formLoading} required />
                  </div>
                  <div className="form-group">
                    <label>Discount (₹)</label>
                    <input type="number" name="discount" value={invoiceFormData.discount} onChange={handleInvoiceInputChange} placeholder="0" step="0.01" min="0" disabled={formLoading} />
                  </div>
                </div>
              </div>
              <div className="charge-list-modal-footer">
                <button type="button" onClick={closeForm} className="btn-cancel" disabled={formLoading}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={formLoading}>{formLoading ? 'Generating...' : 'Generate Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationChargeList;