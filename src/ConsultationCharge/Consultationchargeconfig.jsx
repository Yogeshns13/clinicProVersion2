// src/components/ConsultationChargeConfig.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';
import {
  getConsultingChargeConfigList,
  addConsultationChargeConfig,
  updateConsultationChargeConfig,
  deleteConsultationChargeConfig
} from '../api/api-consultation.js';
import { getClinicList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import './ConsultationChargeConfig.css';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'chargeCode':
      if (!value || !value.trim()) return 'Charge code is required';
      if (/[a-z]/.test(value)) return 'Charge code cannot contain lowercase letters';
      if (/[^A-Z0-9]/.test(value)) return 'Charge code can only contain uppercase letters and numbers';
      if (value.trim().length < 3) return 'Charge code must be at least 3 characters';
      if (value.trim().length > 20) return 'Charge code must not exceed 20 characters';
      return '';

    case 'chargeName':
      if (!value || !value.trim()) return 'Charge name is required';
      if (/[0-9]/.test(value)) return 'Charge name cannot contain numbers';
      if (/[^a-zA-Z\s]/.test(value)) return 'Charge name can only contain letters and spaces';
      if (value.trim().length < 2) return 'Charge name must be at least 2 characters';
      if (value.trim().length > 100) return 'Charge name must not exceed 100 characters';
      return '';

    case 'gstNo':
  if (!value || value === '') return ''; 
  
  const len = value.length;
  
  if (len >= 1) {
    if (!/^[0-9]$/.test(value[0])) {
      return 'Char 1: Must be digit (State Code)';
    }
  }
  
  if (len >= 2) {
    if (!/^[0-9]$/.test(value[1])) {
      return 'Char 2: Must be digit (State Code)';
    }
  }
  
  if (len >= 3) {
    if (!/^[A-Z]$/.test(value[2])) {
      return 'Char 3: Must be uppercase letter (PAN letter 1/5)';
    }
  }
  
  if (len >= 4) {
    if (!/^[A-Z]$/.test(value[3])) {
      return 'Char 4: Must be uppercase letter (PAN letter 2/5)';
    }
  }
  
  if (len >= 5) {
    if (!/^[A-Z]$/.test(value[4])) {
      return 'Char 5: Must be uppercase letter (PAN letter 3/5)';
    }
  }
  
  if (len >= 6) {
    if (!/^[A-Z]$/.test(value[5])) {
      return 'Char 6: Must be uppercase letter (PAN letter 4/5)';
    }
  }
  
  if (len >= 7) {
    if (!/^[A-Z]$/.test(value[6])) {
      return 'Char 7: Must be uppercase letter (PAN letter 5/5)';
    }
  }
  
  if (len >= 8) {
    if (!/^[0-9]$/.test(value[7])) {
      return 'Char 8: Must be digit (PAN number 1/4)';
    }
  }
  
  if (len >= 9) {
    if (!/^[0-9]$/.test(value[8])) {
      return 'Char 9: Must be digit (PAN number 2/4)';
    }
  }
  
  if (len >= 10) {
    if (!/^[0-9]$/.test(value[9])) {
      return 'Char 10: Must be digit (PAN number 3/4)';
    }
  }
  
  if (len >= 11) {
    if (!/^[0-9]$/.test(value[10])) {
      return 'Char 11: Must be digit (PAN number 4/4)';
    }
  }
  
  if (len >= 12) {
    if (!/^[A-Z]$/.test(value[11])) {
      return 'Char 12: Must be uppercase letter (PAN last letter)';
    }
  }
  
  if (len >= 13) {
    if (!/^[1-9A-Z]$/.test(value[12])) {
      return 'Char 13: Must be 1-9 or A-Z (Entity number, not 0)';
    }
  }
  
  if (len >= 14) {
    if (value[13] !== 'Z') {
      return 'Char 14: Must be Z (fixed)';
    }
  }
  
  if (len >= 15) {
    if (!/^[0-9A-Z]$/.test(value[14])) {
      return 'Char 15: Must be digit or uppercase letter (Checksum)';
    }
  }
  
  if (len < 15) {
    return `${len}/15 characters entered`;
  }
  
  if (len === 15) {
    return 'Valid GST format (29ABCDE1234F1Z5)';
  }
  
  return '';


    case 'defaultAmount':
      if (!value || value === '') return 'Default amount is required';
      const amount = Number(value);
      if (isNaN(amount)) return 'Must be a valid number';
      if (amount < 0) return 'Amount cannot be negative';
      if (amount === 0) return 'Amount must be greater than zero';
      if (amount > 1000000) return 'Amount cannot exceed ₹10,00,000';
      return '';

    case 'cgstPercentage':
    case 'sgstPercentage':
      if (value === '' || value === null || value === undefined) return ''; // Optional
      const percentage = Number(value);
      if (isNaN(percentage)) return 'Must be a valid number';
      if (percentage < 0) return 'Percentage cannot be negative';
      if (percentage > 100) return 'Percentage cannot exceed 100%';
      return '';

    default:
      return '';
  }
};


const filterInput = (fieldName, value) => {
  switch (fieldName) {
 case 'chargeCode':
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    case 'chargeName':
      return value.replace(/[^a-zA-Z\s]/g, '');
    
    case 'gstNo':
      const filtered = value.replace(/[^A-Z0-9]/g, '');
      return filtered.substring(0, 15),value.toUpperCase();
    
    case 'defaultAmount':
    case 'cgstPercentage':
    case 'sgstPercentage':
      if (value === '') return value;
      const numFiltered = value.replace(/[^0-9.]/g, '');
      const parts = numFiltered.split('.');
      if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
      }
      return numFiltered;
    
    default:
      return value;
  }
};

const ConsultationChargeConfig = () => {
  const [chargeConfigs, setChargeConfigs] = useState([]);
  const [allChargeConfigs, setAllChargeConfigs] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  const [formData, setFormData] = useState({
    clinicId: '',
    chargeCode: '',
    chargeName: '',
    defaultAmount: '',
    gstNo: '',
    cgstPercentage: '',
    sgstPercentage: ''
  });

  const [validationMessages, setValidationMessages] = useState({});

  const fetchChargeConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const data = await getConsultingChargeConfigList(clinicId, { PageSize: 100 });
      setChargeConfigs(data);
      setAllChargeConfigs(data);
    } catch (err) {
      setError(err?.status >= 400 || err?.code >= 400 ? err : {
        message: err.message || 'Failed to load charge configurations'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const data = await getClinicList(clinicId);
      setClinics(data);
    } catch (err) {
      console.error('fetchClinics error:', err);
    }
  };

  useEffect(() => {
    fetchChargeConfigs();
    fetchClinics();
  }, []);

  const filteredConfigs = useMemo(() => {
    if (!searchTerm.trim()) return allChargeConfigs;
    const term = searchTerm.toLowerCase();
    return allChargeConfigs.filter(config =>
      config.chargeCode?.toLowerCase().includes(term) ||
      config.chargeName?.toLowerCase().includes(term)
    );
  }, [allChargeConfigs, searchTerm]);

  const handleSearch = () => setSearchTerm(searchInput.trim());
  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const openAddForm = () => {
    setIsEditMode(false);
    setSelectedConfig(null);
    const clinicId = Number(localStorage.getItem('clinicID'));
    const clinic = clinics.find(c => c.id === clinicId);
    setFormData({
      clinicId: clinicId || '',
      chargeCode: '',
      chargeName: '',
      defaultAmount: '',
      gstNo: clinic?.gstNo || '',
      cgstPercentage: clinic?.cgstPercentage || '',
      sgstPercentage: clinic?.sgstPercentage || ''
    });
    setFormError(null);
    setFormSuccess(null);
    setValidationMessages({}); 
    setIsFormOpen(true);
  };

  const openEditForm = (config) => {
    setIsEditMode(true);
    setSelectedConfig(config);
    setFormData({
      clinicId: config.clinicId,
      chargeCode: config.chargeCode,
      chargeName: config.chargeName,
      defaultAmount: config.defaultAmount || '',
      gstNo: '',
      cgstPercentage: config.cgstPercentage || '',
      sgstPercentage: config.sgstPercentage || ''
    });
    setFormError(null);
    setFormSuccess(null);
    setValidationMessages({}); 
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setSelectedConfig(null);
    setFormError(null);
    setFormSuccess(null);
    setValidationMessages({}); 
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    
    setFormData(prev => ({ ...prev, [name]: filteredValue }));
    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
  };

  const validateForm = () => {
    if (!formData.chargeCode.trim()) {
      setFormError('Charge Code is required');
      return false;
    }
    if (!formData.chargeName.trim()) {
      setFormError('Charge Name is required');
      return false;
    }
    if (!formData.defaultAmount || isNaN(formData.defaultAmount) || Number(formData.defaultAmount) < 0) {
      setFormError('Valid Default Amount is required');
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
      setFormSuccess(null);

      const submitData = {
        ...formData,
        clinicId: Number(formData.clinicId),
        defaultAmount: Number(formData.defaultAmount),
        cgstPercentage: Number(formData.cgstPercentage) || 0,
        sgstPercentage: Number(formData.sgstPercentage) || 0
      };

      if (isEditMode) {
        submitData.chargeId = selectedConfig.id;
        await updateConsultationChargeConfig(submitData);
        setFormSuccess('Charge configuration updated successfully!');
      } else {
        await addConsultationChargeConfig(submitData);
        setFormSuccess('Charge configuration added successfully!');
      }

      setTimeout(() => {
        closeForm();
        fetchChargeConfigs();
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to save charge configuration');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (config) => {
    if (!window.confirm(`Are you sure you want to delete "${config.chargeName}"?`)) return;

    try {
      await deleteConsultationChargeConfig(config.id);
      fetchChargeConfigs();
    } catch (err) {
      setError({ message: err.message || 'Failed to delete' });
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${Number(amount).toFixed(2)}`;
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className="charge-config-loading">Loading...</div>;

  return (
    <div className="charge-config-wrapper">
      <ErrorHandler error={error} />
      <Header title="Consultation Charge Configuration" />

      {formSuccess && !isFormOpen && <div className="form-success">{formSuccess}</div>}

      <div className="charge-config-toolbar">
        <div className="charge-config-search-container">
          <input
            type="text"
            placeholder="Search by code or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="charge-config-search-input"
          />
          <button onClick={handleSearch} className="charge-config-search-btn">
            <FiSearch size={20} />
          </button>
        </div>
        <button onClick={openAddForm} className="charge-config-add-btn">
          <FiPlus size={20} />
          Add Charge Config
        </button>
      </div>

      <div className="charge-config-table-container">
        <table className="charge-config-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Charge Name</th>
              <th>Default Amount</th>
              <th>CGST %</th>
              <th>SGST %</th>
              <th>Total with Tax</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredConfigs.length === 0 ? (
              <tr>
                <td colSpan={8} className="charge-config-no-data">
                  {searchTerm ? 'No configurations found.' : 'No configurations yet.'}
                </td>
              </tr>
            ) : (
              filteredConfigs.map((config) => (
                <tr key={config.id}>
                  <td><div className="charge-code-badge">{config.chargeCode}</div></td>
                  <td>
                    <div className="charge-name-cell">
                      <FiDollarSign size={16} className="charge-icon" />
                      <span className="charge-name">{config.chargeName}</span>
                    </div>
                  </td>
                  <td><span className="amount-text">{formatCurrency(config.defaultAmount)}</span></td>
                  <td><span className="tax-badge cgst">{config.cgstPercentage ? `${config.cgstPercentage}%` : '—'}</span></td>
                  <td><span className="tax-badge sgst">{config.sgstPercentage ? `${config.sgstPercentage}%` : '—'}</span></td>
                  <td><span className="amount-text total">{formatCurrency(config.amountInclusiveTax || config.defaultAmount)}</span></td>
                  <td><span className={`status-badge ${config.status}`}>{config.status}</span></td>
                  <td>
                    <div className="charge-config-actions-cell">
                      <button onClick={() => openEditForm(config)} className="charge-config-edit-btn" title="Edit">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(config)} className="charge-config-delete-btn" title="Delete">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="charge-config-modal-overlay">
          <div className="charge-config-modal">
            <div className="charge-config-modal-header">
              <h2>{isEditMode ? 'Edit' : 'Add'} Charge Configuration</h2>
              <button onClick={closeForm} className="charge-config-modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="charge-config-modal-body">
                {formError && <div className="form-error">{formError}</div>}
                {formSuccess && <div className="form-success">{formSuccess}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Charge Code <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="chargeCode" 
                      value={formData.chargeCode} 
                      onChange={handleInputChange} 
                      placeholder="CONS001" 
                      disabled={formLoading} 
                      maxLength="20"
                      required 
                    />
                    
                    {validationMessages.chargeCode && (
                      <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validationMessages.chargeCode}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Charge Name <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="chargeName" 
                      value={formData.chargeName} 
                      onChange={handleInputChange} 
                      placeholder="General Consultation" 
                      disabled={formLoading} 
                      maxLength="100"
                      required 
                    />
                    
                    {validationMessages.chargeName && (
                      <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validationMessages.chargeName}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Default Amount (₹) <span className="required">*</span></label>
                    <input 
                      type="text" 
                      name="defaultAmount" 
                      value={formData.defaultAmount} 
                      onChange={handleInputChange} 
                      placeholder="500.00" 
                      disabled={formLoading} 
                      required 
                    />
                    
                    {validationMessages.defaultAmount && (
                      <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validationMessages.defaultAmount}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>GST Number</label>
                    <input 
                      type="text" 
                      name="gstNo" 
                      value={formData.gstNo} 
                      onChange={handleInputChange} 
                      placeholder="29ABCDE1234F1Z5" 
                      disabled={formLoading}
                      maxLength="15"
                    />
                    
                    {validationMessages.gstNo && (
                      <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validationMessages.gstNo}
                      </span>
                    )}
                    <span style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                      Format: 29ABCDE1234F1Z5 (15 characters)
                    </span>
                  </div>
                  <div className="form-group">
                    <label>CGST Percentage (%)</label>
                    <input 
                      type="text" 
                      name="cgstPercentage" 
                      value={formData.cgstPercentage} 
                      onChange={handleInputChange} 
                      placeholder="9" 
                      disabled={formLoading} 
                    />
                    
                    {validationMessages.cgstPercentage && (
                      <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validationMessages.cgstPercentage}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>SGST Percentage (%)</label>
                    <input 
                      type="text" 
                      name="sgstPercentage" 
                      value={formData.sgstPercentage} 
                      onChange={handleInputChange} 
                      placeholder="9" 
                      disabled={formLoading} 
                    />
                    
                    {validationMessages.sgstPercentage && (
                      <span style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        {validationMessages.sgstPercentage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="charge-config-modal-footer">
                <button type="button" onClick={closeForm} className="btn-cancel" disabled={formLoading}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={formLoading}>{formLoading ? 'Saving...' : isEditMode ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationChargeConfig;