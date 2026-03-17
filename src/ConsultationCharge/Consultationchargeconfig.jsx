// src/components/ConsultationChargeConfig.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { FiSearch, FiPlus, FiX, FiDollarSign } from 'react-icons/fi';
import {
  getConsultingChargeConfigList,
  addConsultationChargeConfig,
  updateConsultationChargeConfig,
  deleteConsultationChargeConfig
} from '../Api/ApiConsultation.js';
import { getClinicList } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ConsultationChargeConfig.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const PAGE_SIZE = 20;

const codeRegex = /^[A-Za-z0-9\-_]+$/;

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'chargeCode':
      if (!value || !value.trim()) return 'ChargeCode is required';
      if (!codeRegex.test(value.trim())) return 'ChargeCode can only contain letters, numbers, hyphen and underscore';
      if (value.trim().length > 20) return 'ChargeCode cannot exceed 20 characters';
      return '';

    case 'chargeName':
      if (!value || !value.trim()) return 'ChargeName is required';
      if (value.trim().length < 1 || value.trim().length > 100) return 'ChargeName must be between 1 and 100 characters';
      return '';

    case 'defaultAmount': {
      if (!value || value === '') return 'DefaultAmount is required';
      const decimalRegex = /^\d+(\.\d{1,2})?$/;
      if (!decimalRegex.test(value)) return 'DefaultAmount must be a valid decimal with up to 2 places';
      if (parseFloat(value) <= 0) return 'DefaultAmount must be greater than 0';
      return '';
    }

    case 'gstNo':
      if (!value || !value.trim()) return 'GstNo is required';
      if (value.trim().length < 15) return `GST number must be 15 characters (${value.trim().length}/15 entered)`;
      if (value.trim().length > 15) return 'GST number must not exceed 15 characters';
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.trim())) return 'Invalid GST format (e.g. 29ABCDE1234F1Z5)';
      return '';

    case 'cgstPercentage': {
      if (value === '' || value === null || value === undefined) return '';
      const decimalRegex = /^\d+(\.\d{1,2})?$/;
      if (!decimalRegex.test(value)) return 'CGSTPercentage must be valid (e.g., 9.00)';
      const pct = parseFloat(value);
      if (pct < 0 || pct > 100) return 'CGSTPercentage must be between 0 and 100';
      return '';
    }

    case 'sgstPercentage': {
      if (value === '' || value === null || value === undefined) return '';
      const decimalRegex = /^\d+(\.\d{1,2})?$/;
      if (!decimalRegex.test(value)) return 'SGSTPercentage must be valid (e.g., 9.00)';
      const pct = parseFloat(value);
      if (pct < 0 || pct > 100) return 'SGSTPercentage must be between 0 and 100';
      return '';
    }

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'chargeCode':
      return value.replace(/[^A-Za-z0-9\-_]/g, '');
    case 'chargeName':
      return value;
    case 'gstNo':
      return value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 15);
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

const toStatusNumber = (status) => {
  if (status === 1 || status === 2) return status;
  if (typeof status === 'string' && status.toLowerCase() === 'active') return 1;
  return 2;
};

const ConsultationChargeConfig = () => {
  const [chargeConfigs, setChargeConfigs] = useState([]);
  const [allChargeConfigs, setAllChargeConfigs] = useState([]);
  const [clinics, setClinics] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [filterInputs, setFilterInputs] = useState({
    searchType: 'chargeName',
    searchValue: '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'chargeName',
    searchValue: '',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedConfig, setSelectedConfig] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
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
    sgstPercentage: '',
    status: 1
  });

  const [validationMessages, setValidationMessages] = useState({});

  const fetchChargeConfigs = async (pageNum = page) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const options = {
        Page: pageNum,
        PageSize: PAGE_SIZE
      };
      const data = await getConsultingChargeConfigList(clinicId, options);
      setChargeConfigs(data);
      setAllChargeConfigs(data);
      setHasNext(data.length === PAGE_SIZE);
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
      const clinicId = await getStoredClinicId();
      const data = await getClinicList(clinicId);
      setClinics(data);
    } catch (err) {
      console.error('fetchClinics error:', err);
    }
  };

  useEffect(() => {
    fetchChargeConfigs(1);
    setPage(1);
    fetchClinics();
  }, [appliedFilters]);

  const filteredConfigs = useMemo(() => {
    if (!appliedFilters.searchValue.trim()) return chargeConfigs;
    const term = appliedFilters.searchValue.toLowerCase();
    switch (appliedFilters.searchType) {
      case 'chargeName':
        return chargeConfigs.filter(c => c.chargeName?.toLowerCase().includes(term));
      case 'chargeCode':
        return chargeConfigs.filter(c => c.chargeCode?.toLowerCase().includes(term));
      default:
        return chargeConfigs.filter(c =>
          c.chargeName?.toLowerCase().includes(term) ||
          c.chargeCode?.toLowerCase().includes(term)
        );
    }
  }, [chargeConfigs, appliedFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
    setPage(1);
  };

  const handleClearFilters = () => {
    const empty = { searchType: 'chargeName', searchValue: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchChargeConfigs(newPage);
  };

  const openDetails = (config) => setSelectedConfig(config);
  const closeDetails = () => setSelectedConfig(null);

  const openAddForm = async () => {
    setIsEditMode(false);
    setEditingConfig(null);
    const clinicId = await getStoredClinicId();
    const clinic = clinics.find(c => c.id === clinicId);
    setFormData({
      clinicId: clinicId || '',
      chargeCode: '',
      chargeName: '',
      defaultAmount: '',
      gstNo: clinic?.gstNo || '',
      cgstPercentage: clinic?.cgstPercentage || '',
      sgstPercentage: clinic?.sgstPercentage || '',
      status: 1
    });
    setFormError(null);
    setFormSuccess(null);
    setValidationMessages({});
    setIsFormOpen(true);
  };

  const openEditForm = (config) => {
    setSelectedConfig(null);
    setIsEditMode(true);
    setEditingConfig(config);
    setFormData({
      clinicId: config.clinicId,
      chargeCode: config.chargeCode,
      chargeName: config.chargeName,
      defaultAmount: config.defaultAmount || '',
      gstNo: '',
      cgstPercentage: config.cgstPercentage || '',
      sgstPercentage: config.sgstPercentage || '',
      status: toStatusNumber(config.status)
    });
    setFormError(null);
    setFormSuccess(null);
    setValidationMessages({});
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setIsEditMode(false);
    setEditingConfig(null);
    setFormError(null);
    setFormSuccess(null);
    setValidationMessages({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    setFormData(prev => ({ ...prev, [name]: filteredValue }));
    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages(prev => ({ ...prev, [name]: validationMessage }));
  };

  const handleStatusChange = (e) => {
    setFormData(prev => ({ ...prev, status: Number(e.target.value) }));
  };

  const validateAllFields = () => {
    const fieldsToValidate = ['chargeCode', 'chargeName', 'defaultAmount', 'cgstPercentage', 'sgstPercentage'];
    const messages = {};
    fieldsToValidate.forEach(field => {
      messages[field] = getLiveValidationMessage(field, formData[field]);
    });
    setValidationMessages(messages);
    return Object.values(messages).every(msg => !msg);
  };

  const hasValidationErrors = Object.values(validationMessages).some(msg => msg && msg !== '');
  const requiredFieldsFilled =
    formData.chargeCode.trim() !== '' &&
    formData.chargeName.trim() !== '' &&
    formData.defaultAmount !== '';
  const isSubmitDisabled = formLoading || hasValidationErrors || !requiredFieldsFilled;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateAllFields();
    if (!isValid) return;

    try {
      setFormLoading(true);
      setFormError(null);
      setFormSuccess(null);

      const submitData = {
        ...formData,
        clinicId: Number(formData.clinicId),
        defaultAmount: Number(formData.defaultAmount),
        cgstPercentage: Number(formData.cgstPercentage) || 0,
        sgstPercentage: Number(formData.sgstPercentage) || 0,
        status: Number(formData.status)
      };

      if (isEditMode) {
        submitData.chargeId = editingConfig.id;
        await updateConsultationChargeConfig(submitData);
        setFormSuccess('Charge configuration updated successfully!');
      } else {
        await addConsultationChargeConfig(submitData);
        setFormSuccess('Charge configuration added successfully!');
      }

      setTimeout(() => {
        closeForm();
        fetchChargeConfigs(page);
      }, 1500);
    } catch (err) {
      setFormError(err.message?.split(':')[1]?.trim() || 'Failed to save charge configuration');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (config) => {
    if (!window.confirm(`Are you sure you want to delete "${config.chargeName}"?`)) return;
    try {
      setSelectedConfig(null);
      await deleteConsultationChargeConfig(config.id);
      fetchChargeConfigs(page);
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

  if (loading) return <div className={styles.chargeConfigLoading}>Loading...</div>;

  const hasActiveSearch = !!appliedFilters.searchValue.trim();

  const startRecord = chargeConfigs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord   = startRecord + chargeConfigs.length - 1;

  return (
    <div className={styles.chargeConfigWrapper}>
      <ErrorHandler error={error} />
      <Header title="Consultation Charge Configuration" />

      {formSuccess && !isFormOpen && (
        <div className={styles.formSuccess}>{formSuccess}</div>
      )}

      {/* Filters + Add button bar */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="chargeCode">Charge Code</option>
              <option value="chargeName">Charge Name</option>
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${filterInputs.searchType === 'chargeCode' ? 'Charge Code' : 'Charge Name'}`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={18} />
              Search
            </button>

            {hasActiveSearch && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={18} />
                Clear
              </button>
            )}

            <button onClick={openAddForm} className={styles.addConfigBtn}>
              <FiPlus size={18} />
              Add Charge Config
            </button>
          </div>
        </div>
      </div>

      {/* Table + Pagination */}
      <div className={styles.tableSection}>
        <div className={styles.chargeConfigTableContainer}>
          <table className={styles.chargeConfigTable}>
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
                  <td colSpan={8} className={styles.chargeConfigNoData}>
                    {hasActiveSearch ? 'No configurations found.' : 'No configurations yet.'}
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((config) => (
                  <tr key={config.id}>
                    <td>
                      <div className={styles.chargeCodeBadge}>{config.chargeCode}</div>
                    </td>
                    <td>
                      <div className={styles.chargeNameCell}>
                        <FiDollarSign size={16} className={styles.chargeIcon} />
                        <span className={styles.chargeName}>{config.chargeName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.amountText}>{formatCurrency(config.defaultAmount)}</span>
                    </td>
                    <td>
                      <span className={`${styles.taxBadge} ${styles.cgst}`}>
                        {config.cgstPercentage ? `${config.cgstPercentage}%` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.taxBadge} ${styles.sgst}`}>
                        {config.sgstPercentage ? `${config.sgstPercentage}%` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.amountText} ${styles.total}`}>
                        {formatCurrency(config.amountInclusiveTax || config.defaultAmount)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[config.status]}`}>
                        {config.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openDetails(config)}
                        className={styles.chargeConfigDetailsBtn}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {chargeConfigs.length > 0
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
              disabled={!hasNext}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{PAGE_SIZE}</strong>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {selectedConfig && (
        <div className={styles.detailModalOverlay} onClick={closeDetails}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <h2>{selectedConfig.chargeName}</h2>
              </div>
              <div className={styles.clinicNameone}>
                <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
                {localStorage.getItem('clinicName') || '—'}
              </div>
              <button onClick={closeDetails} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>
                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}>
                    <h3>Charge Information</h3>
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Charge Code</span>
                      <span className={styles.infoValue}>{selectedConfig.chargeCode || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Charge Name</span>
                      <span className={styles.infoValue}>{selectedConfig.chargeName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Clinic</span>
                      <span className={styles.infoValue}>{selectedConfig.clinicName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Status</span>
                      <span className={styles.infoValue}>
                        <span className={`${styles.statusBadge} ${styles[selectedConfig.status]}`}>
                          {selectedConfig.status?.toUpperCase()}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}>
                    <h3>Tax & Amount Information</h3>
                  </div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Default Amount</span>
                      <span className={`${styles.infoValue} ${styles.infoAmountGreen}`}>
                        {formatCurrency(selectedConfig.defaultAmount)}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>CGST %</span>
                      <span className={styles.infoValue}>
                        {selectedConfig.cgstPercentage ? `${selectedConfig.cgstPercentage}%` : '—'}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>SGST %</span>
                      <span className={styles.infoValue}>
                        {selectedConfig.sgstPercentage ? `${selectedConfig.sgstPercentage}%` : '—'}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Total with Tax</span>
                      <span className={`${styles.infoValue} ${styles.infoAmountTotal}`}>
                        {formatCurrency(selectedConfig.amountInclusiveTax || selectedConfig.defaultAmount)}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Date Created</span>
                      <span className={styles.infoValue}>
                        {selectedConfig.dateCreated
                          ? new Date(selectedConfig.dateCreated).toLocaleDateString()
                          : '—'}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Last Modified</span>
                      <span className={styles.infoValue}>
                        {selectedConfig.dateModified
                          ? new Date(selectedConfig.dateModified).toLocaleDateString()
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button onClick={() => handleDelete(selectedConfig)} className={styles.btnDelete}>
                  Delete
                </button>
                <button onClick={() => openEditForm(selectedConfig)} className={styles.btnUpdate}>
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div className={styles.chargeConfigModalOverlay}>
          <div className={styles.chargeConfigModal}>
            <div className={styles.chargeConfigModalHeader}>
              <h2>{isEditMode ? 'Edit' : 'Add'} Charge Configuration</h2>
              <div className={styles.headerRight}>
                <div className={styles.clinicNameone}>
                  <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
                  {localStorage.getItem('clinicName') || '—'}
                </div>
                <button onClick={closeForm} className={styles.chargeConfigModalClose}>×</button>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.chargeConfigModalBody}>
                {formError && <div className={styles.formError}>{formError}</div>}
                {formSuccess && <div className={styles.formSuccess}>{formSuccess}</div>}
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Charge Code <span className={styles.required}>*</span></label>
                    <input
                      type="text"
                      name="chargeCode"
                      value={formData.chargeCode}
                      onChange={handleInputChange}
                      placeholder="CONS-001"
                      disabled={formLoading}
                      maxLength="20"
                      required
                    />
                    {validationMessages.chargeCode && (
                      <span className={styles.validationMsg}>{validationMessages.chargeCode}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Charge Name <span className={styles.required}>*</span></label>
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
                      <span className={styles.validationMsg}>{validationMessages.chargeName}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Default Amount (₹) <span className={styles.required}>*</span></label>
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
                      <span className={styles.validationMsg}>{validationMessages.defaultAmount}</span>
                    )}
                  </div>

                  {!isEditMode && (
                    <div className={styles.formGroup}>
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
                        <span className={styles.validationMsg}>{validationMessages.gstNo}</span>
                      )}
                    </div>
                  )}

                  <div className={styles.formGroup}>
                    <label>CGST Percentage (%)</label>
                    <input
                      type="text"
                      name="cgstPercentage"
                      value={formData.cgstPercentage}
                      onChange={handleInputChange}
                      placeholder="9.00"
                      disabled={formLoading}
                    />
                    {validationMessages.cgstPercentage && (
                      <span className={styles.validationMsg}>{validationMessages.cgstPercentage}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>SGST Percentage (%)</label>
                    <input
                      type="text"
                      name="sgstPercentage"
                      value={formData.sgstPercentage}
                      onChange={handleInputChange}
                      placeholder="9.00"
                      disabled={formLoading}
                    />
                    {validationMessages.sgstPercentage && (
                      <span className={styles.validationMsg}>{validationMessages.sgstPercentage}</span>
                    )}
                  </div>

                  {isEditMode && (
                    <div className={styles.formGroup}>
                      <label>Status <span className={styles.required}>*</span></label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleStatusChange}
                        disabled={formLoading}
                      >
                        <option value={1}>Active</option>
                        <option value={2}>Deleted</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.chargeConfigModalFooter}>
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
                  disabled={isSubmitDisabled}
                >
                  {formLoading ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationChargeConfig;