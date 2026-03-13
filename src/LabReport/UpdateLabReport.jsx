// src/components/UpdateLabReport.jsx
import React, { useState, useEffect } from 'react';
import { FiSave, FiX } from 'react-icons/fi';
import { updateLabTestReport } from '../Api/ApiLabTests.js';
import { getEmployeeList } from '../Api/Api.js';
import styles from './LabReportList.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Created' },
  { id: 2, label: 'Cancelled' },
  { id: 3, label: 'Verified' },
];

// ────────────────────────────────────────────────
const UpdateLabReport = ({ report, onClose, onSuccess }) => {
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [formData, setFormData] = useState({
    verifiedBy: 0,
    verifiedDateTime: '',
    fileId: 0,
    remarks: '',
    status: 1,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // ────────────────────────────────────────────────
  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const clinicId = Number(localStorage.getItem('clinicID')) || 0;
        const branchId = Number(localStorage.getItem('branchID')) || 0;
        
        const employeeList = await getEmployeeList(clinicId, {
          BranchID: branchId,
          PageSize: 100,
          Status: 1
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

  // ────────────────────────────────────────────────
  // Initialize form data when report changes
  useEffect(() => {
    if (!report) return;

    let formattedDateTime = '';
    if (report.verifiedDateTime) {
      try {
        const dt = new Date(report.verifiedDateTime);
        const year = dt.getFullYear();
        const month = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        const hours = String(dt.getHours()).padStart(2, '0');
        const minutes = String(dt.getMinutes()).padStart(2, '0');
        formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch {
        formattedDateTime = '';
      }
    }

    setFormData({
      verifiedBy: report.verifiedBy || 0,
      verifiedDateTime: formattedDateTime,
      fileId: report.fileId || 0,
      remarks: report.remarks || '',
      status: report.status || 1,
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

    if (!formData.verifiedBy || Number(formData.verifiedBy) === 0) {
      setValidationMessages((prev) => ({ ...prev, verifiedBy: 'Please select a doctor' }));
      return;
    }

    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = Number(localStorage.getItem('clinicID')) || 0;
      const branchId = Number(localStorage.getItem('branchID')) || 0;

      let verifiedDateTime = '';
      if (formData.verifiedDateTime) {
        verifiedDateTime = formData.verifiedDateTime.replace('T', ' ') + ':00';
      }

      await updateLabTestReport({
        reportId: Number(report.id),
        clinicId: clinicId,
        branchId: branchId,
        verifiedBy: Number(formData.verifiedBy),
        verifiedDateTime: verifiedDateTime,
        fileId: Number(formData.fileId),
        remarks: formData.remarks.trim(),
        status: Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1000);
    } catch (err) {
      setFormError(err.message || 'Failed to update lab report.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (!report) return null;

  return (
    <div className={styles.clinicModalOverlay} onClick={onClose}>
      <div 
        className={`${styles.clinicModal} ${styles.updateModal}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.clinicModalHeader}>
          <h2>Update Lab Report</h2>

          <div className={styles.headerRight}>
                        <div className={styles.clinicNameone}>
                                       <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px' }} />  
                                         {localStorage.getItem('clinicName') || '—'}
                                    </div>
          <button onClick={onClose} className={styles.clinicModalClose}>
            ×
          </button>
        </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.clinicModalBody}>
          {formError && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Lab report updated successfully!</div>}

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
                required
                name="verifiedBy"
                value={formData.verifiedBy}
                onChange={handleInputChange}
                onBlur={handleVerifiedByBlur}
                disabled={loadingDoctors}
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
              />
            </div>

            <div className={styles.formGroup}>
              <label>
                Status <span className={styles.required}>*</span>
              </label>
              <select 
                required 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
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
              disabled={formLoading} 
              className={styles.btnSubmit}
            >
              <FiSave className={styles.btnIcon} />
              {formLoading ? 'Updating...' : 'Update Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateLabReport;