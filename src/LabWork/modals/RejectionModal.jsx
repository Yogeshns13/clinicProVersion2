// src/components/LabWorkManagement/modals/RejectionModal.jsx
import React, { useState } from 'react';
import { FiX, FiXCircle, FiUser, FiAlertTriangle } from 'react-icons/fi';
import { rejectLabWorkItem } from '../../api/api-labtest.js';
import styles from '../LabWorkManagement.module.css';

const RejectionModal = ({ workItem, employeeList, onClose, onSuccess, setLoading }) => {
  const [formData, setFormData] = useState({
    TestApprovedBy: 0,
    RejectReason: ''
  });

  // Filter employees to show only doctors
  const doctorList = employeeList.filter(emp => 
    emp.designation === 1 || emp.status === 'active'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.TestApprovedBy || formData.TestApprovedBy === 0) {
      alert('Please select who is rejecting this test');
      return;
    }

    if (!formData.RejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await rejectLabWorkItem({
        WorkID: workItem.workId,
        clinicId,
        branchID: branchId,
        TestApprovedBy: formData.TestApprovedBy,
        RejectReason: formData.RejectReason
      });

      alert('Work item rejected successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error rejecting work item:', err);
      alert(err.message || 'Failed to reject work item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader} style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}>
          <h2>
            <FiXCircle size={24} style={{ marginRight: '10px' }} />
            Reject Test Result
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Warning Banner */}
            <div className={styles.warningBanner}>
              <FiAlertTriangle size={20} />
              <p>
                You are about to reject this test result. This action will require the test to be redone.
              </p>
            </div>

            {/* Work Item Info */}
            <div className={styles.infoSection}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Work ID:</span>
                <span className={styles.infoValue}>#{workItem.workId}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Patient:</span>
                <span className={styles.infoValue}>{workItem.patientName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Test:</span>
                <span className={styles.infoValue}>{workItem.testName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Result:</span>
                <span className={styles.infoValue}>
                  {workItem.resultValue} {workItem.resultUnits || ''}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>
                  <FiUser size={16} />
                  Rejected By *
                </label>
                <select
                  value={formData.TestApprovedBy}
                  onChange={(e) => setFormData({ ...formData, TestApprovedBy: Number(e.target.value) })}
                  className={styles.formInput}
                  required
                >
                  <option value={0}>Select Doctor</option>
                  {doctorList.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.designationDesc}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>
                  Reason for Rejection *
                </label>
                <textarea
                  value={formData.RejectReason}
                  onChange={(e) => setFormData({ ...formData, RejectReason: e.target.value })}
                  className={styles.formTextarea}
                  rows={4}
                  placeholder="Please provide a detailed reason for rejection..."
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.rejectBtn}>
              <FiXCircle size={18} />
              Reject Test
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

export default RejectionModal;