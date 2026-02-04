// src/components/LabWorkManagement/modals/ConfirmMakeWorkModal.jsx
import React from 'react';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import styles from '../LabWorkManagement.module.css';

const ConfirmMakeWorkModal = ({ order, onClose, onConfirm }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Confirm Create Work Items</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.confirmIcon}>
            <FiAlertCircle size={48} color="#0284c7" />
          </div>

          <p className={styles.confirmMessage}>
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

          <p className={styles.confirmNote}>
            This will create individual work items for each test in this order.
          </p>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onConfirm} className={styles.confirmBtn}>
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

export default ConfirmMakeWorkModal;