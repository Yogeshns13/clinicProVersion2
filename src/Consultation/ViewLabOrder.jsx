// src/components/ViewLabOrder.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiCheck, FiX, FiFileText, FiEdit2, FiTrash2, FiPackage, FiClipboard, FiSearch } from 'react-icons/fi';
import { getConsultationList } from '../api/api-consultation.js';
import { 
  getLabTestOrderList, 
  addLabTestOrder, 
  updateLabTestOrder, 
  deleteLabTestOrder,
  getLabTestOrderItemList,
  addLabTestOrderItem,
  updateLabTestOrderItem,
  getLabTestMasterList,
  getLabTestPackageList
} from '../api/api-labtest.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ViewLabOrder.module.css';

const LAB_PRIORITIES = [
  { id: 1, name: 'Routine' },
  { id: 2, name: 'Urgent' },
  { id: 3, name: 'Stat' }
];

const LAB_STATUSES = [
  { id: 1, name: 'Pending' },
  { id: 2, name: 'Completed' },
  { id: 3, name: 'Cancelled' },
  { id: 6, name: 'External' }
];

const ViewLabOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [labOrders, setLabOrders] = useState([]);
  const [labOrderItems, setLabOrderItems] = useState({});
  const [activeTab, setActiveTab] = useState('laborder');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [showLabOrderForm, setShowLabOrderForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [labOrderFormData, setLabOrderFormData] = useState({
    priority: 1,
    notes: '',
    status: 1
  });

  const [showLabOrderItemForm, setShowLabOrderItemForm] = useState(false);
  const [currentOrderForItems, setCurrentOrderForItems] = useState(null);
  const [labTests, setLabTests] = useState([]);
  const [labPackages, setLabPackages] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // ─── States for Add modal ──────────────────────────────────────
  const [addTab, setAddTab]           = useState('tests'); // 'tests' | 'packages'
  const [searchTermTests, setSearchTermTests] = useState('');
  const [searchTermPackages, setSearchTermPackages] = useState('');
  const [filteredTests, setFilteredTests] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [existingTestIds, setExistingTestIds] = useState([]);
  const [existingPackageIds, setExistingPackageIds] = useState([]);

  // ─── States for View Item modal ────────────────────────────────
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchConsultationDetails();
    }
  }, [id]);

  const fetchConsultationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const consultOptions = {
        Page: 1,
        PageSize: 1,
        BranchID: branchId,
        ConsultationID: Number(id)
      };

      const consultData = await getConsultationList(clinicId, consultOptions);

      if (consultData && consultData.length > 0) {
        setConsultation(consultData[0]);
        await fetchLabOrders(clinicId, branchId, Number(id));
      } else {
        setError({ message: 'Consultation not found' });
      }
    } catch (err) {
      console.error('fetchConsultationDetails error:', err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load consultation details' }
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchLabOrders = async (clinicId, branchId, consultationId) => {
    try {
      const labOrderOptions = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        ConsultationID: consultationId
      };

      const labOrderData = await getLabTestOrderList(clinicId, labOrderOptions);
      setLabOrders(labOrderData || []);

      if (labOrderData && labOrderData.length > 0) {
        for (const order of labOrderData) {
          await fetchLabOrderItems(clinicId, branchId, order.id);
        }
      }
    } catch (err) {
      console.error('fetchLabOrders error:', err);
    }
  };

  const fetchLabOrderItems = async (clinicId, branchId, orderId) => {
    try {
      const itemOptions = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        OrderID: orderId,
        Status: 1
      };

      const itemsData = await getLabTestOrderItemList(clinicId, itemOptions);
      setLabOrderItems(prev => ({
        ...prev,
        [orderId]: itemsData || []
      }));
    } catch (err) {
      console.error('fetchLabOrderItems error:', err);
    }
  };

  const fetchLabTests = async () => {
    try {
      setLoadingTests(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const testOptions = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Status: 1
      };

      const testsData = await getLabTestMasterList(clinicId, testOptions);
      setLabTests(testsData || []);
      setFilteredTests(testsData || []);
    } catch (err) {
      console.error('fetchLabTests error:', err);
      alert('Failed to load lab tests');
    } finally {
      setLoadingTests(false);
    }
  };

  const fetchLabPackages = async () => {
    try {
      setLoadingPackages(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const packageOptions = {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Status: 1
      };

      const packagesData = await getLabTestPackageList(clinicId, packageOptions);
      setLabPackages(packagesData || []);
      setFilteredPackages(packagesData || []);
    } catch (err) {
      console.error('fetchLabPackages error:', err);
      alert('Failed to load lab packages');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleLabOrderInputChange = (e) => {
    const { name, value } = e.target;
    setLabOrderFormData(prev => ({
      ...prev,
      [name]: (name === 'priority' || name === 'status') ? Number(value) : value
    }));
  };

  const handleAddLabOrder = async (e) => {
    e.preventDefault();
    
    if (!consultation) {
      setError({ message: 'Consultation data is missing' });
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const labOrderData = {
        clinicId,
        branchId,
        ConsultationID: consultation.id,
        VisitID: consultation.visitId,
        PatientID: consultation.patientId,
        doctorId: consultation.doctorId,
        priority: labOrderFormData.priority,
        notes: labOrderFormData.notes
      };

      const result = await addLabTestOrder(labOrderData);
      
      if (result.success) {
        setShowLabOrderForm(false);
        resetLabOrderForm();
        alert('Lab test order created successfully!');
        await fetchLabOrders(clinicId, branchId, consultation.id);
      }
    } catch (err) {
      console.error('handleAddLabOrder error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateLabOrder = async (e) => {
    e.preventDefault();
    
    if (!consultation || !editingOrderId) {
      setError({ message: 'Lab order data is missing' });
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const updateData = {
        orderId: editingOrderId,
        clinicId,
        branchId,
        priority: labOrderFormData.priority,
        notes: labOrderFormData.notes,
        status: labOrderFormData.status,
        testApprovedBy: consultation.doctorId
      };

      const result = await updateLabTestOrder(updateData);
      
      if (result.success) {
        setShowLabOrderForm(false);
        setIsEditMode(false);
        setEditingOrderId(null);
        resetLabOrderForm();
        alert('Lab test order updated successfully!');
        await fetchLabOrders(clinicId, branchId, consultation.id);
      }
    } catch (err) {
      console.error('handleUpdateLabOrder error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteLabOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this lab test order?')) {
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const result = await deleteLabTestOrder(orderId);
      
      if (result.success) {
        alert('Lab test order deleted successfully!');
        await fetchLabOrders(clinicId, branchId, consultation.id);
      }
    } catch (err) {
      console.error('handleDeleteLabOrder error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteLabOrderItem = async (orderId, itemId) => {
    if (!window.confirm('Are you sure you want to delete this lab test item?')) {
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      console.log('Deleting item with ID:', itemId); // Debug log

      const updateData = {
        itemId: Number(itemId), // Ensure it's a number
        clinicId,
        branchId,
        status: 2
      };

      const result = await updateLabTestOrderItem(updateData);
      
      if (result.success) {
        alert('Lab test item deleted successfully!');
        await fetchLabOrderItems(clinicId, branchId, orderId);
      }
    } catch (err) {
      console.error('handleDeleteLabOrderItem error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setShowItemDetailModal(true);
  };

  const openAddLabOrderForm = () => {
    resetLabOrderForm();
    setIsEditMode(false);
    setEditingOrderId(null);
    setShowLabOrderForm(true);
  };

  const openEditLabOrderForm = (order) => {
    setLabOrderFormData({
      priority: order.priority,
      notes: order.notes || '',
      status: order.status || 1
    });
    setIsEditMode(true);
    setEditingOrderId(order.id);
    setShowLabOrderForm(true);
  };

  const openAddLabOrderItemForm = async (order) => {
    setCurrentOrderForItems(order);
    setAddTab('tests');
    setSearchTermTests('');
    setSearchTermPackages('');
    setSelectedTests([]);
    setSelectedPackages([]);
    setFilteredTests([]);
    setFilteredPackages([]);
    
    // Extract existing test and package IDs from current order's items
    const orderItems = labOrderItems[order.id] || [];
    const existingTests = orderItems
      .filter(item => item.testId && item.testId > 0)
      .map(item => item.testId);
    const existingPkgs = orderItems
      .filter(item => item.packageId && item.packageId > 0)
      .map(item => item.packageId);
    
    setExistingTestIds(existingTests);
    setExistingPackageIds(existingPkgs);
    
    setShowLabOrderItemForm(true);
    
    await Promise.all([fetchLabTests(), fetchLabPackages()]);
  };

  const resetLabOrderForm = () => {
    setLabOrderFormData({
      priority: 1,
      notes: '',
      status: 1
    });
  };

  const handleBack = () => {
    navigate('/consultation-list');
  };

  const handleTabClick = (tab, path) => {
    if (path) {
      navigate(path);
    } else {
      setActiveTab(tab);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityName = (priorityId) => {
    const priority = LAB_PRIORITIES.find(p => p.id === priorityId);
    return priority ? priority.name : 'Unknown';
  };

  const getPriorityClass = (priorityId) => {
    switch (priorityId) {
      case 1: return 'routine';
      case 2: return 'urgent';
      case 3: return 'stat';
      default: return 'routine';
    }
  };

  const getStatusClass = (status) => {
    if (status === 'active') return 'active';
    if (status === 'completed') return 'completed';
    if (status === 'inactive') return 'inactive';
    return 'inactive';
  };

  // ─── Search Handlers ───────────────────────────────────────────
  const handleSearchTests = () => {
    const term = searchTermTests.toLowerCase().trim();
    if (!term) {
      setFilteredTests(labTests);
      return;
    }
    const results = labTests.filter(test =>
      test.testName?.toLowerCase().includes(term) ||
      test.shortName?.toLowerCase().includes(term)
    );
    setFilteredTests(results);
  };

  const handleSearchPackages = () => {
    const term = searchTermPackages.toLowerCase().trim();
    if (!term) {
      setFilteredPackages(labPackages);
      return;
    }
    const results = labPackages.filter(pkg =>
      pkg.packName?.toLowerCase().includes(term) ||
      pkg.packShortName?.toLowerCase().includes(term)
    );
    setFilteredPackages(results);
  };

  // ─── Selection Handlers ────────────────────────────────────────
  const handleTestSelection = (testId) => {
    // Don't allow selection if test is already in the order
    if (existingTestIds.includes(testId)) {
      return;
    }
    
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const handlePackageSelection = (packageId) => {
    // Don't allow selection if package is already in the order
    if (existingPackageIds.includes(packageId)) {
      return;
    }
    
    setSelectedPackages(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  // ─── Check if item is already in order ────────────────────────
  const isTestAlreadyAdded = (testId) => {
    return existingTestIds.includes(testId);
  };

  const isPackageAlreadyAdded = (packageId) => {
    return existingPackageIds.includes(packageId);
  };

  // ─── Add multiple items in loop ────────────────────────────────
  const handleAddSelectedItems = async (e) => {
    e.preventDefault();

    if (selectedTests.length === 0 && selectedPackages.length === 0) {
      alert('Please select at least one test or package');
      return;
    }

    if (!currentOrderForItems) return;

    try {
      setSubmitLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      let successCount = 0;
      let failCount = 0;

      // Add selected tests
      for (const testId of selectedTests) {
        try {
          const itemData = {
            clinicId,
            branchId,
            OrderID: currentOrderForItems.id,
            PatientID: currentOrderForItems.patientId,
            DoctorID: currentOrderForItems.doctorId,
            TestID: testId,
            PackageID: 0
          };
          await addLabTestOrderItem(itemData);
          successCount++;
        } catch (err) {
          console.error(`Failed to add test ${testId}:`, err);
          failCount++;
        }
      }

      // Add selected packages
      for (const packageId of selectedPackages) {
        try {
          const itemData = {
            clinicId,
            branchId,
            OrderID: currentOrderForItems.id,
            PatientID: currentOrderForItems.patientId,
            DoctorID: currentOrderForItems.doctorId,
            TestID: 0,
            PackageID: packageId
          };
          await addLabTestOrderItem(itemData);
          successCount++;
        } catch (err) {
          console.error(`Failed to add package ${packageId}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        alert(`Successfully added ${successCount} item(s)${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        setShowLabOrderItemForm(false);
        setSelectedTests([]);
        setSelectedPackages([]);
        setSearchTermTests('');
        setSearchTermPackages('');
        setExistingTestIds([]);
        setExistingPackageIds([]);
        await fetchLabOrderItems(clinicId, branchId, currentOrderForItems.id);
      } else {
        alert('Failed to add any items. Please try again.');
      }
    } catch (err) {
      console.error('handleAddSelectedItems error:', err);
      alert('Error while adding items');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading lab order details...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  if (!consultation) return <div className={styles.error}>Consultation not found</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Lab Test Order" />

      <div className={styles.toolbar}>
        <button onClick={handleBack} className={styles.backBtn}>
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      <div className={styles.detailsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerInfo}>
            <h2>{consultation.patientName}</h2>
            <p className={styles.subtitle}>
              {consultation.doctorFullName} • {formatDateOnly(consultation.dateCreated)}
            </p>
            <span className={`${styles.statusBadge} ${styles.large} ${styles[getStatusClass(consultation.status || 'completed')]}`}>
              {(consultation.status || 'COMPLETED').toUpperCase()}
            </span>
          </div>

          <div className={styles.tabs}>
            <button
              className={styles.tabButton}
              onClick={() => handleTabClick('details', `/view-consultation/${id}`)}
            >
              Consultation Details
            </button>
            <button
              className={styles.tabButton}
              onClick={() => handleTabClick('prescription', `/view-prescription/${id}`)}
            >
              Prescription Details
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'laborder' ? styles.active : ''}`}
              onClick={() => handleTabClick('laborder')}
            >
              Lab Order Details
            </button>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <FiFileText size={20} />
                <span>Lab Test Orders</span>
              </div>
            </div>

            {labOrders.length === 0 ? (
              <div className={styles.emptyState}>
                <FiFileText size={48} />
                <p>No lab test order found</p>
                <p className={styles.hintText}>
                  Click "Add Lab Order" to create a new lab test order for this consultation
                </p>
                <button onClick={openAddLabOrderForm} className={styles.btnAddLarge}>
                  <FiPlus size={18} /> Add Lab Order
                </button>
              </div>
            ) : (
              <div className={styles.ordersContainer}>
                {labOrders.map((order) => {
                  const orderItems = labOrderItems[order.id] || [];
                  const hasItems = orderItems.length > 0;

                  return (
                    <div key={order.id} className={styles.orderCard}>
                      <div className={styles.orderHeader}>
                        <div className={styles.orderInfo}>
                          <div className={styles.orderTitle}>
                            <span className={styles.orderLabel}>Order #{order.uniqueSeq}</span>
                            <span className={`${styles.priorityBadge} ${styles[getPriorityClass(order.priority)]}`}>
                              {order.priorityDesc || getPriorityName(order.priority)}
                            </span>
                            <span className={styles.statusBadgeSmall}>
                              {order.statusDesc}
                            </span>
                          </div>
                          <div className={styles.orderMeta}>
                            <span>Created: {formatDateTime(order.dateCreated)}</span>
                            {order.dateModified && (
                              <span> • Modified: {formatDateTime(order.dateModified)}</span>
                            )}
                          </div>
                        </div>
                        <div className={styles.orderActions}>
                          <button 
                            onClick={() => openEditLabOrderForm(order)} 
                            className={styles.btnEdit}
                            title="Edit Order"
                          >
                            <FiEdit2 size={16} />
                          </button>
                          {!hasItems && (
                            <button 
                              onClick={() => handleDeleteLabOrder(order.id)} 
                              className={styles.btnDelete}
                              title="Delete Order"
                              disabled={submitLoading}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={styles.orderBody}>
                        <div className={styles.orderDetails}>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Patient:</span>
                            <span className={styles.detailValue}>{order.patientName}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>File No:</span>
                            <span className={styles.detailValue}>{order.patientFileNo || '—'}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Doctor:</span>
                            <span className={styles.detailValue}>{order.doctorFullName}</span>
                          </div>
                          {order.notes && (
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Notes:</span>
                              <span className={styles.detailValue}>{order.notes}</span>
                            </div>
                          )}
                        </div>

                        <div className={styles.itemsSection}>
                          <div className={styles.itemsHeader}>
                            <h4 className={styles.itemsTitle}>
                              <FiClipboard size={18} />
                              <span>Test Items ({orderItems.length})</span>
                            </h4>
                            <button 
                              onClick={() => openAddLabOrderItemForm(order)} 
                              className={styles.btnAddItem}
                              disabled={submitLoading}
                            >
                              <FiPlus size={16} /> Add Test/Package
                            </button>
                          </div>

                          {hasItems ? (
                            <div className={styles.itemsList}>
                              {orderItems.map((item) => (
                                <div key={item.itemId} className={styles.itemCard}>
                                  <div className={styles.itemInfo}>
                                    <div className={styles.itemType}>
                                      {item.packageId > 0 ? (
                                        <>
                                          <FiPackage size={16} className={styles.packageIcon} />
                                          <span className={styles.itemBadge}>Package</span>
                                        </>
                                      ) : (
                                        <>
                                          <FiClipboard size={16} className={styles.testIcon} />
                                          <span className={styles.itemBadge}>Test</span>
                                        </>
                                      )}
                                    </div>
                                    <div className={styles.itemName}>
                                      {item.testName || item.packageName || item.testOrPackageName || 'Unknown Item'}
                                    </div>
                                    {item.testShortName && (
                                      <div className={styles.itemShortName}>{item.testShortName}</div>
                                    )}
                                  </div>

                                  <div className={styles.itemActions}>
                                    <button
                                      onClick={() => handleViewItem(item)}
                                      className={styles.btnViewItem}
                                      title="View Details"
                                    >
                                      <FiFileText size={14} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteLabOrderItem(order.id, item.itemId)}
                                      className={styles.btnDeleteItem}
                                      title="Delete Item"
                                      disabled={submitLoading}
                                    >
                                      <FiTrash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className={styles.noItems}>
                              <FiClipboard size={32} />
                              <p>No test items added yet</p>
                              <p className={styles.noItemsHint}>Click "Add Test/Package" to add items to this order</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Lab Order Modal */}
      {showLabOrderForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>{isEditMode ? 'Edit Lab Test Order' : 'Add Lab Test Order'}</h3>
              <button 
                onClick={() => {
                  setShowLabOrderForm(false);
                  setIsEditMode(false);
                  setEditingOrderId(null);
                }} 
                className={styles.closeBtn}
              >
                <FiX size={20} />
              </button>
            </div>

            <form 
              onSubmit={isEditMode ? handleUpdateLabOrder : handleAddLabOrder} 
              className={styles.modalBody}
            >
              <div className={styles.infoBanner}>
                <FiFileText size={20} />
                <div>
                  <h4>{isEditMode ? 'Updating Lab Test Order' : 'Creating Lab Test Order'}</h4>
                  <p>
                    {isEditMode 
                      ? `Updating lab test order for ${consultation.patientName}`
                      : `This will create a lab test order for ${consultation.patientName}`
                    }
                  </p>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Priority *</label>
                <select
                  name="priority"
                  value={labOrderFormData.priority}
                  onChange={handleLabOrderInputChange}
                  className={styles.formInput}
                  required
                >
                  {LAB_PRIORITIES.map(priority => (
                    <option key={priority.id} value={priority.id}>{priority.name}</option>
                  ))}
                </select>
                <span className={styles.formHint}>
                  Routine: Normal processing | Urgent: Within 24 hours | Stat: Immediate
                </span>
              </div>

              {isEditMode && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Status *</label>
                  <select
                    name="status"
                    value={labOrderFormData.status}
                    onChange={handleLabOrderInputChange}
                    className={styles.formInput}
                    required
                  >
                    {LAB_STATUSES.map(status => (
                      <option key={status.id} value={status.id}>{status.name}</option>
                    ))}
                  </select>
                  <span className={styles.formHint}>
                    Update the current status of this lab order
                  </span>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes</label>
                <textarea
                  name="notes"
                  value={labOrderFormData.notes}
                  onChange={handleLabOrderInputChange}
                  placeholder="Lab test notes and instructions..."
                  className={styles.formTextarea}
                  rows={4}
                />
              </div>

              <div className={styles.visitInfoSection}>
                <h4>Consultation Details</h4>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Patient</span>
                    <span className={styles.detailValue}>{consultation.patientName}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>File No</span>
                    <span className={styles.detailValue}>{consultation.patientFileNo || '—'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Doctor</span>
                    <span className={styles.detailValue}>{consultation.doctorFullName}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Consultation Date</span>
                    <span className={styles.detailValue}>{formatDate(consultation.dateCreated)}</span>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowLabOrderForm(false);
                    setIsEditMode(false);
                    setEditingOrderId(null);
                  }} 
                  className={styles.btnCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.btnSubmit}
                  disabled={submitLoading}
                >
                  {submitLoading 
                    ? (isEditMode ? 'Updating...' : 'Creating...') 
                    : (isEditMode ? 'Update Lab Order' : 'Create Lab Order')
                  } <FiCheck size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Improved Add Test/Package Modal ────────────────────────── */}
      {showLabOrderItemForm && currentOrderForItems && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.modalLarge}`}>
            <div className={styles.modalHeader}>
              <h3>Add Test or Package to Order #{currentOrderForItems.uniqueSeq}</h3>
              <button 
                onClick={() => {
                  setShowLabOrderItemForm(false);
                  setCurrentOrderForItems(null);
                  setAddTab('tests');
                  setSearchTermTests('');
                  setSearchTermPackages('');
                  setSelectedTests([]);
                  setSelectedPackages([]);
                  setExistingTestIds([]);
                  setExistingPackageIds([]);
                }} 
                className={styles.closeBtn}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSelectedItems} className={styles.modalBody}>
              <div className={styles.infoBanner}>
                <FiClipboard size={20} />
                <div>
                  <h4>Select Tests and/or Packages</h4>
                  <p>Choose items and click "Add Selected Items". Already added items are disabled.</p>
                </div>
              </div>

              <div className={styles.tabContainer}>
                <button
                  type="button"
                  className={`${styles.tabButton} ${addTab === 'tests' ? styles.active : ''}`}
                  onClick={() => setAddTab('tests')}
                >
                  Individual Tests
                </button>
                <button
                  type="button"
                  className={`${styles.tabButton} ${addTab === 'packages' ? styles.active : ''}`}
                  onClick={() => setAddTab('packages')}
                >
                  Test Packages
                </button>
              </div>

              {addTab === 'tests' ? (
                <>
                  <div className={styles.searchContainer}>
                    <input
                      type="text"
                      placeholder="Search tests..."
                      value={searchTermTests}
                      onChange={(e) => setSearchTermTests(e.target.value)}
                      className={styles.searchInput}
                    />
                    <button
                      type="button"
                      onClick={handleSearchTests}
                      className={styles.searchBtn}
                      disabled={loadingTests}
                    >
                      <FiSearch size={18} /> Search
                    </button>
                  </div>

                  {loadingTests ? (
                    <div className={styles.loadingSmall}>Loading tests...</div>
                  ) : filteredTests.length === 0 ? (
                    <div className={styles.noData}>
                      {searchTermTests ? 'No matching tests found' : 'No tests loaded yet'}
                    </div>
                  ) : (
                    <div className={styles.selectionGrid}>
                      {filteredTests.map((test) => {
                        const alreadyAdded = isTestAlreadyAdded(test.id);
                        return (
                          <label 
                            key={test.id} 
                            className={`${styles.selectionItem} ${alreadyAdded ? styles.disabled : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedTests.includes(test.id)}
                              onChange={() => handleTestSelection(test.id)}
                              className={styles.checkbox}
                              disabled={alreadyAdded}
                            />
                            <div className={styles.selectionInfo}>
                              <span className={styles.selectionName}>
                                {test.testName}
                                {alreadyAdded && <span className={styles.alreadyAddedBadge}>Already Added</span>}
                              </span>
                              {test.shortName && (
                                <span className={styles.selectionShortName}>{test.shortName}</span>
                              )}
                              <span className={styles.selectionMeta}>
                                {test.testTypeDesc} • ₹{test.fees}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.searchContainer}>
                    <input
                      type="text"
                      placeholder="Search packages..."
                      value={searchTermPackages}
                      onChange={(e) => setSearchTermPackages(e.target.value)}
                      className={styles.searchInput}
                    />
                    <button
                      type="button"
                      onClick={handleSearchPackages}
                      className={styles.searchBtn}
                      disabled={loadingPackages}
                    >
                      <FiSearch size={18} /> Search
                    </button>
                  </div>

                  {loadingPackages ? (
                    <div className={styles.loadingSmall}>Loading packages...</div>
                  ) : filteredPackages.length === 0 ? (
                    <div className={styles.noData}>
                      {searchTermPackages ? 'No matching packages found' : 'No packages loaded yet'}
                    </div>
                  ) : (
                    <div className={styles.selectionGrid}>
                      {filteredPackages.map((pkg) => {
                        const alreadyAdded = isPackageAlreadyAdded(pkg.id);
                        return (
                          <label 
                            key={pkg.id} 
                            className={`${styles.selectionItem} ${alreadyAdded ? styles.disabled : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPackages.includes(pkg.id)}
                              onChange={() => handlePackageSelection(pkg.id)}
                              className={styles.checkbox}
                              disabled={alreadyAdded}
                            />
                            <div className={styles.selectionInfo}>
                              <span className={styles.selectionName}>
                                {pkg.packName}
                                {alreadyAdded && <span className={styles.alreadyAddedBadge}>Already Added</span>}
                              </span>
                              {pkg.packShortName && (
                                <span className={styles.selectionShortName}>{pkg.packShortName}</span>
                              )}
                              <span className={styles.selectionMeta}>
                                Package • ₹{pkg.fees}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              <div className={styles.selectionSummary}>
                <p>
                  Selected: <strong>{selectedTests.length} test(s)</strong> +{' '}
                  <strong>{selectedPackages.length} package(s)</strong>
                </p>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowLabOrderItemForm(false);
                    setCurrentOrderForItems(null);
                    setSelectedTests([]);
                    setSelectedPackages([]);
                    setSearchTermTests('');
                    setSearchTermPackages('');
                    setExistingTestIds([]);
                    setExistingPackageIds([]);
                  }} 
                  className={styles.btnCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.btnSubmit}
                  disabled={submitLoading || (selectedTests.length === 0 && selectedPackages.length === 0)}
                >
                  {submitLoading ? 'Adding...' : 'Add Selected Items'} <FiCheck size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Item Detail Modal */}
      {showItemDetailModal && selectedItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Lab Item Details</h3>
              <button 
                onClick={() => setShowItemDetailModal(false)} 
                className={styles.closeBtn}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.itemDetailSection}>
                <h4>{selectedItem.testName || selectedItem.packageName || selectedItem.testOrPackageName || 'Unknown'}</h4>
                
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Type:</span>
                  <span>{selectedItem.packageId > 0 ? 'Package' : 'Test'}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Fees:</span>
                  <span>₹{(selectedItem.fees || selectedItem.totalAmount || 0).toFixed(2)}</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>CGST:</span>
                  <span>{(selectedItem.cgst || selectedItem.cgstPercentage || 0)}%</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>SGST:</span>
                  <span>{(selectedItem.sgst || selectedItem.sgstPercentage || 0)}%</span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Added:</span>
                  <span>{formatDateTime(selectedItem.dateAdded || selectedItem.itemAddedDate || selectedItem.dateCreated)}</span>
                </div>

                {selectedItem.status !== undefined && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Status:</span>
                    <span>{selectedItem.status === 1 ? 'Active' : 'Inactive'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                onClick={() => setShowItemDetailModal(false)} 
                className={styles.btnCancel}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewLabOrder;