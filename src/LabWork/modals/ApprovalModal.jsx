// src/components/LabWorkManagement/modals/ApprovalModal.jsx
import React, { useState } from 'react';
import { FiX, FiCheckCircle, FiUser } from 'react-icons/fi';
import { approveLabWorkItem } from '../../api/api-labtest.js';
import styles from '../LabWorkManagement.module.css';

const ApprovalModal = ({ workItem, employeeList, onClose, onSuccess, setLoading }) => {
  const [formData, setFormData] = useState({
    testApprovedBy: 0,
    approvalRemarks: ''
  });

  // Filter employees to show only doctors
  const doctorList = employeeList.filter(emp => 
    emp.designation === 1 || emp.status === 'active'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.testApprovedBy || formData.testApprovedBy === 0) {
      alert('Please select an approver');
      return;
    }

    try {
      setLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await approveLabWorkItem({
        workId: workItem.workId,
        clinicId,
        branchId,
        testApprovedBy: formData.testApprovedBy,
        approvalRemarks: formData.approvalRemarks
      });

      alert('Work item approved successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error approving work item:', err);
      alert(err.message || 'Failed to approve work item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <FiCheckCircle size={24} style={{ marginRight: '10px' }} />
            Approve Test Result
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
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
              {workItem.normalRange && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Normal Range:</span>
                  <span className={styles.infoValue}>{workItem.normalRange}</span>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>
                  <FiUser size={16} />
                  Approved By *
                </label>
                <select
                  value={formData.testApprovedBy}
                  onChange={(e) => setFormData({ ...formData, testApprovedBy: Number(e.target.value) })}
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
                <label className={styles.formLabel}>Approval Remarks</label>
                <textarea
                  value={formData.approvalRemarks}
                  onChange={(e) => setFormData({ ...formData, approvalRemarks: e.target.value })}
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Enter any approval remarks..."
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.approveBtn}>
              <FiCheckCircle size={18} />
              Approve
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

export default ApprovalModal;