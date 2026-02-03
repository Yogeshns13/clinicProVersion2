// src/components/UpdateLabTestMaster.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { getLabTestMasterList, updateLabTestMaster } from '../api/api-labtest.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './LabMaster.module.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const TEST_TYPES = [
  { id: 1, label: 'Blood' },
  { id: 2, label: 'Urine' },
  { id: 3, label: 'Saliva' },
  { id: 4, label: 'Stool' },
  { id: 5, label: 'CSF' },
  { id: 6, label: 'Tissue' },
  { id: 7, label: 'Other' },
];

const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
  { id: 3, label: 'Deprecated' },
];

// ────────────────────────────────────────────────
const UpdateLabTestMaster = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const testId = params.testId || params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testData, setTestData] = useState(null);

  const [formData, setFormData] = useState({
    TestName: '',
    ShortName: '',
    Description: '',
    TestType: 1,
    NormalRange: '',
    Units: '',
    Remarks: '',
    Fees: '',
    CGSTPercentage: '9',
    SGSTPercentage: '9',
    Status: 1,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  // ────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const testList = await getLabTestMasterList(clinicId, { BranchID: branchId });
        const test = testList.find((t) => t.id === Number(testId));

        if (!test) {
          throw new Error(`Lab test not found with ID: ${testId}`);
        }

        setTestData(test);

        setFormData({
          TestName: test.testName || '',
          ShortName: test.shortName || '',
          Description: test.description || '',
          TestType: test.testType || 1,
          NormalRange: test.normalRange || '',
          Units: test.units || '',
          Remarks: test.remarks || '',
          Fees: test.fees || '',
          CGSTPercentage: test.cgstPercentage || '9',
          SGSTPercentage: test.sgstPercentage || '9',
          Status: test.status || 1,
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load lab test data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No test ID provided', status: 400 });
    }
  }, [testId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate('/labtestmaster');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      const clinicId = Number(localStorage.getItem('clinicID'));
      const branchId = Number(localStorage.getItem('branchID'));

      await updateLabTestMaster({
        TestID: Number(testId),
        ClinicID: clinicId,
        BranchID: branchId,
        TestName: formData.TestName.trim(),
        ShortName: formData.ShortName.trim(),
        Description: formData.Description.trim(),
        TestType: Number(formData.TestType),
        NormalRange: formData.NormalRange.trim(),
        Units: formData.Units.trim(),
        Remarks: formData.Remarks.trim(),
        Fees: Number(formData.Fees) || 0,
        CGSTPercentage: Number(formData.CGSTPercentage) || 9,
        SGSTPercentage: Number(formData.SGSTPercentage) || 9,
        Status: Number(formData.Status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/labtestmaster');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update lab test.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className={styles.loading}>Loading lab test data...</div>;
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <Header title="Update Lab Test" />
        <div className={styles.error}>Error: {error.message || error}</div>
        <button onClick={handleBack} className={`${styles.addBtn} ${styles.backBtn}`}>
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className={styles.wrapper}>
        <Header title="Update Lab Test" />
        <div className={styles.error}>Lab test not found</div>
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
      <Header title="Update Lab Test" />

      <div className={styles.toolbar}>
        <button onClick={handleBack} className={styles.addBtn}>
          <FiArrowLeft /> Back to List
        </button>
      </div>

      <div className={`${styles.tableContainer} ${styles.updateContainer}`} style={{ padding: '20px', borderRadius: '17px' }}>
        <div className={`${styles.modal} ${styles.formModal} ${styles.updateForm}`} style={{ maxWidth: 'none', width: '100%', maxHeight: 'none' }}>
          <div className={`${styles.modalHeader} ${styles.updateHeader}`}>
            <h2>Update Lab Test: {formData.TestName}</h2>
          </div>

          <form onSubmit={handleSubmit} className={styles.modalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Lab test updated successfully!</div>}

            <div className={styles.formGrid}>
              <h3 className={styles.formSectionTitle}>Test Information</h3>

              <div className={styles.formGroup}>
                <label>
                  Test Name <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="TestName"
                  value={formData.TestName}
                  onChange={handleInputChange}
                  placeholder="e.g., Complete Blood Count"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Short Name <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="ShortName"
                  value={formData.ShortName}
                  onChange={handleInputChange}
                  placeholder="e.g., CBC"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Test Type <span className={styles.required}>*</span>
                </label>
                <select
                  required
                  name="TestType"
                  value={formData.TestType}
                  onChange={handleInputChange}
                >
                  {TEST_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Fees (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  name="Fees"
                  value={formData.Fees}
                  onChange={handleInputChange}
                  placeholder="0.00"
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Description</label>
                <textarea
                  name="Description"
                  rows={2}
                  value={formData.Description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the test"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Normal Range</label>
                <input
                  name="NormalRange"
                  value={formData.NormalRange}
                  onChange={handleInputChange}
                  placeholder="e.g., 4.5-11.0"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Units</label>
                <input
                  name="Units"
                  value={formData.Units}
                  onChange={handleInputChange}
                  placeholder="e.g., cells/mcL"
                />
              </div>

              <div className={styles.formGroup}>
                <label>CGST %</label>
                <input
                  type="number"
                  step="0.01"
                  name="CGSTPercentage"
                  value={formData.CGSTPercentage}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>SGST %</label>
                <input
                  type="number"
                  step="0.01"
                  name="SGSTPercentage"
                  value={formData.SGSTPercentage}
                  onChange={handleInputChange}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Remarks</label>
                <textarea
                  name="Remarks"
                  rows={2}
                  value={formData.Remarks}
                  onChange={handleInputChange}
                  placeholder="Additional notes"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Status <span className={styles.required}>*</span>
                </label>
                <select required name="Status" value={formData.Status} onChange={handleInputChange}>
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
                {formLoading ? 'Updating...' : 'Update Lab Test'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateLabTestMaster;