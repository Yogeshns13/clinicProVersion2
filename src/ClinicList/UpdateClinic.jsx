// src/components/UpdateClinic.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave } from 'react-icons/fi';
import { getClinicList, updateClinic } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ClinicList.module.css';

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'clinicName':
      if (!value || !value.trim()) return 'Clinic name is required';
      if (value.trim().length < 3) return 'Clinic name must be at least 3 characters';
      if (value.trim().length > 100) return 'Clinic name must not exceed 100 characters';
      return '';

    case 'ownerName':
      if (!value || !value.trim()) return 'Owner name is required';
      if (value.trim().length < 3) return 'Owner name must be at least 3 characters';
      if (value.trim().length > 100) return 'Owner name must not exceed 100 characters';
      return '';

    case 'mobile':
      if (!value || !value.trim()) return 'Mobile number is required';
      if (value.trim().length < 10) return 'Mobile number must be 10 digits';
      if (value.trim().length === 10) {
        if (!/^[6-9]\d{9}$/.test(value.trim())) return 'Mobile number must start with 6-9';
      }
      if (value.trim().length > 10) return 'Mobile number cannot exceed 10 digits';
      return '';

    case 'altMobile':
      if (value && value.trim()) {
        if (value.trim().length < 10) return 'Mobile number must be 10 digits';
        if (value.trim().length === 10) {
          if (!/^[6-9]\d{9}$/.test(value.trim())) return 'Mobile number must start with 6-9';
        }
        if (value.trim().length > 10) return 'Mobile number cannot exceed 10 digits';
      }
      return '';

    case 'email':
      if (value && value.trim()) {
        if (!value.includes('@')) return 'Email must contain @';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address';
      }
      return '';

    case 'gstNo': {
      if (!value || value === '') return '';
      const len = value.length;
      if (len >= 1  && !/^[0-9]$/.test(value[0]))  return 'Char 1: Must be digit (State Code)';
      if (len >= 2  && !/^[0-9]$/.test(value[1]))  return 'Char 2: Must be digit (State Code)';
      if (len >= 3  && !/^[A-Z]$/.test(value[2]))  return 'Char 3: Must be uppercase letter (PAN letter 1/5)';
      if (len >= 4  && !/^[A-Z]$/.test(value[3]))  return 'Char 4: Must be uppercase letter (PAN letter 2/5)';
      if (len >= 5  && !/^[A-Z]$/.test(value[4]))  return 'Char 5: Must be uppercase letter (PAN letter 3/5)';
      if (len >= 6  && !/^[A-Z]$/.test(value[5]))  return 'Char 6: Must be uppercase letter (PAN letter 4/5)';
      if (len >= 7  && !/^[A-Z]$/.test(value[6]))  return 'Char 7: Must be uppercase letter (PAN letter 5/5)';
      if (len >= 8  && !/^[0-9]$/.test(value[7]))  return 'Char 8: Must be digit (PAN number 1/4)';
      if (len >= 9  && !/^[0-9]$/.test(value[8]))  return 'Char 9: Must be digit (PAN number 2/4)';
      if (len >= 10 && !/^[0-9]$/.test(value[9]))  return 'Char 10: Must be digit (PAN number 3/4)';
      if (len >= 11 && !/^[0-9]$/.test(value[10])) return 'Char 11: Must be digit (PAN number 4/4)';
      if (len >= 12 && !/^[A-Z]$/.test(value[11])) return 'Char 12: Must be uppercase letter (PAN last letter)';
      if (len >= 13 && !/^[1-9A-Z]$/.test(value[12])) return 'Char 13: Must be 1-9 or A-Z (Entity number, not 0)';
      if (len >= 14 && value[13] !== 'Z')           return 'Char 14: Must be Z (fixed)';
      if (len >= 15 && !/^[0-9A-Z]$/.test(value[14])) return 'Char 15: Must be digit or uppercase letter (Checksum)';
      if (len < 15)  return `${len}/15 characters entered`;
      if (len === 15) return 'Valid GST format (29ABCDE1234F1Z5)';
      return '';
    }

    case 'cgstPercentage':
    case 'sgstPercentage': {
      if (value === '' || value === null || value === undefined) return '';
      const num = Number(value);
      if (isNaN(num)) return 'Must be a number';
      if (num < 0)    return 'Cannot be negative';
      if (num > 100)  return 'Cannot exceed 100';
      return '';
    }

    case 'fileNoPrefix':
    case 'invoicePrefix':
      if (value && value.trim()) {
        if (value.trim().length > 10) return 'Must not exceed 10 characters';
        if (!/^[A-Za-z0-9-_]*$/.test(value.trim())) return 'Only letters, numbers, hyphens, and underscores allowed';
      }
      return '';

    case 'lastFileSeq': {
      if (value === '' || value === null || value === undefined) return '';
      const seq = Number(value);
      if (isNaN(seq)) return 'Must be a number';
      if (seq < 0)    return 'Cannot be negative';
      return '';
    }

    case 'address':
      if (value && value.length > 500) return 'Address must not exceed 500 characters';
      return '';

    case 'location':
      if (value && value.length > 100) return 'Location must not exceed 100 characters';
      return '';

    case 'clinicType':
      if (value && value.length > 50) return 'Clinic type must not exceed 50 characters';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'clinicName':
    case 'ownerName':
    case 'location':
    case 'clinicType':
      return value.replace(/[^a-zA-Z\s]/g, '');
    case 'mobile':
    case 'altMobile':
      return value.replace(/[^0-9]/g, '');
    case 'gstNo': {
      const filtered = value.replace(/[^A-Z0-9]/g, '');
      return filtered.substring(0, 15), value.toUpperCase();
    }
    case 'fileNoPrefix':
    case 'invoicePrefix':
      return value.replace(/[^A-Za-z0-9-_]/g, ''), value.toUpperCase();
    case 'cgstPercentage':
    case 'sgstPercentage':
    case 'lastFileSeq':
      return value.replace(/[^0-9.]/g, '');
    default:
      return value;
  }
};

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ────────────────────────────────────────────────
const UpdateClinic = () => {
  const navigate  = useNavigate();
  const params    = useParams();
  const clinicId  = params.clinicId || params.id;

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [clinicData, setClinicData] = useState(null);

  const [formData, setFormData] = useState({
    clinicName: '', address: '', location: '', clinicType: '',
    gstNo: '', cgstPercentage: 0, sgstPercentage: 0,
    ownerName: '', mobile: '', altMobile: '', email: '',
    fileNoPrefix: '', invoicePrefix: '', status: 1,
  });

  const [formLoading,         setFormLoading]         = useState(false);
  const [formError,           setFormError]           = useState('');
  const [formSuccess,         setFormSuccess]         = useState(false);
  const [validationMessages,  setValidationMessages]  = useState({});

  // ── close = go back to list ──
  const handleClose = () => navigate('/clinic-list');

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const clinicList = await getClinicList();
        const clinic = clinicList.find((c) => c.id === Number(clinicId));
        if (!clinic) throw new Error(`Clinic not found with ID: ${clinicId}`);

        setClinicData(clinic);
        setFormData({
          clinicName:      clinic.name           || '',
          address:         clinic.address        || '',
          location:        clinic.location       || '',
          clinicType:      clinic.clinicType     || '',
          gstNo:           clinic.gstNo          || '',
          cgstPercentage:  clinic.cgstPercentage || 0,
          sgstPercentage:  clinic.sgstPercentage || 0,
          ownerName:       clinic.ownerName      || '',
          mobile:          clinic.mobile         || '',
          altMobile:       clinic.altMobile      || '',
          email:           clinic.email          || '',
          fileNoPrefix:    clinic.fileNoPrefix   || '',
          invoicePrefix:   clinic.invoicePrefix  || '',
          status:          clinic.status === 'active' ? 1 : 2,
        });
      } catch (err) {
        setError({ message: err.message || 'Failed to load clinic data', status: err.status || 500 });
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) fetchData();
    else { setLoading(false); setError({ message: 'No clinic ID provided', status: 400 }); }
  }, [clinicId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    setValidationMessages((prev) => ({ ...prev, [name]: getLiveValidationMessage(name, filteredValue) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await updateClinic({
        clinicId:       Number(clinicId),
        ClinicName:     formData.clinicName.trim(),
        Address:        formData.address.trim(),
        Location:       formData.location.trim(),
        ClinicType:     formData.clinicType.trim(),
        GstNo:          formData.gstNo.trim(),
        CgstPercentage: Number(formData.cgstPercentage),
        SgstPercentage: Number(formData.sgstPercentage),
        OwnerName:      formData.ownerName.trim(),
        Mobile:         formData.mobile.trim(),
        AltMobile:      formData.altMobile.trim(),
        Email:          formData.email.trim(),
        FileNoPrefix:   formData.fileNoPrefix.trim(),
        InvoicePrefix:  formData.invoicePrefix.trim(),
        Status:         Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => navigate('/clinic-list'), 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update clinic.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.clinicLoading}>Loading clinic data...</div>;

  // ────────────────────────────────────────────────
  // Shared onKeyDown / onPaste handlers for prefix fields
  const prefixKeyDown = (e) => {
    const char = e.key;
    if (['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Tab','Enter'].includes(char) || e.ctrlKey || e.metaKey) return;
    if (!/[A-Za-z0-9_-]/.test(char)) e.preventDefault();
  };

  const prefixPaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const clean  = pasted.replace(/[^A-Za-z0-9_-]/g, '');
    const input  = e.target;
    const newValue = input.value.substring(0, input.selectionStart) + clean + input.value.substring(input.selectionEnd);
    setFormData((prev) => ({ ...prev, [input.name]: newValue }));
  };

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Update Clinic" />

      {/* ── Modal Overlay — clicking backdrop closes ── */}
      <div className={styles.detailModalOverlay} onClick={handleClose}>
        <div className={styles.addModalContent} onClick={(e) => e.stopPropagation()}>

          {/* ── Gradient Header ── */}
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
            <button onClick={handleClose} className={styles.detailCloseBtn}>✕</button>
          </div>

          {/* ── Scrollable Form Body ── */}
          <form onSubmit={handleSubmit} className={styles.addModalBody}>
            {formError   && <div className={styles.formError}>{formError}</div>}
            {formSuccess  && <div className={styles.formSuccess}>Clinic updated successfully!</div>}

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
                  <label>Clinic Type</label>
                  <input name="clinicType" value={formData.clinicType} onChange={handleInputChange} placeholder="e.g. Dental, General" />
                  {validationMessages.clinicType && <span className={styles.validationMsg}>{validationMessages.clinicType}</span>}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Owner Name <span className={styles.required}>*</span></label>
                  <input required name="ownerName" value={formData.ownerName} onChange={handleInputChange} placeholder="Enter owner name" />
                  {validationMessages.ownerName && <span className={styles.validationMsg}>{validationMessages.ownerName}</span>}
                </div>

                <div className={`${styles.addFormGroup} ${styles.fullWidth}`}>
                  <label>Address</label>
                  <textarea name="address" rows={2} value={formData.address} onChange={handleInputChange} placeholder="Enter full address" />
                  {validationMessages.address && <span className={styles.validationMsg}>{validationMessages.address}</span>}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Location</label>
                  <input name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. 9.9252, 78.1198" />
                  {validationMessages.location && <span className={styles.validationMsg}>{validationMessages.location}</span>}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Status <span className={styles.required}>*</span></label>
                  <select required name="status" value={formData.status} onChange={handleInputChange}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* ── Contact Information — 3 columns ── */}
            <div className={styles.addSection}>
              <div className={styles.addSectionHeader}><h3>Contact Information</h3></div>
              <div className={styles.addFormGridThreeCol}>

                <div className={styles.addFormGroup}>
                  <label>Mobile <span className={styles.required}>*</span></label>
                  <input required name="mobile" value={formData.mobile} onChange={handleInputChange} maxLength="10" placeholder="10-digit mobile" />
                  {validationMessages.mobile && <span className={styles.validationMsg}>{validationMessages.mobile}</span>}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Alternate Mobile</label>
                  <input name="altMobile" value={formData.altMobile} onChange={handleInputChange} maxLength="10" placeholder="Optional alt number" />
                  {validationMessages.altMobile && <span className={styles.validationMsg}>{validationMessages.altMobile}</span>}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="clinic@example.com" />
                  {validationMessages.email && <span className={styles.validationMsg}>{validationMessages.email}</span>}
                </div>

              </div>
            </div>

            {/* ── Tax Information — 3 columns ── */}
            <div className={styles.addSection}>
              <div className={styles.addSectionHeader}><h3>Tax Information</h3></div>
              <div className={styles.addFormGridThreeCol}>

                <div className={styles.addFormGroup}>
                  <label>GST Number</label>
                  <input name="gstNo" value={formData.gstNo} onChange={handleInputChange} placeholder="e.g. 29ABCDE1234F1Z5" />
                  {validationMessages.gstNo && <span className={styles.validationMsg}>{validationMessages.gstNo}</span>}
                </div>

                <div className={styles.addFormGroup}>
                  <label>CGST Percentage</label>
                  <input type="number" name="cgstPercentage" value={formData.cgstPercentage} onChange={handleInputChange} min="0" step="0.01" placeholder="0.00" />
                  {validationMessages.cgstPercentage && <span className={styles.validationMsg}>{validationMessages.cgstPercentage}</span>}
                </div>

                <div className={styles.addFormGroup}>
                  <label>SGST Percentage</label>
                  <input type="number" name="sgstPercentage" value={formData.sgstPercentage} onChange={handleInputChange} min="0" step="0.01" placeholder="0.00" />
                  {validationMessages.sgstPercentage && <span className={styles.validationMsg}>{validationMessages.sgstPercentage}</span>}
                </div>

              </div>
            </div>

            {/* ── Billing Configuration ── */}
            <div className={styles.addSection}>
              <div className={styles.addSectionHeader}><h3>Billing Configuration</h3></div>
              <div className={styles.addFormGrid}>

                <div className={styles.addFormGroup}>
                  <label>File No Prefix</label>
                  <input
                    name="fileNoPrefix"
                    value={formData.fileNoPrefix}
                    onChange={handleInputChange}
                    onKeyDown={prefixKeyDown}
                    onPaste={prefixPaste}
                    placeholder="e.g. FILE-2026_DOC"
                    maxLength={20}
                  />
                  {validationMessages.fileNoPrefix && <span className={styles.validationMsg}>{validationMessages.fileNoPrefix}</span>}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Last File Sequence</label>
                  <input type="number" name="lastFileSeq" value={formData.lastFileSeq} onChange={handleInputChange} min="0" placeholder="0" />
                  {validationMessages.lastFileSeq && <span className={styles.validationMsg}>{validationMessages.lastFileSeq}</span>}
                </div>

                <div className={styles.addFormGroup}>
                  <label>Invoice Prefix</label>
                  <input
                    type="text"
                    name="invoicePrefix"
                    value={formData.invoicePrefix || ''}
                    onChange={handleInputChange}
                    onKeyDown={prefixKeyDown}
                    onPaste={prefixPaste}
                    placeholder="e.g. INV-2026_ABC"
                    maxLength={20}
                  />
                  {validationMessages.invoicePrefix && <span className={styles.validationMsg}>{validationMessages.invoicePrefix}</span>}
                </div>

              </div>
            </div>

            {/* ── Footer ── */}
            <div className={styles.detailModalFooter}>
              <button type="button" onClick={handleClose} className={styles.btnCancel}>
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                <FiSave className={styles.btnIcon} />
                {formLoading ? 'Updating...' : 'Update Clinic'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateClinic;