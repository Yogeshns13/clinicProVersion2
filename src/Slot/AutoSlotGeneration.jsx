// src/components/AutoSlotGeneration.jsx
import React, { useState } from 'react';
import { FiZap, FiX, FiCalendar, FiHash, FiAlertCircle } from 'react-icons/fi';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import { addTask } from '../Api/Api.js';
import styles from './AutoSlotGeneration.module.css';

const TASK_TYPE = 2;
const TASK_NAME = 'GenerateSlots';
const MAX_RETRY = 3;

const AutoSlotGeneration = ({ isOpen, onClose, onSuccess }) => {
  const [rangeType,   setRangeType]   = useState('days');  // 'days' | 'range'
  const [daysCount,   setDaysCount]   = useState(10);
  const [fromDate,    setFromDate]    = useState('');
  const [toDate,      setToDate]      = useState('');
  const [interval,    setInterval]    = useState(5);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const resetForm = () => {
    setRangeType('days');
    setDaysCount(10);
    setFromDate('');
    setToDate('');
    setInterval(5);
    setSubmitError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    // Validation
    if (rangeType === 'days' && (!daysCount || daysCount < 1)) {
      setSubmitError('Days count must be at least 1.');
      return;
    }
    if (rangeType === 'range') {
      if (!fromDate || !toDate) {
        setSubmitError('Please select both From Date and To Date.');
        return;
      }
      if (new Date(fromDate) > new Date(toDate)) {
        setSubmitError('From Date cannot be after To Date.');
        return;
      }
    }
    if (!interval || interval < 1) {
      setSubmitError('Repeat interval must be at least 1 minute.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const taskParamsJson =
        rangeType === 'days'
          ? { DaysCount: Number(daysCount), FromDate: null, ToDate: null }
          : { DaysCount: null, FromDate: fromDate, ToDate: toDate };

      await addTask({
        clinicId,
        branchId,
        taskType:              TASK_TYPE,
        taskName:              TASK_NAME,
        maxRetry:              MAX_RETRY,
        repeatIntervalMinutes: Number(interval),
        taskParamsJson,
      });

      resetForm();
      onSuccess?.();
    } catch (err) {
      setSubmitError(err.message || 'Failed to enable auto generation');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}><FiZap size={20} /></div>
            <div>
              <h2 className={styles.headerTitle}>Enable Auto Generation</h2>
              <p className={styles.headerSub}>Configure automatic slot creation schedule</p>
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
                <div>
                  <div className={styles.radioTitle}>Days Ahead</div>
                  <div className={styles.radioDesc}>Generate slots N days in advance</div>
                </div>
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
                <div>
                  <div className={styles.radioTitle}>Date Range</div>
                  <div className={styles.radioDesc}>Generate slots between two dates</div>
                </div>
                <div className={styles.radioCheck} />
              </label>
            </div>
          </div>

          {/* Conditional inputs */}
          {rangeType === 'days' ? (
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                Days Count
                <span className={styles.fieldHint}>How many days ahead to generate slots</span>
              </label>
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
            <label className={styles.fieldLabel}>
              Repeat Interval
              <span className={styles.fieldHint}>How often to run this task</span>
            </label>
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

          {/* Fixed values info */}
          <div className={styles.fixedInfo}>
            <div className={styles.fixedInfoItem}>
              <span className={styles.fixedLabel}>Task name</span>
              <span className={styles.fixedValue}>GenerateSlots</span>
            </div>
            <div className={styles.fixedInfoItem}>
              <span className={styles.fixedLabel}>Task type</span>
              <span className={styles.fixedValue}>2</span>
            </div>
            <div className={styles.fixedInfoItem}>
              <span className={styles.fixedLabel}>Max retry</span>
              <span className={styles.fixedValue}>3</span>
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div className={styles.errorBanner}>
              <FiAlertCircle size={16} />
              {submitError}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={handleClose}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={submitting}>
            {submitting
              ? <><span className={styles.btnSpinner} />Enabling…</>
              : <><FiZap size={15} />Enable Auto Generation</>
            }
          </button>
        </div>

      </div>
    </div>
  );
};

export default AutoSlotGeneration;