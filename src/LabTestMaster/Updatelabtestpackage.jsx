// src/components/UpdateLabTestPackage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { getLabTestPackageList, updateLabTestPackage } from '../api/api-labtest.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './LabMaster.module.css';

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case 'packName':
      if (!value || !value.trim()) return 'Test name is required';
      if (value.trim().length < 3) return 'Test name must be at least 3 characters';
      if (value.trim().length > 100) return 'Test name must not exceed 100 characters';
      return '';
    case 'packShortName':
      if (!value || !value.trim()) return 'Test name is required';
      if (value.trim().length < 3) return 'Test name must be at least 3 characters';
      if (value.trim().length > 100) return 'Test name must not exceed 100 characters';
      return '';

    case 'description':
      if (value && value.length > 500) return 'Description must not exceed 500 characters';
      return '';

    case 'fees':
      if (value === '' || value === null) return '';
      const feeVal = Number(value);
      if (isNaN(feeVal)) return 'Fees must be a valid number';
      if (feeVal < 0) return 'Fees cannot be negative';
      return '';

    case 'cgstPercentage':
    case 'sgstPercentage':
      if (value === '' || value === null) return '';
      const taxVal = Number(value);
      if (isNaN(taxVal)) return 'Must be a valid number';
      if (taxVal < 0) return 'Cannot be negative';
      if (taxVal > 100) return 'Cannot exceed 100%';
      return '';

    default:
      return '';
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'packName':
    case 'packShortName':
      return value.replace(/[^a-zA-Z\s]/g, '');

    case 'description':
      return value.replace(/[^a-zA-Z0-9\s\-&(),.;:!?]/g, '');

    case 'fees':
    case 'cgstPercentage':
    case 'sgstPercentage':
      return value.replace(/[^0-9.]/g, '').replace(/(\..*?)\./g, '$1');

    default:
      return value;
  }
};

// ────────────────────────────────────────────────
const UpdateLabTestPackage = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const packageId = params.packageId || params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packageData, setPackageData] = useState(null);

  const [formData, setFormData] = useState({
    packName: '',
    packShortName: '',
    description: '',
    fees: '',
    cgstPercentage: '9',
    sgstPercentage: '9',
    status: 1,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const packageList = await getLabTestPackageList(clinicId, { BranchID: branchId });
        const pkg = packageList.find((p) => p.id === Number(packageId));

        if (!pkg) {
          throw new Error(`Lab test package not found with ID: ${packageId}`);
        }

        setPackageData(pkg);

        setFormData({
          packName: pkg.packName || '',
          packShortName: pkg.packShortName || '',
          description: pkg.description || '',
          fees: pkg.fees || '',
          cgstPercentage: pkg.cgstPercentage || '9',
          sgstPercentage: pkg.sgstPercentage || '9',
          status: pkg.status || 1,
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load lab test package data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (packageId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No package ID provided', status: 400 });
    }
  }, [packageId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const filteredValue = filterInput(name, value);

    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const message = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({
      ...prev,
      [name]: message,
    }));
  };

  const handleBack = () => {
    navigate('/lab-test-master-list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));

      await updateLabTestPackage({
        packageId: Number(packageId),
        clinicId: clinicId,
        packName: formData.packName.trim(),
        packShortName: formData.packShortName.trim(),
        description: formData.description.trim(),
        fees: Number(formData.fees) || 0,
        cgstPercentage: Number(formData.cgstPercentage) || 9,
        sgstPercentage: Number(formData.sgstPercentage) || 9,
        status: Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/lab-test-master-list');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update lab test package.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className={styles.loading}>Loading lab test package data...</div>;
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <Header title="Update Lab Test Package" />
        <div className={styles.error}>Error: {error.message || error}</div>
        <button onClick={handleBack} className={`${styles.addBtn} ${styles.backBtn}`}>
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className={styles.wrapper}>
        <Header title="Update Lab Test Package" />
        <div className={styles.error}>Lab test package not found</div>
        <button onClick={handleBack} className={`${styles.addBtn} ${styles.backBtn}`}>
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Update Lab Test Package" />

      <div className={styles.toolbar}>
        <button onClick={handleBack} className={styles.addBtn}>
          <FiArrowLeft /> Back to List
        </button>
      </div>

      <div className={`${styles.tableContainer} ${styles.updateContainer}`} style={{ padding: '20px', borderRadius: '17px' }}>
        <div className={`${styles.modal} ${styles.formModal} ${styles.updateForm}`} style={{ maxWidth: 'none', width: '100%', maxHeight: 'none' }}>
          <div className={`${styles.modalHeader} ${styles.updateHeader}`}>
            <h2>Update Package: {formData.packName}</h2>
          </div>

          <form onSubmit={handleSubmit} className={styles.modalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Lab test package updated successfully!</div>}

            <div className={styles.formGrid}>
              <h3 className={styles.formSectionTitle}>Package Information</h3>

              <div className={styles.formGroup}>
                <label>
                  Package Name <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="packName"
                  value={formData.packName}
                  onChange={handleInputChange}
                  placeholder="e.g., Full Body Checkup"
                />
                {validationMessages.packName && (
                  <span className={styles.validationMessage}>
                    {validationMessages.packName}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  Short Name <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="packShortName"
                  value={formData.packShortName}
                  onChange={handleInputChange}
                  placeholder="e.g., FBC"
                />
                {validationMessages.packShortName && (
                  <span className={styles.validationMessage}>
                    {validationMessages.packShortName}
                  </span>
                )}
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Description</label>
                <textarea
                  name="description"
                  rows={2}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the package"
                />
                {validationMessages.description && (
                  <span className={styles.validationMessage}>
                    {validationMessages.description}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Fees (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="fees"
                  value={formData.fees}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
                {validationMessages.fees && (
                  <span className={styles.validationMessage}>
                    {validationMessages.fees}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>CGST %</label>
                <input
                  type="number"
                  step="0.01"
                  name="cgstPercentage"
                  value={formData.cgstPercentage}
                  onChange={handleInputChange}
                />
                {validationMessages.cgstPercentage && (
                  <span className={styles.validationMessage}>
                    {validationMessages.cgstPercentage}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>SGST %</label>
                <input
                  type="number"
                  step="0.01"
                  name="sgstPercentage"
                  value={formData.sgstPercentage}
                  onChange={handleInputChange}
                />
                {validationMessages.sgstPercentage && (
                  <span className={styles.validationMessage}>
                    {validationMessages.sgstPercentage}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  Status <span className={styles.required}>*</span>
                </label>
                <select required name="status" value={formData.status} onChange={handleInputChange}>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={`${styles.modalFooter} ${styles.updateFooter}`}>
              <button type="button" onClick={handleBack} className={styles.btnCancel}>
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
                <FiSave className={styles.btnIcon} />
                {formLoading ? 'Updating...' : 'Update Package'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateLabTestPackage;