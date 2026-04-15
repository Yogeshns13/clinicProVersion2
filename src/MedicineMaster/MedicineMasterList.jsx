// src/components/MedicineMasterList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiPlus,
  FiX,
  FiLayers,
  FiEye,
} from 'react-icons/fi';
import { getMedicineMasterList } from '../Api/ApiPharmacy.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './MedicineMasterList.module.css';
import AddMedicineMaster from './AddMedicineMaster.jsx';
import ViewMedicineMaster from './ViewMedicineMaster.jsx';
import UpdateMedicineMaster from './UpdateMedicineMaster.jsx';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

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

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter inputs (staged) — default status = '1' (Active)
  const [filterInputs, setFilterInputs] = useState({
    searchType:   'Name',
    searchValue:  '',
    type:         '',
    status:       '1',
    lowStockOnly: '',
  });

  // Applied filters — default status = '1' (Active)
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:   'Name',
    searchValue:  '',
    type:         '',
    status:       '1',
    lowStockOnly: '',
  });

  // UI States
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const [viewModal, setViewModal] = useState({
    isOpen:     false,
    medicineId: null,
  });

  const [updateModal, setUpdateModal] = useState({
    isOpen:     false,
    medicineId: null,
  });

  // ── Button cooldown state (2-sec disable after click) ──────────────────────
  const [btnCooldown, setBtnCooldown] = useState({});

  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  // ──────────────────────────────────────────────────
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.type               !== '' ||
    appliedFilters.status             !== '1' ||
    appliedFilters.lowStockOnly       !== '';

  // ──────────────────────────────────────────────────
  const fetchMedicines = async (filters = appliedFilters, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        Page:         currentPage,
        PageSize:     pageSize,
        BranchID:     branchId,
        Name:         filters.searchType === 'Name'         ? filters.searchValue.trim() : '',
        Manufacturer: filters.searchType === 'Manufacturer' ? filters.searchValue.trim() : '',
        HSNCode:      filters.searchType === 'HSNCode'      ? filters.searchValue.trim() : '',
        Barcode:      filters.searchType === 'Barcode'      ? filters.searchValue.trim() : '',
        Type:         filters.type         !== '' ? Number(filters.type)         : 0,
        Status:       filters.status       !== '' ? Number(filters.status)       : -1,
        LowStockOnly: filters.lowStockOnly !== '' ? Number(filters.lowStockOnly) : 0,
      };

      const response = await getMedicineMasterList(clinicId, options);

      const medicineList = Array.isArray(response) ? response : response?.data || [];
      const total = response?.total || medicineList.length;

      const sorted = medicineList.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      );

      setMedicines(sorted);
      setTotalRecords(total);
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
    fetchMedicines(appliedFilters, page);
  }, [appliedFilters, page]);

  // ──────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    triggerCooldown('search');
    setAppliedFilters({ ...filterInputs });
    setPage(1);
  };

  const handleClearFilters = () => {
    triggerCooldown('clear');
    const defaultFilters = {
      searchType:   'Name',
      searchValue:  '',
      type:         '',
      status:       '1',
      lowStockOnly: '',
    };
    setFilterInputs(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    if (newPage > Math.ceil(totalRecords / pageSize)) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
  };

  const handleViewStock = (medicine) => {
    triggerCooldown(`stock-${medicine.id}`);
    navigate('/medicinestock-list', {
      state: {
        medicineId:   medicine.id,
        medicineName: medicine.name,
      },
    });
  };

  const handleViewDetails = (medicine) => {
    triggerCooldown(`view-${medicine.id}`);
    setViewModal({ isOpen: true, medicineId: medicine.id });
  };

  const handleCloseViewModal = () => {
    setViewModal({ isOpen: false, medicineId: null });
  };

  const handleUpdateRequest = (medicineId) => {
    setViewModal({ isOpen: false, medicineId: null });
    setUpdateModal({ isOpen: true, medicineId });
  };

  const handleCloseUpdateModal = () => {
    setUpdateModal({ isOpen: false, medicineId: null });
  };

  const handleUpdateSuccess = () => {
    setUpdateModal({ isOpen: false, medicineId: null });
    fetchMedicines(appliedFilters, page);
  };

  const handleAddSuccess = () => {
    fetchMedicines(appliedFilters, page);
  };

  const handleDeleteSuccess = () => {
    setViewModal({ isOpen: false, medicineId: null });
    fetchMedicines(appliedFilters, page);
  };

  const formatCurrency = (value) =>
    `₹${parseFloat(value || 0).toFixed(2)}`;

  // ──────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}><LoadingPage/></div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  const totalPages  = Math.ceil(totalRecords / pageSize);
  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = Math.min(page * pageSize, totalRecords);

  const hasActiveFilter = hasActiveFilters;

  // ──────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Medicine Master" />

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
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
              placeholder={`Search by ${filterInputs.searchType}`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

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

          <div className={styles.filterActions}>
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={!!btnCooldown['search']}
            >
              <FiSearch size={16} /> Search
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={!!btnCooldown['clear']}
              >
                <FiX size={16} /> Clear
              </button>
            )}

            <button
              onClick={() => {
                triggerCooldown('add');
                setIsAddFormOpen(true);
              }}
              className={styles.addBtn}
              disabled={!!btnCooldown['add']}
            >
              <FiPlus size={18} /> Add Medicine
            </button>
          </div>
        </div>
      </div>

      {/* Table + Pagination wrapper */}
      <div className={styles.tableSection}>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Type & Unit</th>
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
                    {hasActiveFilter ? 'No medicines found.' : 'No medicines available yet.'}
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
                            {medicine.genericName || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className={styles.name}>{medicine.typeDesc || '—'}</div>
                        <div className={styles.type}>{medicine.unitDesc || '—'}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.type}>{medicine.manufacturer || '—'}</div>
                    </td>
                    <td>
                      <div className={styles.pricingCell}>
                        <span className={styles.priceBadge}>
                          MRP: {formatCurrency(medicine.mrp)}
                          <span> | </span>
                          Sell: {formatCurrency(medicine.sellPrice)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className={styles.name}>
                          {medicine.stockQuantity || 0}
                        </div>
                        {medicine.isLowStock ? (
                          <span className={styles.lowStockBadge}>
                            Low Stock
                          </span>
                        ) : (
                          <div className={styles.type}>
                            Reorder at: {medicine.reorderLevelQty || 0}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        medicine.status === 1 ? styles.statusActive : styles.statusInactive
                      }`}>
                        {medicine.statusDesc || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleViewStock(medicine)}
                          className={styles.stockBtn}
                          title="View Stock History"
                          disabled={!!btnCooldown[`stock-${medicine.id}`]}
                        >
                          <FiLayers size={16} />
                        </button>
                        <button
                          onClick={() => handleViewDetails(medicine)}
                          className={styles.detailsBtn}
                          title="View Details"
                          disabled={!!btnCooldown[`view-${medicine.id}`]}
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

        {/* ── Pagination Bar ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {totalRecords > 0
              ? `Showing ${startRecord}–${endRecord} records`
              : 'No records'}
          </div>

          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={page === 1 || !!btnCooldown['page-1']}
              title="First page"
            >
              «
            </button>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || !!btnCooldown[`page-${page - 1}`]}
              title="Previous page"
            >
              ‹
            </button>

            <span className={styles.pageIndicator}>{page}</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || !!btnCooldown[`page-${page + 1}`]}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{pageSize}</strong>
          </div>
        </div>

      </div>

      {/* Modals */}
      <AddMedicineMaster
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {viewModal.isOpen && (
        <ViewMedicineMaster
          isModal={true}
          medicineId={viewModal.medicineId}
          onClose={handleCloseViewModal}
          onUpdateRequest={handleUpdateRequest}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}

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