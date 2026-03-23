// src/components/LabWork/LabOrderList.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiCalendar, FiFilter, FiEye, FiCheckCircle, FiClock, FiAlertCircle, FiFileText, FiEdit, FiPrinter } from 'react-icons/fi';
import { 
  getLabTestOrderList, 
  updateLabTestOrder, 
  createWorkItemsForOrder,
  generateLabInvoice,
  addLabTestReport,
  getLabTestReportList,
  updateLabTestReport,
  getLabTestOrderItemList
} from '../Api/ApiLabTests.js';
import { getEmployeeList } from '../Api/Api.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import LabOrderPrintModal from './LabOrderPrintModal.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './LabOrderList.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from '../Hooks/LoadingPage.jsx';

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
const LabOrderList = () => {
  const navigate = useNavigate();
  const cooldown = useButtonCooldown();

  // MessagePopup state
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopupMsg = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // Data States
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [orderReports, setOrderReports] = useState({});

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // Filter inputs (not applied until search)
  const [filterInputs, setFilterInputs] = useState({
    searchType: 'patientName',
    searchValue: '',
    status: -1,
    priority: 0,
    dateFrom: '',
    dateTo: ''
  });

  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    searchType: 'patientName',
    searchValue: '',
    status: -1,
    priority: 0,
    dateFrom: '',
    dateTo: ''
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal States
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isUpdateOrderOpen, setIsUpdateOrderOpen] = useState(false);
  const [isConfirmWorkOpen, setIsConfirmWorkOpen] = useState(false);
  const [isMakeInvoiceOpen, setIsMakeInvoiceOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);

  // Print Modal States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const [printOrderItems, setPrintOrderItems] = useState([]);
  const [loadingPrintItems, setLoadingPrintItems] = useState(false);

  // Report Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedOrderForReport, setSelectedOrderForReport] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportMessage, setReportMessage] = useState({ type: '', text: '' });
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [currentReportId, setCurrentReportId] = useState(null);
  
  // Report Form States
  const [reportForm, setReportForm] = useState({
    verifiedBy: 0,
    verifiedDateTime: '',
    remarks: '',
    fileId: 0,
    status: 1
  });

  // Status options for Lab Test Orders
  const statusOptions = [
    { id: -1, label: 'All Statuses', color: 'default' },
    { id: 1, label: 'Pending', color: 'warning' },
    { id: 2, label: 'Completed', color: 'success' },
    { id: 3, label: 'Cancelled', color: 'danger' },
    { id: 4, label: 'Invoice Processed', color: 'info' },
    { id: 5, label: 'Work in Progress', color: 'progress' },
    { id: 6, label: 'External', color: 'external' }
  ];

  // Status options for Lab Test Reports
  const reportStatusOptions = [
    { id: -1, label: 'No Change', color: 'default' },
    { id: 1, label: 'Created', color: 'info' },
    { id: 2, label: 'Cancelled', color: 'danger' },
    { id: 3, label: 'Verified', color: 'success' }
  ];

  // Priority options
  const priorityOptions = [
    { id: 0, label: 'All Priorities' },
    { id: 1, label: 'Normal' },
    { id: 2, label: 'Urgent' },
    { id: 3, label: 'STAT' }
  ];

  // Are any filters active?
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.status !== -1 ||
    appliedFilters.priority !== 0 ||
    appliedFilters.dateFrom !== '' ||
    appliedFilters.dateTo !== '';

  // Fetch Doctors List
  const fetchDoctors = async () => {
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Designation: 1,
        Status: 1
      };
      const employeeList = await getEmployeeList(clinicId, options);
      setDoctors(employeeList);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  // Fetch Lab Test Reports
  const fetchLabTestReports = async () => {
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const options = { Page: 1, PageSize: 100, BranchID: branchId };
      const reports = await getLabTestReportList(clinicId, options);
      const reportsMap = {};
      reports.forEach(report => {
        if (report.orderId) reportsMap[report.orderId] = report.id;
      });
      setOrderReports(reportsMap);
    } catch (err) {
      console.error('Failed to fetch lab test reports:', err);
    }
  };

  // Fetch Lab Test Orders
  const fetchOrders = async (currentPage = page) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const options = { Page: currentPage, PageSize: pageSize, BranchID: branchId };
      const data = await getLabTestOrderList(clinicId, options);
      const sortedData = data.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
      setOrders(sortedData);
      setAllOrders(sortedData);
      await fetchLabTestReports();
    } catch (err) {
      console.error('fetchOrders error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load lab test orders' }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
    fetchDoctors();
  }, []);

  // Computed filtered orders
  const filteredOrders = useMemo(() => {
    let filtered = allOrders;
    if (appliedFilters.searchValue) {
      const term = appliedFilters.searchValue.toLowerCase();
      switch (appliedFilters.searchType) {
        case 'patientName':
          filtered = filtered.filter(o => o.patientName?.toLowerCase().includes(term));
          break;
        case 'doctorName':
          filtered = filtered.filter(o => o.doctorFullName?.toLowerCase().includes(term));
          break;
        case 'testName':
          filtered = filtered.filter(o => o.notes?.toLowerCase().includes(term));
          break;
        default:
          break;
      }
    }
    if (appliedFilters.status !== -1) {
      filtered = filtered.filter(o => o.status === Number(appliedFilters.status));
    }
    if (appliedFilters.priority !== 0) {
      filtered = filtered.filter(o => o.priority === Number(appliedFilters.priority));
    }
    if (appliedFilters.dateFrom) {
      const fromDate = new Date(appliedFilters.dateFrom);
      filtered = filtered.filter(o => o.dateCreated && new Date(o.dateCreated) >= fromDate);
    }
    if (appliedFilters.dateTo) {
      const toDate = new Date(appliedFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => o.dateCreated && new Date(o.dateCreated) <= toDate);
    }
    return filtered;
  }, [allOrders, appliedFilters]);

  // Pagination helpers
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    fetchOrders(newPage);
  };

  const startRecord = filteredOrders.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = (page - 1) * pageSize + filteredOrders.length;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      searchType: 'patientName', searchValue: '',
      status: -1, priority: 0, dateFrom: '', dateTo: ''
    };
    setPage(1);
    setFilterInputs(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handleViewOrderDetails = async (order) => {
    setSelectedOrder(order);
    setSelectedOrderItems([]);
    setIsOrderDetailsOpen(true);
    try {
      setLoadingOrderItems(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const items = await getLabTestOrderItemList(clinicId, { OrderID: order.id, BranchID: branchId, Page: 1, PageSize: 100 });
      setSelectedOrderItems(items);
    } catch (err) {
      console.error('Failed to fetch order items:', err);
      setSelectedOrderItems([]);
    } finally {
      setLoadingOrderItems(false);
    }
  };

  const handlePrintClick = async (order) => {
    setPrintOrder(order);
    setPrintOrderItems([]);
    setIsPrintModalOpen(true);
    try {
      setLoadingPrintItems(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const items = await getLabTestOrderItemList(clinicId, { OrderID: order.id, BranchID: branchId, Page: 1, PageSize: 100 });
      setPrintOrderItems(items);
    } catch (err) {
      console.error('Failed to fetch print order items:', err);
      setPrintOrderItems([]);
    } finally {
      setLoadingPrintItems(false);
    }
  };

  const handleUpdateOrder      = (order) => { setSelectedOrder(order); setIsUpdateOrderOpen(true); };
  const handleMakeWorkClick    = (order) => { setSelectedOrder(order); setIsConfirmWorkOpen(true); };
  const handleMakeInvoiceClick = (order) => { setSelectedOrder(order); setIsMakeInvoiceOpen(true); };

  const handleConfirmMakeWork = async () => {
    if (!selectedOrder) return;
    cooldown.trigger('makeWork');
    try {
      setLoading(true);
      const clinicId = await getStoredClinicId();
      await createWorkItemsForOrder(selectedOrder.id, clinicId);
      setIsConfirmWorkOpen(false);
      setSelectedOrder(null);
      await fetchOrders(page);
      showPopupMsg('Work items created successfully! Navigate to Work Queue to process them.', 'success');
    } catch (err) {
      console.error('Error creating work items:', err);
      showPopupMsg(err.message || 'Failed to create work items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (invoiceData) => {
    cooldown.trigger('generateInvoice');
    try {
      setLoading(true);
      await generateLabInvoice(invoiceData);
      setIsMakeInvoiceOpen(false);
      setSelectedOrder(null);
      await fetchOrders(page);
      showPopupMsg('Invoice generated successfully!', 'success');
    } catch (err) {
      console.error('Error generating invoice:', err);
      showPopupMsg(err.message || 'Failed to generate invoice', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderSubmit = async (orderData) => {
    cooldown.trigger('updateOrder');
    try {
      setLoading(true);
      await updateLabTestOrder(orderData);
      setIsUpdateOrderOpen(false);
      setSelectedOrder(null);
      await fetchOrders(page);
      showPopupMsg('Order updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating order:', err);
      showPopupMsg(err.message || 'Failed to update order', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReportClick = async (order) => {
    try {
      setSubmittingReport(true);
      setIsUpdateMode(false);
      setCurrentReportId(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const orderList = await getLabTestOrderList(clinicId, { OrderID: order.id, BranchID: branchId, Page: 1, PageSize: 1 });
      if (!orderList || orderList.length === 0) throw new Error('Order details not found');
      setOrderDetails(orderList[0]);
      setSelectedOrderForReport(order);
      const now = new Date();
      setReportForm({ verifiedBy: 0, verifiedDateTime: now.toISOString().slice(0, 16), remarks: '', status: 1 });
      setShowReportModal(true);
    } catch (err) {
      console.error('Error processing add report:', err);
      setError(err);
      showPopupMsg(err.message || 'Failed to process report request', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleUpdateReportClick = async (order) => {
    try {
      setSubmittingReport(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const reports = await getLabTestReportList(clinicId, { OrderID: order.id, BranchID: branchId, Page: 1, PageSize: 1 });
      if (!reports || reports.length === 0) throw new Error('Report not found for this order');
      const existingReport = reports[0];
      const orderList = await getLabTestOrderList(clinicId, { OrderID: order.id, BranchID: branchId, Page: 1, PageSize: 1 });
      if (!orderList || orderList.length === 0) throw new Error('Order details not found');
      setOrderDetails(orderList[0]);
      setIsUpdateMode(true);
      setCurrentReportId(existingReport.id);
      setSelectedOrderForReport(order);
      const formattedDateTime = existingReport.verifiedDateTime
        ? new Date(existingReport.verifiedDateTime).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16);
      setReportForm({
        verifiedBy: existingReport.verifiedBy || 0,
        verifiedDateTime: formattedDateTime,
        remarks: existingReport.remarks || '',
        fileId: existingReport.fileId|| 0,
        status: existingReport.status ?? 1
      });
      setShowReportModal(true);
    } catch (err) {
      console.error('Error loading report for update:', err);
      setError(err);
      showPopupMsg(err.message || 'Failed to load report details', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  // ── Report form validation: required fields filled? ──
  const isReportFormValid = reportForm.verifiedBy !== 0 && reportForm.verifiedDateTime !== '';

  const handleSubmitReport = async (e) => {
    e.preventDefault();

    // Guard: show message if required fields missing
    if (!isReportFormValid) {
      showPopupMsg('Please fill all required fields: Verified By and Verified Date & Time.', 'warning');
      return;
    }

    cooldown.trigger('submitReport');
    try {
      setSubmittingReport(true);
      setReportMessage({ type: '', text: '' });

      const resetForm = () => {
        setShowReportModal(false);
        setSelectedOrderForReport(null);
        setOrderDetails(null);
        setIsUpdateMode(false);
        setCurrentReportId(null);
        setReportForm({ verifiedBy: 0, verifiedDateTime: '', remarks: '', status: 1 });
        setReportMessage({ type: '', text: '' });
        fetchOrders(page);
      };

      if (isUpdateMode) {
        const result = await updateLabTestReport({
          reportId: currentReportId,
          clinicId: orderDetails.clinicId,
          branchId: orderDetails.branchId,
          fileId: reportForm.fileId || 0,
          verifiedBy: reportForm.verifiedBy,
          verifiedDateTime: reportForm.verifiedDateTime,
          remarks: reportForm.remarks,
          status: reportForm.status
        });
        if (result.success) {
          showPopupMsg('Lab test report updated successfully!', 'success');
          setTimeout(resetForm, 1500);
        }
      } else {
        const result = await addLabTestReport({
          orderId: orderDetails.id,
          consultationId: orderDetails.consultationId,
          visitId: orderDetails.visitId,
          patientId: orderDetails.patientId,
          doctorId: orderDetails.doctorId,
          clinicId: orderDetails.clinicId,
          branchId: orderDetails.branchId,
          fileId: orderDetails.fileId || 0,
          verifiedBy: reportForm.verifiedBy,
          verifiedDateTime: reportForm.verifiedDateTime,
          remarks: reportForm.remarks
        });
        if (result.success) {
          showPopupMsg('Lab test report added successfully!', 'success');
          setTimeout(resetForm, 1500);
        }
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      showPopupMsg(err.message || `Failed to ${isUpdateMode ? 'update' : 'add'} lab test report`, 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setSelectedOrderForReport(null);
    setOrderDetails(null);
    setIsUpdateMode(false);
    setCurrentReportId(null);
    setReportMessage({ type: '', text: '' });
    setReportForm({ verifiedBy: 0, verifiedDateTime: '', remarks: '', status: 1 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadgeClass = (status) => {
    const statusObj = statusOptions.find(s => s.id === status);
    return styles[`status${statusObj?.color || 'default'}`] || styles.statusDefault;
  };

  const getPriorityBadgeClass = (priority) => {
    switch(priority) {
      case 1: return styles.priorityNormal;
      case 2: return styles.priorityUrgent;
      case 3: return styles.priorityStat;
      default: return styles.priorityNormal;
    }
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading && !isOrderDetailsOpen && !isUpdateOrderOpen) {
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
      <Header title="Lab Order Management" />

      {/* MessagePopup — replaces old showPopup */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      {/* Filters Container */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchGroup}>
            <select name="searchType" value={filterInputs.searchType} onChange={handleFilterChange} className={styles.searchTypeSelect}>
              <option value="patientName">Patient Name</option>
              <option value="doctorName">Doctor Name</option>
              <option value="testName">Test/Notes</option>
            </select>
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${filterInputs.searchType === 'patientName' ? 'Patient Name' : filterInputs.searchType === 'doctorName' ? 'Doctor Name' : 'Test/Notes'}`}
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
            <select name="priority" value={filterInputs.priority} onChange={handleFilterChange} className={styles.filterInput}>
              {priorityOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
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
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={18} /> Search
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={18} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table + Pagination wrapper */}
      <div className={styles.tableSection}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Doctor</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Date Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.noData}>
                    {hasActiveFilters ? 'No orders found matching your search.' : 'No lab test orders found.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const hasReport = orderReports[order.id];
                  return (
                    <tr key={order.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.nameCell}>
                          <div className={styles.avatar}>{order.patientName?.charAt(0).toUpperCase() || 'P'}</div>
                          <div>
                            <div className={styles.name}>{order.patientName}</div>
                            <div className={styles.subText}>{order.patientFileNo} • {order.patientMobile}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.name}>{order.doctorFullName}</div>
                        <div className={styles.subText}>{order.doctorCode || '—'}</div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>{order.statusDesc}</span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${getPriorityBadgeClass(order.priority)}`}>{order.priorityDesc}</span>
                      </td>
                      <td>
                        <div className={styles.dateCell}>
                          <div className={styles.name}>{formatDate(order.dateCreated)}</div>
                          <div className={styles.subText}>
                            {new Date(order.dateCreated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            onClick={() => { cooldown.trigger(`view_${order.id}`); handleViewOrderDetails(order); }}
                            disabled={cooldown.isDisabled(`view_${order.id}`)}
                            className={styles.viewBtn}
                            title="View Details"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => { cooldown.trigger(`print_${order.id}`); handlePrintClick(order); }}
                            disabled={cooldown.isDisabled(`print_${order.id}`)}
                            className={styles.printBtn}
                            title="Print Order"
                          >
                            <FiPrinter size={16} />
                          </button>
                          <div className={styles.actionDropdownWrapper}>
                            <button className={styles.actionBtn}>Actions</button>
                            <div className={styles.actionDropdown}>
                              <button
                                onClick={() => { cooldown.trigger(`makeWork_${order.id}`); handleMakeWorkClick(order); }}
                                disabled={
                                  cooldown.isDisabled(`makeWork_${order.id}`) ||
                                  order.status === 5 || order.status === 2 ||
                                  order.status === 3 || order.status === 6
                                }
                                className={styles.dropdownItem}
                              >
                                {order.status === 5 ? 'In Progress' : 'Make Work'}
                              </button>
                              {order.status === 2 && !hasReport && (
                                <button
                                  onClick={() => { cooldown.trigger(`addReport_${order.id}`); handleAddReportClick(order); }}
                                  disabled={cooldown.isDisabled(`addReport_${order.id}`)}
                                  className={styles.dropdownItem}
                                >
                                  <FiFileText size={14} /> Add Report
                                </button>
                              )}
                              {order.status === 2 && hasReport && (
                                <button
                                  onClick={() => { cooldown.trigger(`updReport_${order.id}`); handleUpdateReportClick(order); }}
                                  disabled={cooldown.isDisabled(`updReport_${order.id}`)}
                                  className={styles.dropdownItem}
                                >
                                  <FiEdit size={14} /> Update Report
                                </button>
                              )}
                              {(order.status === 1 || order.status === 5) && (
                                <button
                                  onClick={() => { cooldown.trigger(`invoice_${order.id}`); handleMakeInvoiceClick(order); }}
                                  disabled={cooldown.isDisabled(`invoice_${order.id}`)}
                                  className={styles.dropdownItem}
                                >
                                  <FiFileText size={14} /> Make Invoice
                                </button>
                              )}
                              {order.status === 4 && (
                                <button className={`${styles.dropdownItem} ${styles.invoicedItem}`} disabled>
                                  <FiCheckCircle size={14} /> Invoiced!
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {filteredOrders.length > 0
              ? `Showing ${startRecord}–${endRecord} records`
              : 'No records'}
          </div>

          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(1)} disabled={page === 1} title="First page">«</button>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page - 1)} disabled={page === 1} title="Previous page">‹</button>
            <span className={styles.pageIndicator}>{page}</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page + 1)} disabled={filteredOrders.length < pageSize} title="Next page">›</button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{pageSize}</strong>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isOrderDetailsOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          orderItems={selectedOrderItems}
          loadingOrderItems={loadingOrderItems}
          statusOptions={statusOptions}
          onClose={() => { setIsOrderDetailsOpen(false); setSelectedOrder(null); setSelectedOrderItems([]); }}
          onUpdate={() => { setIsOrderDetailsOpen(false); handleUpdateOrder(selectedOrder); }}
          cooldown={cooldown}
        />
      )}

      {isUpdateOrderOpen && selectedOrder && (
        <UpdateOrderModal
          order={selectedOrder}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions.filter(p => p.id !== 0)}
          onClose={() => { setIsUpdateOrderOpen(false); setSelectedOrder(null); }}
          onSubmit={handleUpdateOrderSubmit}
          cooldown={cooldown}
          showPopupMsg={showPopupMsg}
        />
      )}

      {isConfirmWorkOpen && selectedOrder && (
        <ConfirmMakeWorkModal
          order={selectedOrder}
          onClose={() => { setIsConfirmWorkOpen(false); setSelectedOrder(null); }}
          onConfirm={handleConfirmMakeWork}
          cooldown={cooldown}
        />
      )}

      {isMakeInvoiceOpen && selectedOrder && (
        <MakeInvoiceModal
          order={selectedOrder}
          onClose={() => { setIsMakeInvoiceOpen(false); setSelectedOrder(null); }}
          onSubmit={handleGenerateInvoice}
          cooldown={cooldown}
          showPopupMsg={showPopupMsg}
        />
      )}

      {/* Add/Update Report Modal */}
      {showReportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.reportModal}>
            <div className={styles.reportModalHeader}>
              <h3>{isUpdateMode ? 'Update Lab Test Report' : 'Add Lab Test Report'}</h3>
              <button onClick={handleCloseReportModal} className={styles.reportCloseBtn} disabled={submittingReport}>
                <FiX size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitReport} className={styles.reportForm}>
              <div className={styles.reportModalBody}>
                {reportMessage.text && (
                  <div className={`${styles.reportMessage} ${styles[reportMessage.type]}`}>{reportMessage.text}</div>
                )}
                <div className={styles.orderInfoSection}>
                  <h4>Order Information</h4>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Patient:</span>
                      <span className={styles.infoValue}>{orderDetails?.patientName}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Doctor:</span>
                      <span className={styles.infoValue}>{orderDetails?.doctorFullName}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.reportFormGroup}>
                  <label className={styles.reportFormLabel}>
                    Verified By <span className={styles.reportRequired}>*</span>
                  </label>
                  <select
                    value={reportForm.verifiedBy}
                    onChange={(e) => setReportForm({ ...reportForm, verifiedBy: Number(e.target.value) })}
                    className={styles.reportFormSelect}
                    required
                    disabled={submittingReport}
                  >
                    <option value={0}>Select Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>{doctor.name} ({doctor.employeeCode})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.reportFormGroup}>
                  <label className={styles.reportFormLabel}>
                    Verified Date & Time <span className={styles.reportRequired}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={reportForm.verifiedDateTime}
                    onChange={(e) => setReportForm({ ...reportForm, verifiedDateTime: e.target.value })}
                    className={styles.reportFormInput}
                    required
                    disabled={submittingReport}
                  />
                </div>
                {isUpdateMode && (
                  <div className={styles.reportFormGroup}>
                    <label className={styles.reportFormLabel}>Status</label>
                    <select
                      value={reportForm.status}
                      onChange={(e) => setReportForm({ ...reportForm, status: Number(e.target.value) })}
                      className={styles.reportFormSelect}
                      disabled={submittingReport}
                    >
                      {reportStatusOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                  </div>
                )}
                <div className={styles.reportFormGroup}>
                  <label className={styles.reportFormLabel}>Remarks</label>
                  <textarea
                    value={reportForm.remarks}
                    onChange={(e) => setReportForm({ ...reportForm, remarks: e.target.value })}
                    className={styles.reportFormTextarea}
                    rows={4}
                    placeholder="Enter any additional remarks..."
                    disabled={submittingReport}
                  />
                </div>
              </div>
              <div className={styles.reportModalFooter}>
                <button
                  type="button"
                  onClick={handleCloseReportModal}
                  className={styles.reportCancelBtn}
                  disabled={submittingReport}
                >
                  Cancel
                </button>
                {/* Submit button: disabled until required fields filled */}
                <button
                  type="submit"
                  className={styles.reportSubmitBtn}
                  disabled={submittingReport || !isReportFormValid || cooldown.isDisabled('submitReport')}
                  title={!isReportFormValid ? 'Please fill all required fields' : ''}
                >
                  {submittingReport
                    ? (isUpdateMode ? 'Updating...' : 'Submitting...')
                    : (isUpdateMode ? 'Update Report' : 'Submit Report')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPrintModalOpen && printOrder && (
        <LabOrderPrintModal
          order={printOrder}
          orderItems={loadingPrintItems ? [] : printOrderItems}
          onClose={() => { setIsPrintModalOpen(false); setPrintOrder(null); setPrintOrderItems([]); }}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const OrderDetailsModal = ({ order, orderItems, loadingOrderItems, statusOptions, onClose, onUpdate, cooldown }) => {
  return (
    <div className={styles.detailModalOverlay} onClick={onClose}>
      <div className={styles.detailModalContent} onClick={(e) => e.stopPropagation()}>

        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <div className={styles.detailHeaderTop}>
              <div className={styles.detailHeaderAvatar}>
                {order.patientName?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div>
                <h2 className={styles.detailHeaderTitle}>{order.patientName}</h2>
              </div>
            </div>
            <div className={styles.clinicNameone}>
              <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
              {localStorage.getItem('clinicName') || '—'}
            </div>
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        <div className={styles.detailModalBody}>
          <div className={styles.detailInfoSection}>

            {/* Card 1 — Patient Information */}
            <div className={styles.detailInfoCard}>
              <div className={styles.detailInfoHeader}><h3>Patient Information</h3></div>
              <div className={styles.detailInfoContent}>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Full Name</span>
                  <span className={styles.detailInfoValue}>{order.patientName || '—'}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>File No.</span>
                  <span className={styles.detailInfoValue}>{order.patientFileNo || '—'}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Mobile</span>
                  <span className={styles.detailInfoValue}>{order.patientMobile || '—'}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Consultation ID</span>
                  <span className={styles.detailInfoValue}>{order.consultationId || '—'}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Visit ID</span>
                  <span className={styles.detailInfoValue}>{order.visitId || '—'}</span>
                </div>
              </div>
            </div>

            {/* Card 2 — Order Information */}
            <div className={styles.detailInfoCard}>
              <div className={styles.detailInfoHeader}><h3>Order Information</h3></div>
              <div className={styles.detailInfoContent}>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Unique Seq.</span>
                  <span className={styles.detailInfoValue}>{order.uniqueSeq || '—'}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Status</span>
                  <span className={styles.detailInfoValue}>{order.statusDesc}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Priority</span>
                  <span className={styles.detailInfoValue}>{order.priorityDesc}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Date Created</span>
                  <span className={styles.detailInfoValue}>{new Date(order.dateCreated).toLocaleString()}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Last Modified</span>
                  <span className={styles.detailInfoValue}>{new Date(order.dateModified).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Card 3 — Clinical Details */}
            <div className={styles.detailInfoCard}>
              <div className={styles.detailInfoHeader}><h3>Clinical Details</h3></div>
              <div className={styles.detailInfoContent}>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Doctor</span>
                  <span className={styles.detailInfoValue}>{order.doctorFullName || '—'}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Doctor Code</span>
                  <span className={styles.detailInfoValue}>{order.doctorCode || '—'}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Clinic</span>
                  <span className={styles.detailInfoValue}>{order.clinicName || '—'}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Branch</span>
                  <span className={styles.detailInfoValue}>{order.branchName || '—'}</span>
                </div>
                <div className={styles.detailInfoRow}>
                  <span className={styles.detailInfoLabel}>Notes</span>
                  <span className={styles.detailInfoValue}>{order.notes || 'No notes'}</span>
                </div>
              </div>
            </div>

            {/* Card 4 — Order Items */}
            <div className={`${styles.detailInfoCard} ${styles.detailInfoCardFullWidth}`}>
              <div className={styles.detailInfoHeader}><h3>Order Items</h3></div>
              {loadingOrderItems ? (
                <div className={styles.orderItemsLoading}>
                  <div className={styles.orderItemsSpinner}></div>
                  <span>Loading items...</span>
                </div>
              ) : orderItems.length === 0 ? (
                <div className={styles.orderItemsEmpty}>No items found for this order.</div>
              ) : (
                <div className={styles.orderItemsTable}>
                  <table className={styles.itemsTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Test / Package Name</th>
                        <th>Fees</th>
                        <th>CGST</th>
                        <th>SGST</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, index) => (
                        <tr key={item.itemId} className={styles.itemsTableRow}>
                          <td className={styles.itemsTableIndex}>{index + 1}</td>
                          <td className={styles.itemsTableName}>{item.testOrPackageName}</td>
                          <td className={styles.itemsTableAmount}>₹{item.fees.toFixed(2)}</td>
                          <td className={styles.itemsTableAmount}>₹{item.cgst.toFixed(2)}</td>
                          <td className={styles.itemsTableAmount}>₹{item.sgst.toFixed(2)}</td>
                          <td className={styles.itemsTableTotal}>₹{item.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className={styles.itemsTableFooterRow}>
                        <td colSpan={5} className={styles.itemsTableFooterLabel}>Grand Total</td>
                        <td className={styles.itemsTableFooterTotal}>
                          ₹{orderItems.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className={styles.detailModalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>Close</button>
          <button
            onClick={() => { cooldown.trigger('detailUpdate'); onUpdate(); }}
            disabled={cooldown.isDisabled('detailUpdate')}
            className={styles.updateBtn}
          >
            <FiEdit size={16} style={{ marginRight: 6 }} />
            Update Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Update Order Modal ────────────────────────────────────────────────────────
const UpdateOrderModal = ({ order, statusOptions, priorityOptions, onClose, onSubmit, cooldown, showPopupMsg }) => {
  const [formData, setFormData] = useState({
    status: order.status,
    priority: order.priority,
    notes: order.notes || '',
    fileId: order.fileId || 0,
    testApprovedBy: order.doctorId
  });

  // Required: status and priority must be valid (non-zero for priority)
  const isFormValid = formData.status !== '' && formData.priority !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      showPopupMsg('Please fill all required fields: Status and Priority.', 'warning');
      return;
    }
    const clinicId = await getStoredClinicId();
    const branchId = await getStoredBranchId();
    onSubmit({
      orderId: order.id, clinicId, branchId,
      status: formData.status, priority: formData.priority,
      notes: formData.notes, fileId: formData.fileId,
      testApprovedBy: formData.testApprovedBy
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Update Order</h2>
          <div className={styles.headerRight}>
            <div className={styles.clinicNameone}>
              <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
              {localStorage.getItem('clinicName') || '—'}
            </div>
            <button onClick={onClose} className={styles.closeBtn}>×</button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Status <span className={styles.required}>*</span></label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                  className={styles.formInput}
                  required
                >
                  {statusOptions.filter(s => s.id !== -1).map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Priority <span className={styles.required}>*</span></label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  className={styles.formInput}
                  required
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroupFull}>
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={styles.formTextarea}
                  rows={4}
                  placeholder="Enter any notes..."
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
            <button
              type="submit"
              className={styles.updateBtn}
              disabled={!isFormValid || cooldown.isDisabled('updateOrder')}
              title={!isFormValid ? 'Please fill all required fields' : ''}
            >
              Update Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Confirm Make Work Modal ───────────────────────────────────────────────────
const ConfirmMakeWorkModal = ({ order, onClose, onConfirm, cooldown }) => (
  <div className={styles.modalOverlay} onClick={onClose}>
    <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.modalHeader}>
        <h2>Confirm Create Work Items</h2>
        <button onClick={onClose} className={styles.closeBtn}>×</button>
      </div>
      <div className={styles.modalBody}>
        <div className={styles.confirmIcon}><FiAlertCircle size={48} /></div>
        <p className={styles.confirmText}>Are you sure you want to create work items for this order?</p>
        <div className={styles.confirmDetails}>
          <div className={styles.confirmDetailRow}>
            <span className={styles.confirmLabel}>Patient:</span>
            <span className={styles.confirmValue}>{order.patientName}</span>
          </div>
          <div className={styles.confirmDetailRow}>
            <span className={styles.confirmLabel}>Doctor:</span>
            <span className={styles.confirmValue}>{order.doctorFullName}</span>
          </div>
        </div>
      </div>
      <div className={styles.modalFooter}>
        <button
          onClick={() => { cooldown.trigger('makeWork'); onConfirm(); }}
          disabled={cooldown.isDisabled('makeWork')}
          className={styles.confirmBtn}
        >
          <FiCheckCircle size={18} /> Yes, Create Work Items
        </button>
        <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
      </div>
    </div>
  </div>
);

// ─── Make Invoice Modal ────────────────────────────────────────────────────────
const MakeInvoiceModal = ({ order, onClose, onSubmit, cooldown, showPopupMsg }) => {
  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  const [formData, setFormData] = useState({ invoiceDate: getTodayDate(), discount: 0 });

  // Required: invoiceDate must be filled
  const isFormValid = formData.invoiceDate !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) {
      showPopupMsg('Please fill all required fields: Invoice Date.', 'warning');
      return;
    }
    const clinicId = await getStoredClinicId();
    const branchId = await getStoredBranchId();
    onSubmit({ orderId: order.id, clinicId, branchId, invoiceDate: formData.invoiceDate, discount: Number(formData.discount) });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Generate Invoice</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.confirmIcon}><FiFileText size={48} /></div>
            <div className={styles.confirmDetails}>
              <div className={styles.confirmDetailRow}>
                <span className={styles.confirmLabel}>Patient:</span>
                <span className={styles.confirmValue}>{order.patientName}</span>
              </div>
              <div className={styles.confirmDetailRow}>
                <span className={styles.confirmLabel}>Doctor:</span>
                <span className={styles.confirmValue}>{order.doctorFullName}</span>
              </div>
              <div className={styles.confirmDetailRow}>
                <span className={styles.confirmLabel}>ClinicName:</span>
                <span className={styles.confirmValue}>{localStorage.getItem('clinicName') || '—'}</span>
              </div>
            </div>
            <div className={styles.invoiceFormGrid}>
              <div className={styles.formGroup}>
                <label>Invoice Date <span className={styles.required}>*</span></label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Discount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className={styles.formInput}
                  placeholder="Enter discount amount"
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
            <button
              type="submit"
              className={styles.confirmBtn}
              disabled={!isFormValid || cooldown.isDisabled('generateInvoice')}
              title={!isFormValid ? 'Please fill all required fields' : ''}
            >
              <FiFileText size={18} /> Generate Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabOrderList;