import axios from "axios";
import {getSessionRef, generateRefKey, getUserId, getClinicId, getBranchId} from "./Api.js"
const CHANNEL_ID = 1;
const PRODUCTION_MODE = 0;
const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getVendorList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Determine final IDs based on environment
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    VendorID: options.VendorID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Name: options.Name || "",
    ContactPerson: options.ContactPerson || "",
    Mobile: options.Mobile || "",
    GSTNo: options.GSTNo || "",
    Status: options.Status ?? -1
  };

  console.log("get Vendor List payload:", payload);

  try {
    const response = await API.post("/GetVendorList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetVendorList response:", results);

    return results.map((vendor) => ({
      id: vendor.vendor_id,
      uniqueSeq: vendor.unique_seq,
      clinicId: vendor.clinic_id,
      clinicName: vendor.clinic_name,
      branchId: vendor.branch_id,
      branchName: vendor.branch_name,
      name: vendor.name || "",
      contactPerson: vendor.contact_person || "",
      mobile: vendor.mobile || null,
      altMobile: vendor.alt_mobile || null,
      email: vendor.email || null,
      address: vendor.address || null,
      gstNo: vendor.gst_no || null,
      licenseDetail: vendor.license_detail || null,
      status: vendor.status,
      statusDesc: vendor.status_desc || "Unknown",
      dateCreated: vendor.date_created || null,
      dateModified: vendor.date_modified || null
    }));
  } catch (error) {
    console.error("getVendorList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch vendors"
    };

    throw err;
  }
};

export const addVendor = async (vendorData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation
  if (!vendorData?.name) {
    const validationError = new Error("Vendor Name is required");
    validationError.status = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (vendorData.clinicId < 0 || (vendorData.clinicId !== 0 && isNaN(vendorData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (vendorData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (vendorData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Name: vendorData.name || "",
    ContactPerson: vendorData.contactPerson || "",
    Mobile: vendorData.mobile || "",
    AltMobile: vendorData.altMobile || "",
    Email: vendorData.email || "",
    Address: vendorData.address || "",
    GSTNo: vendorData.gstNo || "",
    LicenseDetail: vendorData.licenseDetail || "",
  };

  console.log("Add Vendor Payload:", payload);

  try {
    const response = await API.post("/AddVendor", payload);

    console.log("AddVendor response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add vendor");
    }

    // Return success with new vendor ID
    return {
      success: true,
      vendorId: result.OUT_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addVendor failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add vendor"
    };

    throw errorWithStatus;
  }
};

export const updateVendor = async (vendorData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // VendorID is mandatory for update
  if (!vendorData?.vendorId && vendorData?.vendorId !== 0) {
    const validationError = new Error("VendorID is required to update a vendor.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is typically required
  if (!vendorData?.clinicId && vendorData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update a vendor.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (vendorData.clinicId < 0 || (vendorData.clinicId !== 0 && isNaN(vendorData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (vendorData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (vendorData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    VendorID: vendorData.vendorId || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Name: vendorData.name?.trim() || "",
    ContactPerson: vendorData.contactPerson?.trim() || "",
    Mobile: vendorData.mobile?.trim() || "",
    AltMobile: vendorData.altMobile?.trim() || "",
    Email: vendorData.email?.trim() || "",
    Address: vendorData.address?.trim() || "",
    GSTNo: vendorData.gstNo?.trim() || "",
    LicenseDetail: vendorData.licenseDetail?.trim() || "",
    Status: vendorData.status ?? 1   
  };

  console.log("updateVendor payload:", payload);

  try {
    const response = await API.post("/UpdateVendor", payload);
    console.log("UpdateVendor response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update vendor");
    }

    return {
      success: true,
      vendorId: result.IN_VENDOR_ID || vendorData.vendorId,
      message: "Vendor updated successfully"
    };

  } catch (error) {
    console.error("updateVendor error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update vendor";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteVendor = async (vendorId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // VendorID is mandatory for delete
  if (!vendorId && vendorId !== 0) {
    const validationError = new Error("VendorID is required to delete a vendor.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    VendorID: vendorId
  };

  console.log("deleteVendor payload:", payload);

  try {
    const response = await API.post("/DeleteVendor", payload);
    console.log("DeleteVendor response:", response.data);

    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete vendor");
    }

    return {
      success: true,
      vendorId: result.IN_VENDOR_ID || vendorId,
      message: "Vendor deleted successfully"
    };

  } catch (error) {
    console.error("deleteVendor error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete vendor";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getMedicineMasterList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Determine final IDs based on environment (same logic as getEmployeeList)
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    MedicineID: options.MedicineID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Name: options.Name || "",
    Manufacturer: options.Manufacturer || "",
    Type: options.Type ?? 0,
    Unit: options.Unit ?? 0,
    HSNCode: options.HSNCode || "",
    Barcode: options.Barcode || "",
    LowStockOnly: options.LowStockOnly ?? 0,
    Status: options.Status ?? -1
  };

  console.log("get MedicineMasterList payload:", payload);

  try {
    const response = await API.post("/GetMedicineMasterList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetMedicineMasterList response:", results);

    return results.map((med) => ({
      id: med.medicine_id,
      uniqueSeq: med.unique_seq,
      clinicId: med.clinic_id,
      clinicName: med.clinic_name,
      branchId: med.branch_id,
      branchName: med.branch_name,
      name: med.name || "",
      genericName: med.generic_name || "",
      composition: med.composition || "",
      manufacturer: med.manufacturer || "",
      type: med.type,
      typeDesc: med.type_desc || "Unknown",
      dosageForm: med.dosage_form || null,
      unit: med.unit,
      defaultRoute: med.default_route,
      unitDesc: med.unit_desc || "Unknown",
      hsnCode: med.hsn_code || "",
      reorderLevelQty: med.reorder_level_qty ?? 0,
      mrp: med.mrp || "0.00",
      purchasePrice: med.purchase_price || "0.00",
      sellPrice: med.sell_price || "0.00",
      stockQuantity: med.stock_quantity ?? 0,
      cgstPercentage: med.cgst_percentage || "0.00",
      sgstPercentage: med.sgst_percentage || "0.00",
      barcode: med.barcode || null,
      doseCount: med.dose_count ?? 0,
      timing: med.timing || "",
      status: med.status,
      statusDesc: med.status_desc || "Unknown",
      isLowStock: med.is_low_stock === "Yes",   // boolean-ified
      dateCreated: med.date_created || null,
      dateModified: med.date_modified || null,
    }));
  } catch (error) {
    console.error("getMedicineMasterList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch medicine master list"
    };

    throw err;
  }
};

export const addMedicineMaster = async (medicineData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust as per your backend rules)
  if (!medicineData?.name) {
    const validationError = new Error("Medicine name is required");
    validationError.status = 400;
    throw validationError;
  }

  // In dev mode → stricter ClinicID validation (same as addEmployee)
  if (PRODUCTION_MODE !== true) {
    if (medicineData.clinicId < 0 || (medicineData.clinicId !== 0 && isNaN(medicineData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (medicineData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (medicineData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Name: medicineData.name || "",
    GenericName: medicineData.genericName || "",
    Composition: medicineData.composition || "",
    Manufacturer: medicineData.manufacturer || "",
    Type: medicineData.type ?? 0,
    DosageForm: medicineData.dosageForm || "",
    DefaultRoute: medicineData.defaultRoute ?? 1,
    Unit: medicineData.unit ?? 0,
    HSNCode: medicineData.hsnCode || "",
    ReorderLevelQty: medicineData.reorderLevelQty ?? 0,
    MRP: medicineData.mrp ?? 0,
    PurchasePrice: medicineData.purchasePrice ?? 0,
    SellPrice: medicineData.sellPrice ?? 0,
    StockQuantity: medicineData.stockQuantity ?? 0,
    CGSTPercentage: medicineData.cgstPercentage ?? 0,
    SGSTPercentage: medicineData.sgstPercentage ?? 0,
    Barcode: medicineData.barcode || "",
    DoseCount: medicineData.doseCount ?? 0,
    Timing: medicineData.timing || "",
  };

  console.log("Add MedicineMaster payload:", payload);

  try {
    const response = await API.post("/AddMedicineMaster", payload);

    console.log("AddMedicineMaster response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add medicine");
    }

    // Return success with new medicine ID
    return {
      success: true,
      medicineId: result.OUT_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addMedicineMaster failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add medicine"
    };

    throw errorWithStatus;
  }
};

export const updateMedicineMaster = async (medicineData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // MedicineID is mandatory for update
  if (!medicineData?.medicineId && medicineData?.medicineId !== 0) {
    const validationError = new Error("MedicineID is required to update a medicine.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is typically required
  if (!medicineData?.clinicId && medicineData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update medicine master.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (medicineData.clinicId < 0 || (medicineData.clinicId !== 0 && isNaN(medicineData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (medicineData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (medicineData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    MedicineID: medicineData.medicineId || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Name: medicineData.name?.trim() || "",
    GenericName: medicineData.genericName?.trim() || "",
    Composition: medicineData.composition?.trim() || "",
    Manufacturer: medicineData.manufacturer?.trim() || "",
    Type: medicineData.type ?? 0,
    DosageForm: medicineData.dosageForm?.trim() || "",
    DefaultRoute: medicineData.defaultRoute ?? 1,
    Unit: medicineData.unit ?? 0,
    HSNCode: medicineData.hsnCode?.trim() || "",
    ReorderLevelQty: medicineData.reorderLevelQty ?? 0,
    MRP: medicineData.mrp ?? 0,
    PurchasePrice: medicineData.purchasePrice ?? 0,
    SellPrice: medicineData.sellPrice ?? 0,
    StockQuantity: medicineData.stockQuantity ?? 0,
    CGSTPercentage: medicineData.cgstPercentage ?? 0,
    SGSTPercentage: medicineData.sgstPercentage ?? 0,
    Barcode: medicineData.barcode?.trim() || "",
    Status: medicineData.status ?? 1,     // usually 1 = active
    DoseCount: medicineData.doseCount ?? 0,
    Timing: medicineData.timing || "",
  };

  console.log("updateMedicineMaster payload:", payload);

  try {
    const response = await API.post("/UpdateMedicineMaster", payload);
    console.log("UpdateMedicineMaster response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update medicine master");
    }

    return {
      success: true,
      medicineId: result.IN_MEDICINE_ID || medicineData.medicineId,
      message: "Medicine master updated successfully"
    };

  } catch (error) {
    console.error("updateMedicineMaster error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update medicine master";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteMedicineMaster = async (medicineId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // MedicineID is mandatory for delete
  if (!medicineId && medicineId !== 0) {
    const validationError = new Error("MedicineID is required to delete a medicine master entry.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    MedicineID: medicineId
  };

  console.log("deleteMedicineMaster payload:", payload);

  try {
    const response = await API.post("/DeleteMedicineMaster", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete medicine master entry");
    }

    return {
      success: true,
      medicineId: result.IN_MEDICINE_ID || medicineId,
      message: "Medicine master entry deleted successfully"
    };

  } catch (error) {
    console.error("deleteMedicineMaster error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete medicine master entry";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getPurchaseOrderList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Determine final IDs based on environment
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    POID: options.POID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PONumber: options.PONumber || "",
    VendorID: options.VendorID || 0,
    VendorName: options.VendorName || "",
    FromDate: options.FromDate || "",         // expected: "YYYY-MM-DD"
    ToDate: options.ToDate || "",             // expected: "YYYY-MM-DD"
    Status: options.Status ?? -1
  };

  console.log("get PurchaseOrderList payload:", payload);

  try {
    const response = await API.post("/GetPurchaseOrderList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetPurchaseOrderList response:", results);

    return results.map((po) => ({
      id: po.po_id,
      uniqueSeq: po.unique_seq,
      clinicId: po.clinic_id,
      clinicName: po.clinic_name,
      branchId: po.branch_id,
      branchName: po.branch_name,
      poNumber: po.po_number,
      poDate: po.po_date || null,               // ISO string
      vendorId: po.vendor_id,
      vendorName: po.vendor_name,
      contactPerson: po.contact_person || null,
      vendorMobile: po.vendor_mobile || null,
      totalAmount: po.total_amount != null ? String(po.total_amount) : null,
      cgstAmount: po.cgst_amount != null ? String(po.cgst_amount) : null,
      sgstAmount: po.sgst_amount != null ? String(po.sgst_amount) : null,
      discount: po.discount != null ? String(po.discount) : null,
      netAmount: po.net_amount != null ? String(po.net_amount) : null,
      status: po.status,   // adjust logic if more states exist
      statusDesc: po.status_desc || "Unknown",
      dateCreated: po.date_created || null,
      dateModified: po.date_modified || null
    }));
  } catch (error) {
    console.error("getPurchaseOrderList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch purchase orders"
    };

    throw err;
  }
};

export const addPurchaseOrder = async (purchaseOrderData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation
  if (!purchaseOrderData?.PODate || !purchaseOrderData?.VendorID) {
    const validationError = new Error("Purchase Order Date and Vendor are required");
    validationError.status = 400;
    throw validationError;
  }

  // In dev mode, extra checks for ClinicID / BranchID
  if (PRODUCTION_MODE !== true) {
    if (purchaseOrderData.clinicId < 0 || (purchaseOrderData.clinicId !== 0 && isNaN(purchaseOrderData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
    if (purchaseOrderData.branchId < 0 || (purchaseOrderData.branchId !== 0 && isNaN(purchaseOrderData.branchId))) {
      const error = new Error("Invalid Branch ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (purchaseOrderData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (purchaseOrderData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PODate: purchaseOrderData.PODate || "",                    // e.g. "YYYY-MM-DD"
    VendorID: purchaseOrderData.VendorID ?? 0,
    Discount: purchaseOrderData.Discount ?? 0,
  };

  console.log("Add Purchase Order", payload);

  try {
    const response = await API.post("/AddPurchaseOrder", payload);

    console.log("AddPurchaseOrder response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to create purchase order");
    }

    // Return success with new PO ID
    return {
      success: true,
      poId: result.OUT_PO_ID,
      message: result.OUT_ERROR || "OK",
    };

  } catch (error) {
    console.error("addPurchaseOrder failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to create purchase order",
    };

    throw errorWithStatus;
  }
};

export const deletePurchaseOrder = async (poId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // POID is mandatory for delete
  if (!poId && poId !== 0) {
    const validationError = new Error("POID is required to delete a purchase order.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    POID: poId
  };

  console.log("deletePurchaseOrder payload:", payload);

  try {
    const response = await API.post("/DeletePurchaseOrder", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete purchase order");
    }

    return {
      success: true,
      poId: result.IN_PO_ID || poId,
      message: "Purchase order deleted successfully"
    };

  } catch (error) {
    console.error("deletePurchaseOrder error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete purchase order";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getPurchaseOrderDetailList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Determine final IDs based on environment
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    PODetailID: options.PODetailID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    POID: options.POID || 0,
    PONumber: options.PONumber || "",
    VendorID: options.VendorID || 0,
    MedicineID: options.MedicineID || 0,
    MedicineName: options.MedicineName || "",
    Status: options.Status ?? -1
  };

  console.log("get PurchaseOrderDetailList payload:", payload);

  try {
    const response = await API.post("/GetPurchaseOrderDetailList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetPurchaseOrderDetailList response:", results);

    return results.map((detail) => ({
      id: detail.po_detail_id,
      uniqueSeq: detail.unique_seq,
      clinicId: detail.clinic_id,
      clinicName: detail.clinic_name,
      branchId: detail.branch_id,
      branchName: detail.branch_name,
      poId: detail.po_id,
      poNumber: detail.po_number,
      poDate: detail.po_date || null,
      vendorId: detail.vendor_id,
      vendorName: detail.vendor_name,
      vendorMobile: detail.vendor_mobile || null,
      medicineId: detail.medicine_id,
      medicineName: detail.medicine_name,
      genericName: detail.generic_name || null,
      manufacturer: detail.manufacturer || null,
      hsnCode: detail.hsn_code || null,
      quantity: detail.quantity ?? 0,
      unitPrice: detail.unit_price != null ? String(detail.unit_price) : null,
      amount: detail.amount != null ? String(detail.amount) : null,
      cgstAmount: detail.cgst_amount != null ? String(detail.cgst_amount) : null,
      sgstAmount: detail.sgst_amount != null ? String(detail.sgst_amount) : null,
      totalLineAmount: detail.total_line_amount != null ? String(detail.total_line_amount) : null,
      status: detail.status,   // adjust if more states exist
      statusDesc: detail.status_desc || "Unknown",
      dateCreated: detail.date_created || null,
      dateModified: detail.date_modified || null
    }));
  } catch (error) {
    console.error("getPurchaseOrderDetailList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch purchase order details"
    };

    throw err;
  }
};

export const addPurchaseOrderDetail = async (detailData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust as per your backend rules)
  if (!detailData?.POID || detailData.POID <= 0) {
    const validationError = new Error("POID is required and must be valid");
    validationError.status = 400;
    throw validationError;
  }

  if (!detailData?.MedicineID || detailData.MedicineID <= 0) {
    const validationError = new Error("MedicineID is required and must be valid");
    validationError.status = 400;
    throw validationError;
  }

  if (!detailData?.Quantity || detailData.Quantity <= 0) {
    const validationError = new Error("Quantity must be a positive number");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: stricter clinic validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (detailData.clinicId < 0 || (detailData.clinicId !== 0 && isNaN(detailData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (detailData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (detailData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    POID: parseInt(detailData.POID),
    MedicineID: parseInt(detailData.MedicineID),
    Quantity: Number(detailData.Quantity),          // supports integer or decimal
    UnitPrice: Number(detailData.UnitPrice ?? 0)    // supports decimal prices
  };

  console.log("Add PurchaseOrderDetail payload:", payload);

  try {
    const response = await API.post("/AddPurchaseOrderDetail", payload);

    console.log("AddPurchaseOrderDetail response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add purchase order detail");
    }

    // Return success with new detail ID
    return {
      success: true,
      poDetailId: result.OUT_PO_DETAIL_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addPurchaseOrderDetail failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add purchase order detail"
    };

    throw errorWithStatus;
  }
};

export const updatePurchaseOrderDetail = async (detailData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // PODetailID is mandatory for update
  if (!detailData?.PODetailID && detailData?.PODetailID !== 0) {
    const validationError = new Error("PODetailID is required to update a purchase order detail.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is typically required (consistent with updateEmployee)
  if (!detailData?.clinicId && detailData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update a purchase order detail.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (detailData.clinicId < 0 || (detailData.clinicId !== 0 && isNaN(detailData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (detailData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (detailData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PODetailID: parseInt(detailData.PODetailID),
    Quantity: Number(detailData.Quantity ?? 0),
    UnitPrice: Number(detailData.UnitPrice ?? 0),
    Status: detailData.Status ?? 1     // usually 1 = active / ordered
  };

  console.log("updatePurchaseOrderDetail payload:", payload);

  try {
    const response = await API.post("/UpdatePurchaseOrderDetail", payload);
    console.log("UpdatePurchaseOrderDetail response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update purchase order detail");
    }

    return {
      success: true,
      poDetailId: result.IN_PO_DETAIL_ID || detailData.PODetailID,  // prefer response value, fallback to input
      message: "Purchase order detail updated successfully"
    };

  } catch (error) {
    console.error("updatePurchaseOrderDetail error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update purchase order detail";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deletePurchaseOrderDetail = async (poDetailId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // PODetailID is mandatory for delete
  if (!poDetailId && poDetailId !== 0) {
    const validationError = new Error("PODetailID is required to delete a purchase order detail.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    PODetailID: poDetailId
  };

  console.log("deletePurchaseOrderDetail payload:", payload);

  try {
    const response = await API.post("/DeletePurchaseOrderDetail", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete purchase order detail");
    }

    return {
      success: true,
      poDetailId: result.IN_PO_DETAIL_ID || poDetailId,
      message: "Purchase order detail deleted successfully"
    };

  } catch (error) {
    console.error("deletePurchaseOrderDetail error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete purchase order detail";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getMedicineStockList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Determine final IDs based on environment (same pattern as getEmployeeList)
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    StockID: options.StockID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    MedicineID: options.MedicineID || 0,
    MedicineName: options.MedicineName || "",
    BatchNo: options.BatchNo || "",
    ExpiryFrom: options.ExpiryFrom || "",       // expected format: "YYYY-MM-DD"
    ExpiryTo: options.ExpiryTo || "",           // expected format: "YYYY-MM-DD"
    NearExpiryDays: options.NearExpiryDays ?? 1,
    ZeroStock: options.ZeroStock ?? -1,
    NegativeStock: options.NegativeStock ?? 0
  };

  console.log("get MedicineStockList payload:", payload);

  try {
    const response = await API.post("/GetMedicineStockList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetMedicineStockList response:", results);

    return results.map((stock) => ({
      id: stock.stock_id,
      uniqueSeq: stock.unique_seq,
      clinicId: stock.clinic_id,
      clinicName: stock.clinic_name,
      branchId: stock.branch_id,
      branchName: stock.branch_name,
      medicineId: stock.medicine_id,
      medicineName: stock.medicine_name,
      genericName: stock.generic_name || null,
      manufacturer: stock.manufacturer || null,
      hsnCode: stock.hsn_code || null,
      batchNo: stock.batch_no || null,
      expiryDate: stock.expiry_date || null,           // ISO string or null
      quantityIn: stock.quantity_in ?? 0,
      quantityOut: stock.quantity_out ?? 0,
      balanceQuantity: stock.balance_quantity ?? 0,
      purchasePrice: stock.purchase_price != null ? String(stock.purchase_price) : null,
      averagePrice: stock.average_price != null ? String(stock.average_price) : null,
      stockStatusDesc: stock.stock_status_desc || "Unknown",
      daysToExpiry: stock.days_to_expiry ?? null,      // can be negative
      dateCreated: stock.date_created || null,
      dateModified: stock.date_modified || null
    }));
  } catch (error) {
    console.error("getMedicineStockList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch medicine stock list"
    };

    throw err;
  }
};

export const addMedicineStock = async (stockData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust as per your backend requirements)
  if (!stockData?.MedicineID || stockData.MedicineID <= 0) {
    const validationError = new Error("MedicineID is required and must be valid");
    validationError.status = 400;
    throw validationError;
  }

  if (!stockData?.BatchNo?.trim()) {
    const validationError = new Error("Batch number is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!stockData?.ExpiryDate) {
    const validationError = new Error("Expiry date is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!stockData?.QuantityIn || stockData.QuantityIn <= 0) {
    const validationError = new Error("QuantityIn must be a positive number");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: stricter clinic validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (stockData.clinicId < 0 || (stockData.clinicId !== 0 && isNaN(stockData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (stockData.clinicId || 0);
  const finalBranchId  = PRODUCTION_MODE ? getBranchId()  : (stockData.branchId  || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    MedicineID: parseInt(stockData.MedicineID),
    BatchNo: String(stockData.BatchNo).trim(),
    ExpiryDate: stockData.ExpiryDate.trim(),          // expected: "YYYY-MM-DD"
    QuantityIn: parseInt(stockData.QuantityIn),
    PurchasePrice: Number(stockData.PurchasePrice)    // can be float
  };

  console.log("Add Medicine Stock payload:", payload);

  try {
    const response = await API.post("/AddMedicineStock", payload);

    console.log("AddMedicineStock response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add medicine stock");
    }

    // Return success with the new stock ID
    return {
      success: true,
      stockId: result.OUT_ID,           // the newly created stock_id
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addMedicineStock failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add medicine stock"
    };

    throw errorWithStatus;
  }
};

export const updateMedicineStock = async (stockData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // StockID is mandatory for update
  if (!stockData?.StockID && stockData?.StockID !== 0) {
    const validationError = new Error("StockID is required to update medicine stock.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is typically required (same pattern as updateEmployee)
  if (!stockData?.clinicId && stockData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update medicine stock.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (stockData.clinicId < 0 || (stockData.clinicId !== 0 && isNaN(stockData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (stockData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (stockData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    StockID: parseInt(stockData.StockID),
    BatchNo: stockData.BatchNo?.trim() || "",
    ExpiryDate: stockData.ExpiryDate?.trim() || "",     // expected: "YYYY-MM-DD"
    QuantityIn: parseInt(stockData.QuantityIn ?? 0),
    PurchasePrice: Number(stockData.PurchasePrice ?? 0) // supports decimals
  };

  console.log("updateMedicineStock payload:", payload);

  try {
    const response = await API.post("/UpdateMedicineStock", payload);
    console.log("UpdateMedicineStock response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update medicine stock");
    }

    return {
      success: true,
      stockId: result.IN_STOCK_ID || stockData.StockID,  // echo back input or use returned value
      message: "Medicine stock updated successfully"
    };

  } catch (error) {
    console.error("updateMedicineStock error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update medicine stock";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const getPrescriptionList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Optional: stricter validation in non-production (same as getEmployeeList)
  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Determine final IDs based on environment
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    PrescriptionID: options.PrescriptionID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    ConsultationID: options.ConsultationID || 0,
    VisitID: options.VisitID || 0,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    DoctorID: options.DoctorID || 0,
    DoctorName: options.DoctorName || "",
    CreatedBy: options.CreatedBy || 0,
    FromDate: options.FromDate || "",           // expected: "YYYY-MM-DD"
    ToDate: options.ToDate || "",               // expected: "YYYY-MM-DD"
    IsRepeat: options.IsRepeat ?? -1,
    Status: options.Status ?? -1
  };

  console.log("get PrescriptionList payload:", payload);

  try {
    const response = await API.post("/GetPrescriptionList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetPrescriptionList response:", results);

    return results.map((pres) => ({
      id: pres.prescription_id,
      uniqueSeq: pres.unique_seq,
      clinicId: pres.clinic_id,
      clinicName: pres.clinic_name,
      branchId: pres.branch_id,
      branchName: pres.branch_name,
      consultationId: pres.consultation_id,
      visitId: pres.visit_id,
      patientId: pres.patient_id,
      patientName: pres.patient_name,
      patientMobile: pres.patient_mobile || null,
      patientFileNo: pres.patient_file_no || null,
      doctorId: pres.doctor_id,
      doctorFullName: pres.doctor_full_name,
      doctorCode: pres.doctor_code || null,
      dateIssued: pres.date_issued || null,       // ISO string
      validUntil: pres.valid_until || null,       // ISO string
      diagnosis: pres.diagnosis || null,
      notes: pres.notes || null,
      isRepeat: pres.is_repeat === 1,             // boolean for easier use
      isRepeatDesc: pres.is_repeat_desc || "Unknown",
      repeatCount: pres.repeat_count ?? 0,
      status: pres.status,
      statusDesc: pres.status_desc || "Unknown",
      createdBy: pres.created_by,
      createdByName: pres.created_by_name || null,
      dateCreated: pres.date_created || null,
      dateModified: pres.date_modified || null
    }));
  } catch (error) {
    console.error("getPrescriptionList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch prescriptions"
    };

    throw err;
  }
};

export const addPrescription = async (prescriptionData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust as per your backend rules)
  if (!prescriptionData?.PatientID || prescriptionData.PatientID <= 0) {
    const validationError = new Error("PatientID is required and must be valid");
    validationError.status = 400;
    throw validationError;
  }

  if (!prescriptionData?.DoctorID || prescriptionData.DoctorID <= 0) {
    const validationError = new Error("DoctorID is required and must be valid");
    validationError.status = 400;
    throw validationError;
  }

  if (!prescriptionData?.DateIssued) {
    const validationError = new Error("DateIssued is required");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: stricter clinic validation in non-production (like addEmployee)
  if (PRODUCTION_MODE !== true) {
    if (prescriptionData.clinicId < 0 || (prescriptionData.clinicId !== 0 && isNaN(prescriptionData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (prescriptionData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (prescriptionData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    ConsultationID: prescriptionData.ConsultationID ?? 0,
    VisitID: prescriptionData.VisitID ?? 0,
    PatientID: parseInt(prescriptionData.PatientID),
    DoctorID: parseInt(prescriptionData.DoctorID),
    DateIssued: prescriptionData.DateIssued.trim(),       // expected: "YYYY-MM-DD"
    ValidUntil: prescriptionData.ValidUntil?.trim() || "", // can be empty?
    Diagnosis: prescriptionData.Diagnosis?.trim() || "",
    Notes: prescriptionData.Notes?.trim() || "",
    IsRepeat: prescriptionData.IsRepeat ?? 0,             // 0 or 1
    RepeatCount: prescriptionData.RepeatCount ?? 0,
    CreatedBy: parseInt(prescriptionData.CreatedBy ?? userId) // fallback to current user if missing
  };

  console.log("Add Prescription payload:", payload);

  try {
    const response = await API.post("/AddPrescription", payload);

    console.log("AddPrescription response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add prescription");
    }

    // Return success with new prescription ID
    return {
      success: true,
      prescriptionId: result.OUT_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addPrescription failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add prescription"
    };

    throw errorWithStatus;
  }
};

export const updatePrescription = async (prescriptionData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // PrescriptionID is mandatory for update
  if (!prescriptionData?.PrescriptionID && prescriptionData?.PrescriptionID !== 0) {
    const validationError = new Error("PrescriptionID is required to update a prescription.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is typically required (matching updateEmployee pattern)
  if (!prescriptionData?.clinicId && prescriptionData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update a prescription.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (prescriptionData.clinicId < 0 || (prescriptionData.clinicId !== 0 && isNaN(prescriptionData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (prescriptionData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (prescriptionData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PrescriptionID: parseInt(prescriptionData.PrescriptionID),
    DateIssued: prescriptionData.DateIssued?.trim() || "",
    ValidUntil: prescriptionData.ValidUntil?.trim() || "",
    Notes: prescriptionData.Notes?.trim() || "",
    IsRepeat: prescriptionData.IsRepeat ?? 0,       // 0 or 1
    RepeatCount: prescriptionData.RepeatCount ?? 0,
    Status: prescriptionData.Status ?? 1            // usually 1 = active
  };

  console.log("updatePrescription payload:", payload);

  try {
    const response = await API.post("/UpdatePrescription", payload);
    console.log("UpdatePrescription response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update prescription");
    }

    return {
      success: true,
      prescriptionId: result.IN_PRESCRIPTION_ID || prescriptionData.PrescriptionID,  // echo input or use returned value
      message: "Prescription updated successfully"
    };

  } catch (error) {
    console.error("updatePrescription error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update prescription";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deletePrescription = async (prescriptionId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // PrescriptionID is mandatory for delete
  if (!prescriptionId && prescriptionId !== 0) {
    const validationError = new Error("PrescriptionID is required to delete a prescription.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    PrescriptionID: prescriptionId
  };

  console.log("deletePrescription payload:", payload);

  try {
    const response = await API.post("/DeletePrescription", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete prescription");
    }

    return {
      success: true,
      prescriptionId: result.IN_PRESCRIPTION_ID || prescriptionId,
      message: "Prescription deleted successfully"
    };

  } catch (error) {
    console.error("deletePrescription error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete prescription";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getPrescriptionDetailList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Determine final IDs based on environment
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    PrescriptionDetailID: options.PrescriptionDetailID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PrescriptionID: options.PrescriptionID || 0,
    ConsultationID: options.ConsultationID || 0,
    VisitID: options.VisitID || 0,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    DoctorID: options.DoctorID || 0,
    DoctorName: options.DoctorName || "",
    MedicineID: options.MedicineID || 0,
    MedicineName: options.MedicineName || "",
    Form: options.Form || 0,
    Route: options.Route || 0,
    FoodTiming: options.FoodTiming || 0,
    RefillAllowed: options.RefillAllowed || 0,
    Status: options.Status ?? -1
  };

  console.log("get PrescriptionDetailList payload:", payload);

  try {
    const response = await API.post("/GetPrescriptionDetailList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetPrescriptionDetailList response:", results);

    return results.map((detail) => ({
      id: detail.prescription_detail_id,
      uniqueSeq: detail.unique_seq,
      clinicId: detail.clinic_id,
      clinicName: detail.clinic_name,
      branchId: detail.branch_id,
      branchName: detail.branch_name,
      prescriptionId: detail.prescription_id,
      consultationId: detail.consultation_id,
      visitId: detail.visit_id,
      patientId: detail.patient_id,
      patientName: detail.patient_name,
      patientMobile: detail.patient_mobile || null,
      patientFileNo: detail.patient_file_no || null,
      doctorId: detail.doctor_id,
      doctorFullName: detail.doctor_full_name,
      doctorCode: detail.doctor_code || null,
      medicineId: detail.medicine_id,
      medicineName: detail.medicine_name,
      masterMedicineName: detail.master_medicine_name || null,
      genericName: detail.generic_name || null,
      form: detail.form,
      formDesc: detail.form_desc || "Unknown",
      strength: detail.strength || null,
      dosage: detail.dosage || null,
      frequency: detail.frequency || null,
      duration: detail.duration || null,
      route: detail.route,
      routeDesc: detail.route_desc || "Unknown",
      foodTiming: detail.food_timing,
      foodTimingDesc: detail.food_timing_desc || "Unknown",
      instructions: detail.instructions || null,
      quantity: detail.quantity != null ? String(detail.quantity) : null, // keep as string like "21.00"
      refillAllowed: detail.refill_allowed === 1, // boolean for easier use
      refillAllowedDesc: detail.refill_allowed_desc || "Unknown",
      refillCount: detail.refill_count ?? 0,
      startDate: detail.start_date || null,
      endDate: detail.end_date || null,
      status: detail.status,
      statusDesc: detail.status_desc || "Unknown",
      dateCreated: detail.date_created || null,
      dateModified: detail.date_modified || null
    }));
  } catch (error) {
    console.error("getPrescriptionDetailList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch prescription details"
    };

    throw err;
  }
};

export const addPrescriptionDetail = async (detailData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust as per your backend rules)
  if (!detailData?.PrescriptionID || detailData.PrescriptionID <= 0) {
    const validationError = new Error("PrescriptionID is required and must be valid");
    validationError.status = 400;
    throw validationError;
  }

  if (!detailData?.MedicineID || detailData.MedicineID <= 0) {
    const validationError = new Error("MedicineID is required and must be valid");
    validationError.status = 400;
    throw validationError;
  }

  if (!detailData?.Dosage?.trim()) {
    const validationError = new Error("Dosage is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!detailData?.Quantity || detailData.Quantity <= 0) {
    const validationError = new Error("Quantity must be a positive number");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: stricter clinic validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (detailData.clinicId < 0 || (detailData.clinicId !== 0 && isNaN(detailData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (detailData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (detailData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PrescriptionID: parseInt(detailData.PrescriptionID),
    MedicineID: parseInt(detailData.MedicineID),
    MedicineName: detailData.MedicineName?.trim() || "",
    Form: detailData.Form ?? 0,
    Strength: detailData.Strength?.trim() || "",
    Dosage: detailData.Dosage?.trim() || "",
    Frequency: detailData.Frequency?.trim() || "",
    Duration: detailData.Duration?.trim() || "",
    Route: detailData.Route ?? 0,
    FoodTiming: detailData.FoodTiming ?? 0,
    Instructions: detailData.Instructions?.trim() || "",
    Quantity: Number(detailData.Quantity),           // can be float like 21.00
    RefillAllowed: detailData.RefillAllowed ?? 0,
    RefillCount: detailData.RefillCount ?? 0,
    StartDate: detailData.StartDate?.trim() || "",   // expected: "YYYY-MM-DD"
    EndDate: detailData.EndDate?.trim() || ""
  };

  console.log("Add PrescriptionDetail payload:", payload);

  try {
    const response = await API.post("/AddPrescriptionDetail", payload);

    console.log("AddPrescriptionDetail response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add prescription detail");
    }

    // Return success with new detail ID
    return {
      success: true,
      prescriptionDetailId: result.OUT_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addPrescriptionDetail failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add prescription detail"
    };

    throw errorWithStatus;
  }
};

export const updatePrescriptionDetail = async (prescriptionDetailData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!prescriptionDetailData?.PrescriptionDetailID && prescriptionDetailData?.PrescriptionDetailID !== 0) {
    const validationError = new Error("PrescriptionDetailID is required to update a prescription detail.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (!prescriptionDetailData?.ClinicID && prescriptionDetailData?.ClinicID !== 0) {
    const validationError = new Error("ClinicID is required to update prescription detail.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (prescriptionDetailData.ClinicID < 0 || (prescriptionDetailData.ClinicID !== 0 && isNaN(prescriptionDetailData.ClinicID))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (prescriptionDetailData.ClinicID || 0);
  const finalBranchId  = PRODUCTION_MODE ? getBranchId()  : (prescriptionDetailData.BranchID  || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    PrescriptionDetailID: prescriptionDetailData.PrescriptionDetailID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Form: prescriptionDetailData.Form ?? 0,
    Strength: prescriptionDetailData.Strength?.trim() || "",
    Dosage: prescriptionDetailData.Dosage?.trim() || "",
    Frequency: prescriptionDetailData.Frequency?.trim() || "",
    Duration: prescriptionDetailData.Duration?.trim() || "",
    Route: prescriptionDetailData.Route ?? 0,
    FoodTiming: prescriptionDetailData.FoodTiming ?? 0,
    Instructions: prescriptionDetailData.Instructions?.trim() || "",
    Quantity: prescriptionDetailData.Quantity ?? 0,
    RefillAllowed: prescriptionDetailData.RefillAllowed ?? 0,
    RefillCount: prescriptionDetailData.RefillCount ?? 0,

    // Dates (send as string – backend usually expects YYYY-MM-DD)
    StartDate: prescriptionDetailData.StartDate?.trim() || "",
    EndDate: prescriptionDetailData.EndDate?.trim() || "",
    Status: prescriptionDetailData.Status ?? 1    
  };

  console.log("updatePrescriptionDetail payload:", payload);

  try {
    const response = await API.post("/UpdatePrescriptionDetail", payload);
    console.log("UpdatePrescriptionDetail response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update prescription detail");
    }

    return {
      success: true,
      prescriptionDetailId: result.IN_DETAIL_ID || prescriptionDetailData.PrescriptionDetailID,
      message: "Prescription detail updated successfully"
    };

  } catch (error) {
    console.error("updatePrescriptionDetail error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update prescription detail";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deletePrescriptionDetail = async (prescriptionDetailId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // PrescriptionDetailID is mandatory for delete
  if (!prescriptionDetailId && prescriptionDetailId !== 0) {
    const validationError = new Error("PrescriptionDetailID is required to delete a prescription detail.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    PrescriptionDetailID: prescriptionDetailId
  };

  console.log("deletePrescriptionDetail payload:", payload);

  try {
    const response = await API.post("/DeletePrescriptionDetail", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete prescription detail");
    }

    return {
      success: true,
      prescriptionDetailId: result.IN_DETAIL_ID || prescriptionDetailId,
      message: "Prescription detail deleted successfully"
    };

  } catch (error) {
    console.error("deletePrescriptionDetail error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete prescription detail";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getSalesCartList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Determine final IDs based on environment
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    CartID: options.CartID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    Status: options.Status ?? -1
  };

  console.log("get SalesCartList payload:", payload);

  try {
    const response = await API.post("/GetSalesCartList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetSalesCartList response:", results);

    return results.map((cart) => ({
      id: cart.cart_id,
      uniqueSeq: cart.unique_seq,
      clinicId: cart.clinic_id,
      clinicName: cart.clinic_name,
      branchId: cart.branch_id,
      branchName: cart.branch_name,
      patientId: cart.patient_id,
      customerName: cart.customer_name,
      patientMobile: cart.patient_mobile || null,
      patientFileNo: cart.patient_file_no || null,
      temporaryName: cart.temporary_name || null,
      totalAmount: cart.total_amount != null ? String(cart.total_amount) : null,
      cgstAmount: cart.cgst_amount != null ? String(cart.cgst_amount) : null,
      sgstAmount: cart.sgst_amount != null ? String(cart.sgst_amount) : null,
      discount: cart.discount != null ? String(cart.discount) : null,
      netAmount: cart.net_amount != null ? String(cart.net_amount) : null,
      status: cart.status,
      statusDesc: cart.status_desc || "Unknown",
      dateCreated: cart.date_created || null,
      dateModified: cart.date_modified || null
    }));
  } catch (error) {
    console.error("getSalesCartList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch sales carts"
    };

    throw err;
  }
};

export const addSalesCart = async (cartData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!cartData?.PatientID || cartData.PatientID <= 0) {
    const validationError = new Error("PatientID is required and must be valid");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: stricter clinic validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (cartData.clinicId < 0 || (cartData.clinicId !== 0 && isNaN(cartData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (cartData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (cartData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PatientID: parseInt(cartData.PatientID),
    Name: cartData.Name?.trim() || "",    
  };

  console.log("Add SalesCart payload:", payload);

  try {
    const response = await API.post("/AddSalesCart", payload);

    console.log("AddSalesCart response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add sales cart");
    }

    // Return success with new cart ID
    return {
      success: true,
      cartId: result.OUT_CART_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addSalesCart failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add sales cart"
    };

    throw errorWithStatus;
  }
};

export const deleteSalesCart = async (cartId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // CartID is mandatory for delete
  if (!cartId && cartId !== 0) {
    const validationError = new Error("CartID is required to delete a sales cart.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    CartID: cartId
  };

  console.log("deleteSalesCart payload:", payload);

  try {
    const response = await API.post("/DeleteSalesCart", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete sales cart");
    }

    return {
      success: true,
      cartId: result.IN_CART_ID || cartId,
      message: "Sales cart deleted successfully"
    };

  } catch (error) {
    console.error("deleteSalesCart error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete sales cart";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getSalesCartDetailList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    CartDetailID: options.CartDetailID || 0,
    CartID: options.CartID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    MedicineID: options.MedicineID || 0,
    MedicineName: options.MedicineName || "",
    BatchNo: options.BatchNo || "",
    Status: options.Status ?? -1
  };

  console.log("get SalesCartDetailList payload:", payload);

  try {
    const response = await API.post("/GetSalesCartDetailList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetSalesCartDetailList response:", results);

    return results.map((item) => ({
      id: item.cart_detail_id,
      cartId: item.cart_id,
      cartHeaderId: item.cart_header_id,
      uniqueSeq: item.unique_seq,
      clinicId: item.clinic_id,
      clinicName: item.clinic_name,
      branchId: item.branch_id,
      branchName: item.branch_name,
      patientId: item.patient_id,
      customerName: item.customer_name,
      patientMobile: item.patient_mobile || null,
      patientFileNo: item.patient_file_no || null,
      medicineId: item.medicine_id,
      medicineName: item.medicine_name,
      genericName: item.generic_name || null,
      manufacturer: item.manufacturer || null,
      stockId: item.stock_id,
      batchNo: item.batch_no || null,
      expiryDate: item.expiry_date || null,
      quantity: item.quantity ?? 0,
      unitPrice: item.unit_price != null ? String(item.unit_price) : null,
      discountPercentage: item.discount_percentage != null ? String(item.discount_percentage) : null,
      discount: item.discount != null ? String(item.discount) : null,
      totalAmount: item.total_amount != null ? String(item.total_amount) : null,
      cgstAmount: item.cgst_amount != null ? String(item.cgst_amount) : null,
      sgstAmount: item.sgst_amount != null ? String(item.sgst_amount) : null,
      netAmount: item.net_amount != null ? String(item.net_amount) : null,
      status: item.status,
      statusDesc: item.status_desc || "Unknown",
      dateCreated: item.date_created || null,
      dateModified: item.date_modified || null
    }));
  } catch (error) {
    console.error("getSalesCartDetailList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch sales cart details"
    };

    throw err;
  }
};

export const addSalesCartDetail = async (detailData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!detailData?.CartID || detailData.CartID <= 0) {
    const validationError = new Error("CartID is required and must be valid");
    validationError.status = 400;
    throw validationError;
  }

  if (!detailData?.MedicineID || detailData.MedicineID <= 0) {
    const validationError = new Error("MedicineID is required and must be valid");
    validationError.status = 400;
    throw validationError;
  }

  if (!detailData?.Quantity || detailData.Quantity <= 0) {
    const validationError = new Error("Quantity must be a positive number");
    validationError.status = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (detailData.clinicId < 0 || (detailData.clinicId !== 0 && isNaN(detailData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (detailData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (detailData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    CartID: parseInt(detailData.CartID),
    MedicineID: parseInt(detailData.MedicineID),
    Quantity: Number(detailData.Quantity),
    UnitPrice: Number(detailData.UnitPrice ?? 0),
    DiscountPercentage: Number(detailData.DiscountPercentage ?? 0),
    BatchSelection: detailData.BatchSelection?.trim() || "FEFO"   // default to FEFO if omitted
  };

  console.log("Add SalesCartDetail payload:", payload);

  try {
    const response = await API.post("/AddSalesCartDetail", payload);

    console.log("AddSalesCartDetail response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add sales cart detail");
    }

    // Return success with new cart detail ID
    return {
      success: true,
      cartDetailId: result.OUT_CART_DETAIL_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addSalesCartDetail failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add sales cart detail"
    };

    throw errorWithStatus;
  }
};

export const deleteSalesCartDetail = async (cartDetailId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // CartDetailID is mandatory for delete
  if (!cartDetailId && cartDetailId !== 0) {
    const validationError = new Error("CartDetailID is required to delete a sales cart detail.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    CartDetailID: cartDetailId
  };

  console.log("deleteSalesCartDetail payload:", payload);

  try {
    const response = await API.post("/DeleteSalesCartDetail", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete sales cart detail");
    }

    return {
      success: true,
      cartDetailId: result.IN_CART_DETAIL_ID || cartDetailId,
      message: "Sales cart detail deleted successfully"
    };

  } catch (error) {
    console.error("deleteSalesCartDetail error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete sales cart detail";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const generatePharmacyInvoice = async (invoiceData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!invoiceData?.cartId) {
    const validationError = new Error("CartID is required to generate invoice");
    validationError.status = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    const clinicId = invoiceData.clinicId ?? 0;
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (invoiceData.clinicId ?? 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (invoiceData.branchId ?? 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    CartID: Number(invoiceData.cartId),               // required
    InvoiceDate: invoiceData.invoiceDate || "",       // expect "YYYY-MM-DD"
    Discount: Number(invoiceData.discount ?? 0),      // can be 0
  };

  console.log("Generate Pharmacy Invoice payload:", payload);

  try {
    const response = await API.post("/GeneratePharmacyInvoice", payload);

    console.log("GeneratePharmacyInvoice response:", response.data);

    const result = response.data?.result;

    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response format from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to generate pharmacy invoice");
    }

  
    return {
      success: true,
      invoiceId: result.OUT_INVOICE_ID,
      message: result.OUT_ERROR || "Invoice generated successfully"
    };

  } catch (error) {
    console.error("generatePharmacyInvoice failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to generate pharmacy invoice"
    };

    throw errorWithStatus;
  }
};

export const getPharmacyInvoiceDetailList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    OrderID: options.OrderID || 0,
    InvDetailID: options.InvDetailID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    InvoiceID: options.InvoiceID || 0,
    InvoiceNo: options.InvoiceNo || "",
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    MedicineID: options.MedicineID || 0,
    MedicineName: options.MedicineName || "",     // note: API expects string, not number
    BatchNo: options.BatchNo || "",
    FromDate: options.FromDate || "",             // expect "YYYY-MM-DD" or ISO string
    ToDate: options.ToDate || "",
  };

  console.log("getPharmacyInvoiceDetailList payload:", payload);

  try {
    const response = await API.post("/GetPharmacyInvoiceDetailList", payload);
    
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetPharmacyInvoiceDetailList response count:", results.length);

    return results.map((item) => ({
      id: item.inv_detail_id,
      uniqueSeq: item.unique_seq,
      clinicId: item.clinic_id,
      clinicName: item.clinic_name,
      branchId: item.branch_id,
      branchName: item.branch_name,
      invoiceId: item.invoice_id,
      invoiceNo: item.invoice_no,
      invoiceDate: item.invoice_date || null,
      patientId: item.patient_id,
      customerName: item.customer_name,
      patientMobile: item.patient_mobile,
      patientFileNo: item.patient_file_no,
      medicineId: item.medicine_id,
      medicineName: item.medicine_name,
      genericName: item.generic_name || null,
      manufacturer: item.manufacturer || null,
      hsnCode: item.hsn_code || null,
      batchNo: item.batch_no,
      expiryDate: item.expiry_date || null,
      quantity: Number(item.quantity) || 0,          // usually string in response → convert
      unitPrice: Number(item.unit_price) || 0,
      amount: Number(item.amount) || 0,
      cgstPercentage: Number(item.cgst_percentage) || 0,
      sgstPercentage: Number(item.sgst_percentage) || 0,
      cgstAmount: Number(item.cgst_amount) || 0,
      sgstAmount: Number(item.sgst_amount) || 0,
      totalLineAmount: Number(item.total_line_amount) || 0,
      dateCreated: item.date_created || null,
      dateModified: item.date_modified || null,
    }));
  } catch (error) {
    console.error("getPharmacyInvoiceDetailList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch pharmacy invoice details",
    };

    throw err;
  }
};