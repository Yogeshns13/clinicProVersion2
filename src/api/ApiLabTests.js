
import {getSessionRef, generateRefKey, getUserId, getClinicId, getBranchId} from "./Api.js"
import { API, checkDbError, extractBackendError} from "./ApiConfiguration";
const CHANNEL_ID = 1;
const PRODUCTION_MODE = 0;

export const getLabTestMasterList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Optional: stricter validation in non-production environments
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
    TestID: options.TestID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    TestName: options.TestName || "",
    TestType: options.TestType ?? 0,
    Status: options.Status ?? -1
  };

  console.log("get LabTestMasterList payload:", payload);

  try {
    const response = await API.post("/GetLabTestMasterList", payload);
    
    const result = response.data?.result;
    checkDbError(result);
    const results = Array.isArray(result) ? result : [];
    console.log("GetLabTestMasterList response:", results);

    return results.map((test) => ({
      id: test.test_id,
      uniqueSeq: test.unique_seq,
      clinicId: test.clinic_id,
      clinicName: test.clinic_name,
      branchId: test.branch_id,
      branchName: test.branch_name,
      testName: test.test_name || "",
      shortName: test.short_name || "",
      description: test.description || null,
      testType: test.test_type,
      testTypeDesc: test.test_type_desc || "Unknown",
      normalRange: test.normal_range || null,
      units: test.units || null,
      remarks: test.remarks || null,
      fees: test.fees || "0.00",                    
      cgstPercentage: test.cgst_percentage || "0.00",
      sgstPercentage: test.sgst_percentage || "0.00",
      status: test.status,
      statusDesc: test.status_desc || "Unknown",
      dateCreated: test.date_created || null,
      dateModified: test.date_modified || null
    }));
  } catch (error) {
    console.error("getLabTestMasterList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: extractBackendError(error) || error.response?.data?.message || error.message || "Failed to fetch lab test master list"
    };

    throw err;
  }
};

export const addLabTestMaster = async (labTestData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!labTestData?.TestName || !labTestData?.ShortName) {
    const validationError = new Error("TestName and ShortName are required");
    validationError.status = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (labTestData.clinicId < 0 || (labTestData.clinicId !== 0 && isNaN(labTestData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (labTestData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (labTestData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    TestName: labTestData.TestName || "",
    ShortName: labTestData.ShortName || "",
    Description: labTestData.Description || "",
    TestType: labTestData.TestType ?? 0,
    NormalRange: labTestData.NormalRange || "",
    Units: labTestData.Units || "",
    Remarks: labTestData.Remarks || "",
    Fees: Number(labTestData.Fees) || 0,
    CGSTPercentage: Number(labTestData.CGSTPercentage) || 0,
    SGSTPercentage: Number(labTestData.SGSTPercentage) || 0,
  };

  console.log("Add LabTestMaster payload:", payload);

  try {
    const response = await API.post("/AddLabTestMaster", payload);

    console.log("AddLabTestMaster response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add lab test");
    }

    return {
      success: true,
      testId: result.OUT_TEST_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addLabTestMaster failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        extractBackendError(error) || 
        error.response?.data?.message || 
        error.response?.data?.result?.OUT_ERROR ||
        error.message || 
        "Failed to add lab test"
    };

    throw errorWithStatus;
  }
};

export const updateLabTestMaster = async (labTestData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!labTestData?.TestID && labTestData?.TestID !== 0) {
    const validationError = new Error("TestID is required to update a lab test.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (!labTestData?.ClinicID && labTestData?.ClinicID !== 0) {
    const validationError = new Error("ClinicID is required to update a lab test.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional dev-mode validation for ClinicID
  if (PRODUCTION_MODE !== true) {
    if (labTestData.ClinicID < 0 || (labTestData.ClinicID !== 0 && isNaN(labTestData.ClinicID))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (labTestData.ClinicID || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (labTestData.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    TestID: labTestData.TestID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,          // include if your backend expects it (common pattern)
    TestName: labTestData.TestName?.trim() || "",
    ShortName: labTestData.ShortName?.trim() || "",
    Description: labTestData.Description?.trim() || "",
    TestType: labTestData.TestType ?? 0,
    NormalRange: labTestData.NormalRange?.trim() || "",
    Units: labTestData.Units?.trim() || "",
    Remarks: labTestData.Remarks?.trim() || "",
    Fees: Number(labTestData.Fees) || 0,
    CGSTPercentage: Number(labTestData.CGSTPercentage) || 0,
    SGSTPercentage: Number(labTestData.SGSTPercentage) || 0,
    Status: labTestData.Status ?? 1        // usually 1 = active
  };

  console.log("updateLabTestMaster payload:", payload);

  try {
    const response = await API.post("/UpdateLabTestMaster", payload);
    console.log("UpdateLabTestMaster response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update lab test");
    }

    return {
      success: true,
      testId: result.IN_TEST_ID || labTestData.TestID,  // echo back the updated ID
      message: "Lab test updated successfully"
    };

  } catch (error) {
    console.error("updateLabTestMaster error:", error);

    const errorMessage =
        extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update lab test";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteLabTestMaster = async (testId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!testId && testId !== 0) {
    const validationError = new Error("TestID is required to delete a lab test.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    TestID: testId
  };

  console.log("deleteLabTestMaster payload:", payload);

  try {
    const response = await API.post("/DeleteLabTestMaster", payload);
    const result = response.data?.result;
    checkDbError(result); 
    // Validate backend response (same pattern)
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete lab test");
    }

    return {
      success: true,
      testId: result.IN_TEST_ID || testId,   // echo back the ID that was deleted
      message: "Lab test deleted successfully"
    };

  } catch (error) {
    console.error("deleteLabTestMaster error:", error);

    const errorMsg =
        extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete lab test";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getLabTestPackageList = async (clinicId = 0, options = {}) => {
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
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PackNameSearch: options.PackNameSearch || "",   
    Status: options.Status ?? -1                    
  };

  console.log("getLabTestPackageList payload:", payload);

  try {
    const response = await API.post("/GetLabTestPackageList", payload);

    // Safeguard: make sure we have an array
    const result = response.data?.result;
    checkDbError(result);
    const results = Array.isArray(result) ? result : [];
    console.log("GetLabTestPackageList response:", results);

    return results.map((pkg) => ({
      id: pkg.PackageID,          
      packName: pkg.PackName,
      packShortName: pkg.PackShortName || "",
      description: pkg.Description || "",
      fees: pkg.Fees ? parseFloat(pkg.Fees) : 0,           
      cgstPercentage: parseFloat(pkg.CGSTPercentage) || 0,
      sgstPercentage: parseFloat(pkg.SGSTPercentage) || 0,
      status: pkg.Status ,
      dateCreated: pkg.DateCreated || null,
    }));
  } catch (error) {
    console.error("getLabTestPackageList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message:extractBackendError(error) || error.response?.data?.message || error.message || "Failed to fetch lab test packages"
    };

    throw err;
  }
};

export const addLabTestPackage = async (packageData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust as per your backend requirements)
  if (!packageData?.packName) {
    const validationError = new Error("Package name is required");
    validationError.status = 400;
    throw validationError;
  }

  // Optional stricter checks in development mode
  if (PRODUCTION_MODE !== true) {
    if (packageData.clinicId < 0 || (packageData.clinicId !== 0 && isNaN(packageData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (packageData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (packageData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PackName: packageData.packName || "",
    PackShortName: packageData.packShortName || "",
    Description: packageData.description || "",
    Fees: Number(packageData.fees) || 0,           
    CGSTPercentage: Number(packageData.cgstPercentage) || 0,
    SGSTPercentage: Number(packageData.sgstPercentage) || 0,
  };

  console.log("addLabTestPackage payload:", payload);

  try {
    const response = await API.post("/AddLabTestPackage", payload);

    console.log("AddLabTestPackage response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response structure from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to create lab test package");
    }

    return {
      success: true,
      packageId: result.OUT_PACKAGE_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addLabTestPackage failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add lab test package"
    };

    throw errorWithStatus;
  }
};

export const updateLabTestPackage = async (packageData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // PackageID is mandatory for update
  if (!packageData?.packageId && packageData?.packageId !== 0) {
    const validationError = new Error("PackageID is required to update a lab test package.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is typically required (matching your updateEmployee pattern)
  if (!packageData?.clinicId && packageData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update a lab test package.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (packageData.clinicId < 0 || (packageData.clinicId !== 0 && isNaN(packageData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (packageData.clinicId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    PackageID: packageData.packageId || 0,          
    PackName: packageData.packName?.trim() || "",
    PackShortName: packageData.packShortName?.trim() || "",
    Description: packageData.description?.trim() || "",
    Fees: Number(packageData.fees) || 0,
    CGSTPercentage: Number(packageData.cgstPercentage) || 0,
    SGSTPercentage: Number(packageData.sgstPercentage) || 0,
    Status: packageData.status ?? 1,                
  };

  console.log("updateLabTestPackage payload:", payload);

  try {
    const response = await API.post("/UpdateLabTestPackage", payload);
    console.log("UpdateLabTestPackage response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update lab test package");
    }

    return {
      success: true,
      packageId: payload.PackageID,               // echo back the updated ID
      message: result.OUT_ERROR || "Lab test package updated successfully"
    };

  } catch (error) {
    console.error("updateLabTestPackage error:", error);

    const errorMessage =
      extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update lab test package";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteLabTestPackage = async (packageId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // PackageID is mandatory for deletion
  if (!packageId && packageId !== 0) {
    const validationError = new Error("PackageID is required to delete a lab test package.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    PackageID: packageId
  };

  console.log("deleteLabTestPackage payload:", payload);

  try {
    const response = await API.post("/DeleteLabTestPackage", payload);
    const result = response.data?.result;
    checkDbError(result);   
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete lab test package");
    }

    return {
      success: true,
      packageId: result.IN_PACKAGE_ID || packageId,   // echo input ID or use returned value if present
      message: "Lab test package deleted successfully"
    };

  } catch (error) {
    console.error("deleteLabTestPackage error:", error);

    const errorMsg =
        extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete lab test package";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getLabTestPackageItemList = async (options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  const finalClinicId  = PRODUCTION_MODE ? getClinicId()  : (options.ClinicID  || 0);
  const finalBranchId  = PRODUCTION_MODE ? getBranchId()  : (options.BranchID  || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PackageID: options.packageId,
  };

  console.log("getLabTestPackageItemList payload:", payload);

  try {
    const response = await API.post("/GetLabTestPackageItemList", payload);

   const result = response.data?.result;
   checkDbError(result);
   const results = Array.isArray(result) ? result : [];
    console.log("GetLabTestPackageItemList response:", results);

    return results.map((item) => ({
      packageItemId: item.PackageItemID,
      testId:        item.TestID,
      testName:      item.TestName || "Unnamed Test",
      shortName:     item.ShortName || "",
      testFees: parseFloat(item.TestFees) || 0,
      cgstPercentage: parseFloat(item.TestCGSTPercentage) || 0,
      sgstPercentage: parseFloat(item.TestSGSTPercentage) || 0,
      testType:      item.test_type || 0,    
      itemAddedDate: item.ItemAddedDate || null,
      status:        item.Status,
    }));
  } catch (error) {
    console.error("getLabTestPackageItemList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message:extractBackendError(error) || error.response?.data?.message 
        || error.message 
        || "Failed to fetch lab test package items"
    };

    throw err;
  }
};

export const addLabPackageItem = async (packageItemData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!packageItemData?.packageId || !packageItemData?.testId) {
    const validationError = new Error("PackageID and TestID are required");
    validationError.status = 400;
    throw validationError;
  }

  const finalClinicId  = PRODUCTION_MODE ? getClinicId()  : (packageItemData.clinicId  || 0);
  const finalBranchId  = PRODUCTION_MODE ? getBranchId()  : (packageItemData.branchId  || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID:  finalClinicId,
    BranchID:  finalBranchId,
    PackageID: packageItemData.packageId,
    TestID:    parseInt(packageItemData.testId),
  };

  console.log("Add Lab Package Item payload:", payload);

  try {
    const response = await API.post("/AddLabPackageItem", payload);
    console.log("AddLabPackageItem response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    // Validate expected response structure (matches your sample)
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response structure from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add package item");
    }

    // Return success with the new item ID
    return {
      success: true,
      packageItemId: result.OUT_PACKAGE_ITEM_ID,
      message: result.OUT_ERROR || "OK"
    };
  } catch (error) {
    console.error("addLabPackageItem failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code:   error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add lab package item"
    };

    throw errorWithStatus;
  }
};

export const rebuildPackageFees = async (packageData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!packageData?.packageId && packageData?.packageId !== 0) {
    const validationError = new Error("PackageID is required to rebuild package fees.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (!packageData?.clinicId && packageData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to rebuild package fees.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (packageData.clinicId < 0 || (packageData.clinicId !== 0 && isNaN(packageData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
    if (packageData.packageId < 0 || (packageData.packageId !== 0 && isNaN(packageData.packageId))) {
      const error = new Error("Invalid Package ID");
      error.status = 400;
      throw error;
    }
  }

  // Decide final values based on environment (same pattern as your code)
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (packageData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (packageData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PackageID: parseInt(packageData.packageId),   // usually should be integer
  };

  console.log("rebuildPackageFees payload:", payload);

  try {
    const response = await API.post("/RebuildPackageFees", payload);
    console.log("RebuildPackageFees response:", response.data);

    const result = response.data?.result;
    checkDbError(result); 
    if (!result || result.RowsUpdated !== 1) {
      throw new Error(result?.OUT_ERROR || result?.message || "Failed to rebuild package fees");
    }

    return {
      success: true,
      rowsUpdated: result.RowsUpdated,
      newPackageFees: result.NewPackageFees || null,   // might be string or number
      message: "Package fees rebuilt successfully",
      formattedNewFees: result.NewPackageFees 
        ? `₹${Number(result.NewPackageFees).toFixed(2)}` 
        : null
    };

  } catch (error) {
    console.error("rebuildPackageFees error:", error);

    const errorMessage =
        extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.result?.message ||
      error.response?.data?.message ||
      error.message ||
      "Failed to rebuild package fees";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteLabPackageItem = async (packageItemId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!packageItemId && packageItemId !== 0) {
    const validationError = new Error("PackageItemID is required to delete a lab package item.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    PackageItemID: packageItemId
  };

  console.log("deleteLabPackageItem payload:", payload);

  try {
    const response = await API.post("/DeleteLabPackageItem", payload);
    const result = response.data?.result;
    checkDbError(result); 
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete lab package item");
    }

    return {
      success: true,
      packageItemId: result.IN_PACKAGE_ITEM_ID || packageItemId, // if backend returns it
      message: "Lab package item deleted successfully"
    };

  } catch (error) {
    console.error("deleteLabPackageItem error:", error);

    const errorMsg =
      extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete lab package item";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getLabTestOrderList = async (clinicId = 0, options = {}) => {
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
    OrderID: options.OrderID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    ConsultationID: options.ConsultationID || 0,
    VisitID: options.VisitID || 0,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    DoctorID: options.DoctorID || 0,
    DoctorName: options.DoctorName || "",
    TestID: options.TestID || 0,
    TestName: options.TestName || "",
    Status: options.Status ?? -1,      
    Priority: options.Priority || 0
  };

  console.log("getLabTestOrderList payload:", payload);

  try {
    const response = await API.post("/GetLabTestOrderList", payload);
    
    const result = response.data?.result;
    checkDbError(result);
    const results = Array.isArray(result) ? result : [];
    console.log("GetLabTestOrderList response:", results);

    return results.map((order) => ({
      id: order.order_id,
      uniqueSeq: order.unique_seq,
      clinicId: order.clinic_id,
      clinicName: order.clinic_name,
      clinicMobile: order.clinic_mobile || null,
      clinicAltMobile: order.clinic_alt_mobile || null,
      clinicAddress: order.clinic_address || null,
      branchId: order.branch_id,
      branchName: order.branch_name,
      consultationId: order.consultation_id,
      visitId: order.visit_id,
      patientId: order.patient_id,
      patientName: order.patient_name,
      patientMobile: order.patient_mobile,
      patientFileNo: order.patient_file_no,
      patientAge: order.patient_age || null,
      patientGender: order.patient_gender || null,
      doctorId: order.doctor_id,
      doctorFullName: order.doctor_full_name,
      doctorCode: order.doctor_code,
      designation: order.designation || null,  
      qualification: order.qualification || null, 
      reportId: order.report_id || null, 
      specialization: order.specialization || null,
      doctorMobile: order.doctor_mobile || null,
      doctorAltMobile: order.doctor_alt_mobile || null,
      fileId: order.file_id ?? null,           
      status: order.status,
      statusDesc: order.status_desc || "Unknown",
      priority: order.priority,
      priorityDesc: order.priority_desc || "Unknown",
      notes: order.notes || null,
      dateCreated: order.date_created,
      dateModified: order.date_modified
    }));
  } catch (error) {
    console.error("getLabTestOrderList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: extractBackendError(error) || error.response?.data?.message || error.message || "Failed to fetch lab test orders"
    };

    throw err;
  }
};

export const addLabTestOrder = async (orderData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust as per your backend rules)
  if (!orderData?.ConsultationID || !orderData?.VisitID || !orderData?.PatientID) {
    const validationError = new Error("ConsultationID, VisitID and PatientID are required");
    validationError.status = 400;
    throw validationError;
  }

  // In production these should come from session/context, in dev allow override
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (orderData.clinicId ?? 0);
  const finalBranchId  = PRODUCTION_MODE ? getBranchId()  : (orderData.branchId  ?? 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    ConsultationID: Number(orderData.ConsultationID),
    VisitID: Number(orderData.VisitID),
    PatientID: Number(orderData.PatientID),
    DoctorID: orderData.doctorId ?? 0,
    ExternalLabID: orderData.externalLabId ?? 0,
    ReportID: orderData.reportId ?? 0,
    Priority: orderData.priority ?? 1,       
    Notes: orderData.notes || "",
  };

  console.log("Add Lab Test Order payload:", payload);

  try {
    const response = await API.post("/AddLabTestOrder", payload);

    console.log("AddLabTestOrder response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to create lab test order");
    }

    // Success – return the new order ID
    return {
      success: true,
      orderId: result.OUT_ORDER_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addLabTestOrder failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to create lab test order"
    };

    throw errorWithStatus;
  }
};

export const updateLabTestOrder = async (orderData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // OrderID is mandatory for update
  if (!orderData?.orderId && orderData?.orderId !== 0) {
    const validationError = new Error("OrderID is required to update a lab test order.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID usually required (following your updateEmployee pattern)
  if (!orderData?.clinicId && orderData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update a lab test order.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (orderData.clinicId < 0 || (orderData.clinicId !== 0 && isNaN(orderData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (orderData.clinicId || 0);
  const finalBranchId  = PRODUCTION_MODE ? getBranchId()  : (orderData.branchId  || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    OrderID: Number(orderData.orderId),          
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Priority: orderData.priority ?? 1,            
    Notes: orderData.notes?.trim() || "",
    FileID: orderData.fileId ?? 0,
    ExternalLabID: orderData.externalLabId ?? 0, 
    ReportID: orderData.reportId ?? 0,
    Status: orderData.status ?? 1,                
    TestApprovedBy: orderData.testApprovedBy ?? 0 
  };

  console.log("updateLabTestOrder payload:", payload);

  try {
    const response = await API.post("/UpdateLabTestOrder", payload);
    console.log("UpdateLabTestOrder response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    // Basic structure + success check (aligned with your sample)
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to update lab test order");
    }

    return {
      success: true,
      orderId: result.IN_ORDER_ID || Number(orderData.orderId),  // echo back input or use returned value
      message: result.OUT_ERROR || "Lab test order updated successfully"
    };

  } catch (error) {
    console.error("updateLabTestOrder error:", error);

    const errorMessage =
    extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update lab test order";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteLabTestOrder = async (orderId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // OrderID is mandatory for deletion
  if (!orderId && orderId !== 0) {
    const validationError = new Error("OrderID is required to delete a lab test order.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    OrderID: Number(orderId)      
  };

  console.log("deleteLabTestOrder payload:", payload);

  try {
    const response = await API.post("/DeleteLabTestOrder", payload);
    const result = response.data?.result;
    checkDbError(result);
    // Validate backend response (matches your sample structure)
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to delete lab test order");
    }

    return {
      success: true,
      orderId: result.IN_ORDER_ID || Number(orderId),   // prefer returned value, fallback to input
      message: result.OUT_ERROR || "Lab test order deleted successfully"
    };

  } catch (error) {
    console.error("deleteLabTestOrder error:", error);

    const errorMsg =
      extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete lab test order";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getLabTestOrderItemList = async (clinicId = 0, options = {}) => {
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
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    OrderID: options.OrderID || 0,
    PatientID: options.PatientID || 0,
    DoctorID: options.DoctorID || 0,
    Status: options.Status ?? -1,
    Search: options.Search || ""
  };

  console.log("get LabTestOrderItemList payload:", payload);

  try {
    const response = await API.post("/GetLabTestOrderItemList", payload);
    
    const result = response.data?.result;
    checkDbError(result);
    const results = Array.isArray(result) ? result : [];
    console.log("GetLabTestOrderItemList response:", results);

    return results.map((item) => ({
      itemId: item.ItemID,
      orderId: item.OrderID,
      testId: item.TestID ?? null,
      packageId: item.PackageID ?? null,
      testOrPackageName: item.TestOrPackageName || "Unknown",
      fees: item.Fees ? parseFloat(item.Fees) : 0,
      cgst: item.CGST ? parseFloat(item.CGST) : 0,
      sgst: item.SGST ? parseFloat(item.SGST) : 0,
      totalAmount: item.TotalAmount ? parseFloat(item.TotalAmount) : 0,
      status: item.Status,   
      dateAdded: item.DateAdded || null,
      patientId: item.PatientID,
      patientName: item.PatientName || "",
      fileNo: item.FileNo || "",
      mobile: item.Mobile || null,
      doctorName: item.DoctorName || "",           
      priority: item.Priority ?? 1,            
      orderNotes: item.OrderNotes || ""
    }));
  } catch (error) {
    console.error("getLabTestOrderItemList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: extractBackendError(error) || error.response?.data?.message || error.message || "Failed to fetch lab test order items"
    };

    throw err;
  }
};

export const addLabTestOrderItem = async (orderItemData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust based on your backend rules)
  if (!orderItemData?.OrderID || orderItemData.OrderID <= 0) {
    const validationError = new Error("Valid OrderID is required");
    validationError.status = 400;
    throw validationError;
  }

  // At least one of TestID or PackageID should be provided (common business rule)
  const hasTest = Number(orderItemData.TestID) > 0;
  const hasPackage = Number(orderItemData.PackageID) > 0;
  if (!hasTest && !hasPackage) {
    const validationError = new Error("Either TestID or PackageID must be provided");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: stricter ClinicID check in development
  if (PRODUCTION_MODE !== true) {
    if (orderItemData.clinicId < 0 || (orderItemData.clinicId !== 0 && isNaN(orderItemData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (orderItemData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (orderItemData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    OrderID: Number(orderItemData.OrderID),
    PatientID: Number(orderItemData.PatientID) || 0,
    DoctorID: Number(orderItemData.DoctorID) || 0,
    TestID: hasTest ? Number(orderItemData.TestID) : 0,
    PackageID: hasPackage ? Number(orderItemData.PackageID) : 0
  };

  console.log("Add LabTestOrderItem payload:", payload);

  try {
    const response = await API.post("/AddLabTestOrderItem", payload);

    console.log("AddLabTestOrderItem response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    // Validate expected response structure
    if (!result || typeof result.OK === "undefined") {
      throw new Error("Invalid response from server – missing OK flag");
    }

    if (result.OK !== 1) {
      throw new Error(result.Error || "Failed to add lab test order item");
    }

    // Return success with the newly created item ID
    return {
      success: true,
      itemId: result.ItemID,
      message: result.Error || "OK"
    };

  } catch (error) {
    console.error("addLabTestOrderItem failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.response?.data?.result?.Error ||
        error.message ||
        "Failed to add lab test order item"
    };

    throw errorWithStatus;
  }
};

export const updateLabTestOrderItem = async (itemData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // ItemID is mandatory for update
  if (!itemData?.itemId && itemData?.itemId !== 0) {
    const validationError = new Error("ItemID is required to update a lab test order item.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is typically required (matching updateEmployee style)
  if (!itemData?.clinicId && itemData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update lab test order item.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (itemData.clinicId < 0 || (itemData.clinicId !== 0 && isNaN(itemData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (itemData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (itemData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    ItemID: Number(itemData.itemId),           
    Status: itemData.status ?? 1,     
  };

  console.log("updateLabTestOrderItem payload:", payload);

  try {
    const response = await API.post("/UpdateLabTestOrderItem", payload);
    console.log("UpdateLabTestOrderItem response:", response.data);

    const result = response.data?.result;
      checkDbError(result);
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update lab test order item");
    }

    return {
      success: true,
      itemId: result.IN_ITEM_ID || Number(itemData.itemId),  // echo back the ID used
      message: result.OUT_ERROR || "Lab test order item updated successfully"
    };

  } catch (error) {
    console.error("updateLabTestOrderItem error:", error);

    const errorMessage =
        extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update lab test order item";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const getLabWorkItemsList = async (clinicId = 0, options = {}) => {
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

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Status: options.Status ?? -1,
    PatientID: options.PatientID || 0,
    DoctorID: options.DoctorID || 0,
    TestID: options.TestID || 0,
    OrderID: options.OrderID || 0,
    FromDate: options.FromDate || "",
    ToDate: options.ToDate || "",
    Search: options.Search || ""
  };

  console.log("getLabWorkItemsList payload:", payload);

  try {
    const response = await API.post("/GetLabWorkItemList", payload);
    
    const result = response.data?.result;
    checkDbError(result);
    const results = Array.isArray(result) ? result : [];
    console.log("GetLabWorkItemList response count:", results.length);

    return results.map((item) => ({
      workId: item.WorkID,
      orderId: item.OrderID,
      itemId: item.ItemID,
      patientId: item.PatientID,
      patientName: item.PatientName || "Unknown",
      fileNo: item.FileNo || null,
      mobile: item.Mobile || null,
      testId: item.TestID,
      testName: item.TestName || "Unknown",
      resultValue: item.ResultValue || null,
      resultUnits: item.ResultUnits || null,
      normalRange: item.NormalRange || null,
      interpretation: item.Interpretation || null,   
      sampleCollectedTime: item.SampleCollectedTime || null,
      sampleCollectedPlace: item.SampleCollectedPlace || null,
      resultEnteredTime: item.ResultEnteredTime || null,
      technicianName: item.TechnicianName || 0,
      approverName: item.ApproverName || 0,
      status: item.Status,                      
      dateCreated: item.DateCreated || null,
      priority: item.Priority || 1,
      doctorName: item.DoctorName || ""      
    }));
  } catch (error) {
    console.error("getLabWorkItemsList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch lab work items"
    };

    throw err;
  }
};

export const createWorkItemsForOrder = async (orderId, clinicId = 0) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic input validation
  if (!orderId || orderId <= 0 || isNaN(orderId)) {
    const validationError = new Error("Valid Order ID is required");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: stricter clinicId check in development
  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Use environment context or passed value
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalOrderId   = orderId; 

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    OrderID: finalOrderId
  };

  console.log("CreateWorkItemsForOrder payload:", payload);

  try {
    const response = await API.post("/CreateWorkItemsForOrder", payload);

    console.log("CreateWorkItemsForOrder response:", response.data);

    const result = response.data?.result;
    checkDbError(result); 
    if (!result || typeof result.OK === "undefined") {
      throw new Error("Invalid response structure from server");
    }

    if (result.OK !== 1) {
      throw new Error(result.Error || "Failed to create work items");
    }

    // Success shape — consistent with addEmployee
    return {
      success: true,
      workItemsCreated: result.WorkItemsCreated || 0,
      message: result.Error || "Work items created successfully"
    };

  } catch (error) {
    console.error("createWorkItemsForOrder failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        extractBackendError(error) || 
        error.response?.data?.message ||
        error.response?.data?.result?.Error ||
        error.message ||
        "Failed to create work items for order"
    };

    throw errorWithStatus;
  }
};

export const updateSampleCollection = async (sampleData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Required fields validation
  if (!sampleData?.workId || sampleData.workId <= 0 || isNaN(sampleData.workId)) {
    const validationError = new Error("Valid WorkID is required to update sample collection.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (!sampleData?.sampleCollectedTime) {
    const validationError = new Error("SampleCollectedTime is required.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional: stricter clinic validation in dev mode
  if (PRODUCTION_MODE !== true) {
    if (
      sampleData.clinicId !== undefined &&
      (sampleData.clinicId < 0 || (sampleData.clinicId !== 0 && isNaN(sampleData.clinicId)))
    ) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Environment-aware clinic & branch
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (sampleData.clinicId ?? 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (sampleData.branchId ?? 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    WorkID: sampleData.workId,
    SampleCollectedTime: sampleData.sampleCollectedTime.trim(),   // expected format: "YYYY-MM-DD HH:mm:ss"
    SampleCollectedPlace: (sampleData.sampleCollectedPlace || "").trim(),
  };

  console.log("updateSampleCollection payload:", payload);

  try {
    const response = await API.post("/UpdateSampleCollection", payload);
    console.log("UpdateSampleCollection response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update sample collection");
    }

    return {
      success: true,
      workId: sampleData.workId,
      message: result.OUT_ERROR || "Sample collection updated successfully"
    };

  } catch (error) {
    console.error("updateSampleCollection error:", error);

    const errorMessage =
        extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update sample collection";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const updateLabWorkItemResult = async (workItemData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!workItemData?.workId || workItemData.workId <= 0) {
    const validationError = new Error("WorkID is required and must be a positive number.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (!workItemData?.clinicId && workItemData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update lab work item.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional stricter dev-mode check
  if (PRODUCTION_MODE !== true) {
    if (workItemData.clinicId < 0 || (workItemData.clinicId !== 0 && isNaN(workItemData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (workItemData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (workItemData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    WorkID: workItemData.workId,
    ResultValue: workItemData.resultValue?.trim() || "",
    ResultUnits: workItemData.resultUnits?.trim() || "",
    NormalRange: workItemData.normalRange?.trim() || "",
    Interpretation: workItemData.interpretation ?? null,     
    Remarks: workItemData.remarks?.trim() || "",
    TestDoneBy: workItemData.testDoneBy ?? 0,                
  };

  console.log("updateLabWorkItemResult payload:", payload);

  try {
    const response = await API.post("/UpdateLabWorkItemResult", payload);
    console.log("UpdateLabWorkItemResult response:", response.data);

    const result = response.data?.result;
    checkDbError(result); 
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update lab work item result");
    }

    return {
      success: true,
      workId: workItemData.workId,
      message: result.OUT_ERROR || "Lab result updated successfully"
    };

  } catch (error) {
    console.error("updateLabWorkItemResult error:", error);

    const errorMessage =
        extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update lab work item result";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const approveLabWorkItem = async (approvalData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!approvalData?.workId) {
    const validationError = new Error("WorkID is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!approvalData?.testApprovedBy) {
    const validationError = new Error("TestApprovedBy (approver ID) is required");
    validationError.status = 400;
    throw validationError;
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (approvalData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (approvalData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    WorkID: Number(approvalData.workId),               
    TestApprovedBy: Number(approvalData.testApprovedBy), 
    ApprovalRemarks: approvalData.approvalRemarks || "",
  };

  console.log("Approve Lab Work Item → Payload:", payload);

  try {
    const response = await API.post("/ApproveLabWorkItem", payload);

    console.log("ApproveLabWorkItem response:", response.data);

    const result = response.data?.result;
    checkDbError(result); 
    
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response structure from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to approve lab work item");
    }

    return {
      success: true,
      message: result.OUT_ERROR || "Approved successfully",
    };

  } catch (error) {
    console.error("approveLabWorkItem failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        extractBackendError(error) || 
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to approve lab work item",
    };

    throw errorWithStatus;
  }
};

export const rejectLabWorkItem = async (rejectData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation
  if (!rejectData?.WorkID) {
    const validationError = new Error("WorkID is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!rejectData?.RejectReason?.trim()) {
    const validationError = new Error("Reject reason is required");
    validationError.status = 400;
    throw validationError;
  }

  // Clinic/Branch logic same as your addEmployee
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (rejectData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (rejectData.branchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    WorkID: parseInt(rejectData.WorkID),
    TestApprovedBy: rejectData.TestApprovedBy,
    RejectReason: rejectData.RejectReason.trim(),
  };

  console.log("Reject Lab Work Item Payload:", payload);

  try {
    const response = await API.post("/RejectLabWorkItem", payload);
    console.log("RejectLabWorkItem response:", response.data);

    const result = response.data?.result;
    checkDbError(result); 
    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to reject lab work item");
    }

    return {
      success: true,
      message: result.OUT_ERROR || "Lab work item rejected successfully",
    };
  } catch (error) {
    console.error("rejectLabWorkItem failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to reject lab work item",
    };

    throw errorWithStatus;
  }
};

export const getLabTestReportList = async (clinicId = 0, options = {}) => {
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
    ReportID: options.ReportID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    OrderID: options.OrderID || 0,
    ConsultationID: options.ConsultationID || 0,
    VisitID: options.VisitID || 0,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    DoctorID: options.DoctorID || 0,
    DoctorName: options.DoctorName || "",
    VerifiedBy: options.VerifiedBy || 0,
    FromDate: options.FromDate || "",
    ToDate: options.ToDate || "",
    Status: options.Status ?? -1
  };

  console.log("get LabTestReportList payload:", payload);

  try {
    const response = await API.post("/GetLabTestReportList", payload);
    
    const result = response.data?.result;
    checkDbError(result);
    const results = Array.isArray(result) ? result : [];
    console.log("GetLabTestReportList response:", results);

    return results.map((report) => ({
      id: report.report_id,
      uniqueSeq: report.unique_seq,
      clinicId: report.clinic_id,
      clinicName: report.clinic_name,
      branchId: report.branch_id,
      branchName: report.branch_name,
      orderId: report.order_id,
      consultationId: report.consultation_id,
      visitId: report.visit_id,
      patientId: report.patient_id,
      patientName: report.patient_name,
      patientMobile: report.patient_mobile,
      patientFileNo: report.patient_file_no,
      doctorId: report.doctor_id,
      doctorFullName: report.doctor_full_name,
      doctorCode: report.doctor_code,
      fileId: report.file_id,                   // probably the report PDF/result file
      externalLabId: report.external_lab_id, 
      verifiedBy: report.verified_by,
      verifiedByName: report.verified_by_name,
      verifiedDateTime: report.verified_datetime || null,
      remarks: report.remarks || null,
      status: report.status,
      statusDesc: report.status_desc || "Unknown",
      dateCreated: report.date_created,
      dateModified: report.date_modified
    }));
  } catch (error) {
    console.error("getLabTestReportList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: extractBackendError(error) || error.response?.data?.message || error.message || "Failed to fetch lab test reports"
    };

    throw err;
  }
};

export const addLabTestReport = async (reportData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!reportData?.orderId || !reportData?.consultationId || !reportData?.visitId || !reportData?.patientId) {
    const validationError = new Error("Order ID, Consultation ID, Visit ID, and Patient ID are required");
    validationError.status = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (reportData.clinicId < 0 || (reportData.clinicId !== 0 && isNaN(reportData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
    if (reportData.branchId < 0 || (reportData.branchId !== 0 && isNaN(reportData.branchId))) {
      const error = new Error("Invalid Branch ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (reportData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (reportData.branchId || 0);

  // Format VerifiedDateTime if provided (expecting ISO string or date object)
  const verifiedDateTime = reportData.verifiedDateTime 
    ? (typeof reportData.verifiedDateTime === 'string' 
        ? reportData.verifiedDateTime 
        : reportData.verifiedDateTime.toISOString().slice(0, 19).replace('T', ' ')) 
    : "";

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    OrderID: reportData.orderId,
    ConsultationID: reportData.consultationId,
    VisitID: reportData.visitId,
    PatientID: reportData.patientId,
    DoctorID: reportData.doctorId || 0,
    FileID: reportData.fileId || 0,
    ExternalLabID: reportData.externalLabId || 0,
    VerifiedBy: reportData.verifiedBy || null,
    VerifiedDateTime: verifiedDateTime,
    Remarks: reportData.remarks || ""
  };

  console.log("Add LabTestReport payload:", payload);

  try {
    const response = await API.post("/AddLabTestReport", payload);

    console.log("AddLabTestReport response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    // Validate expected response structure (matches your sample)
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add lab test report");
    }

    // Return success with new report ID
    return {
      success: true,
      reportId: result.OUT_REPORT_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addLabTestReport failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message: 
        extractBackendError(error) || 
        error.response?.data?.message || 
        error.response?.data?.result?.OUT_ERROR ||
        error.message || 
        "Failed to add lab test report"
    };

    throw errorWithStatus;
  }
};

export const updateLabTestReport = async (reportData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!reportData?.reportId && reportData?.reportId !== 0) {
    const validationError = new Error("ReportID is required to update a lab test report.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (!reportData?.clinicId && reportData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update a lab test report.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (reportData.clinicId < 0 || (reportData.clinicId !== 0 && isNaN(reportData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (reportData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (reportData.branchId || 0);

  
  // Format VerifiedDateTime if provided (accepts ISO string or "YYYY-MM-DD HH:mm:ss")
  let verifiedDateTime = "";
  if (reportData.verifiedDateTime) {
    const dt = reportData.verifiedDateTime.trim();
    if (dt.includes("T")) {
      verifiedDateTime = dt.replace("T", " ").slice(0, 19); // "2026-01-29T13:00:00" → "2026-01-29 13:00:00"
    } else {
      verifiedDateTime = dt;
    }
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ReportID: reportData.reportId,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    VerifiedBy: reportData.verifiedBy ?? 0,
    VerifiedDateTime: verifiedDateTime,
    FileID: reportData.fileId ?? 0,
    ExternalLabID: reportData.externalLabId || 0,
    Remarks: reportData.remarks?.trim() || "",
    Status: reportData.status ?? -1   
  };

  console.log("updateLabTestReport payload:", payload);

  try {
    const response = await API.post("/UpdateLabTestReport", payload);
    console.log("UpdateLabTestReport response:", response.data);

    const result = response.data?.result;
      checkDbError(result); 
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update lab test report");
    }

    return {
      success: true,
      reportId: result.IN_REPORT_ID || reportData.reportId,  // echo back the updated ID
      message: "Lab test report updated successfully"
    };

  } catch (error) {
    console.error("updateLabTestReport error:", error);

    const errorMessage =
        extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update lab test report";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteLabTestReport = async (reportId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!reportId && reportId !== 0) {
    const validationError = new Error("ReportID is required to delete a lab test report.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ReportID: reportId
  };

  console.log("deleteLabTestReport payload:", payload);

  try {
    const response = await API.post("/DeleteLabTestReport", payload);
    const result = response.data?.result;
    checkDbError(result); 
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete lab test report");
    }

    return {
      success: true,
      reportId: result.IN_REPORT_ID || reportId,
      message: "Lab test report deleted successfully"
    };

  } catch (error) {
    console.error("deleteLabTestReport error:", error);

    const errorMsg =
        extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete lab test report";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const generateLabInvoice = async (invoiceData = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Core required fields
  if (!invoiceData?.orderId || invoiceData.orderId <= 0) {
    const validationError = new Error("OrderID is required and must be a positive number");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is required (consistent with your other APIs)
  if (!invoiceData?.clinicId && invoiceData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to generate lab invoice.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional: validate InvoiceDate format if provided
  if (invoiceData.invoiceDate && !/^\d{4}-\d{2}-\d{2}$/.test(invoiceData.invoiceDate.trim())) {
    const validationError = new Error("InvoiceDate should be in YYYY-MM-DD format if provided");
    validationError.status = 400;
    throw validationError;
  }

  // Discount should be non-negative number if provided
  if (
    invoiceData.discount != null &&
    (isNaN(Number(invoiceData.discount)) || Number(invoiceData.discount) < 0)
  ) {
    const validationError = new Error("Discount must be a valid non-negative number");
    validationError.status = 400;
    throw validationError;
  }

  // Environment-aware clinic/branch logic (same as your other functions)
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (invoiceData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (invoiceData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    OrderID: Number(invoiceData.orderId),
    InvoiceDate: invoiceData.invoiceDate?.trim() || "", 
    Discount: invoiceData.discount != null ? Number(invoiceData.discount) : 0
  };

  console.log("generateLabInvoice payload:", payload);

  try {
    const response = await API.post("/GenerateLabInvoice", payload);
    console.log("GenerateLabInvoice response:", response.data);

    const result = response.data?.result;
    checkDbError(result); 
    if (!result || result.OUT_OK !== 1) {
      const errorMsg = result?.OUT_ERROR || "Failed to generate lab invoice";
      throw new Error(errorMsg);
    }

    return {
      success: true,
      invoiceId: result.OUT_INVOICE_ID,
      message: "Lab invoice generated successfully"
    };

  } catch (error) {
    console.error("generateLabInvoice error:", error);

    const errorMessage =
        extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to generate lab invoice";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const getLabInvoiceDetailList = async (clinicId = 0, options = {}) => {
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

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    InvDetailID: options.InvDetailID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    InvoiceID: options.InvoiceID || 0,
    OrderID: options.OrderID || 0,
    TestID: options.TestID || 0,
    TestName: options.TestName || "",
    PatientID: options.PatientID || 0,
  };

  console.log("getLabInvoiceDetailList payload:", payload);

  try {
    const response = await API.post("/GetLabInvoiceDetailList", payload);
    const result = response.data?.result;
    checkDbError(result);
    const results = Array.isArray(result) ? result : [];
    console.log("GetLabInvoiceDetailList response:", results);

    return results.map((detail) => ({
      id: detail.inv_detail_id,
      uniqueSeq: detail.unique_seq,
      clinicId: detail.clinic_id,
      clinicName: detail.clinic_name,
      branchId: detail.branch_id,
      branchName: detail.branch_name,
      invoiceId: detail.invoice_id,
      invoiceNo: detail.invoice_no,
      invoiceDate: detail.invoice_date || null,
      patientId: detail.patient_id,
      patientName: detail.patient_name,
      patientMobile: detail.patient_mobile,
      patientFileNo: detail.patient_file_no,
      orderId: detail.order_id,
      testId: detail.test_id,
      testName: detail.test_name,
      masterTestName: detail.master_test_name,
      testShortName: detail.test_short_name,
      amount: detail.amount ? parseFloat(detail.amount) : 0,
      cgstPercentage: detail.cgst_percentage ? parseFloat(detail.cgst_percentage) : 0,
      sgstPercentage: detail.sgst_percentage ? parseFloat(detail.sgst_percentage) : 0,
      cgstAmount: detail.cgst_amount ? parseFloat(detail.cgst_amount) : 0,
      sgstAmount: detail.sgst_amount ? parseFloat(detail.sgst_amount) : 0,
      netAmount: detail.net_amount ? parseFloat(detail.net_amount) : 0,
      dateCreated: detail.date_created || null,
      dateModified: detail.date_modified || null,
    }));
  } catch (error) {
    console.error("getLabInvoiceDetailList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch lab invoice details",
    };

    throw err;
  }
};

export const getExternalLabList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  const finalClinicId = clinicId;
  const finalBranchId = options.BranchID;

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Status: options.Status ?? -1,
    Search: options.Search || "",
  };

  console.log("getExternalLabList payload:", payload);

  try {
    const response = await API.post("/GetExternalLabList", payload);

    const result = response.data?.result;
    checkDbError(result);
    const results = Array.isArray(result) ? result : [];
    console.log("GetExternalLabList response:", results);

    return results.map((lab) => ({
      externalLabId: lab.external_lab_id,
      name: lab.name || "",
      detail: lab.detail || "",
      mobile: lab.mobile || "",
      email: lab.email || "",
      address: lab.address || "",
      status: lab.status || 0,
      dateCreated: lab.date_created || null,
      dateModified: lab.date_modified || null,
    }));

  } catch (error) {
    console.error("getExternalLabList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch external lab list",
    };

    throw err;
  }
};

export const addExternalLab = async (externalLabData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!externalLabData?.Name) {
    const validationError = new Error("Name is required");
    validationError.status = 400;
    throw validationError;
  }

  const finalClinicId = externalLabData.clinicId || 0;
  const finalBranchId = externalLabData.branchId || 0;

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Name: externalLabData.Name || "",
    Detail: externalLabData.Detail || "",
    Mobile: externalLabData.Mobile || "",
    EMail: externalLabData.EMail || "",
    Address: externalLabData.Address || "",
  };

  console.log("Add ExternalLab payload:", payload);

  try {
    const response = await API.post("/AddExternalLab", payload);

    console.log("AddExternalLab response:", response.data);

    const result = response.data?.result;
    checkDbError(result);

    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add external lab");
    }

    return {
      success: true,
      externalLabId: result.OUT_EXTERNAL_LAB_ID,
      message: result.OUT_ERROR || "OK",
    };

  } catch (error) {
    console.error("addExternalLab failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add external lab",
    };

    throw errorWithStatus;
  }
};

export const updateExternalLab = async (externalLabData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!externalLabData?.ExternalLabID && externalLabData?.ExternalLabID !== 0) {
    const validationError = new Error("ExternalLabID is required to update an external lab.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const finalClinicId = externalLabData.ClinicID || 0;
  const finalBranchId = externalLabData.BranchID || 0;

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ExternalLabID: externalLabData.ExternalLabID,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    Name: externalLabData.Name?.trim() || "",
    Detail: externalLabData.Detail?.trim() || "",
    Mobile: externalLabData.Mobile?.trim() || "",
    EMail: externalLabData.EMail?.trim() || "",
    Address: externalLabData.Address?.trim() || "",
    Status: externalLabData.Status ?? 1,
  };

  console.log("updateExternalLab payload:", payload);

  try {
    const response = await API.post("/UpdateExternalLab", payload);
    console.log("UpdateExternalLab response:", response.data);

    const result = response.data?.result;
    checkDbError(result);

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update external lab");
    }

    return {
      success: true,
      externalLabId: result.OUT_EXTERNAL_LAB_ID || externalLabData.ExternalLabID,
      message: "External lab updated successfully",
    };

  } catch (error) {
    console.error("updateExternalLab error:", error);

    const errorMessage =
      extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update external lab";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteExternalLab = async (externalLabId, clinicId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!externalLabId && externalLabId !== 0) {
    const validationError = new Error("ExternalLabID is required to delete an external lab.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const finalClinicId = clinicId;

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    ExternalLabID: externalLabId,
  };

  console.log("deleteExternalLab payload:", payload);

  try {
    const response = await API.post("/DeleteExternalLab", payload);
    const result = response.data?.result;
    checkDbError(result);

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete external lab");
    }

    return {
      success: true,
      externalLabId: result.OUT_EXTERNAL_LAB_ID || externalLabId,
      message: "External lab deleted successfully",
    };

  } catch (error) {
    console.error("deleteExternalLab error:", error);

    const errorMsg =
      extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete external lab";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};






