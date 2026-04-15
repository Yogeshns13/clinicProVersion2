// src/components/UpdateLabReport.jsx
import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiEye, FiUpload } from 'react-icons/fi';
import { updateLabTestReport } from '../Api/ApiLabTests.js';
import { getEmployeeList, getFile, uploadFile } from '../Api/Api.js';
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
  const [doctors, setDoctors]               = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [formData, setFormData] = useState({
    verifiedBy:       0,
    verifiedDateTime: '',
    fileId:           0,
    remarks:          '',
    status:           1,
  });

  const [formLoading, setFormLoading]               = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // ── File view / upload state ───────────────────────────────────────────────
  const [fetchedFileUrl,   setFetchedFileUrl]   = useState(null);
  const [fileViewLoading,  setFileViewLoading]  = useState(false);
  const [newFile,          setNewFile]          = useState(null);
  const [newFileUrl,       setNewFileUrl]       = useState(null);
  const [fileUploaded,     setFileUploaded]     = useState(false);
  const [fileUploadStatus, setFileUploadStatus] = useState('');
  const [isFileUploading,  setIsFileUploading]  = useState(false);

  // ── Lightbox state ─────────────────────────────────────────────────────────
  const [lightbox, setLightbox] = useState({ open: false, url: null, title: '', isPdf: false });

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

    // Reset file state when report changes
    setFetchedFileUrl(null);
    setFileViewLoading(false);
    setNewFile(null);
    setNewFileUrl(null);
    setFileUploaded(false);
    setFileUploadStatus('');
    setIsFileUploading(false);
    setLightbox({ open: false, url: null, title: '', isPdf: false });
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

  // ── File: view current file ────────────────────────────────────────────────
  const handleViewCurrentFile = async () => {
    if (!formData.fileId || formData.fileId <= 0) return;
    setFileViewLoading(true);
    try {
      const clinicId = await getStoredClinicId();
      const result   = await getFile(clinicId, formData.fileId);
      const isPdf    = result.blob?.type === 'application/pdf';
      setFetchedFileUrl(result.url);
      setLightbox({ open: true, url: result.url, title: 'Report File', isPdf });
    } catch (err) {
      console.error('View file error:', err);
      showPopup('Failed to load file.', 'error');
    } finally {
      setFileViewLoading(false);
    }
  };

  // ── File: select new file ──────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setFileUploadStatus('Invalid file type. Use JPG, PNG or PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileUploadStatus('File exceeds 5MB limit.');
      return;
    }
    setNewFile(file);
    setNewFileUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    setFileUploaded(false);
    setFileUploadStatus('File selected. Click Upload to submit.');
  };

  // ── File: upload new file ──────────────────────────────────────────────────
  const handleFileUploadSubmit = async () => {
    if (!newFile) return;
    setIsFileUploading(true);
    setFileUploadStatus('Uploading...');
    try {
      const clinicId = await getStoredClinicId();
      const result   = await uploadFile(clinicId, newFile);
      setFormData((prev) => ({ ...prev, fileId: result.fileId }));
      setFileUploaded(true);
      setFileUploadStatus('File uploaded successfully!');
    } catch (err) {
      setFileUploadStatus(`Upload failed: ${err.message}`);
    } finally {
      setIsFileUploading(false);
    }
  };

  // ── File: clear new file selection (revert to original) ───────────────────
  const handleRemoveFile = () => {
    setNewFile(null);
    setNewFileUrl(null);
    setFileUploaded(false);
    setFileUploadStatus('');
    // Revert fileId to original report value
    setFormData((prev) => ({ ...prev, fileId: report.fileId || 0 }));
  };

  const closeLightbox = () =>
    setLightbox({ open: false, url: null, title: '', isPdf: false });

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

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
      <div className={styles.clinicModalOverlay}>
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

              {/* ── Patient Info (Read-only context) ── */}
              <div className={styles.infoSection}>
                <span className={styles.infoLabel}>Patient:</span>
                <span className={styles.infoValue}>{report.patientName} ({report.patientFileNo})</span>
              </div>

              <div className={styles.infoSection}>
                <span className={styles.infoLabel}>Doctor:</span>
                <span className={styles.infoValue}>{report.doctorFullName}</span>
              </div>

              {/* ── Verified By ── */}
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

              {/* ── Verified Date & Time ── */}
              <div className={styles.formGroup}>
                <label>Verified Date &amp; Time</label>
                <input
                  type="datetime-local"
                  name="verifiedDateTime"
                  value={formData.verifiedDateTime}
                  onChange={handleInputChange}
                  disabled={formLoading}
                />
              </div>

              {/* ── Status ── */}
              <div className={styles.formGroup}>
                <label>
                  Status <span className={styles.required}>*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={formLoading}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* ── Report File section (replaces raw File ID input) ── */}
              <div className={`${styles.formGroup} ${styles.fullWidth} ${styles.fileSection}`}>
                <span className={styles.fileSectionTitle}>Report File</span>

                <div className={styles.fileUploadContainer}>
                  {/* ── Preview area ── */}
                  <div className={styles.filePreviewSection}>
                    {newFileUrl ? (
                      /* Newly selected image preview */
                      <div className={styles.filePreview}>
                        <img src={newFileUrl} alt="Selected file" />
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className={styles.removeFileBtn}
                          disabled={formLoading}
                        >
                          <FiX size={13} />
                        </button>
                      </div>
                    ) : fetchedFileUrl ? (
                      /* Fetched existing file — click to open lightbox */
                      <div
                        className={styles.filePreview}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setLightbox({ open: true, url: fetchedFileUrl, title: 'Report File', isPdf: false })}
                        title="Click to enlarge"
                      >
                        <img src={fetchedFileUrl} alt="Current report file" />
                      </div>
                    ) : (
                      /* Placeholder */
                      <div className={styles.filePlaceholder}>
                        <FiUpload size={26} />
                        <p>
                          {fileViewLoading
                            ? 'Loading...'
                            : newFile?.type === 'application/pdf'
                              ? `PDF: ${newFile.name}`
                              : formData.fileId > 0
                                ? 'File on record'
                                : 'No file'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ── Upload controls ── */}
                  <div className={styles.fileUploadControls}>

                    {/* View + Select/Replace — same row, same size.
                        Hidden once a file has been selected (upload flow takes over). */}
                    {!newFile && (
                      <div className={styles.fileActionRow}>
                        {formData.fileId > 0 && !fetchedFileUrl && (
                          <button
                            type="button"
                            onClick={handleViewCurrentFile}
                            disabled={fileViewLoading || formLoading}
                            className={styles.btnFileAction}
                          >
                            <FiEye size={14} />
                            {fileViewLoading ? 'Loading...' : 'View Current File'}
                          </button>
                        )}
                        <input
                          type="file"
                          id="reportFileInput"
                          accept="image/jpeg,image/jpg,image/png,application/pdf"
                          onChange={handleFileSelect}
                          style={{ display: 'none' }}
                          disabled={formLoading}
                        />
                        <label
                          htmlFor="reportFileInput"
                          className={styles.btnFileAction}
                        >
                          {formData.fileId > 0 ? 'Replace Filee' : 'Select File'}
                        </label>
                      </div>
                    )}

                    {/* Upload button — shown only when file is selected but not yet uploaded */}
                    {newFile && !fileUploaded && (
                      <button
                        type="button"
                        onClick={handleFileUploadSubmit}
                        disabled={isFileUploading || formLoading}
                        className={styles.btnUploadFile}
                      >
                        <FiUpload size={14} />
                        {isFileUploading ? 'Uploading...' : 'Upload File'}
                      </button>
                    )}

                    {fileUploadStatus && (
                      <p className={`${styles.fileStatus} ${fileUploaded ? styles.fileStatusSuccess : styles.fileStatusInfo}`}>
                        {fileUploadStatus}
                      </p>
                    )}
                    <p className={styles.fileHint}>JPG, PNG or PDF · Max 5MB</p>
                  </div>
                </div>
              </div>

              {/* ── Remarks ── */}
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

      {/* ── Lightbox (fixed, above all modals) ── */}
      {lightbox.open && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
          <div className={styles.lightboxModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.lightboxHeader}>
              <span className={styles.lightboxTitle}>{lightbox.title}</span>
              <button className={styles.lightboxCloseBtn} onClick={closeLightbox}>✕</button>
            </div>
            <div className={styles.lightboxBody}>
              {lightbox.isPdf ? (
                <embed
                  src={lightbox.url}
                  type="application/pdf"
                  className={styles.lightboxPdf}
                />
              ) : (
                <img
                  src={lightbox.url}
                  alt={lightbox.title}
                  className={styles.lightboxImg}
                />
              )}
            </div>
          </div>
        </div>
      )}

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