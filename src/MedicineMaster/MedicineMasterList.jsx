// src/components/MedicineMasterList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiPlus, 
  FiFilter, 
  FiDownload, 
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiEdit,
  FiEye
} from 'react-icons/fi';
import { getMedicineMasterList } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './MedicineMasterList.module.css';
import AddMedicineMaster from './Addmedicinemaster.jsx';

// Type and Unit Constants
const MEDICINE_TYPES = [
  { value: 0, label: 'All Types' },
  { value: 1, label: 'Tablet' },
  { value: 2, label: 'Capsule' },
  { value: 3, label: 'Syrup' },
  { value: 4, label: 'Injection' },
  { value: 5, label: 'Ointment' },
  { value: 6, label: 'Drops' },
  { value: 7, label: 'Powder' },
  { value: 8, label: 'Gel' },
  { value: 9, label: 'Cream' },
  { value: 10, label: 'Inhaler' }
];

const MEDICINE_UNITS = [
  { value: 0, label: 'All Units' },
  { value: 1, label: 'Strip' },
  { value: 2, label: 'Bottle' },
  { value: 3, label: 'Vial' },
  { value: 4, label: 'Tube' },
  { value: 5, label: 'Box' },
  { value: 6, label: 'Ampoule' },
  { value: 7, label: 'Sachet' },
  { value: 8, label: 'Blister Pack' },
  { value: 9, label: 'Jar' },
  { value: 10, label: 'Roll' }
];

const MedicineMasterList = () => {
  const navigate = useNavigate();

  // Data States
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);

  // Search State
  const [searchInput, setSearchInput] = useState('');

  // Filter States
  const [nameFilter, setNameFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState(0);
  const [unitFilter, setUnitFilter] = useState(0);
  const [hsnCodeFilter, setHsnCodeFilter] = useState('');
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(0);
  const [statusFilter, setStatusFilter] = useState(-1);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Fetch Medicines with filters
  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId
      };

      if (nameFilter.trim()) options.Name = nameFilter.trim();
      if (manufacturerFilter.trim()) options.Manufacturer = manufacturerFilter.trim();
      if (typeFilter > 0) options.Type = typeFilter;
      if (unitFilter > 0) options.Unit = unitFilter;
      if (hsnCodeFilter.trim()) options.HSNCode = hsnCodeFilter.trim();
      if (barcodeFilter.trim()) options.Barcode = barcodeFilter.trim();
      if (lowStockOnly === 1) options.LowStockOnly = 1;
      if (statusFilter !== -1) options.Status = statusFilter;

      console.log('Fetching medicines with options:', options);

      const data = await getMedicineMasterList(clinicId, options);
      
      // Sort by name
      const sortedData = data.sort((a, b) => 
        (a.name || '').localeCompare(b.name || '')
      );

      setMedicines(sortedData);
      setFilteredMedicines(sortedData);
    } catch (err) {
      console.error('fetchMedicines error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load medicines' }
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMedicines();
  }, []);

  // Apply search filter
  const handleSearch = () => {
    const term = searchInput.trim().toLowerCase();

    if (!term) {
      setFilteredMedicines(medicines);
      return;
    }

    const filtered = medicines.filter(
      (med) =>
        med.name?.toLowerCase().includes(term) ||
        med.genericName?.toLowerCase().includes(term) ||
        med.composition?.toLowerCase().includes(term) ||
        med.manufacturer?.toLowerCase().includes(term) ||
        med.typeDesc?.toLowerCase().includes(term) ||
        med.unitDesc?.toLowerCase().includes(term) ||
        med.hsnCode?.toLowerCase().includes(term) ||
        med.barcode?.toLowerCase().includes(term)
    );
    setFilteredMedicines(filtered);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Apply advanced filters
  const applyFilters = () => {
    fetchMedicines();
  };

  // Calculate statistics
  const getStatistics = () => {
    return {
      totalMedicines: filteredMedicines.length,
      activeCount: filteredMedicines.filter(m => m.status === 'active').length,
      inactiveCount: filteredMedicines.filter(m => m.status === 'inactive').length,
      lowStockCount: filteredMedicines.filter(m => m.isLowStock).length,
      totalValue: filteredMedicines.reduce((sum, m) => 
        sum + (parseFloat(m.mrp) * m.stockQuantity), 0
      ).toFixed(2)
    };
  };

  const statistics = getStatistics();

  // Navigate to View Details page
  const handleViewDetails = (medicine) => {
    navigate(`/view-medicinemaster/${medicine.id}`);
  };

  // Navigate to Update page
  const handleEditClick = (medicine) => {
    navigate(`/update-medicinemaster/${medicine.id}`);
  };

  const closeModals = () => {
    setIsAddFormOpen(false);
  };

  const handleAddSuccess = () => {
    fetchMedicines();
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setNameFilter('');
    setManufacturerFilter('');
    setTypeFilter(0);
    setUnitFilter(0);
    setHsnCodeFilter('');
    setBarcodeFilter('');
    setLowStockOnly(0);
    setStatusFilter(-1);
    fetchMedicines();
  };

  const exportToCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    const headers = [
      'Name', 'Generic Name', 'Composition', 'Manufacturer', 'Type', 'Unit',
      'HSN Code', 'Barcode', 'MRP', 'Purchase Price', 'Sell Price', 
      'Stock Quantity', 'Reorder Level', 'CGST %', 'SGST %', 'Status', 'Low Stock'
    ];
    
    const csvData = filteredMedicines.map(med => [
      med.name,
      med.genericName,
      med.composition,
      med.manufacturer,
      med.typeDesc,
      med.unitDesc,
      med.hsnCode,
      med.barcode || '',
      med.mrp,
      med.purchasePrice,
      med.sellPrice,
      med.stockQuantity,
      med.reorderLevelQty,
      med.cgstPercentage,
      med.sgstPercentage,
      med.statusDesc,
      med.isLowStock ? 'Yes' : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicine-master-${today}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toFixed(2)}`;
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Medicine Master" />

      {/* Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>Total Medicines</span>
            <div className={styles.statCardIcon}>
              <FiPackage size={20} />
            </div>
          </div>
          <p className={styles.statCardValue}>{statistics.totalMedicines}</p>
          <p className={styles.statCardLabel}>In inventory</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>Active</span>
            <div className={styles.statCardIcon}>
              <FiCheckCircle size={20} />
            </div>
          </div>
          <p className={styles.statCardValue}>{statistics.activeCount}</p>
          <p className={styles.statCardLabel}>Currently active</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>Low Stock</span>
            <div className={styles.statCardIcon}>
              <FiAlertCircle size={20} />
            </div>
          </div>
          <p className={styles.statCardValue}>{statistics.lowStockCount}</p>
          <p className={styles.statCardLabel}>Needs reorder</p>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <span className={styles.statCardTitle}>Total Value</span>
            <div className={styles.statCardIcon}>
              <FiPackage size={20} />
            </div>
          </div>
          <p className={styles.statCardValue}>{formatCurrency(statistics.totalValue)}</p>
          <p className={styles.statCardLabel}>Inventory worth</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`${styles.filterToggleBtn} ${showAdvancedFilters ? styles.active : ''}`}
          >
            <FiFilter size={18} />
            {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>

          {(nameFilter || manufacturerFilter || typeFilter > 0 || unitFilter > 0 || 
            hsnCodeFilter || barcodeFilter || lowStockOnly === 1 || statusFilter !== -1 || 
            searchInput) && (
            <button onClick={clearAllFilters} className={styles.clearBtn}>
              Clear All
            </button>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <button onClick={exportToCSV} className={styles.exportBtn}>
            <FiDownload size={18} />
            Export CSV
          </button>
          <button 
            onClick={() => setIsAddFormOpen(true)} 
            className={styles.addBtn}
          >
            <FiPlus size={18} />
            Add Medicine
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Medicine Name</label>
              <input
                type="text"
                placeholder="Filter by name..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Manufacturer</label>
              <input
                type="text"
                placeholder="Filter by manufacturer..."
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(Number(e.target.value))}
                className={styles.filterInput}
              >
                {MEDICINE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Unit</label>
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(Number(e.target.value))}
                className={styles.filterInput}
              >
                {MEDICINE_UNITS.map(unit => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>HSN Code</label>
              <input
                type="text"
                placeholder="Filter by HSN code..."
                value={hsnCodeFilter}
                onChange={(e) => setHsnCodeFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Barcode</label>
              <input
                type="text"
                placeholder="Filter by barcode..."
                value={barcodeFilter}
                onChange={(e) => setBarcodeFilter(e.target.value)}
                className={styles.filterInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Stock Status</label>
              <select
                value={lowStockOnly}
                onChange={(e) => setLowStockOnly(Number(e.target.value))}
                className={styles.filterInput}
              >
                <option value={0}>All Stock Levels</option>
                <option value={1}>Low Stock Only</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(Number(e.target.value))}
                className={styles.filterInput}
              >
                <option value={-1}>All Status</option>
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>

            <div className={`${styles.filterGroup} ${styles.applyFilterBtnGroup}`}>
              <button onClick={applyFilters} className={styles.addBtn}>
                <FiSearch size={18} /> Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Search Bar */}
      <div className={styles.searchWrapper}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by name, generic name, manufacturer, type, HSN, barcode..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchBtn}>
            <FiSearch size={20} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Type & Unit</th>
              <th>Manufacturer</th>
              <th>Pricing</th>
              <th>Stock</th>
              <th>Tax</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMedicines.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.noData}>
                  No medicines found.
                </td>
              </tr>
            ) : (
              filteredMedicines.map((medicine) => (
                <tr key={medicine.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {medicine.name?.charAt(0).toUpperCase() || 'M'}
                      </div>
                      <div>
                        <div className={styles.name}>{medicine.name}</div>
                        <div className={styles.type}>
                          {medicine.genericName && `${medicine.genericName}`}
                          {medicine.hsnCode && ` • HSN: ${medicine.hsnCode}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className={styles.name}>{medicine.typeDesc}</div>
                      <div className={styles.type}>{medicine.unitDesc}</div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.type}>{medicine.manufacturer || '—'}</div>
                  </td>
                  <td>
                    <div className={styles.pricingCell}>
                      <span className={styles.priceBadge}>
                        MRP: {formatCurrency(medicine.mrp)}
                      </span>
                      <span className={styles.priceBadge}>
                        Sell: {formatCurrency(medicine.sellPrice)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className={styles.name}>
                        {medicine.stockQuantity} {medicine.unitDesc}
                      </div>
                      {medicine.isLowStock && (
                        <span className={styles.lowStockBadge}>
                          <FiAlertCircle size={12} /> Low Stock
                        </span>
                      )}
                      {!medicine.isLowStock && (
                        <div className={styles.type}>
                          Reorder at: {medicine.reorderLevelQty}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.taxCell}>
                      <span className={styles.taxBadge}>
                        CGST: {medicine.cgstPercentage}%
                      </span>
                      <span className={styles.taxBadge}>
                        SGST: {medicine.sgstPercentage}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${
                      medicine.status === 'active' ? styles.statusActive : styles.statusInactive
                    }`}>
                      {medicine.statusDesc}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button
                        onClick={() => handleViewDetails(medicine)}
                        className={styles.detailsBtn}
                        title="View Details"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => handleEditClick(medicine)}
                        className={styles.editBtn}
                        title="Edit"
                      >
                        <FiEdit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Medicine Modal */}
      <AddMedicineMaster
        isOpen={isAddFormOpen}
        onClose={closeModals}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default MedicineMasterList;