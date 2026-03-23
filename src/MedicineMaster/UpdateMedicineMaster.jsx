// src/components/UpdateMedicineMaster.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiPackage, FiDollarSign, FiX } from 'react-icons/fi';
import { getMedicineMasterList, updateMedicineMaster } from '../Api/ApiPharmacy.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
import MessagePopup from '../Hooks/MessagePopup.jsx';
import styles from './UpdateMedicineMaster.module.css';
import { FaClinicMedical } from 'react-icons/fa';
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const MEDICINE_TYPES = [
  { value: 1,  label: 'Tablet' },
  { value: 2,  label: 'Capsule' },
  { value: 3,  label: 'Syrup' },
  { value: 4,  label: 'Injection' },
  { value: 5,  label: 'Ointment' },
  { value: 6,  label: 'Drops' },
  { value: 7,  label: 'Powder' },
  { value: 8,  label: 'Gel' },
  { value: 9,  label: 'Cream' },
  { value: 10, label: 'Inhaler' },
];

const MEDICINE_UNITS = [
  { value: 1,  label: 'Strip' },
  { value: 2,  label: 'Bottle' },
  { value: 3,  label: 'Vial' },
  { value: 4,  label: 'Tube' },
  { value: 5,  label: 'Box' },
  { value: 6,  label: 'Ampoule' },
  { value: 7,  label: 'Sachet' },
  { value: 8,  label: 'Blister Pack' },
  { value: 9,  label: 'Jar' },
  { value: 10, label: 'Roll' },
];

const TIMING_OPTIONS = [
  { key: 'M', label: 'Morning' },
  { key: 'A', label: 'Afternoon' },
  { key: 'E', label: 'Evening' },
  { key: 'N', label: 'Night' },
];

const parseTimingString = (str) =>
  str ? str.split('|').filter(k => TIMING_OPTIONS.some(o => o.key === k)) : [];

const buildTimingString = (selected) =>
  TIMING_OPTIONS.filter(o => selected.includes(o.key)).map(o => o.key).join('|');

// ── Validation ──────────────────────────────────────────
const nameRegex    = /^[A-Za-z0-9\s.,\-()[\]/+]+$/;
const decimalRegex = /^\d+(\.\d{1,2})?$/;

const validateAll = (data) => {
  const errors = {};

  if (!data.name.trim()) {
    errors.name = 'Medicine name is required';
  } else if (data.name.trim().length > 200) {
    errors.name = 'Name must be 1–200 characters';
  } else if (!nameRegex.test(data.name.trim())) {
    errors.name = 'Name contains invalid characters';
  }

  if (!data.type || data.type === 0) {
    errors.type = 'Medicine type is required';
  }

  if (!data.unit || data.unit === 0) {
    errors.unit = 'Unit is required';
  }

  if (data.genericName && data.genericName.length > 500) {
    errors.genericName = 'Generic name must be at most 500 characters';
  }

  if (data.composition && data.composition.length > 500) {
    errors.composition = 'Composition must be at most 500 characters';
  }

  if (data.manufacturer && data.manufacturer.length > 200) {
    errors.manufacturer = 'Manufacturer must be at most 200 characters';
  }

  if (data.dosageForm && data.dosageForm.length > 100) {
    errors.dosageForm = 'Dosage form must be at most 100 characters';
  }

  if (data.hsnCode && data.hsnCode.length > 20) {
    errors.hsnCode = 'HSN Code must be at most 20 characters';
  }

  if (data.barcode && data.barcode.length > 100) {
    errors.barcode = 'Barcode must be at most 100 characters';
  }

  if (data.reorderLevelQty !== 0) {
    if (!Number.isInteger(Number(data.reorderLevelQty)) || Number(data.reorderLevelQty) < 0) {
      errors.reorderLevelQty = 'Reorder level must be a non-negative integer';
    }
  }

  if (data.stockQuantity !== 0) {
    if (!Number.isInteger(Number(data.stockQuantity)) || Number(data.stockQuantity) < 0) {
      errors.stockQuantity = 'Stock quantity must be a non-negative integer';
    }
  }

  if (data.mrp === '' || data.mrp === 0 || data.mrp === null || data.mrp === undefined) {
    errors.mrp = 'MRP is required';
  } else if (!decimalRegex.test(String(data.mrp))) {
    errors.mrp = 'MRP must be a valid decimal with up to 2 decimal places';
  }

  if (data.purchasePrice === '' || data.purchasePrice === 0 || data.purchasePrice === null || data.purchasePrice === undefined) {
    errors.purchasePrice = 'Purchase price is required';
  } else if (!decimalRegex.test(String(data.purchasePrice))) {
    errors.purchasePrice = 'Purchase price must be a valid decimal with up to 2 decimal places';
  }

  if (data.sellPrice === '' || data.sellPrice === 0 || data.sellPrice === null || data.sellPrice === undefined) {
    errors.sellPrice = 'Sell price is required';
  } else if (!decimalRegex.test(String(data.sellPrice))) {
    errors.sellPrice = 'Sell price must be a valid decimal with up to 2 decimal places';
  }

  if (data.cgstPercentage !== '' && data.cgstPercentage !== 0) {
    if (!decimalRegex.test(String(data.cgstPercentage))) {
      errors.cgstPercentage = 'CGST must be a valid decimal with up to 2 decimal places';
    } else if (Number(data.cgstPercentage) > 100) {
      errors.cgstPercentage = 'CGST percentage cannot exceed 100';
    }
  }

  if (data.sgstPercentage !== '' && data.sgstPercentage !== 0) {
    if (!decimalRegex.test(String(data.sgstPercentage))) {
      errors.sgstPercentage = 'SGST must be a valid decimal with up to 2 decimal places';
    } else if (Number(data.sgstPercentage) > 100) {
      errors.sgstPercentage = 'SGST percentage cannot exceed 100';
    }
  }

  return errors;
};

// ──────────────────────────────────────────────────
const UpdateMedicineMaster = ({
  isModal    = false,
  onClose,
  onSuccess,
  medicineId,
}) => {
  const { id: paramId } = useParams();
  const navigate        = useNavigate();

  const id = isModal ? medicineId : paramId;

  const [medicine, setMedicine]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [selectedTiming, setSelectedTiming] = useState([]);

  // Validation state
  const [fieldErrors, setFieldErrors]   = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name:            '',
    genericName:     '',
    composition:     '',
    manufacturer:    '',
    type:            0,
    dosageForm:      '',
    doseCount:       1,
    unit:            0,
    hsnCode:         '',
    reorderLevelQty: 0,
    mrp:             0,
    purchasePrice:   0,
    sellPrice:       0,
    stockQuantity:   0,
    cgstPercentage:  0,
    sgstPercentage:  0,
    barcode:         '',
    status:          1,
  });

  // ── MessagePopup state ──────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  // ── Submit button gating ────────────────────────
  // Enabled only when required fields (name, type, unit, mrp, purchasePrice, sellPrice) are filled
  const allRequiredFilled =
    formData.name.trim().length > 0 &&
    Number(formData.type) > 0 &&
    Number(formData.unit) > 0 &&
    Number(formData.mrp) > 0 &&
    Number(formData.purchasePrice) > 0 &&
    Number(formData.sellPrice) > 0;

  useEffect(() => {
    if (id) fetchMedicineDetails();
  }, [id]);

  const fetchMedicineDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const data = await getMedicineMasterList(clinicId, {
        Page: 1, PageSize: 1, BranchID: branchId, MedicineID: Number(id),
      });

      if (data && data.length > 0) {
        const med = data[0];
        setMedicine(med);
        setFormData({
          name:            med.name            || '',
          genericName:     med.genericName     || '',
          composition:     med.composition     || '',
          manufacturer:    med.manufacturer    || '',
          type:            med.type            || 0,
          dosageForm:      med.dosageForm      || '',
          doseCount:       med.doseCount       ?? 1,
          unit:            med.unit            || 0,
          hsnCode:         med.hsnCode         || '',
          reorderLevelQty: med.reorderLevelQty || 0,
          mrp:             parseFloat(med.mrp)            || 0,
          purchasePrice:   parseFloat(med.purchasePrice)  || 0,
          sellPrice:       parseFloat(med.sellPrice)      || 0,
          stockQuantity:   med.stockQuantity   || 0,
          cgstPercentage:  parseFloat(med.cgstPercentage) || 0,
          sgstPercentage:  parseFloat(med.sgstPercentage) || 0,
          barcode:         med.barcode         || '',
          status:          med.status === 'active' ? 1 : 0,
        });
        setSelectedTiming(parseTimingString(med.timing || ''));
      } else {
        setError({ message: 'Medicine not found' });
      }
    } catch (err) {
      console.error('fetchMedicineDetails error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    const newFormData = type === 'number'
      ? { ...formData, [name]: value === '' ? 0 : Number(value) }
      : { ...formData, [name]: value };

    setFormData(newFormData);

    // Re-validate live only after first submit attempt
    if (hasSubmitted) {
      setFieldErrors(validateAll(newFormData));
    }
  };

  const handleTimingToggle = (key) => {
    setSelectedTiming(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateAll(formData);
    setFieldErrors(errors);
    setHasSubmitted(true);

    // Block submit + show warning popup if any validation error exists
    if (Object.keys(errors).length > 0) {
      showPopup('Please fill all required fields correctly before submitting.', 'warning');
      return;
    }

    try {
      setSubmitLoading(true);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const updateData = {
        medicineId:      Number(id),
        clinicId,
        branchId,
        name:            formData.name.trim(),
        genericName:     formData.genericName.trim(),
        composition:     formData.composition.trim(),
        manufacturer:    formData.manufacturer.trim(),
        type:            formData.type,
        dosageForm:      formData.dosageForm.trim(),
        doseCount:       formData.doseCount,
        unit:            formData.unit,
        hsnCode:         formData.hsnCode.trim(),
        reorderLevelQty: formData.reorderLevelQty,
        mrp:             formData.mrp,
        purchasePrice:   formData.purchasePrice,
        sellPrice:       formData.sellPrice,
        stockQuantity:   formData.stockQuantity,
        cgstPercentage:  formData.cgstPercentage,
        sgstPercentage:  formData.sgstPercentage,
        barcode:         formData.barcode.trim(),
        status:          formData.status,
        timing:          buildTimingString(selectedTiming),
      };

      await updateMedicineMaster(updateData);

      // Success popup (auto-closes in 1 s), then navigate / callback
      showPopup('Medicine updated successfully!', 'success');
      setTimeout(() => {
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          navigate('/medicinemaster-list');
        }
      }, 1500);
    } catch (err) {
      console.error('handleSubmit error:', err);
      showPopup(err?.message || 'Failed to update medicine.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    if (isModal && onClose) {
      onClose();
    } else {
      navigate('/medicinemaster-list');
    }
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) return <ErrorHandler error={error} />;
  if (loading) return (
    isModal
      ? <div className={styles.modalOverlay}><div className={styles.modalContainer}><div className={styles.loading}>Loading...</div></div></div>
      : <div className={styles.loading}>Loading medicine details...</div>
  );
  if (!medicine) return (
    isModal
      ? <div className={styles.modalOverlay}><div className={styles.modalContainer}><div className={styles.error}>Medicine not found</div></div></div>
      : <div className={styles.error}>Medicine not found</div>
  );

  const hasErrors = Object.keys(fieldErrors).length > 0;

  const renderForm = () => (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>

      {/* ── Basic Information ── */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          <FiPackage size={18} />
          Basic Medicine Information
        </h3>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Medicine Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter medicine name"
              className={styles.formInput}
              disabled={submitLoading}
            />
            {fieldErrors.name && (
              <span className={styles.validationMsg}>{fieldErrors.name}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Generic Name</label>
            <input
              type="text"
              name="genericName"
              value={formData.genericName}
              onChange={handleInputChange}
              placeholder="Enter generic name"
              className={styles.formInput}
              disabled={submitLoading}
            />
            {fieldErrors.genericName && (
              <span className={styles.validationMsg}>{fieldErrors.genericName}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Manufacturer</label>
            <input
              type="text"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              placeholder="Enter manufacturer name"
              className={styles.formInput}
              disabled={submitLoading}
            />
            {fieldErrors.manufacturer && (
              <span className={styles.validationMsg}>{fieldErrors.manufacturer}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Composition</label>
            <input
              type="text"
              name="composition"
              value={formData.composition}
              onChange={handleInputChange}
              placeholder="Enter composition"
              className={styles.formInput}
              disabled={submitLoading}
            />
            {fieldErrors.composition && (
              <span className={styles.validationMsg}>{fieldErrors.composition}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Type <span className={styles.required}>*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={styles.formSelect}
              disabled={submitLoading}
            >
              <option value=''>Select Type</option>
              {MEDICINE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {fieldErrors.type && (
              <span className={styles.validationMsg}>{fieldErrors.type}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Unit <span className={styles.required}>*</span>
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              className={styles.formSelect}
              disabled={submitLoading}
            >
              <option value=''>Select Unit</option>
              {MEDICINE_UNITS.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
            {fieldErrors.unit && (
              <span className={styles.validationMsg}>{fieldErrors.unit}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Dosage Form</label>
            <input
              type="text"
              name="dosageForm"
              value={formData.dosageForm}
              onChange={handleInputChange}
              placeholder="e.g., 500mg, 10ml"
              className={styles.formInput}
              disabled={submitLoading}
            />
            {fieldErrors.dosageForm && (
              <span className={styles.validationMsg}>{fieldErrors.dosageForm}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Dose Count</label>
            <input
              type="number"
              name="doseCount"
              value={formData.doseCount}
              onChange={handleInputChange}
              placeholder="1"
              className={styles.formInput}
              min="0"
              disabled={submitLoading}
            />
          </div>
        </div>

        {/* Row 2: HSN Code | Barcode | Timing */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>HSN Code</label>
            <input
              type="text"
              name="hsnCode"
              value={formData.hsnCode}
              onChange={handleInputChange}
              placeholder="Enter HSN code"
              className={styles.formInput}
              disabled={submitLoading}
            />
            {fieldErrors.hsnCode && (
              <span className={styles.validationMsg}>{fieldErrors.hsnCode}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Barcode</label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              placeholder="Enter barcode"
              className={styles.formInput}
              disabled={submitLoading}
            />
            {fieldErrors.barcode && (
              <span className={styles.validationMsg}>{fieldErrors.barcode}</span>
            )}
          </div>

          <div className={`${styles.formGroup} ${styles.colSpan2}`}>
            <label className={styles.formLabel}>Timing</label>
            <div className={styles.timingGroup}>
              {TIMING_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleTimingToggle(opt.key)}
                  className={`${styles.timingBtn} ${
                    selectedTiming.includes(opt.key) ? styles.timingBtnActive : ''
                  }`}
                  disabled={submitLoading}
                >
                  <span className={styles.timingKey}>{opt.key}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Pricing Information ── */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>
          <FiDollarSign size={18} />
          Pricing & Stock Information
        </h3>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              MRP (₹) <span className={styles.required}>*</span>
            </label>
            <input type="number" name="mrp" value={formData.mrp} onChange={handleInputChange}
              placeholder="0.00" className={styles.formInput} min="0" step="0.01" disabled={submitLoading} />
            {fieldErrors.mrp && (
              <span className={styles.validationMsg}>{fieldErrors.mrp}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Purchase Price (₹) <span className={styles.required}>*</span>
            </label>
            <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange}
              placeholder="0.00" className={styles.formInput} min="0" step="0.01" disabled={submitLoading} />
            {fieldErrors.purchasePrice && (
              <span className={styles.validationMsg}>{fieldErrors.purchasePrice}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Sell Price (₹) <span className={styles.required}>*</span>
            </label>
            <input type="number" name="sellPrice" value={formData.sellPrice} onChange={handleInputChange}
              placeholder="0.00" className={styles.formInput} min="0" step="0.01" disabled={submitLoading} />
            {fieldErrors.sellPrice && (
              <span className={styles.validationMsg}>{fieldErrors.sellPrice}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Stock Quantity</label>
            <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleInputChange}
              placeholder="0" className={styles.formInput} min="0" disabled={submitLoading} />
            {fieldErrors.stockQuantity && (
              <span className={styles.validationMsg}>{fieldErrors.stockQuantity}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Reorder Level Quantity</label>
            <input type="number" name="reorderLevelQty" value={formData.reorderLevelQty} onChange={handleInputChange}
              placeholder="0" className={styles.formInput} min="0" disabled={submitLoading} />
            <p className={styles.formHint}>Alert when stock falls below this quantity</p>
            {fieldErrors.reorderLevelQty && (
              <span className={styles.validationMsg}>{fieldErrors.reorderLevelQty}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>CGST (%)</label>
            <input type="number" name="cgstPercentage" value={formData.cgstPercentage} onChange={handleInputChange}
              placeholder="0.00" className={styles.formInput} min="0" max="100" step="0.01" disabled={submitLoading} />
            {fieldErrors.cgstPercentage && (
              <span className={styles.validationMsg}>{fieldErrors.cgstPercentage}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>SGST (%)</label>
            <input type="number" name="sgstPercentage" value={formData.sgstPercentage} onChange={handleInputChange}
              placeholder="0.00" className={styles.formInput} min="0" max="100" step="0.01" disabled={submitLoading} />
            {fieldErrors.sgstPercentage && (
              <span className={styles.validationMsg}>{fieldErrors.sgstPercentage}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange}
              className={styles.formSelect} disabled={submitLoading}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Form Actions ── */}
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleCancel}
          className={styles.btnCancel}
          disabled={submitLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.btnSave}
          disabled={submitLoading}
          title={!allRequiredFilled ? 'Please fill all required fields to enable this button' : ''}
        >
          <FiSave size={18} />
          {submitLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

    </form>
  );

  // ── MODAL MODE ──
  if (isModal) {
    return (
      <>
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Update Medicine</h2>

              <div className={styles.headerRight}>
                <div className={styles.clinicNameone}>
                  <FaClinicMedical size={20} style={{ verticalAlign: 'middle', margin: '6px', marginTop: '0px' }} />
                  {localStorage.getItem('clinicName') || '—'}
                </div>

                {onClose && (
                  <button onClick={onClose} className={styles.modalCloseBtn} disabled={submitLoading}>
                    <FiX size={20} />
                  </button>
                )}
              </div>
            </div>

            <ErrorHandler error={error} />

            <div className={styles.modalBody}>
              {renderForm()}
            </div>
          </div>
        </div>

        {/* ── MessagePopup (rendered outside modal so z-index is clean) ── */}
        <MessagePopup
          visible={popup.visible}
          message={popup.message}
          type={popup.type}
          onClose={closePopup}
        />
      </>
    );
  }

  // ── PAGE MODE ──
  return (
    <>
      <div className={styles.wrapper}>
        <ErrorHandler error={error} />
        <Header title="Update Medicine Master" />

        <div className={styles.container}>
          <button onClick={handleCancel} className={styles.backBtn}>
            <FiArrowLeft size={20} />
            Back to Medicine List
          </button>

          {renderForm()}
        </div>
      </div>

      {/* ── MessagePopup ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />
    </>
  );
};

export default UpdateMedicineMaster;