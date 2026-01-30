// src/components/UpdateMedicineMaster.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiPackage, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import { getMedicineMasterList, updateMedicineMaster } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './UpdateMedicineMaster.module.css';

const MEDICINE_TYPES = [
  { value: 1, label: 'Tablet' },
  { value: 2, label: 'Capsule' },
  { value: 3, label: 'Syrup' },
  { value: 4, label: 'Injection' },
  { value: 5, label: 'Ointment' },
  { value: 6, label: 'Drops' },
  { value: 7, label: 'Powder' },
  { value: 8, label: 'Gel' },
  { value: 9, label: 'Cream' },
  { value: 10, label: 'Inhaler' }
];

const MEDICINE_UNITS = [
  { value: 1, label: 'Strip' },
  { value: 2, label: 'Bottle' },
  { value: 3, label: 'Vial' },
  { value: 4, label: 'Tube' },
  { value: 5, label: 'Box' },
  { value: 6, label: 'Ampoule' },
  { value: 7, label: 'Sachet' },
  { value: 8, label: 'Blister Pack' },
  { value: 9, label: 'Jar' },
  { value: 10, label: 'Roll' }
];

const UpdateMedicineMaster = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    composition: '',
    manufacturer: '',
    type: 0,
    dosageForm: '',
    unit: 0,
    hsnCode: '',
    reorderLevelQty: 0,
    mrp: 0,
    purchasePrice: 0,
    sellPrice: 0,
    stockQuantity: 0,
    cgstPercentage: 0,
    sgstPercentage: 0,
    barcode: '',
    status: 1
  });

  useEffect(() => {
    if (id) {
      fetchMedicineDetails();
    }
  }, [id]);

  const fetchMedicineDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const options = {
        Page: 1,
        PageSize: 1,
        BranchID: branchId,
        MedicineID: Number(id)
      };

      const data = await getMedicineMasterList(clinicId, options);
      
      if (data && data.length > 0) {
        const med = data[0];
        setMedicine(med);
        
        // Populate form
        setFormData({
          name: med.name || '',
          genericName: med.genericName || '',
          composition: med.composition || '',
          manufacturer: med.manufacturer || '',
          type: med.type || 0,
          dosageForm: med.dosageForm || '',
          unit: med.unit || 0,
          hsnCode: med.hsnCode || '',
          reorderLevelQty: med.reorderLevelQty || 0,
          mrp: parseFloat(med.mrp) || 0,
          purchasePrice: parseFloat(med.purchasePrice) || 0,
          sellPrice: parseFloat(med.sellPrice) || 0,
          stockQuantity: med.stockQuantity || 0,
          cgstPercentage: parseFloat(med.cgstPercentage) || 0,
          sgstPercentage: parseFloat(med.sgstPercentage) || 0,
          barcode: med.barcode || '',
          status: med.status === 'active' ? 1 : 0
        });
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
    
    // Handle number inputs
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
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
      setSubmitLoading(true);
      setError(null);

      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      const updateData = {
        medicineId: Number(id),
        clinicId,
        branchId,
        name: formData.name.trim(),
        genericName: formData.genericName.trim(),
        composition: formData.composition.trim(),
        manufacturer: formData.manufacturer.trim(),
        type: formData.type,
        dosageForm: formData.dosageForm.trim(),
        unit: formData.unit,
        hsnCode: formData.hsnCode.trim(),
        reorderLevelQty: formData.reorderLevelQty,
        mrp: formData.mrp,
        purchasePrice: formData.purchasePrice,
        sellPrice: formData.sellPrice,
        stockQuantity: formData.stockQuantity,
        cgstPercentage: formData.cgstPercentage,
        sgstPercentage: formData.sgstPercentage,
        barcode: formData.barcode.trim(),
        status: formData.status
      };

      await updateMedicineMaster(updateData);
      
      // Navigate back to medicine list
      navigate('/medicine-master-list');
    } catch (err) {
      console.error('handleSubmit error:', err);
      setError(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/medicinemaster-list');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  };

  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading) return <div className={styles.loading}>Loading medicine details...</div>;

  if (error) return <div className={styles.error}>Error: {error.message || error}</div>;

  if (!medicine) return <div className={styles.error}>Medicine not found</div>;

  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Update Medicine Master" />

      <div className={styles.container}>
        {/* Back Button */}
        <button onClick={handleCancel} className={styles.backBtn}>
          <FiArrowLeft size={20} />
          Back to Medicine List
        </button>


        {/* Update Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Basic Information */}
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>
              <FiPackage size={18} />
              Basic Information
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

          {/* Medicine Details */}
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>
              <FiPackage size={18} />
              Medicine Details
            </h3>
            
            <div className={styles.formRow}>
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
                  <option value={0}>Select Type</option>
                  {MEDICINE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
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
                  required
                >
                  <option value={0}>Select Unit</option>
                  {MEDICINE_UNITS.map(unit => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
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

          {/* Pricing Information */}
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

          {/* Stock & Tax Information */}
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>
              <FiBarChart2 size={18} />
              Stock & Tax Information
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
                <p className={styles.formHint}>
                  Alert when stock falls below this quantity
                </p>
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
                <label className={styles.formLabel}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={styles.formSelect}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
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
            >
              <FiSave size={18} />
              {submitLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateMedicineMaster;