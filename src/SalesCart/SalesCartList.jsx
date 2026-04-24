// src/components/SalesCartList.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiShoppingCart,
  FiFileText,
  FiCheckCircle,
  FiX,
  FiCalendar,
  FiUser,
  FiPackage,
  FiPhone,
  FiDollarSign,
} from "react-icons/fi";
import { MdCake } from "react-icons/md";
import {
  getPrescriptionList,
  getPrescriptionDetailList,
  addSalesCart,
  addSalesCartDetail,
  getSalesCartList,
} from "../Api/ApiPharmacy.js";
import { getMedicineMasterList } from "../Api/ApiPharmacy.js";
import ErrorHandler from "../Hooks/ErrorHandler.jsx";
import Header from "../Header/Header.jsx";
import MessagePopup from "../Hooks/MessagePopup.jsx";
import styles from "./SalesCartList.module.css";
import { FaClinicMedical } from "react-icons/fa";
import { getStoredClinicId, getStoredBranchId } from '../Utils/Cryptoutils.js';
import LoadingPage from "../Hooks/LoadingPage.jsx";

// ──────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────
const PRES_SEARCH_TYPE_OPTIONS = [
  { value: "patientName", label: "Patient Name" },
  { value: "doctorName",  label: "Doctor Name"  },
];

const CART_SEARCH_TYPE_OPTIONS = [
  { value: "patientName", label: "Patient Name" },
];

const PAGE_SIZE = 20;

// ──────────────────────────────────────────────────
// IndexedDB helpers
// DB: "AppPreferences"  |  Store: "columnPrefs"
// Matches the existing pattern used by other components
// (e.g. "medicineMasterColPrefs", "purchaseOrderList")
// Value shape: { activeColumns: string[], menuOrder: string[] }
// ──────────────────────────────────────────────────
const DB_NAME    = "AppPreferences";
const DB_VERSION = 1;
const STORE_NAME = "columnPrefs";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

// Returns { activeColumns: string[], menuOrder: string[] } or null
async function idbGetPrefs(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror   = () => reject(req.error);
  });
}

// value: { activeColumns: string[], menuOrder: string[] }
async function idbSetPrefs(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ──────────────────────────────────────────────────
// PRESCRIPTION dynamic-column definitions
// Slot 0 → "Notes" column (default)
// Slot 1 → "Status" column (default)
// ──────────────────────────────────────────────────
const PRES_DYNAMIC_COLS_MAP = {
  patientAge: {
    id:     "patientAge",
    label:  "Patient Age",
    header: "Age",
    icon:   <MdCake size={15} />,
    render: (p) => p.patientAge != null ? p.patientAge : "—",
  },
  patientMobile: {
    id:     "patientMobile",
    label:  "Patient Mobile",
    header: "Patient Mobile",
    icon:   <FiPhone size={15} />,
    render: (p) => p.patientMobile || "—",
  },
};

// Default slot renderers (shown when the dynamic column is NOT active)
const PRES_SLOT_DEFAULTS = [
  {
    header: "Notes",
    render: (p) => p.notes ? <div className={styles.subText}>{p.notes}</div> : "—",
  },
  {
    header: "Status",
    render: (p) => (
      <span className={`${styles.badge} ${p.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}>
        {p.statusDesc}
      </span>
    ),
  },
];

const PRES_INITIAL_ORDER = ["patientAge", "patientMobile"];

// ──────────────────────────────────────────────────
// SALES CART dynamic-column definitions
// Slot 0 → "Total Items" column (default)
// Slot 1 → "Created Date" column (default)
// ──────────────────────────────────────────────────
const CART_DYNAMIC_COLS_MAP = {
  netAmount: {
    id:     "netAmount",
    label:  "Net Amount",
    header: "Net Amount",
    icon:   <FiDollarSign size={15} />,
    render: (c) => c.netAmount != null ? `₹${Number(c.netAmount).toFixed(2)}` : "—",
  },
  patientMobile: {
    id:     "patientMobile",
    label:  "Patient Mobile",
    header: "Patient Mobile",
    icon:   <FiPhone size={15} />,
    render: (c) => c.patientMobile || c.customerMobile || "—",
  },
};

const CART_SLOT_DEFAULTS = [
  {
    header: "Total Items",
    render: (c) => (
      <span className={styles.itemCountBadge}>{c.totalItems ?? 0} items</span>
    ),
  },
  {
    header: "Created Date",
    render: (c) => {
      if (!c.dateCreated) return "—";
      return new Date(c.dateCreated).toLocaleDateString("en-GB", {
        year: "numeric", month: "short", day: "numeric",
      });
    },
  },
];

const CART_INITIAL_ORDER = ["netAmount", "patientMobile"];

// ──────────────────────────────────────────────────
// IDB keys  — one key per tab, value = { activeColumns, menuOrder }
// Naming matches existing pattern: "medicineMasterColPrefs" etc.
// ──────────────────────────────────────────────────
const IDB_KEY_PRES = "salesCartPresColPrefs";
const IDB_KEY_CART = "salesCartCartColPrefs";

// ──────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────
const SalesCartList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem("salesCartActiveTab") || "prescriptions"
  );

  // Prescriptions pagination & data
  const [prescriptions, setPrescriptions] = useState([]);
  const [presPage, setPresPage]           = useState(1);
  const [presHasNext, setPresHasNext]     = useState(false);

  // Sales Carts pagination & data
  const [salesCarts, setSalesCarts]   = useState([]);
  const [cartPage, setCartPage]       = useState(1);
  const [cartHasNext, setCartHasNext] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [cartedPrescriptionIds, setCartedPrescriptionIds] = useState(new Set());

  const today = new Date().toISOString().split("T")[0];

  const [presFilterInputs, setPresFilterInputs] = useState({
    searchType:  "patientName",
    searchValue: "",
    fromDate:    today,
    toDate:      today,
    status:      "",
  });

  const [cartFilterInputs, setCartFilterInputs] = useState({
    searchType:  "patientName",
    searchValue: "",
    status:      "",
  });

  // ── Prescription dynamic columns ──────────────────
  const [presActiveColumns, setPresActiveColumns] = useState(new Set());
  const [presMenuOrder,     setPresMenuOrder]     = useState(PRES_INITIAL_ORDER);
  const presPrefsLoaded = useRef(false);

  // ── Sales Cart dynamic columns ────────────────────
  const [cartActiveColumns, setCartActiveColumns] = useState(new Set());
  const [cartMenuOrder,     setCartMenuOrder]     = useState(CART_INITIAL_ORDER);
  const cartPrefsLoaded = useRef(false);

  // ── Load persisted prefs from IndexedDB on mount ──
  useEffect(() => {
    (async () => {
      try {
        const [presPrefs, cartPrefs] = await Promise.all([
          idbGetPrefs(IDB_KEY_PRES),
          idbGetPrefs(IDB_KEY_CART),
        ]);

        if (presPrefs) {
          if (Array.isArray(presPrefs.activeColumns))
            setPresActiveColumns(new Set(presPrefs.activeColumns));
          if (Array.isArray(presPrefs.menuOrder))
            setPresMenuOrder(presPrefs.menuOrder);
        }

        if (cartPrefs) {
          if (Array.isArray(cartPrefs.activeColumns))
            setCartActiveColumns(new Set(cartPrefs.activeColumns));
          if (Array.isArray(cartPrefs.menuOrder))
            setCartMenuOrder(cartPrefs.menuOrder);
        }
      } catch (e) {
        console.warn("IDB load failed:", e);
      } finally {
        presPrefsLoaded.current = true;
        cartPrefsLoaded.current = true;
      }
    })();
  }, []);

  // ── Persist prescription prefs whenever they change ──
  useEffect(() => {
    if (!presPrefsLoaded.current) return;
    idbSetPrefs(IDB_KEY_PRES, {
      activeColumns: [...presActiveColumns],
      menuOrder:     presMenuOrder,
    }).catch(console.warn);
  }, [presActiveColumns, presMenuOrder]);

  // ── Persist cart prefs whenever they change ──
  useEffect(() => {
    if (!cartPrefsLoaded.current) return;
    idbSetPrefs(IDB_KEY_CART, {
      activeColumns: [...cartActiveColumns],
      menuOrder:     cartMenuOrder,
    }).catch(console.warn);
  }, [cartActiveColumns, cartMenuOrder]);

  // ── Compute table slots (prescription) ─────────────
  const presTableSlots = useMemo(() => {
    return PRES_SLOT_DEFAULTS.map((def, slotIdx) => {
      const colId  = presMenuOrder[slotIdx];
      const dynCol = colId ? PRES_DYNAMIC_COLS_MAP[colId] : null;
      if (dynCol && presActiveColumns.has(colId)) {
        return { header: dynCol.header, render: dynCol.render };
      }
      return { header: def.header, render: def.render };
    });
  }, [presActiveColumns, presMenuOrder]);

  const togglePresDynCol = (id) => {
    setPresActiveColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const presMenuItems = presMenuOrder.map((id) => {
    const col = PRES_DYNAMIC_COLS_MAP[id];
    return {
      id:       col.id,
      icon:     col.icon,
      label:    col.label,
      checked:  presActiveColumns.has(col.id),
      keepOpen: true,
      onClick:  () => togglePresDynCol(col.id),
    };
  });

  // ── Compute table slots (sales cart) ───────────────
  const cartTableSlots = useMemo(() => {
    return CART_SLOT_DEFAULTS.map((def, slotIdx) => {
      const colId  = cartMenuOrder[slotIdx];
      const dynCol = colId ? CART_DYNAMIC_COLS_MAP[colId] : null;
      if (dynCol && cartActiveColumns.has(colId)) {
        return { header: dynCol.header, render: dynCol.render };
      }
      return { header: def.header, render: def.render };
    });
  }, [cartActiveColumns, cartMenuOrder]);

  const toggleCartDynCol = (id) => {
    setCartActiveColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const cartMenuItems = cartMenuOrder.map((id) => {
    const col = CART_DYNAMIC_COLS_MAP[id];
    return {
      id:       col.id,
      icon:     col.icon,
      label:    col.label,
      checked:  cartActiveColumns.has(col.id),
      keepOpen: true,
      onClick:  () => toggleCartDynCol(col.id),
    };
  });

  // ── Header menu items depend on active tab ──────────
  const headerMenuItems    = activeTab === "prescriptions" ? presMenuItems    : cartMenuItems;
  const handleMenuReorder  = activeTab === "prescriptions"
    ? (newOrder) => setPresMenuOrder(newOrder)
    : (newOrder) => setCartMenuOrder(newOrder);

  const [confirm, setConfirm] = useState({
    isOpen:         false,
    prescription:   null,
    details:        [],
    medicineMap:    {},
    loadingDetails: false,
    submitting:     false,
    submitProgress: "",
    error:          null,
    success:        false,
    cartId:         null,
  });

  // ── Button cooldown state (2-sec disable after click) ──────────────────────
  const [btnCooldown, setBtnCooldown] = useState({});
  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  // ── MessagePopup state ──────────────────────────────────────────────────────
  const [popup, setPopup] = useState({ visible: false, message: "", type: "success" });
  const showPopup  = (message, type = "success") => setPopup({ visible: true, message, type });
  const closePopup = () => setPopup({ visible: false, message: "", type: "success" });

  // ────────────────────────────────────────────────
  const fetchPrescriptions = async (page = presPage, overrides = {}) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const f = { ...presFilterInputs, ...overrides };
      const options = {
        Page:        page,
        PageSize:    PAGE_SIZE,
        BranchID:    branchId,
        PatientName: f.searchType === "patientName" ? f.searchValue.trim() : "",
        DoctorName:  f.searchType === "doctorName"  ? f.searchValue.trim() : "",
        FromDate:    f.fromDate || "",
        ToDate:      f.toDate   || "",
        IsRepeat:    -1,
        Status:      f.status !== "" ? Number(f.status) : -1,
      };
      const data = await getPrescriptionList(clinicId, options);
      const sorted = [...data].sort(
        (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated),
      );
      setPrescriptions(sorted);
      setPresHasNext(sorted.length === PAGE_SIZE);
    } catch (err) {
      console.error("fetchPrescriptions error:", err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || "Failed to load prescriptions" },
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesCarts = async (page = cartPage, overrides = {}) => {
    try {
      setLoading(true);
      setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const f = { ...cartFilterInputs, ...overrides };
      const options = {
        Page:        page,
        PageSize:    PAGE_SIZE,
        BranchID:    branchId,
        PatientName: f.searchValue.trim(),
        Status:      f.status !== "" ? Number(f.status) : -1,
      };
      const data = await getSalesCartList(clinicId, options);
      const sorted = [...data].sort(
        (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated),
      );
      setSalesCarts(sorted);
      setCartHasNext(sorted.length === PAGE_SIZE);
    } catch (err) {
      console.error("fetchSalesCarts error:", err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || "Failed to load sales carts" },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "prescriptions") {
      fetchPrescriptions(1);
      setPresPage(1);
    } else {
      fetchSalesCarts(1);
      setCartPage(1);
    }
  }, [activeTab]);

  // ────────────────────────────────────────────────
  const handlePresFilterChange = (e) => {
    const { name, value } = e.target;
    setPresFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleCartFilterChange = (e) => {
    const { name, value } = e.target;
    setCartFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handlePresSearch = () => {
    triggerCooldown("pres-search");
    fetchPrescriptions(1);
    setPresPage(1);
  };

  const handleCartSearch = () => {
    triggerCooldown("cart-search");
    fetchSalesCarts(1);
    setCartPage(1);
  };

  const clearPresFilters = () => {
    triggerCooldown("pres-clear");
    const empty = {
      searchType:  "patientName",
      searchValue: "",
      fromDate:    today,
      toDate:      today,
      status:      "",
    };
    setPresFilterInputs(empty);
    fetchPrescriptions(1, empty);
    setPresPage(1);
  };

  const clearCartFilters = () => {
    triggerCooldown("cart-clear");
    const empty = { searchType: "patientName", searchValue: "", status: "" };
    setCartFilterInputs(empty);
    fetchSalesCarts(1, empty);
    setCartPage(1);
  };

  const hasPresFilters = !!(
    presFilterInputs.searchValue ||
    presFilterInputs.fromDate !== today ||
    presFilterInputs.toDate   !== today ||
    presFilterInputs.status
  );

  const hasCartFilters = !!(
    cartFilterInputs.searchValue || cartFilterInputs.status
  );

  const handlePresPageChange = (newPage) => {
    if (newPage < 1) return;
    triggerCooldown(`pres-page-${newPage}`);
    setPresPage(newPage);
    fetchPrescriptions(newPage);
  };

  const handleCartPageChange = (newPage) => {
    if (newPage < 1) return;
    triggerCooldown(`cart-page-${newPage}`);
    setCartPage(newPage);
    fetchSalesCarts(newPage);
  };

  // ────────────────────────────────────────────────
  const handleAddToCartClick = async (prescription) => {
    triggerCooldown(`addcart-${prescription.id}`);
    setConfirm({
      isOpen:         true,
      prescription,
      details:        [],
      medicineMap:    {},
      loadingDetails: true,
      submitting:     false,
      submitProgress: "",
      error:          null,
      success:        false,
      cartId:         null,
    });
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const details = await getPrescriptionDetailList(clinicId, {
        BranchID:       branchId,
        PrescriptionID: prescription.id,
        PageSize:       50,
      });
      const activeDetails = details.filter((d) => d.status === 1);
      if (!activeDetails.length) {
        setConfirm((prev) => ({ ...prev, loadingDetails: false }));
        showPopup("No medicine details found for this prescription.", "error");
        return;
      }
      const uniqueMedicineIds = [...new Set(activeDetails.map((d) => d.medicineId))];
      const medicinePriceResults = await Promise.all(
        uniqueMedicineIds.map((medId) =>
          getMedicineMasterList(clinicId, {
            BranchID:   branchId,
            MedicineID: medId,
            PageSize:   1,
          })
            .then((res) => {
              const med = res?.[0];
              return {
                id:        medId,
                sellPrice: med ? Number(med.sellPrice) || 0 : 0,
                name:      med?.name || "",
              };
            })
            .catch(() => ({ id: medId, sellPrice: 0, name: "" })),
        ),
      );
      const medicineMap = {};
      medicinePriceResults.forEach((m) => {
        medicineMap[m.id] = { sellPrice: m.sellPrice, name: m.name };
      });
      setConfirm((prev) => ({
        ...prev,
        details:        activeDetails,
        medicineMap,
        loadingDetails: false,
      }));
    } catch (err) {
      console.error("Error loading prescription details:", err);
      setConfirm((prev) => ({ ...prev, loadingDetails: false }));
      showPopup(err.message || "Failed to load prescription details.", "error");
    }
  };

  const handleConfirmAddToCart = async () => {
    const { prescription, details, medicineMap } = confirm;
    if (!prescription || !details.length) return;
    setConfirm((prev) => ({
      ...prev,
      submitting:     true,
      submitProgress: "Creating sales cart...",
      error:          null,
    }));
    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const cartResult = await addSalesCart({
        clinicId,
        branchId,
        PatientID: prescription.patientId,
        Name:      prescription.patientName || "",
      });
      const cartId = cartResult.cartId;
      setConfirm((prev) => ({
        ...prev,
        cartId,
        submitProgress: "Cart created. Adding medicines...",
      }));
      const errors = [];
      for (let i = 0; i < details.length; i++) {
        const detail    = details[i];
        const unitPrice = medicineMap[detail.medicineId]?.sellPrice ?? 0;
        setConfirm((prev) => ({
          ...prev,
          submitProgress: `Adding medicine ${i + 1} of ${details.length}: ${detail.medicineName}...`,
        }));
        try {
          await addSalesCartDetail({
            clinicId,
            branchId,
            CartID:             cartId,
            MedicineID:         detail.medicineId,
            Quantity:           Number(detail.quantity) || 1,
            UnitPrice:          unitPrice,
            DiscountPercentage: 0,
            BatchSelection:     "FEFO",
          });
        } catch (detailErr) {
          console.error(
            `addSalesCartDetail failed for medicine ${detail.medicineId}:`,
            detailErr,
          );
          errors.push(`${detail.medicineName}: ${detailErr.message}`);
        }
      }
      if (errors.length > 0) {
        setConfirm((prev) => ({
          ...prev,
          submitting:     false,
          submitProgress: "",
          success:        false,
          cartId,
        }));
        showPopup(`Cart created but some medicines failed:\n${errors.join("\n")}`, "error");
      } else {
        setCartedPrescriptionIds((prev) => new Set([...prev, prescription.id]));
        setConfirm((prev) => ({
          ...prev,
          submitting:     false,
          submitProgress: "",
          success:        true,
          cartId,
        }));
        showPopup(
          `Cart created! All ${details.length} medicine(s) added successfully.`,
          "success"
        );
        setTimeout(() => {
          closeConfirm();
          if (activeTab === "prescriptions") fetchPrescriptions(presPage);
          else fetchSalesCarts(cartPage);
        }, 2000);
      }
    } catch (err) {
      console.error("Add to cart failed:", err);
      setConfirm((prev) => ({
        ...prev,
        submitting:     false,
        submitProgress: "",
      }));
      showPopup(err.message || "Failed to add sales cart.", "error");
    }
  };

  const closeConfirm = () => {
    if (confirm.submitting) return;
    setConfirm({
      isOpen:         false,
      prescription:   null,
      details:        [],
      medicineMap:    {},
      loadingDetails: false,
      submitting:     false,
      submitProgress: "",
      error:          null,
      success:        false,
      cartId:         null,
    });
  };

  // ────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      year:  "numeric",
      month: "short",
      day:   "numeric",
    });
  };

  const formatCurrency = (val) =>
    val == null ? "—" : `₹${Number(val).toFixed(2)}`;

  const totalCartValue = useMemo(() => {
    const { details, medicineMap } = confirm;
    return details.reduce((sum, d) => {
      const price = medicineMap[d.medicineId]?.sellPrice ?? 0;
      return sum + price * (Number(d.quantity) || 1);
    }, 0);
  }, [confirm.details, confirm.medicineMap]);

  if (error && (error?.status >= 400 || error?.code >= 400))
    return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.loading}><LoadingPage /></div>;
  if (error)
    return <div className={styles.error}>Error: {error.message || error}</div>;

  const getStartRecord = (page, records) =>
    records.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const getEndRecord = (page, records) =>
    Math.min(
      getStartRecord(page, records) + records.length - 1,
      (page - 1) * PAGE_SIZE + records.length,
    );

  // Only show active prescriptions (status === 1) in the table
  const activePrescriptions = prescriptions.filter((pres) => pres.status === 1);

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />

      <Header
        title="Sales Cart Management"
        menuItems={headerMenuItems}
        onMenuReorder={handleMenuReorder}
      />

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "prescriptions" ? styles.tabActive : ""}`}
          onClick={() => {
            triggerCooldown("tab-prescriptions");
            sessionStorage.setItem("salesCartActiveTab", "prescriptions");
            setActiveTab("prescriptions");
          }}
          disabled={!!btnCooldown["tab-prescriptions"]}
        >
          <FiFileText size={18} /> Prescriptions
        </button>
        <button
          className={`${styles.tab} ${activeTab === "salesCarts" ? styles.tabActive : ""}`}
          onClick={() => {
            triggerCooldown("tab-salesCarts");
            sessionStorage.setItem("salesCartActiveTab", "salesCarts");
            setActiveTab("salesCarts");
          }}
          disabled={!!btnCooldown["tab-salesCarts"]}
        >
          <FiShoppingCart size={18} /> Sales Carts
        </button>
      </div>

      {/* ── PRESCRIPTION FILTERS ── */}
      {activeTab === "prescriptions" && (
        <div className={styles.inlineFiltersContainer}>
          <div className={styles.presFiltersGrid}>
            <div className={styles.searchGroup}>
              <select
                name="searchType"
                value={presFilterInputs.searchType}
                onChange={handlePresFilterChange}
                className={styles.searchTypeSelect}
              >
                {PRES_SEARCH_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                name="searchValue"
                placeholder={`Search by ${PRES_SEARCH_TYPE_OPTIONS.find((o) => o.value === presFilterInputs.searchType)?.label || ""}`}
                value={presFilterInputs.searchValue}
                onChange={handlePresFilterChange}
                onKeyDown={(e) => e.key === "Enter" && handlePresSearch()}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.dateWrapper}>
              {!presFilterInputs.fromDate && (
                <span className={styles.datePlaceholder}>From Date</span>
              )}
              <input
                type="date"
                name="fromDate"
                value={presFilterInputs.fromDate}
                onChange={handlePresFilterChange}
                className={`${styles.inlineFilterInput} ${!presFilterInputs.fromDate ? styles.dateEmpty : ""}`}
              />
            </div>

            <div className={styles.dateWrapper}>
              {!presFilterInputs.toDate && (
                <span className={styles.datePlaceholder}>To Date</span>
              )}
              <input
                type="date"
                name="toDate"
                value={presFilterInputs.toDate}
                onChange={handlePresFilterChange}
                className={`${styles.inlineFilterInput} ${!presFilterInputs.toDate ? styles.dateEmpty : ""}`}
              />
            </div>

            <select
              name="status"
              value={presFilterInputs.status}
              onChange={handlePresFilterChange}
              className={styles.inlineFilterSelect}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="2">Cancelled</option>
            </select>

            <div className={styles.inlineFilterActions}>
              <button
                onClick={handlePresSearch}
                className={styles.searchButton}
                disabled={!!btnCooldown["pres-search"]}
              >
                <FiSearch size={15} /> Search
              </button>
              {hasPresFilters && (
                <button
                  onClick={clearPresFilters}
                  className={styles.clearButton}
                  disabled={!!btnCooldown["pres-clear"]}
                >
                  <FiX size={15} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SALES CART FILTERS ── */}
      {activeTab === "salesCarts" && (
        <div className={styles.inlineFiltersContainer}>
          <div className={styles.cartFiltersGrid}>
            <div className={styles.searchGroup}>
              <select
                name="searchType"
                value={cartFilterInputs.searchType}
                onChange={handleCartFilterChange}
                className={styles.searchTypeSelect}
              >
                {CART_SEARCH_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                name="searchValue"
                placeholder={`Search by ${CART_SEARCH_TYPE_OPTIONS.find((o) => o.value === cartFilterInputs.searchType)?.label || ""}`}
                value={cartFilterInputs.searchValue}
                onChange={handleCartFilterChange}
                onKeyDown={(e) => e.key === "Enter" && handleCartSearch()}
                className={styles.searchInput}
              />
            </div>

            <select
              name="status"
              value={cartFilterInputs.status}
              onChange={handleCartFilterChange}
              className={styles.inlineFilterSelect}
            >
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="2">Cancelled</option>
              <option value="3">Completed</option>
            </select>

            <div className={styles.inlineFilterActions}>
              <button
                onClick={handleCartSearch}
                className={styles.searchButton}
                disabled={!!btnCooldown["cart-search"]}
              >
                <FiSearch size={15} /> Search
              </button>
              {hasCartFilters && (
                <button
                  onClick={clearCartFilters}
                  className={styles.clearButton}
                  disabled={!!btnCooldown["cart-clear"]}
                >
                  <FiX size={15} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PRESCRIPTIONS TABLE + PAGINATION ── */}
      {activeTab === "prescriptions" && (
        <div className={styles.tableSection}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date Issued</th>
                  <th>Valid Until</th>
                  {presTableSlots.map((slot, i) => (
                    <th key={i}>{slot.header}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activePrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={4 + presTableSlots.length + 1} className={styles.noData}>
                      No prescriptions found.
                    </td>
                  </tr>
                ) : (
                  activePrescriptions.map((pres) => {
                    const isCarted = cartedPrescriptionIds.has(pres.id);
                    return (
                      <tr key={pres.id}>
                        <td>
                          <div className={styles.nameCell}>
                            <div className={styles.avatar}>
                              {pres.patientName?.charAt(0).toUpperCase() || "P"}
                            </div>
                            <div>
                              <div className={styles.name}>{pres.patientName}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.name}>{pres.doctorFullName}</div>
                          <div className={styles.subText}>{pres.doctorCode || "—"}</div>
                        </td>
                        <td>
                          <div className={styles.name}>{formatDate(pres.dateIssued)}</div>
                        </td>
                        <td>
                          <div className={styles.name}>{formatDate(pres.validUntil)}</div>
                        </td>
                        {presTableSlots.map((slot, i) => (
                          <td key={i}>{slot.render(pres)}</td>
                        ))}
                        <td>
                          <div className={styles.actionsCell}>
                            <button
                              onClick={() => handleAddToCartClick(pres)}
                              className={`${styles.addCartBtn} ${isCarted ? styles.addCartBtnDone : ""}`}
                              disabled={isCarted || !!btnCooldown[`addcart-${pres.id}`]}
                            >
                              {isCarted ? (
                                <><FiCheckCircle size={15} /> Cart Added</>
                              ) : (
                                <><FiShoppingCart size={15} /> Add to Cart</>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              {activePrescriptions.length > 0
                ? `Showing ${getStartRecord(presPage, activePrescriptions)}–${getEndRecord(presPage, activePrescriptions)} records`
                : "No records"}
            </div>

            <div className={styles.paginationControls}>
              <span className={styles.paginationLabel}>Page</span>

              <button
                className={styles.pageBtn}
                onClick={() => handlePresPageChange(1)}
                disabled={presPage === 1 || !!btnCooldown["pres-page-1"]}
                title="First page"
              >
                «
              </button>

              <button
                className={styles.pageBtn}
                onClick={() => handlePresPageChange(presPage - 1)}
                disabled={presPage === 1 || !!btnCooldown[`pres-page-${presPage - 1}`]}
                title="Previous page"
              >
                ‹
              </button>

              <span className={styles.pageIndicator}>{presPage}</span>

              <button
                className={styles.pageBtn}
                onClick={() => handlePresPageChange(presPage + 1)}
                disabled={!presHasNext || !!btnCooldown[`pres-page-${presPage + 1}`]}
                title="Next page"
              >
                ›
              </button>
            </div>

            <div className={styles.pageSizeInfo}>
              Page Size: <strong>{PAGE_SIZE}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── SALES CARTS TABLE + PAGINATION ── */}
      {activeTab === "salesCarts" && (
        <div className={styles.tableSection}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Patient</th>
                  {cartTableSlots.map((slot, i) => (
                    <th key={i}>{slot.header}</th>
                  ))}
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salesCarts.length === 0 ? (
                  <tr>
                    <td colSpan={1 + cartTableSlots.length + 3} className={styles.noData}>
                      No sales carts found.
                    </td>
                  </tr>
                ) : (
                  salesCarts.map((cart) => (
                    <tr key={cart.id}>
                      <td>
                        <div className={styles.name}>{cart.customerName || "—"}</div>
                      </td>
                      {cartTableSlots.map((slot, i) => (
                        <td key={i}>{slot.render(cart)}</td>
                      ))}
                      <td>
                        <span className={styles.amountBadge}>
                          {formatCurrency(cart.totalAmount)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${cart.status === 1 ? styles.activeBadge : styles.inactiveBadge}`}
                        >
                          {cart.statusDesc || "Active"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionsCell}>
                          <button
                            onClick={() => {
                              triggerCooldown(`viewcart-${cart.id}`);
                              navigate(`/salescartdetail-list/${cart.id}`);
                            }}
                            className={styles.viewBtn}
                            disabled={!!btnCooldown[`viewcart-${cart.id}`]}
                          >
                            View Cart
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              {salesCarts.length > 0
                ? `Showing ${getStartRecord(cartPage, salesCarts)}–${getEndRecord(cartPage, salesCarts)} records`
                : "No records"}
            </div>

            <div className={styles.paginationControls}>
              <span className={styles.paginationLabel}>Page</span>

              <button
                className={styles.pageBtn}
                onClick={() => handleCartPageChange(1)}
                disabled={cartPage === 1 || !!btnCooldown["cart-page-1"]}
                title="First page"
              >
                «
              </button>

              <button
                className={styles.pageBtn}
                onClick={() => handleCartPageChange(cartPage - 1)}
                disabled={cartPage === 1 || !!btnCooldown[`cart-page-${cartPage - 1}`]}
                title="Previous page"
              >
                ‹
              </button>

              <span className={styles.pageIndicator}>{cartPage}</span>

              <button
                className={styles.pageBtn}
                onClick={() => handleCartPageChange(cartPage + 1)}
                disabled={!cartHasNext || !!btnCooldown[`cart-page-${cartPage + 1}`]}
                title="Next page"
              >
                ›
              </button>
            </div>

            <div className={styles.pageSizeInfo}>
              Page Size: <strong>{PAGE_SIZE}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFIRM MODAL ── */}
      {confirm.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderContent}>
                <div className={styles.modalHeaderIcon}>
                  <FiShoppingCart size={20} />
                </div>
                <h2>Add to Sales Cart</h2>
              </div>

              <div className={styles.clinicNameone}>
                <FaClinicMedical
                  size={20}
                  style={{ verticalAlign: "middle", margin: "6px", marginTop: "0px" }}
                />
                {localStorage.getItem("clinicName") || "—"}
              </div>

              {!confirm.submitting && !confirm.success && (
                <button onClick={closeConfirm} className={styles.modalClose}>
                  <FiX size={16} />
                </button>
              )}
            </div>

            <div className={styles.modalBody}>
              {confirm.success && (
                <div className={styles.successState}>
                  <FiCheckCircle size={48} className={styles.successIcon} />
                  <h3>Cart Created Successfully!</h3>
                  <p className={styles.successSub}>
                    All {confirm.details.length} medicine(s) have been added to the cart.
                  </p>
                </div>
              )}
              {!confirm.success && confirm.loadingDetails && (
                <div className={styles.loadingDetails}>
                  <div className={styles.spinner} />
                  <span>Loading prescription medicines...</span>
                </div>
              )}
              {confirm.submitting && (
                <div className={styles.progressBanner}>
                  <div className={styles.spinner} />
                  <span>{confirm.submitProgress}</span>
                </div>
              )}
              {!confirm.success &&
                !confirm.loadingDetails &&
                confirm.prescription && (
                  <>
                    <div className={styles.presInfoGrid}>
                      <div className={styles.presInfoItem}>
                        <div className={styles.presInfoNew}>
                          <FiUser size={14} className={styles.presInfoIcon} />
                          <span className={styles.presInfoLabel}>Patient</span>
                        </div>
                        <span className={styles.presInfoValue}>
                          {confirm.prescription.patientName}
                          <span className={styles.presInfoSub}>
                            {confirm.prescription.patientFileNo}
                          </span>
                        </span>
                      </div>
                      <div className={styles.presInfoItem}>
                        <div className={styles.presInfoNew}>
                          <FiCalendar size={14} className={styles.presInfoIcon} />
                          <span className={styles.presInfoLabel}>Issued</span>
                        </div>
                        <span className={styles.presInfoValue}>
                          {formatDate(confirm.prescription.dateIssued)}
                        </span>
                      </div>
                      {confirm.prescription.diagnosis && (
                        <div className={`${styles.presInfoItem} ${styles.presInfoFullWidth}`}>
                          <FiFileText size={14} className={styles.presInfoIcon} />
                          <span className={styles.presInfoLabel}>Diagnosis</span>
                          <span className={styles.presInfoValue}>
                            {confirm.prescription.diagnosis}
                          </span>
                        </div>
                      )}
                    </div>

                    {confirm.details.length > 0 && (
                      <div className={styles.medicineSection}>
                        <h4 className={styles.medicineSectionTitle}>
                          <FiPackage size={15} />
                          Medicines to be added ({confirm.details.length})
                        </h4>
                        <div className={styles.medicineTableWrapper}>
                          <table className={styles.medicineTable}>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Medicine</th>
                                <th>Form</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {confirm.details.map((detail, idx) => {
                                const price =
                                  confirm.medicineMap[detail.medicineId]?.sellPrice ?? 0;
                                const qty = Number(detail.quantity) || 1;
                                return (
                                  <tr key={detail.id}>
                                    <td className={styles.medIdx}>{idx + 1}</td>
                                    <td>
                                      <div className={styles.medName}>{detail.medicineName}</div>
                                      {detail.genericName && (
                                        <div className={styles.medGeneric}>
                                          {detail.genericName}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <span className={styles.formBadge}>{detail.formDesc}</span>
                                    </td>
                                    <td>
                                      <span className={styles.qtyBadge}>{qty}</span>
                                    </td>
                                    <td className={styles.priceCell}>
                                      {formatCurrency(price)}
                                    </td>
                                    <td className={styles.totalCell}>
                                      {formatCurrency(price * qty)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan={5} className={styles.grandTotalLabel}>
                                  Grand Total
                                </td>
                                <td className={styles.grandTotalValue}>
                                  {formatCurrency(totalCartValue)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
            </div>

            {!confirm.success && (
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={confirm.submitting}
                  className={styles.btnCancel}
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddToCart}
                  disabled={
                    confirm.submitting ||
                    confirm.loadingDetails ||
                    !confirm.details.length
                  }
                  className={styles.btnConfirm}
                >
                  <FiShoppingCart size={16} />
                  {confirm.submitting ? "Processing..." : "Yes, Add to Cart"}
                </button>
              </div>
            )}

            {confirm.success && (
              <div className={styles.modalFooter}>
                <button onClick={closeConfirm} className={styles.btnConfirm}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MessagePopup (at root level so z-index is never blocked) ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />
    </div>
  );
};

export default SalesCartList;