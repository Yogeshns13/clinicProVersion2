// src/components/MedicineStockList.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiHome,
  FiFilter,
  FiChevronDown,
} from 'react-icons/fi';
import { 
  getMedicineStockList,
  addMedicineStock,
  getMedicineMasterList,
} from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './MedicineStockList.module.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STOCK_STATUS_FILTERS = [
  { id: 'all', label: 'All Stock' },
  { id: 'near-expiry', label: 'Near Expiry' },
  { id: 'zero-stock', label: 'Zero Stock' },
  { id: 'negative-stock', label: 'Negative Stock' },
];

// ────────────────────────────────────────────────
const MedicineStockList = () => {
  const navigate = useNavigate();

  // Data & Filter
  const [stockList, setStockList] = useState([]);
  const [allStockList, setAllStockList] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Selected / Modal
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    MedicineID: '',
    BatchNo: '',
    ExpiryDate: '',
    QuantityIn: '',
    PurchasePrice: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // Medicine dropdown (for Add Form)
  const [medicineList, setMedicineList] = useState([]);
  const [medicineListLoading, setMedicineListLoading] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
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
  // Data fetching
  useEffect(() => {
    const fetchStockList = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const options = {
          BranchID: branchId,
        };

        if (selectedFilter === 'near-expiry') {
          options.NearExpiryDays = 1;
          options.ZeroStock = -1;
          options.NegativeStock = 0;
        } else if (selectedFilter === 'zero-stock') {
          options.NearExpiryDays = 0;
          options.ZeroStock = 1;
          options.NegativeStock = 0;
        } else if (selectedFilter === 'negative-stock') {
          options.NearExpiryDays = 0;
          options.ZeroStock = -1;
          options.NegativeStock = 1;
        } else {
          options.NearExpiryDays = 0;
          options.ZeroStock = -1;
          options.NegativeStock = 0;
        }

        const data = await getMedicineStockList(clinicId, options);
        setStockList(data);
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
    fetchStockList();
  }, [selectedFilter]);

  // ────────────────────────────────────────────────
  // Fetch medicine master list for dropdown
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

  // ────────────────────────────────────────────────
  // Computed values
  const filteredStockList = useMemo(() => {
    if (!searchTerm.trim()) return allStockList;
    const term = searchTerm.toLowerCase();
    return allStockList.filter(
      (stock) =>
        stock.medicineName?.toLowerCase().includes(term) ||
        stock.genericName?.toLowerCase().includes(term) ||
        stock.batchNo?.toLowerCase().includes(term) ||
        stock.manufacturer?.toLowerCase().includes(term) ||
        stock.clinicName?.toLowerCase().includes(term) ||
        stock.branchName?.toLowerCase().includes(term)
    );
  }, [allStockList, searchTerm]);

  // Filtered medicine list for the dropdown search
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
    if (stockStatusDesc?.toLowerCase().includes('expir')) return styles.nearExpiry;
    if (stockStatusDesc?.toLowerCase().includes('zero')) return styles.zeroStock;
    if (stockStatusDesc?.toLowerCase().includes('negative')) return styles.negativeStock;
    return styles.normal;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
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
  const handleSearch = () => setSearchTerm(searchInput.trim());

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const openDetails = (stock) => setSelectedStock(stock);

  const closeModal = () => setSelectedStock(null);

  const openAddForm = () => {
    setFormData({
      MedicineID: '',
      BatchNo: '',
      ExpiryDate: '',
      QuantityIn: '',
      PurchasePrice: '',
    });
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

  // Handle medicine selection from dropdown
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
        clinicId: clinicId,
        branchId: branchId,
        MedicineID: Number(formData.MedicineID),
        BatchNo: formData.BatchNo.trim(),
        ExpiryDate: formData.ExpiryDate.trim(),
        QuantityIn: Number(formData.QuantityIn),
        PurchasePrice: Number(formData.PurchasePrice),
      });

      setFormSuccess(true);
      setTimeout(async () => {
        closeAddForm();
        const options = {
          BranchID: branchId,
          NearExpiryDays: 0,
          ZeroStock: -1,
          NegativeStock: 0,
        };
        const data = await getMedicineStockList(clinicId, options);
        setStockList(data);
        setAllStockList(data);
      }, 1500);
    } catch (err) {
      console.error('Add medicine stock failed:', err);
      setFormError(err.message || 'Failed to add medicine stock.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateClick = (stock) => {
    navigate(`/update-medicinestock/${stock.id}`);
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

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.selectWrapper}>
          <FiFilter className={styles.selectIcon} size={20} />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className={styles.select}
          >
            {STOCK_STATUS_FILTERS.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by medicine name, batch, manufacturer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchBtn}>
            <FiSearch size={20} />
          </button>
        </div>

        <div className={styles.addSection}>
          <button onClick={openAddForm} className={styles.addBtn}>
            <FiPlus size={22} />Add Stock
          </button>
        </div>
      </div>

      {/* Table */}
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
            {filteredStockList.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.noData}>
                  {searchTerm ? 'No stock found.' : 'No stock records yet.'}
                </td>
              </tr>
            ) : (
              filteredStockList.map((stock) => (
                <tr key={stock.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {stock.medicineName?.charAt(0).toUpperCase() || 'M'}
                      </div>
                      <div>
                        <div className={styles.name}>{stock.medicineName}</div>
                        <div className={styles.type}>
                          {stock.genericName || '—'}
                        </div>
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
                          : `Expired ${Math.abs(stock.daysToExpiry)} days ago`
                        }
                      </div>
                    )}
                  </td>
                  <td>{stock.quantityIn ?? 0}</td>
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

      {/* ──────────────── Details Modal ──────────────── */}
      {selectedStock && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={`${styles.modal} ${styles.detailsModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsModalHeader}>
              <div className={styles.detailsHeaderContent}>
                <div className={styles.avatarLarge}>
                  {selectedStock.medicineName?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div>
                  <h2>{selectedStock.medicineName}</h2>
                  <p className={styles.subtitle}>
                    {selectedStock.genericName || 'No Generic Name'}
                  </p>
                </div>
              </div>
              <div className={styles.statusBadgeLargeWrapper}>
                <span className={`${styles.statusBadge} ${styles.large} ${getStatusClass(selectedStock.stockStatusDesc)}`}>
                  {selectedStock.stockStatusDesc?.toUpperCase() || 'NORMAL'}
                </span>
              </div>
              <button onClick={closeModal} className={styles.modalClose}>
                ×
              </button>
            </div>

            <div className={styles.detailsModalBody}>
              <table className={styles.detailsTable}>
                <tbody>
                  <tr>
                    <td className={styles.label}>Clinic</td>
                    <td className={styles.value}>{selectedStock.clinicName || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Branch</td>
                    <td className={styles.value}>{selectedStock.branchName || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Manufacturer</td>
                    <td className={styles.value}>{selectedStock.manufacturer || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>HSN Code</td>
                    <td className={styles.value}>{selectedStock.hsnCode || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Batch No</td>
                    <td className={styles.value}>{selectedStock.batchNo || '—'}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Expiry Date</td>
                    <td className={styles.value}>{formatDate(selectedStock.expiryDate)}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Days to Expiry</td>
                    <td className={styles.value}>
                      {selectedStock.daysToExpiry != null
                        ? selectedStock.daysToExpiry >= 0
                          ? `${selectedStock.daysToExpiry} days`
                          : `Expired ${Math.abs(selectedStock.daysToExpiry)} days ago`
                        : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Quantity In</td>
                    <td className={styles.value}>{selectedStock.quantityIn ?? 0}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Quantity Out</td>
                    <td className={styles.value}>{selectedStock.quantityOut ?? 0}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Balance Quantity</td>
                    <td className={styles.value}>{selectedStock.balanceQuantity ?? 0}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Purchase Price</td>
                    <td className={styles.value}>{formatCurrency(selectedStock.purchasePrice)}</td>
                  </tr>
                  <tr>
                    <td className={styles.label}>Average Price</td>
                    <td className={styles.value}>{formatCurrency(selectedStock.averagePrice)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={styles.modalFooter}>
              <button onClick={() => handleUpdateClick(selectedStock)} className={styles.btnUpdate}>
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Add Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.modalOverlay} onClick={closeAddForm}>
          <div className={`${styles.modal} ${styles.formModal}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Medicine Stock</h2>
              <button onClick={closeAddForm} className={styles.modalClose}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalBody}>
              {formError && <div className={styles.formError}>{formError}</div>}
              {formSuccess && <div className={styles.formSuccess}>Medicine stock added successfully!</div>}

              <div className={styles.formGrid}>
                <h3 className={styles.formSectionTitle}>Stock Information</h3>

                {/* ── Medicine Name Searchable Dropdown ── */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`} ref={medicineDropdownRef}>
                  <label>
                    Medicine Name <span className={styles.required}>*</span>
                  </label>

                  {/* Hidden required input to trigger native validation */}
                  <input
                    type="hidden"
                    name="MedicineID"
                    value={formData.MedicineID}
                    required
                  />

                  <div className={styles.medicineDropdownWrapper}>
                    {/* Trigger / selected display */}
                    {!showMedicineDropdown && (
                      <div
                        className={`${styles.medicineSelectTrigger} ${!formData.MedicineID ? styles.placeholder : ''}`}
                        onClick={handleMedicineInputFocus}
                      >
                        <span>
                          {selectedMedicineName || (medicineListLoading ? 'Loading medicines...' : 'Select a medicine...')}
                        </span>
                        <div className={styles.medicineTriggerActions}>
                          {formData.MedicineID && (
                            <button
                              type="button"
                              className={styles.medicineClearBtn}
                              onClick={(e) => { e.stopPropagation(); handleClearMedicine(); }}
                              title="Clear selection"
                            >
                              <FiX size={14} />
                            </button>
                          )}
                          <FiChevronDown size={16} className={styles.medicineChevron} />
                        </div>
                      </div>
                    )}

                    {/* Search input (shown when open) */}
                    {showMedicineDropdown && (
                      <input
                        autoFocus
                        type="text"
                        className={styles.medicineSearchInput}
                        placeholder="Type to search medicine..."
                        value={medicineSearch}
                        onChange={(e) => setMedicineSearch(e.target.value)}
                        onBlur={() => {
                          // small delay so click on item registers
                          setTimeout(() => setShowMedicineDropdown(false), 150);
                        }}
                      />
                    )}

                    {/* Dropdown list */}
                    {showMedicineDropdown && (
                      <div className={styles.medicineDropdownList}>
                        {medicineListLoading ? (
                          <div className={styles.medicineDropdownLoading}>
                            Loading medicines...
                          </div>
                        ) : filteredMedicineList.length === 0 ? (
                          <div className={styles.medicineDropdownEmpty}>
                            No medicines found
                          </div>
                        ) : (
                          filteredMedicineList.map((med) => (
                            <div
                              key={med.id}
                              className={`${styles.medicineDropdownItem} ${formData.MedicineID === med.id ? styles.medicineDropdownItemActive : ''}`}
                              onMouseDown={() => handleMedicineSelect(med)}
                            >
                              <div className={styles.medicineDropdownItemName}>
                                {med.name}
                              </div>
                              <div className={styles.medicineDropdownItemMeta}>
                               
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Batch Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    name="BatchNo"
                    value={formData.BatchNo}
                    onChange={handleInputChange}
                    placeholder="e.g., BATCH001"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Expiry Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    type="date"
                    name="ExpiryDate"
                    value={formData.ExpiryDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Quantity In <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    type="number"
                    name="QuantityIn"
                    value={formData.QuantityIn}
                    onChange={handleInputChange}
                    placeholder="0"
                    min="1"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Purchase Price <span className={styles.required}>*</span>
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    name="PurchasePrice"
                    value={formData.PurchasePrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" onClick={closeAddForm} className={styles.btnCancel}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !formData.MedicineID}
                  className={styles.btnSubmit}
                >
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