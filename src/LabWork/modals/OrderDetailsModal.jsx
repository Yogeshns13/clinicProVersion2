// src/components/LabWorkManagement/modals/OrderDetailsModal.jsx
import React from 'react';
import { FiX } from 'react-icons/fi';
import styles from '../LabWorkManagement.module.css';

const OrderDetailsModal = ({ order, onClose }) => {
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Order Details</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={24} />
          </button>
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
              <label>Patient ID:</label>
              <span>{order.patientId}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Doctor Name:</label>
              <span>{order.doctorFullName}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Doctor Code:</label>
              <span>{order.doctorCode || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Doctor ID:</label>
              <span>{order.doctorId}</span>
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
              <label>File ID:</label>
              <span>{order.fileId || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Date Created:</label>
              <span>{formatDateTime(order.dateCreated)}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Date Modified:</label>
              <span>{formatDateTime(order.dateModified)}</span>
            </div>

            <div className={styles.detailItemFull}>
              <label>Notes:</label>
              <span>{order.notes || 'No notes'}</span>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;