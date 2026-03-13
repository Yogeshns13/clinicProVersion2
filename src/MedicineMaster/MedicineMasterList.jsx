// src/components/MedicineMasterList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiPlus, 
  FiX,
  FiPackage,
  FiAlertCircle,
  FiCheckCircle,
  FiEdit,
  FiEye,
  FiLayers
} from 'react-icons/fi';
import { getMedicineMasterList } from '../Api/ApiPharmacy.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './MedicineMasterList.module.css';
import AddMedicineMaster from './AddMedicineMaster.jsx';
import ViewMedicineMaster from './ViewMedicineMaster.jsx';
import UpdateMedicineMaster from './UpdateMedicineMaster.jsx';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

// ──────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────
const MEDICINE_TYPES = [
  { value: 1,  label: 'Tablet' },
  { value: 2,  label: 'Capsule' },
  { value: 3,  label: 'Syrup' },
  { value: 4,  label: 'Injection' },
  { value: 5,  label: 'Ointment' },
  { value: 6,  label: 'Drops' },
  { value: 7,  label: 'Powder' },
  { value: 8,  label: 'Gel' },
  { value: 9,  label: 'Cream' },
  { value: 10, label: 'Inhaler' },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'Name',         label: 'Name' },
  { value: 'Manufacturer', label: 'Manufacturer' },
  { value: 'HSNCode',      label: 'HSN Code' },
  { value: 'Barcode',      label: 'Barcode' },
];

// ──────────────────────────────────────────────────
const MedicineMasterList = () => {
  const navigate = useNavigate();

  // Data
  const [medicines, setMedicines] = useState([]);

  // Filter inputs (staged — not applied until Search clicked)
  const [filterInputs, setFilterInputs] = useState({
    searchType:   'Name',
    searchValue:  '',
    type:         '',   // '' = All Types (sends 0)
    status:       '',   // '' = All Status (sends -1)
    lowStockOnly: '',   // '' = All (sends 0), '1' = Low Stock Only
  });

  // Applied filters (drive the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:   'Name',
    searchValue:  '',
    type:         '',
    status:       '',
    lowStockOnly: '',
  });

  // UI States
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // View detail modal state
  const [viewModal, setViewModal] = useState({
    isOpen:     false,
    medicineId: null,
  });

  // ── Update modal state (managed here so view popup can be closed first) ──
  const [updateModal, setUpdateModal] = useState({
    isOpen:     false,
    medicineId: null,
  });

  // ──────────────────────────────────────────────────
  // Derived: are any filters active?
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.type               !== '' ||
    appliedFilters.status             !== '' ||
    appliedFilters.lowStockOnly       !== '';

  // ──────────────────────────────────────────────────
  // Data fetching — driven by appliedFilters
  const fetchMedicines = async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        Page:         1,
        PageSize:     100,
        BranchID:     branchId,
        Name:         filters.searchType === 'Name'         ? filters.searchValue : '',
        Manufacturer: filters.searchType === 'Manufacturer' ? filters.searchValue : '',
        HSNCode:      filters.searchType === 'HSNCode'      ? filters.searchValue : '',
        Barcode:      filters.searchType === 'Barcode'      ? filters.searchValue : '',
        Type:         filters.type         !== '' ? Number(filters.type)         : 0,
        Status:       filters.status       !== '' ? Number(filters.status)       : -1,
        LowStockOnly: filters.lowStockOnly !== '' ? Number(filters.lowStockOnly) : 0,
      };

      console.log('Fetching medicines with options:', options);

      const data = await getMedicineMasterList(clinicId, options);

      // Sort by name
      const sortedData = data.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      );

      setMedicines(sortedData);
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

  useEffect(() => {
    fetchMedicines(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  // ──────────────────────────────────────────────────
  // Statistics
  const getStatistics = () => ({
    totalMedicines: medicines.length,
    activeCount:    medicines.filter(m => m.status === 1).length,
    lowStockCount:  medicines.filter(m => m.isLowStock).length,
    totalValue:     medicines
      .reduce((sum, m) => sum + parseFloat(m.mrp) * m.stockQuantity, 0)
      .toFixed(2),
  });

  const statistics = getStatistics();

  // ──────────────────────────────────────────────────
  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const empty = {
      searchType:   'Name',
      searchValue:  '',
      type:         '',
      status:       '',
      lowStockOnly: '',
    };
    setFilterInputs(empty);
    setAppliedFilters(empty);
  };

  // ──────────────────────────────────────────────────
  const handleEditClick = (medicine) => {
    navigate(`/update-medicinemaster/${medicine.id}`);
  };

  // ── CHANGED: navigate to /medicinestock-list with medicineId in state ──
  const handleViewStock = (medicine) => {
    navigate('/medicinestock-list', {
      state: {
        medicineId:   medicine.id,
        medicineName: medicine.name,
      },
    });
  };

  const closeModals = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchMedicines(appliedFilters);
  };

  const formatCurrency = (value) =>
    `₹${parseFloat(value || 0).toFixed(2)}`;

  // Open view modal
  const handleViewDetails = (medicine) => {
    setViewModal({ isOpen: true, medicineId: medicine.id });
  };

  // Close view modal
  const handleCloseViewModal = () => {
    setViewModal({ isOpen: false, medicineId: null });
  };

  // Called by ViewMedicineMaster when "Update Medicine" is clicked
  const handleUpdateRequest = (medicineId) => {
    setViewModal({ isOpen: false, medicineId: null });
    setUpdateModal({ isOpen: true, medicineId });
  };

  // Close update modal
  const handleCloseUpdateModal = () => {
    setUpdateModal({ isOpen: false, medicineId: null });
  };

  // Called after a successful update — refresh list and close update modal
  const handleUpdateSuccess = () => {
    setUpdateModal({ isOpen: false, medicineId: null });
    fetchMedicines(appliedFilters);
  };

  // ──────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  // ──────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Medicine Master" />

      {/* ── Single-line Filter Bar ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          {/* Search type + value */}
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              {SEARCH_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                SEARCH_TYPE_OPTIONS.find(o => o.value === filterInputs.searchType)?.label || ''
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          {/* Medicine Type */}
          <div className={styles.filterGroup}>
            <select
              name="type"
              value={filterInputs.type}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Types</option>
              {MEDICINE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className={styles.filterGroup}>
            <select
              name="status"
              value={filterInputs.status}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="2">Inactive</option>
              <option value="3">Discontinued</option>
              <option value="4">Out of Stock</option>
            </select>
          </div>

          {/* Low Stock */}
          <div className={styles.filterGroup}>
            <select
              name="lowStockOnly"
              value={filterInputs.lowStockOnly}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              <option value="">All Stock</option>
              <option value="1">Low Stock Only</option>
            </select>
          </div>

          {/* Actions */}
          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={16} />
                Clear
              </button>
            )}

            <button onClick={() => setIsAddFormOpen(true)} className={styles.addBtn}>
              <FiPlus size={18} />
              Add Medicine
            </button>
          </div>

        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Type &amp; Unit</th>
              <th>Manufacturer</th>
              <th>Pricing</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicines.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.noData}>
                  {hasActiveFilters ? 'No medicines found.' : 'No medicines available yet.'}
                </td>
              </tr>
            ) : (
              medicines.map((medicine) => (
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
                        <span>  |  </span>
                        Sell: {formatCurrency(medicine.sellPrice)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className={styles.name}>
                        {medicine.stockQuantity} {medicine.unitDesc}
                      </div>
                      {medicine.isLowStock ? (
                        <span className={styles.lowStockBadge}>
                          <FiAlertCircle size={12} /> Low Stock
                        </span>
                      ) : (
                        <div className={styles.type}>
                          Reorder at: {medicine.reorderLevelQty}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${
                      medicine.status === 1 ? styles.statusActive : styles.statusInactive
                    }`}>
                      {medicine.statusDesc}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionsCell}>
                      <button
                        onClick={() => handleViewStock(medicine)}
                        className={styles.stockBtn}
                        title="View Stock"
                      >
                        <FiLayers size={16} />
                      </button>
                      <button
                        onClick={() => handleViewDetails(medicine)}
                        className={styles.detailsBtn}
                        title="View Details"
                      >
                        <FiEye size={16} />
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

      {/* View Medicine Detail Modal */}
      {viewModal.isOpen && (
        <ViewMedicineMaster
          isModal={true}
          medicineId={viewModal.medicineId}
          onClose={handleCloseViewModal}
          onUpdateRequest={handleUpdateRequest}
        />
      )}

      {/* Update Medicine Modal */}
      {updateModal.isOpen && (
        <UpdateMedicineMaster
          isModal={true}
          medicineId={updateModal.medicineId}
          onClose={handleCloseUpdateModal}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
};

export default MedicineMasterList;