// src/components/LabWork/LabOrderList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX, FiCalendar, FiFilter, FiEye, FiCheckCircle, FiClock, FiAlertCircle, FiFileText, FiEdit } from 'react-icons/fi';
import { 
  getLabTestOrderList, 
  updateLabTestOrder, 
  createWorkItemsForOrder,
  generateLabInvoice,
  addLabTestReport,
  getLabTestReportList,
  updateLabTestReport
} from '../api/api-labtest.js';
import { getEmployeeList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './LabOrderList.module.css';

const LabOrderList = () => {
  const navigate = useNavigate();
  
  // Data States
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [orderReports, setOrderReports] = useState({}); // Map of orderId -> reportId
  
  // Filter inputs (not applied until search)
  const [filterInputs, setFilterInputs] = useState({
    searchType: 'patientName', // patientName, doctorName, testName
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
    status: 1 // Default to "Created" status
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

  // ── Derived: are any filters active? ──
  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== '' ||
    appliedFilters.status !== -1 ||
    appliedFilters.priority !== 0 ||
    appliedFilters.dateFrom !== '' ||
    appliedFilters.dateTo !== '';

  // Fetch Doctors List
  const fetchDoctors = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
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

  // Fetch Lab Test Reports to check if orders have reports
  const fetchLabTestReports = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const options = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId
      };
      
      const reports = await getLabTestReportList(clinicId, options);
      
      // Create a map of orderId -> reportId
      const reportsMap = {};
      reports.forEach(report => {
        if (report.orderId) {
          reportsMap[report.orderId] = report.id;
        }
      });
      
      setOrderReports(reportsMap);
    } catch (err) {
      console.error('Failed to fetch lab test reports:', err);
    }
  };

  // Fetch Lab Test Orders
  const fetchOrders = async () => {
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

      const data = await getLabTestOrderList(clinicId, options);

      const sortedData = data.sort((a, b) => {
        const dateA = new Date(a.dateCreated);
        const dateB = new Date(b.dateCreated);
        return dateB - dateA;
      });

      setOrders(sortedData);
      setAllOrders(sortedData);
      
      // Fetch reports after orders are loaded
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
    fetchOrders();
    fetchDoctors();
  }, []);

  // Computed filtered orders based on applied filters
  const filteredOrders = useMemo(() => {
    let filtered = allOrders;

    // Apply search filter based on search type
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
          // Note: testName is not in the current order object, but keeping for API compatibility
          filtered = filtered.filter(o => o.notes?.toLowerCase().includes(term));
          break;
        default:
          break;
      }
    }

    // Status filter
    if (appliedFilters.status !== -1) {
      filtered = filtered.filter(o => o.status === Number(appliedFilters.status));
    }

    // Priority filter
    if (appliedFilters.priority !== 0) {
      filtered = filtered.filter(o => o.priority === Number(appliedFilters.priority));
    }

    // Date from filter
    if (appliedFilters.dateFrom) {
      const fromDate = new Date(appliedFilters.dateFrom);
      filtered = filtered.filter(o => {
        if (!o.dateCreated) return false;
        const orderDate = new Date(o.dateCreated);
        return orderDate >= fromDate;
      });
    }

    // Date to filter
    if (appliedFilters.dateTo) {
      const toDate = new Date(appliedFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => {
        if (!o.dateCreated) return false;
        const orderDate = new Date(o.dateCreated);
        return orderDate <= toDate;
      });
    }

    return filtered;
  }, [allOrders, appliedFilters]);

  // Filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filterInputs });
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      searchType: 'patientName',
      searchValue: '',
      status: -1,
      priority: 0,
      dateFrom: '',
      dateTo: ''
    };
    setFilterInputs(emptyFilters);
    setAppliedFilters(emptyFilters);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const handleUpdateOrder = (order) => {
    setSelectedOrder(order);
    setIsUpdateOrderOpen(true);
  };

  const handleMakeWorkClick = (order) => {
    setSelectedOrder(order);
    setIsConfirmWorkOpen(true);
  };

  const handleMakeInvoiceClick = (order) => {
    setSelectedOrder(order);
    setIsMakeInvoiceOpen(true);
  };

  const handleConfirmMakeWork = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      
      await createWorkItemsForOrder(selectedOrder.id, clinicId);
      
      setIsConfirmWorkOpen(false);
      setSelectedOrder(null);
      
      await fetchOrders();
      
      alert('Work items created successfully! Navigate to Work Queue to process them.');
    } catch (err) {
      console.error('Error creating work items:', err);
      alert(err.message || 'Failed to create work items');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (invoiceData) => {
    try {
      setLoading(true);
      
      await generateLabInvoice(invoiceData);
      
      setIsMakeInvoiceOpen(false);
      setSelectedOrder(null);
      
      await fetchOrders();
      
      alert('Invoice generated successfully!');
    } catch (err) {
      console.error('Error generating invoice:', err);
      alert(err.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderSubmit = async (orderData) => {
    try {
      setLoading(true);
      
      await updateLabTestOrder(orderData);
      
      setIsUpdateOrderOpen(false);
      setSelectedOrder(null);
      
      await fetchOrders();
      
      alert('Order updated successfully!');
    } catch (err) {
      console.error('Error updating order:', err);
      alert(err.message || 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReportClick = async (order) => {
    try {
      setSubmittingReport(true);
      setIsUpdateMode(false);
      setCurrentReportId(null);
      
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      // Fetch order details
      const orderListOptions = {
        OrderID: order.id,
        BranchID: branchId,
        Page: 1,
        PageSize: 1
      };
      
      const orderList = await getLabTestOrderList(clinicId, orderListOptions);
      
      if (!orderList || orderList.length === 0) {
        throw new Error('Order details not found');
      }
      
      const orderDetail = orderList[0];
      setOrderDetails(orderDetail);
      setSelectedOrderForReport(order);
      
      // Set default form values
      const now = new Date();
      const formattedDateTime = now.toISOString().slice(0, 16);
      
      setReportForm({
        verifiedBy: 0,
        verifiedDateTime: formattedDateTime,
        remarks: '',
        status: 1 // Default to "Created" status
      });
      
      // Show the report modal directly
      setShowReportModal(true);
      
    } catch (err) {
      console.error('Error processing add report:', err);
      setError(err);
      setReportMessage({ type: 'error', text: err.message || 'Failed to process report request' });
    } finally {
      setSubmittingReport(false);
    }
  };

  // Handle Update Report Button Click
  const handleUpdateReportClick = async (order) => {
    try {
      setSubmittingReport(true);
      
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      // Fetch the existing report for this order
      const reportOptions = {
        OrderID: order.id,
        BranchID: branchId,
        Page: 1,
        PageSize: 1
      };
      
      const reports = await getLabTestReportList(clinicId, reportOptions);
      
      if (!reports || reports.length === 0) {
        throw new Error('Report not found for this order');
      }
      
      const existingReport = reports[0];
      
      // Fetch order details
      const orderListOptions = {
        OrderID: order.id,
        BranchID: branchId,
        Page: 1,
        PageSize: 1
      };
      
      const orderList = await getLabTestOrderList(clinicId, orderListOptions);
      
      if (!orderList || orderList.length === 0) {
        throw new Error('Order details not found');
      }
      
      const orderDetail = orderList[0];
      setOrderDetails(orderDetail);
      
      // Set form with existing report data
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
        status: existingReport.status ?? 1 // Use existing status or default to "Created"
      });
      
      setShowReportModal(true);
      
    } catch (err) {
      console.error('Error loading report for update:', err);
      setError(err);
      alert(err.message || 'Failed to load report details');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Handle Report Form Submission
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    if (!reportForm.verifiedBy || reportForm.verifiedBy === 0) {
      setReportMessage({ type: 'error', text: 'Please select a verified by doctor' });
      return;
    }
    
    if (!reportForm.verifiedDateTime) {
      setReportMessage({ type: 'error', text: 'Please select verified date and time' });
      return;
    }
    
    try {
      setSubmittingReport(true);
      setReportMessage({ type: '', text: '' });
      
      if (isUpdateMode) {
        // Update existing report
        const updateReportData = {
          reportId: currentReportId,
          clinicId: orderDetails.clinicId,
          branchId: orderDetails.branchId,
          fileId: orderDetails.fileId || 0,
          verifiedBy: reportForm.verifiedBy,
          verifiedDateTime: reportForm.verifiedDateTime,
          remarks: reportForm.remarks,
          status: reportForm.status
        };
        
        const result = await updateLabTestReport(updateReportData);
        
        if (result.success) {
          setReportMessage({ type: 'success', text: 'Lab test report updated successfully!' });
          setTimeout(() => {
            setShowReportModal(false);
            setSelectedOrderForReport(null);
            setOrderDetails(null);
            setIsUpdateMode(false);
            setCurrentReportId(null);
            setReportForm({
              verifiedBy: 0,
              verifiedDateTime: '',
              remarks: '',
              status: 1 // Default to "Created" status
            });
            setReportMessage({ type: '', text: '' });
            fetchOrders();
          }, 1500);
        }
      } else {
        // Add new report
        const reportData = {
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
        };
        
        const result = await addLabTestReport(reportData);
        
        if (result.success) {
          setReportMessage({ type: 'success', text: 'Lab test report added successfully!' });
          setTimeout(() => {
            setShowReportModal(false);
            setSelectedOrderForReport(null);
            setOrderDetails(null);
            setReportForm({
              verifiedBy: 0,
              verifiedDateTime: '',
              remarks: '',
              status: 1 // Default to "Created" status
            });
            setReportMessage({ type: '', text: '' });
            fetchOrders();
          }, 1500);
        }
      }
      
    } catch (err) {
      console.error('Error submitting report:', err);
      setReportMessage({ type: 'error', text: err.message || `Failed to ${isUpdateMode ? 'update' : 'add'} lab test report` });
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
    setReportForm({
      verifiedBy: 0,
      verifiedDateTime: '',
      remarks: '',
      status: 1 // Default to "Created" status
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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

  const getOrderStatusIcon = (status) => {
    switch(status) {
      case 1: return <FiClock className={styles.statusIcon} />;
      case 2: return <FiCheckCircle className={styles.statusIcon} />;
      case 5: return <FiAlertCircle className={styles.statusIcon} />;
      default: return null;
    }
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading && !isOrderDetailsOpen && !isUpdateOrderOpen) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading lab orders...</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Order Management" />

      {/* Quick Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)' }}>
            <FiClock size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{allOrders.filter(o => o.status === 1).length}</div>
            <div className={styles.statLabel}>Pending Orders</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
            <FiAlertCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{allOrders.filter(o => o.status === 5).length}</div>
            <div className={styles.statLabel}>In Progress</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <FiCheckCircle size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{allOrders.filter(o => o.status === 2).length}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #207d9c, #30b2b5)' }}>
            <FiEye size={24} />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{allOrders.length}</div>
            <div className={styles.statLabel}>Total Orders</div>
          </div>
        </div>
      </div>

      {/* Filters Container */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>

          {/* Search type + value (already fused — unchanged) */}
          <div className={styles.searchGroup}>
            <select
              name="searchType"
              value={filterInputs.searchType}
              onChange={handleFilterChange}
              className={styles.searchTypeSelect}
            >
              <option value="patientName">Patient Name</option>
              <option value="doctorName">Doctor Name</option>
              <option value="testName">Test/Notes</option>
            </select>
            
            <input
              type="text"
              name="searchValue"
              placeholder={`Search by ${
                filterInputs.searchType === 'patientName' ? 'Patient Name' :
                filterInputs.searchType === 'doctorName' ? 'Doctor Name' :
                'Test/Notes'
              }`}
              value={filterInputs.searchValue}
              onChange={handleFilterChange}
              onKeyPress={handleKeyPress}
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
              {statusOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <select
              name="priority"
              value={filterInputs.priority}
              onChange={handleFilterChange}
              className={styles.filterInput}
            >
              {priorityOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date From — VendorList overlay-placeholder style */}
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

          {/* Date To — VendorList overlay-placeholder style */}
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
            <button onClick={handleSearch} className={styles.searchButton}>
              <FiSearch size={18} />
              Search
            </button>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className={styles.clearButton}>
                <FiX size={18} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
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
                  {hasActiveFilters 
                    ? 'No orders found matching your search.'
                    : 'No lab test orders found.'}
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const hasReport = orderReports[order.id];
                
                return (
                  <tr key={order.id} className={styles.tableRow}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {order.patientName?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        <div>
                          <div className={styles.name}>{order.patientName}</div>
                          <div className={styles.subText}>
                            {order.patientFileNo} • {order.patientMobile}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className={styles.name}>{order.doctorFullName}</div>
                        <div className={styles.subText}>{order.doctorCode || '—'}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getStatusBadgeClass(order.status)}`}>
                        {order.statusDesc}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getPriorityBadgeClass(order.priority)}`}>
                        {order.priorityDesc}
                      </span>
                    </td>
                    <td>
                      <div className={styles.dateCell}>
                        <div className={styles.name}>{formatDate(order.dateCreated)}</div>
                        <div className={styles.subText}>
                          {new Date(order.dateCreated).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button
                          onClick={() => handleViewOrderDetails(order)}
                          className={styles.viewBtn}
                          title="View Details"
                        >
                          <FiEye size={16} />
                        </button>
                        
                        <div className={styles.actionDropdownWrapper}>
                          <button className={styles.actionBtn}>
                            Actions
                          </button>
                          <div className={styles.actionDropdown}>
                            <button
                              onClick={() => handleMakeWorkClick(order)}
                              className={styles.dropdownItem}
                              disabled={order.status === 5 || order.status === 2 || order.status === 3 || order.status === 6}
                            >
                              {order.status === 5 ? 'In Progress' : 'Make Work'}
                            </button>
                            
                            {(order.status === 2) && !hasReport && (
                              <button
                                onClick={() => handleAddReportClick(order)}
                                className={styles.dropdownItem}
                              >
                                <FiFileText size={14} />
                                Add Report
                              </button>
                            )}
                            
                            {(order.status === 2) && hasReport && (
                              <button
                                onClick={() => handleUpdateReportClick(order)}
                                className={styles.dropdownItem}
                              >
                                <FiEdit size={14} />
                                Update Report
                              </button>
                            )}
                            
                            {(order.status === 1 || order.status === 5) && (
                              <button
                                onClick={() => handleMakeInvoiceClick(order)}
                                className={styles.dropdownItem}
                              >
                                <FiFileText size={14} />
                                Make Invoice
                              </button>
                            )}
                            
                            {order.status === 4 && (
                              <button
                                className={`${styles.dropdownItem} ${styles.invoicedItem}`}
                                disabled
                              >
                                <FiCheckCircle size={14} />
                                Invoiced!
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

      {/* Modals */}
      {isOrderDetailsOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setIsOrderDetailsOpen(false);
            setSelectedOrder(null);
          }}
          onUpdate={() => {
            setIsOrderDetailsOpen(false);
            handleUpdateOrder(selectedOrder);
          }}
        />
      )}

      {isUpdateOrderOpen && selectedOrder && (
        <UpdateOrderModal
          order={selectedOrder}
          statusOptions={statusOptions}
          priorityOptions={priorityOptions.filter(p => p.id !== 0)}
          onClose={() => {
            setIsUpdateOrderOpen(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleUpdateOrderSubmit}
        />
      )}

      {isConfirmWorkOpen && selectedOrder && (
        <ConfirmMakeWorkModal
          order={selectedOrder}
          onClose={() => {
            setIsConfirmWorkOpen(false);
            setSelectedOrder(null);
          }}
          onConfirm={handleConfirmMakeWork}
        />
      )}

      {isMakeInvoiceOpen && selectedOrder && (
        <MakeInvoiceModal
          order={selectedOrder}
          onClose={() => {
            setIsMakeInvoiceOpen(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleGenerateInvoice}
        />
      )}

      {/* Add/Update Report Modal */}
      {showReportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.reportModal}>
            <div className={styles.reportModalHeader}>
              <h3>{isUpdateMode ? 'Update Lab Test Report' : 'Add Lab Test Report'}</h3>
              <button 
                onClick={handleCloseReportModal} 
                className={styles.reportCloseBtn}
                disabled={submittingReport}
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitReport} className={styles.reportForm}>
              <div className={styles.reportModalBody}>
                {reportMessage.text && (
                  <div className={`${styles.reportMessage} ${styles[reportMessage.type]}`}>
                    {reportMessage.text}
                  </div>
                )}

                <div className={styles.orderInfoSection}>
                  <h4>Order Information</h4>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>Order ID:</span>
                      <span className={styles.infoValue}>#{orderDetails?.id}</span>
                    </div>
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
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} ({doctor.employeeCode})
                      </option>
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
                      {reportStatusOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
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
                <button 
                  type="submit" 
                  className={styles.reportSubmitBtn}
                  disabled={submittingReport}
                >
                  {submittingReport ? (isUpdateMode ? 'Updating...' : 'Submitting...') : (isUpdateMode ? 'Update Report' : 'Submit Report')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onUpdate }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Order Details</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <label>Order ID:</label>
              <span>#{order.id}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Unique Seq:</label>
              <span>{order.uniqueSeq}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Patient Name:</label>
              <span>{order.patientName}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Patient File No:</label>
              <span>{order.patientFileNo}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Patient Mobile:</label>
              <span>{order.patientMobile}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Doctor:</label>
              <span>{order.doctorFullName} ({order.doctorCode})</span>
            </div>
            <div className={styles.detailItem}>
              <label>Clinic:</label>
              <span>{order.clinicName}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Branch:</label>
              <span>{order.branchName}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Status:</label>
              <span>{order.statusDesc}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Priority:</label>
              <span>{order.priorityDesc}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Consultation ID:</label>
              <span>{order.consultationId || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Visit ID:</label>
              <span>{order.visitId || '—'}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Date Created:</label>
              <span>{new Date(order.dateCreated).toLocaleString()}</span>
            </div>
            <div className={styles.detailItem}>
              <label>Date Modified:</label>
              <span>{new Date(order.dateModified).toLocaleString()}</span>
            </div>
            <div className={styles.detailItemFull}>
              <label>Notes:</label>
              <span>{order.notes || 'No notes'}</span>
            </div>
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onUpdate} className={styles.updateBtn}>
            Update Order
          </button>
          <button onClick={onClose} className={styles.cancelBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Update Order Modal Component
const UpdateOrderModal = ({ order, statusOptions, priorityOptions, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    status: order.status,
    priority: order.priority,
    notes: order.notes || '',
    fileId: order.fileId || 0,
    testApprovedBy: order.doctorId
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const clinicId = Number(localStorage.getItem('clinicID'));
    const branchId = Number(localStorage.getItem('branchID'));
    
    const orderData = {
      orderId: order.id,
      clinicId: clinicId,
      branchId: branchId,
      status: formData.status,
      priority: formData.priority,
      notes: formData.notes,
      fileId: formData.fileId,
      testApprovedBy: formData.testApprovedBy
    };
    
    onSubmit(orderData);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Update Order #{order.id}</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: Number(e.target.value)})}
                  className={styles.formInput}
                  required
                >
                  {statusOptions.filter(s => s.id !== -1).map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
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
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className={styles.formTextarea}
                  rows={4}
                  placeholder="Enter any notes..."
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="submit" className={styles.updateBtn}>
              Update Order
            </button>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Confirm Make Work Modal Component
const ConfirmMakeWorkModal = ({ order, onClose, onConfirm }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Confirm Create Work Items</h2>
          <button onClick={onClose} className={styles.closeBtn}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.confirmIcon}>
            <FiAlertCircle size={48} />
          </div>
          <p className={styles.confirmText}>
            Are you sure you want to create work items for this order?
          </p>
          <div className={styles.confirmDetails}>
            <div className={styles.confirmDetailRow}>
              <span className={styles.confirmLabel}>Order ID:</span>
              <span className={styles.confirmValue}>#{order.id}</span>
            </div>
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
          <button onClick={onConfirm} className={styles.confirmBtn}>
            <FiCheckCircle size={18} />
            Yes, Create Work Items
          </button>
          <button onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Make Invoice Modal Component
const MakeInvoiceModal = ({ order, onClose, onSubmit }) => {
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    invoiceDate: getTodayDate(),
    discount: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const clinicId = Number(localStorage.getItem('clinicID'));
    const branchId = Number(localStorage.getItem('branchID'));
    
    const invoiceData = {
      orderId: order.id,
      clinicId: clinicId,
      branchId: branchId,
      invoiceDate: formData.invoiceDate,
      discount: Number(formData.discount)
    };
    
    onSubmit(invoiceData);
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
            <div className={styles.confirmIcon}>
              <FiFileText size={48} />
            </div>
            <p className={styles.confirmText}>
              Generate invoice for Order #{order.id}
            </p>
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

            <div className={styles.invoiceFormGrid}>
              <div className={styles.formGroup}>
                <label>Invoice Date *</label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, discount: e.target.value})}
                  className={styles.formInput}
                  placeholder="Enter discount amount"
                />
              </div>
            </div>
          </div>
          <div className={styles.modalFooter}>
            <button type="submit" className={styles.confirmBtn}>
              <FiFileText size={18} />
              Generate Invoice
            </button>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabOrderList;