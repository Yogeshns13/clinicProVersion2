// src/components/VendorList.jsx
import React, { useState, useEffect } from 'react';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { getVendorList } from '../Api/ApiPharmacy.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import AddVendor from './AddVendor.jsx';
import ViewVendor from './ViewVendor.jsx';
import styles from './VendorList.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

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
  // Data
  const [vendors, setVendors] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filter inputs (staged)
  const [filterInputs, setFilterInputs] = useState({
    searchType:  'Name',
    searchValue: '',
    status:      '1',
    dateFrom:    '',
    dateTo:      '',
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'Name',
    searchValue: '',
    status:      '1',
    dateFrom:    '',
    dateTo:      '',
  });

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // ── Button cooldown state (2-sec disable after click) ──────────────────────
  const [btnCooldown, setBtnCooldown] = useState({});

  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  // ──────────────────────────────────────────────────
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.status             !== '1' ||
    appliedFilters.dateFrom           !== '' ||
    appliedFilters.dateTo             !== '';

  // ──────────────────────────────────────────────────
  const fetchVendors = async (filters = appliedFilters, currentPage = page) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

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
        Page:          currentPage,
        PageSize:      pageSize,
      };

      const data = await getVendorList(clinicId, options);
      setVendors(Array.isArray(data) ? data : []);
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
    fetchVendors(appliedFilters, page);
  }, [page, appliedFilters]);

  // ──────────────────────────────────────────────────
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
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    triggerCooldown('search');
    setAppliedFilters({ ...filterInputs });
    setPage(1);
  };

  const handleClearFilters = () => {
    triggerCooldown('clear');
    const empty = { searchType: 'Name', searchValue: '', status: '1', dateFrom: '', dateTo: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
  };

  const handleViewDetails = (vendor) => {
    triggerCooldown(`view-${vendor.id}`);
    setSelectedVendor(vendor);
  };

  const handleViewClose = () => setSelectedVendor(null);

  const openAddForm = () => {
    triggerCooldown('add');
    setIsAddFormOpen(true);
  };

  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchVendors(appliedFilters, page);
  };

  // ──────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}><LoadingPage/></div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  const startRecord = vendors.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + vendors.length;

  // ──────────────────────────────────────────────────
  return (
    <div className={styles.listWrapper}>
      <Header title="Vendor List" />

      {/* Filter Bar */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

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

          <div className={styles.filterActions}>
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={!!btnCooldown['search']}
            >
              <FiSearch size={16} />
              Search
            </button>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={!!btnCooldown['clear']}
              >
                <FiX size={16} />
                Clear
              </button>
            )}

            <button
              onClick={openAddForm}
              className={styles.addBtn}
              disabled={!!btnCooldown['add']}
            >
              <FiPlus size={18} />
              Add Vendor
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
                        disabled={!!btnCooldown[`view-${vendor.id}`]}
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
            {vendors.length > 0
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
              disabled={vendors.length < pageSize || !!btnCooldown[`page-${page + 1}`]}
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
      {selectedVendor && (
        <ViewVendor
          vendor={selectedVendor}
          onClose={handleViewClose}
          onDeleteSuccess={() => {
            handleViewClose();
            fetchVendors(appliedFilters, page);
          }}
        />
      )}

      <AddVendor
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onAddSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default VendorList;