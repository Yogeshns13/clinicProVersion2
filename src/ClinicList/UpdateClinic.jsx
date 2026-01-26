// src/components/UpdateClinic.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiX, FiArrowLeft, FiSave } from 'react-icons/fi';
import { getClinicList, updateClinic } from '../api/api.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './ClinicList.module.css';

// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ────────────────────────────────────────────────
const UpdateClinic = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const clinicId = params.clinicId || params.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clinicData, setClinicData] = useState(null);

  const [formData, setFormData] = useState({
    clinicName: '',
    address: '',
    location: '',
    clinicType: '',
    gstNo: '',
    cgstPercentage: 0,
    sgstPercentage: 0,
    ownerName: '',
    mobile: '',
    altMobile: '',
    email: '',
    fileNoPrefix: '',
    invoicePrefix: '',
    status: 1,
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

        const clinicList = await getClinicList();
        const clinic = clinicList.find((c) => c.id === Number(clinicId));

        if (!clinic) {
          throw new Error(`Clinic not found with ID: ${clinicId}`);
        }

        setClinicData(clinic);

        setFormData({
          clinicName: clinic.name || '',
          address: clinic.address || '',
          location: clinic.location || '',
          clinicType: clinic.clinicType || '',
          gstNo: clinic.gstNo || '',
          cgstPercentage: clinic.cgstPercentage || 0,
          sgstPercentage: clinic.sgstPercentage || 0,
          ownerName: clinic.ownerName || '',
          mobile: clinic.mobile || '',
          altMobile: clinic.altMobile || '',
          email: clinic.email || '',
          fileNoPrefix: clinic.fileNoPrefix || '',
          invoicePrefix: clinic.invoicePrefix || '',
          status: clinic.status === 'active' ? 1 : 2,
        });
      } catch (err) {
        setError({
          message: err.message || 'Failed to load clinic data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No clinic ID provided', status: 400 });
    }
  }, [clinicId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate('/clinic-list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await updateClinic({
        clinicId: Number(clinicId),
        ClinicName: formData.clinicName.trim(),
        Address: formData.address.trim(),
        Location: formData.location.trim(),
        ClinicType: formData.clinicType.trim(),
        GstNo: formData.gstNo.trim(),
        CgstPercentage: Number(formData.cgstPercentage),
        SgstPercentage: Number(formData.sgstPercentage),
        OwnerName: formData.ownerName.trim(),
        Mobile: formData.mobile.trim(),
        AltMobile: formData.altMobile.trim(),
        Email: formData.email.trim(),
        FileNoPrefix: formData.fileNoPrefix.trim(),
        InvoicePrefix: formData.invoicePrefix.trim(),
        Status: Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/clinic-list');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update clinic.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className={styles.clinicLoading}>Loading clinic data...</div>;
  }

  if (error) {
    return (
      <div className={styles.clinicListWrapper}>
        <Header title="Update Clinic" />
        <div className={styles.clinicError}>Error: {error.message || error}</div>
        <button onClick={handleBack} className={`${styles.clinicAddBtn} ${styles.clinicBackBtn}`}>
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  if (!clinicData) {
    return (
      <div className={styles.clinicListWrapper}>
        <Header title="Update Clinic" />
        <div className={styles.clinicError}>Clinic not found</div>
        <button onClick={handleBack} className={`${styles.clinicAddBtn} ${styles.clinicBackBtn}`}>
          <FiArrowLeft /> Back to List
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className={styles.clinicListWrapper}>
      <ErrorHandler error={error} />
      <Header title="Update Clinic" />

      <div className={styles.clinicToolbar}>
        <button onClick={handleBack} className={styles.clinicAddBtn}>
           Back to List
        </button>
      </div>

      <div className={`${styles.clinicTableContainer} ${styles.updateEmployeeContainer}`} style={{ padding: '20px', borderRadius: '17px' }}>
        <div className={`${styles.clinicModal} ${styles.formModal} ${styles.updateEmployeeForm}`} style={{ maxWidth: 'none', width: '100%', maxHeight: 'none' }}>
          <div className={`${styles.clinicModalHeader} ${styles.updateEmployeeHeader}`}>
            <h2>Update Clinic: {formData.clinicName}</h2>
          </div>

          <form onSubmit={handleSubmit} className={styles.clinicModalBody}>
            {formError && <div className={styles.formError}>{formError}</div>}
            {formSuccess && <div className={styles.formSuccess}>Clinic updated successfully!</div>}

            <div className={styles.formGrid}>
              <h3 className={styles.formSectionTitle}>Basic Information</h3>

              <div className={styles.formGroup}>
                <label>
                  Clinic Name <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Clinic Type</label>
                <input
                  name="clinicType"
                  value={formData.clinicType}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Owner Name <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Location</label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <h3 className={styles.formSectionTitle}>Contact Information</h3>

              <div className={styles.formGroup}>
                <label>
                  Mobile <span className={styles.required}>*</span>
                </label>
                <input
                  required
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Alternate Mobile</label>
                <input
                  name="altMobile"
                  value={formData.altMobile}
                  onChange={handleInputChange}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <h3 className={styles.formSectionTitle}>Tax Information</h3>

              <div className={styles.formGroup}>
                <label>GST Number</label>
                <input
                  name="gstNo"
                  value={formData.gstNo}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>CGST Percentage</label>
                <input
                  type="number"
                  name="cgstPercentage"
                  value={formData.cgstPercentage}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className={styles.formGroup}>
                <label>SGST Percentage</label>
                <input
                  type="number"
                  name="sgstPercentage"
                  value={formData.sgstPercentage}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <h3 className={styles.formSectionTitle}>Billing Configuration</h3>

              <div className={styles.formGroup}>
                <label>File No Prefix</label>
                <input
                  name="fileNoPrefix"
                  value={formData.fileNoPrefix}
                  onChange={handleInputChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Invoice Prefix</label>
                <input
                  name="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={handleInputChange}
                />
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

            <div className={`${styles.clinicModalFooter} ${styles.updateEmployeeFooter}`}>
              <button type="button" onClick={handleBack} className={styles.btnCancel}>
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