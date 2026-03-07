// src/components/VendorList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { getVendorList } from '../Api/ApiPharmacy.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import AddVendor from './AddVendor.jsx';
import ViewVendor from './ViewVendor.jsx';
import styles from './VendorList.module.css';

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
  { id: 3, label: 'Blacklisted' },
  { id: 4, label: 'Suspended' },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'Name',          label: 'Name' },
  { value: 'ContactPerson', label: 'Contact Person' },
  { value: 'Mobile',        label: 'Mobile' },
  { value: 'GSTNo',         label: 'GST No' },
];

// ──────────────────────────────────────────────────
const VendorList = () => {
  const navigate = useNavigate();

  // Data
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Filter inputs (staged — not applied until Search is clicked)
  const [filterInputs, setFilterInputs] = useState({
    searchType:  'Name',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
  });

  // Applied filters (drive the API call)
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'Name',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
  });

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // View Details Modal
  const [selectedVendor, setSelectedVendor] = useState(null);

  // ──────────────────────────────────────────────────
  // Derived: are any filters actually active?
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.status             !== '' ||
    appliedFilters.dateFrom           !== '' ||
    appliedFilters.dateTo             !== '';

  // ──────────────────────────────────────────────────
  // Data fetching — driven by appliedFilters
  const fetchVendors = async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        BranchID:      branchId,
        VendorID:      0,
        Status:        filters.status !== '' ? Number(filters.status) : -1,
        Name:          filters.searchType === 'Name'          ? filters.searchValue : '',
        ContactPerson: filters.searchType === 'ContactPerson' ? filters.searchValue : '',
        Mobile:        filters.searchType === 'Mobile'        ? filters.searchValue : '',
        GSTNo:         filters.searchType === 'GSTNo'         ? filters.searchValue : '',
        FromDate:      filters.dateFrom || '',
        ToDate:        filters.dateTo   || '',
      };

      const data = await getVendorList(clinicId, options);
      setVendors(data);
    } catch (err) {
      console.error('fetchVendors error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load vendors' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  // ──────────────────────────────────────────────────
  // Helper functions
  const getStatusLabel = (status) => {
    const found = STATUS_OPTIONS.find((s) => s.id === status);
    return found ? found.label : 'Unknown';
  };

  const getStatusClass = (status) => {
    if (status === 1) return styles.active;
    if (status === 2) return styles.inactive;
    if (status === 3) return styles.blacklisted;
    if (status === 4) return styles.suspended;
    return styles.inactive;
  };

  // ──────────────────────────────────────────────────
  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const empty = { searchType: 'Name', searchValue: '', status: '', dateFrom: '', dateTo: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
  };

  const handleViewDetails = (vendor) => {
    setSelectedVendor(vendor);
    console.log("Hi", vendor)
  };

  const handleViewClose = () => {
    setSelectedVendor(null);
  };

  const handleDeleteSuccess = () => {
    setSelectedVendor(null);
    fetchVendors(appliedFilters);
  };

  const openAddForm  = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchVendors(appliedFilters);
  };

  // ──────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading vendors...</div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  // ──────────────────────────────────────────────────
  return (
    <div className={styles.listWrapper}>
      <Header title="Vendor List" />

      {/* ── Filter Bar ── */}
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
              {SEARCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                SEARCH_TYPE_OPTIONS.find((o) => o.value === filterInputs.searchType)?.label || ''
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
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
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateFrom && (
                <span className={styles.datePlaceholder}>From Date</span>
              )}
              <input
                type="date"
                name="dateFrom"
                value={filterInputs.dateFrom}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateFrom ? styles.dateEmpty : ''}`}
              />
            </div>
          </div>

          {/* To Date */}
          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateTo && (
                <span className={styles.datePlaceholder}>To Date</span>
              )}
              <input
                type="date"
                name="dateTo"
                value={filterInputs.dateTo}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateTo ? styles.dateEmpty : ''}`}
              />
            </div>
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

            <button onClick={openAddForm} className={styles.addBtn}>
              <FiPlus size={18} />
              Add Vendor
            </button>
          </div>

        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Contact Person</th>
              <th>Mobile</th>
              <th>Email</th>
              <th>GST No</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.noData}>
                  {hasActiveFilters ? 'No vendors found.' : 'No vendors registered yet.'}
                </td>
              </tr>
            ) : (
              vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {vendor.name?.charAt(0).toUpperCase() || 'V'}
                      </div>
                      <div>
                        <div className={styles.name}>{vendor.name}</div>
                        <div className={styles.subInfo}>{vendor.branchName || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{vendor.contactPerson || '—'}</td>
                  <td>{vendor.mobile || '—'}</td>
                  <td>{vendor.email || '—'}</td>
                  <td>
                    {vendor.gstNo ? (
                      <span className={styles.gstBadge}>{vendor.gstNo}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(vendor.status)}`}>
                      {getStatusLabel(vendor.status)}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleViewDetails(vendor)}
                      className={styles.detailsBtn}
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

      {/* ── View Vendor Modal ── */}
      {selectedVendor && (
        <ViewVendor
          vendor={selectedVendor}
          onClose={handleViewClose}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}

      {/* ── Add Vendor Modal ── */}
      <AddVendor
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onAddSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default VendorList;