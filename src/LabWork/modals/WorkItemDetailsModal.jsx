// src/components/LabWorkManagement/modals/WorkItemDetailsModal.jsx
import React from 'react';
import { FiX } from 'react-icons/fi';
import styles from '../LabWorkManagement.module.css';

const WorkItemDetailsModal = ({ workItem, onClose }) => {
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

  const getInterpretationLabel = (interpretation) => {
    const interpretationMap = {
      1: 'Normal',
      2: 'Abnormal',
      3: 'Critical'
    };
    return interpretationMap[interpretation] || '—';
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Work Item Details</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <label>Work ID:</label>
              <span>#{workItem.workId}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Order ID:</label>
              <span>#{workItem.orderId}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Item ID:</label>
              <span>{workItem.itemId}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Patient ID:</label>
              <span>{workItem.patientId}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Patient Name:</label>
              <span>{workItem.patientName}</span>
            </div>

            <div className={styles.detailItem}>
              <label>File No:</label>
              <span>{workItem.fileNo || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Mobile:</label>
              <span>{workItem.mobile || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Test ID:</label>
              <span>{workItem.testId}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Test Name:</label>
              <span>{workItem.testName}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Result Value:</label>
              <span>{workItem.resultValue || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Result Units:</label>
              <span>{workItem.resultUnits || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Normal Range:</label>
              <span>{workItem.normalRange || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Interpretation:</label>
              <span>{getInterpretationLabel(workItem.interpretation)}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Priority:</label>
              <span>{workItem.priority === 1 ? 'Normal' : workItem.priority === 2 ? 'Urgent' : 'STAT'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Sample Collected Time:</label>
              <span>{formatDateTime(workItem.sampleCollectedTime)}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Collection Place:</label>
              <span>{workItem.sampleCollectedPlace || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Result Entered Time:</label>
              <span>{formatDateTime(workItem.resultEnteredTime)}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Technician:</label>
              <span>{workItem.technicianName || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Approver:</label>
              <span>{workItem.approverName || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Doctor:</label>
              <span>{workItem.doctorName || '—'}</span>
            </div>

            <div className={styles.detailItem}>
              <label>Status:</label>
              <span>
                {workItem.status === 1 ? 'Sample Pending' :
                 workItem.status === 2 ? 'Sample Collected' :
                 workItem.status === 3 ? 'Result Entered' :
                 workItem.status === 4 ? 'Approved' :
                 workItem.status === 5 ? 'Rejected' : 'Unknown'}
              </span>
            </div>

            <div className={styles.detailItem}>
              <label>Date Created:</label>
              <span>{formatDateTime(workItem.dateCreated)}</span>
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

export default WorkItemDetailsModal;