// src/components/LabWork/ViewWorkItem.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FiX, FiClock, FiFileText, FiCheckCircle, FiUser, FiActivity,
  FiEdit2, FiSave, FiXCircle, FiChevronRight, FiChevronLeft
} from 'react-icons/fi';
import { FaClinicMedical } from 'react-icons/fa';
import {
  updateSampleCollection,
  updateLabWorkItemResult,
  approveLabWorkItem,
  rejectLabWorkItem,
  getLabTestMasterList
} from '../Api/ApiLabTests.js';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import styles from './LabWorkQueue.module.css';
import vstyles from './ViewWorkItem.module.css';

// ─── Hook: 2-second button cooldown ───────────────────────────────────────────
const useButtonCooldown = () => {
  const [cooldowns, setCooldowns] = useState({});
  const timers = useRef({});

  const trigger = (key) => {
    setCooldowns(prev => ({ ...prev, [key]: true }));
    if (timers.current[key]) clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => {
      setCooldowns(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const isDisabled = (key) => !!cooldowns[key];

  useEffect(() => () => {
    Object.values(timers.current).forEach(clearTimeout);
  }, []);

  return { trigger, isDisabled };
};

// ─── ViewWorkItem Component ───────────────────────────────────────────────────
const ViewWorkItem = ({ workItem, orderData, orderStatus, onClose, employees, showPopupMsg }) => {
  const cooldown = useButtonCooldown();
  const [showUpdateMode, setShowUpdateMode] = useState(false);

  // Hide Update button when the order is marked as complete (orderStatus === 2)
  const isOrderComplete = orderStatus === 2;

  const interpretationOptions = [
    { value: null,  label: 'Not specified'   },
    { value: 1,     label: 'Normal'          },
    { value: 2,     label: 'Abnormal - High' },
    { value: 3,     label: 'Abnormal - Low'  },
    { value: 4,     label: 'Critical'        }
  ];

  const statusOptions = [
    { id: -1, label: 'All Statuses', color: 'default'  },
    { id: 1,  label: 'Pending',      color: 'warning'  },
    { id: 2,  label: 'In Progress',  color: 'progress' },
    { id: 3,  label: 'Completed',    color: 'success'  },
    { id: 4,  label: 'Rejected',     color: 'danger'   }
  ];

  const getStatusBadgeClass = (color) => styles[`status${color}`] || styles.statusDefault;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const statusInfo = statusOptions.find(s => s.id === workItem.status);

  // ── View Details Panel ────────────────────────────────────────────────────
  const ViewDetailsPanel = () => (
    <div className={vstyles.viewBody}>
      {/* Patient + Test Info */}
      <div className={vstyles.infoGrid}>
        <div className={vstyles.infoCard}>
          <div className={vstyles.infoCardHeader}>
            <FiUser size={16} />
            <span>Patient Information</span>
          </div>
          <div className={vstyles.infoRows}>
            <div className={vstyles.infoRow}>
              <span className={vstyles.infoLabel}>Name</span>
              <span className={vstyles.infoValue}>{orderData.patientName}</span>
            </div>
            <div className={vstyles.infoRow}>
              <span className={vstyles.infoLabel}>File No</span>
              <span className={vstyles.infoValue}>{orderData.fileNo || '—'}</span>
            </div>
            <div className={vstyles.infoRow}>
              <span className={vstyles.infoLabel}>Mobile</span>
              <span className={vstyles.infoValue}>{orderData.mobile || '—'}</span>
            </div>
          </div>
        </div>
        <div className={vstyles.infoCard}>
          <div className={vstyles.infoCardHeader}>
            <FiActivity size={16} />
            <span>Test Information</span>
          </div>
          <div className={vstyles.infoRows}>
            <div className={vstyles.infoRow}>
              <span className={vstyles.infoLabel}>Test Name</span>
              <span className={vstyles.infoValue}>{workItem.testName}</span>
            </div>
            <div className={vstyles.infoRow}>
              <span className={vstyles.infoLabel}>Doctor</span>
              <span className={vstyles.infoValue}>{orderData.doctorName || 'N/A'}</span>
            </div>
            <div className={vstyles.infoRow}>
              <span className={vstyles.infoLabel}>Status</span>
              <span>
                <span className={`${styles.badge} ${getStatusBadgeClass(statusInfo?.color || 'default')}`}>
                  {statusInfo?.label || 'Unknown'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Collection */}
      <div className={vstyles.detailSection}>
        <div className={vstyles.detailSectionHeader}>
          <FiClock size={16} />
          <span>Sample Collection</span>
        </div>
        <div className={vstyles.detailGrid}>
          <div className={vstyles.detailField}>
            <span className={vstyles.fieldLabel}>Collection Date & Time</span>
            <span className={vstyles.fieldValue}>
              {workItem.sampleCollectedTime ? formatDate(workItem.sampleCollectedTime) : <em className={vstyles.notSet}>Not recorded</em>}
            </span>
          </div>
          <div className={vstyles.detailField}>
            <span className={vstyles.fieldLabel}>Collection Place</span>
            <span className={vstyles.fieldValue}>
              {workItem.sampleCollectedPlace || <em className={vstyles.notSet}>Not specified</em>}
            </span>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className={vstyles.detailSection}>
        <div className={vstyles.detailSectionHeader}>
          <FiFileText size={16} />
          <span>Test Results</span>
        </div>
        <div className={vstyles.detailGrid}>
          <div className={vstyles.detailField}>
            <span className={vstyles.fieldLabel}>Result Value</span>
            <span className={vstyles.fieldValue}>
              {workItem.resultValue
                ? <>{workItem.resultValue} <span className={vstyles.unitTag}>{workItem.resultUnits || ''}</span></>
                : <em className={vstyles.notSet}>Not entered</em>}
            </span>
          </div>
          <div className={vstyles.detailField}>
            <span className={vstyles.fieldLabel}>Normal Range</span>
            <span className={vstyles.fieldValue}>{workItem.normalRange || <em className={vstyles.notSet}>Not specified</em>}</span>
          </div>
          <div className={vstyles.detailField}>
            <span className={vstyles.fieldLabel}>Interpretation</span>
            <span className={vstyles.fieldValue}>
              {interpretationOptions.find(o => o.value === workItem.interpretation)?.label || <em className={vstyles.notSet}>Not specified</em>}
            </span>
          </div>
          <div className={vstyles.detailField}>
            <span className={vstyles.fieldLabel}>Technician</span>
            <span className={vstyles.fieldValue}>{workItem.technicianName || <em className={vstyles.notSet}>Not recorded</em>}</span>
          </div>
        </div>
      </div>

      {/* Approval */}
      <div className={vstyles.detailSection}>
        <div className={vstyles.detailSectionHeader}>
          <FiCheckCircle size={16} />
          <span>Approval</span>
        </div>
        <div className={vstyles.detailGrid}>
          <div className={vstyles.detailField}>
            <span className={vstyles.fieldLabel}>Approved By</span>
            <span className={vstyles.fieldValue}>{workItem.approverName || <em className={vstyles.notSet}>Not recorded</em>}</span>
          </div>
          <div className={vstyles.detailField}>
            <span className={vstyles.fieldLabel}>Result Entered Time</span>
            <span className={vstyles.fieldValue}>
              {workItem.resultEnteredTime ? formatDate(workItem.resultEnteredTime) : <em className={vstyles.notSet}>—</em>}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={vstyles.viewActions}>
        {!isOrderComplete && (
          <button
            className={vstyles.updateBtn}
            onClick={() => setShowUpdateMode(true)}
          >
            <FiEdit2 size={16} /> Update
          </button>
        )}
        <button className={vstyles.closeActionBtn} onClick={() => onClose()}>
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.detailModalOverlay}>
      <div className={vstyles.viewModal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={vstyles.viewHeader}>
          <div className={vstyles.viewHeaderLeft}>
            <h2>Work Item Details</h2>
          </div>
          <div className={vstyles.clinicName}>
            <FaClinicMedical size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {localStorage.getItem('clinicName') || '—'}
          </div>
          <button onClick={() => onClose()} className={vstyles.viewCloseBtn}>
            <FiX size={22} />
          </button>
        </div>

        {/* Body: View or Update */}
        {showUpdateMode ? (
          <UpdateWorkItemPanel
            workItem={workItem}
            orderData={orderData}
            employees={employees}
            showPopupMsg={showPopupMsg}
            onBack={() => setShowUpdateMode(false)}
            onClose={onClose}
            interpretationOptions={interpretationOptions}
            cooldown={cooldown}
          />
        ) : (
          <ViewDetailsPanel />
        )}
      </div>
    </div>
  );
};

// ─── UpdateWorkItemPanel ──────────────────────────────────────────────────────
const UpdateWorkItemPanel = ({
  workItem, orderData, employees, showPopupMsg,
  onBack, onClose, interpretationOptions, cooldown
}) => {
  const toLocalDateTimeString = (date) => {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showApprovalModal,  setShowApprovalModal]  = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const [sampleData, setSampleData] = useState({
    sampleCollectedTime: workItem.sampleCollectedTime
      ? toLocalDateTimeString(workItem.sampleCollectedTime)
      : toLocalDateTimeString(new Date()),
    sampleCollectedPlace: workItem.sampleCollectedPlace || ''
  });

  const [resultData, setResultData] = useState({
    resultValue:    workItem.resultValue    || '',
    interpretation: workItem.interpretation || null,
    remarks:        '',
    testDoneBy:     0
  });

  const [testMasterData, setTestMasterData] = useState({
    resultUnits: workItem.resultUnits || '',
    normalRange: workItem.normalRange || '',
    loading: false,
    fetched: false
  });

  const [approvalData,  setApprovalData]  = useState({ testApprovedBy: 0, approvalRemarks: '' });
  const [rejectionData, setRejectionData] = useState({ testApprovedBy: 0, rejectReason: '' });
  const [validationMessages, setValidationMessages] = useState({});

  useEffect(() => {
    const fetchTestMaster = async () => {
      if (!workItem.testId) return;
      setTestMasterData(prev => ({ ...prev, loading: true }));
      try {
        const clinicId   = await getStoredClinicId();
        const branchId   = await getStoredBranchId();
        const masterList = await getLabTestMasterList(clinicId, {
          TestID: workItem.testId, BranchID: branchId, Page: 1, PageSize: 1
        });
        if (masterList && masterList.length > 0) {
          const m = masterList[0];
          setTestMasterData({
            resultUnits: m.units || workItem.resultUnits || '',
            normalRange: m.normalRange || workItem.normalRange || '',
            loading: false, fetched: true
          });
        } else {
          setTestMasterData({
            resultUnits: workItem.resultUnits || '',
            normalRange: workItem.normalRange || '',
            loading: false, fetched: true
          });
        }
      } catch (err) {
        console.error('Failed to fetch test master data:', err);
        setTestMasterData({
          resultUnits: workItem.resultUnits || '',
          normalRange: workItem.normalRange || '',
          loading: false, fetched: true
        });
      }
    };
    fetchTestMaster();
  }, [workItem.testId]);

  const isSampleFormValid = sampleData.sampleCollectedTime !== '';
  const isResultFormValid = resultData.resultValue.trim() !== '' && resultData.testDoneBy !== 0;
  const isApprovalFormValid  = approvalData.testApprovedBy !== 0;
  const isRejectionFormValid = rejectionData.testApprovedBy !== 0 && rejectionData.rejectReason.trim() !== '';

  const getStepStatus = (step) => {
    if (step < activeStep)   return 'completed';
    if (step === activeStep) return 'active';
    return 'pending';
  };

  // ── Step 1 Save ──────────────────────────────────────────────────────────
  const handleSampleSave = async () => {
    if (!isSampleFormValid) {
      showPopupMsg('Please fill all required fields: Collection Date & Time.', 'warning');
      return;
    }
    cooldown.trigger('uSampleSave');
    try {
      setLoading(true); setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await updateSampleCollection({
        workId: workItem.workId, clinicId, branchId,
        sampleCollectedTime:  sampleData.sampleCollectedTime.replace('T', ' ') + ':00',
        sampleCollectedPlace: sampleData.sampleCollectedPlace
      });
      showPopupMsg('Sample collection details saved successfully!', 'success');
    } catch (err) {
      setError(err);
      showPopupMsg(err.message || 'Failed to save sample collection', 'error');
    } finally { setLoading(false); }
  };

  // ── Step 2 Save ──────────────────────────────────────────────────────────
  const handleResultSave = async () => {
    if (!isResultFormValid) {
      showPopupMsg('Please fill all required fields: Result Value and Test Done By.', 'warning');
      return;
    }
    cooldown.trigger('uResultSave');
    try {
      setLoading(true); setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await updateLabWorkItemResult({
        workId: workItem.workId, clinicId, branchId,
        resultValue:    resultData.resultValue,
        resultUnits:    testMasterData.resultUnits,
        normalRange:    testMasterData.normalRange,
        interpretation: resultData.interpretation,
        remarks:        resultData.remarks,
        testDoneBy:     resultData.testDoneBy
      });
      showPopupMsg('Test results saved successfully!', 'success');
    } catch (err) {
      setError(err);
      showPopupMsg(err.message || 'Failed to save results', 'error');
    } finally { setLoading(false); }
  };

  // ── Approve ──────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!isApprovalFormValid) {
      showPopupMsg('Please fill all required fields: Approved By.', 'warning');
      return;
    }
    cooldown.trigger('uApprove');
    try {
      setLoading(true); setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await approveLabWorkItem({
        workId: workItem.workId, clinicId, branchId,
        testApprovedBy: approvalData.testApprovedBy,
        approvalRemarks: approvalData.approvalRemarks
      });
      setTimeout(() => {
        setShowApprovalModal(false);
        onClose && onClose(orderData.orderId, 'Work item approved successfully!', 'success');
      }, 1000);
    } catch (err) {
      setError(err);
      showPopupMsg(err.message || 'Failed to approve work item', 'error');
    } finally { setLoading(false); }
  };

  // ── Reject ───────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!isRejectionFormValid) {
      showPopupMsg('Please fill all required fields: Rejected By and Rejection Reason.', 'warning');
      return;
    }
    cooldown.trigger('uReject');
    try {
      setLoading(true); setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      await rejectLabWorkItem({
        WorkID: workItem.workId, clinicId, branchID: branchId,
        TestApprovedBy: rejectionData.testApprovedBy,
        RejectReason: rejectionData.rejectReason
      });
      setTimeout(() => {
        setShowRejectionModal(false);
        onClose && onClose(orderData.orderId, 'Work item rejected successfully!', 'success');
      }, 1000);
    } catch (err) {
      setError(err);
      showPopupMsg(err.message || 'Failed to reject work item', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className={vstyles.updateWrapper}>
      <ErrorHandler error={error} />

      {/* Info Section */}
      <div className={styles.infoSection}>
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}><FiUser size={18} /><h3>Patient Information</h3></div>
          <div className={styles.infoContent}>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Name:</span>   <span className={styles.infoValue}>{orderData.patientName}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>File No:</span><span className={styles.infoValue}>{orderData.fileNo}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Mobile:</span> <span className={styles.infoValue}>{orderData.mobile}</span></div>
          </div>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}><FiActivity size={18} /><h3>Test Information</h3></div>
          <div className={styles.infoContent}>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Test Name:</span><span className={styles.infoValue}>{workItem.testName}</span></div>
            <div className={styles.infoRow}><span className={styles.infoLabel}>Doctor:</span>   <span className={styles.infoValue}>{orderData.doctorName || 'N/A'}</span></div>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className={styles.stepsContainer}>
        <div className={`${styles.step} ${styles[getStepStatus(1)]}`}>
          <div className={styles.stepIcon}>{getStepStatus(1) === 'completed' ? <FiCheckCircle size={20} /> : <FiClock size={20} />}</div>
          <div className={styles.stepContent}><div className={styles.stepTitle}>Sample Collection</div><div className={styles.stepDesc}>Record collection details</div></div>
        </div>
        <div className={styles.stepConnector}></div>
        <div className={`${styles.step} ${styles[getStepStatus(2)]}`}>
          <div className={styles.stepIcon}>{getStepStatus(2) === 'completed' ? <FiCheckCircle size={20} /> : <FiFileText size={20} />}</div>
          <div className={styles.stepContent}><div className={styles.stepTitle}>Enter Results</div><div className={styles.stepDesc}>Record test results</div></div>
        </div>
        <div className={styles.stepConnector}></div>
        <div className={`${styles.step} ${styles[getStepStatus(3)]}`}>
          <div className={styles.stepIcon}><FiCheckCircle size={20} /></div>
          <div className={styles.stepContent}><div className={styles.stepTitle}>Approval</div><div className={styles.stepDesc}>Review and approve</div></div>
        </div>
      </div>

      <div className={styles.detailModalBody}>

        {/* ── Step 1: Sample Collection ── */}
        {activeStep === 1 && (
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}><FiClock size={20} /><h3>Sample Collection Details</h3></div>
            <div className={styles.detailFormGrid}>
              <div className={styles.detailFormGroup}>
                <label>Collection Date & Time <span className={styles.required}>*</span></label>
                <input
                  type="datetime-local"
                  value={sampleData.sampleCollectedTime}
                  onChange={(e) => {
                    setSampleData({ ...sampleData, sampleCollectedTime: e.target.value });
                    if (e.target.value) setValidationMessages(prev => ({ ...prev, sampleCollectedTime: '' }));
                  }}
                  className={styles.detailFormInput}
                  required
                />
                {validationMessages.sampleCollectedTime && (
                  <span className={styles.validationMsg}>{validationMessages.sampleCollectedTime}</span>
                )}
              </div>
              <div className={styles.detailFormGroup}>
                <label>Collection Place</label>
                <input
                  type="text"
                  value={sampleData.sampleCollectedPlace}
                  onChange={(e) => setSampleData({ ...sampleData, sampleCollectedPlace: e.target.value })}
                  className={styles.detailFormInput}
                  placeholder="e.g., Lab Room 1, Patient Room"
                />
              </div>
            </div>
            {/* Back | Save | Next */}
            <div className={styles.formActions}>
              <button onClick={onBack} className={styles.backBtn}>
                <FiChevronLeft size={16} /> Back
              </button>
              <button
                onClick={handleSampleSave}
                className={styles.saveBtn}
                disabled={loading || !isSampleFormValid || cooldown.isDisabled('uSampleSave')}
                title={!isSampleFormValid ? 'Please fill all required fields' : ''}
              >
                <FiSave size={18} />{loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setActiveStep(2)}
                className={vstyles.nextBtn}
                disabled={loading}
              >
                Next <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Enter Results ── */}
        {activeStep === 2 && (
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <FiFileText size={20} /><h3>Test Results Entry</h3>
              <div className={styles.masterDataBadges}>
                <span className={styles.masterDataBadge}>
                  <span className={styles.masterDataBadgeLabel}>Units:</span>
                  <span className={styles.masterDataBadgeValue}>{testMasterData.loading ? '...' : testMasterData.resultUnits || '—'}</span>
                </span>
                <span className={styles.masterDataBadge}>
                  <span className={styles.masterDataBadgeLabel}>Normal Range:</span>
                  <span className={styles.masterDataBadgeValue}>{testMasterData.loading ? '...' : testMasterData.normalRange || '—'}</span>
                </span>
              </div>
            </div>
            <div className={styles.detailFormGrid}>
              <div className={styles.detailFormGroup}>
                <label>Result Value <span className={styles.required}>*</span></label>
                <input
                  type="text"
                  value={resultData.resultValue}
                  onChange={(e) => {
                    setResultData({ ...resultData, resultValue: e.target.value });
                    if (e.target.value.trim()) setValidationMessages(prev => ({ ...prev, resultValue: '' }));
                  }}
                  className={styles.detailFormInput}
                  placeholder="e.g., 120"
                  required
                />
                {validationMessages.resultValue && (
                  <span className={styles.validationMsg}>{validationMessages.resultValue}</span>
                )}
              </div>
              <div className={styles.detailFormGroup}>
                <label>Interpretation</label>
                <select
                  value={resultData.interpretation || ''}
                  onChange={(e) => setResultData({ ...resultData, interpretation: e.target.value ? Number(e.target.value) : null })}
                  className={styles.detailFormInput}
                >
                  {interpretationOptions.map(opt => <option key={opt.value} value={opt.value || ''}>{opt.label}</option>)}
                </select>
              </div>
              <div className={styles.detailFormGroup}>
                <label>Test Done By <span className={styles.required}>*</span></label>
                <select
                  required
                  value={resultData.testDoneBy}
                  onChange={(e) => setResultData({ ...resultData, testDoneBy: Number(e.target.value) })}
                  className={styles.detailFormInput}
                >
                  <option value={0}>Select Technician</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>)}
                </select>
              </div>
              <div className={styles.detailFormGroupFull}>
                <label>Remarks</label>
                <textarea
                  value={resultData.remarks}
                  onChange={(e) => setResultData({ ...resultData, remarks: e.target.value })}
                  className={styles.detailFormTextarea}
                  rows={3}
                  placeholder="Any additional notes or observations..."
                />
              </div>
            </div>
            {/* Back | Save | Next */}
            <div className={styles.formActions}>
              <button onClick={() => setActiveStep(1)} className={styles.backBtn}>
                <FiChevronLeft size={16} /> Back
              </button>
              <button
                onClick={handleResultSave}
                className={styles.saveBtn}
                disabled={loading || !isResultFormValid || cooldown.isDisabled('uResultSave')}
                title={!isResultFormValid ? 'Please fill all required fields' : ''}
              >
                <FiSave size={18} />{loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setActiveStep(3)}
                className={vstyles.nextBtn}
                disabled={loading}
              >
                Next <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Approval ── */}
        {activeStep === 3 && (
          <div className={styles.formSection}>
            <div className={styles.sectionHeader}><FiCheckCircle size={20} /><h3>Review & Approval</h3></div>
            <div className={styles.reviewSection}>
              <div className={styles.reviewCard}>
                <h4>Sample Collection</h4>
                <div className={styles.reviewRow}><span>Date & Time:</span><strong>{workItem.sampleCollectedTime ? new Date(workItem.sampleCollectedTime).toLocaleString() : sampleData.sampleCollectedTime ? new Date(sampleData.sampleCollectedTime).toLocaleString() : 'Not recorded'}</strong></div>
                <div className={styles.reviewRow}><span>Place:</span><strong>{workItem.sampleCollectedPlace || sampleData.sampleCollectedPlace || 'Not specified'}</strong></div>
              </div>
              <div className={styles.reviewCard}>
                <h4>Test Results</h4>
                <div className={styles.reviewRow}><span>Value:</span><strong>{workItem.resultValue || resultData.resultValue || 'Not entered'} {testMasterData.resultUnits || workItem.resultUnits || ''}</strong></div>
                <div className={styles.reviewRow}><span>Normal Range:</span><strong>{testMasterData.normalRange || workItem.normalRange || 'Not specified'}</strong></div>
                <div className={styles.reviewRow}><span>Interpretation:</span><strong>{interpretationOptions.find(opt => opt.value === (workItem.interpretation || resultData.interpretation))?.label || 'Not specified'}</strong></div>
              </div>
            </div>
            {/* Back | Reject | Approve */}
            <div className={styles.formActions}>
              <button onClick={() => setActiveStep(2)} className={styles.backBtn}>
                <FiChevronLeft size={16} /> Back
              </button>
              <button
                onClick={() => { cooldown.trigger('uOpenReject'); setShowRejectionModal(true); }}
                disabled={cooldown.isDisabled('uOpenReject')}
                className={styles.rejectBtn}
              >
                <FiXCircle size={18} />Reject
              </button>
              <button
                onClick={() => { cooldown.trigger('uOpenApprove'); setShowApprovalModal(true); }}
                disabled={cooldown.isDisabled('uOpenApprove')}
                className={styles.approveBtn}
              >
                <FiCheckCircle size={18} />Approve
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Approval Modal ── */}
      {showApprovalModal && (
        <div className={styles.confirmOverlay} onClick={() => !loading && setShowApprovalModal(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmModalHeader}>
              <h3>Approve Work Item</h3>
              <button onClick={() => !loading && setShowApprovalModal(false)} className={styles.confirmCloseBtn} disabled={loading}><FiX size={20} /></button>
            </div>
            <div className={styles.confirmModalBody}>
              <div className={styles.detailFormGroup}>
                <label>Approved By <span className={styles.required}>*</span></label>
                <select
                  value={approvalData.testApprovedBy}
                  onChange={(e) => setApprovalData({ ...approvalData, testApprovedBy: Number(e.target.value) })}
                  className={styles.detailFormInput}
                  required
                  disabled={loading}
                >
                  <option value={0}>Select Doctor</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>)}
                </select>
              </div>
              <div className={styles.detailFormGroup}>
                <label>Approval Remarks</label>
                <textarea
                  value={approvalData.approvalRemarks}
                  onChange={(e) => setApprovalData({ ...approvalData, approvalRemarks: e.target.value })}
                  className={styles.detailFormTextarea}
                  rows={3}
                  placeholder="Optional remarks..."
                  disabled={loading}
                />
              </div>
            </div>
            <div className={styles.confirmModalFooter}>
              <button onClick={() => !loading && setShowApprovalModal(false)} className={styles.cancelBtn} disabled={loading}>Cancel</button>
              <button
                onClick={handleApprove}
                className={styles.confirmApproveBtn}
                disabled={loading || !isApprovalFormValid || cooldown.isDisabled('uApprove')}
                title={!isApprovalFormValid ? 'Please select an approver' : ''}
              >
                <FiCheckCircle size={18} />{loading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejection Modal ── */}
      {showRejectionModal && (
        <div className={styles.confirmOverlay} onClick={() => !loading && setShowRejectionModal(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmModalHeader}>
              <h3>Reject Work Item</h3>
              <button onClick={() => !loading && setShowRejectionModal(false)} className={styles.confirmCloseBtn} disabled={loading}><FiX size={20} /></button>
            </div>
            <div className={styles.confirmModalBody}>
              <div className={styles.detailFormGroup}>
                <label>Rejected By <span className={styles.required}>*</span></label>
                <select
                  value={rejectionData.testApprovedBy}
                  onChange={(e) => setRejectionData({ ...rejectionData, testApprovedBy: Number(e.target.value) })}
                  className={styles.detailFormInput}
                  required
                  disabled={loading}
                >
                  <option value={0}>Select Doctor</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeCode})</option>)}
                </select>
              </div>
              <div className={styles.detailFormGroup}>
                <label>Rejection Reason <span className={styles.required}>*</span></label>
                <textarea
                  value={rejectionData.rejectReason}
                  onChange={(e) => setRejectionData({ ...rejectionData, rejectReason: e.target.value })}
                  className={styles.detailFormTextarea}
                  rows={4}
                  placeholder="Please provide a detailed reason for rejection..."
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <div className={styles.confirmModalFooter}>
              <button onClick={() => !loading && setShowRejectionModal(false)} className={styles.cancelBtn} disabled={loading}>Cancel</button>
              <button
                onClick={handleReject}
                className={styles.confirmRejectBtn}
                disabled={loading || !isRejectionFormValid || cooldown.isDisabled('uReject')}
                title={!isRejectionFormValid ? 'Please fill all required fields' : ''}
              >
                <FiXCircle size={18} />{loading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewWorkItem;