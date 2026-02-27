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

const TIMING_OPTIONS = [
  { key: 'M', label: 'Morning' },
  { key: 'A', label: 'Afternoon' },
  { key: 'E', label: 'Evening' },
  { key: 'N', label: 'Night' },
];

const buildTimingString = (selected) =>
  TIMING_OPTIONS.filter(o => selected.includes(o.key)).map(o => o.key).join('|');

// ──────────────────────────────────────────────────
const AddMedicineMaster = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const [selectedTiming, setSelectedTiming] = useState([]);

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
        timing:       buildTimingString(selectedTiming),
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

        {/* ── Gradient Header ── */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2>Add New Medicine</h2>
            <span className={styles.subtitle}>Enter medicine details to add to inventory</span>
          </div>
          <button onClick={handleClose} className={styles.closeBtn}>
            <FiX size={22} />
          </button>
        </div>

        <ErrorHandler error={error} />

        {/* ── Scrollable Form Body ── */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.body}>

            {/* ── Basic Information ── */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <h3><FiPackage size={16} /> Basic Medicine Information</h3>
              </div>
              <div className={styles.formGrid}>

                <div className={styles.formGroup}>
                  <label>Medicine Name <span className={styles.required}>*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter medicine name"
                    required
                    disabled={loading}
                  />
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
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Composition</label>
                  <textarea
                    name="composition"
                    value={formData.composition}
                    onChange={handleInputChange}
                    placeholder="Enter composition details"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Manufacturer</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    placeholder="Enter manufacturer name"
                    disabled={loading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Type <span className={styles.required}>*</span></label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value={0}>Select Type</option>
                    {MEDICINE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Unit <span className={styles.required}>*</span></label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value={0}>Select Unit</option>
                    {MEDICINE_UNITS.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
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
                </div>

                {/* Timing pills */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Timing</label>
                  <div className={styles.timingGroup}>
                    {TIMING_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleTimingToggle(opt.key)}
                        className={`${styles.timingBtn} ${
                          selectedTiming.includes(opt.key) ? styles.timingBtnActive : ''
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
                <h3><FiDollarSign size={16} /> Pricing Information</h3>
              </div>
              <div className={styles.formGrid}>

                <div className={styles.formGroup}>
                  <label>MRP (₹)</label>
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
                </div>

                <div className={styles.formGroup}>
                  <label>Purchase Price (₹)</label>
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
                </div>

                <div className={styles.formGroup}>
                  <label>Sell Price (₹)</label>
                  <input
                    type="number"
                    name="sellPrice"
                    value={formData.sellPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>

              </div>
            </div>

            {/* ── Stock & Tax ── */}
            <div className={styles.formSection}>
              <div className={styles.formSectionHeader}>
                <h3><FiBarChart2 size={16} /> Stock & Tax Information</h3>
              </div>
              <div className={styles.formGrid}>

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
                  <span className={styles.formHint}>Alert when stock falls below this quantity</span>
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
                </div>

              </div>
            </div>

          </div>{/* end .body */}

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
              {loading ? 'Saving...' : 'Save Medicine'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default AddMedicineMaster;