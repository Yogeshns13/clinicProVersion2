// src/components/LabWork/LabWorkDetail.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiX, FiSave, FiCheckCircle, FiXCircle, FiClock, FiActivity, 
  FiUser, FiFileText, FiAlertCircle 
} from 'react-icons/fi';
import { 
  updateSampleCollection,
  updateLabWorkItemResult,
  approveLabWorkItem,
  rejectLabWorkItem,
} from '../api/api-labtest.js';
import { getEmployeeList } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import styles from './LabWorkDetail.module.css';

const LabWorkDetail = ({ workItem, orderData, onClose, onSave }) => {
  // Form States
  const [sampleData, setSampleData] = useState({
    sampleCollectedTime: workItem.sampleCollectedTime 
      ? new Date(workItem.sampleCollectedTime).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    sampleCollectedPlace: workItem.sampleCollectedPlace || ''
  });

  const [resultData, setResultData] = useState({
    resultValue: workItem.resultValue || '',
    resultUnits: workItem.resultUnits || '',
    normalRange: workItem.normalRange || '',
    interpretation: workItem.interpretation || null,
    remarks: '',
    testDoneBy: 0
  });

  const [approvalData, setApprovalData] = useState({
    testApprovedBy: 0,
    approvalRemarks: ''
  });

  const [rejectionData, setRejectionData] = useState({
    testApprovedBy: 0,
    rejectReason: ''
  });

  // UI States
  const [activeStep, setActiveStep] = useState(1); // 1: Sample, 2: Result, 3: Approval
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Interpretation options
  const interpretationOptions = [
    { value: null, label: 'Not specified' },
    { value: 1, label: 'Normal' },
    { value: 2, label: 'Abnormal - High' },
    { value: 3, label: 'Abnormal - Low' },
    { value: 4, label: 'Critical' }
  ];

  // Fetch employees for approval
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));
      
      const data = await getEmployeeList(clinicId, {
        Page: 1,
        PageSize: 100,
        BranchID: branchId,
        Designation: 1, // Assuming 1 is for doctors
        Status: 1 // Active employees only
      });
      
      setEmployees(data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError({ message: 'Failed to load doctors list' });
    }
  };

  // Determine which step to start on based on work item status
  useEffect(() => {
    if (!workItem.sampleCollectedTime) {
      setActiveStep(1);
    } else if (!workItem.resultValue) {
      setActiveStep(2);
    } else {
      setActiveStep(3);
    }
  }, [workItem]);

  // Handle Sample Collection Save
  const handleSampleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      // Convert datetime-local to SQL datetime format
      const formattedDateTime = sampleData.sampleCollectedTime.replace('T', ' ') + ':00';

      await updateSampleCollection({
        workId: workItem.workId,
        clinicId,
        branchId,
        sampleCollectedTime: formattedDateTime,
        sampleCollectedPlace: sampleData.sampleCollectedPlace
      });

      alert('Sample collection details saved successfully!');
      setActiveStep(2); // Move to results entry
      onSave && onSave();
    } catch (err) {
      console.error('Error saving sample collection:', err);
      setError(err);
      alert(err.message || 'Failed to save sample collection');
    } finally {
      setLoading(false);
    }
  };

  // Handle Result Save
  const handleResultSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await updateLabWorkItemResult({
        workId: workItem.workId,
        clinicId,
        branchId,
        resultValue: resultData.resultValue,
        resultUnits: resultData.resultUnits,
        normalRange: resultData.normalRange,
        interpretation: resultData.interpretation,
        remarks: resultData.remarks,
        testDoneBy: resultData.testDoneBy
      });

      alert('Test results saved successfully!');
      setActiveStep(3); // Move to approval
      onSave && onSave();
    } catch (err) {
      console.error('Error saving results:', err);
      setError(err);
      alert(err.message || 'Failed to save results');
    } finally {
      setLoading(false);
    }
  };

  // Handle Approval
  const handleApprove = async () => {
    try {
      if (!approvalData.testApprovedBy) {
        alert('Please select an approver');
        return;
      }

      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await approveLabWorkItem({
        workId: workItem.workId,
        clinicId,
        branchId,
        testApprovedBy: approvalData.testApprovedBy,
        approvalRemarks: approvalData.approvalRemarks
      });

      alert('Work item approved successfully!');
      setShowApprovalModal(false);
      onSave && onSave();
      onClose && onClose();
    } catch (err) {
      console.error('Error approving work item:', err);
      setError(err);
      alert(err.message || 'Failed to approve work item');
    } finally {
      setLoading(false);
    }
  };

  // Handle Rejection
  const handleReject = async () => {
    try {
      if (!rejectionData.testApprovedBy) {
        alert('Please select an approver');
        return;
      }

      if (!rejectionData.rejectReason.trim()) {
        alert('Please provide a reason for rejection');
        return;
      }

      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await rejectLabWorkItem({
        WorkID: workItem.workId,
        clinicId,
        branchID: branchId,
        TestApprovedBy: rejectionData.testApprovedBy,
        RejectReason: rejectionData.rejectReason
      });

      alert('Work item rejected successfully!');
      setShowRejectionModal(false);
      onSave && onSave();
      onClose && onClose();
    } catch (err) {
      console.error('Error rejecting work item:', err);
      setError(err);
      alert(err.message || 'Failed to reject work item');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step) => {
    if (step < activeStep) return 'completed';
    if (step === activeStep) return 'active';
    return 'pending';
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <ErrorHandler error={error} />
        
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2>Process Lab Work Item</h2>
            <div className={styles.headerMeta}>
              <span className={styles.workIdBadge}>Work ID: #{workItem.workId}</span>
              <span className={styles.orderIdBadge}>Order ID: #{workItem.orderId}</span>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <FiX size={24} />
          </button>
        </div>

        {/* Patient & Test Info */}
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <FiUser size={18} />
              <h3>Patient Information</h3>
            </div>
            <div className={styles.infoContent}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Name:</span>
                <span className={styles.infoValue}>{orderData.patientName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>File No:</span>
                <span className={styles.infoValue}>{orderData.fileNo}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Mobile:</span>
                <span className={styles.infoValue}>{orderData.mobile}</span>
              </div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoHeader}>
              <FiActivity size={18} />
              <h3>Test Information</h3>
            </div>
            <div className={styles.infoContent}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Test Name:</span>
                <span className={styles.infoValue}>{workItem.testName}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Test ID:</span>
                <span className={styles.infoValue}>{workItem.testId}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Doctor:</span>
                <span className={styles.infoValue}>{orderData.doctorName || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className={styles.stepsContainer}>
          <div className={`${styles.step} ${styles[getStepStatus(1)]}`}>
            <div className={styles.stepIcon}>
              {getStepStatus(1) === 'completed' ? <FiCheckCircle size={20} /> : <FiClock size={20} />}
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Sample Collection</div>
              <div className={styles.stepDesc}>Record collection details</div>
            </div>
          </div>

          <div className={styles.stepConnector}></div>

          <div className={`${styles.step} ${styles[getStepStatus(2)]}`}>
            <div className={styles.stepIcon}>
              {getStepStatus(2) === 'completed' ? <FiCheckCircle size={20} /> : <FiFileText size={20} />}
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Enter Results</div>
              <div className={styles.stepDesc}>Record test results</div>
            </div>
          </div>

          <div className={styles.stepConnector}></div>

          <div className={`${styles.step} ${styles[getStepStatus(3)]}`}>
            <div className={styles.stepIcon}>
              {getStepStatus(3) === 'completed' ? <FiCheckCircle size={20} /> : <FiCheckCircle size={20} />}
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Approval</div>
              <div className={styles.stepDesc}>Review and approve</div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className={styles.modalBody}>
          {/* Step 1: Sample Collection */}
          {activeStep === 1 && (
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <FiClock size={20} />
                <h3>Sample Collection Details</h3>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Collection Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={sampleData.sampleCollectedTime}
                    onChange={(e) => setSampleData({...sampleData, sampleCollectedTime: e.target.value})}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Collection Place</label>
                  <input
                    type="text"
                    value={sampleData.sampleCollectedPlace}
                    onChange={(e) => setSampleData({...sampleData, sampleCollectedPlace: e.target.value})}
                    className={styles.formInput}
                    placeholder="e.g., Lab Room 1, Patient Room"
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button 
                  onClick={handleSampleSave} 
                  className={styles.saveBtn}
                  disabled={loading}
                >
                  <FiSave size={18} />
                  {loading ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Results Entry */}
          {activeStep === 2 && (
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <FiFileText size={20} />
                <h3>Test Results Entry</h3>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Result Value *</label>
                  <input
                    type="text"
                    value={resultData.resultValue}
                    onChange={(e) => setResultData({...resultData, resultValue: e.target.value})}
                    className={styles.formInput}
                    placeholder="e.g., 120"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Result Units</label>
                  <input
                    type="text"
                    value={resultData.resultUnits}
                    onChange={(e) => setResultData({...resultData, resultUnits: e.target.value})}
                    className={styles.formInput}
                    placeholder="e.g., mg/dL, mmol/L"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Normal Range</label>
                  <input
                    type="text"
                    value={resultData.normalRange}
                    onChange={(e) => setResultData({...resultData, normalRange: e.target.value})}
                    className={styles.formInput}
                    placeholder="e.g., 70-100"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Interpretation</label>
                  <select
                    value={resultData.interpretation || ''}
                    onChange={(e) => setResultData({...resultData, interpretation: e.target.value ? Number(e.target.value) : null})}
                    className={styles.formInput}
                  >
                    {interpretationOptions.map(opt => (
                      <option key={opt.value} value={opt.value || ''}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Test Done By</label>
                  <select
                    value={resultData.testDoneBy}
                    onChange={(e) => setResultData({...resultData, testDoneBy: Number(e.target.value)})}
                    className={styles.formInput}
                  >
                    <option value={0}>Select Technician</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroupFull}>
                  <label>Remarks</label>
                  <textarea
                    value={resultData.remarks}
                    onChange={(e) => setResultData({...resultData, remarks: e.target.value})}
                    className={styles.formTextarea}
                    rows={3}
                    placeholder="Any additional notes or observations..."
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button 
                  onClick={() => setActiveStep(1)} 
                  className={styles.backBtn}
                >
                  ← Back
                </button>
                <button 
                  onClick={handleResultSave} 
                  className={styles.saveBtn}
                  disabled={loading || !resultData.resultValue}
                >
                  <FiSave size={18} />
                  {loading ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Approval */}
          {activeStep === 3 && (
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <FiCheckCircle size={20} />
                <h3>Review & Approval</h3>
              </div>

              <div className={styles.reviewSection}>
                <div className={styles.reviewCard}>
                  <h4>Sample Collection</h4>
                  <div className={styles.reviewRow}>
                    <span>Date & Time:</span>
                    <strong>
                      {workItem.sampleCollectedTime 
                        ? new Date(workItem.sampleCollectedTime).toLocaleString()
                        : 'Not recorded'}
                    </strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span>Place:</span>
                    <strong>{workItem.sampleCollectedPlace || 'Not specified'}</strong>
                  </div>
                </div>

                <div className={styles.reviewCard}>
                  <h4>Test Results</h4>
                  <div className={styles.reviewRow}>
                    <span>Value:</span>
                    <strong>{workItem.resultValue || resultData.resultValue || 'Not entered'} {workItem.resultUnits || resultData.resultUnits}</strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span>Normal Range:</span>
                    <strong>{workItem.normalRange || resultData.normalRange || 'Not specified'}</strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span>Interpretation:</span>
                    <strong>
                      {interpretationOptions.find(opt => opt.value === (workItem.interpretation || resultData.interpretation))?.label || 'Not specified'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className={styles.formActions}>
                <button 
                  onClick={() => setActiveStep(2)} 
                  className={styles.backBtn}
                >
                  ← Back
                </button>
                <button 
                  onClick={() => setShowRejectionModal(true)} 
                  className={styles.rejectBtn}
                >
                  <FiXCircle size={18} />
                  Reject
                </button>
                <button 
                  onClick={() => setShowApprovalModal(true)} 
                  className={styles.approveBtn}
                >
                  <FiCheckCircle size={18} />
                  Approve
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Approval Modal */}
        {showApprovalModal && (
          <div className={styles.confirmOverlay} onClick={() => setShowApprovalModal(false)}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmHeader}>
                <h3>Approve Work Item</h3>
                <button onClick={() => setShowApprovalModal(false)} className={styles.confirmCloseBtn}>
                  <FiX size={20} />
                </button>
              </div>
              <div className={styles.confirmBody}>
                <div className={styles.formGroup}>
                  <label>Approved By *</label>
                  <select
                    value={approvalData.testApprovedBy}
                    onChange={(e) => setApprovalData({...approvalData, testApprovedBy: Number(e.target.value)})}
                    className={styles.formInput}
                    required
                  >
                    <option value={0}>Select Doctor</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Approval Remarks</label>
                  <textarea
                    value={approvalData.approvalRemarks}
                    onChange={(e) => setApprovalData({...approvalData, approvalRemarks: e.target.value})}
                    className={styles.formTextarea}
                    rows={3}
                    placeholder="Optional remarks..."
                  />
                </div>
              </div>
              <div className={styles.confirmFooter}>
                <button onClick={() => setShowApprovalModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button onClick={handleApprove} className={styles.confirmApproveBtn} disabled={loading}>
                  <FiCheckCircle size={18} />
                  {loading ? 'Approving...' : 'Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectionModal && (
          <div className={styles.confirmOverlay} onClick={() => setShowRejectionModal(false)}>
            <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.confirmHeader}>
                <h3>Reject Work Item</h3>
                <button onClick={() => setShowRejectionModal(false)} className={styles.confirmCloseBtn}>
                  <FiX size={20} />
                </button>
              </div>
              <div className={styles.confirmBody}>
                <div className={styles.formGroup}>
                  <label>Rejected By *</label>
                  <select
                    value={rejectionData.testApprovedBy}
                    onChange={(e) => setRejectionData({...rejectionData, testApprovedBy: Number(e.target.value)})}
                    className={styles.formInput}
                    required
                  >
                    <option value={0}>Select Doctor</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Rejection Reason *</label>
                  <textarea
                    value={rejectionData.rejectReason}
                    onChange={(e) => setRejectionData({...rejectionData, rejectReason: e.target.value})}
                    className={styles.formTextarea}
                    rows={4}
                    placeholder="Please provide a detailed reason for rejection..."
                    required
                  />
                </div>
              </div>
              <div className={styles.confirmFooter}>
                <button onClick={() => setShowRejectionModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button onClick={handleReject} className={styles.confirmRejectBtn} disabled={loading}>
                  <FiXCircle size={18} />
                  {loading ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabWorkDetail;