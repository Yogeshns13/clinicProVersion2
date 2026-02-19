// src/components/AddMedicineMaster.jsx
import React, { useState } from 'react';
import { FiX, FiPackage, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import { addMedicineMaster } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import styles from './AddMedicineMaster.module.css';

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

// Timing options: key = pipe segment, label = display
const TIMING_OPTIONS = [
  { key: 'M', label: 'Morning' },
  { key: 'A', label: 'Afternoon' },
  { key: 'E', label: 'Evening' },
  { key: 'N', label: 'Night' },
];

// Build pipe-separated string from selected keys: ['M','E'] → "M|E"
const buildTimingString = (selected) =>
  TIMING_OPTIONS.filter(o => selected.includes(o.key)).map(o => o.key).join('|');

// ──────────────────────────────────────────────────
const AddMedicineMaster = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Timing is stored as an array of selected keys e.g. ['M', 'E']
  const [selectedTiming, setSelectedTiming] = useState([]);

  // Form data — doseCount defaults to 1
  const [formData, setFormData] = useState({
    name:            '',
    genericName:     '',
    composition:     '',
    manufacturer:    '',
    type:            0,
    dosageForm:      '',
    doseCount:       1,   // ← default 1
    unit:            0,
    hsnCode:         '',
    reorderLevelQty: 0,
    mrp:             '',
    purchasePrice:   '',
    sellPrice:       '',
    stockQuantity:   0,
    cgstPercentage:  0,
    sgstPercentage:  0,
    barcode:         ''
  });

  // ── Handlers ──
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTimingToggle = (key) => {
    setSelectedTiming(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError({ message: 'Medicine name is required' });
      return;
    }
    if (formData.type === 0) {
      setError({ message: 'Please select a medicine type' });
      return;
    }
    if (formData.unit === 0) {
      setError({ message: 'Please select a unit' });
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

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
        timing:       buildTimingString(selectedTiming),   // e.g. "M|E|N"
        doseCount:    formData.doseCount,
      };

      const result = await addMedicineMaster(medicineData);

      if (result.success) {
        handleClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('handleSubmit error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
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
      barcode:         ''
    });
    setSelectedTiming([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2>Add New Medicine</h2>
            <p className={styles.subtitle}>Enter medicine details to add to inventory</p>
          </div>
          <button onClick={handleClose} className={styles.closeBtn}>
            <FiX size={24} />
          </button>
        </div>

        <ErrorHandler error={error} />

        {/* Body */}
        <div className={styles.body}>
          <form onSubmit={handleSubmit} className={styles.form}>

            {/* ── Basic Information ── */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <FiPackage size={18} />
                Basic Information
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Medicine Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter medicine name"
                    className={styles.formInput}
                    required
                  />
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
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Composition</label>
                <textarea
                  name="composition"
                  value={formData.composition}
                  onChange={handleInputChange}
                  placeholder="Enter composition details"
                  className={styles.formTextarea}
                  rows={3}
                />
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
              </div>
            </div>

            {/* ── Medicine Details ── */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <FiPackage size={18} />
                Medicine Details
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={styles.formSelect}
                    required
                  >
                    <option value={0}>Select Type</option>
                    {MEDICINE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Unit *</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className={styles.formSelect}
                    required
                  >
                    <option value={0}>Select Unit</option>
                    {MEDICINE_UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
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
                </div>

                {/* Dose Count — shown right after Dosage Form */}
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
                </div>
              </div>

              {/* Timing — selectable pill buttons */}
              <div className={styles.formGroup}>
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

            {/* ── Pricing ── */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <FiDollarSign size={18} />
                Pricing Information
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>MRP (₹)</label>
                  <input
                    type="number"
                    name="mrp"
                    value={formData.mrp}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={styles.formInput}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Purchase Price (₹)</label>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={styles.formInput}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Sell Price (₹)</label>
                  <input
                    type="number"
                    name="sellPrice"
                    value={formData.sellPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={styles.formInput}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Stock Quantity</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={styles.formInput}
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* ── Stock & Tax ── */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <FiBarChart2 size={18} />
                Stock &amp; Tax Information
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Reorder Level Quantity</label>
                  <input
                    type="number"
                    name="reorderLevelQty"
                    value={formData.reorderLevelQty}
                    onChange={handleInputChange}
                    placeholder="0"
                    className={styles.formInput}
                    min="0"
                  />
                  <p className={styles.formHint}>Alert when stock falls below this quantity</p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>CGST (%)</label>
                  <input
                    type="number"
                    name="cgstPercentage"
                    value={formData.cgstPercentage}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={styles.formInput}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>SGST (%)</label>
                  <input
                    type="number"
                    name="sgstPercentage"
                    value={formData.sgstPercentage}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={styles.formInput}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                <div className={styles.formGroup}>
                  {/* Empty for alignment */}
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className={styles.actions}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.btnSecondary}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Medicine'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMedicineMaster;