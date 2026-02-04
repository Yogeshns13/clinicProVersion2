// src/components/LabWorkManagement/modals/ResultEntryModal.jsx
import React, { useState } from 'react';
import { FiX, FiActivity, FiUser } from 'react-icons/fi';
import { updateLabWorkItemResult } from '../../api/api-labtest.js';
import styles from '../LabWorkManagement.module.css';

const ResultEntryModal = ({ workItem, employeeList, onClose, onSuccess, setLoading }) => {
  const [formData, setFormData] = useState({
    resultValue: workItem.resultValue || '',
    resultUnits: workItem.resultUnits || '',
    normalRange: workItem.normalRange || '',
    interpretation: workItem.interpretation || null,
    remarks: '',
    testDoneBy: 0
  });

  // Filter employees to show only technicians/lab staff
  const technicianList = employeeList.filter(emp => 
    emp.designation === 3 || emp.designation === 4 || emp.status === 'active'
  );

  const interpretationOptions = [
    { value: null, label: 'Select Interpretation' },
    { value: 1, label: 'Normal' },
    { value: 2, label: 'Abnormal' },
    { value: 3, label: 'Critical' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.resultValue) {
      alert('Please enter the result value');
      return;
    }

    try {
      setLoading(true);
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await updateLabWorkItemResult({
        workId: workItem.workId,
        clinicId,
        branchId,
        resultValue: formData.resultValue,
        resultUnits: formData.resultUnits,
        normalRange: formData.normalRange,
        interpretation: formData.interpretation,
        remarks: formData.remarks,
        testDoneBy: formData.testDoneBy
      });

      alert('Result updated successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating result:', err);
      alert(err.message || 'Failed to update result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Enter Test Result</h2>
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
              {workItem.sampleCollectedTime && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Sample Collected:</span>
                  <span className={styles.infoValue}>
                    {new Date(workItem.sampleCollectedTime).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FiActivity size={16} />
                  Result Value *
                </label>
                <input
                  type="text"
                  value={formData.resultValue}
                  onChange={(e) => setFormData({ ...formData, resultValue: e.target.value })}
                  className={styles.formInput}
                  placeholder="e.g., 120, 5.5, Positive"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Result Units</label>
                <input
                  type="text"
                  value={formData.resultUnits}
                  onChange={(e) => setFormData({ ...formData, resultUnits: e.target.value })}
                  className={styles.formInput}
                  placeholder="e.g., mg/dL, mmol/L"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Normal Range</label>
                <input
                  type="text"
                  value={formData.normalRange}
                  onChange={(e) => setFormData({ ...formData, normalRange: e.target.value })}
                  className={styles.formInput}
                  placeholder="e.g., 70-110, <200"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Interpretation</label>
                <select
                  value={formData.interpretation ?? ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    interpretation: e.target.value ? Number(e.target.value) : null 
                  })}
                  className={styles.formInput}
                >
                  {interpretationOptions.map(opt => (
                    <option key={opt.value} value={opt.value ?? ''}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FiUser size={16} />
                  Test Done By
                </label>
                <select
                  value={formData.testDoneBy}
                  onChange={(e) => setFormData({ ...formData, testDoneBy: Number(e.target.value) })}
                  className={styles.formInput}
                >
                  <option value={0}>Select Technician</option>
                  {technicianList.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.designationDesc}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Enter any additional remarks..."
                />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="submit" className={styles.submitBtn}>
              Save Result
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

export default ResultEntryModal;