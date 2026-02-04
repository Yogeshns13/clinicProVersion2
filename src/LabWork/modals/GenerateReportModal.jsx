// src/components/LabWorkManagement/modals/GenerateReportModal.jsx
import React, { useState } from 'react';
import { FiX, FiFileText, FiUser, FiCalendar } from 'react-icons/fi';
import { addLabTestReport } from '../../api/api-labtest.js';
import styles from '../LabWorkManagement.module.css';

const GenerateReportModal = ({ order, employeeList, onClose, onSuccess, setLoading }) => {
  const [formData, setFormData] = useState({
    verifiedBy: 0,
    verifiedDateTime: '',
    remarks: ''
  });

  // Filter employees to show only doctors
  const doctorList = employeeList.filter(emp => 
    emp.designation === 1 || emp.status === 'active'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.verifiedBy || formData.verifiedBy === 0) {
      alert('Please select who verified the report');
      return;
    }

    if (!formData.verifiedDateTime) {
      alert('Please enter verification date and time');
      return;
    }

    try {
      setLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      // Format datetime for API (YYYY-MM-DD HH:mm:ss)
      const verifiedDateTime = formData.verifiedDateTime.replace('T', ' ') + ':00';

      const response = await addLabTestReport({
        orderId: order.id,
        clinicId,
        branchId,
        consultationId: order.consultationId,
        visitId: order.visitId,
        patientId: order.patientId,
        doctorId: order.doctorId,
        fileId: 0,
        verifiedBy: formData.verifiedBy,
        verifiedDateTime: verifiedDateTime,
        remarks: formData.remarks
      });

      alert(`Report generated successfully! Report ID: ${response.reportId}`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error generating report:', err);
      alert(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>
            <FiFileText size={24} style={{ marginRight: '10px' }} />
            Generate Lab Test Report
          </h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {/* Order Info */}
            <div className={styles.infoSection}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Order ID:</span>
                <span className={styles.infoValue}>#{order.id}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Patient:</span>
                <span className={styles.infoValue}>{order.patientName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Patient File No:</span>
                <span className={styles.infoValue}>{order.patientFileNo}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Doctor:</span>
                <span className={styles.infoValue}>{order.doctorFullName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Order Date:</span>
                <span className={styles.infoValue}>
                  {new Date(order.dateCreated).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>
                  <FiUser size={16} />
                  Verified By *
                </label>
                <select
                  value={formData.verifiedBy}
                  onChange={(e) => setFormData({ ...formData, verifiedBy: Number(e.target.value) })}
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
                  <FiCalendar size={16} />
                  Verification Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.verifiedDateTime}
                  onChange={(e) => setFormData({ ...formData, verifiedDateTime: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Report Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className={styles.formTextarea}
                  rows={4}
                  placeholder="Enter any additional remarks for the report..."
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.generateBtn}>
              <FiFileText size={18} />
              Generate Report
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

export default GenerateReportModal;