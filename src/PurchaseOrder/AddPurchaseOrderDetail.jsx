// src/components/AddPurchaseOrderDetail.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiSearch,
  FiChevronDown,
  FiCheckCircle,
  FiShoppingCart,
  FiPackage,
} from "react-icons/fi";
import {
  addPurchaseOrderDetail,
  getPurchaseOrderList,
  getMedicineMasterList,
} from "../Api/ApiPharmacy.js";
import styles from "./AddPurchaseOrderDetail.module.css";
import { FaClinicMedical } from "react-icons/fa";
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';

/* ─────────────────────────────────────────────── */
/* Reusable SearchableDropdown                      */
/* ─────────────────────────────────────────────── */
const SearchableDropdown = ({
  label,
  required,
  placeholder,
  items,
  selectedId,
  onSelect,
  getItemLabel,
  getItemSubLabel,
  disabled = false,
  loading = false,
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedItem = items.find((i) => String(i.id) === String(selectedId));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = items.filter((item) => {
    const lbl = getItemLabel(item).toLowerCase();
    const sub = getItemSubLabel ? getItemSubLabel(item).toLowerCase() : "";
    const q = query.toLowerCase();
    return lbl.includes(q) || sub.includes(q);
  });

  const handleSelect = (item) => {
    onSelect(item);
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect(null);
    setQuery("");
    setOpen(false);
  };

  const handleOpen = () => {
    if (!disabled && !loading) setOpen(true);
  };

  return (
    <div className={styles.formGroup} ref={wrapperRef}>
      {label && (
        <label className={styles.formLabel}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.searchableWrapper}>
        <div
          className={`${styles.searchableInput} ${open ? styles.searchableInputOpen : ""} ${disabled || loading ? styles.searchableInputDisabled : ""}`}
          onClick={handleOpen}
        >
          <FiSearch className={styles.searchIcon} size={15} />

          {open ? (
            <input
              autoFocus
              className={styles.searchableInnerInput}
              placeholder={
                selectedItem ? getItemLabel(selectedItem) : placeholder
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={
                selectedItem
                  ? styles.searchableSelected
                  : styles.searchablePlaceholder
              }
            >
              {loading
                ? "Loading..."
                : selectedItem
                  ? getItemLabel(selectedItem)
                  : placeholder}
            </span>
          )}

          <div className={styles.searchableActions}>
            {selectedItem && !open && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={handleClear}
              >
                <FiX size={13} />
              </button>
            )}
            <FiChevronDown
              size={15}
              className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
            />
          </div>
        </div>

        {open && (
          <div className={styles.searchableDropdown}>
            {filtered.length === 0 ? (
              <div className={styles.searchableNoResults}>No results found</div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.searchableOption} ${String(item.id) === String(selectedId) ? styles.searchableOptionSelected : ""}`}
                  onMouseDown={() => handleSelect(item)}
                >
                  <div className={styles.optionAvatar}>
                    {getItemLabel(item).charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionLabel}>
                      {getItemLabel(item)}
                    </span>
                    {getItemSubLabel && (
                      <span className={styles.optionSub}>
                        {getItemSubLabel(item)}
                      </span>
                    )}
                  </div>
                  {String(item.id) === String(selectedId) && (
                    <FiCheckCircle className={styles.optionCheck} size={15} />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────── */
/* Main Component                                   */
/* ─────────────────────────────────────────────── */
const AddPurchaseOrderDetail = ({
  isOpen,
  onClose,
  onAddSuccess,
  preselectedPOID = null,
}) => {
  const [formData, setFormData] = useState({
    POID: "",
    MedicineID: "",
    Quantity: "",
    UnitPrice: "",
  });

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  /* fetch on open */
  useEffect(() => {
    if (isOpen) {
      fetchPurchaseOrders();
      fetchMedicines();
    }
  }, [isOpen]);

  /* set preselected PO */
  useEffect(() => {
    if (preselectedPOID) {
      setFormData((prev) => ({ ...prev, POID: preselectedPOID }));
    }
  }, [preselectedPOID]);

  /* reset on close */
  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoadingPOs(true);
      const clinicId = Number(localStorage.getItem("clinicID"));
      const branchId = Number(localStorage.getItem("branchID"));
      const data = await getPurchaseOrderList(clinicId, {
        BranchID: branchId,
        POID: 0,
        Status: -1,
      });
      setPurchaseOrders(data);
    } catch (err) {
      console.error("Fetch purchase orders error:", err);
      setFormError("Failed to load purchase orders. Please try again.");
    } finally {
      setLoadingPOs(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoadingMedicines(true);
      const clinicId = Number(localStorage.getItem("clinicID"));
      const branchId = Number(localStorage.getItem("branchID"));
      const data = await getMedicineMasterList(clinicId, {
        BranchID: branchId,
        Status: 1,
        Page: 1,
        PageSize: 200,
      });
      setMedicines(data);
    } catch (err) {
      console.error("Fetch medicines error:", err);
      setFormError("Failed to load medicines. Please try again.");
    } finally {
      setLoadingMedicines(false);
    }
  };

  const resetForm = () => {
    setFormData({
      POID: preselectedPOID || "",
      MedicineID: "",
      Quantity: "",
      UnitPrice: "",
    });
    setFormError("");
    setFormSuccess(false);
  };

  /* ── Handlers ── */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePOChange = (e) => {
    setFormData((prev) => ({ ...prev, POID: e.target.value }));
  };

  const handleMedicineSelect = (medicine) => {
    setFormData((prev) => ({
      ...prev,
      MedicineID: medicine ? String(medicine.id) : "",
      // Auto-fill unit price from medicine's purchase price if available
      UnitPrice:
        medicine?.purchasePrice && medicine.purchasePrice !== "0.00"
          ? medicine.purchasePrice
          : prev.UnitPrice,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFormSuccess(false);

    try {
      const clinicId = localStorage.getItem("clinicID");
      const branchId = localStorage.getItem("branchID");

      const payload = {
        clinicId: clinicId ? Number(clinicId) : 0,
        branchId: branchId ? Number(branchId) : 0,
        POID: formData.POID ? Number(formData.POID) : 0,
        MedicineID: formData.MedicineID ? Number(formData.MedicineID) : 0,
        Quantity: formData.Quantity ? Number(formData.Quantity) : 0,
        UnitPrice: formData.UnitPrice ? parseFloat(formData.UnitPrice) : 0,
      };

      const response = await addPurchaseOrderDetail(payload);

      if (response.success) {
        setFormSuccess(true);
        setTimeout(() => {
          onAddSuccess?.();
          onClose();
        }, 1500);
      } else {
        setFormError(response.message || "Failed to add purchase order item.");
      }
    } catch (err) {
      console.error("Add purchase order detail failed:", err);
      setFormError(err.message || "Failed to add purchase order item.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* derived values */
  const selectedMedicine = medicines.find(
    (m) => String(m.id) === String(formData.MedicineID),
  );
  const totalAmount =
    formData.Quantity && formData.UnitPrice
      ? (
          parseFloat(formData.Quantity) * parseFloat(formData.UnitPrice)
        ).toFixed(2)
      : null;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <FiShoppingCart className={styles.headerIcon} size={22} />
            <h2>Add Item to Purchase Order</h2>
          </div>
          <div className={styles.clinicNameone}>
            <FaClinicMedical
              size={20}
              style={{ verticalAlign: "middle", margin: "6px" }}
            />
            {localStorage.getItem("clinicName") || "—"}
          </div>

          <button
            className={styles.closeBtn}
            onClick={handleClose}
            disabled={formLoading}
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.body}>
            {/* Alerts */}
            {formError && <div className={styles.alertError}>{formError}</div>}
            {formSuccess && (
              <div className={styles.alertSuccess}>
                Item added successfully!
              </div>
            )}

            {/* ── Medicine Section ── */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <FiPackage size={17} />
                Medicine Details
              </h3>

              {/* Medicine Searchable Dropdown */}
              <SearchableDropdown
                label="Select Medicine"
                required
                placeholder="Search by name or generic name..."
                items={medicines}
                selectedId={formData.MedicineID}
                onSelect={handleMedicineSelect}
                getItemLabel={(m) => m.name}
                getItemSubLabel={(m) =>
                  [m.genericName, m.typeDesc, m.manufacturer]
                    .filter(Boolean)
                    .join(" · ")
                }
                loading={loadingMedicines}
                disabled={loadingMedicines}
              />

              {/* Selected Medicine Info Card */}
              {selectedMedicine && (
                <div className={styles.infoCard}>
                  <div className={styles.infoCardGrid}>
                    {selectedMedicine.genericName && (
                      <div className={styles.infoCardItem}>
                        <span className={styles.infoCardKey}>GENERIC NAME</span>
                        <span className={styles.infoCardValue}>
                          {selectedMedicine.genericName}
                        </span>
                      </div>
                    )}
                    {selectedMedicine.typeDesc && (
                      <div className={styles.infoCardItem}>
                        <span className={styles.infoCardKey}>TYPE</span>
                        <span className={styles.infoCardValue}>
                          {selectedMedicine.typeDesc}
                        </span>
                      </div>
                    )}
                    {selectedMedicine.manufacturer && (
                      <div className={styles.infoCardItem}>
                        <span className={styles.infoCardKey}>MANUFACTURER</span>
                        <span className={styles.infoCardValue}>
                          {selectedMedicine.manufacturer}
                        </span>
                      </div>
                    )}
                    {selectedMedicine.unitDesc && (
                      <div className={styles.infoCardItem}>
                        <span className={styles.infoCardKey}>UNIT</span>
                        <span className={styles.infoCardValue}>
                          {selectedMedicine.unitDesc}
                        </span>
                      </div>
                    )}
                    <div className={styles.infoCardItem}>
                      <span className={styles.infoCardKey}>STOCK QTY</span>
                      <span
                        className={`${styles.infoCardValue} ${selectedMedicine.isLowStock ? styles.lowStock : ""}`}
                      >
                        {selectedMedicine.stockQuantity}
                        {selectedMedicine.isLowStock && (
                          <span className={styles.lowStockBadge}>Low</span>
                        )}
                      </span>
                    </div>
                    <div className={styles.infoCardItem}>
                      <span className={styles.infoCardKey}>PURCHASE PRICE</span>
                      <span className={styles.infoCardValue}>
                        ₹{selectedMedicine.purchasePrice}
                      </span>
                    </div>
                    <div className={styles.infoCardItem}>
                      <span className={styles.infoCardKey}>MRP</span>
                      <span className={styles.infoCardValue}>
                        ₹{selectedMedicine.mrp}
                      </span>
                    </div>
                    {selectedMedicine.hsnCode && (
                      <div className={styles.infoCardItem}>
                        <span className={styles.infoCardKey}>HSN CODE</span>
                        <span className={styles.infoCardValue}>
                          {selectedMedicine.hsnCode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity & Unit Price Row */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Quantity <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    name="Quantity"
                    value={formData.Quantity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    placeholder="Enter quantity"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Unit Price (₹) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    name="UnitPrice"
                    value={formData.UnitPrice}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Enter unit price"
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Total Amount Badge */}
              {totalAmount && (
                <div className={styles.totalBadge}>
                  <FiCheckCircle size={16} />
                  Total Amount: <strong>₹{totalAmount}</strong>
                </div>
              )}
            </div>

            <p className={styles.noteText}>
              Fields marked with <span className={styles.required}>*</span> are
              required. Total amount is calculated automatically.
            </p>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={handleClose}
              disabled={formLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={formLoading || !formData.POID || !formData.MedicineID}
            >
              {formLoading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPurchaseOrderDetail;
