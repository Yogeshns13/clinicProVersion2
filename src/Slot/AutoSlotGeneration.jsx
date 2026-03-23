// src/components/AutoSlotGeneration.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FiZap, FiX, FiCalendar, FiHash, FiAlertCircle, FiEdit2 } from 'react-icons/fi';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import { addTask, deleteTask } from '../Api/Api.js';
import styles from './AutoSlotGeneration.module.css';
import MessagePopup from '../Hooks/MessagePopup.jsx';

const TASK_TYPE = 2;
const TASK_NAME = 'GenerateSlots';
const MAX_RETRY = 3;

// ── Parse existing task data into form state ──
const parseExistingTask = (taskData) => {
  if (!taskData) return null;
  try {
    const params =
      typeof taskData.taskParamsJson === 'string'
        ? JSON.parse(taskData.taskParamsJson)
        : taskData.taskParamsJson || {};

    const hasDaysCount = params.DaysCount !== null && params.DaysCount !== undefined;
    return {
      rangeType: hasDaysCount ? 'days' : 'range',
      daysCount: hasDaysCount ? Number(params.DaysCount) : 10,
      fromDate:  params.FromDate || '',
      toDate:    params.ToDate   || '',
      interval:  Number(taskData.repeatIntervalMinutes) || 5,
    };
  } catch {
    return null;
  }
};

// ────────────────────────────────────────────────
const AutoSlotGeneration = ({ isOpen, onClose, onSuccess, mode = 'add', existingTaskData = null }) => {
  const isEdit = mode === 'edit';

  const [rangeType,   setRangeType]   = useState('days');
  const [daysCount,   setDaysCount]   = useState(10);
  const [fromDate,    setFromDate]    = useState('');
  const [toDate,      setToDate]      = useState('');
  const [interval,    setInterval]    = useState(5);
  const [submitting,  setSubmitting]  = useState(false);

  // ── MessagePopup state ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Button cooldown ──
  const [submitCooldown, setSubmitCooldown] = useState(false);
  const startCooldown = () => {
    setSubmitCooldown(true);
    setTimeout(() => setSubmitCooldown(false), 2000);
  };

  // Track original values to detect changes in edit mode
  const originalRef = useRef(null);

  // ── Derive whether required fields are filled ──
  const isRequiredFilled = () => {
    if (!interval || interval < 1) return false;
    if (rangeType === 'days') return !!daysCount && daysCount >= 1;
    return !!fromDate && !!toDate;
  };

  const saveEnabled = isRequiredFilled() && !submitting && !submitCooldown;

  // ── Prefill form when opening ──
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && existingTaskData) {
      const parsed = parseExistingTask(existingTaskData);
      if (parsed) {
        setRangeType(parsed.rangeType);
        setDaysCount(parsed.daysCount);
        setFromDate(parsed.fromDate);
        setToDate(parsed.toDate);
        setInterval(parsed.interval);
        originalRef.current = { ...parsed };
      }
    } else {
      // Add mode — reset to defaults
      setRangeType('days');
      setDaysCount(10);
      setFromDate('');
      setToDate('');
      setInterval(5);
      originalRef.current = null;
    }

    setPopup({ visible: false, message: '', type: 'success' });
    setSubmitCooldown(false);
  }, [isOpen, isEdit, existingTaskData]);

  // ── Dirty check: has the user changed anything from original? ──
  const isDirty = () => {
    if (!isEdit || !originalRef.current) return false;
    const orig = originalRef.current;
    if (rangeType !== orig.rangeType) return true;
    if (rangeType === 'days'  && daysCount !== orig.daysCount) return true;
    if (rangeType === 'range' && (fromDate !== orig.fromDate || toDate !== orig.toDate)) return true;
    if (interval !== orig.interval) return true;
    return false;
  };

  const resetForm = () => {
    setRangeType('days');
    setDaysCount(10);
    setFromDate('');
    setToDate('');
    setInterval(5);
    setPopup({ visible: false, message: '', type: 'success' });
    setSubmitCooldown(false);
    originalRef.current = null;
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    // Gate: required fields check
    if (!isRequiredFilled()) {
      showPopup(
        rangeType === 'range' && (!fromDate || !toDate)
          ? 'Please select both From Date and To Date.'
          : 'Please fill all required fields.',
        'warning'
      );
      return;
    }

    if (submitCooldown) return;
    startCooldown();

    // Extra validation
    if (rangeType === 'days' && (!daysCount || daysCount < 1)) {
      showPopup('Days count must be at least 1.', 'error');
      return;
    }
    if (rangeType === 'range') {
      if (new Date(fromDate) > new Date(toDate)) {
        showPopup('From Date cannot be after To Date.', 'error');
        return;
      }
    }
    if (!interval || interval < 1) {
      showPopup('Repeat interval must be at least 1 minute.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const taskParamsJson =
        rangeType === 'days'
          ? { DaysCount: Number(daysCount), FromDate: null, ToDate: null }
          : { DaysCount: null, FromDate: fromDate, ToDate: toDate };

      if (isEdit) {
        // Update = delete existing task first, then re-create with new values
        await deleteTask({ clinicId, branchId, taskType: TASK_TYPE, taskName: TASK_NAME });
      }

      await addTask({
        clinicId,
        branchId,
        taskType:              TASK_TYPE,
        taskName:              TASK_NAME,
        maxRetry:              MAX_RETRY,
        repeatIntervalMinutes: Number(interval),
        taskParamsJson,
      });

      showPopup(
        isEdit ? 'Auto generation updated successfully!' : 'Auto generation enabled successfully!',
        'success'
      );
      setTimeout(() => {
        closePopup();
        resetForm();
        onSuccess?.();
      }, 1200);
    } catch (err) {
      showPopup(
        isEdit
          ? err.message || 'Failed to update auto generation.'
          : err.message || 'Failed to enable auto generation.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const showUpdateBtn = isEdit && isDirty();

  return (
    <>
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <div className={styles.overlay}>
        <div className={styles.panel}>

          {/* ── Header ── */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIcon}>
                {isEdit ? <FiEdit2 size={20} /> : <FiZap size={20} />}
              </div>
              <div>
                <h2 className={styles.headerTitle}>
                  {isEdit ? 'Edit Auto Generation' : 'Enable Auto Generation'}
                </h2>
                <p className={styles.headerSub}>
                  {isEdit
                    ? 'Modify the automatic slot creation schedule'
                    : 'Configure automatic slot creation schedule'}
                </p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
              <FiX size={20} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className={styles.body}>

            {/* Generation Mode */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Generation Mode</label>
              <div className={styles.radioGroup}>
                <label
                  className={`${styles.radioCard} ${rangeType === 'days' ? styles.radioCardActive : ''}`}
                  onClick={() => setRangeType('days')}
                >
                  <input
                    type="radio"
                    name="rangeType"
                    value="days"
                    checked={rangeType === 'days'}
                    onChange={() => setRangeType('days')}
                    className={styles.hiddenRadio}
                  />
                  <div className={styles.radioIcon}><FiHash size={18} /></div>
                  <div className={styles.radioTitle}>Days Ahead</div>
                  <div className={styles.radioCheck} />
                </label>

                <label
                  className={`${styles.radioCard} ${rangeType === 'range' ? styles.radioCardActive : ''}`}
                  onClick={() => setRangeType('range')}
                >
                  <input
                    type="radio"
                    name="rangeType"
                    value="range"
                    checked={rangeType === 'range'}
                    onChange={() => setRangeType('range')}
                    className={styles.hiddenRadio}
                  />
                  <div className={styles.radioIcon}><FiCalendar size={18} /></div>
                  <div className={styles.radioTitle}>Date Range</div>
                  <div className={styles.radioCheck} />
                </label>
              </div>
            </div>

            {/* Conditional inputs */}
            {rangeType === 'days' ? (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Days Count</label>
                <div className={styles.counterRow}>
                  <button
                    type="button"
                    className={styles.counterBtn}
                    onClick={() => setDaysCount((v) => Math.max(1, v - 1))}
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={daysCount}
                    onChange={(e) => setDaysCount(Math.max(1, Number(e.target.value)))}
                    className={styles.counterInput}
                  />
                  <button
                    type="button"
                    className={styles.counterBtn}
                    onClick={() => setDaysCount((v) => Math.min(365, v + 1))}
                  >+</button>
                  <span className={styles.counterUnit}>days</span>
                </div>
              </div>
            ) : (
              <div className={styles.dateRangeRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
                <div className={styles.dateArrow}>→</div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
              </div>
            )}

            {/* Interval */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Repeat Interval</label>
              <div className={styles.intervalRow}>
                {[5, 10, 15, 30, 60].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`${styles.intervalChip} ${interval === val ? styles.intervalChipActive : ''}`}
                    onClick={() => setInterval(val)}
                  >
                    {val < 60 ? `${val}m` : '1h'}
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  placeholder="Custom"
                  value={![5, 10, 15, 30, 60].includes(interval) ? interval : ''}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  className={styles.intervalCustom}
                />
                <span className={styles.counterUnit}>min</span>
              </div>
            </div>

          </div>

          {/* ── Footer ── */}
          <div className={styles.footer}>
            <button className={styles.cancelBtn} onClick={handleClose} disabled={submitting}>
              Cancel
            </button>

            {/* Edit mode: show Update only when something changed */}
            {isEdit ? (
              showUpdateBtn && (
                <button
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={!saveEnabled}
                  title={!isRequiredFilled() ? 'Please fill all required fields' : ''}
                >
                  {submitting
                    ? <><span className={styles.btnSpinner} />Updating…</>
                    : <><FiZap size={15} />Update</>
                  }
                </button>
              )
            ) : (
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={!saveEnabled}
                title={!isRequiredFilled() ? 'Please fill all required fields' : ''}
              >
                {submitting
                  ? <><span className={styles.btnSpinner} />Enabling…</>
                  : <><FiZap size={15} />Enable Auto Generation</>
                }
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default AutoSlotGeneration;