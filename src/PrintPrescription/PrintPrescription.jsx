import React, { useEffect, useState } from "react";
import { FiSearch, FiX, FiDownload, FiPrinter } from "react-icons/fi";
import { FaCapsules, FaFlask } from "react-icons/fa";
import styles from "./PrintPrescription.module.css";
import { getPrescriptionList }       from "../Api/ApiPharmacy.js";
import { getLabTestOrderList } from "../Api/ApiLabTests.js";
import { createPrescriptionFile, createLabOrderFile } from "../Api/ApiPdf.js";
import { getStoredClinicId, getStoredBranchId, getStoredFileAccessToken } from "../Utils/Cryptoutils.js";
import Header        from "../Header/Header.jsx";
import LoadingPage   from "../Hooks/LoadingPage.jsx";
import ErrorHandler  from "../Hooks/ErrorHandler.jsx";

const PAGE_SIZE = 20;

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── PDF Viewer Modal ─────────────────────────────────────────────────────────

const PdfViewerModal = ({ pdfUrl, title, onClose, onDownload }) => {
  const handlePrint = () => {
    const iframe = document.getElementById("pdfViewerIframe");
    if (iframe) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div className={styles.pdfModalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.pdfModalContent}>

        {/* Header */}
        <div className={styles.pdfModalHeader}>
          <div className={styles.pdfHeaderLeft}>
            <div className={styles.pdfHeaderIcon}>
              <FiPrinter size={22} />
            </div>
            <div>
              <h2 className={styles.pdfHeaderTitle}>{title}</h2>
              <p className={styles.pdfHeaderSubtitle}>PDF Preview</p>
            </div>
          </div>
          <button className={styles.pdfCloseBtn} onClick={onClose} title="Close">
            <FiX size={20} />
          </button>
        </div>

        {/* Body — iframe */}
        <div className={styles.pdfModalBody}>
          <iframe
            id="pdfViewerIframe"
            src={pdfUrl}
            title={title}
            className={styles.pdfIframe}
          />
        </div>

        {/* Footer */}
        <div className={styles.pdfModalFooter}>
          <button className={styles.pdfBtnPrint} onClick={handlePrint}>
            <FiPrinter size={16} /> Print
          </button>
          <button className={styles.pdfBtnDownload} onClick={onDownload}>
            <FiDownload size={16} /> Download
          </button>
        </div>

      </div>
    </div>
  );
};

// ─── Prescription Tab ─────────────────────────────────────────────────────────

const PrescriptionTab = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(1);
  const [hasNext, setHasNext]   = useState(false);
  const [filterInputs, setFilterInputs]     = useState({ searchType:"patientName", searchValue:"", dateFrom:"", dateTo:"", status:"" });
  const [appliedFilters, setAppliedFilters] = useState({ searchType:"patientName", searchValue:"", dateFrom:"", dateTo:"", status:"" });
  const [btnCooldown, setBtnCooldown]       = useState({});

  const [pdfModal, setPdfModal]       = useState(null);   // { url, blob, label }
  const [printingId, setPrintingId]   = useState(null);
  const [printError, setPrintError]   = useState(null);

  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const hasActiveFilters =
    appliedFilters.searchValue.trim() !== "" ||
    appliedFilters.dateFrom !== "" ||
    appliedFilters.dateTo !== "" ||
    appliedFilters.status !== "";

  const fetchPrescriptions = async (pageNum = 1) => {
    try {
      setLoading(true); setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const params = { BranchID: branchId, Page: pageNum, PageSize: PAGE_SIZE };
      if (appliedFilters.searchValue) {
        if (appliedFilters.searchType === "patientName")   params.PatientName   = appliedFilters.searchValue;
        if (appliedFilters.searchType === "patientMobile") params.PatientMobile = appliedFilters.searchValue;
        if (appliedFilters.searchType === "patientFileNo") params.PatientFileNo = appliedFilters.searchValue;
        if (appliedFilters.searchType === "doctorName")    params.DoctorName    = appliedFilters.searchValue;
      }
      if (appliedFilters.dateFrom) params.DateFrom = appliedFilters.dateFrom;
      if (appliedFilters.dateTo)   params.DateTo   = appliedFilters.dateTo;
      if (appliedFilters.status)   params.Status   = Number(appliedFilters.status);
      const list = await getPrescriptionList(clinicId, params);
      setPrescriptions(list);
      setHasNext(list.length === PAGE_SIZE);
    } catch (err) {
      setError(err?.status >= 400 || err?.code >= 400 ? err : { message: err.message || "Failed to load prescriptions" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrescriptions(1); setPage(1); }, [appliedFilters]);

  const filteredPrescriptions = React.useMemo(() => {
    if (!appliedFilters.searchValue) return prescriptions;
    const term = appliedFilters.searchValue.toLowerCase();
    return prescriptions.filter((p) => {
      switch (appliedFilters.searchType) {
        case "patientName":   return p.patientName?.toLowerCase().includes(term);
        case "patientMobile": return p.patientMobile?.toLowerCase().includes(term);
        case "patientFileNo": return p.patientFileNo?.toLowerCase().includes(term);
        case "doctorName":    return p.doctorFullName?.toLowerCase().includes(term);
        default:              return true;
      }
    });
  }, [prescriptions, appliedFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };
  const handleSearch = () => { triggerCooldown("search"); setAppliedFilters({ ...filterInputs }); setPage(1); };
  const handleClear  = () => {
    triggerCooldown("clear");
    const empty = { searchType:"patientName", searchValue:"", dateFrom:"", dateTo:"", status:"" };
    setFilterInputs(empty); setAppliedFilters(empty); setPage(1);
  };
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
    fetchPrescriptions(newPage);
  };

  const handlePrintPrescription = async (prescriptionId) => {
    try {
      setPrintingId(prescriptionId);
      setPrintError(null);
      const clinicId        = await getStoredClinicId();
      const branchId        = await getStoredBranchId();
      const fileAccessToken = await getStoredFileAccessToken();
      const result = await createPrescriptionFile(branchId, prescriptionId, clinicId, fileAccessToken);
      setPdfModal({
        url:   result.url,
        blob:  result.blob,
        label: `Prescription #${prescriptionId}`
      });
    } catch (err) {
      setPrintError(err.message || "Failed to generate prescription PDF");
    } finally {
      setPrintingId(null);
    }
  };

  const handleDownloadPrescription = () => {
    if (!pdfModal) return;
    const a = document.createElement("a");
    a.href = pdfModal.url;
    a.download = `${pdfModal.label}.pdf`;
    a.click();
  };

  const handleClosePdfModal = () => {
    if (pdfModal?.url) URL.revokeObjectURL(pdfModal.url);
    setPdfModal(null);
  };

  const getStatusClass = (status) => {
    if (status === 1) return styles.statusActive;
    if (status === 2) return styles.statusExpired;
    if (status === 3) return styles.statusCancelled;
    return styles.statusActive;
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.prescLoading}><LoadingPage /></div>;
  if (error)   return <div className={styles.prescError}>Error: {error.message || error}</div>;

  const startRecord = prescriptions.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord   = startRecord + prescriptions.length - 1;

  return (
    <>
      <ErrorHandler error={error} />

      {pdfModal && (
        <PdfViewerModal
          pdfUrl={pdfModal.url}
          title="Prescription"
          onClose={handleClosePdfModal}
          onDownload={handleDownloadPrescription}
        />
      )}

      {printError && (
        <div className={styles.prescError} style={{ minHeight: "auto", padding: "10px 20px", marginBottom: "8px", fontSize: "0.85rem" }}>
          {printError}
          <button onClick={() => setPrintError(null)} style={{ marginLeft: 12, cursor: "pointer", background: "none", border: "none", color: "#ef4444", fontWeight: 700 }}>✕</button>
        </div>
      )}

      <div className={styles.filtersContainer}>
        <div className={styles.filtersGrid}>
          <div className={styles.searchGroup}>
            <select name="searchType" value={filterInputs.searchType} onChange={handleFilterChange} className={styles.searchTypeSelect}>
              <option value="patientName">Name</option>
              <option value="patientMobile">Mobile</option>
              <option value="patientFileNo">File Code</option>
              <option value="doctorName">Doctor Name</option>
            </select>
            <input
              type="text" name="searchValue"
              placeholder={`Search by ${filterInputs.searchType === "patientName" ? "Name" : filterInputs.searchType === "patientMobile" ? "Mobile" : filterInputs.searchType === "patientFileNo" ? "File Code" : "Doctor Name"}`}
              value={filterInputs.searchValue} onChange={handleFilterChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()} className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <select name="status" value={filterInputs.status} onChange={handleFilterChange} className={styles.filterInput}>
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="2">Expired</option>
              <option value="3">Cancelled</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateFrom && <span className={styles.datePlaceholder}>From Date</span>}
              <input type="date" name="dateFrom" value={filterInputs.dateFrom} onChange={handleFilterChange} className={`${styles.filterInput} ${!filterInputs.dateFrom ? styles.dateEmpty : ""}`} />
            </div>
          </div>
          <div className={styles.filterGroup}>
            <div className={styles.dateWrapper}>
              {!filterInputs.dateTo && <span className={styles.datePlaceholder}>To Date</span>}
              <input type="date" name="dateTo" value={filterInputs.dateTo} onChange={handleFilterChange} className={`${styles.filterInput} ${!filterInputs.dateTo ? styles.dateEmpty : ""}`} />
            </div>
          </div>
          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton} disabled={!!btnCooldown["search"]}><FiSearch size={18} /> Search</button>
            {hasActiveFilters && <button onClick={handleClear} className={styles.clearButton} disabled={!!btnCooldown["clear"]}><FiX size={18} /> Clear</button>}
          </div>
        </div>
      </div>

      <div className={styles.tableSection}>
        <div className={styles.clinicTableContainer}>
          <table className={styles.clinicTable}>
            <thead>
              <tr>
                <th>File Code</th><th>Patient</th><th>Doctor</th>
                <th>Date Issued</th><th>Notes</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrescriptions.length === 0 ? (
                <tr><td colSpan={7} className={styles.clinicNoData}>{hasActiveFilters ? "No prescriptions match your search." : "No prescriptions available yet."}</td></tr>
              ) : (
                filteredPrescriptions.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.clinicNameCell}>
                        <div className={styles.clinicAvatar}>{p.patientFileNo ? String(p.patientFileNo).charAt(0).toUpperCase() : p.patientName?.[0]?.toUpperCase() || "P"}</div>
                        <div className={styles.clinicName}>{p.patientFileNo || "—"}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.clinicName}>{p.patientName || "—"}</div>
                      <div className={styles.clinicType}>{p.patientMobile || "—"}</div>
                    </td>
                    <td>{p.doctorFullName ? `Dr. ${p.doctorFullName}` : "—"}</td>
                    <td>{formatDate(p.dateIssued)}</td>
                    <td>{p.notes || "—"}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusClass(p.status)}`}>
                        {p.statusDesc?.toUpperCase() || "UNKNOWN"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionBtns}>
                        <button
                          className={styles.clinicPrintBtn}
                          onClick={() => handlePrintPrescription(p.id)}
                          disabled={printingId === p.id}
                          title="Print Prescription"
                        >
                          {printingId === p.id ? (
                            <span className={styles.btnSpinner} />
                          ) : (
                            <><FiPrinter size={13} /> Print</>
                          )}
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
          <div className={styles.paginationInfo}>{prescriptions.length > 0 ? `Showing ${startRecord}–${endRecord} records` : "No records"}</div>
          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(1)} disabled={page === 1 || !!btnCooldown["page-1"]} title="First page">«</button>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page - 1)} disabled={page === 1 || !!btnCooldown[`page-${page - 1}`]} title="Previous page">‹</button>
            <span className={styles.pageIndicator}>{page}</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page + 1)} disabled={!hasNext || !!btnCooldown[`page-${page + 1}`]} title="Next page">›</button>
          </div>
          <div className={styles.pageSizeInfo}>Page Size: <strong>{PAGE_SIZE}</strong></div>
        </div>
      </div>
    </>
  );
};

// ─── Lab Test Order Tab ───────────────────────────────────────────────────────

const LAB_PRIORITY_LABELS = { 1:"Normal", 2:"Urgent", 3:"STAT" };
const LAB_STATUS_LABELS   = { 1:"Pending", 2:"Completed", 3:"Cancelled", 4:"Invoice Processed", 5:"Work in Progress", 6:"External" };

const LabTestOrderTab = () => {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [page, setPage]         = useState(1);
  const [hasNext, setHasNext]   = useState(false);
  const [filterInputs, setFilterInputs]     = useState({ searchType:"patientName", searchValue:"" });
  const [appliedFilters, setAppliedFilters] = useState({ searchType:"patientName", searchValue:"" });
  const [btnCooldown, setBtnCooldown]       = useState({});

  const [pdfModal, setPdfModal]     = useState(null);   // { url, blob, label }
  const [printingId, setPrintingId] = useState(null);
  const [printError, setPrintError] = useState(null);

  const triggerCooldown = (key) => {
    setBtnCooldown((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setBtnCooldown((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const hasActiveFilters = appliedFilters.searchValue.trim() !== "";

  const fetchOrders = async (pageNum = 1) => {
    try {
      setLoading(true); setError(null);
      const clinicId = await getStoredClinicId();
      const branchId = await getStoredBranchId();
      const params = { BranchID: branchId, Page: pageNum, PageSize: PAGE_SIZE };
      if (appliedFilters.searchValue) {
        if (appliedFilters.searchType === "patientName")   params.PatientName = appliedFilters.searchValue;
        if (appliedFilters.searchType === "patientMobile") params.PatientName = appliedFilters.searchValue;
        if (appliedFilters.searchType === "doctorName")    params.DoctorName  = appliedFilters.searchValue;
      }
      const list = await getLabTestOrderList(clinicId, params);
      setOrders(list);
      setHasNext(list.length === PAGE_SIZE);
    } catch (err) {
      setError(err?.status >= 400 || err?.code >= 400 ? err : { message: err.message || "Failed to load lab orders" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(1); setPage(1); }, [appliedFilters]);

  const filteredOrders = React.useMemo(() => {
    if (!appliedFilters.searchValue) return orders;
    const term = appliedFilters.searchValue.toLowerCase();
    return orders.filter((o) => {
      switch (appliedFilters.searchType) {
        case "patientName":   return o.patientName?.toLowerCase().includes(term);
        case "patientMobile": return o.patientMobile?.toLowerCase().includes(term);
        case "patientFileNo": return o.patientFileNo?.toLowerCase().includes(term);
        case "doctorName":    return o.doctorFullName?.toLowerCase().includes(term);
        default:              return true;
      }
    });
  }, [orders, appliedFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterInputs((prev) => ({ ...prev, [name]: value }));
  };
  const handleSearch = () => { triggerCooldown("search"); setAppliedFilters({ ...filterInputs }); setPage(1); };
  const handleClear  = () => {
    triggerCooldown("clear");
    const empty = { searchType:"patientName", searchValue:"" };
    setFilterInputs(empty); setAppliedFilters(empty); setPage(1);
  };
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    triggerCooldown(`page-${newPage}`);
    setPage(newPage);
    fetchOrders(newPage);
  };

  const handlePrintLabOrder = async (labOrderId) => {
    try {
      setPrintingId(labOrderId);
      setPrintError(null);
      const clinicId        = await getStoredClinicId();
      const branchId        = await getStoredBranchId();
      const fileAccessToken = await getStoredFileAccessToken();
      const result = await createLabOrderFile(branchId, labOrderId, clinicId, fileAccessToken);
      setPdfModal({
        url:   result.url,
        blob:  result.blob,
        label: `Lab Order #${labOrderId}`
      });
    } catch (err) {
      setPrintError(err.message || "Failed to generate lab order PDF");
    } finally {
      setPrintingId(null);
    }
  };

  const handleDownloadLabOrder = () => {
    if (!pdfModal) return;
    const a = document.createElement("a");
    a.href = pdfModal.url;
    a.download = `${pdfModal.label}.pdf`;
    a.click();
  };

  const handleClosePdfModal = () => {
    if (pdfModal?.url) URL.revokeObjectURL(pdfModal.url);
    setPdfModal(null);
  };

  const getLabStatusClass = (status) => {
    if (status === 1) return styles.labStatusPending;
    if (status === 2) return styles.labStatusCompleted;
    if (status === 3) return styles.labStatusCancelled;
    if (status === 4) return styles.labStatusInvoice;
    if (status === 5) return styles.labStatusProgress;
    return styles.labStatusPending;
  };
  const getPriorityClass = (priority) => {
    if (priority === 2) return styles.labPriorityUrgent;
    if (priority === 3) return styles.labPriorityStat;
    return styles.labPriorityNormal;
  };

  if (error && (error?.status >= 400 || error?.code >= 400)) return <ErrorHandler error={error} />;
  if (loading) return <div className={styles.prescLoading}><LoadingPage /></div>;
  if (error)   return <div className={styles.prescError}>Error: {error.message || error}</div>;

  const startRecord = orders.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRecord   = startRecord + orders.length - 1;

  return (
    <>
      <ErrorHandler error={error} />

      {pdfModal && (
        <PdfViewerModal
          pdfUrl={pdfModal.url}
          title="Lab Order"
          onClose={handleClosePdfModal}
          onDownload={handleDownloadLabOrder}
        />
      )}

      {printError && (
        <div className={styles.prescError} style={{ minHeight: "auto", padding: "10px 20px", marginBottom: "8px", fontSize: "0.85rem" }}>
          {printError}
          <button onClick={() => setPrintError(null)} style={{ marginLeft: 12, cursor: "pointer", background: "none", border: "none", color: "#ef4444", fontWeight: 700 }}>✕</button>
        </div>
      )}

      <div className={styles.filtersContainer}>
        <div className={styles.filtersGridLab}>
          <div className={styles.searchGroup}>
            <select name="searchType" value={filterInputs.searchType} onChange={handleFilterChange} className={styles.searchTypeSelect}>
              <option value="patientName">Name</option>
              <option value="patientMobile">Mobile</option>
              <option value="patientFileNo">File Code</option>
              <option value="doctorName">Doctor Name</option>
            </select>
            <input
              type="text" name="searchValue"
              placeholder={`Search by ${filterInputs.searchType === "patientName" ? "Name" : filterInputs.searchType === "patientMobile" ? "Mobile" : filterInputs.searchType === "patientFileNo" ? "File Code" : "Doctor Name"}`}
              value={filterInputs.searchValue} onChange={handleFilterChange}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()} className={styles.searchInput}
            />
          </div>
          <div className={styles.filterActions}>
            <button onClick={handleSearch} className={styles.searchButton} disabled={!!btnCooldown["search"]}><FiSearch size={18} /> Search</button>
            {hasActiveFilters && <button onClick={handleClear} className={styles.clearButton} disabled={!!btnCooldown["clear"]}><FiX size={18} /> Clear</button>}
          </div>
        </div>
      </div>

      <div className={styles.tableSection}>
        <div className={styles.clinicTableContainer}>
          <table className={styles.clinicTable}>
            <thead>
              <tr>
                <th>Patient</th><th>Doctor</th>
                <th>Date</th><th>Priority</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan={6} className={styles.clinicNoData}>{hasActiveFilters ? "No lab orders match your search." : "No lab orders available yet."}</td></tr>
              ) : (
                filteredOrders.map((o, index) => {
                  const uniqueKey = o.id ? `order-${o.id}` : o.uniqueSeq ? `seq-${o.uniqueSeq}` : `idx-${index}`;
                  return (
                    <tr key={uniqueKey}>
                      <td>
                        <div className={styles.clinicNameCell}>
                          <div className={styles.clinicAvatarLab}><FaFlask size={14} /></div>
                          <div>
                            <div className={styles.clinicName}>{o.patientName || "—"}</div>
                            <div className={styles.clinicType}>{o.patientMobile || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td>{o.doctorFullName ? `Dr. ${o.doctorFullName}` : "—"}</td>
                      <td>{formatDate(o.dateCreated)}</td>
                      <td>
                        <span className={`${styles.labPriorityBadge} ${getPriorityClass(o.priority)}`}>
                          {LAB_PRIORITY_LABELS[o.priority] || "Normal"}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${getLabStatusClass(o.status)}`}>
                          {(LAB_STATUS_LABELS[o.status] || o.statusDesc || "Unknown").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            className={styles.clinicPrintBtn}
                            onClick={() => handlePrintLabOrder(o.id)}
                            disabled={printingId === o.id}
                            title="Print Lab Order"
                          >
                            {printingId === o.id ? (
                              <span className={styles.btnSpinner} />
                            ) : (
                              <><FiPrinter size={13} /> Print</>
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
          <div className={styles.paginationInfo}>{orders.length > 0 ? `Showing ${startRecord}–${endRecord} records` : "No records"}</div>
          <div className={styles.paginationControls}>
            <span className={styles.paginationLabel}>Page</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(1)} disabled={page === 1 || !!btnCooldown["page-1"]} title="First page">«</button>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page - 1)} disabled={page === 1 || !!btnCooldown[`page-${page - 1}`]} title="Previous page">‹</button>
            <span className={styles.pageIndicator}>{page}</span>
            <button className={styles.pageBtn} onClick={() => handlePageChange(page + 1)} disabled={!hasNext || !!btnCooldown[`page-${page + 1}`]} title="Next page">›</button>
          </div>
          <div className={styles.pageSizeInfo}>Page Size: <strong>{PAGE_SIZE}</strong></div>
        </div>
      </div>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PrintPrescription = () => {
  const [activeTab, setActiveTab] = useState("prescription");

  return (
    <div className={styles.clinicListWrapper}>
      <Header title="Prescription Management" />
      <div className={styles.tabSwitcher}>
        <button className={`${styles.tabBtn} ${activeTab === "prescription" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("prescription")}>
          <FaCapsules size={20} /> Prescription
        </button>
        <button className={`${styles.tabBtn} ${activeTab === "laborder" ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab("laborder")}>
          <FaFlask size={15} /> Lab Test Order
        </button>
      </div>
      {activeTab === "prescription" ? <PrescriptionTab /> : <LabTestOrderTab />}
    </div>
  );
};

export default PrintPrescription;