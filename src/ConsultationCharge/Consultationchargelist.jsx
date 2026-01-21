// src/components/ConsultationChargeList.jsx
// Similar to InvoiceList but focused on managing charges before invoicing
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiPlus, FiX, FiCheck, FiDollarSign, FiFileText } from 'react-icons/fi';
import {
  getConsultationChargeList, addConsultationCharge, cancelConsultationCharge,
  getConsultationList, getConsultingChargeConfigList, generateConsultationInvoice
} from '../api/api-consultation.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './SharedBillingComponents.css';

const ConsultationChargeList = () => {
  const [charges, setCharges] = useState([]);
  const [allCharges, setAllCharges] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [chargeConfigs, setChargeConfigs] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formData, setFormData] = useState({ consultationId: '', chargeId: '', chargeAmount: '' });
  const [invoiceFormData, setInvoiceFormData] = useState({ consultationId: '', invoiceDate: '', discount: '0' });

  const fetchCharges = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const data = await getConsultationChargeList(clinicId, { BranchID: branchId, PageSize: 100 });
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
      const data = await getConsultationList(clinicId, { BranchID: branchId, PageSize: 100 });
      setConsultations(data.filter(c => !c.invoiceId));
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
    fetchCharges();
    fetchConsultations();
    fetchChargeConfigs();
  }, []);

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

  const statistics = useMemo(() => {
    const total = filteredCharges.reduce((sum, c) => sum + (c.netAmount || 0), 0);
    const invoiced = filteredCharges.filter(c => c.isInvoiced).length;
    const pending = filteredCharges.filter(c => !c.isInvoiced).length;
    return { total, invoiced, pending, count: filteredCharges.length };
  }, [filteredCharges]);

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const openAddForm = () => {
    setFormData({ consultationId: '', chargeId: '', chargeAmount: '' });
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
        fetchConsultations();
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
        fetchConsultations();
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
      fetchConsultations();
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

      <div className="charge-list-toolbar">
        <div className="charge-list-search-container">
          <input type="text" placeholder="Search by patient, doctor, charge..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyPress={handleKeyPress} className="charge-list-search-input" />
          <button onClick={handleSearch} className="charge-list-search-btn"><FiSearch size={20} /></button>
        </div>
        <button onClick={openAddForm} className="charge-list-add-btn"><FiPlus size={20} />Add Charge</button>
      </div>

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
                    <select name="consultationId" value={formData.consultationId} onChange={handleInputChange} disabled={formLoading} required>
                      <option value="">Select consultation</option>
                      {consultations.map(c => (
                        <option key={c.id} value={c.id}>{c.patientName} - {c.doctorFullName} ({formatDate(c.dateCreated)})</option>
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