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
const STATUS_OPTIONS = [
  { id: 1, label: 'Draft'              },
  { id: 2, label: 'Sent'               },
  { id: 3, label: 'Confirmed'          },
  { id: 4, label: 'Partially Received' },
  { id: 5, label: 'Fully Received'     },
  { id: 6, label: 'Cancelled'          },
];

const SEARCH_TYPE_OPTIONS = [
  { value: 'VendorName', label: 'Vendor Name' },
  { value: 'PONumber',   label: 'PO Number'   },
];

// ──────────────────────────────────────────────────
const PurchaseOrderList = () => {
  const navigate = useNavigate();

  const [allPurchaseOrders, setAllPurchaseOrders] = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error,   setError]                       = useState(null);

  const [filterInputs, setFilterInputs] = useState({
    searchType:  'VendorName',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
  });

  const [appliedFilters, setAppliedFilters] = useState({
    searchType:  'VendorName',
    searchValue: '',
    status:      '',
    dateFrom:    '',
    dateTo:      '',
  });

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // ── Fetch ──────────────────────────────────────
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
        FromDate:   filters.dateFrom || '',
        ToDate:     filters.dateTo   || '',
      });

      setAllPurchaseOrders(data);
    } catch (err) {
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

  // ── Computed ───────────────────────────────────
  const filteredPurchaseOrders = useMemo(() => allPurchaseOrders, [allPurchaseOrders]);

  const isFiltersActive =
    appliedFilters.searchValue !== '' ||
    appliedFilters.status      !== '' ||
    appliedFilters.dateFrom    !== '' ||
    appliedFilters.dateTo      !== '';

  // ── Helpers ────────────────────────────────────
  const getStatusLabel = (status) =>
    STATUS_OPTIONS.find((s) => s.id === status)?.label ?? 'Unknown';

  const getStatusClass = (status) => {
    const map = {
      1: styles.statusDraft,
      2: styles.statusSent,
      3: styles.statusConfirmed,
      4: styles.statusPartial,
      5: styles.statusFullyReceived,
      6: styles.statusCancelled,
    };
    return map[status] ?? styles.statusDraft;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return dateString; }
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '—';
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ── Handlers ───────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch      = () => setAppliedFilters({ ...filterInputs });
  const handleClearFilters = () => {
    const empty = { searchType: 'VendorName', searchValue: '', status: '', dateFrom: '', dateTo: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
  };

  const handleViewDetails = (po) => navigate(`/view-purchaseorder/${po.id}`);
  const openAddForm        = () => setIsAddFormOpen(true);
  const closeAddForm       = () => setIsAddFormOpen(false);
  const handleAddSuccess   = () => fetchPurchaseOrders(appliedFilters);

  // ── Early returns ──────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  // ── Render ─────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <Header title="Purchase Order List" />

      {/* ══ FILTERS ══ */}
      <div className={styles.inlineFiltersContainer}>
        <div className={styles.poFiltersGrid}>

          {/* Search type + value */}
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              {SEARCH_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${SEARCH_TYPE_OPTIONS.find((o) => o.value === filterInputs.searchType)?.label ?? ''}...`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className={styles.searchInput}
            />
          </div>

          {/* Status */}
          <select
            name="status"
            value={filterInputs.status}
            onChange={handleFilterChange}
            className={styles.inlineFilterSelect}
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* From Date */}
          <div className={styles.dateWrapper}>
            {!filterInputs.dateFrom && <span className={styles.datePlaceholder}>From Date</span>}
            <input
              type="date"
              name="dateFrom"
              value={filterInputs.dateFrom}
              onChange={handleFilterChange}
              className={`${styles.inlineFilterInput} ${!filterInputs.dateFrom ? styles.dateEmpty : ''}`}
            />
          </div>

          {/* To Date */}
          <div className={styles.dateWrapper}>
            {!filterInputs.dateTo && <span className={styles.datePlaceholder}>To Date</span>}
            <input
              type="date"
              name="dateTo"
              value={filterInputs.dateTo}
              onChange={handleFilterChange}
              className={`${styles.inlineFilterInput} ${!filterInputs.dateTo ? styles.dateEmpty : ''}`}
            />
          </div>

          {/* Actions */}
          <div className={styles.inlineFilterActions}>
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={16} /> Search
            </button>
            {isFiltersActive && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={16} /> Clear
              </button>
            )}
            <button onClick={openAddForm} className={styles.addBtn}>
              <FiPlus size={17} /> Add PO
            </button>
          </div>

        </div>
      </div>

      {/* ══ TABLE ══ */}
      {loading ? (
        <div className={styles.loading}>Loading purchase orders...</div>
      ) : error ? (
        <div className={styles.error}>Error: {error.message || error}</div>
      ) : (
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
                  <td colSpan={8} className={styles.noData}>
                    {isFiltersActive
                      ? 'No purchase orders match the filters.'
                      : 'No purchase orders registered yet.'}
                  </td>
                </tr>
              ) : (
                filteredPurchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {po.poNumber?.charAt(0).toUpperCase() ?? 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{po.poNumber || '—'}</div>
                          <div className={styles.subText}>{po.branchName || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDate(po.poDate)}</td>
                    <td>{po.vendorName || '—'}</td>
                    <td>{po.contactPerson || '—'}</td>
                    <td>
                      <span className={styles.amountBadge}>{formatAmount(po.totalAmount)}</span>
                    </td>
                    <td>
                      <span className={styles.amountBadge}>{formatAmount(po.netAmount)}</span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(po.status)}`}>
                        {getStatusLabel(po.status)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleViewDetails(po)}
                          className={styles.viewBtn}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ ADD PURCHASE ORDER MODAL ══ */}
      <AddPurchaseOrder
        isOpen={isAddFormOpen}
        onClose={closeAddForm}
        onAddSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default PurchaseOrderList;