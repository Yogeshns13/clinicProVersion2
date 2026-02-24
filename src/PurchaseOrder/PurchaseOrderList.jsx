// src/components/PurchaseOrderList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiX } from 'react-icons/fi';
import { getPurchaseOrderList } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import AddPurchaseOrder from './AddPurchaseOrder.jsx';
import styles from './PurchaseOrderList.module.css';

// ──────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1,  label: 'Draft'             },
  { id: 2,  label: 'Sent'              },
  { id: 3,  label: 'Confirmed'         },
  { id: 4,  label: 'Partially Received'},
  { id: 5,  label: 'Fully Received'    },
  { id: 6,  label: 'Cancelled'         },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'VendorName', label: 'Vendor Name' },
  { value: 'PONumber',   label: 'PO Number'   },
];

// ──────────────────────────────────────────────────
const PurchaseOrderList = () => {
  const navigate = useNavigate();

  // Data
  const [allPurchaseOrders, setAllPurchaseOrders] = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error,   setError]                       = useState(null);

  // Filter inputs (not applied until Search)
  const [filterInputs, setFilterInputs] = useState({
    searchType:  'VendorName',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
  });

  // Applied filters (trigger API call)
  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'VendorName',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
  });

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // ──────────────────────────────────────────────────
  // Data fetching
  const fetchPurchaseOrders = async (filters) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const data = await getPurchaseOrderList(clinicId, {
        BranchID:   branchId,
        POID:       0,
        Status:     filters.status !== '' ? Number(filters.status) : -1,
        VendorName: filters.searchType === 'VendorName' ? filters.searchValue : '',
        PONumber:   filters.searchType === 'PONumber'   ? filters.searchValue : '',
        FromDate:   filters.dateFrom    || '',
        ToDate:     filters.dateTo      || '',
      });

      setAllPurchaseOrders(data);
    } catch (err) {
      console.error('fetchPurchaseOrders error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load purchase orders' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders(appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters]);

  // ──────────────────────────────────────────────────
  // Computed values
  const filteredPurchaseOrders = useMemo(() => allPurchaseOrders, [allPurchaseOrders]);

  const isFiltersActive =
    appliedFilters.searchValue !== '' ||
    appliedFilters.status      !== '' ||
    appliedFilters.dateFrom    !== '' ||
    appliedFilters.dateTo      !== '';

  // ──────────────────────────────────────────────────
  // Helper functions
  const getStatusLabel = (status) => {
    const found = STATUS_OPTIONS.find((s) => s.id === status);
    return found ? found.label : 'Unknown';
  };

  const getStatusClass = (status) => {
    if (status === 5) return styles.statusFullyReceived;
    if (status === 3) return styles.statusConfirmed;
    if (status === 2) return styles.statusSent;
    if (status === 1) return styles.statusDraft;
    if (status === 4) return styles.statusPartial;
    if (status === 6) return styles.statusCancelled;
    return styles.statusDraft;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year:  'numeric',
        month: 'short',
        day:   'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '—';
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
    const empty = { searchType: 'VendorName', searchValue: '', status: '', dateFrom: '', dateTo: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
  };

  const handleViewDetails = (po) => {
    navigate(`/view-purchaseorder/${po.id}`);
  };

  const openAddForm  = () => setIsAddFormOpen(true);
  const closeAddForm = () => setIsAddFormOpen(false);

  const handleAddSuccess = () => {
    fetchPurchaseOrders(appliedFilters);
  };

  // ──────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading purchase orders...</div>;
  if (error)   return <div className={styles.error}>Error: {error.message || error}</div>;

  // ──────────────────────────────────────────────────
  return (
    <div className={styles.listWrapper}>
      <Header title="Purchase Order List" />

        {/* Filters */}
        <div className={styles.filtersContainer}>
          <div className={styles.filtersGrid}>

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
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

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
                }...`}
                value={filterInputs.searchValue}
                onChange={handleFilterChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className={styles.searchInput}
              />
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
                <FiSearch size={18} />
                Search
              </button>
              {isFiltersActive && (
                <button onClick={handleClearFilters} className={styles.clearButton}>
                  <FiX size={18} />
                  Clear
                </button>
              )}
              <button onClick={openAddForm} className={styles.addBtn}>
                <FiPlus size={18} />
                Add PO
              </button>
            </div>

          </div>
        </div>

        {/* Table */}
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>PO Date</th>
                <th>Vendor</th>
                <th>Contact Person</th>
                <th>Total Amount</th>
                <th>Net Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className={styles.noData}>
                    {isFiltersActive
                      ? 'No purchase orders found.'
                      : 'No purchase orders registered yet.'}
                  </td>
                </tr>
              ) : (
                filteredPurchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {po.poNumber?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{po.poNumber || '—'}</div>
                          <div className={styles.subInfo}>{po.branchName || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(po.poDate)}</td>
                    <td>{po.vendorName || '—'}</td>
                    <td>{po.contactPerson || '—'}</td>
                    <td>
                      <span className={styles.amountBadge}>
                        {formatAmount(po.totalAmount)}
                      </span>
                    </td>
                    <td>
                      <span className={styles.amountBadge}>
                        {formatAmount(po.netAmount)}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(po.status)}`}>
                        {getStatusLabel(po.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleViewDetails(po)}
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

        {/* ──────────────── Add Purchase Order Modal ──────────────── */}
        <AddPurchaseOrder
          isOpen={isAddFormOpen}
          onClose={closeAddForm}
          onAddSuccess={handleAddSuccess}
        />
      </div>
  );
};

export default PurchaseOrderList;