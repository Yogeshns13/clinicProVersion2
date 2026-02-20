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

export const getConsultationList = async (clinicId = 0, options = {}) => {
  const userId = getUserId();
  if (!userId) throw new Error("User not logged in");

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    ConsultationID: options.ConsultationID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    VisitID: options.VisitID || 0,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    DoctorID: options.DoctorID || 0,
    DoctorName: options.DoctorName || "",
    FromDate: options.FromDate || "",
    ToDate: options.ToDate || "",
    NextConsultationDate: options.NextConsultationDate || "",
    InvoiceID: options.InvoiceID || 0,
  };
  console.log("Consultation Payload:",payload)

  try {
    const response = await API.post("/GetConsultationList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("Consultation result:",results)

    return results.map((consult) => ({
      id: consult.consultation_id,
      uniqueSeq: consult.unique_seq,
      clinicId: consult.clinic_id,
      clinicName: consult.clinic_name,
      branchId: consult.branch_id,
      branchName: consult.branch_name,
      visitId: consult.visit_id,
      patientId: consult.patient_id,
      patientName: consult.patient_name || "",
      patientMobile: consult.patient_mobile || "",
      patientFileNo: consult.patient_file_no || "",
      doctorId: consult.doctor_id,
      doctorFullName: consult.doctor_full_name || "",
      doctorCode: consult.doctor_code || "",
      reason: consult.reason || "",
      symptoms: consult.symptoms || "",
      bpSystolic: consult.bp_systolic ?? null,
      bpDiastolic: consult.bp_diastolic ?? null,
      bpReading: consult.bp_reading || "",
      temperature: consult.temperature ?? null,
      weight: consult.weight ?? null,
      emrNotes: consult.emr_notes || "",
      ehrNotes: consult.ehr_notes || "",
      instructions: consult.instructions || "",
      consultationNotes: consult.consultation_notes || "",
      nextConsultationDate: consult.next_consultation_date || null,
      treatmentPlan: consult.treatment_plan || "",
      invoiceId: consult.invoice_id ?? null,
      dateCreated: consult.date_created,
      dateModified: consult.date_modified,
    }));
  } catch (error) {
    console.error("getConsultationList failed:", error);
    throw {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || "Failed to fetch consultations",
    };
  }
};

export const addConsultation = async (consultationData) => {
  const userId = getUserId();
  if (!userId) throw new Error("User not logged in");

  if (!consultationData?.patientId || !consultationData?.doctorId || !consultationData?.visitId) {
    throw new Error("Patient, Doctor and Visit are required");
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (consultationData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (consultationData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    VisitID: consultationData.visitId,
    PatientID: parseInt(consultationData.patientId),
    DoctorID: parseInt(consultationData.doctorId),
    Reason: consultationData.reason || "",
    Symptoms: consultationData.symptoms || "",
    BPSystolic: consultationData.bpSystolic ?? null,
    BPDiastolic: consultationData.bpDiastolic ?? null,
    Temperature: consultationData.temperature ?? null,
    Weight: consultationData.weight ?? null,
    EMRNotes: consultationData.emrNotes || "",
    EHRNotes: consultationData.ehrNotes || "",
    Instructions: consultationData.instructions || "",
    ConsultationNotes: consultationData.consultationNotes || "",
    NextConsultationDate: consultationData.nextConsultationDate || "",
    TreatmentPlan: consultationData.treatmentPlan || "",
  };

  console.log("Add Consultation:",payload);

  try {
    const response = await API.post("/AddConsultation", payload);
    const result = response.data?.result;

    if (result?.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to create consultation");
    }

    return {
      success: true,
      consultationId: result.OUT_CONSULTATION_ID,
      message: result.OUT_ERROR || "Consultation created",
    };
  } catch (error) {
    console.error("addConsultation failed:", error);
    throw {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.result?.OUT_ERROR || "Failed to add consultation",
    };
  }
};

export const updateConsultation = async (consultationData) => {
  const userId = getUserId();
  if (!userId) throw new Error("User not logged in");

  if (!consultationData?.consultationId) {
    throw new Error("ConsultationID is required to update");
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (consultationData.clinicId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ConsultationID: consultationData.consultationId,
    ClinicID: finalClinicId,
    Reason: consultationData.reason?.trim() || "",
    Symptoms: consultationData.symptoms?.trim() || "",
    BPSystolic: consultationData.bpSystolic ?? 0,
    BPDiastolic: consultationData.bpDiastolic ?? 0,
    Temperature: consultationData.temperature ?? 0,
    Weight: consultationData.weight ?? 0,
    EMRNotes: consultationData.emrNotes?.trim() || "",
    EHRNotes: consultationData.ehrNotes?.trim() || "",
    Instructions: consultationData.instructions?.trim() || "",
    ConsultationNotes: consultationData.consultationNotes?.trim() || "",
    NextConsultationDate: consultationData.nextConsultationDate?.trim() || "",
    TreatmentPlan: consultationData.treatmentPlan?.trim() || "",
  };

  console.log("Update Consultation", payload)

  try {
    const response = await API.post("/UpdateConsultation", payload);
    const result = response.data?.result;

    if (result?.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Update failed");
    }

    return {
      success: true,
      consultationId: result.IN_CONSULTATION_ID || consultationData.consultationId,
      message: "Consultation updated successfully",
    };
  } catch (error) {
    console.error("updateConsultation failed:", error);
    throw new Error(
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      "Failed to update consultation"
    );
  }
};

export const getConsultingChargeConfigList = async (clinicId = 0, options = {}) => {
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

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    ChargeID: options.ChargeID || 0,
    ClinicID: finalClinicId,
    ChargeCode: options.ChargeCode || "",
    ChargeName: options.ChargeName || "",
    Status: options.Status ?? -1
  };

  console.log("get Consulting Charge Config:", payload);

  try {
    const response = await API.post("/GetConsultationChargeConfigList", payload);

    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetConsultationChargeConfigList response:", results);

    return results.map((charge) => ({
      id: charge.charge_id,
      chargeId: charge.charge_id,           // keeping both for compatibility if needed
      clinicId: charge.clinic_id,
      clinicName: charge.clinic_name,
      chargeCode: charge.charge_code || "",
      chargeName: charge.charge_name || "",
      defaultAmount: charge.default_amount 
        ? parseFloat(charge.default_amount) 
        : null,
      cgstPercentage: charge.cgst_percentage 
        ? parseFloat(charge.cgst_percentage) 
        : null,
      sgstPercentage: charge.sgst_percentage 
        ? parseFloat(charge.sgst_percentage) 
        : null,
      amountInclusiveTax: charge.amount_inclusive_tax 
        ? parseFloat(charge.amount_inclusive_tax) 
        : null,
      status: charge.status === 1 ? "active" 
            : charge.status === 2 ? "deleted" 
            : "inactive",
      statusDesc: charge.status_desc || "Unknown",
      dateCreated: charge.date_created || null,
      dateModified: charge.date_modified || null
    }));
  } catch (error) {
    console.error("getConsultingChrgConfigList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch consultation charge configurations"
    };

    throw err;
  }
};

export const addConsultationChargeConfig = async (chargeData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required field validation
  if (!chargeData?.chargeCode?.trim()) {
    const validationError = new Error("Charge Code is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!chargeData?.chargeName?.trim()) {
    const validationError = new Error("Charge Name is required");
    validationError.status = 400;
    throw validationError;
  }

  if (!chargeData?.defaultAmount || isNaN(chargeData.defaultAmount) || Number(chargeData.defaultAmount) < 0) {
    const validationError = new Error("Valid Default Amount is required (must be non-negative number)");
    validationError.status = 400;
    throw validationError;
  }

  // Clinic/Branch handling (same pattern as addEmployee)
  if (PRODUCTION_MODE !== true) {
    if (chargeData.clinicId < 0 || (chargeData.clinicId !== 0 && isNaN(chargeData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (chargeData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (chargeData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    ChargeCode: String(chargeData.chargeCode).trim(),
    ChargeName: String(chargeData.chargeName).trim(),
    DefaultAmount: Number(chargeData.defaultAmount),
    GstNo: chargeData.gstNo ? String(chargeData.gstNo).trim() : "",
    CgstPercentage: Number(chargeData.cgstPercentage),
    SgstPercentage: Number(chargeData.sgstPercentage)
  };

  console.log("Add Consultation Charge Config:", payload);

  try {
    const response = await API.post("/AddConsultationChargeConfig", payload);

    console.log("AddConsultationChargeConfig response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add consultation charge configuration");
    }

    // Return success response
    return {
      success: true,
      chargeId: result.OUT_CHARGE_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addConsultationChargeConfig failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add consultation charge configuration"
    };

    throw errorWithStatus;
  }
};

export const updateConsultationChargeConfig = async (chargeData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Critical fields for update
  if (!chargeData?.chargeId && chargeData?.chargeId !== 0) {
    const validationError = new Error("ChargeID is required to update consultation charge configuration.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID typically required for update
  if (!chargeData?.clinicId && chargeData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update consultation charge configuration.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  if (PRODUCTION_MODE !== true) {
    if (chargeData.clinicId < 0 || (chargeData.clinicId !== 0 && isNaN(chargeData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (chargeData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (chargeData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ChargeID: chargeData.chargeId || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    ChargeCode: chargeData.chargeCode?.trim() || "",
    ChargeName: chargeData.chargeName?.trim() || "",
    DefaultAmount: Number(chargeData.defaultAmount) || 0,
    CgstPercentage: Number(chargeData.cgstPercentage) || 0,
    SgstPercentage: Number(chargeData.sgstPercentage) || 0,
    Status: chargeData.status ?? 1     // 1 = active, usually
  };

  console.log("updateConsultationChargeConfig payload:", payload);

  try {
    const response = await API.post("/UpdateConsultationChargeConfig", payload);
    console.log("UpdateConsultationChargeConfig response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update consultation charge configuration");
    }

    return {
      success: true,
      chargeId: result.IN_CHARGE_ID || chargeData.chargeId,
      message: "Consultation charge configuration updated successfully"
    };

  } catch (error) {
    console.error("updateConsultationChargeConfig error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update consultation charge configuration";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const deleteConsultationChargeConfig = async (chargeId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // ChargeID is mandatory for delete
  if (!chargeId && chargeId !== 0) {
    const validationError = new Error("ChargeID is required to delete consultation charge configuration.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ChargeID: chargeId
  };

  console.log("deleteConsultationChargeConfig payload:", payload);

  try {
    const response = await API.post("/DeleteConsultationChargeConfig", payload);
    const result = response.data?.result;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to delete consultation charge configuration");
    }

    return {
      success: true,
      chargeId: result.IN_CHARGE_ID || chargeId,
      message: "Consultation charge configuration deleted successfully"
    };

  } catch (error) {
    console.error("deleteConsultationChargeConfig error:", error);

    const errorMsg =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to delete consultation charge configuration";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getConsultationChargeList = async (clinicId = 0, options = {}) => {
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

  // Determine final IDs based on environment (consistent with getEmployeeList)
  const finalClinicId  = PRODUCTION_MODE ? getClinicId()  : clinicId;
  const finalBranchId  = PRODUCTION_MODE ? getBranchId()  : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    ConsChargeID: options.ConsChargeID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    ConsultationID: options.ConsultationID || 0,
    VisitID: options.VisitID || 0,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    DoctorID: options.DoctorID || 0,
    ChargeID: options.ChargeID || 0,
    ChargeName: options.ChargeName || "",
    InvoiceID: options.InvoiceID || 0,
    InvoicedOnly: options.InvoicedOnly ?? 0,    // 0 = all, 1 = only invoiced ?
    Status: options.Status ?? -1
  };

  console.log("get Consultation Charge List:", payload);

  try {
    const response = await API.post("/GetConsultationChargeList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetConsultationChargeList response:", results);

    return results.map((item) => ({
      id: item.cons_charge_id,
      uniqueSeq: item.unique_seq,
      clinicId: item.clinic_id,
      clinicName: item.clinic_name,
      branchId: item.branch_id,
      branchName: item.branch_name,

      consultationId: item.consultation_id,
      visitId: item.visit_id,
      patientId: item.patient_id,
      patientName: item.patient_name || "",
      patientMobile: item.patient_mobile || null,
      patientFileNo: item.patient_file_no || null,

      doctorId: item.doctor_id,
      doctorFullName: item.doctor_full_name || "Unknown",

      chargeId: item.charge_id,
      chargeName: item.charge_name || "",
      chargeCode: item.charge_code || "",

      chargeAmount: item.charge_amount ? parseFloat(item.charge_amount) : null,
      cgstPercentage: item.cgst_percentage ? parseFloat(item.cgst_percentage) : null,
      sgstPercentage: item.sgst_percentage ? parseFloat(item.sgst_percentage) : null,
      cgstAmount: item.cgst_amount ? parseFloat(item.cgst_amount) : null,
      sgstAmount: item.sgst_amount ? parseFloat(item.sgst_amount) : null,
      netAmount: item.net_amount ? parseFloat(item.net_amount) : null,

      invoiceId: item.invoice_id ?? null,
      invoiceNo: item.invoice_no ?? null,
      isInvoiced: item.is_invoiced === "Yes" ? true : false,   // or keep as string if preferred

      status: item.status === 1 ? "active" : "inactive",
      statusDesc: item.status_desc || "Unknown",
      dateCreated: item.date_created || null,
      dateModified: item.date_modified || null
    }));
  } catch (error) {
    console.error("getConsultationChargeList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch consultation charges"
    };

    throw err;
  }
};

export const addConsultationCharge = async (chargeData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation (adjust as per your backend rules)
  if (!chargeData?.consultationId || chargeData.consultationId <= 0) {
    const validationError = new Error("ConsultationID is required and must be a positive number");
    validationError.status = 400;
    throw validationError;
  }

  if (!chargeData?.chargeId || chargeData.chargeId <= 0) {
    const validationError = new Error("ChargeID is required and must be a positive number");
    validationError.status = 400;
    throw validationError;
  }

  // Optional: validate amount (depending on your business rules)
  // Some systems allow 0 (e.g. free / waived), others don't
  if (chargeData.chargeAmount == null || isNaN(chargeData.chargeAmount) || Number(chargeData.chargeAmount) < 0) {
    const validationError = new Error("ChargeAmount must be a valid non-negative number");
    validationError.status = 400;
    throw validationError;
  }

  // Clinic/Branch handling — same pattern as addEmployee
  if (PRODUCTION_MODE !== true) {
    if (chargeData.clinicId < 0 || (chargeData.clinicId !== 0 && isNaN(chargeData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (chargeData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (chargeData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    ConsultationID: Number(chargeData.consultationId),
    ChargeID: Number(chargeData.chargeId),
    ChargeAmount: Number(chargeData.chargeAmount)
  };

  console.log("Add Consultation Charge:", payload);

  try {
    const response = await API.post("/AddConsultationCharge", payload);

    console.log("AddConsultationCharge response:", response.data);

    const result = response.data?.result;

    // Validate expected response structure
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add consultation charge");
    }

    // Return success with the new cons_charge_id
    return {
      success: true,
      consChargeId: result.OUT_CONS_CHARGE_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addConsultationCharge failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add consultation charge"
    };

    throw errorWithStatus;
  }
};

export const cancelConsultationCharge = async (consChargeId) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // ConsChargeID is mandatory for cancellation
  if (!consChargeId && consChargeId !== 0) {
    const validationError = new Error("ConsChargeID is required to cancel consultation charge.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ConsChargeID: consChargeId
  };

  console.log("cancelConsultationCharge payload:", payload);

  try {
    const response = await API.post("/CancelConsultationCharge", payload);
    const resultArray = response.data?.result;

    // Your sample shows result as an ARRAY containing one object
    const result = Array.isArray(resultArray) && resultArray.length > 0 ? resultArray[0] : null;

    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to cancel consultation charge");
    }

    return {
      success: true,
      consChargeId: result.IN_CONS_CHARGE_ID || consChargeId,
      message: "Consultation charge cancelled successfully"
    };

  } catch (error) {
    console.error("cancelConsultationCharge error:", error);

    const errorMsg =
      error.response?.data?.result?.[0]?.OUT_ERROR ||    // account for array response
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to cancel consultation charge";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getConsultationInvoiceDetailsList = async (clinicId = 0, options = {}) => {
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

  // Determine final IDs based on environment (same pattern)
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : clinicId;
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (options.BranchID || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    Page: options.Page || 1,
    PageSize: options.PageSize || 20,
    DetailID: options.DetailID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    InvoiceID: options.InvoiceID || 0,
    InvoiceNo: options.InvoiceNo || "",
    ConsultationID: options.ConsultationID || 0,
    VisitID: options.VisitID || 0,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    DoctorID: options.DoctorID || 0,
    ChargeID: options.ChargeID || 0,
    ChargeName: options.ChargeName || "",
    FromDate: options.FromDate || "",     // e.g. "2025-12-01"
    ToDate: options.ToDate || ""          // e.g. "2026-01-20"
  };

  console.log("get Consultation Invoice Details List:", payload);

  try {
    const response = await API.post("/GetConsultationInvoiceDetailList", payload);
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetConsultationInvoiceDetailList response:", results);

    return results.map((detail) => ({
      id: detail.detail_id,
      uniqueSeq: detail.unique_seq,
      clinicId: detail.clinic_id,
      clinicName: detail.clinic_name,
      branchId: detail.branch_id,
      branchName: detail.branch_name,
      invoiceId: detail.invoice_id,
      invoiceNo: detail.invoice_no || "",
      invoiceDate: detail.invoice_date || null,
      consultationId: detail.consultation_id,
      visitId: detail.visit_id,
      patientId: detail.patient_id,
      patientName: detail.patient_name || "",
      patientMobile: detail.patient_mobile || null,
      patientFileNo: detail.patient_file_no || null,
      doctorId: detail.doctor_id,
      doctorFullName: detail.doctor_full_name || "Unknown",
      chargeId: detail.charge_id,
      chargeName: detail.charge_name || "",
      chargeCode: detail.charge_code || "",
      chargeAmount: detail.charge_amount ? parseFloat(detail.charge_amount) : null,
      cgstPercentage: detail.cgst_percentage ? parseFloat(detail.cgst_percentage) : null,
      sgstPercentage: detail.sgst_percentage ? parseFloat(detail.sgst_percentage) : null,
      cgstAmount: detail.cgst_amount ? parseFloat(detail.cgst_amount) : null,
      sgstAmount: detail.sgst_amount ? parseFloat(detail.sgst_amount) : null,
      netAmount: detail.net_amount ? parseFloat(detail.net_amount) : null,
      dateCreated: detail.date_created || null,
      dateModified: detail.date_modified || null
    }));
  } catch (error) {
    console.error("getConsultationInvoiceDetailsList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch consultation invoice details"
    };

    throw err;
  }
};

export const generateConsultationInvoice = async (invoiceData = {}) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Core required fields
  if (!invoiceData?.consultationId || invoiceData.consultationId <= 0) {
    const validationError = new Error("ConsultationID is required and must be a positive number");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is required (same strict check as in generateSlots / updateEmployee)
  if (!invoiceData?.clinicId && invoiceData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to generate consultation invoice.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional: validate InvoiceDate format if provided (ISO-like or YYYY-MM-DD)
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

  // Environment-aware clinic/branch logic (same as generateSlots)
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (invoiceData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (invoiceData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    ConsultationID: Number(invoiceData.consultationId),
    InvoiceDate: invoiceData.invoiceDate?.trim() || "",   // backend might use current date if empty
    Discount: invoiceData.discount != null ? Number(invoiceData.discount) : 0
  };

  console.log("generateConsultationInvoice payload:", payload);

  try {
    const response = await API.post("/GenerateConsultationInvoice", payload);
    console.log("GenerateConsultationInvoice response:", response.data);

    const result = response.data?.result;

    if (!result || result.OUT_OK !== 1) {
      const errorMsg = result?.OUT_ERROR || "Failed to generate consultation invoice";
      throw new Error(errorMsg);
    }

    return {
      success: true,
      invoiceId: result.OUT_INVOICE_ID,
      message: "Consultation invoice generated successfully"
    };

  } catch (error) {
    console.error("generateConsultationInvoice error:", error);

    const errorMessage =
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to generate consultation invoice";

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

  // Optional: stricter validation in non-production (same as getInvoiceList)
  if (PRODUCTION_MODE !== true) {
    if (clinicId < 0 || (clinicId !== 0 && isNaN(clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Determine final IDs based on environment (consistent with getInvoiceList)
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

    // Safely handle result array
    const results = Array.isArray(response.data?.result) ? response.data.result : [];
    console.log("GetLabInvoiceDetailList response:", results);

    return results.map((detail) => ({
      id: detail.inv_detail_id,
      uniqueSeq: detail.unique_seq,
      clinicId: detail.clinic_id,
      clinicName: detail.clinic_name || "",
      branchId: detail.branch_id,
      branchName: detail.branch_name || "",
      invoiceId: detail.invoice_id,
      invoiceNo: detail.invoice_no || "",
      invoiceDate: detail.invoice_date || null,
      patientId: detail.patient_id,
      patientName: detail.patient_name || "",
      patientMobile: detail.patient_mobile || null,
      patientFileNo: detail.patient_file_no || null,
      orderId: detail.order_id ?? null,
      testId: detail.test_id,
      testName: detail.test_name || "",
      masterTestName: detail.master_test_name || "",
      testShortName: detail.test_short_name || "",
      amount: detail.amount ? parseFloat(detail.amount) : null,
      cgstPercentage: detail.cgst_percentage ? parseFloat(detail.cgst_percentage) : null,
      sgstPercentage: detail.sgst_percentage ? parseFloat(detail.sgst_percentage) : null,
      cgstAmount: detail.cgst_amount ? parseFloat(detail.cgst_amount) : null,
      sgstAmount: detail.sgst_amount ? parseFloat(detail.sgst_amount) : null,
      netAmount: detail.net_amount ? parseFloat(detail.net_amount) : null,

      dateCreated: detail.date_created || null,
      dateModified: detail.date_modified || null,
    }));
  } catch (error) {
    console.error("getLabInvoiceDetailList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Failed to fetch lab invoice details",
    };

    throw err;
  }
};


