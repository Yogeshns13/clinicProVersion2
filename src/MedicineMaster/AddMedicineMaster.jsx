// src/components/AddMedicineMaster.jsx
import React, { useState } from "react";
import { FiX, FiPackage, FiDollarSign } from "react-icons/fi";
import { addMedicineMaster } from "../Api/ApiPharmacy.js";
import MessagePopup from "../Hooks/MessagePopup.jsx";
import styles from "./AddMedicineMaster.module.css";
import { FaClinicMedical } from "react-icons/fa";
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const MEDICINE_TYPES = [
  { value: 1,  label: "Tablet" },
  { value: 2,  label: "Capsule" },
  { value: 3,  label: "Syrup" },
  { value: 4,  label: "Injection" },
  { value: 5,  label: "Ointment" },
  { value: 6,  label: "Drops" },
  { value: 7,  label: "Powder" },
  { value: 8,  label: "Gel" },
  { value: 9,  label: "Cream" },
  { value: 10, label: "Inhaler" },
];

const MEDICINE_UNITS = [
  { value: 1,  label: "Strip" },
  { value: 2,  label: "Bottle" },
  { value: 3,  label: "Vial" },
  { value: 4,  label: "Tube" },
  { value: 5,  label: "Box" },
  { value: 6,  label: "Ampoule" },
  { value: 7,  label: "Sachet" },
  { value: 8,  label: "Blister Pack" },
  { value: 9,  label: "Jar" },
  { value: 10, label: "Roll" },
];

const TIMING_OPTIONS = [
  { key: "M", label: "Morning" },
  { key: "A", label: "Afternoon" },
  { key: "E", label: "Evening" },
  { key: "N", label: "Night" },
];

const buildTimingString = (selected) =>
  TIMING_OPTIONS.filter((o) => selected.includes(o.key))
    .map((o) => o.key)
    .join("|");

// ── Validation ──────────────────────────────────────────
const nameRegex = /^[A-Za-z0-9\s.,\-()[\]/+]+$/;
const decimalRegex = /^\d+(\.\d{1,2})?$/;

const validateAll = (data) => {
  const errors = {};

  if (!data.name.trim()) {
    errors.name = "Medicine name is required";
  } else if (data.name.trim().length > 200) {
    errors.name = "Name must be 1–200 characters";
  } else if (!nameRegex.test(data.name.trim())) {
    errors.name = "Name contains invalid characters";
  }

  if (!data.type || data.type === 0) {
    errors.type = "Medicine type is required";
  }

  if (!data.unit || data.unit === 0 || data.unit === "") {
    errors.unit = "Unit is required";
  }

  if (data.genericName && data.genericName.length > 500) {
    errors.genericName = "Generic name must be at most 500 characters";
  }

  if (data.composition && data.composition.length > 500) {
    errors.composition = "Composition must be at most 500 characters";
  }

  if (data.manufacturer && data.manufacturer.length > 200) {
    errors.manufacturer = "Manufacturer must be at most 200 characters";
  }

  if (data.dosageForm && data.dosageForm.length > 100) {
    errors.dosageForm = "Dosage form must be at most 100 characters";
  }

  if (data.hsnCode && data.hsnCode.length > 20) {
    errors.hsnCode = "HSN Code must be at most 20 characters";
  }

  if (data.barcode && data.barcode.length > 100) {
    errors.barcode = "Barcode must be at most 100 characters";
  }

  if (data.reorderLevelQty !== 0) {
    if (
      !Number.isInteger(Number(data.reorderLevelQty)) ||
      Number(data.reorderLevelQty) < 0
    ) {
      errors.reorderLevelQty = "Reorder level must be a non-negative integer";
    }
  }

  if (data.stockQuantity !== 0) {
    if (
      !Number.isInteger(Number(data.stockQuantity)) ||
      Number(data.stockQuantity) < 0
    ) {
      errors.stockQuantity = "Stock quantity must be a non-negative integer";
    }
  }

  if (data.mrp === "" || data.mrp === 0 || data.mrp === null || data.mrp === undefined) {
    errors.mrp = "MRP is required";
  } else if (!decimalRegex.test(String(data.mrp))) {
    errors.mrp = "MRP must be a valid decimal with up to 2 decimal places";
  }

  if (data.purchasePrice === "" || data.purchasePrice === 0 || data.purchasePrice === null || data.purchasePrice === undefined) {
    errors.purchasePrice = "Purchase price is required";
  } else if (!decimalRegex.test(String(data.purchasePrice))) {
    errors.purchasePrice = "Purchase price must be a valid decimal with up to 2 decimal places";
  }

  if (data.sellPrice === "" || data.sellPrice === 0 || data.sellPrice === null || data.sellPrice === undefined) {
    errors.sellPrice = "Sell price is required";
  } else if (!decimalRegex.test(String(data.sellPrice))) {
    errors.sellPrice = "Sell price must be a valid decimal with up to 2 decimal places";
  }

  if (data.cgstPercentage !== "" && data.cgstPercentage !== 0) {
    if (!decimalRegex.test(String(data.cgstPercentage))) {
      errors.cgstPercentage =
        "CGST must be a valid decimal with up to 2 decimal places";
    } else if (Number(data.cgstPercentage) > 100) {
      errors.cgstPercentage = "CGST percentage cannot exceed 100";
    }
  }

  if (data.sgstPercentage !== "" && data.sgstPercentage !== 0) {
    if (!decimalRegex.test(String(data.sgstPercentage))) {
      errors.sgstPercentage =
        "SGST must be a valid decimal with up to 2 decimal places";
    } else if (Number(data.sgstPercentage) > 100) {
      errors.sgstPercentage = "SGST percentage cannot exceed 100";
    }
  }

  return errors;
};

// ──────────────────────────────────────────────────
const AddMedicineMaster = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const [selectedTiming, setSelectedTiming] = useState([]);

  // Validation state
  const [fieldErrors, setFieldErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name:            "",
    genericName:     "",
    composition:     "",
    manufacturer:    "",
    type:            0,
    dosageForm:      "",
    doseCount:       1,
    unit:            0,
    hsnCode:         "",
    reorderLevelQty: 0,
    mrp:             "",
    purchasePrice:   "",
    sellPrice:       "",
    stockQuantity:   0,
    cgstPercentage:  0,
    sgstPercentage:  0,
    barcode:         "",
  });

  // ── MessagePopup state ──────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });



  // ── Handlers ──
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    const newFormData =
      type === "number"
        ? { ...formData, [name]: value === "" ? "" : Number(value) }
        : { ...formData, [name]: value };

    setFormData(newFormData);

    // Re-validate live only after first submit attempt
    if (hasSubmitted) {
      setFieldErrors(validateAll(newFormData));
    }
  };

  const handleTimingToggle = (key) => {
    setSelectedTiming((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
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
      setLoading(true);

      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const medicineData = {
        clinicId,
        branchId,
        ...formData,
        name:         formData.name.trim(),
        genericName:  formData.genericName.trim(),
        composition:  formData.composition.trim(),
        manufacturer: formData.manufacturer.trim(),
        dosageForm:   formData.dosageForm.trim(),
        hsnCode:      formData.hsnCode.trim(),
        barcode:      formData.barcode.trim(),
        timing:       buildTimingString(selectedTiming),
        doseCount:    formData.doseCount,
      };

      const result = await addMedicineMaster(medicineData);

      if (result.success) {
        showPopup('Medicine added successfully!', 'success');
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error("handleSubmit error:", err);
      showPopup(err?.message || 'Failed to add medicine.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name:            "",
      genericName:     "",
      composition:     "",
      manufacturer:    "",
      type:            0,
      dosageForm:      "",
      doseCount:       1,
      unit:            0,
      hsnCode:         "",
      reorderLevelQty: 0,
      mrp:             "",
      purchasePrice:   "",
      sellPrice:       "",
      stockQuantity:   0,
      cgstPercentage:  0,
      sgstPercentage:  0,
      barcode:         "",
    });
    setSelectedTiming([]);
    setFieldErrors({});
    setHasSubmitted(false);
    setPopup({ visible: false, message: '', type: 'success' });
    onClose();
  };

  if (!isOpen) return null;

  const hasErrors = Object.keys(fieldErrors).length > 0;
  
  const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';
  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.modal}>
          {/* ── Gradient Header ── */}
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h2>Add New Medicine</h2>
            </div>
            <div className={styles.addModalHeaderCard}>
                        <div className={styles.clinicInfoIcon}>
                          <FaClinicMedical size={18} />
                        </div>
                        <div className={styles.clinicInfoText}>
                          <span className={styles.clinicInfoName}>{clinicName}</span>
                          <span className={styles.clinicInfoBranch}>{branchName}</span>
                        </div>
                        </div>

            <button onClick={handleClose} className={styles.closeBtn}>
              <FiX size={22} />
            </button>
          </div>

          {/* ── Scrollable Form Body ── */}
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.body}>
              {/* ── Basic Information ── */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}>
                  <h3>
                    <FiPackage size={16} /> Basic Medicine Information
                  </h3>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>
                      Medicine Name <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter medicine name"
                      disabled={loading}
                    />
                    {fieldErrors.name && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.name}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Generic Name</label>
                    <input
                      type="text"
                      name="genericName"
                      value={formData.genericName}
                      onChange={handleInputChange}
                      placeholder="Enter generic name"
                      disabled={loading}
                    />
                    {fieldErrors.genericName && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.genericName}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Manufacturer</label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleInputChange}
                      placeholder="Enter manufacturer name"
                      disabled={loading}
                    />
                    {fieldErrors.manufacturer && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.manufacturer}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Type <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <option value={0}>Select Type</option>
                      {MEDICINE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.type && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.type}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Composition</label>
                    <input
                      name="composition"
                      value={formData.composition}
                      onChange={handleInputChange}
                      placeholder="Enter composition details"
                      rows={3}
                      disabled={loading}
                    />
                    {fieldErrors.composition && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.composition}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Unit <span className={styles.required}>*</span>
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      disabled={loading}
                    >
                      <option value={0}>Select Unit</option>
                      {MEDICINE_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.unit && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.unit}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Dosage Form</label>
                    <input
                      type="text"
                      name="dosageForm"
                      value={formData.dosageForm}
                      onChange={handleInputChange}
                      placeholder="e.g., 500mg, 10ml"
                      disabled={loading}
                    />
                    {fieldErrors.dosageForm && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.dosageForm}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Dose Count</label>
                    <input
                      type="number"
                      name="doseCount"
                      value={formData.doseCount}
                      onChange={handleInputChange}
                      placeholder="1"
                      min="0"
                      disabled={loading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>HSN Code</label>
                    <input
                      type="text"
                      name="hsnCode"
                      value={formData.hsnCode}
                      onChange={handleInputChange}
                      placeholder="Enter HSN code"
                      disabled={loading}
                    />
                    {fieldErrors.hsnCode && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.hsnCode}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Barcode</label>
                    <input
                      type="text"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      placeholder="Enter barcode"
                      disabled={loading}
                    />
                    {fieldErrors.barcode && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.barcode}
                      </span>
                    )}
                  </div>

                  <div className={`${styles.formGroup} ${styles.colSpan2}`}>
                    <label>Timing</label>
                    <div className={styles.timingGroup}>
                      {TIMING_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleTimingToggle(opt.key)}
                          className={`${styles.timingBtn} ${
                            selectedTiming.includes(opt.key)
                              ? styles.timingBtnActive
                              : ""
                          }`}
                          disabled={loading}
                        >
                          <span className={styles.timingKey}>{opt.key}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Pricing ── */}
              <div className={styles.formSection}>
                <div className={styles.formSectionHeader}>
                  <h3>
                    <FiDollarSign size={16} /> Pricing & Stock Information
                  </h3>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>MRP (₹) <span className={styles.required}>*</span></label>
                    <input
                      type="number"
                      name="mrp"
                      value={formData.mrp}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={loading}
                    />
                    {fieldErrors.mrp && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.mrp}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Purchase Price (₹) <span className={styles.required}>*</span></label>
                    <input
                      type="number"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={loading}
                    />
                    {fieldErrors.purchasePrice && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.purchasePrice}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Sell Price (₹) <span className={styles.required}>*</span></label>
                    <input
                      required
                      type="number"
                      name="sellPrice"
                      value={formData.sellPrice}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={loading}
                    />
                    {fieldErrors.sellPrice && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.sellPrice}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Stock Quantity</label>
                    <input
                      type="number"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      disabled={loading}
                    />
                    {fieldErrors.stockQuantity && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.stockQuantity}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Reorder Level Quantity</label>
                    <input
                      type="number"
                      name="reorderLevelQty"
                      value={formData.reorderLevelQty}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      disabled={loading}
                    />
                    <span className={styles.formHint}>
                      Alert when stock falls below this quantity
                    </span>
                    {fieldErrors.reorderLevelQty && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.reorderLevelQty}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>CGST (%)</label>
                    <input
                      type="number"
                      name="cgstPercentage"
                      value={formData.cgstPercentage}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      max="100"
                      step="0.01"
                      disabled={loading}
                    />
                    {fieldErrors.cgstPercentage && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.cgstPercentage}
                      </span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>SGST (%)</label>
                    <input
                      type="number"
                      name="sgstPercentage"
                      value={formData.sgstPercentage}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      max="100"
                      step="0.01"
                      disabled={loading}
                    />
                    {fieldErrors.sgstPercentage && (
                      <span className={styles.validationMsg}>
                        {fieldErrors.sgstPercentage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* end .body */}

            {/* ── Fixed Footer ── */}
            <div className={styles.footer}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.btnCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.btnSubmit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Medicine"}
              </button>
            </div>
          </form>
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
};

export default AddMedicineMaster;