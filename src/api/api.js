// src/api.js
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const CHANNEL_ID = 1;
const PRODUCTION_MODE = 0;

const getSessionRef = () => localStorage.getItem("SESSION_REF");
const storeSessionRef = (sessionRef) => localStorage.setItem("SESSION_REF", sessionRef);
export const getUserId = () => {
  return localStorage.getItem("userId");
};

const baseURL = "/api";
const API = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const generateRefKey = () => {
  const sessionRef = getSessionRef();
  if (!sessionRef) return "";
  const now = new Date();
  const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}:${now.getMilliseconds()}`;
  return `${sessionRef}_${timestamp}`;
};

export const getClinicId = () => {
  const clinicId = localStorage.getItem('clinicID');
  return clinicId ? parseInt(clinicId, 10) : null;
};

export const getBranchId = () => {
  const branchId = localStorage.getItem('branchID');
  return branchId ? parseInt(branchId, 10) : null;
};

export const checkSession = async () => {
  try {
    const response = await API.get("/session");
    console.log("Session check response:", response.data);
    return response.data?.authenticated === true;
  } catch (error) {
    console.error("Session check failed:", error);
    return false;
  }
};

export const loginUser = async (username, password) => {
  const sessionRef = uuidv4();
  storeSessionRef(sessionRef);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: sessionRef,
    USER_ID: 0,
    UserName: username,
    Password: password
  };

  try {
    const response = await API.post("/WebUserLogin", payload);
    console.log("myPayLoad", payload);
    const result = response.data.result;

    if (result?.isAuthendicated) {
      // Save user data including PROFILE_NAME
      localStorage.setItem("userId", result.USER_ID);
      localStorage.setItem("profileName", result.PROFILE_NAME);        // Already there
      localStorage.setItem("clinicID", result.BRANCH_ID);
      localStorage.setItem("branchID", result.CLINIC_ID);
      localStorage.setItem("isLoggedIn", "true");

      return { success: true, data: result };
    } else {
      throw new Error(result?.message || "Invalid credentials");
    }
  } catch (err) {
    throw new Error(err.response?.data?.message || err.message || "Network error");
  }
};

export const renewToken = async () => {
  const userId = getUserId();
  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: 0,
    UserId: parseInt(userId),
    RefreshToken: "",
  };
  const getReadableTime = () => new Date().toLocaleString();
  try {
    const response = await API.post("/RenewToken", payload);
    const responseTime = getReadableTime();
    console.log(`[RenewToken] Response at: ${responseTime}`, response.data);
    const result = response.data?.result;
    if (result?.OUT_OK === 1 && result?.USER_ID) { 
      const profileName = result?.PROFILE_NAME || result?.profileName || localStorage.getItem("profile_name");
      return { success: true, userId: result.USER_ID, profileName, responseTime };
    }
    return { success: false, responseTime };
  } catch (error) {
    const responseTime = getReadableTime();
    console.error(`[RenewToken] Failed at: ${responseTime}`, error);
    return { success: false, responseTime };
  }
};
// api.js (add this function alongside getInstituteList)

export const getClinicList = async () => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Default payload (you can override any field via options)
  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: 1,
    PageSize: 20,
    ClinicID: 0,        
    ClinicName: "",
    Mobile: "",
    GstNo: "",
    Status: -1            
  };

  try {
    const response = await API.post("/GetClinicList", payload);

    // Safety: ensure result is an array
    const results = Array.isArray(response.data?.result) ? response.data.result : [];

    console.log("GetClinicList response:", results);

    // Map backend response to clean frontend shape
    return results.map((clinic) => ({
      id: clinic.clinic_id,
      name: clinic.clinic_name,
      address: clinic.address,
      location: clinic.location,
      clinicType: clinic.clinic_type,
      gstNo: clinic.gst_no,
      cgstPercentage: clinic.cgst_percentage,
      sgstPercentage: clinic.sgst_percentage,
      ownerName: clinic.owner_name,
      mobile: clinic.mobile,
      altMobile: clinic.alt_mobile,
      email: clinic.email,
      fileNoPrefix: clinic.file_no_prefix,
      lastFileSeq: clinic.last_file_seq,
      invoicePrefix: clinic.invoice_prefix,
      invoiceLastSeq: clinic.invoice_last_seq,
      currentYear: clinic.current_year,
      seqGen: clinic.seq_gen,
      status: clinic.status === 1 ? 'active' : 'inactive', // normalized
      statusDesc: clinic.status_desc,
      fileAccessToken: clinic.file_access_token,
      dateCreated: clinic.date_created,
      dateModified: clinic.date_modified
    }));
  } catch (error) {
    console.error("getClinicList failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Failed to fetch clinic list'
    };

    throw errorWithStatus;
  }
};

export const addClinic = async (clinicData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Base payload with required auth fields
  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: 1,
    // Clinic fields from input
    ClinicName: clinicData.clinicName || "",
    Address: clinicData.address || "",
    Location: clinicData.location || "",
    ClinicType: clinicData.clinicType || "",
    GstNo: clinicData.gstNo || "",
    CgstPercentage: clinicData.cgstPercentage ?? 0,
    SgstPercentage: clinicData.sgstPercentage ?? 0,
    OwnerName: clinicData.ownerName || "",
    Mobile: clinicData.mobile || "",
    AltMobile: clinicData.altMobile || "",
    Email: clinicData.email || "",
    FileNoPrefix: clinicData.fileNoPrefix || "",
    LastFileSeq: clinicData.lastFileSeq ?? 0,
    InvoicePrefix: clinicData.invoicePrefix || "",
    ProfileName: clinicData.profileName || "admin" // optional, defaulting to "admin"
  };

  try {
    const response = await API.post("/AddClinic", payload);

    console.log("AddClinic response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add clinic");
    }

    // Return success with new clinic ID
    return {
      success: true,
      clinicId: result.OUT_CLINIC_ID,
      message: result.OUT_ERROR // usually "OK"
    };

  } catch (error) {
    console.error("addClinic failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message: 
        error.response?.data?.message || 
        error.response?.data?.result?.OUT_ERROR ||
        error.message || 
        "Failed to add clinic"
    };

    throw errorWithStatus;
  }
};

// In your api.js — replace the entire updateClinic function with this:
export const updateClinic = async (clinicData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // ClinicID is mandatory for update
  if (!clinicData?.clinicId && clinicData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update a clinic.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: clinicData.clinicId,
    ClinicName: clinicData.ClinicName?.trim() || "",
    OwnerName: clinicData.OwnerName?.trim() || "",
    Mobile: clinicData.Mobile?.trim() || "",
    AltMobile: clinicData.AltMobile?.trim() || "",
    Email: clinicData.Email?.trim() || "",
    Address: clinicData.Address?.trim() || "",
    Location: clinicData.Location?.trim() || "",
    ClinicType: clinicData.ClinicType?.trim() || "",
    GstNo: clinicData.GstNo?.trim() || "",
    CgstPercentage: Number(clinicData.CgstPercentage) || 0,
    SgstPercentage: Number(clinicData.SgstPercentage) || 0,
    FileNoPrefix: clinicData.FileNoPrefix?.trim() || "",
    InvoicePrefix: clinicData.InvoicePrefix?.trim() || "",
    Status: Number(clinicData.Status) || 1,
  };
  console.log(payload)

  try {
    const response = await API.post("/UpdateClinic", payload);
    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Update failed");
    }

    return { success: true, message: "Clinic updated successfully" };
  } catch (error) {
    console.error("updateClinic error:", error);
    throw new Error(
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update clinic"
    );
  }
};

export const getBranchList = async (clinicId = 0, options = {}) => {
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
    PageSize: options.PageSize || 50,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    BranchName: options.BranchName || "",
    Location: options.Location || "",
    BranchType: options.BranchType ?? 1,
    Status: options.Status ?? -1 // -1 = All statuses
  };

  try {
    const response = await API.post("/GetBranchList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetBranchList response:", results);

    return results.map((branch) => ({
      id: branch.branch_id,
      uniqueSeq: branch.unique_seq,
      clinicId: branch.clinic_id,
      clinicName: branch.clinic_name,
      name: branch.branch_name,
      address: branch.address || null,
      location: branch.location || null,
      branchType: branch.branch_type,
      branchTypeDesc: branch.branch_type_desc || "Main",
      status: branch.status === 1 ? "active" : "inactive",
      statusDesc: branch.status_desc || "Unknown",
      dateCreated: branch.date_created,
      dateModified: branch.date_modified
    }));
  } catch (error) {
    console.error("getBranchList failed:", error);
    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch branches"
    };
    throw err;
  }
};

export const addBranch = async (branchData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

   if (PRODUCTION_MODE !== true) {
    if (branchData.clinicId < 0 || (branchData.clinicId !== 0 && isNaN(branchData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : branchData.clinicId;

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchName: branchData.branchName || "",
    Address: branchData.address || "",
    Location: branchData.location || "",
    BranchType: branchData.branchType ?? 1 // default to 1 if not provided
  };

  try {
    const response = await API.post("/AddBranch", payload);

    console.log("AddBranch response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add branch");
    }

    // Return success with new branch ID
    return {
      success: true,
      branchId: result.OUT_BRANCH_ID,
      message: result.OUT_ERROR // usually "OK"
    };

  } catch (error) {
    console.error("addBranch failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message: 
        error.response?.data?.message || 
        error.response?.data?.result?.OUT_ERROR ||
        error.message || 
        "Failed to add branch"
    };

    throw errorWithStatus;
  }
};

export const updateBranch = async (branchData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // BranchID is mandatory for update
  if (!branchData?.branchId && branchData?.branchId !== 0) {
    const validationError = new Error("BranchID is required to update a branch.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is also required (as per your payload)
  if (!branchData?.clinicId && branchData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update a branch.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (branchData.clinicId < 0 || (branchData.clinicId !== 0 && isNaN(branchData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : branchData.clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (branchData.branchId || 0);


  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    BranchID: finalBranchId,
    ClinicID: finalClinicId,
    BranchName: branchData.BranchName?.trim() || "",
    Address: branchData.Address?.trim() || "",
    Location: branchData.Location?.trim() || "",
    BranchType: branchData.BranchType ?? 1,
    Status: branchData.Status || 1,
  };

  console.log("updateBranch payload:", payload);

  try {
    const response = await API.post("/UpdateBranch", payload);
    console.log("UpdateBranch response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update branch");
    }

    return {
      success: true,
      branchId: result.IN_BRANCH_ID, // or result.OUT_BRANCH_ID if server returns it
      message: "Branch updated successfully"
    };

  } catch (error) {
    console.error("updateBranch error:", error);

    const errorMessage = 
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update branch";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

// src/api/api.js
export const getDepartmentList = async (clinicId = 0, branchId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (clinicId < 0 || branchId < 0) {
    const error = new Error("Invalid Clinic ID or Branch ID");
    error.status = 400;
    throw error;
  }

  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 50,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    DepartmentID: options.DepartmentID || 0,
    DepartmentName: options.DepartmentName || ""
  };

  try {
    const response = await API.post("/GetDepartmentList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];

    console.log("GetDepartmentList response:", results);

    return results.map((dept) => ({
      id: dept.department_id,
      uniqueSeq: dept.unique_seq,
      clinicId: dept.clinic_id,
      clinicName: dept.clinic_name || "—",
      branchId: dept.branch_id,
      branchName: dept.branch_name || "—",
      name: dept.department_name,
      profile: dept.profile || null,           // This is your description field
      dateCreated: dept.date_created,
      dateModified: dept.date_modified
    }));
  } catch (error) {
    console.error("getDepartmentList failed:", error);
    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch departments"
    };
    throw err;
  }
};

export const addDepartment = async (departmentData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (PRODUCTION_MODE !== true) {
    if (departmentData.clinicId < 0 || (departmentData.clinicId !== 0 && isNaN(departmentData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (departmentData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (departmentData.branchId || 0);

  // Base payload with required auth fields
  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    // Department fields from input
    DepartmentName: departmentData.departmentName || "",
    Profile: departmentData.profile || "" // Description / full name
  };

  try {
    const response = await API.post("/AddDepartment", payload);

    console.log("AddDepartment response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add department");
    }

    // Return success with new department ID
    return {
      success: true,
      departmentId: result.OUT_DEPARTMENT_ID,
      message: result.OUT_ERROR // usually "OK"
    };

  } catch (error) {
    console.error("addDepartment failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message: 
        error.response?.data?.message || 
        error.response?.data?.result?.OUT_ERROR ||
        error.message || 
        "Failed to add department"
    };

    throw errorWithStatus;
  }
};

export const updateDepartment = async (departmentData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!departmentData?.departmentId && departmentData?.departmentId !== 0) {
    const validationError = new Error("DepartmentID is required to update a department.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is also required (as per your payload)
  if (!departmentData?.clinicId && departmentData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update a department.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (departmentData.clinicId < 0 || (departmentData.clinicId !== 0 && isNaN(departmentData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : departmentData.clinicId;

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    DepartmentID: departmentData.departmentId,
    ClinicID: finalClinicId,

    DepartmentName: departmentData.DepartmentName?.trim() || "",
    Profile: departmentData.Profile?.trim() || ""
  };

  console.log("updateDepartment payload:", payload);

  try {
    const response = await API.post("/UpdateDepartment", payload);
    console.log("UpdateDepartment response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update department");
    }

    return {
      success: true,
      departmentId: result.IN_DEPARTMENT_ID,
      message: "Department updated successfully"
    };

  } catch (error) {
    console.error("updateDepartment error:", error);

    const errorMessage = 
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update department";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};


export const getEmployeeList = async (clinicId = 0, options = {}) => {
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
    EmployeeID: options.EmployeeID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    DepartmentID: options.DepartmentID || 0,
    Designation: options.Designation || 0,
    Name: options.Name || "",
    Mobile: options.Mobile || "",
    EmployeeCode: options.EmployeeCode || "",
    Status: options.Status ?? -1          
  };

  try {
    const response = await API.post("/GetEmployeeList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetEmployeeList response:", results);

    return results.map((emp) => ({
      id: emp.employee_id,
      uniqueSeq: emp.unique_seq,
      clinicId: emp.clinic_id,
      clinicName: emp.clinic_name,
      branchId: emp.branch_id,
      branchName: emp.branch_name,
      employeeCode: emp.employee_code,
      name: emp.employee_name,
      firstName: emp.first_name,
      lastName: emp.last_name,

      // ── New / expanded fields ───────────────────────────────────────────────
      photoFileId: emp.photo_file_id ?? null,
      gender: emp.gender,                   // usually 1/2 or similar
      genderDesc: emp.gender_desc || "Unknown",
      birthDate: emp.birth_date || null,
      bloodGroup: emp.blood_group || null,  // code or ID
      maritalStatus: emp.marital_status || null,
      address: emp.address || null,
      mobile: emp.mobile || null,
      altMobile: emp.alt_mobile || null,
      email: emp.email || null,
      idProofType: emp.id_proof_type || null,
      idNumber: emp.id_number || null,
      idExpiry: emp.id_expiry || null,
      qualification: emp.qualification || null,
      specialization: emp.specialization || null,
      licenseNo: emp.license_no || null,
      licenseExpiryDate: emp.license_expiry_date || null,
      experienceYears: emp.experience_years || null,   // string or number
      universityName: emp.university_name || null,
      pfNo: emp.pf_no || null,
      esiNo: emp.esi_no || null,

      // ── Existing continued ─────────────────────────────────────────────────
      departmentId: emp.department_id,
      departmentName: emp.department_name,
      designation: emp.designation,
      designationDesc: emp.designation_desc || "Unknown",
      shiftId: emp.shift_id,
      shiftName: emp.shift_name || null,
      status: emp.status === 1 ? "active" : "inactive",
      statusDesc: emp.status_desc || "Unknown",
      dateCreated: emp.date_created,
      dateModified: emp.date_modified
    }));
  } catch (error) {
    console.error("getEmployeeList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch employees"
    };

    throw err;
  }
};


export const addEmployee = async (employeeData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust required fields as per your backend rules)
  if (!employeeData?.FirstName || !employeeData?.LastName) {
    const validationError = new Error("First name and last name are required");
    validationError.status = 400;
    throw validationError;
  }

  // In dev mode you might want to validate ClinicID / BranchID more strictly
  if (PRODUCTION_MODE !== true) {
    if (employeeData.clinicId < 0 || (employeeData.clinicId !== 0 && isNaN(employeeData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (employeeData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (employeeData.branchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    EmployeeCode: employeeData.employeeCode || "",
    FirstName: employeeData.firstName || employeeData.FirstName || "",
    LastName: employeeData.lastName || employeeData.LastName || "",
    PhotoFileID: employeeData.photoFileId ?? 0,
    Gender: employeeData.gender ?? 0,                
    BirthDate: employeeData.birthDate || "",         
    BloodGroup: employeeData.bloodGroup ?? 0,
    MaritalStatus: employeeData.maritalStatus ?? 0,
    Address: employeeData.address || "",
    Mobile: employeeData.mobile || "",
    AltMobile: employeeData.altMobile || "",
    Email: employeeData.email || "",
    IdProofType: employeeData.idProofType ?? 0,
    IdNumber: employeeData.idNumber || "",
    IdExpiry: employeeData.idExpiry || "",  
    DepartmentID: employeeData.departmentId ?? 0,
    Designation: employeeData.designation ?? 0,
    Qualification: employeeData.qualification || "",
    Specialization: employeeData.specialization || "",
    LicenseNo: employeeData.licenseNo || "",
    LicenseExpiryDate: employeeData.licenseExpiryDate || "",
    ExperienceYears: employeeData.experienceYears ?? 0,
    UniversityName: employeeData.universityName || "",
    PFNo: employeeData.pfNo || "",
    ESINo: employeeData.esiNo || "",
    ShiftID: employeeData.shiftId ?? 0
  };

  try {
    const response = await API.post("/AddEmployee", payload);

    console.log("AddEmployee response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure (matches your sample)
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add employee");
    }

    // Return success with new employee ID
    return {
      success: true,
      employeeId: result.OUT_EMPLOYEE_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addEmployee failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message: 
        error.response?.data?.message || 
        error.response?.data?.result?.OUT_ERROR ||
        error.message || 
        "Failed to add employee"
    };

    throw errorWithStatus;
  }
};

export const updateEmployee = async (employeeData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // EmployeeID is mandatory for update
  if (!employeeData?.employeeId && employeeData?.employeeId !== 0) {
    const validationError = new Error("EmployeeID is required to update an employee.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is also typically required
  if (!employeeData?.clinicId && employeeData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update an employee.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (employeeData.clinicId < 0 || (employeeData.clinicId !== 0 && isNaN(employeeData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (employeeData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (employeeData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    EmployeeID: employeeData.employeeId || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    EmployeeCode: employeeData.employeeCode?.trim() || "",
    FirstName: employeeData.firstName?.trim() || employeeData.FirstName?.trim() || "",
    LastName: employeeData.lastName?.trim() || employeeData.LastName?.trim() || "",
    PhotoFileID: employeeData.photoFileId ?? 0,
    Gender: employeeData.gender ?? 0,
    BirthDate: employeeData.birthDate?.trim() || "",
    BloodGroup: employeeData.bloodGroup ?? 0,
    MaritalStatus: employeeData.maritalStatus ?? 0,
    Address: employeeData.address?.trim() || "",
    Mobile: employeeData.mobile?.trim() || "",
    AltMobile: employeeData.altMobile?.trim() || "",
    Email: employeeData.email?.trim() || "",
    IdProofType: employeeData.idProofType ?? 0,
    IdNumber: employeeData.idNumber?.trim() || "",
    IdExpiry: employeeData.idExpiry?.trim() || "",
    DepartmentID: employeeData.departmentId ?? 0,
    Designation: employeeData.designation ?? 0,
    Qualification: employeeData.qualification?.trim() || "",
    Specialization: employeeData.specialization?.trim() || "",
    LicenseNo: employeeData.licenseNo?.trim() || "",
    LicenseExpiryDate: employeeData.licenseExpiryDate?.trim() || "",
    ExperienceYears: employeeData.experienceYears ?? 0,
    UniversityName: employeeData.universityName?.trim() || "",
    PFNo: employeeData.pfNo?.trim() || "",
    ESINo: employeeData.esiNo?.trim() || "",
    ShiftID: employeeData.shiftId ?? 0,
    Status: employeeData.status ?? 1     // usually 1 = active
  };

  console.log("updateEmployee payload:", payload);

  try {
    const response = await API.post("/UpdateEmployee", payload);
    console.log("UpdateEmployee response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update employee");
    }

    return {
      success: true,
      employeeId: result.IN_EMPLOYEE_ID || finalEmployeeId,  // echo back or use input
      message: "Employee updated successfully"
    };

  } catch (error) {
    console.error("updateEmployee error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update employee";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteEmployee = async (employeeId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // EmployeeID is mandatory for delete
  if (!employeeId && employeeId !== 0) {
    const validationError = new Error("EmployeeID is required to delete an employee.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    EmployeeID: employeeId
  };

  console.log("deleteEmployee payload:", payload);

  try {
    const response = await API.post("/DeleteEmployee", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete employee");
    }

    return {
      success: true,
      employeeId: result.IN_EMPLOYEE_ID || employeeId,
      message: "Employee deleted successfully"
    };

  } catch (error) {
    console.error("deleteEmployee error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete employee";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};
