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
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setSelectedConfig(null);
    setFormError(null);
    setFormSuccess(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
                    <input type="text" name="chargeCode" value={formData.chargeCode} onChange={handleInputChange} placeholder="CONS001" disabled={formLoading} required />
                  </div>
                  <div className="form-group">
                    <label>Charge Name <span className="required">*</span></label>
                    <input type="text" name="chargeName" value={formData.chargeName} onChange={handleInputChange} placeholder="General Consultation" disabled={formLoading} required />
                  </div>
                  <div className="form-group">
                    <label>Default Amount (₹) <span className="required">*</span></label>
                    <input type="number" name="defaultAmount" value={formData.defaultAmount} onChange={handleInputChange} placeholder="500" step="0.01" min="0" disabled={formLoading} required />
                  </div>
                  <div className="form-group">
                    <label>GST Number</label>
                    <input type="text" name="gstNo" value={formData.gstNo} onChange={handleInputChange} placeholder="Auto-filled" disabled={formLoading} />
                  </div>
                  <div className="form-group">
                    <label>CGST Percentage (%)</label>
                    <input type="number" name="cgstPercentage" value={formData.cgstPercentage} onChange={handleInputChange} placeholder="9" step="0.01" min="0" max="100" disabled={formLoading} />
                  </div>
                  <div className="form-group">
                    <label>SGST Percentage (%)</label>
                    <input type="number" name="sgstPercentage" value={formData.sgstPercentage} onChange={handleInputChange} placeholder="9" step="0.01" min="0" max="100" disabled={formLoading} />
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