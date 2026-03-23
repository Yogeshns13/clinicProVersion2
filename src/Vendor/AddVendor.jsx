// src/components/AddVendor.jsx
import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { addVendor } from "../Api/ApiPharmacy.js";
import MessagePopup from "../Hooks/MessagePopup.jsx";
import styles from "./AddVendor.module.css";
import { FaClinicMedical } from "react-icons/fa";
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

const REQUIRED_FIELDS = ['name', 'mobile', 'altMobile', 'email', 'gstNo'];

const allowedCharactersRegex = /^[a-zA-Z\s]+$/;

const getLiveValidationMessage = (fieldName, value) => {
  switch (fieldName) {
    case "name":
      if (!value || !value.trim()) return "Vendor name is required";
      if (value.trim().length < 2)
        return "Vendor name must be at least 2 characters";
      if (value.trim().length > 100)
        return "Vendor name must not exceed 100 characters";
      return "";

    case "contactPerson":
      if (!value || !value.trim()) return 'Contact Person is required';
      if (value.trim().length > 100) return 'Contact Person should not exceed 100 characters';
      if (!allowedCharactersRegex.test(value.trim()))
        return 'Contact Person should not contain special characters';
      return '';

    case "mobile":
      if (!value || !value.trim()) return "Mobile number is required";
      if (value.trim().length < 10) return "Mobile number must be 10 digits";
      if (value.trim().length === 10) {
        if (!/^[6-9]\d{9}$/.test(value.trim())) {
          return "Mobile number must start with 6-9";
        }
      }
      if (value.trim().length > 10)
        return "Mobile number cannot exceed 10 digits";
      return "";

    case "altMobile":
      if (!value || !value.trim()) return "Alternate Mobile is required";
      if (value.trim().length < 10) return "Alternate Mobile must be 10 digits";
      if (value.trim().length === 10) {
        if (!/^[6-9]\d{9}$/.test(value.trim())) {
          return "Alternate Mobile must start with 6-9";
        }
      }
      if (value.trim().length > 10)
        return "Alternate Mobile cannot exceed 10 digits";
      return "";

    case "email":
      if (!value || !value.trim()) return "Email is required";
      if (value && value.trim()) {
        if (!value.includes("@")) return "Email must contain @";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return "Please enter a valid email address";
        }
        if (value.trim().length > 100)
          return "Email must not exceed 100 characters";
      }
      return "";

    case "address":
      if (value && value.length > 500)
        return "Address must not exceed 500 characters";
      return "";

    case "gstNo":
      if (!value || !value.trim()) return "GST No is required";
      if (value && value.trim()) {
        if (value.trim().length > 15)
          return "GST number must not exceed 15 characters";
        if (
          !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
            value.trim(),
          )
        ) {
          return "Please enter a valid GST number (e.g. 22AAAAA0000A1Z5)";
        }
      }
      return "";

    case "licenseDetail":
      if (value && value.trim()) {
        if (value.trim().length > 200)
          return "License detail must not exceed 200 characters";
      }
      return "";

    default:
      return "";
  }
};

const filterInput = (fieldName, value) => {
  switch (fieldName) {
    case 'contactPerson':
      return value.replace(/[^a-zA-Z\s]/g, '');
    case "mobile":
    case "altMobile":
      return value.replace(/[^0-9]/g, "");

    case "gstNo":
      return value.toUpperCase().replace(/[^0-9A-Z]/g, "");

    default:
      return value;
  }
};

// ────────────────────────────────────────────────
const AddVendor = ({ isOpen, onClose, onAddSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    mobile: "",
    altMobile: "",
    email: "",
    address: "",
    gstNo: "",
    licenseDetail: "",
  });

  const [formLoading, setFormLoading] = useState(false);
  const [validationMessages, setValidationMessages] = useState({});

  // ── MessagePopup state ──────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: '', type: 'success' });
  const showPopup  = (message, type = 'success') => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      mobile: "",
      altMobile: "",
      email: "",
      address: "",
      gstNo: "",
      licenseDetail: "",
    });
    setValidationMessages({});
    setPopup({ visible: false, message: '', type: 'success' });
  };



  // ────────────────────────────────────────────────
  // Form Handlers
  // ────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const filteredValue = filterInput(name, value);

    setFormData((prev) => ({ ...prev, [name]: filteredValue }));

    const validationMessage = getLiveValidationMessage(name, filteredValue);
    setValidationMessages((prev) => ({
      ...prev,
      [name]: validationMessage,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run full validation on all fields before submitting
    const fields = [
      "name",
      "contactPerson",
      "mobile",
      "altMobile",
      "email",
      "address",
      "gstNo",
      "licenseDetail",
    ];
    const newMessages = {};
    let hasError = false;

    fields.forEach((field) => {
      const msg = getLiveValidationMessage(field, formData[field]);
      newMessages[field] = msg;
      if (msg) hasError = true;
    });

    setValidationMessages(newMessages);

    // Show warning popup if any validation fails
    if (hasError) {
      showPopup(
        'Please fill all required fields correctly before submitting.',
        'warning'
      );
      return;
    }

    setFormLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      const payload = {
        clinicId: clinicId ? Number(clinicId) : 0,
        branchId: branchId ? Number(branchId) : 0,
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim(),
        mobile: formData.mobile.trim(),
        altMobile: formData.altMobile.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        gstNo: formData.gstNo.trim(),
        licenseDetail: formData.licenseDetail.trim(),
      };

      await addVendor(payload);

      // Success popup (auto-closes in 1 s), then close modal
      showPopup('Vendor added successfully!', 'success');
      setTimeout(() => {
        onAddSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Add vendor failed:", err);
      showPopup(err.message || "Failed to add vendor.", 'error');
    } finally {
      setFormLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.modalOverlay} >
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

          {/* ── Static Header (does not scroll) ── */}
          <div className={styles.modalHeader}>
            <h2>Add New Vendor</h2>

            <div className={styles.headerRight}>
              <div className={styles.clinicNameone}>
                <FaClinicMedical
                  size={20}
                  style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }}
                />
                {localStorage.getItem("clinicName") || "—"}
              </div>
              <button onClick={onClose} className={styles.modalClose}>
                <FiX />
              </button>
            </div>
          </div>

          {/* ── Scrollable Body ── */}
          <div className={styles.modalBodyScrollable}>
            <form onSubmit={handleSubmit} noValidate>

              <div className={styles.formGrid}>
                {/* ── Basic Information ── */}
                <h3 className={styles.formSectionTitle}>Basic Information</h3>

                <div className={styles.formGroup}>
                  <label>
                    Vendor Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter vendor name"
                    disabled={formLoading}
                  />
                  {validationMessages.name && (
                    <span className={styles.validationMsg}>
                      {validationMessages.name}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Contact Person</label>
                  <input
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Enter contact person name"
                    disabled={formLoading}
                  />
                  {validationMessages.contactPerson && (
                    <span className={styles.validationMsg}>
                      {validationMessages.contactPerson}
                    </span>
                  )}
                </div>

                {/* ── Contact Information ── */}
                <h3 className={styles.formSectionTitle}>Contact Information</h3>

                <div className={styles.formGroup}>
                  <label>
                    Mobile <span className={styles.required}>*</span>
                  </label>
                  <input
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter mobile number"
                    maxLength="10"
                    disabled={formLoading}
                  />
                  {validationMessages.mobile && (
                    <span className={styles.validationMsg}>
                      {validationMessages.mobile}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Alternate Mobile <span className={styles.required}>*</span>
                  </label>
                  <input
                    name="altMobile"
                    value={formData.altMobile}
                    onChange={handleInputChange}
                    placeholder="Enter alternate mobile"
                    maxLength="10"
                    disabled={formLoading}
                  />
                  {validationMessages.altMobile && (
                    <span className={styles.validationMsg}>
                      {validationMessages.altMobile}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>
                    Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    disabled={formLoading}
                  />
                  {validationMessages.email && (
                    <span className={styles.validationMsg}>
                      {validationMessages.email}
                    </span>
                  )}
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Address</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter complete address"
                    disabled={formLoading}
                  />
                  {validationMessages.address && (
                    <span className={styles.validationMsg}>
                      {validationMessages.address}
                    </span>
                  )}
                </div>

                {/* ── Business Information ── */}
                <h3 className={styles.formSectionTitle}>Business Information</h3>

                <div className={styles.formGroup}>
                  <label>
                    GST Number <span className={styles.required}>*</span>
                  </label>
                  <input
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleInputChange}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    maxLength="15"
                    disabled={formLoading}
                  />
                  {validationMessages.gstNo && (
                    <span className={styles.validationMsg}>
                      {validationMessages.gstNo}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>License Detail</label>
                  <input
                    name="licenseDetail"
                    value={formData.licenseDetail}
                    onChange={handleInputChange}
                    placeholder="Enter license details"
                    disabled={formLoading}
                  />
                  {validationMessages.licenseDetail && (
                    <span className={styles.validationMsg}>
                      {validationMessages.licenseDetail}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Footer ── */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={onClose}
                  className={styles.btnCancel}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={styles.btnSubmit}
                >
                  {formLoading ? "Saving..." : "Save Vendor"}
                </button>
              </div>

            </form>
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
};

export default AddVendor;