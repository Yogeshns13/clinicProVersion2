// src/components/UpdateVendor.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { getVendorList, updateVendor } from '../api/api-pharmacy.js';
import ErrorHandler from '../hooks/Errorhandler.jsx';
import Header from '../Header/Header.jsx';
import styles from './UpdateVendor.module.css';

// ────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { id: 1, label: 'Active' },
  { id: 2, label: 'Inactive' },
];

// ────────────────────────────────────────────────
const UpdateVendor = () => {
  const navigate = useNavigate();
  const params = useParams();
  
  const vendorId = params.vendorId || params.id || params.vendorID;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendorData, setVendorData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    mobile: '',
    altMobile: '',
    email: '',
    address: '',
    gstNo: '',
    licenseDetail: '',
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

        const clinicId = Number(localStorage.getItem('clinicID'));
        const branchId = Number(localStorage.getItem('branchID'));

        const vendorList = await getVendorList(clinicId, {
          BranchID: branchId,
          VendorID: Number(vendorId),
        });

        if (!vendorList || vendorList.length === 0) {
          throw new Error(`Vendor not found with ID: ${vendorId}`);
        }

        const vendor = vendorList[0];
        setVendorData(vendor);

        setFormData({
          name: vendor.name || '',
          contactPerson: vendor.contactPerson || '',
          mobile: vendor.mobile || '',
          altMobile: vendor.altMobile || '',
          email: vendor.email || '',
          address: vendor.address || '',
          gstNo: vendor.gstNo || '',
          licenseDetail: vendor.licenseDetail || '',
          status: vendor.status === 'active' || vendor.statusDesc === 'Active' ? 1 : 2,
        });

      } catch (err) {
        setError({
          message: err.message || 'Failed to load vendor data',
          status: err.status || 500,
        });
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchData();
    } else {
      setLoading(false);
      setError({ message: 'No vendor ID provided', status: 400 });
    }
  }, [vendorId]);

  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBack = () => {
    navigate('/vendor-list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess(false);

    try {
      await updateVendor({
        vendorId: Number(vendorId),
        clinicId: vendorData.clinicId,
        branchId: vendorData.branchId,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        mobile: formData.mobile.trim(),
        altMobile: formData.altMobile.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gstNo: formData.gstNo.trim(),
        licenseDetail: formData.licenseDetail.trim(),
        status: Number(formData.status),
      });

      setFormSuccess(true);
      setTimeout(() => {
        navigate('/vendor-list');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to update vendor.');
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  if (error && error?.status >= 400) {
    return <ErrorHandler error={error} />;
  }

  if (loading) {
    return <div className={styles.loading}>Loading vendor data...</div>;
  }

  if (error || !vendorData) {
    return (
      <div className={styles.wrapper}>
        <Header title="Update Vendor" />
        <div className={styles.error}>
          {error?.message || 'Vendor not found'}
        </div>
        <div className={styles.toolbar}>
          <button onClick={handleBack} className={styles.addBtn}>
            <FiArrowLeft size={20} /> Back to List
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Update Vendor" />

      {/* Page Header with Back Button */}
      <div className={styles.toolbar} style={{ justifyContent: 'flex-start', padding: '0 20px' }}>
        <button onClick={handleBack} className={styles.addBtn}>
          Back to List
        </button>
      </div>

      {/* Full-Screen Form Container */}
      <div className={styles.tableContainer} style={{ margin: '20px', borderRadius: '17px', padding: '30px' }}>
        <h2 className={styles.header} style={{ 
          fontSize: '1.5rem',
          fontWeight: '800',
          marginBottom: '30px',
        }}>
          Update Vendor: {formData.name}
        </h2>

        <form onSubmit={handleSubmit}>
          {formError && <div className={styles.formError}>{formError}</div>}
          {formSuccess && <div className={styles.formSuccess}>Vendor updated successfully!</div>}

          <div className={styles.formGrid}>
            <h3 className={styles.sectionTitle}>Basic Information</h3>

            <div className={styles.formGroup}>
              <label>Vendor Name <span className={styles.required}>*</span></label>
              <input required name="name" value={formData.name} onChange={handleInputChange} />
            </div>

            <div className={styles.formGroup}>
              <label>Contact Person <span className={styles.required}>*</span></label>
              <input required name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
            </div>

            <h3 className={styles.sectionTitle}>Contact Information</h3>

            <div className={styles.formGroup}>
              <label>Mobile <span className={styles.required}>*</span></label>
              <input required name="mobile" value={formData.mobile} onChange={handleInputChange} />
            </div>

            <div className={styles.formGroup}>
              <label>Alternate Mobile</label>
              <input name="altMobile" value={formData.altMobile} onChange={handleInputChange} />
            </div>

            <div className={styles.formGroup}>
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
            </div>

            <div className={styles.formGroupFullWidth}>
              <label>Address</label>
              <textarea name="address" rows={3} value={formData.address} onChange={handleInputChange} />
            </div>

            <h3 className={styles.sectionTitle}>Business Information</h3>

            <div className={styles.formGroup}>
              <label>GST Number</label>
              <input name="gstNo" value={formData.gstNo} onChange={handleInputChange} />
            </div>

            <div className={styles.formGroupFullWidth}>
              <label>License Details</label>
              <textarea name="licenseDetail" rows={3} value={formData.licenseDetail} onChange={handleInputChange} />
            </div>

            <div className={styles.formGroup}>
              <label>Status <span className={styles.required}>*</span></label>
              <select required name="status" value={formData.status} onChange={handleInputChange}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.id} value={status.id}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons - Full Width */}
          <div className={styles.modalFooter} style={{ marginTop: '40px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleBack} className={styles.btnCancel}>
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className={styles.btnSubmit}>
              {formLoading ? 'Updating...' : 'Update Vendor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateVendor;