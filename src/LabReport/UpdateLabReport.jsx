// src/components/UpdateLabReport.jsx
import React, { useState, useEffect } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import { updateLabTestReport } from '../Api/ApiLabTests.js';
import { getEmployeeList } from '../Api/Api.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './LabReportList.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Created'   },
  { id: 2, label: 'Cancelled' },
  { id: 3, label: 'Verified'  },
];

// ────────────────────────────────────────────────
const UpdateLabReport = ({ report, onClose, onSuccess }) => {
  const [doctors, setDoctors]             = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [formData, setFormData] = useState({
    verifiedBy:      0,
    verifiedDateTime: '',
    fileId:          0,
    remarks:         '',
    status:          1,
  });

  const [formLoading, setFormLoading]         = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // ── Button cooldown state (2-sec disable after click) ──────────────────────
  const [btnCooldown, setBtnCooldown] = useState({});
  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  // ── MessagePopup state (error/warning only) ─────────────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Submit button gating ────────────────────────────────────────────────────
  // Enabled only when verifiedBy is selected (non-zero)
  const allRequiredFilled = Number(formData.verifiedBy) > 0;

  // ────────────────────────────────────────────────
  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const clinicId = await getStoredClinicId();
        const branchId = await getStoredBranchId();

        const employeeList = await getEmployeeList(clinicId, {
          BranchID: branchId,
          PageSize: 100,
          Status:   1,
        });

        setDoctors(employeeList);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  // ── Initialize form data when report changes ───────────────────────────────
  useEffect(() => {
    if (!report) return;

    let formattedDateTime = '';
    if (report.verifiedDateTime) {
      try {
        const dt      = new Date(report.verifiedDateTime);
        const year    = dt.getFullYear();
        const month   = String(dt.getMonth() + 1).padStart(2, '0');
        const day     = String(dt.getDate()).padStart(2, '0');
        const hours   = String(dt.getHours()).padStart(2, '0');
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch {
        formattedDateTime = '';
      }
    }

    setFormData({
      verifiedBy:       report.verifiedBy || 0,
      verifiedDateTime: formattedDateTime,
      fileId:           report.fileId     || 0,
      remarks:          report.remarks    || '',
      status:           report.status     || 1,
    });
  }, [report]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'verifiedBy') {
      setValidationMessages((prev) => ({
        ...prev,
        verifiedBy: Number(value) === 0 ? 'Please select a doctor' : '',
      }));
    }
  };

  const handleVerifiedByBlur = () => {
    if (!formData.verifiedBy || Number(formData.verifiedBy) === 0) {
      setValidationMessages((prev) => ({ ...prev, verifiedBy: 'Please select a doctor' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: show warning popup if required fields missing
    if (!allRequiredFilled) {
      setValidationMessages((prev) => ({ ...prev, verifiedBy: 'Please select a doctor' }));
      showPopup('Please fill all required fields: Verified By (Doctor).', 'warning');
      return;
    }

    triggerCooldown('submit');
    setFormLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      let verifiedDateTime = '';
      if (formData.verifiedDateTime) {
        verifiedDateTime = formData.verifiedDateTime.replace('T', ' ') + ':00';
      }

      await updateLabTestReport({
        reportId:         Number(report.id),
        clinicId:         clinicId,
        branchId:         branchId,
        verifiedBy:       Number(formData.verifiedBy),
        verifiedDateTime: verifiedDateTime,
        fileId:           Number(formData.fileId),
        remarks:          formData.remarks.trim(),
        status:           Number(formData.status),
      });

      // Success: let the parent (LabReportList) show the success popup via onSuccess
      if (onSuccess) onSuccess();
    } catch (err) {
      showPopup(err.message || 'Failed to update lab report.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (!report) return null;

  return (
    <>
      <div className={styles.clinicModalOverlay} >
        <div
          className={`${styles.clinicModal} ${styles.updateModal}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.clinicModalHeader}>
            <h2>Update Lab Report</h2>
            <div className={styles.headerRight}>
              <div className={styles.clinicNameone}>
                <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
                {localStorage.getItem('clinicName') || '—'}
              </div>
              <button
                onClick={onClose}
                className={styles.clinicModalClose}
                disabled={formLoading}
              >
                ×
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.clinicModalBody} noValidate>

            <div className={styles.formGrid}>
              {/* Patient Info (Read-only for context) */}
              <div className={styles.infoSection}>
                <span className={styles.infoLabel}>Patient:</span>
                <span className={styles.infoValue}>{report.patientName} ({report.patientFileNo})</span>
              </div>

              <div className={styles.infoSection}>
                <span className={styles.infoLabel}>Doctor:</span>
                <span className={styles.infoValue}>{report.doctorFullName}</span>
              </div>

              {/* Editable Fields */}
              <div className={styles.formGroup}>
                <label>
                  Verified By <span className={styles.required}>*</span>
                </label>
                <select
                  name="verifiedBy"
                  value={formData.verifiedBy}
                  onChange={handleInputChange}
                  onBlur={handleVerifiedByBlur}
                  disabled={loadingDoctors || formLoading}
                >
                  <option value="0">-- Select Doctor --</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} {doctor.employeeCode ? `(${doctor.employeeCode})` : ''}
                    </option>
                  ))}
                </select>
                {loadingDoctors && <small className={styles.loadingText}>Loading doctors...</small>}
                {validationMessages.verifiedBy && (
                  <span className={styles.validationMsg}>{validationMessages.verifiedBy}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Verified Date & Time</label>
                <input
                  type="datetime-local"
                  name="verifiedDateTime"
                  value={formData.verifiedDateTime}
                  onChange={handleInputChange}
                  disabled={formLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label>File ID</label>
                <input
                  type="number"
                  name="fileId"
                  value={formData.fileId}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="Enter file ID"
                  disabled={formLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Status <span className={styles.required}>*</span>
                </label>
                <select name="status" value={formData.status} onChange={handleInputChange} disabled={formLoading}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  rows={4}
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Enter any remarks or notes..."
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className={styles.clinicModalFooter}>
              <button
                type="button"
                onClick={onClose}
                className={styles.btnCancel}
                disabled={formLoading}
              >
                <FiX className={styles.btnIcon} />
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading || !allRequiredFilled || !!btnCooldown['submit']}
                className={styles.btnSubmit}
                title={!allRequiredFilled ? 'Please select a doctor to enable this button' : ''}
              >
                <FiSave className={styles.btnIcon} />
                {formLoading ? 'Updating...' : 'Update Report'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── MessagePopup (error/warning only — success is handled by parent) ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />
    </>
  );
};

export default UpdateLabReport;