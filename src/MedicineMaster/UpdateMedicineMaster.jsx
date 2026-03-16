// src/components/UpdateMedicineMaster.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiPackage, FiDollarSign, FiBarChart2, FiX } from 'react-icons/fi';
import { getMedicineMasterList, updateMedicineMaster } from '../Api/ApiPharmacy.js';
import ErrorHandler from '../Hooks/ErrorHandler.jsx';
import Header from '../Header/Header.jsx';
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
  { value: 10, label: 'Inhaler' }
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
  { value: 10, label: 'Roll' }
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
const nameRegex = /^[A-Za-z0-9\s.,\-()[\]/+]+$/;
const decimalRegex = /^\d+(\.\d{1,2})?$/;

const validateAll = (data) => {
  const errors = {};

  // Name — required, 1–200 chars, nameRegex
  if (!data.name.trim()) {
    errors.name = 'Medicine name is required';
  } else if (data.name.trim().length > 200) {
    errors.name = 'Name must be 1–200 characters';
  } else if (!nameRegex.test(data.name.trim())) {
    errors.name = 'Name contains invalid characters';
  }

  // Type — required, must be ≥ 1
  if (!data.type || data.type === 0) {
    errors.type = 'Medicine type is required';
  }

  // GenericName — optional, max 500
  if (data.genericName && data.genericName.length > 500) {
    errors.genericName = 'Generic name must be at most 500 characters';
  }

  // Composition — optional, max 500
  if (data.composition && data.composition.length > 500) {
    errors.composition = 'Composition must be at most 500 characters';
  }

  // Manufacturer — optional, max 200
  if (data.manufacturer && data.manufacturer.length > 200) {
    errors.manufacturer = 'Manufacturer must be at most 200 characters';
  }

  // DosageForm — optional, max 100
  if (data.dosageForm && data.dosageForm.length > 100) {
    errors.dosageForm = 'Dosage form must be at most 100 characters';
  }

  // HSNCode — optional, max 20
  if (data.hsnCode && data.hsnCode.length > 20) {
    errors.hsnCode = 'HSN Code must be at most 20 characters';
  }

  // Barcode — optional, max 100
  if (data.barcode && data.barcode.length > 100) {
    errors.barcode = 'Barcode must be at most 100 characters';
  }

  // ReorderLevelQty — optional, isInt min: 0
  if (data.reorderLevelQty !== 0) {
    if (!Number.isInteger(Number(data.reorderLevelQty)) || Number(data.reorderLevelQty) < 0) {
      errors.reorderLevelQty = 'Reorder level must be a non-negative integer';
    }
  }

  // StockQuantity — optional, isInt min: 0
  if (data.stockQuantity !== 0) {
    if (!Number.isInteger(Number(data.stockQuantity)) || Number(data.stockQuantity) < 0) {
      errors.stockQuantity = 'Stock quantity must be a non-negative integer';
    }
  }

  // MRP — optional, isDecimal decimal_digits: 2
  if (data.mrp !== '' && data.mrp !== 0) {
    if (!decimalRegex.test(String(data.mrp))) {
      errors.mrp = 'MRP must be a valid decimal with up to 2 decimal places';
    }
  }

  // PurchasePrice — optional, isDecimal decimal_digits: 2
  if (data.purchasePrice !== '' && data.purchasePrice !== 0) {
    if (!decimalRegex.test(String(data.purchasePrice))) {
      errors.purchasePrice = 'Purchase price must be a valid decimal with up to 2 decimal places';
    }
  }

  // SellPrice — optional, isDecimal decimal_digits: 2
  if (data.sellPrice !== '' && data.sellPrice !== 0) {
    if (!decimalRegex.test(String(data.sellPrice))) {
      errors.sellPrice = 'Sell price must be a valid decimal with up to 2 decimal places';
    }
  }

  // CGSTPercentage — optional, isDecimal decimal_digits: 2, max: 100
  if (data.cgstPercentage !== '' && data.cgstPercentage !== 0) {
    if (!decimalRegex.test(String(data.cgstPercentage))) {
      errors.cgstPercentage = 'CGST must be a valid decimal with up to 2 decimal places';
    } else if (Number(data.cgstPercentage) > 100) {
      errors.cgstPercentage = 'CGST percentage cannot exceed 100';
    }
  }

  // SGSTPercentage — optional, isDecimal decimal_digits: 2, max: 100
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
    status:          1
  });

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
          status:          med.status === 'active' ? 1 : 0
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

    // Block submit if any validation error exists
    if (Object.keys(errors).length > 0) return;

    try {
      setSubmitLoading(true);
      setError(null);

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

      if (isModal && onSuccess) {
        onSuccess();
      } else {
        navigate('/medicinemaster-list');
      }
    } catch (err) {
      console.error('handleSubmit error:', err);
      setError(err);
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
    <form onSubmit={handleSubmit} className={styles.form}>

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
              required
            />
            {fieldErrors.name && (
              <span className="validationMsg">{fieldErrors.name}</span>
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
            />
            {fieldErrors.genericName && (
              <span className="validationMsg">{fieldErrors.genericName}</span>
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
            />
            {fieldErrors.manufacturer && (
              <span className="validationMsg">{fieldErrors.manufacturer}</span>
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
            />
            {fieldErrors.composition && (
              <span className="validationMsg">{fieldErrors.composition}</span>
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
              required
            >
              <option value=''>Select Type</option>
              {MEDICINE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {fieldErrors.type && (
              <span className="validationMsg">{fieldErrors.type}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Unit <span className={styles.required}>*</span>
            </label>
            <select
              required
              name="unit"
              value={formData.unit}
              onChange={handleInputChange}
              className={styles.formSelect}
            >
              <option value=''>Select Unit</option>
              {MEDICINE_UNITS.map(u => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
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
            />
            {fieldErrors.dosageForm && (
              <span className="validationMsg">{fieldErrors.dosageForm}</span>
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
            />
          </div>
        </div>

        {/* Row 2: HSN Code | Barcode | Timing (spans 2 cols) */}
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
            />
            {fieldErrors.hsnCode && (
              <span className="validationMsg">{fieldErrors.hsnCode}</span>
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
            />
            {fieldErrors.barcode && (
              <span className="validationMsg">{fieldErrors.barcode}</span>
            )}
          </div>

          {/* Timing spans the remaining 2 columns */}
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
            <label className={styles.formLabel}>MRP (₹)</label>
            <input type="number" name="mrp" value={formData.mrp} onChange={handleInputChange}
              placeholder="0.00" className={styles.formInput} min="0" step="0.01" />
            {fieldErrors.mrp && (
              <span className="validationMsg">{fieldErrors.mrp}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Purchase Price (₹)</label>
            <input type="number" name="purchasePrice" value={formData.purchasePrice} onChange={handleInputChange}
              placeholder="0.00" className={styles.formInput} min="0" step="0.01" />
            {fieldErrors.purchasePrice && (
              <span className="validationMsg">{fieldErrors.purchasePrice}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sell Price (₹)</label>
            <input type="number" name="sellPrice" value={formData.sellPrice} onChange={handleInputChange}
              placeholder="0.00" className={styles.formInput} min="0" step="0.01" />
            {fieldErrors.sellPrice && (
              <span className="validationMsg">{fieldErrors.sellPrice}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Stock Quantity</label>
            <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleInputChange}
              placeholder="0" className={styles.formInput} min="0" />
            {fieldErrors.stockQuantity && (
              <span className="validationMsg">{fieldErrors.stockQuantity}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Reorder Level Quantity</label>
            <input type="number" name="reorderLevelQty" value={formData.reorderLevelQty} onChange={handleInputChange}
              placeholder="0" className={styles.formInput} min="0" />
            <p className={styles.formHint}>Alert when stock falls below this quantity</p>
            {fieldErrors.reorderLevelQty && (
              <span className="validationMsg">{fieldErrors.reorderLevelQty}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>CGST (%)</label>
            <input type="number" name="cgstPercentage" value={formData.cgstPercentage} onChange={handleInputChange}
              placeholder="0.00" className={styles.formInput} min="0" max="100" step="0.01" />
            {fieldErrors.cgstPercentage && (
              <span className="validationMsg">{fieldErrors.cgstPercentage}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>SGST (%)</label>
            <input type="number" name="sgstPercentage" value={formData.sgstPercentage} onChange={handleInputChange}
              placeholder="0.00" className={styles.formInput} min="0" max="100" step="0.01" />
            {fieldErrors.sgstPercentage && (
              <span className="validationMsg">{fieldErrors.sgstPercentage}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className={styles.formSelect}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Form Actions ── */}
      <div className={styles.actions}>
        <button type="button" onClick={handleCancel} className={styles.btnCancel} disabled={submitLoading}>
          Cancel
        </button>
        <button
          type="submit"
          className={styles.btnSave}
          disabled={submitLoading || (hasSubmitted && hasErrors)}
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
    );
  }

  // ── PAGE MODE ──
  return (
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
  );
};

export default UpdateMedicineMaster;