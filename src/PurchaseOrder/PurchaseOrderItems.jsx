// src/components/PurchaseOrderDetailList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiPackage,
  FiUser,
  FiHash,
  FiCalendar,
  FiAlertCircle,
  FiRefreshCw,
  FiMapPin,
  FiCheckCircle,
  FiX,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiDollarSign,
} from 'react-icons/fi';
import {
  getPurchaseOrderList,
  getPurchaseOrderDetailList,
  deletePurchaseOrderDetail,
  deletePurchaseOrder,
} from '../Api/ApiPharmacy.js';
import Header from '../Header/Header.jsx';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import AddPurchaseOrderDetail from './AddPurchaseOrderDetail.jsx';
import UpdatePurchaseOrderDetail from './UpdatePurchaseOrderDetail.jsx';
import styles from './PurchaseOrderItems.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

// ──────────────────────────────────────────────────
const PO_STATUS_OPTIONS = [
  { id: 1, label: 'Draft'              },
  { id: 2, label: 'Sent'               },
  { id: 3, label: 'Confirmed'          },
  { id: 4, label: 'Partially Received' },
  { id: 5, label: 'Fully Received'     },
  { id: 6, label: 'Cancelled'          },
];

const ITEM_STATUS_OPTIONS = [
  { id: 1, label: 'Ordered'            },
  { id: 2, label: 'Partially Received' },
  { id: 3, label: 'Fully Received'     },
  { id: 4, label: 'Cancelled'          },
  { id: 5, label: 'Rejected'           },
];

// ──────────────────────────────────────────────────
const PurchaseOrderDetailList = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  // PO header data
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [poLoading,     setPoLoading]     = useState(true);
  const [poError,       setPoError]       = useState(null);

  // Items data
  const [items,       setItems]       = useState([]);
  const [itemLoading, setItemLoading] = useState(true);
  const [itemError,   setItemError]   = useState(null);

  // Delete confirm for item (inline, no window.confirm)
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false, item: null, submitting: false, error: null,
  });

  // ── NEW: Delete confirm for entire PO ─────────
  const [deletePOConfirm, setDeletePOConfirm] = useState({
    isOpen: false, submitting: false, error: null,
  });

  // Add modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Update modal
  const [updateModal, setUpdateModal] = useState({ isOpen: false, item: null });

  // ── Fetch PO header ────────────────────────────
  const fetchPurchaseOrder = async () => {
    try {
      setPoLoading(true);
      setPoError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const data = await getPurchaseOrderList(clinicId, {
        POID:     Number(id),
        BranchID: branchId,
      });

      if (data && data.length > 0) {
        setPurchaseOrder(data[0]);
      } else {
        setPoError({ message: 'Purchase order not found.' });
      }
    } catch (err) {
      setPoError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || 'Failed to load purchase order.' }
      );
    } finally {
      setPoLoading(false);
    }
  };

  // ── Fetch Items ────────────────────────────────
  const fetchItems = async () => {
    try {
      setItemLoading(true);
      setItemError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const data = await getPurchaseOrderDetailList(clinicId, {
        BranchID:   branchId,
        POID:       Number(id),
        PODetailID: 0,
      });

      setItems(data || []);
    } catch (err) {
      setItemError(err.message || 'Failed to load order items.');
    } finally {
      setItemLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPurchaseOrder();
      fetchItems();
    }
  }, [id]);

  // ── Helpers ────────────────────────────────────
  const fmt = (amount) => {
    if (!amount && amount !== 0) return '—';
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const getPoStatusLabel = (status) =>
    PO_STATUS_OPTIONS.find((s) => s.id === status)?.label ?? 'Unknown';

  const getPoStatusClass = (status) => {
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

  const getItemStatusLabel = (status) =>
    ITEM_STATUS_OPTIONS.find((s) => s.id === status)?.label ?? 'Unknown';

  const getItemStatusClass = (status) => {
    const map = {
      1: styles.itemOrdered,
      2: styles.itemPartial,
      3: styles.itemFullyReceived,
      4: styles.itemCancelled,
      5: styles.itemRejected,
    };
    return map[status] ?? styles.itemOrdered;
  };

  // ── Totals ─────────────────────────────────────
  const totals = useMemo(() => items.reduce(
    (acc, item) => {
      acc.amount   += Number(item.amount)          || 0;
      acc.cgst     += Number(item.cgstAmount)      || 0;
      acc.sgst     += Number(item.sgstAmount)      || 0;
      acc.total    += Number(item.totalLineAmount) || 0;
      return acc;
    },
    { amount: 0, cgst: 0, sgst: 0, total: 0 }
  ), [items]);

  // ── Delete item handlers ───────────────────────
  const openDeleteConfirm  = (item) => setDeleteConfirm({ isOpen: true, item, submitting: false, error: null });
  const closeDeleteConfirm = ()     => { if (!deleteConfirm.submitting) setDeleteConfirm({ isOpen: false, item: null, submitting: false, error: null }); };

  const handleDeleteItem = async () => {
    setDeleteConfirm((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      await deletePurchaseOrderDetail(deleteConfirm.item.id);
      setDeleteConfirm({ isOpen: false, item: null, submitting: false, error: null });
      fetchItems();
    } catch (err) {
      setDeleteConfirm((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || 'Failed to delete item.',
      }));
    }
  };

  // ── NEW: Delete entire PO handlers ────────────
  const openDeletePOConfirm  = () => setDeletePOConfirm({ isOpen: true, submitting: false, error: null });
  const closeDeletePOConfirm = () => { if (!deletePOConfirm.submitting) setDeletePOConfirm({ isOpen: false, submitting: false, error: null }); };

  const handleDeletePO = async () => {
    setDeletePOConfirm((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      await deletePurchaseOrder(Number(id));
      setDeletePOConfirm({ isOpen: false, submitting: false, error: null });
      navigate('/purchaseorder-list');
    } catch (err) {
      setDeletePOConfirm((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || 'Failed to delete purchase order.',
      }));
    }
  };

  // ── Update modal handlers ──────────────────────
  const openUpdateModal  = (item) => setUpdateModal({ isOpen: true, item });
  const closeUpdateModal = ()     => setUpdateModal({ isOpen: false, item: null });
  const handleUpdateSuccess = () => {
    closeUpdateModal();
    fetchItems();
  };

  // ── Add modal handlers ─────────────────────────
  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    fetchItems();
  };

  // ── Early return ───────────────────────────────
  if (poError && (poError?.status >= 400 || poError?.code >= 400)) {
    return <ErrorHandler error={poError} />;
  }

  const po = purchaseOrder;

  // ── Render ─────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <Header title="Purchase Order Details" />

      {/* ══ PAGE HEADER ══ */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/purchaseorder-list')}>
            <FiArrowLeft size={17} /> Back
          </button>
        </div>

        {!poLoading && po && (
          <div className={styles.headerActions}>
            {/* ── NEW: Delete PO Button ── */}
            <button className={styles.btnDelete} onClick={openDeletePOConfirm}>
              <FiTrash2 size={15} /> Delete PO
            </button>

            <button className={styles.addItemBtn} onClick={() => setIsAddModalOpen(true)}>
              <FiPlus size={15} /> Add Item
            </button>
          </div>
        )}
      </div>

      {/* ══ PO INFO CARD (max 2 rows) ══ */}
      {!poLoading && po && (
        <div className={styles.infoCard}>
          {/* Row 1 */}
          <div className={styles.infoRow}>
            <div className={styles.infoItem}>
              <FiHash size={13} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>PO Number</span>
                <span className={styles.infoValue}>{po.poNumber || '—'}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <FiUser size={13} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Vendor</span>
                <span className={styles.infoValue}>{po.vendorName || '—'}</span>
              </div>
            </div>
            {po.contactPerson && (
              <div className={styles.infoItem}>
                <div>
                  <span className={styles.infoLabel}>Contact</span>
                  <span className={styles.infoValue}>{po.contactPerson}</span>
                </div>
              </div>
            )}
            <div className={styles.infoItem}>
              <FiCalendar size={13} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>PO Date</span>
                <span className={styles.infoValue}>{fmtDate(po.poDate)}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div>
                <span className={styles.infoLabel}>Status</span>
                <span className={`${styles.statusBadgeInline} ${getPoStatusClass(po.status)}`}>
                  {getPoStatusLabel(po.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className={`${styles.infoRow} ${styles.infoRowAmounts}`}>
            {po.clinicName && (
              <div className={styles.infoItem}>
                <FaClinicMedical size={13} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Clinic</span>
                  <span className={styles.infoValue}>{po.clinicName}</span>
                </div>
              </div>
            )}
            {po.branchName && (
              <div className={styles.infoItem}>
                <FiMapPin size={13} className={styles.infoIcon} />
                <div>
                  <span className={styles.infoLabel}>Branch</span>
                  <span className={styles.infoValue}>{po.branchName}</span>
                </div>
              </div>
            )}
            
            <div className={styles.infoItem}>
              <FiDollarSign size={13} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Total Amount</span>
                <span className={styles.infoValue}>{fmt(po.totalAmount)}</span>
              </div>
            </div>
            {po.discount > 0 && (
              <div className={styles.infoItem}>
                <div>
                  <span className={styles.infoLabel}>Discount</span>
                  <span className={`${styles.infoValue} ${styles.discountVal}`}>{po.discount}%</span>
                </div>
              </div>
            )}
            <div className={styles.infoItem}>
              <div>
                <span className={styles.infoLabel}>CGST + SGST</span>
                <span className={styles.infoValue}>{fmt((po.cgstAmount || 0) + (po.sgstAmount || 0))}</span>
              </div>
            </div>
            <div className={styles.infoItem}>
              <div>
                <span className={styles.infoLabel}>Net Amount</span>
                <span className={`${styles.infoValue} ${styles.netAmountVal}`}>{fmt(po.netAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading PO info */}
      {poLoading && (
        <div className={styles.centerState}>
          <div className={styles.spinner} />
          <span>Loading purchase order...</span>
        </div>
      )}

      {/* PO Error */}
      {!poLoading && poError && (
        <div className={`${styles.centerState} ${styles.errorState}`}>
          <FiAlertCircle size={26} />
          <p>{poError.message || 'Something went wrong.'}</p>
          <button className={styles.retryBtn} onClick={fetchPurchaseOrder}>
            <FiRefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* ══ ITEMS TABLE ══ */}
      {!poLoading && po && (
        <>
          {itemLoading ? (
            <div className={styles.centerState}>
              <div className={styles.spinner} />
              <span>Loading items...</span>
            </div>
          ) : itemError ? (
            <div className={`${styles.centerState} ${styles.errorState}`}>
              <FiAlertCircle size={26} />
              <p>{itemError}</p>
              <button className={styles.retryBtn} onClick={fetchItems}>
                <FiRefreshCw size={14} /> Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className={styles.centerState}>
              <FiPackage size={48} className={styles.emptyIcon} />
              <p>No items in this purchase order.</p>
              <button className={styles.addItemBtn} onClick={() => setIsAddModalOpen(true)}>
                <FiPlus size={15} /> Add First Item
              </button>
            </div>
          ) : (
            <>
              <div className={styles.tableCard}>
                <div className={styles.tableCardHeader}>
                  <h3 className={styles.tableCardTitle}>
                    <FiPackage size={16} /> Order Items
                  </h3>
                  <span className={styles.itemCountBadge}>
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Medicine</th>
                        <th>Generic Name</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                        <th>CGST</th>
                        <th>SGST</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.id}>
                          <td className={styles.idxCell}>{idx + 1}</td>
                          <td>
                            <div className={styles.medName}>{item.medicineName || '—'}</div>
                            {item.manufacturer && (
                              <div className={styles.medSub}>{item.manufacturer}</div>
                            )}
                          </td>
                          <td>{item.genericName || <span className={styles.dash}>—</span>}</td>
                          <td>
                            <span className={styles.qtyBadge}>{item.quantity ?? 0}</span>
                          </td>
                          <td className={styles.numCell}>{fmt(item.unitPrice)}</td>
                          <td className={styles.numCell}>
                            <span className={styles.totalAmt}>{fmt(item.amount)}</span>
                          </td>
                          <td className={styles.numCell}>
                            <span className={styles.taxAmt}>{fmt(item.cgstAmount)}</span>
                          </td>
                          <td className={styles.numCell}>
                            <span className={styles.taxAmt}>{fmt(item.sgstAmount)}</span>
                          </td>
                          <td className={styles.numCell}>
                            <span className={styles.netAmt}>{fmt(item.totalLineAmount)}</span>
                          </td>
                          <td>
                            <span className={`${styles.itemStatusBadge} ${getItemStatusClass(item.status)}`}>
                              {getItemStatusLabel(item.status)}
                            </span>
                          </td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button
                                className={styles.editBtn}
                                onClick={() => openUpdateModal(item)}
                                title="Edit item"
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => openDeleteConfirm(item)}
                                title="Delete item"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5} className={styles.footerLabel}>Subtotals</td>
                        <td className={styles.footerCell}>{fmt(totals.amount)}</td>
                        <td className={styles.footerCell}>{fmt(totals.cgst)}</td>
                        <td className={styles.footerCell}>{fmt(totals.sgst)}</td>
                        <td className={styles.footerCell}>{fmt(totals.total)}</td>
                        <td /><td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ── Summary strip ── */}
              <div className={styles.summaryStrip}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Items</span>
                  <span className={styles.summaryValue}>{items.length}</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Subtotal</span>
                  <span className={styles.summaryValue}>{fmt(totals.amount)}</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>CGST + SGST</span>
                  <span className={styles.summaryValue}>{fmt(totals.cgst + totals.sgst)}</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={`${styles.summaryItem} ${styles.grandTotalItem}`}>
                  <span className={styles.summaryLabel}>Grand Total</span>
                  <span className={`${styles.summaryValue} ${styles.grandTotalValue}`}>
                    {fmt(totals.total)}
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ══ DELETE ITEM CONFIRM MODAL ══ */}
      {deleteConfirm.isOpen && (
        <div className={styles.modalOverlay} onClick={!deleteConfirm.submitting ? closeDeleteConfirm : undefined}>
          <div className={styles.delModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.delModalHeader}>
              <div className={styles.delHeaderContent}>
                <h2>Delete Item</h2>
                <span className={styles.delMedBadge}>{deleteConfirm.item?.medicineName}</span>
              </div>
              {!deleteConfirm.submitting && (
                <button className={styles.delCloseBtn} onClick={closeDeleteConfirm}>
                  <FiX size={20} />
                </button>
              )}
            </div>
            <div className={styles.delModalBody}>
              <div className={styles.delWarningStrip}>
                <FiAlertCircle size={18} className={styles.delWarningIcon} />
                <span>
                  Are you sure you want to delete <strong>{deleteConfirm.item?.medicineName}</strong>?
                  This action cannot be undone.
                </span>
              </div>
              {deleteConfirm.error && (
                <div className={styles.delErrorBanner}>
                  <FiAlertCircle size={14} />
                  <span>{deleteConfirm.error}</span>
                </div>
              )}
              {deleteConfirm.submitting && (
                <div className={styles.delProgressBanner}>
                  <div className={styles.delSpinner} />
                  <span>Deleting, please wait...</span>
                </div>
              )}
            </div>
            <div className={styles.delModalFooter}>
              <button
                className={styles.delCancelBtn}
                onClick={closeDeleteConfirm}
                disabled={deleteConfirm.submitting}
              >
                Cancel
              </button>
              <button
                className={styles.delConfirmBtn}
                onClick={handleDeleteItem}
                disabled={deleteConfirm.submitting}
              >
                {deleteConfirm.submitting ? (
                  <><div className={styles.delBtnSpinner} /> Deleting...</>
                ) : (
                  <><FiTrash2 size={15} /> Yes, Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ NEW: DELETE ENTIRE PO CONFIRM MODAL ══ */}
      {deletePOConfirm.isOpen && (
        <div className={styles.modalOverlay} onClick={!deletePOConfirm.submitting ? closeDeletePOConfirm : undefined}>
          <div className={styles.delModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.delModalHeader}>
              <div className={styles.delHeaderContent}>
                <h2>Delete Purchase Order</h2>
                {po?.poNumber && (
                  <span className={styles.delMedBadge}>{po.poNumber}</span>
                )}
              </div>
              {!deletePOConfirm.submitting && (
                <button className={styles.delCloseBtn} onClick={closeDeletePOConfirm}>
                  <FiX size={20} />
                </button>
              )}
            </div>
            <div className={styles.delModalBody}>
              <div className={styles.delWarningStrip}>
                <FiAlertCircle size={18} className={styles.delWarningIcon} />
                <span>
                  Are you sure you want to delete purchase order{' '}
                  <strong>{po?.poNumber}</strong>? All items within this order
                  will also be removed. This action cannot be undone.
                </span>
              </div>
              {deletePOConfirm.error && (
                <div className={styles.delErrorBanner}>
                  <FiAlertCircle size={14} />
                  <span>{deletePOConfirm.error}</span>
                </div>
              )}
              {deletePOConfirm.submitting && (
                <div className={styles.delProgressBanner}>
                  <div className={styles.delSpinner} />
                  <span>Deleting purchase order, please wait...</span>
                </div>
              )}
            </div>
            <div className={styles.delModalFooter}>
              <button
                className={styles.delCancelBtn}
                onClick={closeDeletePOConfirm}
                disabled={deletePOConfirm.submitting}
              >
                No, Cancel
              </button>
              <button
                className={styles.delConfirmBtn}
                onClick={handleDeletePO}
                disabled={deletePOConfirm.submitting}
              >
                {deletePOConfirm.submitting ? (
                  <><div className={styles.delBtnSpinner} /> Deleting...</>
                ) : (
                  <><FiTrash2 size={15} /> Yes, Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ADD PURCHASE ORDER DETAIL MODAL ══ */}
      <AddPurchaseOrderDetail
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSuccess={handleAddSuccess}
        preselectedPOID={id}
      />

      {/* ══ UPDATE PURCHASE ORDER DETAIL MODAL ══ */}
      {updateModal.item && (
        <UpdatePurchaseOrderDetail
          isOpen={updateModal.isOpen}
          onClose={closeUpdateModal}
          onUpdateSuccess={handleUpdateSuccess}
          item={updateModal.item}
        />
      )}
    </div>
  );
};

export default PurchaseOrderDetailList;