// src/components/ViewLabOrder.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiCheck, FiX, FiFileText, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getConsultationList } from '../api/api-consultation.js';
import { 
  getLabTestOrderList, 
  addLabTestOrder, 
  updateLabTestOrder, 
  deleteLabTestOrder 
} from '../api/api-labtest.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ViewLabOrder.module.css';

const LAB_PRIORITIES = [
  { id: 1, name: 'Routine' },
  { id: 2, name: 'Urgent' },
  { id: 3, name: 'Stat' }
];

const ViewLabOrder = () => {
  const { id } = useParams(); // consultation ID
  const navigate = useNavigate();

  const [consultation, setConsultation] = useState(null);
  const [labOrders, setLabOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('laborder');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Lab Order Form States
  const [showLabOrderForm, setShowLabOrderForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [labOrderFormData, setLabOrderFormData] = useState({
    priority: 1,
    notes: ''
  });

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

      // Fetch consultation details
      const consultOptions = {
        Page: 1,
        PageSize: 1,
        BranchID: branchId,
        ConsultationID: Number(id)
      };

      const consultData = await getConsultationList(clinicId, consultOptions);

      if (consultData && consultData.length > 0) {
        setConsultation(consultData[0]);
        // Fetch lab orders for this consultation
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
    } catch (err) {
      console.error('fetchLabOrders error:', err);
    }
  };

  const handleLabOrderInputChange = (e) => {
    const { name, value } = e.target;
    setLabOrderFormData(prev => ({
      ...prev,
      [name]: name === 'priority' ? Number(value) : value
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
        notes: labOrderFormData.notes
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

  const openAddLabOrderForm = () => {
    resetLabOrderForm();
    setIsEditMode(false);
    setEditingOrderId(null);
    setShowLabOrderForm(true);
  };

  const openEditLabOrderForm = (order) => {
    setLabOrderFormData({
      priority: order.priority,
      notes: order.notes || ''
    });
    setIsEditMode(true);
    setEditingOrderId(order.id);
    setShowLabOrderForm(true);
  };

  const resetLabOrderForm = () => {
    setLabOrderFormData({
      priority: 1,
      notes: ''
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

  // Early returns
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

      {/* Back Button */}
      <div className={styles.toolbar}>
        <button onClick={handleBack} className={styles.backBtn}>
          <FiArrowLeft size={20} /> Back to List
        </button>
      </div>

      {/* Common Card Header */}
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

          {/* Tab Navigation */}
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

        {/* Card Body */}
        <div className={styles.cardBody}>
          {/* Lab Order Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                <FiFileText size={20} />
                <span>Lab Test Orders</span>
              </div>
              {labOrders.length > 0 && (
                <div className={styles.sectionActions}>
                  {/* Button hidden when lab orders exist */}
                </div>
              )}
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
                {labOrders.map((order) => (
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
                        <button 
                          onClick={() => handleDeleteLabOrder(order.id)} 
                          className={styles.btnDelete}
                          title="Delete Order"
                          disabled={submitLoading}
                        >
                          <FiTrash2 size={16} />
                        </button>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lab Order Form Modal */}
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
    </div>
  );
};

export default ViewLabOrder;