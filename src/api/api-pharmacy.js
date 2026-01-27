import axios from "axios";
import {getSessionRef, generateRefKey, getUserId, getClinicId, getBranchId} from "./api.js"
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
      status: med.status === 1 ? "active" : "inactive",
      statusDesc: med.status_desc || "Unknown",
      isLowStock: med.is_low_stock === "Yes",   // boolean-ified
      dateCreated: med.date_created || null,
      dateModified: med.date_modified || null
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
    Unit: medicineData.unit ?? 0,
    HSNCode: medicineData.hsnCode || "",
    ReorderLevelQty: medicineData.reorderLevelQty ?? 0,
    MRP: medicineData.mrp ?? 0,
    PurchasePrice: medicineData.purchasePrice ?? 0,
    SellPrice: medicineData.sellPrice ?? 0,
    StockQuantity: medicineData.stockQuantity ?? 0,
    CGSTPercentage: medicineData.cgstPercentage ?? 0,
    SGSTPercentage: medicineData.sgstPercentage ?? 0,
    Barcode: medicineData.barcode || ""
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
    Status: medicineData.status ?? 1     // usually 1 = active
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


