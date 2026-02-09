// src/components/PurchaseOrderItems.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiPackage } from 'react-icons/fi';
import { 
  getPurchaseOrderDetailList, 
  deletePurchaseOrderDetail 
} from '../api/api-pharmacy.js';
import AddPurchaseOrderDetail from './AddPurchaseOrderDetail.jsx';
import UpdatePurchaseOrderDetail from './UpdatePurchaseOrderDetail.jsx';
import styles from './PurchaseOrderItems.module.css';

// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Ordered' },
  { id: 2, label: 'Partially Received' },
  { id: 3, label: 'Fully Received' },
  { id: 4, label: 'Cancelled' },
  { id: 5, label: 'Rejected' },
];

// ────────────────────────────────────────────────
const PurchaseOrderItems = ({ poId, purchaseOrder }) => {
  const navigate = useNavigate();

  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ────────────────────────────────────────────────
  // Fetch Items
  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const data = await getPurchaseOrderDetailList(clinicId, {
        BranchID: branchId,
        POID: Number(poId),
        PODetailID: 0,
      });

      setItems(data || []);
    } catch (err) {
      console.error('fetchItems error:', err);
      setError(err.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (poId) {
      fetchItems();
    }
  }, [poId]);

  // ────────────────────────────────────────────────
  // Helper functions
  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '—';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusClass = (status) => {
    if (status === 1) return 'ordered';
    if (status === 2) return 'partiallyReceived';
    if (status === 3) return 'fullyReceived';
    if (status === 4) return 'cancelled';
    if (status === 5) return 'rejected';
    return 'ordered';
  };

  const getStatusLabel = (status) => {
    const statusOption = STATUS_OPTIONS.find(s => s.id === status);
    return statusOption ? statusOption.label : 'Unknown';
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleAddItem = () => {
    setIsAddModalOpen(true);
  };

  const handleUpdateItem = (item) => {
    setSelectedItem(item);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.medicineName}"?`)) {
      return;
    }

    try {
      await deletePurchaseOrderDetail(item.id);
      fetchItems(); // Refresh list
    } catch (err) {
      console.error('Delete item failed:', err);
      alert(err.message || 'Failed to delete item');
    }
  };

  const handleAddSuccess = () => {
    fetchItems();
    setIsAddModalOpen(false);
  };

  const handleUpdateSuccess = () => {
    fetchItems();
    setIsUpdateModalOpen(false);
    setSelectedItem(null);
  };

  const handleCloseAdd = () => {
    setIsAddModalOpen(false);
  };

  const handleCloseUpdate = () => {
    setIsUpdateModalOpen(false);
    setSelectedItem(null);
  };

  // ────────────────────────────────────────────────
  if (loading) return <div className={styles.loading}>Loading items...</div>;

  // ────────────────────────────────────────────────
  return (
    <div className={styles.itemsWrapper}>
      {/* Header */}
      <div className={styles.itemsHeader}>
        <div className={styles.headerLeft}>
          <FiPackage size={24} className={styles.headerIcon} />
          <div>
            <h3 className={styles.headerTitle}>Order Items ({items.length})</h3>
           
          </div>
          <div className={`${styles.summaryItem} ${styles.grandTotal}`}>
            <span className={styles.summaryLabel}>Grand Total:</span>
            <span className={styles.summaryValue}>
              {formatAmount(items.reduce((sum, item) => sum + (item.totalLineAmount || 0), 0))}
            </span>
          </div>

        </div>
        <button onClick={handleAddItem} className={styles.addBtn}>
          <FiPlus size={18} /> Add Item
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorBanner}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Items Table */}
      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <FiPackage size={64} className={styles.emptyIcon} />
          <h3>No Items Added</h3>
          <p>Start by adding items to this purchase order</p>
          <button onClick={handleAddItem} className={styles.addBtn}>
            <FiPlus size={18} /> Add First Item
          </button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Generic Name</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
                <th>Tax</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.medicineCell}>
                      <div className={styles.medicineAvatar}>
                        {item.medicineName?.charAt(0).toUpperCase() || 'M'}
                      </div>
                      <div className={styles.medicineName}>{item.medicineName || '—'}</div>
                    </div>
                  </td>
                  <td>{item.genericName || '—'}</td>
                  
                  <td>
                    <span className={styles.quantityBadge}>{item.quantity || 0}</span>
                  </td>
                  <td>
                    <span className={styles.priceBadge}>{formatAmount(item.unitPrice)}</span>
                  </td>
                  <td>
                    <span className={styles.amountBadge}>{formatAmount(item.amount)}</span>
                  </td>
                  <td>
                    <div className={styles.taxCell}>
                     <div className={styles.taxGroup}>
                         <span className={styles.taxLabel}>CGST:</span>
                          <span className={styles.taxValue}>{formatAmount(item.cgstAmount)}</span>
                     </div>
                      <div className={styles.taxGroup}>
                           <span className={styles.taxLabel}>SGST:</span>
                          <span className={styles.taxValue}>{formatAmount(item.sgstAmount)}</span>
                      </div>
                     </div>

                  </td>
                  <td>
                    <span className={styles.totalBadge}>{formatAmount(item.totalLineAmount)}</span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[getStatusClass(item.status)]}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleUpdateItem(item)}
                        className={styles.editBtn}
                        title="Edit item"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className={styles.deleteBtn}
                        title="Delete item"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      {items.length > 0 && (
        <div className={styles.summaryFooter}>
          
        </div>
      )}

      {/* Modals */}
      <AddPurchaseOrderDetail
        isOpen={isAddModalOpen}
        onClose={handleCloseAdd}
        onAddSuccess={handleAddSuccess}
        preselectedPOID={poId}
      />

      {selectedItem && (
        <UpdatePurchaseOrderDetail
          isOpen={isUpdateModalOpen}
          onClose={handleCloseUpdate}
          onUpdateSuccess={handleUpdateSuccess}
          item={selectedItem}
        />
      )}
    </div>
  );
};

export default PurchaseOrderItems;