// src/components/LabWork/LabWorkQueue.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSearch, FiCalendar, FiFilter, FiChevronDown, FiChevronRight, 
  FiClock, FiCheckCircle, FiAlertCircle, FiPackage, FiActivity, FiX,
  FiSave, FiXCircle, FiUser, FiFileText, FiEye
} from 'react-icons/fi';
import { 
  getLabWorkItemsList, 
  updateSampleCollection,
  updateLabWorkItemResult,
  approveLabWorkItem,
  rejectLabWorkItem,
  getLabTestOrderList,
  updateLabTestOrder,
  getLabTestMasterList
} from '../Api/ApiLabTests.js';
import { getEmployeeList } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './LabWorkQueue.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';
import ViewWorkItem from './ViewWorkItem.jsx';

// ─── Hook: 2-second button cooldown ───────────────────────────────────────────
const useButtonCooldown = () => {
  const [cooldowns, setCooldowns] = useState({});
  const timers = useRef({});

  const trigger = (key) => {
    setCooldowns(prev => ({ ...prev, [key]: true }));
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => {
      setCooldowns(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const isDisabled = (key) => !!cooldowns[key];

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout);
  }, []);

  return { trigger, isDisabled };
};

// ─── Main Component ────────────────────────────────────────────────────────────
const LabWorkQueue = () => {
  const navigate = useNavigate();
  const cooldown = useButtonCooldown();

  // MessagePopup state
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopupMsg = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Order list (lightweight — one row per orderId)
  const [orderList, setOrderList] = useState([]);

  // ── Per-order lazy data
  const [orderDetails, setOrderDetails] = useState({});

  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [doctors, setDoctors] = useState([]);
  
  // Filter inputs (not applied until search)
  const [filterInputs, setFilterInputs] = useState({
    searchType: 'patientName',
    searchValue: '',
    status: -1,
    doctorId: 0,
    dateFrom: '',
    dateTo: ''
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'patientName',
    searchValue: '',
    status: -1,
    doctorId: 0,
    dateFrom: '',
    dateTo: ''
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Work Detail Modal States
  const [showWorkDetailModal, setShowWorkDetailModal] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState(null);
  const [selectedOrderData, setSelectedOrderData] = useState(null);

  // View Work Item Modal States
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewWorkItem, setViewWorkItem] = useState(null);
  const [viewOrderData, setViewOrderData] = useState(null);
  const [viewOrderStatus, setViewOrderStatus] = useState(null);

  // Mark as Complete States
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [orderToComplete, setOrderToComplete] = useState(null);
  const [completingOrder, setCompletingOrder] = useState(false);

  // Status options
  const statusOptions = [
    { id: -1, label: 'All Statuses', color: 'default' },
    { id: 1,  label: 'Pending',      color: 'warning'  },
    { id: 2,  label: 'In Progress',  color: 'progress' },
    { id: 3,  label: 'Completed',    color: 'success'  },
    { id: 4,  label: 'Rejected',     color: 'danger'   }
  ];

  // Are any filters active?
  const hasActiveFilters =
    String(appliedFilters.searchValue).trim() !== '' ||
    Number(appliedFilters.status)              !== -1 ||
    Number(appliedFilters.doctorId)            !== 0  ||
    appliedFilters.dateFrom !== '' ||
    appliedFilters.dateTo   !== '';

  // ── Fetch Doctors List ────────────────────────────────────────────────────
  const fetchDoctors = async () => {
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const employeeList = await getEmployeeList(clinicId, {
        Page: 1, PageSize: 100, BranchID: branchId, Designation: 1, Status: 1
      });
      setDoctors(employeeList);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  // ── Fetch ONLY the order list (lightweight) ──────────────────────────────
  const fetchOrderList = async (filters = appliedFilters) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        Page: 1,
        PageSize: 200,
        BranchID: branchId,
        Status: filters.status
      };

      if (filters.searchValue.trim()) {
        const searchTerm = filters.searchValue.trim();
        if (filters.searchType === 'orderId') {
          options.OrderID = Number(searchTerm) || 0;
        } else {
          options.Search = searchTerm;
        }
      }

      if (filters.doctorId > 0) options.DoctorID = filters.doctorId;
      if (filters.dateFrom && filters.dateTo) {
        options.FromDate = filters.dateFrom;
        options.ToDate   = filters.dateTo;
      }

      const data = await getLabWorkItemsList(clinicId, options);

      // Client-side filter for non-orderId search types
      let filteredData = data;
      if (filters.searchValue.trim() && filters.searchType !== 'orderId') {
        const term = filters.searchValue.toLowerCase();
        switch (filters.searchType) {
          case 'patientName': filteredData = filteredData.filter(i => i.patientName?.toLowerCase().includes(term)); break;
          case 'mobile':      filteredData = filteredData.filter(i => i.mobile?.toLowerCase().includes(term));      break;
          case 'fileNo':      filteredData = filteredData.filter(i => i.fileNo?.toLowerCase().includes(term));      break;
          case 'testName':    filteredData = filteredData.filter(i => i.testName?.toLowerCase().includes(term));    break;
          default: break;
        }
      }

      // Deduplicate to one summary row per orderId (sorted newest first)
      const seen   = new Set();
      const orders = [];
      [...filteredData]
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
        .forEach(item => {
          if (!seen.has(item.orderId)) {
            seen.add(item.orderId);
            orders.push({
              orderId:     item.orderId,
              patientName: item.patientName,
              fileNo:      item.fileNo,
              mobile:      item.mobile,
              doctorName:  item.doctorName,
              dateCreated: item.dateCreated,
            });
          }
        });

      setOrderList(orders);
      setOrderDetails({});
    } catch (err) {
      console.error('fetchOrderList error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch order list and re-expand a specific order after reload ─────────
  const fetchOrderListAndReexpand = async (filters = appliedFilters, reexpandOrderId = null) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const options = {
        Page: 1,
        PageSize: 200,
        BranchID: branchId,
        Status: filters.status
      };

      if (filters.searchValue.trim()) {
        const searchTerm = filters.searchValue.trim();
        if (filters.searchType === 'orderId') {
          options.OrderID = Number(searchTerm) || 0;
        } else {
          options.Search = searchTerm;
        }
      }

      if (filters.doctorId > 0) options.DoctorID = filters.doctorId;
      if (filters.dateFrom && filters.dateTo) {
        options.FromDate = filters.dateFrom;
        options.ToDate   = filters.dateTo;
      }

      const data = await getLabWorkItemsList(clinicId, options);

      let filteredData = data;
      if (filters.searchValue.trim() && filters.searchType !== 'orderId') {
        const term = filters.searchValue.toLowerCase();
        switch (filters.searchType) {
          case 'patientName': filteredData = filteredData.filter(i => i.patientName?.toLowerCase().includes(term)); break;
          case 'mobile':      filteredData = filteredData.filter(i => i.mobile?.toLowerCase().includes(term));      break;
          case 'fileNo':      filteredData = filteredData.filter(i => i.fileNo?.toLowerCase().includes(term));      break;
          case 'testName':    filteredData = filteredData.filter(i => i.testName?.toLowerCase().includes(term));    break;
          default: break;
        }
      }

      const seen   = new Set();
      const orders = [];
      [...filteredData]
        .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated))
        .forEach(item => {
          if (!seen.has(item.orderId)) {
            seen.add(item.orderId);
            orders.push({
              orderId:     item.orderId,
              patientName: item.patientName,
              fileNo:      item.fileNo,
              mobile:      item.mobile,
              doctorName:  item.doctorName,
              dateCreated: item.dateCreated,
            });
          }
        });

      setOrderList(orders);
      setOrderDetails({});

      // Re-expand the processed order and lazy-load its fresh details
      if (reexpandOrderId) {
        setExpandedOrders(new Set([reexpandOrderId]));
      } else {
        setExpandedOrders(new Set());
      }
    } catch (err) {
      console.error('fetchOrderListAndReexpand error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Lazy-load work items + order status for a single order ───────────────
  const loadOrderDetails = async (orderId) => {
    if (orderDetails[orderId]?.loaded || orderDetails[orderId]?.loading) return;

    setOrderDetails(prev => ({
      ...prev,
      [orderId]: { items: [], orderStatus: null, loading: true, loaded: false }
    }));

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const data = await getLabWorkItemsList(clinicId, {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        OrderID: orderId,
        Status: -1
      });

      let orderStatus = null;
      try {
        const orderData = await getLabTestOrderList(clinicId, { OrderID: orderId, BranchID: branchId });
        if (orderData && orderData.length > 0) orderStatus = orderData[0].status;
      } catch (err) {
        console.error(`Failed to fetch order status for ${orderId}:`, err);
      }

      setOrderDetails(prev => ({
        ...prev,
        [orderId]: {
          items:       Array.isArray(data) ? data : [],
          orderStatus,
          loading:     false,
          loaded:      true
        }
      }));
    } catch (err) {
      console.error(`loadOrderDetails error for order ${orderId}:`, err);
      setOrderDetails(prev => ({
        ...prev,
        [orderId]: { items: [], orderStatus: null, loading: false, loaded: false }
      }));
    }
  };

  useEffect(() => {
    fetchOrderList(appliedFilters);
    fetchDoctors();
  }, []);

  // When expandedOrders changes and an order has no details yet, load them
  useEffect(() => {
    expandedOrders.forEach(orderId => {
      if (!orderDetails[orderId]?.loaded && !orderDetails[orderId]?.loading) {
        loadOrderDetails(orderId);
      }
    });
  }, [expandedOrders]);

  // Paginated slice of orderList
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return orderList.slice(start, start + pageSize);
  }, [orderList, page, pageSize]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const newFilters = { ...filterInputs };
    setAppliedFilters(newFilters);
    setPage(1);
    fetchOrderList(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      searchType: 'patientName', searchValue: '',
      status: -1, doctorId: 0, dateFrom: '', dateTo: ''
    };
    setFilterInputs(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
    fetchOrderList(emptyFilters);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
  };

  // ── Toggle expand — triggers lazy load on first open ─────────────────────
  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      loadOrderDetails(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const getOrderStatus = (items) => {
    const statuses = items.map(i => i.status);
    if (statuses.every(s => s === 3)) return { status: 3, label: 'All Completed', color: 'success'  };
    if (statuses.some(s  => s === 2)) return { status: 2, label: 'In Progress',   color: 'progress' };
    if (statuses.some(s  => s === 1)) return { status: 1, label: 'Pending',        color: 'warning'  };
    if (statuses.some(s  => s === 4)) return { status: 4, label: 'Rejected',       color: 'danger'   };
    return { status: -1, label: 'Mixed', color: 'default' };
  };

  const getStatusBadgeClass = (color) => styles[`status${color}`] || styles.statusDefault;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getProgressColors = (pct) => {
    if (pct === 100) return { gradient: 'linear-gradient(90deg, #207d9c, #30b2b5)', textColor: '#30b2b5' };
    if (pct >= 71)   return { gradient: 'linear-gradient(90deg, #16a34a, #22c55e)', textColor: '#16a34a' };
    if (pct >= 31)   return { gradient: 'linear-gradient(90deg, #eab308, #fbbf24)', textColor: '#eab308' };
    return { gradient: 'linear-gradient(90deg, #dc2626, #ef4444)', textColor: '#dc2626' };
  };

  // ── Show "Mark as Complete" button only when:
  //    - all items are completed (100%)
  //    - order status is NOT already 2 (marked complete)
  const isOrderMarkedComplete        = (orderId, items) => items.every(i => i.status === 3) && orderDetails[orderId]?.orderStatus === 2;
  const shouldShowMarkCompleteButton = (orderId, items) => items.every(i => i.status === 3) && orderDetails[orderId]?.orderStatus !== 2;

  const handleProcessWorkItem = (item, orderData) => {
    setSelectedWorkItem(item);
    setSelectedOrderData(orderData);
    setShowWorkDetailModal(true);
  };

  // ── Open View modal for completed/rejected items ───────────────────────────
  const handleViewWorkItem = (item, orderData, orderStatus) => {
    setViewWorkItem(item);
    setViewOrderData(orderData);
    setViewOrderStatus(orderStatus ?? null);
    setShowViewModal(true);
  };

  // ── Close View modal ──────────────────────────────────────────────────────
  const handleCloseViewModal = (processedOrderId = null, message = null, messageType = 'success') => {
    setShowViewModal(false);
    setViewWorkItem(null);
    setViewOrderData(null);
    setViewOrderStatus(null);
    if (message) showPopupMsg(message, messageType);
    if (processedOrderId) {
      fetchOrderListAndReexpand(appliedFilters, processedOrderId);
    }
  };

  // ── Close modal: reload list and re-expand the processed order ───────────
  const handleCloseWorkDetail = (processedOrderId = null, message = null, messageType = 'success') => {
    setShowWorkDetailModal(false);
    setSelectedWorkItem(null);
    setSelectedOrderData(null);
    if (message) showPopupMsg(message, messageType);
    const targetOrderId = processedOrderId || selectedOrderData?.orderId || null;
    fetchOrderListAndReexpand(appliedFilters, targetOrderId);
  };

  const handleSaveWorkDetail = () => {};

  // ── Mark as Complete click guard:
  //    If orderStatus !== 4 → show warning popup (not invoiced yet)
  //    If orderStatus === 4 → open confirm dialog
  const handleMarkCompleteClick = (orderId, orderData) => {
    const currentOrderStatus = orderDetails[orderId]?.orderStatus;
    if (currentOrderStatus !== 4) {
      showPopupMsg('This order has not been invoiced yet. Please invoice the order first and try again.', 'warning');
      return;
    }
    setOrderToComplete({ orderId, orderData });
    setShowCompleteConfirm(true);
  };

  const handleConfirmMarkComplete = async () => {
    if (!orderToComplete) return;
    cooldown.trigger('markComplete');
    try {
      setCompletingOrder(true);
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const orderDetailsApi = await getLabTestOrderList(clinicId, { OrderID: orderToComplete.orderId, BranchID: branchId });
      if (!orderDetailsApi || orderDetailsApi.length === 0) throw new Error('Order details not found');

      const od = orderDetailsApi[0];
      await updateLabTestOrder({
        orderId: orderToComplete.orderId, clinicId, branchId,
        status: 2, fileId: od.fileId || 0, priority: od.priority || 1,
        notes: od.notes || '', testApprovedBy: od.doctorId || 0
      });

      setOrderDetails(prev => ({
        ...prev,
        [orderToComplete.orderId]: { ...prev[orderToComplete.orderId], orderStatus: 2 }
      }));

      const completedOrderId = orderToComplete.orderId;
      setShowCompleteConfirm(false);
      setOrderToComplete(null);
      showPopupMsg('Order marked as complete successfully!', 'success');
      fetchOrderListAndReexpand(appliedFilters, completedOrderId);
    } catch (err) {
      console.error('Error marking order as complete:', err);
      showPopupMsg(err.message || 'Failed to mark order as complete', 'error');
    } finally {
      setCompletingOrder(false);
      setLoading(false);
    }
  };

  const handleCancelMarkComplete = () => {
    setShowCompleteConfirm(false);
    setOrderToComplete(null);
  };

  // Pagination display values
  const startRecord = paginatedOrders.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + paginatedOrders.length;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <LoadingPage/>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Work Queue" />

      {/* MessagePopup */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      {/* ── Filters ── */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          <div className={styles.searchGroup}>
            <select name="searchType" value={filterInputs.searchType} onChange={handleFilterChange} className={styles.searchTypeSelect}>
              <option value="patientName">Patient Name</option>
              <option value="mobile">Mobile</option>
              <option value="fileNo">File No</option>
              <option value="orderId">Order ID</option>
              <option value="testName">Test Name</option>
            </select>
            <input
              type="text" name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'patientName' ? 'Patient Name' :
                filterInputs.searchType === 'mobile'      ? 'Mobile'       :
                filterInputs.searchType === 'fileNo'      ? 'File No'      :
                filterInputs.searchType === 'orderId'     ? 'Order ID'     : 'Test Name'
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <select name="status" value={filterInputs.status} onChange={handleFilterChange} className={styles.filterInput}>
              {statusOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select name="doctorId" value={filterInputs.doctorId} onChange={handleFilterChange} className={styles.filterInput}>
              <option value={0}>All Doctors</option>
              {doctors.map(doc => <option key={doc.id} value={doc.id}>{doc.name}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateFrom && <span className={styles.datePlaceholder}>From Date</span>}
              <input type="date" name="dateFrom" value={filterInputs.dateFrom} onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateFrom ? styles.dateEmpty : ''}`} />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateTo && <span className={styles.datePlaceholder}>To Date</span>}
              <input type="date" name="dateTo" value={filterInputs.dateTo} onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.dateTo ? styles.dateEmpty : ''}`} />
            </div>
          </div>

          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton}><FiSearch size={16} /> Search</button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}><FiX size={16} /> Clear</button>
            )}
          </div>

        </div>
      </div>

      {/* ── Work Queue + Pagination wrapper ── */}
      <div className={styles.tableSection}>

        <div className={styles.workQueueContainer}>
          {paginatedOrders.length === 0 ? (
            <div className={styles.noData}>
              {hasActiveFilters ? 'No work items found matching your filters.' : 'No work items found.'}
            </div>
          ) : (
            paginatedOrders.map((orderData) => {
              const { orderId } = orderData;
              const isExpanded  = expandedOrders.has(orderId);
              const detail      = orderDetails[orderId];
              const items       = detail?.items || [];
              const isLoading   = detail?.loading || false;

              const completedCount     = items.filter(i => i.status === 3).length;
              const totalCount         = items.length;
              const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              const progressColors     = getProgressColors(progressPercentage);

              const showMarkCompleteBtn = detail?.loaded && shouldShowMarkCompleteButton(orderId, items);
              const showCompletedBadge  = detail?.loaded && isOrderMarkedComplete(orderId, items);

              return (
                <div key={orderId} className={styles.orderGroup}>
                  <div className={styles.orderHeader} onClick={() => toggleOrderExpansion(orderId)}>
                    <div className={styles.orderHeaderLeft}>
                      <button className={styles.expandIcon}>
                        {isExpanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                      </button>

                      <div className={styles.orderInfo}>
                        <div className={styles.orderMeta}>
                          <div className={styles.patientInfo}>
                            <div className={styles.avatar}>
                              {orderData.patientName?.charAt(0).toUpperCase() || 'P'}
                            </div>
                            <div>
                              <div className={styles.patientName}>{orderData.patientName}</div>
                              <div className={styles.patientDetails}>{orderData.fileNo} • {orderData.mobile}</div>
                            </div>
                          </div>

                          <div className={styles.orderStats}>
                            {detail?.loaded && (
                              <>
                                <div className={styles.statItem}><FiActivity size={14} /><span>{totalCount} Tests</span></div>
                                <div className={styles.statItem}><FiCheckCircle size={14} /><span>{completedCount} / {totalCount} Completed</span></div>
                              </>
                            )}
                            <div className={styles.statItem}><FiCalendar size={14} /><span>{formatDate(orderData.dateCreated)}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.orderHeaderRight}>
                      {detail?.loaded && totalCount > 0 && (
                        <div className={styles.progressContainer}>
                          <div className={styles.progressBar}>
                            <div className={styles.progressFill}
                              style={{ width: `${progressPercentage}%`, background: progressColors.gradient }} />
                          </div>
                          <div className={styles.progressText} style={{ color: progressColors.textColor }}>
                            {progressPercentage}%
                          </div>
                        </div>
                      )}

                      {showMarkCompleteBtn && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cooldown.trigger(`markComplete_${orderId}`);
                            handleMarkCompleteClick(orderId, orderData);
                          }}
                          disabled={cooldown.isDisabled(`markComplete_${orderId}`)}
                          className={styles.markCompleteBtn}
                        >
                          <FiCheckCircle size={18} /> Mark as Complete
                        </button>
                      )}

                      {showCompletedBadge && (
                        <div className={styles.completedBadge}><FiCheckCircle size={18} /> Completed</div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={styles.workItemsList}>
                      {isLoading ? (
                        <div className={styles.inlineLoader}>
                          <div className={styles.inlineSpinner}></div>
                          <span>Loading tests...</span>
                        </div>
                      ) : items.length === 0 ? (
                        <div className={styles.inlineEmpty}>No work items found for this order.</div>
                      ) : (
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Test Name</th>
                              <th>Result</th>
                              <th>Sample Collection</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => {
                              // Show View button for completed (status 3) or rejected (status 4) items
                              const showViewBtn = item.status === 3 || item.status === 4;
                              return (
                                <tr key={item.workId} className={styles.workItemRow}>
                                  <td><div className={styles.testName}>{item.testName}</div></td>
                                  <td>
                                    <div className={styles.resultCell}>
                                      {item.resultValue ? (
                                        <>
                                          <div className={styles.resultValue}>{item.resultValue} {item.resultUnits || ''}</div>
                                          <div className={styles.normalRange}>Range: {item.normalRange || 'N/A'}</div>
                                        </>
                                      ) : <span className={styles.noResult}>Not entered</span>}
                                    </div>
                                  </td>
                                  <td>
                                    <div className={styles.sampleCell}>
                                      {item.sampleCollectedTime ? (
                                        <>
                                          <div className={styles.sampleTime}><FiClock size={12} />{formatDate(item.sampleCollectedTime)} {formatTime(item.sampleCollectedTime)}</div>
                                          <div className={styles.samplePlace}>{item.sampleCollectedPlace || 'Not specified'}</div>
                                        </>
                                      ) : <span className={styles.noSample}>Not collected</span>}
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`${styles.badge} ${getStatusBadgeClass(statusOptions.find(s => s.id === item.status)?.color || 'default')}`}>
                                      {statusOptions.find(s => s.id === item.status)?.label || 'Unknown'}
                                    </span>
                                  </td>
                                  <td>
                                    {showViewBtn ? (
                                      /* ── View button for completed or rejected items ── */
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cooldown.trigger(`view_${item.workId}`);
                                          handleViewWorkItem(item, orderData, detail?.orderStatus);
                                        }}
                                        disabled={cooldown.isDisabled(`view_${item.workId}`)}
                                        className={styles.viewBtn}
                                      >
                                        <FiEye size={14} /> View
                                      </button>
                                    ) : (
                                      /* ── Process button for pending/in-progress items ── */
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          cooldown.trigger(`process_${item.workId}`);
                                          handleProcessWorkItem(item, orderData);
                                        }}
                                        disabled={cooldown.isDisabled(`process_${item.workId}`)}
                                        className={styles.processBtn}
                                      >
                                        Process
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Pagination Bar ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {paginatedOrders.length > 0 ? `Showing ${startRecord}–${endRecord} records` : 'No records'}
          </div>
          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(1)}          disabled={page === 1}                        title="First page">«</button>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page - 1)}   disabled={page === 1}                        title="Previous page">‹</button>
            <span className={styles.pageIndicator}>{page}</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page + 1)}   disabled={paginatedOrders.length < pageSize} title="Next page">›</button>
          </div>
          <div className={styles.pageSizeInfo}>Page Size: <strong>{pageSize}</strong></div>
        </div>

      </div>

      {/* Work Detail Modal */}
      {showWorkDetailModal && selectedWorkItem && selectedOrderData && (
        <LabWorkDetailModal
          workItem={selectedWorkItem}
          orderData={selectedOrderData}
          onClose={handleCloseWorkDetail}
          onSave={handleSaveWorkDetail}
          employees={doctors}
          showPopupMsg={showPopupMsg}
        />
      )}

      {/* View Work Item Modal */}
      {showViewModal && viewWorkItem && viewOrderData && (
        <ViewWorkItem
          workItem={viewWorkItem}
          orderData={viewOrderData}
          orderStatus={viewOrderStatus}
          onClose={handleCloseViewModal}
          employees={doctors}
          showPopupMsg={showPopupMsg}
        />
      )}

      {/* Mark as Complete Confirmation Modal */}
      {showCompleteConfirm && orderToComplete && (
        <div className={styles.modalOverlay} onClick={handleCancelMarkComplete}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>
              <h3>Mark Order as Complete</h3>
              <button onClick={handleCancelMarkComplete} className={styles.closeBtn} disabled={completingOrder}><FiX size={20} /></button>
            </div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to mark this order as complete?</p>
              <p><strong>Patient:</strong> {orderToComplete.orderData.patientName}</p>
              <p className={styles.confirmSubtext}>This will update the order status to "In Progress".</p>
            </div>
            <div className={styles.confirmFooter}>
              <button onClick={handleCancelMarkComplete} className={styles.cancelBtn} disabled={completingOrder}>Cancel</button>
              <button
                onClick={handleConfirmMarkComplete}
                className={styles.confirmBtn}
                disabled={completingOrder || cooldown.isDisabled('markComplete')}
              >
                <FiCheckCircle size={18} />{completingOrder ? 'Processing...' : 'Yes, Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Lab Work Detail Modal Component ──────────────────────────────────────────
const LabWorkDetailModal = ({ workItem, orderData, onClose, onSave, employees, showPopupMsg }) => {
  const cooldown = useButtonCooldown();

  const toLocalDateTimeString = (date) => {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [sampleData, setSampleData] = useState({
    sampleCollectedTime:  workItem.sampleCollectedTime
      ? toLocalDateTimeString(workItem.sampleCollectedTime)
      : toLocalDateTimeString(new Date()),
    sampleCollectedPlace: workItem.sampleCollectedPlace || ''
  });

  const [resultData, setResultData] = useState({
    resultValue:    workItem.resultValue    || '',
    interpretation: workItem.interpretation || null,
    remarks:        '',
    testDoneBy:     workItem.technicianId   || 0
  });

  const [testMasterData, setTestMasterData] = useState({
    resultUnits: workItem.resultUnits || '',
    normalRange: workItem.normalRange || '',
    loading:     false,
    fetched:     false
  });

  const [approvalData,   setApprovalData]   = useState({ testApprovedBy: workItem.approverId || 0, approvalRemarks: '' });
  const [rejectionData,  setRejectionData]  = useState({ testApprovedBy: 0, rejectReason: '' });
  const [validationMessages, setValidationMessages] = useState({});
  const [activeStep,    setActiveStep]    = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [showApprovalModal,  setShowApprovalModal]  = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  const interpretationOptions = [
    { value: null, label: 'Not specified'  },
    { value: 1,    label: 'Normal'         },
    { value: 2,    label: 'Abnormal - High'},
    { value: 3,    label: 'Abnormal - Low' },
    { value: 4,    label: 'Critical'       }
  ];

  useEffect(() => {
    const fetchTestMaster = async () => {
      if (!workItem.testId) return;
      setTestMasterData(prev => ({ ...prev, loading: true }));
      try {
        const clinicId   = await getStoredClinicId();
        const branchId   = await getStoredBranchId();
        const masterList = await getLabTestMasterList(clinicId, { TestID: workItem.testId, BranchID: branchId, Page: 1, PageSize: 1 });
        if (masterList && masterList.length > 0) {
          const m = masterList[0];
          setTestMasterData({ resultUnits: m.units || workItem.resultUnits || '', normalRange: m.normalRange || workItem.normalRange || '', loading: false, fetched: true });
        } else {
          setTestMasterData({ resultUnits: workItem.resultUnits || '', normalRange: workItem.normalRange || '', loading: false, fetched: true });
        }
      } catch (err) {
        console.error('Failed to fetch test master data:', err);
        setTestMasterData({ resultUnits: workItem.resultUnits || '', normalRange: workItem.normalRange || '', loading: false, fetched: true });
      }
    };
    fetchTestMaster();
  }, [workItem.testId]);

  useEffect(() => {
    if      (!workItem.sampleCollectedTime) setActiveStep(1);
    else if (!workItem.resultValue)         setActiveStep(2);
    else                                    setActiveStep(3);
  }, []);

  // ── Step 1 validation: sampleCollectedTime required ──
  const isSampleFormValid = sampleData.sampleCollectedTime !== '';

  // ── Step 2 validation: resultValue and testDoneBy required ──
  const isResultFormValid = resultData.resultValue.trim() !== '' && resultData.testDoneBy !== 0;

  // ── Approval validation: testApprovedBy required ──
  const isApprovalFormValid = approvalData.testApprovedBy !== 0;

  // ── Rejection validation: testApprovedBy and rejectReason required ──
  const isRejectionFormValid = rejectionData.testApprovedBy !== 0 && rejectionData.rejectReason.trim() !== '';

  const handleSampleSave = async () => {
    if (!isSampleFormValid) {
      showPopupMsg('Please fill all required fields: Collection Date & Time.', 'warning');
      return;
    }
    setValidationMessages(prev => ({ ...prev, sampleCollectedTime: '' }));
    cooldown.trigger('sampleSave');
    try {
      setLoading(true); setError(null); setStatusMessage({ type: '', text: '' });
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await updateSampleCollection({
        workId: workItem.workId, clinicId, branchId,
        sampleCollectedTime:  sampleData.sampleCollectedTime.replace('T', ' ') + ':00',
        sampleCollectedPlace: sampleData.sampleCollectedPlace
      });
      showPopupMsg('Sample collection details saved successfully!', 'success');
      setTimeout(() => { setActiveStep(2); setStatusMessage({ type: '', text: '' }); }, 1000);
    } catch (err) {
      setError(err);
      showPopupMsg(err.message || 'Failed to save sample collection', 'error');
    } finally { setLoading(false); }
  };

  const handleResultSave = async () => {
    if (!isResultFormValid) {
      showPopupMsg('Please fill all required fields: Result Value and Test Done By.', 'warning');
      return;
    }
    setValidationMessages(prev => ({ ...prev, resultValue: '' }));
    cooldown.trigger('resultSave');
    try {
      setLoading(true); setError(null); setStatusMessage({ type: '', text: '' });
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await updateLabWorkItemResult({
        workId: workItem.workId, clinicId, branchId,
        resultValue:    resultData.resultValue,
        resultUnits:    testMasterData.resultUnits,
        normalRange:    testMasterData.normalRange,
        interpretation: resultData.interpretation,
        remarks:        resultData.remarks,
        testDoneBy:     resultData.testDoneBy
      });
      showPopupMsg('Test results saved successfully!', 'success');
      setTimeout(() => { setActiveStep(3); setStatusMessage({ type: '', text: '' }); }, 1000);
    } catch (err) {
      setError(err);
      showPopupMsg(err.message || 'Failed to save results', 'error');
    } finally { setLoading(false); }
  };

  const handleApprove = async () => {
    if (!isApprovalFormValid) {
      showPopupMsg('Please fill all required fields: Approved By.', 'warning');
      return;
    }
    cooldown.trigger('approve');
    try {
      setLoading(true); setError(null); setStatusMessage({ type: '', text: '' });
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await approveLabWorkItem({ workId: workItem.workId, clinicId, branchId, testApprovedBy: approvalData.testApprovedBy, approvalRemarks: approvalData.approvalRemarks });
      // Pass orderId and success message to parent — parent shows the popup once
      setTimeout(() => { setShowApprovalModal(false); onClose && onClose(orderData.orderId, 'Work item approved successfully!', 'success'); }, 1000);
    } catch (err) {
      setError(err);
      showPopupMsg(err.message || 'Failed to approve work item', 'error');
    } finally { setLoading(false); }
  };

  const handleReject = async () => {
    if (!isRejectionFormValid) {
      showPopupMsg('Please fill all required fields: Rejected By and Rejection Reason.', 'warning');
      return;
    }
    cooldown.trigger('reject');
    try {
      setLoading(true); setError(null); setStatusMessage({ type: '', text: '' });
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await rejectLabWorkItem({ WorkID: workItem.workId, clinicId, branchID: branchId, TestApprovedBy: rejectionData.testApprovedBy, RejectReason: rejectionData.rejectReason });
      // Pass orderId and success message to parent — parent shows the popup once
      setTimeout(() => { setShowRejectionModal(false); onClose && onClose(orderData.orderId, 'Work item rejected successfully!', 'success'); }, 1000);
    } catch (err) {
      setError(err);
      showPopupMsg(err.message || 'Failed to reject work item', 'error');
    } finally { setLoading(false); }
  };

  const getStepStatus = (step) => {
    if (step < activeStep)   return 'completed';
    if (step === activeStep) return 'active';
    return 'pending';
  };

  return (
    <div className={styles.detailModalOverlay} >
      <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>
        <ErrorHandler error={error} />
        
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}><h2>Process Lab Work Item</h2></div>
          <div className={styles.clinicNameone}>
            <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
            {localStorage.getItem('clinicName') || '—'}
          </div>
          <button onClick={() => onClose(orderData.orderId)} className={styles.detailCloseBtn}><FiX size={24} /></button>
        </div>

        {/* Inner status message (inline, not popup) kept for step-level feedback */}
        {statusMessage.text && (
          <div className={`${styles.statusMessage} ${styles[statusMessage.type]}`}>{statusMessage.text}</div>
        )}

        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoHeader}><FiUser size={18} /><h3>Patient Information</h3></div>
            <div className={styles.infoContent}>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Name:</span>   <span className={styles.infoValue}>{orderData.patientName}</span></div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>File No:</span><span className={styles.infoValue}>{orderData.fileNo}</span></div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Mobile:</span> <span className={styles.infoValue}>{orderData.mobile}</span></div>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div className={styles.infoHeader}><FiActivity size={18} /><h3>Test Information</h3></div>
            <div className={styles.infoContent}>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Test Name:</span><span className={styles.infoValue}>{workItem.testName}</span></div>
              <div className={styles.infoRow}><span className={styles.infoLabel}>Doctor:</span>   <span className={styles.infoValue}>{orderData.doctorName || 'N/A'}</span></div>
            </div>
          </div>
        </div>

        <div className={styles.stepsContainer}>
          <div className={`${styles.step} ${styles[getStepStatus(1)]}`}>
            <div className={styles.stepIcon}>{getStepStatus(1) === 'completed' ? <FiCheckCircle size={20} /> : <FiClock size={20} />}</div>
            <div className={styles.stepContent}><div className={styles.stepTitle}>Sample Collection</div><div className={styles.stepDesc}>Record collection details</div></div>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${styles[getStepStatus(2)]}`}>
            <div className={styles.stepIcon}>{getStepStatus(2) === 'completed' ? <FiCheckCircle size={20} /> : <FiFileText size={20} />}</div>
            <div className={styles.stepContent}><div className={styles.stepTitle}>Enter Results</div><div className={styles.stepDesc}>Record test results</div></div>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={`${styles.step} ${styles[getStepStatus(3)]}`}>
            <div className={styles.stepIcon}><FiCheckCircle size={20} /></div>
            <div className={styles.stepContent}><div className={styles.stepTitle}>Approval</div><div className={styles.stepDesc}>Review and approve</div></div>
          </div>
        </div>

        <div className={styles.detailModalBody}>

          {/* ── Step 1: Sample Collection ── */}
          {activeStep === 1 && (
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}><FiClock size={20} /><h3>Sample Collection Details</h3></div>
              <div className={styles.detailFormGrid}>
                <div className={styles.detailFormGroup}>
                  <label>Collection Date & Time <span className={styles.required}>*</span></label>
                  <input
                    type="datetime-local"
                    value={sampleData.sampleCollectedTime}
                    onChange={(e) => {
                      setSampleData({ ...sampleData, sampleCollectedTime: e.target.value });
                      if (e.target.value) setValidationMessages(prev => ({ ...prev, sampleCollectedTime: '' }));
                    }}
                    className={styles.detailFormInput}
                    required
                  />
                  {validationMessages.sampleCollectedTime && (
                    <span className={styles.validationMsg}>{validationMessages.sampleCollectedTime}</span>
                  )}
                </div>
                <div className={styles.detailFormGroup}>
                  <label>Collection Place</label>
                  <input
                    type="text"
                    value={sampleData.sampleCollectedPlace}
                    onChange={(e) => setSampleData({ ...sampleData, sampleCollectedPlace: e.target.value })}
                    className={styles.detailFormInput}
                    placeholder="e.g., Lab Room 1, Patient Room"
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button
                  onClick={handleSampleSave}
                  className={styles.saveBtn}
                  disabled={loading || !isSampleFormValid || cooldown.isDisabled('sampleSave')}
                  title={!isSampleFormValid ? 'Please fill all required fields' : ''}
                >
                  <FiSave size={18} />{loading ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Enter Results ── */}
          {activeStep === 2 && (
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <FiFileText size={20} /><h3>Test Results Entry</h3>
                <div className={styles.masterDataBadges}>
                  <span className={styles.masterDataBadge}>
                    <span className={styles.masterDataBadgeLabel}>Units:</span>
                    <span className={styles.masterDataBadgeValue}>{testMasterData.loading ? '...' : testMasterData.resultUnits || '—'}</span>
                  </span>
                  <span className={styles.masterDataBadge}>
                    <span className={styles.masterDataBadgeLabel}>Normal Range:</span>
                    <span className={styles.masterDataBadgeValue}>{testMasterData.loading ? '...' : testMasterData.normalRange || '—'}</span>
                  </span>
                </div>
              </div>
              <div className={styles.detailFormGrid}>
                <div className={styles.detailFormGroup}>
                  <label>Result Value <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    value={resultData.resultValue}
                    onChange={(e) => {
                      setResultData({ ...resultData, resultValue: e.target.value });
                      if (e.target.value.trim()) setValidationMessages(prev => ({ ...prev, resultValue: '' }));
                    }}
                    className={styles.detailFormInput}
                    placeholder="e.g., 120"
                    required
                  />
                  {validationMessages.resultValue && (
                    <span className={styles.validationMsg}>{validationMessages.resultValue}</span>
                  )}
                </div>
                <div className={styles.detailFormGroup}>
                  <label>Interpretation</label>
                  <select
                    value={resultData.interpretation || ''}
                    onChange={(e) => setResultData({ ...resultData, interpretation: e.target.value ? Number(e.target.value) : null })}
                    className={styles.detailFormInput}
                  >
                    {interpretationOptions.map(opt => <option key={opt.value} value={opt.value || ''}>{opt.label}</option>)}
                  </select>
                </div>
                <div className={styles.detailFormGroup}>
                  <label>Test Done By <span className={styles.required}>*</span></label>
                  <select
                    required
                    value={resultData.testDoneBy}
                    onChange={(e) => setResultData({ ...resultData, testDoneBy: Number(e.target.value) })}
                    className={styles.detailFormInput}
                  >
                    <option value={0}>Select Technician</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>)}
                  </select>
                </div>
                <div className={styles.detailFormGroupFull}>
                  <label>Remarks</label>
                  <textarea
                    value={resultData.remarks}
                    onChange={(e) => setResultData({ ...resultData, remarks: e.target.value })}
                    className={styles.detailFormTextarea}
                    rows={3}
                    placeholder="Any additional notes or observations..."
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button onClick={() => setActiveStep(1)} className={styles.backBtn}>← Back</button>
                <button
                  onClick={handleResultSave}
                  className={styles.saveBtn}
                  disabled={loading || !isResultFormValid || cooldown.isDisabled('resultSave')}
                  title={!isResultFormValid ? 'Please fill all required fields' : ''}
                >
                  <FiSave size={18} />{loading ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Approval ── */}
          {activeStep === 3 && (
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}><FiCheckCircle size={20} /><h3>Review & Approval</h3></div>
              <div className={styles.reviewSection}>
                <div className={styles.reviewCard}>
                  <h4>Sample Collection</h4>
                  <div className={styles.reviewRow}><span>Date & Time:</span><strong>{workItem.sampleCollectedTime ? new Date(workItem.sampleCollectedTime).toLocaleString() : sampleData.sampleCollectedTime ? new Date(sampleData.sampleCollectedTime).toLocaleString() : 'Not recorded'}</strong></div>
                  <div className={styles.reviewRow}><span>Place:</span><strong>{workItem.sampleCollectedPlace || sampleData.sampleCollectedPlace || 'Not specified'}</strong></div>
                </div>
                <div className={styles.reviewCard}>
                  <h4>Test Results</h4>
                  <div className={styles.reviewRow}><span>Value:</span><strong>{workItem.resultValue || resultData.resultValue || 'Not entered'} {testMasterData.resultUnits || workItem.resultUnits || ''}</strong></div>
                  <div className={styles.reviewRow}><span>Normal Range:</span><strong>{testMasterData.normalRange || workItem.normalRange || 'Not specified'}</strong></div>
                  <div className={styles.reviewRow}><span>Interpretation:</span><strong>{interpretationOptions.find(opt => opt.value === (workItem.interpretation || resultData.interpretation))?.label || 'Not specified'}</strong></div>
                </div>
              </div>
              <div className={styles.formActions}>
                <button onClick={() => setActiveStep(2)} className={styles.backBtn}>← Back</button>
                <button
                  onClick={() => { cooldown.trigger('openReject'); setShowRejectionModal(true); }}
                  disabled={cooldown.isDisabled('openReject')}
                  className={styles.rejectBtn}
                >
                  <FiXCircle size={18} />Reject
                </button>
                <button
                  onClick={() => { cooldown.trigger('openApprove'); setShowApprovalModal(true); }}
                  disabled={cooldown.isDisabled('openApprove')}
                  className={styles.approveBtn}
                >
                  <FiCheckCircle size={18} />Approve
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Approval Modal ── */}
        {showApprovalModal && (
          <div className={styles.confirmOverlay} onClick={() => !loading && setShowApprovalModal(false)}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmModalHeader}>
                <h3>Approve Work Item</h3>
                <button onClick={() => !loading && setShowApprovalModal(false)} className={styles.confirmCloseBtn} disabled={loading}><FiX size={20} /></button>
              </div>
              <div className={styles.confirmModalBody}>
                {statusMessage.text && <div className={`${styles.statusMessage} ${styles[statusMessage.type]}`}>{statusMessage.text}</div>}
                <div className={styles.detailFormGroup}>
                  <label>Approved By <span className={styles.required}>*</span></label>
                  <select
                    value={approvalData.testApprovedBy}
                    onChange={(e) => setApprovalData({ ...approvalData, testApprovedBy: Number(e.target.value) })}
                    className={styles.detailFormInput}
                    required
                    disabled={loading}
                  >
                    <option value={0}>Select Doctor</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>)}
                  </select>
                </div>
                <div className={styles.detailFormGroup}>
                  <label>Approval Remarks</label>
                  <textarea
                    value={approvalData.approvalRemarks}
                    onChange={(e) => setApprovalData({ ...approvalData, approvalRemarks: e.target.value })}
                    className={styles.detailFormTextarea}
                    rows={3}
                    placeholder="Optional remarks..."
                    disabled={loading}
                  />
                </div>
              </div>
              <div className={styles.confirmModalFooter}>
                <button onClick={() => !loading && setShowApprovalModal(false)} className={styles.cancelBtn} disabled={loading}>Cancel</button>
                <button
                  onClick={handleApprove}
                  className={styles.confirmApproveBtn}
                  disabled={loading || !isApprovalFormValid || cooldown.isDisabled('approve')}
                  title={!isApprovalFormValid ? 'Please select an approver' : ''}
                >
                  <FiCheckCircle size={18} />{loading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Rejection Modal ── */}
        {showRejectionModal && (
          <div className={styles.confirmOverlay} onClick={() => !loading && setShowRejectionModal(false)}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmModalHeader}>
                <h3>Reject Work Item</h3>
                <button onClick={() => !loading && setShowRejectionModal(false)} className={styles.confirmCloseBtn} disabled={loading}><FiX size={20} /></button>
              </div>
              <div className={styles.confirmModalBody}>
                {statusMessage.text && <div className={`${styles.statusMessage} ${styles[statusMessage.type]}`}>{statusMessage.text}</div>}
                <div className={styles.detailFormGroup}>
                  <label>Rejected By <span className={styles.required}>*</span></label>
                  <select
                    value={rejectionData.testApprovedBy}
                    onChange={(e) => setRejectionData({ ...rejectionData, testApprovedBy: Number(e.target.value) })}
                    className={styles.detailFormInput}
                    required
                    disabled={loading}
                  >
                    <option value={0}>Select Doctor</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>)}
                  </select>
                </div>
                <div className={styles.detailFormGroup}>
                  <label>Rejection Reason <span className={styles.required}>*</span></label>
                  <textarea
                    value={rejectionData.rejectReason}
                    onChange={(e) => setRejectionData({ ...rejectionData, rejectReason: e.target.value })}
                    className={styles.detailFormTextarea}
                    rows={4}
                    placeholder="Please provide a detailed reason for rejection..."
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className={styles.confirmModalFooter}>
                <button onClick={() => !loading && setShowRejectionModal(false)} className={styles.cancelBtn} disabled={loading}>Cancel</button>
                <button
                  onClick={handleReject}
                  className={styles.confirmRejectBtn}
                  disabled={loading || !isRejectionFormValid || cooldown.isDisabled('reject')}
                  title={!isRejectionFormValid ? 'Please fill all required fields' : ''}
                >
                  <FiXCircle size={18} />{loading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabWorkQueue;