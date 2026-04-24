// src/components/PurchaseOrderList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiPlus, FiX, FiPhone, FiPercent } from 'react-icons/fi';
import { getPurchaseOrderList } from '../Api/ApiPharmacy.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import AddPurchaseOrder from './AddPurchaseOrder.jsx';
import styles from './PurchaseOrderList.module.css';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

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

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic column pool
// Slot 0 → replaces "Contact Person" column
// Slot 1 → replaces "Total Amount" column
// ─────────────────────────────────────────────────────────────────────────────
const DYNAMIC_COLS_MAP = {
  discount:     { id: 'discount',     label: 'Discount',      header: 'Discount',      icon: <FiPercent size={15} />, render: (po) => po.discount !== undefined && po.discount !== null ? `₹${parseFloat(po.discount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—' },
  vendorMobile: { id: 'vendorMobile', label: 'Vendor Mobile', header: 'Vendor Mobile', icon: <FiPhone   size={15} />, render: (po) => po.vendorMobile || po.contactMobile || '—' },
};

// Slot defaults — used when the dynamic col for that slot is NOT active
const SLOT_DEFAULTS = [
  { header: 'Contact Person', render: (po) => po.contactPerson || '—' },
  { header: 'Total Amount',   render: (po) => po.totalAmount !== undefined && po.totalAmount !== null ? `₹${parseFloat(po.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—' },
];

const INITIAL_ORDER = ['discount', 'vendorMobile'];

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB helpers
// ─────────────────────────────────────────────────────────────────────────────
const IDB_NAME    = 'AppPreferences';
const IDB_STORE   = 'columnPrefs';
const IDB_KEY     = 'purchaseOrderList';
const IDB_VERSION = 1;

const openIDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });

const idbGet = async (key) => {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = (e) => resolve(e.target.result ?? null);
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch { return null; }
};

const idbSet = async (key, value) => {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(IDB_STORE, 'readwrite');
      const req = tx.objectStore(IDB_STORE).put(value, key);
      req.onsuccess = () => resolve();
      req.onerror   = (e) => reject(e.target.error);
    });
  } catch { /* silent */ }
};

// ─────────────────────────────────────────────────────────────────────────────
// PurchaseOrderList
// ─────────────────────────────────────────────────────────────────────────────
const PurchaseOrderList = () => {
  const navigate = useNavigate();

  const [allPurchaseOrders, setAllPurchaseOrders] = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error,   setError]                       = useState(null);

  // ── Dynamic columns ───────────────────────────────────────────────────────
  const [activeColumns, setActiveColumns] = useState(new Set());
  const [menuOrder,     setMenuOrder]     = useState(INITIAL_ORDER);

  // FIX 1: useState instead of useRef — so the persist effect re-runs
  //        in the same React batch after the async IDB load completes.
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load persisted prefs from IndexedDB on mount
  useEffect(() => {
    // Clean up old stale DB if it exists
    indexedDB.deleteDatabase('PurchaseOrderPrefs');

    (async () => {
      try {
        const saved = await idbGet(IDB_KEY);
        if (saved) {
          if (Array.isArray(saved.activeColumns) && saved.activeColumns.length > 0) {
            setActiveColumns(new Set(saved.activeColumns));
          }
          if (Array.isArray(saved.menuOrder) && saved.menuOrder.length > 0) {
            setMenuOrder(saved.menuOrder);
          }
        }
      } catch {
        // Fall through with defaults on any IDB error
      } finally {
        // FIX 2: always set loaded=true even on error, so the guard unblocks
        setPrefsLoaded(true);
      }
    })();
  }, []);

  // Persist prefs to IndexedDB whenever they change — skip before first load
  useEffect(() => {
    if (!prefsLoaded) return;
    idbSet(IDB_KEY, {
      activeColumns: Array.from(activeColumns),
      menuOrder,
    });
  }, [activeColumns, menuOrder, prefsLoaded]);

  // ── Derived table slots ───────────────────────────────────────────────────
  const tableSlots = useMemo(() => {
    return SLOT_DEFAULTS.map((def, slotIdx) => {
      const colId  = menuOrder[slotIdx];
      const dynCol = colId ? DYNAMIC_COLS_MAP[colId] : null;
      if (dynCol && activeColumns.has(colId)) {
        return { header: dynCol.header, render: dynCol.render };
      }
      return { header: def.header, render: def.render };
    });
  }, [activeColumns, menuOrder]);

  const toggleDynCol = (id) => {
    setActiveColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMenuReorder = (newOrderIds) => setMenuOrder(newOrderIds);

  const poMenuItems = menuOrder.map((id) => {
    const col = DYNAMIC_COLS_MAP[id];
    return {
      id:       col.id,
      icon:     col.icon,
      label:    col.label,
      checked:  activeColumns.has(col.id),
      keepOpen: true,
      onClick:  () => toggleDynCol(col.id),
    };
  });

  // ── Pagination ────────────────────────────────────────────────────────────
  const [page, setPage]                 = useState(1);
  const [pageSize]                      = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

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

  // ── Button cooldown (2-sec disable after click) ───────────────────────────
  const [btnCooldown, setBtnCooldown] = useState({});
  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchPurchaseOrders = async (filters, currentPage) => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const data = await getPurchaseOrderList(clinicId, {
        Page:       currentPage,
        PageSize:   pageSize,
        BranchID:   branchId,
        POID:       0,
        Status:     filters.status !== '' ? Number(filters.status) : -1,
        VendorName: filters.searchType === 'VendorName' ? filters.searchValue : '',
        PONumber:   filters.searchType === 'PONumber'   ? filters.searchValue : '',
        FromDate:   filters.dateFrom || '',
        ToDate:     filters.dateTo   || '',
      });

      const orders = Array.isArray(data) ? data : data?.data || [];
      const total  = data?.total || orders.length;

      setAllPurchaseOrders(orders);
      setTotalRecords(total);
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
    fetchPurchaseOrders(appliedFilters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Computed ──────────────────────────────────────────────────────────────
  const isFiltersActive =
    appliedFilters.searchValue !== '' ||
    appliedFilters.status      !== '' ||
    appliedFilters.dateFrom    !== '' ||
    appliedFilters.dateTo      !== '';

  // ── Helpers ───────────────────────────────────────────────────────────────
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    triggerCooldown('search');
    setAppliedFilters({ ...filterInputs });
    setPage(1);
    fetchPurchaseOrders({ ...filterInputs }, 1);
  };

  const handleClearFilters = () => {
    triggerCooldown('clear');
    const empty = { searchType: 'VendorName', searchValue: '', status: '', dateFrom: '', dateTo: '' };
    setFilterInputs(empty);
    setAppliedFilters(empty);
    setPage(1);
    fetchPurchaseOrders(empty, 1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    if (newPage > Math.ceil(totalRecords / pageSize)) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
    fetchPurchaseOrders(appliedFilters, newPage);
  };

  const handleViewDetails = (po) => {
    triggerCooldown(`view-${po.id}`);
    navigate(`/purchaseorderitem/${po.id}`);
  };

  const openAddForm      = () => { triggerCooldown('add'); setIsAddFormOpen(true); };
  const closeAddForm     = () => setIsAddFormOpen(false);
  const handleAddSuccess = () => fetchPurchaseOrders(appliedFilters, page);

  // ── Early returns ─────────────────────────────────────────────────────────
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  // ── Pagination calc ───────────────────────────────────────────────────────
  const totalPages  = Math.ceil(totalRecords / pageSize);
  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = Math.min(page * pageSize, totalRecords);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <Header
        title="Purchase Order List"
        menuItems={poMenuItems}
        onMenuReorder={handleMenuReorder}
      />

      {/* ══ FILTERS ══ */}
      <div className={styles.inlineFiltersContainer}>
        <div className={styles.poFiltersGrid}>

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

          <div className={styles.inlineFilterActions}>
            <button
              onClick={handleSearch}
              className={styles.searchButton}
              disabled={!!btnCooldown['search']}
            >
              <FiSearch size={16} /> Search
            </button>
            {isFiltersActive && (
              <button
                onClick={handleClearFilters}
                className={styles.clearButton}
                disabled={!!btnCooldown['clear']}
              >
                <FiX size={16} /> Clear
              </button>
            )}
            <button
              onClick={openAddForm}
              className={styles.addBtn}
              disabled={!!btnCooldown['add']}
            >
              <FiPlus size={17} /> Add PO
            </button>
          </div>

        </div>
      </div>

      {/* ══ TABLE + PAGINATION ══ */}
      <div className={styles.tableSection}>
        {loading ? (
          <div className={styles.loading}><LoadingPage /></div>
        ) : error ? (
          <div className={styles.error}>Error: {error.message || error}</div>
        ) : (
          <>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>PO Date</th>
                    <th>Vendor</th>
                    <th>{tableSlots[0].header}</th>
                    <th>{tableSlots[1].header}</th>
                    <th>Net Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allPurchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={styles.noData}>
                        {isFiltersActive
                          ? 'No purchase orders match the filters.'
                          : 'No purchase orders registered yet.'}
                      </td>
                    </tr>
                  ) : (
                    allPurchaseOrders.map((po) => (
                      <tr key={po.id}>
                        <td>
                          <div className={styles.nameCell}>
                            <div className={styles.avatar}>
                              {po.poNumber?.charAt(0).toUpperCase() ?? 'P'}
                            </div>
                            <div>
                              <div className={styles.name}>{po.poNumber || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td>{formatDate(po.poDate)}</td>
                        <td>{po.vendorName || '—'}</td>
                        {/* Slot 0 — Contact Person or dynamic */}
                        <td>{tableSlots[0].render(po)}</td>
                        {/* Slot 1 — Total Amount (styled) or dynamic */}
                        <td>
                          {activeColumns.has(menuOrder[1]) && DYNAMIC_COLS_MAP[menuOrder[1]]
                            ? tableSlots[1].render(po)
                            : <span className={styles.amountBadge}>{tableSlots[1].render(po)}</span>
                          }
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
                              disabled={!!btnCooldown[`view-${po.id}`]}
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
                >«</button>
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || !!btnCooldown[`page-${page - 1}`]}
                  title="Previous page"
                >‹</button>
                <span className={styles.pageIndicator}>{page}</span>
                <button
                  className={styles.pageBtn}
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages || !!btnCooldown[`page-${page + 1}`]}
                  title="Next page"
                >›</button>
              </div>

              <div className={styles.pageSizeInfo}>
                Page Size: <strong>{pageSize}</strong>
              </div>
            </div>
          </>
        )}
      </div>

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