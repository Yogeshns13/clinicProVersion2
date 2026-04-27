// src/components/MedicineStockList.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiPlus,
  FiX,
  FiChevronDown,
  FiArrowLeft,
  FiPackage,
} from "react-icons/fi";
import {
  getMedicineStockList,
  addMedicineStock,
  getMedicineMasterList,
} from "../Api/ApiPharmacy.js";
import ErrorHandler from "../Hooks/ErrorHandler.jsx";
import Header from "../Header/Header.jsx";
import UpdateMedicineStock from "./UpdateMedicineStock.jsx";
import MessagePopup from "../Hooks/MessagePopup.jsx";
import styles from "./MedicineStockList.module.css";
import { FaClinicMedical } from "react-icons/fa";
import { getStoredClinicId, getStoredBranchId, getStoredClinicName } from '../Utils/Cryptoutils.js';
import LoadingPage from "../Hooks/LoadingPage.jsx";

// ────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────
const getTodayDate = () => new Date().toISOString().split("T")[0];

const DEFAULT_FILTERS = {
  searchType:  "medicineName",
  searchValue: "",
  expiryFrom:  "",
  expiryTo:    "",
  medicineId:  null,
};

// ────────────────────────────────────────────────
const MedicineStockList = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const locationMedicineId   = location.state?.medicineId   ?? null;
  const locationMedicineName = location.state?.medicineName ?? null;

  // Data
  const [allStockList, setAllStockList] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  // Pagination
  const [page, setPage]         = useState(1);
  const [pageSize]              = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);

  
   
  const clinicName = localStorage.getItem('clinicName') || '—';
  const branchName = localStorage.getItem('branchName') || '—';

  // Filter inputs (staged, not applied until Search)
  const [filterInputs, setFilterInputs] = useState({
    ...DEFAULT_FILTERS,
    medicineId:  locationMedicineId,
    searchValue: locationMedicineName ?? "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    ...DEFAULT_FILTERS,
    medicineId:  locationMedicineId,
    searchValue: locationMedicineName ?? "",
  });

  // View Details modal
  const [selectedStock, setSelectedStock] = useState(null);

  // Update modal
  const [updatingStock, setUpdatingStock] = useState(null);

  // Add Form Modal
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    MedicineID:    "",
    BatchNo:       "",
    ExpiryDate:    "",
    QuantityIn:    "",
    PurchasePrice: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  // Medicine dropdown (for Add Form)
  const [medicineList, setMedicineList]           = useState([]);
  const [medicineListLoading, setMedicineListLoading] = useState(false);
  const [medicineSearch, setMedicineSearch]       = useState("");
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [selectedMedicineName, setSelectedMedicineName] = useState("");
  const medicineDropdownRef = useRef(null);

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

  // ── Submit button gating ────────────────────────────────────────────────────
  // Enabled only when all required fields are filled
  const allRequiredFilled =
    !!formData.MedicineID &&
    formData.BatchNo.trim().length > 0 &&
    formData.ExpiryDate.trim().length > 0 &&
    String(formData.QuantityIn).trim().length > 0 &&
    String(formData.PurchasePrice).trim().length > 0;

  // ────────────────────────────────────────────────
  // Close medicine dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        medicineDropdownRef.current &&
        !medicineDropdownRef.current.contains(e.target)
      ) {
        setShowMedicineDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ────────────────────────────────────────────────
  // Build API options from filters
  const buildApiOptions = async (filters) => {
    const clinicId = await getStoredClinicId();
    const branchId = await getStoredBranchId();

    const options = {
      Page:           page,
      PageSize:       pageSize,
      BranchID:       branchId,
      MedicineID:     filters.medicineId ? Number(filters.medicineId) : 0,
      MedicineName:   filters.medicineId
        ? ""
        : filters.searchType === "medicineName"
          ? filters.searchValue || ""
          : "",
      BatchNo:        filters.searchType === "batchNo" ? filters.searchValue || "" : "",
      ExpiryFrom:     filters.expiryFrom || "",
      ExpiryTo:       filters.expiryTo   || "",
      NearExpiryDays: 0,
      ZeroStock:      -1,
      NegativeStock:  0,
    };

    return { clinicId, options };
  };

  // ────────────────────────────────────────────────
  // Data fetching
  const fetchStockList = async (filters) => {
    try {
      setLoading(true);
      setError(null);
      const { clinicId, options } = await buildApiOptions(filters);
      const data = await getMedicineStockList(clinicId, options);

      const stockList = Array.isArray(data) ? data : data?.data || [];
      const total     = data?.total || stockList.length;

      setAllStockList(stockList);
      setTotalRecords(total);
    } catch (err) {
      console.error("fetchStockList error:", err);
      setError(
        err?.status >= 400 || err?.code >= 400
          ? err
          : { message: err.message || "Failed to load medicine stock" },
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFilters = {
      ...DEFAULT_FILTERS,
      medicineId:  locationMedicineId,
      searchValue: locationMedicineName ?? "",
    };
    setAppliedFilters(initialFilters);
    fetchStockList(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ────────────────────────────────────────────────
  const isFilterActive = useMemo(() => {
    return (
      appliedFilters.searchValue !== DEFAULT_FILTERS.searchValue ||
      appliedFilters.searchType  !== DEFAULT_FILTERS.searchType  ||
      appliedFilters.expiryFrom  !== DEFAULT_FILTERS.expiryFrom  ||
      appliedFilters.expiryTo    !== DEFAULT_FILTERS.expiryTo    ||
      appliedFilters.medicineId  !== DEFAULT_FILTERS.medicineId
    );
  }, [appliedFilters]);

  // ────────────────────────────────────────────────
  // Medicine master list for add form dropdown
  const fetchMedicineList = async () => {
    try {
      setMedicineListLoading(true);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const data = await getMedicineMasterList(clinicId, {
        BranchID: branchId,
        PageSize: 50,
        Status:   1,
      });
      setMedicineList(data);
    } catch (err) {
      console.error("fetchMedicineList error:", err);
      setMedicineList([]);
    } finally {
      setMedicineListLoading(false);
    }
  };

  const filteredMedicineList = useMemo(() => {
    if (!medicineSearch.trim()) return medicineList;
    const term = medicineSearch.toLowerCase();
    return medicineList.filter(
      (med) =>
        med.name?.toLowerCase().includes(term)         ||
        med.genericName?.toLowerCase().includes(term)  ||
        med.manufacturer?.toLowerCase().includes(term),
    );
  }, [medicineList, medicineSearch]);

  // ────────────────────────────────────────────────
  // Helper functions
  const getStatusClass = (stockStatusDesc) => {
    if (stockStatusDesc?.toLowerCase().includes("expir"))    return styles.nearExpiry;
    if (stockStatusDesc?.toLowerCase().includes("zero"))     return styles.zeroStock;
    if (stockStatusDesc?.toLowerCase().includes("negative")) return styles.negativeStock;
    return styles.normal;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-GB");
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (value) => {
    if (value == null) return "—";
    return `₹${Number(value).toFixed(2)}`;
  };

  // ────────────────────────────────────────────────
  // Handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    triggerCooldown("search");
    const updatedFilters = { ...filterInputs, medicineId: null };
    setFilterInputs(updatedFilters);
    setAppliedFilters(updatedFilters);
    setPage(1);
    fetchStockList(updatedFilters);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearFilters = () => {
    triggerCooldown("clear");
    setFilterInputs({ ...DEFAULT_FILTERS });
    setAppliedFilters({ ...DEFAULT_FILTERS });
    setPage(1);
    fetchStockList(DEFAULT_FILTERS);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    if (newPage > Math.ceil(totalRecords / pageSize)) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
  };

  const handleBackToMasterList = () => {
    triggerCooldown("back");
    navigate("/medicinemaster-list");
  };

  // View details modal
  const openDetails = (stock) => {
    triggerCooldown(`view-${stock.id}`);
    setSelectedStock(stock);
  };
  const closeModal = () => setSelectedStock(null);

  // Update modal (opens on top of details modal)
  const handleUpdateClick = (stock) => {
    triggerCooldown("update");
    setSelectedStock(null);
    setUpdatingStock(stock);
  };

  const handleUpdateClose = () => {
    setUpdatingStock(null);
  };

  const handleUpdateSuccess = () => {
    setUpdatingStock(null);
    setSelectedStock(null);
    fetchStockList(appliedFilters);
  };

  // Add form
  const openAddForm = () => {
    triggerCooldown("add");
    setFormData({
      MedicineID:    "",
      BatchNo:       "",
      ExpiryDate:    "",
      QuantityIn:    "",
      PurchasePrice: "",
    });
    setSelectedMedicineName("");
    setMedicineSearch("");
    setShowMedicineDropdown(false);
    setPopup({ visible: false, message: "", type: "success" });
    setIsAddFormOpen(true);
    fetchMedicineList();
  };

  const closeAddForm = () => {
    setIsAddFormOpen(false);
    setFormLoading(false);
    setSelectedMedicineName("");
    setMedicineSearch("");
    setShowMedicineDropdown(false);
    setPopup({ visible: false, message: "", type: "success" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMedicineSelect = (medicine) => {
    setFormData((prev) => ({ ...prev, MedicineID: medicine.id }));
    setSelectedMedicineName(medicine.name);
    setMedicineSearch("");
    setShowMedicineDropdown(false);
  };

  const handleMedicineInputFocus = () => {
    setShowMedicineDropdown(true);
    setMedicineSearch("");
  };

  const handleClearMedicine = () => {
    setFormData((prev) => ({ ...prev, MedicineID: "" }));
    setSelectedMedicineName("");
    setMedicineSearch("");
    setShowMedicineDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Guard: show warning popup if any required field is missing
    if (!allRequiredFilled) {
      const missing = [];
      if (!formData.MedicineID)                         missing.push("Medicine Name");
      if (!formData.BatchNo.trim())                     missing.push("Batch Number");
      if (!formData.ExpiryDate.trim())                  missing.push("Expiry Date");
      if (!String(formData.QuantityIn).trim())          missing.push("Quantity In");
      if (!String(formData.PurchasePrice).trim())       missing.push("Purchase Price");
      showPopup(
        `Please fill all required fields: ${missing.join(", ")}.`,
        "warning"
      );
      return;
    }

    setFormLoading(true);

    try {
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();

      await addMedicineStock({
        clinicId,
        branchId,
        MedicineID:    Number(formData.MedicineID),
        BatchNo:       formData.BatchNo.trim(),
        ExpiryDate:    formData.ExpiryDate.trim(),
        QuantityIn:    Number(formData.QuantityIn),
        PurchasePrice: Number(formData.PurchasePrice),
      });

      // Success popup (auto-closes in 1s), then close form and refresh
      showPopup("Medicine stock added successfully!", "success");
      setTimeout(() => {
        closeAddForm();
        fetchStockList(appliedFilters);
      }, 1500);
    } catch (err) {
      console.error("Add medicine stock failed:", err);
      showPopup(err.message || "Failed to add medicine stock.", "error");
    } finally {
      setFormLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  // Early returns
  if (error && (error?.status >= 400 || error?.code >= 400)) {
    return <ErrorHandler error={error} />;
  }

  if (loading)
    return <div className={styles.loading}><LoadingPage/></div>;

  if (error)
    return <div className={styles.error}>Error: {error.message || error}</div>;

  // ────────────────────────────────────────────────
  const totalPages  = Math.ceil(totalRecords / pageSize);
  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord   = Math.min(page * pageSize, totalRecords);
  const hasActiveFilter = isFilterActive;
  

  // ────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <ErrorHandler error={error} />
      <Header title="Medicine Stock Management" />

      {/* ── Context Banner ── */}
      {locationMedicineId && appliedFilters.medicineId && (
        <div className={styles.contextBanner}>
          <div className={styles.contextBannerLeft}>
            <div className={styles.contextIconWrap}>
              <FiPackage size={18} />
            </div>
            <div className={styles.contextBannerText}>
              <span className={styles.contextBannerLabel}>Viewing stock for</span>
              <span className={styles.contextBannerName}>{locationMedicineName}</span>
            </div>
          </div>
          <div className={styles.contextBannerActions}>
            <button
              onClick={handleBackToMasterList}
              className={styles.backBtn}
              disabled={!!btnCooldown["back"]}
            >
              <FiArrowLeft size={14} />
              Back to Master List
            </button>
            <button
              onClick={handleClearFilters}
              className={styles.showAllBtn}
              disabled={!!btnCooldown["clear"]}
            >
              <FiX size={13} />
              Show All Stock
            </button>
          </div>
        </div>
      )}

      {/* ── Filter Bar — hidden when viewing a specific medicine's stock ── */}
      {!appliedFilters.medicineId && (
        <div className={styles.filtersContainer}>
          <div className={styles.filtersRow}>
            <div className={styles.searchGroup}>
              <select
                name="searchType"
                value={filterInputs.searchType}
                onChange={handleFilterChange}
                className={styles.searchTypeSelect}
              >
                <option value="medicineName">Medicine</option>
                <option value="batchNo">Batch No</option>
              </select>
              <input
                type="text"
                name="searchValue"
                placeholder={
                  filterInputs.searchType === "medicineName"
                    ? "Search by medicine name"
                    : "Search by batch no."
                }
                value={filterInputs.searchValue}
                onChange={handleFilterChange}
                onKeyPress={handleKeyPress}
                className={styles.searchValueInput}
              />
            </div>

            <div className={styles.dateWrapper}>
              {!filterInputs.expiryFrom && (
                <span className={styles.datePlaceholder}>From Date</span>
              )}
              <input
                type="date"
                name="expiryFrom"
                value={filterInputs.expiryFrom}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.expiryFrom ? styles.dateEmpty : ""}`}
              />
            </div>

            <div className={styles.dateWrapper}>
              {!filterInputs.expiryTo && (
                <span className={styles.datePlaceholder}>To Date</span>
              )}
              <input
                type="date"
                name="expiryTo"
                value={filterInputs.expiryTo}
                onChange={handleFilterChange}
                className={`${styles.filterInput} ${!filterInputs.expiryTo ? styles.dateEmpty : ""}`}
              />
            </div>

            <div className={styles.filterActions}>
              <button
                onClick={handleSearch}
                className={styles.searchButton}
                disabled={!!btnCooldown["search"]}
              >
                <FiSearch size={15} />
                Search
              </button>
              {isFilterActive && (
                <button
                  onClick={handleClearFilters}
                  className={styles.clearButton}
                  disabled={!!btnCooldown["clear"]}
                >
                  <FiX size={15} />
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={openAddForm}
              className={styles.addBtn}
              disabled={!!btnCooldown["add"]}
            >
              <FiPlus size={17} />
              Add Stock
            </button>
          </div>
        </div>
      )}

      {/* ── Table + Pagination wrapper ── */}
      <div className={styles.tableSection}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Batch No</th>
                <th>Expiry Date</th>
                <th>Qty In</th>
                <th>Qty Out</th>
                <th>Balance</th>
                <th>Purchase Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allStockList.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.noData}>
                    {hasActiveFilter ? "No stock found." : "No stock records yet."}
                  </td>
                </tr>
              ) : (
                allStockList.map((stock) => (
                  <tr key={stock.id}>
                    <td>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {stock.medicineName?.charAt(0).toUpperCase() || "M"}
                        </div>
                        <div>
                          <div className={styles.name}>{stock.medicineName}</div>
                          <div className={styles.subInfo}>{stock.genericName || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>{stock.batchNo || "—"}</td>
                    <td>
                      <div>{formatDate(stock.expiryDate)}</div>
                      {stock.daysToExpiry != null && (
                        <div className={styles.daysToExpiry}>
                          {stock.daysToExpiry >= 0
                            ? `${stock.daysToExpiry} days left`
                            : `Expired ${Math.abs(stock.daysToExpiry)} days ago`}
                        </div>
                      )}
                    </td>
                    <td>{stock.quantityIn ?? 0}</td>
                    <td>{stock.quantityOut ?? 0}</td>
                    <td>
                      <span className={`${styles.balanceBadge} ${stock.balanceQuantity <= 0 ? styles.lowBalance : ""}`}>
                        {stock.balanceQuantity ?? 0}
                      </span>
                    </td>
                    <td>{formatCurrency(stock.purchasePrice)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(stock.stockStatusDesc)}`}>
                        {stock.stockStatusDesc?.toUpperCase() || "NORMAL"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => openDetails(stock)}
                        className={styles.detailsBtn}
                        disabled={!!btnCooldown[`view-${stock.id}`]}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Bar ── */}
        <div className={styles.paginationBar}>
          <div className={styles.paginationInfo}>
            {totalRecords > 0
              ? `Showing ${startRecord}–${endRecord} records`
              : "No records"}
          </div>

          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(1)}
              disabled={page === 1 || !!btnCooldown["page-1"]}
              title="First page"
            >
              «
            </button>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || !!btnCooldown[`page-${page - 1}`]}
              title="Previous page"
            >
              ‹
            </button>

            <span className={styles.pageIndicator}>{page}</span>

            <button
              className={styles.pageBtn}
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || !!btnCooldown[`page-${page + 1}`]}
              title="Next page"
            >
              ›
            </button>
          </div>

          <div className={styles.pageSizeInfo}>
            Page Size: <strong>{pageSize}</strong>
          </div>
        </div>
      </div>

      {/* ──────────────── View Details Modal ──────────────── */}
      {selectedStock && (
        <div className={styles.detailModalOverlay} onClick={closeModal}>
          <div
            className={styles.detailModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailModalHeader}>
              <div className={styles.detailHeaderContent}>
                <div className={styles.avatarLarge}>
                  {selectedStock.medicineName?.charAt(0).toUpperCase() || "M"}
                </div>
                <div>
                  <h2>{selectedStock.medicineName}</h2>
                </div>
              </div>
             <div className={styles.addModalHeaderCard}>
                         <div className={styles.clinicInfoIcon}>
                           <FaClinicMedical size={18} />
                         </div>
                         <div className={styles.clinicInfoText}>
                           <span className={styles.clinicInfoName}>{clinicName}</span>
                           <span className={styles.clinicInfoBranch}>{branchName}</span>
                         </div>
                         </div>
              <button onClick={closeModal} className={styles.detailCloseBtn}>
                ✕
              </button>
            </div>

            <div className={styles.detailModalBody}>
              <div className={styles.infoSection}>
                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Medicine Information</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Clinic</span>
                      <span className={styles.infoValue}>{selectedStock.clinicName || "—"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Branch</span>
                      <span className={styles.infoValue}>{selectedStock.branchName || "—"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Manufacturer</span>
                      <span className={styles.infoValue}>{selectedStock.manufacturer || "—"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>HSN Code</span>
                      <span className={styles.infoValue}>{selectedStock.hsnCode || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Batch & Expiry</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Batch No</span>
                      <span className={styles.infoValue}>{selectedStock.batchNo || "—"}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Expiry Date</span>
                      <span className={styles.infoValue}>{formatDate(selectedStock.expiryDate)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Days to Expiry</span>
                      <span className={styles.infoValue}>
                        {selectedStock.daysToExpiry != null
                          ? selectedStock.daysToExpiry >= 0
                            ? `${selectedStock.daysToExpiry} days`
                            : `Expired ${Math.abs(selectedStock.daysToExpiry)} days ago`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Stock Quantities</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Quantity In</span>
                      <span className={styles.infoValue}>{selectedStock.quantityIn ?? 0}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Quantity Out</span>
                      <span className={styles.infoValue}>{selectedStock.quantityOut ?? 0}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Balance Quantity</span>
                      <span className={`${styles.infoValue} ${styles.infoAmountGreen}`}>
                        {selectedStock.balanceQuantity ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <div className={styles.infoHeader}><h3>Pricing</h3></div>
                  <div className={styles.infoContent}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Purchase Price</span>
                      <span className={`${styles.infoValue} ${styles.infoAmountGreen}`}>
                        {formatCurrency(selectedStock.purchasePrice)}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Average Price</span>
                      <span className={`${styles.infoValue} ${styles.infoAmountTotal}`}>
                        {formatCurrency(selectedStock.averagePrice)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.detailModalFooter}>
                <button
                  onClick={closeModal}
                  className={styles.btnCancel}
                >
                  Close
                </button>
                <button
                  onClick={() => handleUpdateClick(selectedStock)}
                  className={styles.btnUpdate}
                  disabled={!!btnCooldown["update"]}
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── Update Stock Modal ──────────────── */}
      {updatingStock && (
        <UpdateMedicineStock
          stock={updatingStock}
          onClose={handleUpdateClose}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}

      {/* ──────────────── Add Stock Form Modal ──────────────── */}
      {isAddFormOpen && (
        <div className={styles.addModalOverlay} >
          <div
            className={styles.addModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.addModalHeader}>
              <div className={styles.addHeaderContent}>
                <h2>Add New Medicine Stock</h2>
              </div>
              <div className={styles.addModalHeaderCard}>
                          <div className={styles.clinicInfoIcon}>
                            <FaClinicMedical size={18} />
                          </div>
                          <div className={styles.clinicInfoText}>
                            <span className={styles.clinicInfoName}>{clinicName}</span>
                            <span className={styles.clinicInfoBranch}>{branchName}</span>
                          </div>
                          </div>
              <button onClick={closeAddForm} className={styles.detailCloseBtn}>
                <FiX size={18} />
              </button>
            </div>

            <form className={styles.addForm} onSubmit={handleSubmit} noValidate>
              <div className={styles.addModalBody}>
                <div className={styles.formSection}>
                  <div className={styles.formSectionHeader}>
                    <h3>Stock Information</h3>
                  </div>
                  <div className={styles.formGrid}>

                    {/* Medicine dropdown */}
                    <div
                      className={`${styles.formGroup} ${styles.fullWidth}`}
                      ref={medicineDropdownRef}
                    >
                      <label>
                        Medicine Name <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="hidden"
                        name="MedicineID"
                        value={formData.MedicineID}
                      />
                      <div className={styles.medicineDropdownWrapper}>
                        {!showMedicineDropdown && (
                          <div
                            className={`${styles.medicineSelectTrigger} ${!formData.MedicineID ? styles.placeholder : ""}`}
                            onClick={handleMedicineInputFocus}
                          >
                            <span>
                              {selectedMedicineName ||
                                (medicineListLoading
                                  ? "Loading medicines..."
                                  : "Select a medicine...")}
                            </span>
                            <div className={styles.medicineTriggerActions}>
                              {formData.MedicineID && (
                                <button
                                  type="button"
                                  className={styles.medicineClearBtn}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearMedicine();
                                  }}
                                >
                                  <FiX size={14} />
                                </button>
                              )}
                              <FiChevronDown size={16} className={styles.medicineChevron} />
                            </div>
                          </div>
                        )}
                        {showMedicineDropdown && (
                          <input
                            autoFocus
                            type="text"
                            className={styles.medicineSearchInput}
                            placeholder="Type to search medicine..."
                            value={medicineSearch}
                            onChange={(e) => setMedicineSearch(e.target.value)}
                            onBlur={() =>
                              setTimeout(() => setShowMedicineDropdown(false), 150)
                            }
                          />
                        )}
                        {showMedicineDropdown && (
                          <div className={styles.medicineDropdownList}>
                            {medicineListLoading ? (
                              <div className={styles.medicineDropdownLoading}>
                                Loading medicines...
                              </div>
                            ) : filteredMedicineList.length === 0 ? (
                              <div className={styles.medicineDropdownEmpty}>
                                No medicines found
                              </div>
                            ) : (
                              filteredMedicineList.map((med) => (
                                <div
                                  key={med.id}
                                  className={`${styles.medicineDropdownItem} ${formData.MedicineID === med.id ? styles.medicineDropdownItemActive : ""}`}
                                  onMouseDown={() => handleMedicineSelect(med)}
                                >
                                  <div className={styles.medicineDropdownItemName}>
                                    {med.name}
                                  </div>
                                  <div className={styles.medicineDropdownItemMeta}></div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        Batch Number <span className={styles.required}>*</span>
                      </label>
                      <input
                        name="BatchNo"
                        value={formData.BatchNo}
                        onChange={handleInputChange}
                        placeholder="e.g., BATCH001"
                        disabled={formLoading}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        Expiry Date <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="date"
                        name="ExpiryDate"
                        value={formData.ExpiryDate}
                        onChange={handleInputChange}
                        disabled={formLoading}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        Quantity In <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        name="QuantityIn"
                        value={formData.QuantityIn}
                        onChange={handleInputChange}
                        placeholder="0"
                        min="1"
                        disabled={formLoading}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>
                        Purchase Price <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="PurchasePrice"
                        value={formData.PurchasePrice}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0"
                        disabled={formLoading}
                      />
                    </div>

                  </div>
                </div>
              </div>

              <div className={styles.addModalFooter}>
                <button
                  type="button"
                  onClick={closeAddForm}
                  className={styles.btnCancel}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={styles.btnSubmit}
                  title={!allRequiredFilled ? "Please fill all required fields to enable this button" : ""}
                >
                  {formLoading ? "Adding..." : "Add Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MessagePopup (always at root level so z-index is never blocked) ── */}
      <MessagePopup
        visible={popup.visible}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />
    </div>
  );
};

export default MedicineStockList;