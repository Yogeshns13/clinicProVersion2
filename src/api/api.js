// src/api.js
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const CHANNEL_ID = 1;
const PRODUCTION_MODE = 0;

export const getSessionRef = () => localStorage.getItem("SESSION_REF");
const storeSessionRef = (sessionRef) => localStorage.setItem("SESSION_REF", sessionRef);
export const getUserId = () => {
  return localStorage.getItem("userId");
};

const UPLOAD_API_URL = '/upload';
const FILE_API_URL = 'http://192.168.0.3:5002/file';

const baseURL = "/api";
const API = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const generateRefKey = () => {
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

export const getFileAccessToken = () => {
  const file_access_token = localStorage.getItem('fileAccessToken');
  return file_access_token || null;
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
      localStorage.setItem("profileName", result.PROFILE_NAME);      
      localStorage.setItem("clinicID", result.BRANCH_ID);
      localStorage.setItem("branchID", result.CLINIC_ID);
      localStorage.setItem("isLoggedIn", "true");
      console.log("Result:", result);
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

export const uploadPhoto = async (file) => {
  try {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    let fileType;
    if (['jpeg', 'jpg'].includes(fileExtension)) {
      fileType = 'image/jpeg';
    } else if (fileExtension === 'png') {
      fileType = 'image/png';
    } else {
      throw new Error('Unsupported file type. Please upload a .jpg, .jpeg, or .png file.');
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    formData.append('ClinicID', getClinicId());

    const response = await axios.post(UPLOAD_API_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data',
        ...(PRODUCTION_MODE === 1 ? { "API-Key": API_KEY } : {})
      }
    });
    console.log('Photo uploaded successfully.');
    return { fileId: response.data.OUT_FILE_ID };
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

export const uploadIDProof = async (file) => {
  try {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    let fileType;
    if (['jpeg', 'jpg'].includes(fileExtension)) {
      fileType = 'image/jpeg';
    } else if (fileExtension === 'png') {
      fileType = 'image/png';
    } else if (fileExtension === 'pdf') {
      fileType = 'application/pdf';
    } else {
      throw new Error('Unsupported file type. Please upload a .jpg, .jpeg, .png, or .pdf file.');
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    formData.append('ClinicID',getClinicId());
    const response = await axios.post(UPLOAD_API_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' ,
        ...(PRODUCTION_MODE === 1 ? { "API-Key": API_KEY } : {})
      }
    });
    console.log('ID proof uploaded successfully');
    return { fileId: response.data.OUT_FILE_ID };
  } catch (error) {
    console.error('Error uploading ID proof:', error);
    throw error;
  }
};


export const getFile = async (fileId) => {
  try {
    if (!fileId) {
      throw new Error('FileID is required');
    }
    const payload = {
      ClinicID: getClinicId(),           
      FileID: Number(fileId),            
      FileAccessToken: getFileAccessToken()
    };

    console.log("getFile Request:",payload)

    const response = await axios.post(FILE_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...(PRODUCTION_MODE === 1 ? { "API-Key": API_KEY } : {})
      },
      responseType: 'blob'
    });
    const imageBlob = response.data;
    const imageUrl = URL.createObjectURL(imageBlob);

    console.log('File fetched successfully.');

    return {
      url: imageUrl,
      blob: imageBlob,
      fileId: fileId
    };

  } catch (error) {
    console.error('Error fetching file:', error);
    
    if (error.response?.status === 404) {
      throw new Error('File not found');
    }
    if (error.response?.status === 403 || error.response?.status === 401) {
      throw new Error('Access denied - invalid or expired token');
    }
    
    throw error;
  }
};


export const getClinicList = async (clinicId=0) => {
  const userId = getUserId();
  if (!userId) {
    const error = new Error("User not logged in. Please sign in again.");
    error.status = 401;
    error.code = 401;
    throw error;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId, 10),
    Page: 1,
    PageSize: 20,
    ClinicID: clinicId,          // 0 = get all (most common pattern)
    ClinicName: "",
    Mobile: "",
    GstNo: "",
    Status: -1            // -1 = all statuses
  };

  try {
    const response = await API.post("/GetClinicList", payload);
    console.log("GetClinicList response:", response);
    // Safeguard: make sure we have an array
    const clinics = Array.isArray(response.data?.result) 
      ? response.data.result 
      : [];

    // Map to clean frontend shape
    const mappedClinics = clinics.map(clinic => ({
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
      status: clinic.status === 1 ? 'active' : 'inactive',
      statusDesc: clinic.status_desc,
      fileAccessToken: clinic.file_access_token,
      dateCreated: clinic.date_created,
      dateModified: clinic.date_modified
    }));

    // ── Store fileAccessToken of the selected clinic ────────────────────────
    const storedClinicId = getClinicId(); // ← your function that reads from localStorage

    let targetClinic;

    if (storedClinicId) {
      targetClinic = mappedClinics.find(c => c.id === storedClinicId);
    }

    // Fallback: if no stored ID or not found → use first clinic (common UX pattern)
    if (!targetClinic && mappedClinics.length > 0) {
      targetClinic = mappedClinics[0];
      // Optional: also update stored ID to avoid confusion next time
      // localStorage.setItem('clinicId', mappedClinics[0].id);
    }

    if (targetClinic?.fileAccessToken) {
      localStorage.setItem('fileAccessToken', targetClinic.fileAccessToken);
      console.log(`Stored fileAccessToken for clinic ${targetClinic.id} (${targetClinic.name})`);
    } else if (mappedClinics.length === 0) {
      console.warn("No clinics returned → cannot store fileAccessToken");
    } else {
      console.warn(`Clinic ${storedClinicId} not found in list → no fileAccessToken stored`);
    }

    return mappedClinics;

  } catch (err) {
    console.error("getClinicList failed:", err);

    const error = {
      ...err,
      status: err.response?.status || 500,
      code: err.response?.status || 500,
      message: err.response?.data?.message || err.message || "Failed to load clinics"
    };

    throw error;
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

  console.log("Add Clinic:",payload)

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
  console.log("Update Clinic:",payload)

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

  console.log("Add Branch:", payload)

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

  console.log("update Branch:", payload);

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
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : branchId;

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
  
  console.log("getDepartmentList Payload",payload)

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

  console.log("Add Department", payload)

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

  console.log("get Employee:", payload);

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
      qualification: emp.qualification || null,
      specialization: emp.specialization || null,
      licenseNo: emp.license_no || null,
      licenseExpiryDate: emp.license_expiry_date || null,
      experienceYears: emp.experience_years || null,   // string or number
      universityName: emp.university_name || null,
      pfNo: emp.pf_no || null,
      esiNo: emp.esi_no || null,
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
  if (!employeeData?.firstName || !employeeData?.lastName) {
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
    FirstName: employeeData.firstName || "",
    LastName: employeeData.lastName || "",
    PhotoFileID: employeeData.photoFileId ?? 0,
    Gender: employeeData.gender ?? 0,                
    BirthDate: employeeData.birthDate || "",         
    BloodGroup: employeeData.bloodGroup ?? 0,
    MaritalStatus: employeeData.maritalStatus ?? 0,
    Address: employeeData.address || "",
    Mobile: employeeData.mobile || "",
    AltMobile: employeeData.altMobile || "",
    Email: employeeData.email || "", 
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

  console.log("Add Employee",payload)

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
    FirstName: employeeData.firstName?.trim() || "",
    LastName: employeeData.lastName?.trim() || "",
    PhotoFileID: employeeData.photoFileId ?? 0,
    Gender: employeeData.gender ?? 0,
    BirthDate: employeeData.birthDate?.trim() || "",
    BloodGroup: employeeData.bloodGroup ?? 0,
    MaritalStatus: employeeData.maritalStatus ?? 0,
    Address: employeeData.address?.trim() || "",
    Mobile: employeeData.mobile?.trim() || "",
    AltMobile: employeeData.altMobile?.trim() || "",
    Email: employeeData.email?.trim() || "",
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

export const getEmployeeProofList = async (clinicId = 0, options = {}) => {
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
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    EmployeeID: options.EmployeeID || 0,
    ProofType: options.ProofType || 0,
    IdNumber: options.IdNumber || "",
    Status: options.Status ?? -1
  };

  try {
    const response = await API.post("/GetEmployeeProofList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetEmployeeProofList response:", results);

    return results.map((proof) => ({
      proofId: proof.proof_id,
      uniqueSeq: proof.unique_seq,
      clinicId: proof.clinic_id,
      clinicName: proof.clinic_name,
      branchId: proof.branch_id,
      branchName: proof.branch_name,
      employeeId: proof.employee_id,
      employeeName: proof.employee_name,
      employeeCode: proof.employee_code,
      fileId: proof.file_id ?? 0,
      proofType: proof.proof_type,
      proofTypeDesc: proof.proof_type_desc || "Unknown",
      idNumber: proof.id_number || null,
      detail: proof.detail || null,
      expiryDate: proof.expiry_date || null,
      status: proof.status === 1 ? "active" : "inactive",
      statusDesc: proof.status_desc || "Unknown",
      dateCreated: proof.date_created,
      dateModified: proof.date_modified
    }));
  } catch (error) {
    console.error("getEmployeeProofList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch employee proofs"
    };

    throw err;
  }
};

export const addEmployeeProof = async (proofData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation
  if (!proofData?.employeeId || proofData.employeeId === 0) {
    const validationError = new Error("Employee ID is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!proofData?.proofType || proofData.proofType === 0) {
    const validationError = new Error("Proof type is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!proofData?.idNumber || proofData.idNumber.trim() === "") {
    const validationError = new Error("ID number is required");
    validationError.status = 400;
    throw validationError;
  }

  // In dev mode you might want to validate ClinicID / BranchID more strictly
  if (PRODUCTION_MODE !== true) {
    if (proofData.clinicId < 0 || (proofData.clinicId !== 0 && isNaN(proofData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (proofData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (proofData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    EmployeeID: proofData.employeeId || 0,
    FileID: proofData.fileId ?? 0,
    ProofType: proofData.proofType || 0,
    IdNumber: proofData.idNumber || "",
    Detail: proofData.detail || "",
    ExpiryDate: proofData.expiryDate || ""
  };

  console.log("Add Employee Proof", payload);

  try {
    const response = await API.post("/AddEmployeeProof", payload);

    console.log("AddEmployeeProof response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add employee proof");
    }

    // Return success with new proof ID
    return {
      success: true,
      proofId: result.OUT_PROOF_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addEmployeeProof failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message: 
        error.response?.data?.message || 
        error.response?.data?.result?.OUT_ERROR ||
        error.message || 
        "Failed to add employee proof"
    };

    throw errorWithStatus;
  }
};

export const updateEmployeeProof = async (proofData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // ProofID is mandatory for update
  if (!proofData?.proofId && proofData?.proofId !== 0) {
    const validationError = new Error("ProofID is required to update an employee proof.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is also typically required
  if (!proofData?.clinicId && proofData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update an employee proof.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // EmployeeID is required
  if (!proofData?.employeeId && proofData?.employeeId !== 0) {
    const validationError = new Error("EmployeeID is required to update an employee proof.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (proofData.clinicId < 0 || (proofData.clinicId !== 0 && isNaN(proofData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (proofData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (proofData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ProofID: proofData.proofId || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    EmployeeID: proofData.employeeId || 0,
    FileID: proofData.fileId ?? 0,
    ProofType: proofData.proofType ?? 0,
    IdNumber: proofData.idNumber?.trim() || "",
    Detail: proofData.detail?.trim() || "",
    ExpiryDate: proofData.expiryDate?.trim() || "",
    Status: proofData.status ?? 1     // usually 1 = active
  };

  console.log("updateEmployeeProof payload:", payload);

  try {
    const response = await API.post("/UpdateEmployeeProof", payload);
    console.log("UpdateEmployeeProof response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update employee proof");
    }

    return {
      success: true,
      proofId: result.IN_PROOF_ID || proofData.proofId,  // echo back or use input
      message: "Employee proof updated successfully"
    };

  } catch (error) {
    console.error("updateEmployeeProof error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update employee proof";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteEmployeeProof = async (proofId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // ProofID is mandatory for delete
  if (!proofId && proofId !== 0) {
    const validationError = new Error("ProofID is required to delete an employee proof.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ProofID: proofId
  };

  console.log("deleteEmployeeProof payload:", payload);

  try {
    const response = await API.post("/DeleteEmployeeProof", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete employee proof");
    }

    return {
      success: true,
      proofId: result.IN_PROOF_ID || proofId,
      message: "Employee proof deleted successfully"
    };

  } catch (error) {
    console.error("deleteEmployeeProof error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete employee proof";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getEmployeeBeneficiaryAccountList = async (clinicId = 0, options = {}) => {
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
    BeneficiaryID: options.BeneficiaryID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    EmployeeID: options.EmployeeID || 0,
    AccountNo: options.AccountNo || "",
    IFSCCode: options.IFSCCode || "",
    IsDefault: options.IsDefault || -1,
    Status: options.Status ?? -1
  };

  try {
    const response = await API.post("/GetEmployeeBeneficiaryAccountList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetEmployeeBeneficiaryAccountList response:", results);

    return results.map((account) => ({
      beneficiaryId: account.beneficiary_id,
      uniqueSeq: account.unique_seq,
      clinicId: account.clinic_id,
      clinicName: account.clinic_name,
      branchId: account.branch_id,
      branchName: account.branch_name,
      employeeId: account.employee_id,
      employeeName: account.employee_name,
      employeeCode: account.employee_code,
      accountHolderName: account.account_holder_name,
      accountNo: account.account_no,
      ifscCode: account.ifsc_code,
      bankName: account.bank_name,
      bankAddress: account.bank_address || null,
      isDefault: account.is_default === 1,
      isDefaultDesc: account.is_default_desc || "Unknown",
      status: account.status === 1 ? "active" : "inactive",
      statusDesc: account.status_desc || "Unknown",
      dateCreated: account.date_created,
      dateModified: account.date_modified
    }));
  } catch (error) {
    console.error("getEmployeeBeneficiaryAccountList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch employee beneficiary accounts"
    };

    throw err;
  }
};

export const addEmployeeBeneficiaryAccount = async (beneficiaryData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation
  if (!beneficiaryData?.EmployeeID) {
    const validationError = new Error("EmployeeID is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!beneficiaryData?.AccountHolderName || !beneficiaryData?.AccountNo || !beneficiaryData?.IFSCCode) {
    const validationError = new Error("Account holder name, account number, and IFSC code are required");
    validationError.status = 400;
    throw validationError;
  }

  // In production these come from context/session; in dev they may come from form
  const finalClinicId  = PRODUCTION_MODE ? getClinicId()  : (beneficiaryData.ClinicID  || 0);
  const finalBranchId  = PRODUCTION_MODE ? getBranchId()  : (beneficiaryData.BranchID  || 0);
  const finalEmployeeId = beneficiaryData.EmployeeID;   // usually sent explicitly – no fallback to global

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    EmployeeID: parseInt(finalEmployeeId),           // usually expected as integer
    AccountHolderName: beneficiaryData.AccountHolderName?.trim() || "",
    AccountNo: beneficiaryData.AccountNo?.trim() || "",
    IFSCCode: beneficiaryData.IFSCCode?.trim() || "",
    BankName: beneficiaryData.BankName?.trim() || "",
    BankAddress: beneficiaryData.BankAddress?.trim() || "",
    IsDefault: beneficiaryData.IsDefault ? 1 : 0     // normalize to 0 or 1
  };

  console.log("Add Employee Beneficiary Account payload:", payload);

  try {
    const response = await API.post("/AddEmployeeBeneficiaryAccount", payload);

    console.log("AddEmployeeBeneficiaryAccount response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add beneficiary account");
    }

    // Return success with the new beneficiary ID
    return {
      success: true,
      beneficiaryId: result.OUT_BENEFICIARY_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addEmployeeBeneficiaryAccount failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add beneficiary account"
    };

    throw errorWithStatus;
  }
};

export const updateEmployeeBeneficiaryAccount = async (beneficiaryData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // BeneficiaryID is mandatory for update
  if (!beneficiaryData?.BeneficiaryID && beneficiaryData?.BeneficiaryID !== 0) {
    const validationError = new Error("BeneficiaryID is required to update a beneficiary account.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // EmployeeID is typically required
  if (!beneficiaryData?.EmployeeID && beneficiaryData?.EmployeeID !== 0) {
    const validationError = new Error("EmployeeID is required to update a beneficiary account.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is usually required
  if (!beneficiaryData?.ClinicID && beneficiaryData?.ClinicID !== 0) {
    const validationError = new Error("ClinicID is required to update a beneficiary account.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional: basic validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (beneficiaryData.ClinicID < 0 || (beneficiaryData.ClinicID !== 0 && isNaN(beneficiaryData.ClinicID))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
    if (beneficiaryData.EmployeeID < 0 || (beneficiaryData.EmployeeID !== 0 && isNaN(beneficiaryData.EmployeeID))) {
      const error = new Error("Invalid Employee ID");
      error.status = 400;
      throw error;
    }
    // You could add more checks (IFSC length, AccountNo digits, etc.) if needed
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (beneficiaryData.ClinicID || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (beneficiaryData.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    
    BeneficiaryID: beneficiaryData.BeneficiaryID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    EmployeeID: beneficiaryData.EmployeeID || 0,
    
    AccountHolderName: beneficiaryData.AccountHolderName?.trim() || "",
    AccountNo: beneficiaryData.AccountNo?.trim() || "",
    IFSCCode: beneficiaryData.IFSCCode?.trim() || "",
    BankName: beneficiaryData.BankName?.trim() || "",
    BankAddress: beneficiaryData.BankAddress?.trim() || "",
    
    IsDefault: beneficiaryData.IsDefault ?? 0,
    Status: beneficiaryData.Status ?? 1   // usually 1 = active
  };

  console.log("updateEmployeeBeneficiaryAccount payload:", payload);

  try {
    const response = await API.post("/UpdateEmployeeBeneficiaryAccount", payload);
    console.log("UpdateEmployeeBeneficiaryAccount response:", response.data);

    const result = response.data?.result;
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update beneficiary account");
    }

    return {
      success: true,
      beneficiaryId: result.IN_BENEFICIARY_ID || payload.BeneficiaryID,
      message: "Beneficiary account updated successfully"
    };
  } catch (error) {
    console.error("updateEmployeeBeneficiaryAccount error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update beneficiary account";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteEmployeeBeneficiaryAccount = async (beneficiaryId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // BeneficiaryID is mandatory
  if (!beneficiaryId && beneficiaryId !== 0) {
    const validationError = new Error("BeneficiaryID is required to delete beneficiary account.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    BeneficiaryID: beneficiaryId
  };

  console.log("deleteEmployeeBeneficiaryAccount payload:", payload);

  try {
    const response = await API.post("/DeleteEmployeeBeneficiaryAccount", payload);
    const result = response.data?.result;

    // Validate backend response (following same pattern as deleteEmployee)
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete beneficiary account");
    }

    return {
      success: true,
      beneficiaryId: result.IN_BENEFICIARY_ID || beneficiaryId,
      message: "Beneficiary account deleted successfully"
    };
  } catch (error) {
    console.error("deleteEmployeeBeneficiaryAccount error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete beneficiary account";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getEmployeeShiftList = async (clinicId = 0, options = {}) => {
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

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    ClinicID: finalClinicId,
    EmployeeID: options.EmployeeID || 0,   
    ShiftID: options.ShiftID || 0
  };

  try {
    const response = await API.post("/GetEmployeeShiftList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetEmployeeShiftList response:", results);

    return results.map((item) => ({
      shiftMapId: item.ShiftMapID,
      clinicId: item.ClinicID,
      employeeId: item.EmployeeID,
      employeeName: item.EmployeeName || "",
      employeeCode: item.EmployeeCode || "",
      shiftId: item.ShiftID,
      shiftName: item.ShiftName || "Unknown",
      shiftStartTime: item.ShiftStartTime || null, 
      shiftEndTime: item.ShiftEndTime || null,     
    }));
  } catch (error) {
    console.error("getEmployeeShiftList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch employee shifts"
    };

    throw err;
  }
};

export const addEmployeeShift = async (shiftData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation
  if (!shiftData?.EmployeeID) {
    const validationError = new Error("EmployeeID is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!shiftData?.ShiftID) {
    const validationError = new Error("ShiftID is required");
    validationError.status = 400;
    throw validationError;
  }

  // ClinicID: use global/session value in production, allow override in dev
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (shiftData.ClinicID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    EmployeeID: parseInt(shiftData.EmployeeID),
    ShiftID: parseInt(shiftData.ShiftID)
  };

  console.log("Add Employee Shift payload:", payload);

  try {
    const response = await API.post("/AddEmployeeShift", payload);

    console.log("AddEmployeeShift response:", response.data);

    const result = response.data?.result;

    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to assign shift to employee");
    }

    return {
      success: true,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addEmployeeShift failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to assign shift to employee"
    };

    throw errorWithStatus;
  }
};

export const deleteEmployeeShift = async (shiftMapId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!shiftMapId && shiftMapId !== 0) {
    const validationError = new Error("ShiftMapID is required to delete an employee shift.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ShiftMapID: shiftMapId
  };

  console.log("deleteEmployeeShift payload:", payload);

  try {
    const response = await API.post("/DeleteEmployeeShift", payload);
    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete employee shift");
    }

    return {
      success: true,
      shiftMapId: result.IN_ShiftMapID || shiftMapId, 
      message: "Employee shift deleted successfully"
    };

  } catch (error) {
    console.error("deleteEmployeeShift error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete employee shift";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getShiftList = async (clinicId = 0, options = {}) => {
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

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    ShiftID: options.ShiftID || 0,
    ClinicID: finalClinicId,
    ShiftName: options.ShiftName || "",
    Status: options.Status ?? -1   
  };

  try {
    const response = await API.post("/GetWorkShiftList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetWorkShiftList response:", results);

    return results.map((shift) => ({
      id: shift.shift_id,
      uniqueSeq: shift.unique_seq,
      clinicId: shift.clinic_id,
      clinicName: shift.clinic_name,
      shiftName: shift.shift_name || "Unnamed Shift",
      timeStart: shift.shift_time_start || null,  
      timeEnd: shift.shift_time_end || null,       
      workingHours: shift.working_hours || null,   
      status: shift.status === 1 ? "active" : "inactive",
      statusDesc: shift.status_desc || "Unknown",
      dateCreated: shift.date_created || null,
      dateModified: shift.date_modified || null
    }));
  } catch (error) {
    console.error("getShiftList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch work shifts"
    };

    throw err;
  }
};

export const addShift = async (shiftData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!shiftData?.ShiftName) {
    const validationError = new Error("Shift name is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!shiftData?.ShiftTimeStart || !shiftData?.ShiftTimeEnd) {
    const validationError = new Error("Start time and end time are required");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (shiftData.clinicId < 0 || (shiftData.clinicId !== 0 && isNaN(shiftData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (shiftData.clinicId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    ShiftName: shiftData.ShiftName?.trim() || "",
    ShiftTimeStart: shiftData.ShiftTimeStart || "",   
    ShiftTimeEnd: shiftData.ShiftTimeEnd || "",       
    WorkingHours: shiftData.WorkingHours ?? null     
  };

  console.log("Add Work Shift payload:", payload);

  try {
    const response = await API.post("/AddWorkShift", payload);

    console.log("AddWorkShift response:", response.data);

    const result = response.data?.result;

    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add work shift");
    }

    return {
      success: true,
      shiftId: result.OUT_SHIFT_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addShift failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message: 
        error.response?.data?.message || 
        error.response?.data?.result?.OUT_ERROR ||
        error.message || 
        "Failed to add work shift"
    };

    throw errorWithStatus;
  }
};

export const updateShift = async (shiftData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!shiftData?.ShiftID && shiftData?.ShiftID !== 0) {
    const validationError = new Error("ShiftID is required to update a work shift.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (!shiftData?.ClinicID && shiftData?.ClinicID !== 0) {
    const validationError = new Error("ClinicID is required to update a work shift.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (shiftData.ClinicID < 0 || (shiftData.ClinicID !== 0 && isNaN(shiftData.ClinicID))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (shiftData.ClinicID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ShiftID: shiftData.ShiftID || 0,
    ClinicID: finalClinicId,
    ShiftName: shiftData.ShiftName?.trim() || "",
    ShiftTimeStart: shiftData.ShiftTimeStart?.trim() || "",   
    ShiftTimeEnd: shiftData.ShiftTimeEnd?.trim() || "",       
    WorkingHours: shiftData.WorkingHours ?? null,             
    Status: shiftData.Status ?? 1                           
  };

  console.log("updateShift payload:", payload);

  try {
    const response = await API.post("/UpdateWorkShift", payload);
    console.log("UpdateWorkShift response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update work shift");
    }

    return {
      success: true,
      shiftId: result.IN_SHIFT_ID || shiftData.ShiftID, 
      message: "Work shift updated successfully"
    };

  } catch (error) {
    console.error("updateShift error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update work shift";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteShift = async (shiftId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!shiftId && shiftId !== 0) {
    const validationError = new Error("ShiftID is required to delete a work shift.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ShiftID: shiftId
  };

  console.log("deleteShift payload:", payload);

  try {
    const response = await API.post("/DeleteWorkShift", payload);
    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete work shift");
    }

    return {
      success: true,
      shiftId: result.IN_SHIFT_ID || shiftId,   
      message: "Work shift deleted successfully"
    };

  } catch (error) {
    console.error("deleteShift error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete work shift";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getWorkDaysList = async (clinicId = 0, employeeId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // EmployeeID is required for this API
  if (!employeeId || isNaN(employeeId) || employeeId <= 0) {
    const error = new Error("Valid Employee ID is required");
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

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    EmployeeID: parseInt(employeeId)
  };

  try {
    const response = await API.post("/GetWorkDays", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetWorkDays response:", results);

    return results.map((day) => ({
      id: day.work_days_id,
      uniqueSeq: day.unique_seq,
      clinicId: day.clinic_id,
      employeeId: day.employee_id,
      workDay: day.work_day,                    // 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
      status: day.status === 1 ? "active" : "inactive",
      dateCreated: day.date_created || null,
      dateModified: day.date_modified || null
    }));
  } catch (error) {
    console.error("getWorkDays failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch work days"
    };

    throw err;
  }
};

export const addWorkDays = async (workdayData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation
  if (!workdayData?.EmployeeID) {
    const validationError = new Error("EmployeeID is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!workdayData?.WorkDay) {
    const validationError = new Error("WorkDay is required");
    validationError.status = 400;
    throw validationError;
  }

  // Validate WorkDay value (assuming 1-7, Monday=1 ... Sunday=7)
  const workdayValue = parseInt(workdayData.WorkDay);
  if (isNaN(workdayValue) || workdayValue < 1 || workdayValue > 7) {
    const validationError = new Error("WorkDay must be a number between 1 and 7");
    validationError.status = 400;
    throw validationError;
  }

  // ClinicID: use global/session value in production, allow override in dev
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (workdayData.ClinicID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    EmployeeID: parseInt(workdayData.EmployeeID),
    WorkDay: workdayValue
  };

  console.log("Add Workdays payload:", payload);

  try {
    const response = await API.post("/AddWorkDays", payload);

    console.log("AddWorkDays response:", response.data);

    const result = response.data?.result;

    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add workday for employee");
    }

    return {
      success: true,
      message: result.OUT_ERROR || "OK",
      workDaysId: result.OUT_WORK_DAYS_ID || null
    };

  } catch (error) {
    console.error("addWorkdays failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add workday for employee"
    };

    throw errorWithStatus;
  }
};

export const deleteWorkDays = async (workDaysId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!workDaysId && workDaysId !== 0) {
    const validationError = new Error("WorkDaysID is required to delete work days record.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    WorkDaysID: workDaysId       
  };

  console.log("deleteWorkDays payload:", payload);

  try {
    const response = await API.post("/DeleteWorkDays", payload);
    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete work days record");
    }

    return {
      success: true,
      workDaysId: result.IN_WORK_DAYS_ID || workDaysId,
      message: "Work days record deleted successfully"
    };

  } catch (error) {
    console.error("deleteWorkDays error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete work days record";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getPatientsList = async (clinicId = 0, options = {}) => {
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

  // Determine final IDs based on environment (same logic as employees)
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    PatientID: options.PatientID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    FirstName: options.FirstName || "",
    LastName: options.LastName || "",
    FileNo: options.FileNo || "",
    Name: options.Name || "",
    Mobile: options.Mobile || "",
    Gender: options.Gender ?? 0,
    BloodGroup: options.BloodGroup ?? 0,
    FamilyPatientID: options.FamilyPatientID || 0,
    Status: options.Status ?? -1
  };

  console.log("get Patients payload:", payload);

  try {
    const response = await API.post("/GetPatientList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetPatientList response:", results);

    return results.map((patient) => ({
      id: patient.patient_id,
      uniqueSeq: patient.unique_seq,
      clinicId: patient.clinic_id,
      clinicName: patient.clinic_name,
      branchId: patient.branch_id,
      branchName: patient.branch_name,
      fileNo: patient.file_no,
      patientName: patient.patient_name,
      firstName: patient.first_name,
      lastName: patient.last_name,
      gender: patient.gender,               
      genderDesc: patient.gender_desc || "Unknown",
      birthDate: patient.birth_date || null,
      age: patient.age || null,             
      bloodGroup: patient.blood_group,    
      bloodGroupDesc: patient.blood_group_desc || null,
      maritalStatus: patient.marital_status,
      maritalStatusDesc: patient.marital_status_desc || null,
      mobile: patient.mobile || null,
      altMobile: patient.alt_mobile || null,
      email: patient.email || null,
      address: patient.address || null,
      emergencyContactNo: patient.emergency_contact_no || null,
      allergies: patient.allergies || null,
      existingMedicalConditions: patient.existing_medical_conditions || null,
      pastSurgeries: patient.past_surgeries || null,
      currentMedications: patient.current_medications || null,
      familyMedicalHistory: patient.family_medical_history || null,
      immunizationRecords: patient.immunization_records || null,
      familyPatientId: patient.family_patient_id,
      status: patient.status === 1 ? "active" : "inactive",
      statusDesc: patient.status_desc || "Unknown",
      dateCreated: patient.date_created,
      dateModified: patient.date_modified
    }));
  } catch (error) {
    console.error("getPatientsList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch patients"
    };

    throw err;
  }
};

export const addPatient = async (patientData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust as per your backend requirements)
  if (!patientData?.firstName || !patientData?.lastName) {
    const validationError = new Error("First name and last name are required");
    validationError.status = 400;
    throw validationError;
  }

  if (!patientData?.mobile) {
    const validationError = new Error("Mobile number is required");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: stricter ClinicID validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (patientData.clinicId < 0 || (patientData.clinicId !== 0 && isNaN(patientData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (patientData.clinicId);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (patientData.branchID);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    FirstName: patientData.firstName || "",
    LastName: patientData.lastName  || "",
    Gender: patientData.gender ??  0,
    BirthDate: patientData.birthDate ||  "",
    Age: patientData.age ??  0,                    
    BloodGroup: patientData.bloodGroup ??  0,
    PhotoFileID: patientData.photoFileId ??  0,
    MaritalStatus: patientData.maritalStatus ??  0,
    Mobile: patientData.mobile ||  "",
    AltMobile: patientData.altMobile || "",
    Email: patientData.email ||  "",
    Address: patientData.address || "",
    EmergencyContactNo: patientData.emergencyContactNo ||  "",
    Allergies: patientData.allergies || "No Allergies",
    ExistingMedicalConditions: patientData.existingMedicalConditions || "Not reported",
    PastSurgeries: patientData.pastSurgeries ||  "Nothing",
    CurrentMedications: patientData.currentMedications || "NA",
    FamilyMedicalHistory: patientData.familyMedicalHistory ||  "",
    ImmunizationRecords: patientData.immunizationRecords || "Not Available",
    FamilyPatientID: patientData.familyPatientId ?? 0,
  };

  console.log("Add Patient Payload:", payload);

  try {
    const response = await API.post("/AddPatient", payload);

    console.log("AddPatient response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add patient");
    }

    // Return success with new patient ID
    return {
      success: true,
      patientId: result.OUT_PATIENT_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addPatient failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add patient"
    };

    throw errorWithStatus;
  }
};

export const updatePatient = async (patientData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // PatientID is mandatory for update
  if (!patientData?.patientId && patientData?.patientId !== 0) {
    const validationError = new Error("PatientID is required to update a patient.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is also typically required
  if (!patientData?.clinicId && patientData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update a patient.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (patientData.clinicId < 0 || (patientData.clinicId !== 0 && isNaN(patientData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (patientData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (patientData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    PatientID: patientData.patientId || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    FirstName: patientData.firstName?.trim() || "",
    LastName: patientData.lastName?.trim() || "",
    Gender: patientData.gender ?? 0,
    BirthDate: patientData.birthDate?.trim() || "",
    Age: patientData.age ?? 0,
    BloodGroup: patientData.bloodGroup ?? 0,
    PhotoFileID: patientData.photoFileId ?? 0,
    MaritalStatus: patientData.maritalStatus ?? 0,
    Mobile: patientData.mobile?.trim() || "",
    AltMobile: patientData.altMobile?.trim() || "",
    Email: patientData.email?.trim() || "",
    Address: patientData.address?.trim() || "",
    EmergencyContactNo: patientData.emergencyContactNo?.trim() || "",
    Allergies: patientData.allergies?.trim() || "",
    ExistingMedicalConditions: patientData.existingMedicalConditions?.trim() || "",
    PastSurgeries: patientData.pastSurgeries?.trim() || "",
    CurrentMedications: patientData.currentMedications?.trim() || "",
    FamilyMedicalHistory: patientData.familyMedicalHistory?.trim() || "",
    ImmunizationRecords: patientData.immunizationRecords?.trim() || "",
    FamilyPatientID: patientData.familyPatientId ?? 0,
    Status: patientData.status ?? 1  // usually 1 = active
  };

  console.log("updatePatient payload:", payload);

  try {
    const response = await API.post("/UpdatePatient", payload);
    console.log("UpdatePatient response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update patient");
    }

    return {
      success: true,
      patientId: result.IN_PATIENT_ID || patientData.patientId,
      message: "Patient updated successfully"
    };

  } catch (error) {
    console.error("updatePatient error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update patient";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deletePatient = async (patientId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // PatientID is mandatory for delete
  if (!patientId && patientId !== 0) {
    const validationError = new Error("PatientID is required to delete a patient.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    PatientID: patientId
  };

  console.log("deletePatient payload:", payload);

  try {
    const response = await API.post("/DeletePatient", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete patient");
    }

    return {
      success: true,
      patientId: result.IN_PATIENT_ID || patientId,
      message: "Patient deleted successfully"
    };

  } catch (error) {
    console.error("deletePatient error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete patient";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getSlotConfigList = async (clinicId = 0, options = {}) => {
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

  // Determine final IDs based on environment (same logic as getEmployeeList)
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 40,
    SlotConfigID: options.SlotConfigID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    DoctorID: options.DoctorID || 0,
    DoctorName: options.DoctorName || "",
    ShiftID: options.ShiftID || 0,
    Duration: options.Duration || 0,
    Status: options.Status ?? -1
  };

  console.log("getSlotConfig payload:", payload);

  try {
    const response = await API.post("/GetSlotConfigList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetSlotConfigList response:", results);

    return results.map((config) => ({
      id: config.slot_config_id,
      uniqueSeq: config.unique_seq,
      clinicId: config.clinic_id,
      clinicName: config.clinic_name,
      branchId: config.branch_id,
      branchName: config.branch_name,
      doctorId: config.doctor_id,
      doctorFullName: config.doctor_full_name,
      doctorCode: config.doctor_code,
      doctorName: config.doctor_name,
      shiftId: config.shift_id,
      shiftName: config.shift_name,
      duration: config.duration,
      durationDesc: config.duration_desc || "Unknown",
      slotSpecificDate: config.slot_specific_date || null,
      slotDate: config.slot_date || null,
      slotInterval: config.slot_interval,
      createSlotDays: config.create_slot_days,
      status: config.status === 1 ? "active" : "inactive",
      statusDesc: config.status_desc || "Unknown",
      dateCreated: config.date_created,
      dateModified: config.date_modified
    }));
  } catch (error) {
    console.error("getSlotConfig failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch slot configurations"
    };

    throw err;
  }
};

export const addSlotConfig = async (slotConfigData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust as per your backend rules)
  if (!slotConfigData?.doctorId || !slotConfigData?.shiftId) {
    const validationError = new Error("Doctor ID and Shift ID are required");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: Add more validations if needed (e.g., Duration > 0, SlotInterval > 0, etc.)
  if (slotConfigData.duration <= 0 || slotConfigData.slotInterval <= 0 || slotConfigData.createSlotDays <= 0) {
    const validationError = new Error("Duration, SlotInterval, and CreateSlotDays must be positive numbers");
    validationError.status = 400;
    throw validationError;
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (slotConfigData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (slotConfigData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    DoctorID: slotConfigData.doctorId,
    ShiftID: slotConfigData.shiftId,
    Duration: slotConfigData.duration ?? 0,
    SlotDate: slotConfigData.slotDate || "",  // Empty string if not provided (as in your example)
    SlotInterval: slotConfigData.slotInterval ?? 15,
    CreateSlotDays: slotConfigData.createSlotDays ?? 0
  };

  console.log("Add SlotConfig", payload);

  try {
    const response = await API.post("/AddSlotConfig", payload);

    console.log("AddSlotConfig response:", response.data);

    const result = response.data?.result;

    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add slot configuration");
    }

    return {
      success: true,
      slotConfigId: result.OUT_SLOT_CONFIG_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addSlotConfig failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message: 
        error.response?.data?.message || 
        error.response?.data?.result?.OUT_ERROR ||
        error.message || 
        "Failed to add slot configuration"
    };

    throw errorWithStatus;
  }
};

export const deleteSlotConfig = async (slotConfigId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // SlotConfigID is mandatory for delete
  if (!slotConfigId && slotConfigId !== 0) {
    const validationError = new Error("SlotConfigID is required to delete a slot configuration.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    SlotConfigID: slotConfigId
  };

  console.log("deleteSlotConfig payload:", payload);

  try {
    const response = await API.post("/DeleteSlotConfig", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete slot configuration");
    }

    return {
      success: true,
      slotConfigId: result.IN_SLOT_CONFIG_ID || slotConfigId,
      message: "Slot configuration deleted successfully"
    };

  } catch (error) {
    console.error("deleteSlotConfig error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete slot configuration";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const generateSlots = async (slotData = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // ClinicID is required (same logic as updateEmployee)
  if (!slotData?.clinicId && slotData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to generate slots.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const hasDateRange = !!(slotData.fromDate && slotData.toDate);
  const hasDaysAhead = slotData.daysAhead !== undefined && Number.isInteger(slotData.daysAhead) && slotData.daysAhead > 0;

  if (!hasDateRange && !hasDaysAhead) {
    const validationError = new Error("You must provide either (FromDate + ToDate) or DaysAhead > 0.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional: warn if both are provided (backend might ignore one)
  if (hasDateRange && hasDaysAhead) {
    console.warn(
      "generateSlots: Both date range (FromDate/ToDate) and DaysAhead provided. " +
      "Backend behavior may be unpredictable — consider using only one method."
    );
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (slotData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (slotData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    DaysAhead: hasDaysAhead ? Number(slotData.daysAhead) : 0,
    FromDate: slotData.fromDate?.trim() || "",
    ToDate: slotData.toDate?.trim() || ""
  };

  console.log("generateSlots payload:", payload);

  try {
    const response = await API.post("/GenerateSlots", payload);
    console.log("GenerateSlots response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      const errorMsg = result?.OUT_ERROR || "Failed to generate slots";
      throw new Error(errorMsg);
    }

    return {
      success: true,
      message: "Slots generated successfully",
    };

  } catch (error) {
    console.error("generateSlots error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to generate slots";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const getSlotList = async (clinicId = 0, options = {}) => {
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
    SlotConfigID: options.SlotConfigID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    DoctorID: options.DoctorID || 0,
    DoctorName: options.DoctorName || "",
    SlotDate: options.SlotDate || "",           
    FromSlotDate: options.FromSlotDate || "",   
    ToSlotDate: options.ToSlotDate || "",       
    IsBooked: options.IsBooked ?? -1,           
    Status: options.Status ?? -1               
  };

  console.log("get SlotList payload:", payload);

  try {
    const response = await API.post("/GetSlotList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetSlotList response:", results);

    return results.map((slot) => ({
      id: slot.slot_id,
      uniqueSeq: slot.unique_seq,
      clinicId: slot.clinic_id,
      clinicName: slot.clinic_name,
      branchId: slot.branch_id,
      branchName: slot.branch_name,
      doctorId: slot.doctor_id,
      doctorFullName: slot.doctor_full_name,
      doctorCode: slot.doctor_code,
      doctorName: slot.doctor_name,
      slotDate: slot.slot_date || null,           
      slotTime: slot.slot_time || null,           
      isBooked: !!slot.is_booked,                 
      bookedDesc: slot.booked_desc || "Unknown",
      appointmentId: slot.appointment_id ?? null,
      status: slot.status === 1 ? "active" : "inactive",
      statusDesc: slot.status_desc || "Unknown",
      dateCreated: slot.date_created || null,
      dateModified: slot.date_modified || null
    }));
  } catch (error) {
    console.error("getSlotList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch slots"
    };

    throw err;
  }
};

export const addSlot = async (slotData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation
  if (!slotData?.doctorId || !slotData?.slotDate || !slotData?.slotTime) {
    const validationError = new Error("Doctor ID, Slot Date, and Slot Time are required");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: basic format check for date and time (you can make it stricter if needed)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slotData.slotDate)) {
    const validationError = new Error("Slot Date must be in YYYY-MM-DD format");
    validationError.status = 400;
    throw validationError;
  }

  if (!/^\d{2}:\d{2}:\d{2}$/.test(slotData.slotTime)) {
    const validationError = new Error("Slot Time must be in HH:MM:SS format");
    validationError.status = 400;
    throw validationError;
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (slotData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (slotData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    DoctorID: slotData.doctorId,
    SlotDate: slotData.slotDate,
    SlotTime: slotData.slotTime
  };

  console.log("Add Slot", payload);

  try {
    const response = await API.post("/AddSlot", payload);

    console.log("AddSlot response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add slot");
    }

    // Return success with new slot ID
    return {
      success: true,
      slotId: result.OUT_SLOT_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addSlot failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message: 
        error.response?.data?.message || 
        error.response?.data?.result?.OUT_ERROR ||
        error.message || 
        "Failed to add slot"
    };

    throw errorWithStatus;
  }
};

export const deleteSlot = async (slotId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // SlotID is mandatory for delete
  if (!slotId && slotId !== 0) {
    const validationError = new Error("SlotID is required to delete a slot.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    SlotID: slotId
  };

  console.log("deleteSlot payload:", payload);

  try {
    const response = await API.post("/DeleteSlot", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete slot");
    }

    return {
      success: true,
      slotId: result.IN_SLOT_ID || slotId,
      message: "Slot deleted successfully"
    };

  } catch (error) {
    console.error("deleteSlot error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete slot";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const updateSlot = async (slotData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // SlotID is mandatory for update
  if (!slotData?.slotId && slotData?.slotId !== 0) {
    const validationError = new Error("SlotID is required to update a slot.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    SlotID: slotData.slotId,          
    AppointmentID: slotData.appointmentId ?? 0,   
    IsBooked: slotData.isBooked ?? 0            
  };

  console.log("updateSlot payload:", payload);

  try {
    const response = await API.post("/UpdateSlot", payload);
    console.log("UpdateSlot response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update slot");
    }

    return {
      success: true,
      slotId: result.IN_SLOT_ID || slotData.slotId,  // echo back the updated ID
      message: "Slot updated successfully"
    };

  } catch (error) {
    console.error("updateSlot error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update slot";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const getAppointmentList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Optional: stricter validation in development/testing
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
    AppointmentID: options.AppointmentID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    DoctorID: options.DoctorID || 0,
    DoctorName: options.DoctorName || "",
    AppointmentDate: options.AppointmentDate || "",    
    FromDate: options.FromDate || "",                 
    ToDate: options.ToDate || "",                     
    SlotID: options.SlotID || 0,
    Status: options.Status ?? -1                      
  };

  console.log("getAppointmentList payload:", payload);

  try {
    const response = await API.post("/GetAppointmentList", payload);
    
    const results = Array.isArray(response.data?.result) 
      ? response.data.result 
      : [];
    
    console.log("GetAppointmentList response count:", results);

    return results.map((appt) => ({
      id: appt.appointment_id,
      uniqueSeq: appt.unique_seq,
      clinicId: appt.clinic_id,
      clinicName: appt.clinic_name,
      branchId: appt.branch_id,
      branchName: appt.branch_name,
      patientId: appt.patient_id,
      patientName: appt.patient_name,
      patientMobile: appt.patient_mobile,
      patientFileNo: appt.patient_file_no,
      doctorId: appt.doctor_id,
      doctorFullName: appt.doctor_full_name,
      doctorCode: appt.doctor_code,
      doctorName: appt.doctor_name,
      appointmentDate: appt.appointment_date,    // ISO string
      appointmentTime: appt.appointment_time,    // "HH:mm:ss"
      reason: appt.reason || "",
      slotId: appt.slot_id,
      status: appt.status,
      statusDesc: appt.status_desc || "Unknown",
      dateCreated: appt.date_created,
      dateModified: appt.date_modified
    }));
  } catch (error) {
    console.error("getAppointmentList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch appointments"
    };

    throw err;
  }
};

export const addAppointment = async (appointmentData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!appointmentData?.patientId) {
    throw Object.assign(new Error("Patient is required"), { status: 400 });
  }
  if (!appointmentData?.doctorId) {
    throw Object.assign(new Error("Doctor is required"), { status: 400 });
  }
  if (!appointmentData?.slotId) {
    throw Object.assign(new Error("Appointment slot is required"), { status: 400 });
  }

  if (PRODUCTION_MODE !== true) {
    if (appointmentData.clinicId && (appointmentData.clinicId < 0 || isNaN(appointmentData.clinicId))) {
      throw Object.assign(new Error("Invalid Clinic ID"), { status: 400 });
    }
    if (appointmentData.branchId && (appointmentData.branchId < 0 || isNaN(appointmentData.branchId))) {
      throw Object.assign(new Error("Invalid Branch ID"), { status: 400 });
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (appointmentData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (appointmentData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PatientID: parseInt(appointmentData.patientId),
    DoctorID: parseInt(appointmentData.doctorId),
    SlotID: parseInt(appointmentData.slotId),
    Reason: appointmentData.reason?.trim() || ""
  };

  console.log("Add Appointment payload:", payload);

  try {
    const response = await API.post("/AddAppointment", payload);

    console.log("AddAppointment response:", response.data);

    const result = response.data?.result;
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response structure from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to create appointment");
    }
    return {
      success: true,
      appointmentId: result.OUT_APPOINTMENT_ID,
      message: result.OUT_ERROR || "Appointment created successfully"
    };

  } catch (error) {
    console.error("addAppointment failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to create appointment"
    };

    throw errorWithStatus;
  }
};

export const cancelAppointment = async (appointmentId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  if (!appointmentId || isNaN(appointmentId) || appointmentId <= 0) {
    const validationError = new Error("Valid AppointmentID is required to cancel an appointment.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    AppointmentID: parseInt(appointmentId)
  };

  console.log("cancelAppointment payload:", payload);

  try {
    const response = await API.post("/CancelAppointment", payload);
    const result = response.data?.result;

    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to cancel appointment");
    }

    return {
      success: true,
      appointmentId: result.IN_APPOINTMENT_ID || appointmentId,
      message: "Appointment cancelled successfully"
    };

  } catch (error) {
    console.error("cancelAppointment error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to cancel appointment";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getPatientVisitList = async (clinicId = 0, options = {}) => {
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
    VisitID: options.VisitID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    DoctorID: options.DoctorID || 0,
    DoctorName: options.DoctorName || "",
    AppointmentID: options.AppointmentID || 0,
    VisitDate: options.VisitDate || "",           // exact date
    FromVisitDate: options.FromVisitDate || "",   // date range start
    ToVisitDate: options.ToVisitDate || "",       // date range end
    Reason: options.Reason || ""
  };

  console.log("getPatientVisitList payload:", payload);

  try {
    const response = await API.post("/GetPatientVisitList", payload);
    
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetPatientVisitList response:", results);

    return results.map((visit) => ({
      id: visit.visit_id,
      uniqueSeq: visit.unique_seq,
      clinicId: visit.clinic_id,
      clinicName: visit.clinic_name,
      branchId: visit.branch_id,
      branchName: visit.branch_name,
      appointmentId: visit.appointment_id,
      patientId: visit.patient_id,
      patientName: visit.patient_name,
      patientMobile: visit.patient_mobile,
      patientFileNo: visit.patient_file_no,
      doctorId: visit.doctor_id,
      doctorFullName: visit.doctor_full_name,
      doctorCode: visit.doctor_code,
      doctorName: visit.doctor_name,           // might be same as full name or short name
      visitDate: visit.visit_date || null,      // ISO string
      visitTime: visit.visit_time || null,      // "HH:mm:ss"
      reason: visit.reason || "",
      symptoms: visit.symptoms || "",
      bpSystolic: visit.bp_systolic || null,
      bpDiastolic: visit.bp_diastolic || null,
      bpReading: visit.bp_reading || null,      // formatted "130/90"
      temperature: visit.temperature || null,
      weight: visit.weight || null,
      consultationId: visit.consultation_id,
      status: visit.status,
      dateCreated: visit.date_created || null,
      dateModified: visit.date_modified || null
    }));
  } catch (error) {
    console.error("getPatientVisitList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch patient visits"
    };

    throw err;
  }
};

export const addPatientVisit = async (visitData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required field validation
  if (!visitData?.PatientID) {
    const validationError = new Error("Patient ID is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!visitData?.DoctorID) {
    const validationError = new Error("Doctor ID is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!visitData?.VisitDate) {
    const validationError = new Error("Visit date is required");
    validationError.status = 400;
    throw validationError;
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (visitData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (visitData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    AppointmentID: visitData.appointmentId ?? 0,      // optional
    PatientID: parseInt(visitData.PatientID),         // mostly required
    DoctorID: parseInt(visitData.DoctorID),           // required
    VisitDate: visitData.VisitDate || "",             // YYYY-MM-DD
    VisitTime: visitData.VisitTime || "",             // HH:MM:SS or HH:MM
    Reason: visitData.reason || "",
    Symptoms: visitData.symptoms || "",
    BPSystolic: visitData.bpSystolic ?? 0,
    BPDiastolic: visitData.bpDiastolic ?? 0,
    Temperature: visitData.temperature ?? 0,
    Weight: visitData.weight ?? 0,
  };

  console.log("Add Patient Visit Payload:", payload);

  try {
    const response = await API.post("/AddPatientVisit", payload);
    console.log("AddPatientVisit response:", response.data);

    const result = response.data?.result;

    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response structure from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to create patient visit");
    }
    return {
      success: true,
      visitId: result.OUT_VISIT_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addPatientVisit failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add patient visit"
    };

    throw errorWithStatus;
  }
};

export const updatePatientVisit = async (visitData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // VisitID is mandatory for update
  if (!visitData?.visitId && visitData?.visitId !== 0) {
    const validationError = new Error("VisitID is required to update a patient visit.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    VisitID: visitData.visitId || 0,
    AppointmentID: visitData.appointmentId ?? 0,
    DoctorID: visitData.doctorId ?? 0,
    VisitDate: visitData.visitDate?.trim() || "",
    VisitTime: visitData.visitTime?.trim() || "",
    Reason: visitData.reason?.trim() || "",
    Symptoms: visitData.symptoms?.trim() || "",
    BPSystolic: visitData.bpSystolic ?? 0,
    BPDiastolic: visitData.bpDiastolic ?? 0,
    Temperature: visitData.temperature ?? 0,
    Weight: visitData.weight ?? 0,
    Status: visitData.status ?? 0,
  };

  console.log("updatePatientVisit payload:", payload);

  try {
    const response = await API.post("/UpdatePatientVisit", payload);
    console.log("UpdatePatientVisit response:", response.data);
    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update patient visit");
    }

    return {
      success: true,
      visitId: result.IN_VISIT_ID || visitData.visitId,
      message: "Patient visit updated successfully"
    };

  } catch (error) {
    console.error("updatePatientVisit error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update patient visit";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};













