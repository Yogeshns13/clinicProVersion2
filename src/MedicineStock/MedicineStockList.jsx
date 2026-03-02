// src/components/MedicineStockList.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiChevronDown,
  FiArrowLeft,
  FiPackage,
} from 'react-icons/fi';
import { 
  getMedicineStockList,
  addMedicineStock,
  getMedicineMasterList,
} from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import UpdateMedicineStock from './UpdateMedicineStock.jsx';
import styles from './MedicineStockList.module.css';

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────
const getTodayDate = () => new Date().toISOString().split('T')[0];

const DEFAULT_FILTERS = {
  searchType:  'medicineName',
  searchValue: '',
  expiryFrom:  '',
  expiryTo:    '',
  medicineId:  null,
};

// ────────────────────────────────────────────────
const MedicineStockList = () => {
  const location = useLocation();
  const navigate  = useNavigate();

  const locationMedicineId   = location.state?.medicineId   ?? null;
  const locationMedicineName = location.state?.medicineName ?? null;

  // Data
  const [allStockList, setAllStockList] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // Filter inputs (staged, not applied until Search)
  const [filterInputs, setFilterInputs] = useState({
    ...DEFAULT_FILTERS,
    medicineId:  locationMedicineId,
    searchValue: locationMedicineName ?? '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...DEFAULT_FILTERS,
    medicineId:  locationMedicineId,
    searchValue: locationMedicineName ?? '',
  });

  // View Details modal
  const [selectedStock, setSelectedStock] = useState(null);

  // Update modal
  const [updatingStock, setUpdatingStock] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    MedicineID:    '',
    BatchNo:       '',
    ExpiryDate:    '',
    QuantityIn:    '',
    PurchasePrice: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError,   setFormError]   = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Medicine dropdown (for Add Form)
  const [medicineList,        setMedicineList]        = useState([]);
  const [medicineListLoading, setMedicineListLoading] = useState(false);
  const [medicineSearch,      setMedicineSearch]      = useState('');
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [selectedMedicineName, setSelectedMedicineName] = useState('');
  const medicineDropdownRef = useRef(null);

  // ────────────────────────────────────────────────
  // Close medicine dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(e.target)) {
        setShowMedicineDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ────────────────────────────────────────────────
  // Build API options from filters
  const buildApiOptions = (filters) => {
    const clinicId = Number(localStorage.getItem('clinicID'));
    const branchId = Number(localStorage.getItem('branchID'));

    const options = {
      BranchID:       branchId,
      MedicineID:     filters.medicineId ? Number(filters.medicineId) : 0,
      MedicineName:   filters.medicineId
                        ? ''
                        : filters.searchType === 'medicineName'
                          ? (filters.searchValue || '')
                          : '',
      BatchNo:        filters.searchType === 'batchNo' ? (filters.searchValue || '') : '',
      ExpiryFrom:     filters.expiryFrom || '',
      ExpiryTo:       filters.expiryTo   || '',
      NearExpiryDays: 0,
      ZeroStock:      -1,
      NegativeStock:  0,
    };

    return { clinicId, options };
  };

  // ────────────────────────────────────────────────
  // Data fetching
  const fetchStockList = async (filters) => {
    try {
      setLoading(true);
      setError(null);
      const { clinicId, options } = buildApiOptions(filters);
      const data = await getMedicineStockList(clinicId, options);
      setAllStockList(data);
    } catch (err) {
      console.error('fetchStockList error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load medicine stock' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFilters = {
      ...DEFAULT_FILTERS,
      medicineId:  locationMedicineId,
      searchValue: locationMedicineName ?? '',
    };
    fetchStockList(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────────────────────────────────────────────────
  const isFilterActive = useMemo(() => {
    return (
      appliedFilters.searchValue !== DEFAULT_FILTERS.searchValue ||
      appliedFilters.searchType  !== DEFAULT_FILTERS.searchType  ||
      appliedFilters.expiryFrom  !== DEFAULT_FILTERS.expiryFrom  ||
      appliedFilters.expiryTo    !== DEFAULT_FILTERS.expiryTo    ||
      appliedFilters.medicineId  !== DEFAULT_FILTERS.medicineId
    );
  }, [appliedFilters]);

  // ────────────────────────────────────────────────
  // Medicine master list for add form dropdown
  const fetchMedicineList = async () => {
    try {
      setMedicineListLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      const data = await getMedicineMasterList(clinicId, {
        BranchID: branchId,
        PageSize: 50,
        Status: 1,
      });
      setMedicineList(data);
    } catch (err) {
      console.error('fetchMedicineList error:', err);
      setMedicineList([]);
    } finally {
      setMedicineListLoading(false);
    }
  };

  const filteredMedicineList = useMemo(() => {
    if (!medicineSearch.trim()) return medicineList;
    const term = medicineSearch.toLowerCase();
    return medicineList.filter(
      (med) =>
        med.name?.toLowerCase().includes(term) ||
        med.genericName?.toLowerCase().includes(term) ||
        med.manufacturer?.toLowerCase().includes(term)
    );
  }, [medicineList, medicineSearch]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getStatusClass = (stockStatusDesc) => {
    if (stockStatusDesc?.toLowerCase().includes('expir'))    return styles.nearExpiry;
    if (stockStatusDesc?.toLowerCase().includes('zero'))     return styles.zeroStock;
    if (stockStatusDesc?.toLowerCase().includes('negative')) return styles.negativeStock;
    return styles.normal;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    if (value == null) return '—';
    return `₹${Number(value).toFixed(2)}`;
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const updatedFilters = { ...filterInputs, medicineId: null };
    setFilterInputs(updatedFilters);
    setAppliedFilters(updatedFilters);
    fetchStockList(updatedFilters);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearFilters = () => {
    setFilterInputs({ ...DEFAULT_FILTERS });
    setAppliedFilters({ ...DEFAULT_FILTERS });
    fetchStockList(DEFAULT_FILTERS);
  };

  const handleBackToMasterList = () => {
    navigate('/medicinemaster-list');
  };

  // View details modal
  const openDetails  = (stock) => setSelectedStock(stock);
  const closeModal   = ()      => setSelectedStock(null);

  // Update modal (opens on top of details modal)
  const handleUpdateClick = (stock) => {
    setSelectedStock(null);
    setUpdatingStock(stock);
  };

  const handleUpdateClose = () => {
    setUpdatingStock(null);
  };

  const handleUpdateSuccess = () => {
    setUpdatingStock(null);
    setSelectedStock(null);
    fetchStockList(appliedFilters);
  };

  // Add form
  const openAddForm = () => {
    setFormData({ MedicineID: '', BatchNo: '', ExpiryDate: '', QuantityIn: '', PurchasePrice: '' });
    setSelectedMedicineName('');
    setMedicineSearch('');
    setShowMedicineDropdown(false);
    setFormError('');
    setFormSuccess(false);
    setIsAddFormOpen(true);
    fetchMedicineList();
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setFormError('');
    setFormSuccess(false);
    setSelectedMedicineName('');
    setMedicineSearch('');
    setShowMedicineDropdown(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicineSelect = (medicine) => {
    setFormData((prev) => ({ ...prev, MedicineID: medicine.id }));
    setSelectedMedicineName(medicine.name);
    setMedicineSearch('');
    setShowMedicineDropdown(false);
  };

  const handleMedicineInputFocus = () => {
    setShowMedicineDropdown(true);
    setMedicineSearch('');
  };

  const handleClearMedicine = () => {
    setFormData((prev) => ({ ...prev, MedicineID: '' }));
    setSelectedMedicineName('');
    setMedicineSearch('');
    setShowMedicineDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);
    setError(null);

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await addMedicineStock({
        clinicId,
        branchId,
        MedicineID:    Number(formData.MedicineID),
        BatchNo:       formData.BatchNo.trim(),
        ExpiryDate:    formData.ExpiryDate.trim(),
        QuantityIn:    Number(formData.QuantityIn),
        PurchasePrice: Number(formData.PurchasePrice),
      });

      setFormSuccess(true);
      setTimeout(() => {
        closeAddForm();
        fetchStockList(appliedFilters);
      }, 1500);
    } catch (err) {
      console.error('Add medicine stock failed:', err);
      setFormError(err.message || 'Failed to add medicine stock.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading medicine stock...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Medicine Stock Management" />

      {/* ── Context Banner ── */}
      {locationMedicineId && appliedFilters.medicineId && (
        <div className={styles.contextBanner}>
          <div className={styles.contextBannerLeft}>
            <div className={styles.contextIconWrap}>
              <FiPackage size={18} />
            </div>
            <div className={styles.contextBannerText}>
              <span className={styles.contextBannerLabel}>Viewing stock for</span>
              <span className={styles.contextBannerName}>{locationMedicineName}</span>
            </div>
          </div>
          <div className={styles.contextBannerActions}>
            <button onClick={handleBackToMasterList} className={styles.backBtn}>
              <FiArrowLeft size={14} />
              Back to Master List
            </button>
            <button onClick={handleClearFilters} className={styles.showAllBtn}>
              <FiX size={13} />
              Show All Stock
            </button>
          </div>
        </div>
      )}

      {/* ── Filter Bar — hidden when viewing a specific medicine's stock ── */}
      {!appliedFilters.medicineId && <div className={styles.filtersContainer}>
        <div className={styles.filtersRow}>

          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="medicineName">Medicine</option>
              <option value="batchNo">Batch No</option>
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={filterInputs.searchType === 'medicineName' ? 'Search by medicine name' : 'Search by batch no.'}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              className={styles.searchValueInput}
            />
          </div>

          <div className={styles.dateWrapper}>
            {!filterInputs.expiryFrom && (
              <span className={styles.datePlaceholder}>From Date</span>
            )}
            <input
              type="date"
              name="expiryFrom"
              value={filterInputs.expiryFrom}
              onChange={handleFilterChange}
              className={`${styles.filterInput} ${!filterInputs.expiryFrom ? styles.dateEmpty : ''}`}
            />
          </div>

          <div className={styles.dateWrapper}>
            {!filterInputs.expiryTo && (
              <span className={styles.datePlaceholder}>To Date</span>
            )}
            <input
              type="date"
              name="expiryTo"
              value={filterInputs.expiryTo}
              onChange={handleFilterChange}
              className={`${styles.filterInput} ${!filterInputs.expiryTo ? styles.dateEmpty : ''}`}
            />
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={15} />
              Search
            </button>
            {isFilterActive && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={15} />
                Clear
              </button>
            )}
          </div>

          <button onClick={openAddForm} className={styles.addBtn}>
            <FiPlus size={17} />
            Add Stock
          </button>
        </div>
      </div>}

      {/* ── Table ── */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Batch No</th>
              <th>Expiry Date</th>
              <th>Qty In</th>
              <th>Qty Out</th>
              <th>Balance</th>
              <th>Purchase Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allStockList.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.noData}>
                  {isFilterActive ? 'No stock found.' : 'No stock records yet.'}
                </td>
              </tr>
            ) : (
              allStockList.map((stock) => (
                <tr key={stock.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {stock.medicineName?.charAt(0).toUpperCase() || 'M'}
                      </div>
                      <div>
                        <div className={styles.name}>{stock.medicineName}</div>
                        <div className={styles.subInfo}>{stock.genericName || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{stock.batchNo || '—'}</td>
                  <td>
                    <div>{formatDate(stock.expiryDate)}</div>
                    {stock.daysToExpiry != null && (
                      <div className={styles.daysToExpiry}>
                        {stock.daysToExpiry >= 0
                          ? `${stock.daysToExpiry} days left`
                          : `Expired ${Math.abs(stock.daysToExpiry)} days ago`}
                      </div>
                    )}
                  </td>
                  <td>{stock.quantityIn  ?? 0}</td>
                  <td>{stock.quantityOut ?? 0}</td>
                  <td>
                    <span className={`${styles.balanceBadge} ${stock.balanceQuantity <= 0 ? styles.lowBalance : ''}`}>
                      {stock.balanceQuantity ?? 0}
                    </span>
                  </td>
                  <td>{formatCurrency(stock.purchasePrice)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(stock.stockStatusDesc)}`}>
                      {stock.stockStatusDesc?.toUpperCase() || 'NORMAL'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => openDetails(stock)} className={styles.detailsBtn}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ──────────────── View Details Modal ──────────────── */}
      {selectedStock && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <div className={styles.avatarLarge}>
                  {selectedStock.medicineName?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div>
                  <h2>{selectedStock.medicineName}</h2>
                </div>
              </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>✕</button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Medicine Information</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Clinic</span>
                      <span className={styles.infoValue}>{selectedStock.clinicName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Branch</span>
                      <span className={styles.infoValue}>{selectedStock.branchName || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Manufacturer</span>
                      <span className={styles.infoValue}>{selectedStock.manufacturer || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>HSN Code</span>
                      <span className={styles.infoValue}>{selectedStock.hsnCode || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Batch & Expiry</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Batch No</span>
                      <span className={styles.infoValue}>{selectedStock.batchNo || '—'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Expiry Date</span>
                      <span className={styles.infoValue}>{formatDate(selectedStock.expiryDate)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Days to Expiry</span>
                      <span className={styles.infoValue}>
                        {selectedStock.daysToExpiry != null
                          ? selectedStock.daysToExpiry >= 0
                            ? `${selectedStock.daysToExpiry} days`
                            : `Expired ${Math.abs(selectedStock.daysToExpiry)} days ago`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Stock Quantities</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Quantity In</span>
                      <span className={styles.infoValue}>{selectedStock.quantityIn ?? 0}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Quantity Out</span>
                      <span className={styles.infoValue}>{selectedStock.quantityOut ?? 0}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Balance Quantity</span>
                      <span className={`${styles.infoValue} ${styles.infoAmountGreen}`}>{selectedStock.balanceQuantity ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Pricing</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Purchase Price</span>
                      <span className={`${styles.infoValue} ${styles.infoAmountGreen}`}>{formatCurrency(selectedStock.purchasePrice)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Average Price</span>
                      <span className={`${styles.infoValue} ${styles.infoAmountTotal}`}>{formatCurrency(selectedStock.averagePrice)}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className={styles.detailModalFooter}>
                <button onClick={closeModal} className={styles.btnCancel}>Close</button>
                <button onClick={() => handleUpdateClick(selectedStock)} className={styles.btnUpdate}>Update Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Update Stock Modal ──────────────── */}
      {updatingStock && (
        <UpdateMedicineStock
          stock={updatingStock}
          onClose={handleUpdateClose}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}

      {/* ──────────────── Add Stock Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.addModalOverlay} onClick={closeAddForm}>
          <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

            <div className={styles.addModalHeader}>
              <div className={styles.addHeaderContent}>
                <h2>Add New Medicine Stock</h2>
              </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}><FiX size={18} /></button>
            </div>

            <form className={styles.addForm} onSubmit={handleSubmit}>
              <div className={styles.addModalBody}>
                {formError   && <div className={styles.formError}>{formError}</div>}
                {formSuccess && <div className={styles.formSuccess}>Medicine stock added successfully!</div>}

                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}>
                    <h3>Stock Information</h3>
                  </div>
                  <div className={styles.formGrid}>

                    <div className={`${styles.formGroup} ${styles.fullWidth}`} ref={medicineDropdownRef}>
                      <label>Medicine Name <span className={styles.required}>*</span></label>
                      <input type="hidden" name="MedicineID" value={formData.MedicineID} required />
                      <div className={styles.medicineDropdownWrapper}>
                        {!showMedicineDropdown && (
                          <div
                            className={`${styles.medicineSelectTrigger} ${!formData.MedicineID ? styles.placeholder : ''}`}
                            onClick={handleMedicineInputFocus}
                          >
                            <span>{selectedMedicineName || (medicineListLoading ? 'Loading medicines...' : 'Select a medicine...')}</span>
                            <div className={styles.medicineTriggerActions}>
                              {formData.MedicineID && (
                                <button type="button" className={styles.medicineClearBtn}
                                  onClick={(e) => { e.stopPropagation(); handleClearMedicine(); }}>
                                  <FiX size={14} />
                                </button>
                              )}
                              <FiChevronDown size={16} className={styles.medicineChevron} />
                            </div>
                          </div>
                        )}
                        {showMedicineDropdown && (
                          <input autoFocus type="text" className={styles.medicineSearchInput}
                            placeholder="Type to search medicine..." value={medicineSearch}
                            onChange={(e) => setMedicineSearch(e.target.value)}
                            onBlur={() => setTimeout(() => setShowMedicineDropdown(false), 150)} />
                        )}
                        {showMedicineDropdown && (
                          <div className={styles.medicineDropdownList}>
                            {medicineListLoading ? (
                              <div className={styles.medicineDropdownLoading}>Loading medicines...</div>
                            ) : filteredMedicineList.length === 0 ? (
                              <div className={styles.medicineDropdownEmpty}>No medicines found</div>
                            ) : (
                              filteredMedicineList.map((med) => (
                                <div key={med.id}
                                  className={`${styles.medicineDropdownItem} ${formData.MedicineID === med.id ? styles.medicineDropdownItemActive : ''}`}
                                  onMouseDown={() => handleMedicineSelect(med)}>
                                  <div className={styles.medicineDropdownItemName}>{med.name}</div>
                                  <div className={styles.medicineDropdownItemMeta}></div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Batch Number <span className={styles.required}>*</span></label>
                      <input required name="BatchNo" value={formData.BatchNo} onChange={handleInputChange} placeholder="e.g., BATCH001" disabled={formLoading} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Expiry Date <span className={styles.required}>*</span></label>
                      <input required type="date" name="ExpiryDate" value={formData.ExpiryDate} onChange={handleInputChange} disabled={formLoading} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Quantity In <span className={styles.required}>*</span></label>
                      <input required type="number" name="QuantityIn" value={formData.QuantityIn} onChange={handleInputChange} placeholder="0" min="1" disabled={formLoading} />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Purchase Price <span className={styles.required}>*</span></label>
                      <input required type="number" step="0.01" name="PurchasePrice" value={formData.PurchasePrice} onChange={handleInputChange} placeholder="0.00" min="0" disabled={formLoading} />
                    </div>

                  </div>
                </div>
              </div>

              <div className={styles.addModalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel} disabled={formLoading}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading || !formData.MedicineID} className={styles.btnSubmit}>
                  {formLoading ? 'Adding...' : 'Add Stock'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default MedicineStockList;