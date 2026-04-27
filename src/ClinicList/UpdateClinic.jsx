// src/components/UpdateClinic.jsx
import React, { useState, useMemo, useRef } from 'react';
import { FiSave, FiUpload, FiImage, FiEye } from 'react-icons/fi';
import { updateClinic, uploadPhoto, getFile } from '../Api/Api.js';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './ClinicList.module.css';

const nameOnlyRegex = /^[A-Za-z ]+$/;
const locationRegex = /^[0-9.,\-+\s]+$/;
const MOBILE_REGEX  = /^\d{10}$/;

const getLiveValidationMessage = (fieldName, value) => {
  const trimmed = value == null ? '' : String(value).trim();

  switch (fieldName) {
    case 'clinicName':
      if (!trimmed) return 'ClinicName is required';
      if (trimmed.length > 100) return 'ClinicName should not exceed 100 characters';
      if (!nameOnlyRegex.test(trimmed)) return 'ClinicName should not contain numbers or special characters';
      return '';
    case 'clinicType':
      if (!trimmed) return 'ClinicType is required';
      if (trimmed.length > 500) return 'ClinicType should not exceed 500 characters';
      if (!nameOnlyRegex.test(trimmed)) return 'ClinicType should not contain numbers or special characters';
      return '';
    case 'ownerName':
      if (!trimmed) return 'OwnerName is required';
      if (trimmed.length > 100) return 'OwnerName should not exceed 100 characters';
      if (!nameOnlyRegex.test(trimmed)) return 'OwnerName should not contain numbers or special characters';
      return '';
    case 'address':
      if (!trimmed) return 'Address is required';
      if (trimmed.length > 500) return 'Address should not exceed 500 characters';
      return '';
    case 'location':
      if (!trimmed) return 'Location is required';
      if (trimmed.length > 500) return 'Location should not exceed 500 characters';
      if (!locationRegex.test(trimmed)) return 'Location must contain only numbers, commas, dots, and coordinate characters';
      return '';
    case 'status':
      if (!value) return 'Status is required';
      return '';
    case 'mobile':
      if (!value || !value.trim()) return 'Mobile is required';
      if (value.trim().length !== 10) return 'Mobile length should be 10';
      if (!MOBILE_REGEX.test(value.trim())) return 'Invalid mobile number';
      return '';
    case 'altMobile':
      if (!value || !value.trim()) return 'Alternate Mobile is required';
      if (value.trim().length !== 10) return 'AltMobile length should be 10';
      if (!MOBILE_REGEX.test(value.trim())) return 'Invalid alternate mobile number';
      return '';
    case 'email':
      if (!value || !value.trim()) return 'Email is required';
      if (!value.includes('@')) return 'Email must contain @';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address';
      if (value.trim().length > 100) return 'Email must not exceed 100 characters';
      return '';
    case 'gstNo':
      if (!value || !value.trim()) return 'GstNo is required';
      if (value.trim().length < 15) return `GST number must be 15 characters (${value.trim().length}/15 entered)`;
      if (value.trim().length > 15) return 'GST number must not exceed 15 characters';
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.trim())) return 'Invalid GST format (e.g. 29ABCDE1234F1Z5)';
      return '';
    case 'cgstPercentage':
      if (value === '' || value === null || value === undefined) return 'CgstPercentage is required';
      if (isNaN(Number(value))) return 'CgstPercentage should be a decimal';
      return '';
    case 'sgstPercentage':
      if (value === '' || value === null || value === undefined) return 'SgstPercentage is required';
      if (isNaN(Number(value))) return 'SgstPercentage should be a decimal';
      return '';
    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'clinicName':
    case 'ownerName':
    case 'clinicType':
      return value.replace(/[^A-Za-z\s]/g, '');
    case 'location':
      return value.replace(/[^0-9.,\-+\s]/g, '');
    case 'mobile':
    case 'altMobile':
      return value.replace(/[^0-9]/g, '');
    case 'gstNo':
      return value.toUpperCase().replace(/[^0-9A-Z]/g, '').substring(0, 50);
    default:
      return value;
  }
};

const STATUS_OPTIONS   = [{ id: 1, label: 'Active' }, { id: 2, label: 'Inactive' }];
const VALIDATED_FIELDS = ['clinicName','address','location','clinicType','gstNo','cgstPercentage','sgstPercentage','ownerName','mobile','altMobile','email','status'];

// ─────────────────────────────────────────────────────────────────────────────
const UpdateClinic = ({ clinic, onClose, onSuccess, onError }) => {
  const [formData, setFormData] = useState({
    clinicName:          clinic.name           || '',
    address:             clinic.address        || '',
    location:            clinic.location       || '',
    clinicType:          clinic.clinicType     || '',
    gstNo:               clinic.gstNo          || '',
    cgstPercentage:      clinic.cgstPercentage || '',
    sgstPercentage:      clinic.sgstPercentage || '',
    ownerName:           clinic.ownerName      || '',
    mobile:              clinic.mobile         || '',
    altMobile:           clinic.altMobile      || '',
    email:               clinic.email          || '',
    status:              clinic.status === 'active' ? 1 : 2,
    inLabAvailable:      clinic.inLabAvailable      ?? 0,
    inPharmacyAvailable: clinic.inPharmacyAvailable ?? 0,
  });

  const [formLoading,        setFormLoading]        = useState(false);
  const [validationMessages, setValidationMessages] = useState({});
  const [submitAttempted,    setSubmitAttempted]    = useState(false);
  const [submitBtnDisabled,  setSubmitBtnDisabled]  = useState(false);

  // ── Logo state — initialised directly from the already-fetched clinic prop ──
  const [fileAccessToken,    setFileAccessToken]    = useState(clinic.fileAccessToken || '');
  const [existingLogoFileId, setExistingLogoFileId] = useState(clinic.logoFileId || 0);
  const [existingLogoUrl,    setExistingLogoUrl]    = useState(null);
  const [logoFetching,       setLogoFetching]       = useState(false);
  const [showLogoViewer,     setShowLogoViewer]     = useState(false);

  // ── Change logo state ──
  const [isChangingLogo,     setIsChangingLogo]     = useState(false);

  // ── New upload state ──
  const [newLogoFile,        setNewLogoFile]        = useState(null);
  const [newLogoPreviewUrl,  setNewLogoPreviewUrl]  = useState(null);
  const [logoUploading,      setLogoUploading]      = useState(false);
  const logoInputRef       = useRef(null);
  const changeLogoInputRef = useRef(null);

  // ── Internal popup ──
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (msg, type = 'success') => setPopup({ visible: true, message: msg, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── View existing logo ──
  const handleViewLogo = async () => {
    if (existingLogoUrl) { setShowLogoViewer(true); return; }
    if (!existingLogoFileId || !fileAccessToken) return;
    setLogoFetching(true);
    try {
      const result = await getFile(clinic.id, existingLogoFileId, fileAccessToken);
      setExistingLogoUrl(result.url);
      setShowLogoViewer(true);
    } catch (err) {
      showPopup(err.message || 'Failed to load logo.', 'error');
    } finally {
      setLogoFetching(false);
    }
  };

  const handleChangeLogo = () => {
    setIsChangingLogo(true);
    setNewLogoFile(null);
    setNewLogoPreviewUrl(null);
  };

  const handleCancelChangeLogo = () => {
    setIsChangingLogo(false);
    setNewLogoFile(null);
    setNewLogoPreviewUrl(null);
  };

  const handleLogoFileChange = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      showPopup('Only .jpg, .jpeg, or .png files are allowed.', 'error');
      return;
    }
    setNewLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setNewLogoPreviewUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Form validity ──
  const isFormValid = useMemo(() => {
    const required = ['clinicName','address','location','clinicType','gstNo','cgstPercentage','sgstPercentage','ownerName','mobile','altMobile','email'];
    const allFilled = required.every((f) => formData[f] !== '' && formData[f] !== null && formData[f] !== undefined && String(formData[f]).trim() !== '');
    if (!allFilled || !formData.status) return false;
    return !Object.values(validationMessages).some((msg) => !!msg);
  }, [formData, validationMessages]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filtered = filterInput(name, value);
    setFormData((prev) => ({ ...prev, [name]: filtered }));
    setValidationMessages((prev) => ({ ...prev, [name]: getLiveValidationMessage(name, filtered) }));
  };

  // ── Handler for Yes/No select fields (inLabAvailable, inPharmacyAvailable) ──
  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const validateAllFields = () => {
    const messages = {};
    let isValid = true;
    VALIDATED_FIELDS.forEach((field) => {
      const msg = getLiveValidationMessage(field, formData[field]);
      messages[field] = msg;
      if (msg) isValid = false;
    });
    setValidationMessages((prev) => ({ ...prev, ...messages }));
    return isValid;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) { setSubmitAttempted(true); validateAllFields(); showPopup('Please fill all required fields before submitting.', 'warning'); return; }
    if (!validateAllFields()) { showPopup('Please fill all required fields before submitting.', 'warning'); return; }

    setSubmitBtnDisabled(true);
    setTimeout(() => setSubmitBtnDisabled(false), 2000);
    setFormLoading(true);

    try {
      let resolvedLogoFileId = existingLogoFileId || 0;

      if ((!existingLogoFileId && newLogoFile) || (isChangingLogo && newLogoFile)) {
        setLogoUploading(true);
        try {
          const uploadResult    = await uploadPhoto(clinic.id, newLogoFile, fileAccessToken);
          resolvedLogoFileId    = uploadResult.fileId;
          setExistingLogoFileId(resolvedLogoFileId);
          setExistingLogoUrl(null);
          setNewLogoFile(null);
          setNewLogoPreviewUrl(null);
          setIsChangingLogo(false);
        } catch (uploadErr) {
          showPopup(uploadErr.message || 'Logo upload failed. Please try again.', 'error');
          setLogoUploading(false);
          setFormLoading(false);
          setSubmitBtnDisabled(false);
          return;
        } finally {
          setLogoUploading(false);
        }
      }

      await updateClinic({
        clinicId:            Number(clinic.id),
        ClinicName:          formData.clinicName.trim(),
        Address:             formData.address.trim(),
        Location:            formData.location.trim(),
        ClinicType:          formData.clinicType.trim(),
        GstNo:               formData.gstNo.trim(),
        CgstPercentage:      Number(formData.cgstPercentage),
        SgstPercentage:      Number(formData.sgstPercentage),
        OwnerName:           formData.ownerName.trim(),
        Mobile:              formData.mobile.trim(),
        AltMobile:           formData.altMobile.trim(),
        Email:               formData.email.trim(),
        Status:              Number(formData.status),
        inLabAvailable:      formData.inLabAvailable,
        inPharmacyAvailable: formData.inPharmacyAvailable,
        logoFileId:          resolvedLogoFileId,
      });

      showPopup('Clinic updated successfully!', 'success');
      setTimeout(() => { if (onSuccess) onSuccess(); }, 1000);

    } catch (err) {
      const errMsg = err.message || 'Failed to update clinic. Please try again.';
      showPopup(errMsg, 'error');
      if (onError) onError(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  return (
    <div className={styles.detailModalOverlay}>

      <MessagePopup visible={popup.visible} message={popup.message} type={popup.type} onClose={closePopup} />

      <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.detailModalHeader}>
          <div className={styles.detailHeaderContent}>
            <h2>Update Clinic</h2>
            <div className={styles.detailHeaderMeta}>
              <span className={styles.workIdBadge}>{formData.clinicName || 'Clinic'}</span>
              <span className={`${styles.workIdBadge} ${formData.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>
                {formData.status === 1 ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className={styles.detailCloseBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.addModalBody}>

          {/* ── Clinic Logo ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Photo Upload</h3></div>

            {existingLogoFileId > 0 && !isChangingLogo ? (
              <div className={styles.logoExistingRow}>
                <span className={styles.logoExistingLabel}>
                  Logo on file (ID: {existingLogoFileId})
                </span>
                <div className={styles.logoActionBtns}>
                  <button type="button" className={styles.logoViewBtn} onClick={handleViewLogo} disabled={logoFetching}>
                    <FiEye size={14} />{logoFetching ? 'Loading...' : 'View Logo'}
                  </button>
                  <button type="button" className={styles.logoChangeBtn} onClick={handleChangeLogo}>
                    <FiUpload size={14} />Change Logo
                  </button>
                </div>
              </div>
            ) : existingLogoFileId > 0 && isChangingLogo ? (
              <>
                <input ref={changeLogoInputRef} type="file" accept=".jpg,.jpeg,.png" className={styles.logoHiddenInput} onChange={(e) => handleLogoFileChange(e.target.files?.[0])} />
                <div className={styles.photoUploadRow}>
                  <div className={styles.photoThumb} onClick={() => changeLogoInputRef.current?.click()} title="Click to select new photo">
                    {newLogoPreviewUrl ? (
                      <img src={newLogoPreviewUrl} alt="Preview" className={styles.photoThumbImg} />
                    ) : (
                      <div className={styles.photoThumbPlaceholder}>
                        <FiUpload size={20} className={styles.photoThumbIcon} />
                        <span className={styles.photoThumbText}>No photo selected</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.photoUploadRight}>
                    <button type="button" className={styles.selectPhotoBtn} onClick={() => changeLogoInputRef.current?.click()}>
                      <FiUpload size={13} />{newLogoFile ? 'Change Photo' : 'Select Photo'}
                    </button>
                    <span className={styles.photoFormatHint}>JPG, JPEG or PNG · Max 4MB</span>
                    {newLogoFile && <span className={styles.photoSelectedName}>{newLogoFile.name}</span>}
                    <button type="button" className={styles.logoCancelChangeBtn} onClick={handleCancelChangeLogo}>Cancel</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <input ref={logoInputRef} type="file" accept=".jpg,.jpeg,.png" className={styles.logoHiddenInput} onChange={(e) => handleLogoFileChange(e.target.files?.[0])} />
                <div className={styles.photoUploadRow}>
                  <div className={styles.photoThumb} onClick={() => logoInputRef.current?.click()} title="Click to select photo">
                    {newLogoPreviewUrl ? (
                      <img src={newLogoPreviewUrl} alt="Preview" className={styles.photoThumbImg} />
                    ) : (
                      <div className={styles.photoThumbPlaceholder}>
                        <FiUpload size={20} className={styles.photoThumbIcon} />
                        <span className={styles.photoThumbText}>No photo selected</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.photoUploadRight}>
                    <button type="button" className={styles.selectPhotoBtn} onClick={() => logoInputRef.current?.click()}>
                      <FiUpload size={13} />{newLogoFile ? 'Change Photo' : 'Select Photo'}
                    </button>
                    <span className={styles.photoFormatHint}>JPG, JPEG or PNG · Max 4MB</span>
                    {newLogoFile && <span className={styles.photoSelectedName}>{newLogoFile.name}</span>}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Basic Information ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Basic Information</h3></div>
            <div className={styles.addFormGrid}>
              <div className={styles.addFormGroup}>
                <label>Clinic Name <span className={styles.required}>*</span></label>
                <input required name="clinicName" value={formData.clinicName} onChange={handleInputChange} placeholder="Enter clinic name" />
                {validationMessages.clinicName && <span className={styles.validationMsg}>{validationMessages.clinicName}</span>}
              </div>
              <div className={styles.addFormGroup}>
                <label>Clinic Type <span className={styles.required}>*</span></label>
                <input required name="clinicType" value={formData.clinicType} onChange={handleInputChange} placeholder="e.g. Dental, General" />
                {validationMessages.clinicType && <span className={styles.validationMsg}>{validationMessages.clinicType}</span>}
              </div>
              <div className={styles.addFormGroup}>
                <label>Owner Name <span className={styles.required}>*</span></label>
                <input required name="ownerName" value={formData.ownerName} onChange={handleInputChange} placeholder="Enter owner name" />
                {validationMessages.ownerName && <span className={styles.validationMsg}>{validationMessages.ownerName}</span>}
              </div>
              <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                <label>Address <span className={styles.required}>*</span></label>
                <textarea required name="address" rows={2} value={formData.address} onChange={handleInputChange} placeholder="Enter full address" />
                {validationMessages.address && <span className={styles.validationMsg}>{validationMessages.address}</span>}
              </div>
              <div className={styles.addFormGroup}>
                <label>Location <span className={styles.required}>*</span></label>
                <input required name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. 9.9252, 78.1198" />
                {validationMessages.location && <span className={styles.validationMsg}>{validationMessages.location}</span>}
              </div>
              <div className={styles.addFormGroup}>
                <label>Status <span className={styles.required}>*</span></label>
                <select required name="status" value={formData.status} onChange={handleInputChange}>
                  {STATUS_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                {validationMessages.status && <span className={styles.validationMsg}>{validationMessages.status}</span>}
              </div>
            </div>
          </div>

          {/* ── Contact Information ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Contact Information</h3></div>
            <div className={styles.addFormGridThreeCol}>
              <div className={styles.addFormGroup}>
                <label>Mobile <span className={styles.required}>*</span></label>
                <input required name="mobile" value={formData.mobile} onChange={handleInputChange} maxLength="20" placeholder="Enter mobile number" />
                {validationMessages.mobile && <span className={styles.validationMsg}>{validationMessages.mobile}</span>}
              </div>
              <div className={styles.addFormGroup}>
                <label>Alternate Mobile <span className={styles.required}>*</span></label>
                <input required name="altMobile" value={formData.altMobile} onChange={handleInputChange} maxLength="20" placeholder="Enter alternate mobile" />
                {validationMessages.altMobile && <span className={styles.validationMsg}>{validationMessages.altMobile}</span>}
              </div>
              <div className={styles.addFormGroup}>
                <label>Email <span className={styles.required}>*</span></label>
                <input required type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="clinic@example.com" />
                {validationMessages.email && <span className={styles.validationMsg}>{validationMessages.email}</span>}
              </div>
            </div>
          </div>

          {/* ── Tax Information ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Tax Information</h3></div>
            <div className={styles.addFormGridThreeCol}>
              <div className={styles.addFormGroup}>
                <label>GST Number <span className={styles.required}>*</span></label>
                <input required name="gstNo" value={formData.gstNo} onChange={handleInputChange} placeholder="e.g. 33ABCDE1234F1Z5" maxLength={50} />
                {validationMessages.gstNo && <span className={styles.validationMsg}>{validationMessages.gstNo}</span>}
              </div>
              <div className={styles.addFormGroup}>
                <label>CGST Percentage <span className={styles.required}>*</span></label>
                <input required type="number" step="0.01" min="0" max="100" name="cgstPercentage" value={formData.cgstPercentage} onChange={handleInputChange} placeholder="0.00" />
                {validationMessages.cgstPercentage && <span className={styles.validationMsg}>{validationMessages.cgstPercentage}</span>}
              </div>
              <div className={styles.addFormGroup}>
                <label>SGST Percentage <span className={styles.required}>*</span></label>
                <input required type="number" step="0.01" min="0" max="100" name="sgstPercentage" value={formData.sgstPercentage} onChange={handleInputChange} placeholder="0.00" />
                {validationMessages.sgstPercentage && <span className={styles.validationMsg}>{validationMessages.sgstPercentage}</span>}
              </div>
            </div>
          </div>

          {/* ── Availability ── */}
          <div className={styles.addSection}>
            <div className={styles.addSectionHeader}><h3>Availability</h3></div>
            <div className={styles.addFormGrid}>
              <div className={styles.addFormGroup}>
                <label>In-Lab Available</label>
                <select name="inLabAvailable" value={formData.inLabAvailable} onChange={handleAvailabilityChange}>
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>
              <div className={styles.addFormGroup}>
                <label>In-Pharmacy Available</label>
                <select name="inPharmacyAvailable" value={formData.inPharmacyAvailable} onChange={handleAvailabilityChange}>
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.detailModalFooter}>
            <button type="button" onClick={onClose} className={styles.btnCancel}>Cancel</button>
            <button
              type="submit"
              disabled={formLoading || submitBtnDisabled || logoUploading}
              className={`${styles.btnSubmit} ${!isFormValid ? styles.btnSubmitDisabled : ''}`}
              title={!isFormValid ? 'Please fill all required fields' : ''}
              style={{ opacity: formLoading || submitBtnDisabled || logoUploading ? 0.6 : 1, cursor: formLoading || submitBtnDisabled || logoUploading ? 'not-allowed' : 'pointer' }}
            >
              <FiSave className={styles.btnIcon} />
              {logoUploading ? 'Uploading logo...' : formLoading ? 'Updating...' : submitBtnDisabled ? 'Please wait...' : 'Update Clinic'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Logo lightbox ── */}
      {showLogoViewer && existingLogoUrl && (
        <div className={styles.logoLightboxOverlay} onClick={() => setShowLogoViewer(false)}>
          <div className={styles.logoLightboxBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.logoLightboxHeader}>
              <span className={styles.logoLightboxTitle}>Clinic Logo</span>
              <button className={styles.detailCloseBtn} onClick={() => setShowLogoViewer(false)}>✕</button>
            </div>
            <div className={styles.logoLightboxBody}>
              <img src={existingLogoUrl} alt="Clinic logo" className={styles.logoLightboxImg} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateClinic;