
import {getSessionRef, generateRefKey, getUserId, getClinicId, getBranchId} from "./Api.js"
import { API, checkDbError, extractBackendError} from "./ApiConfiguration";
const CHANNEL_ID = 1; 
const PRODUCTION_MODE = 0;

export const getInvoiceList = async (clinicId = 0, options = {}) => {
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
    InvoiceID: options.InvoiceID || 0,
    InvoiceNo: options.InvoiceNo || "",
    OrderID: options.OrderID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    VisitID: options.VisitID || 0,
    InvoiceType: options.InvoiceType ?? 0,     // 0 = all, or 1=Consultation, 2=Lab, 3=Pharmacy, etc.
    FromDate: options.FromDate || "",
    ToDate: options.ToDate || "",
    Status: options.Status ?? -1
  };

  console.log("get Invoice List:", payload);

  try {
    const response = await API.post("/GetInvoiceList", payload);
    const result = response.data?.result;
    checkDbError(result);
    const results = Array.isArray(result) ? result : [];
    console.log("GetInvoiceList response:", results);

    return results.map((inv) => ({
      id: inv.invoice_id,
      uniqueSeq: inv.unique_seq,
      clinicId: inv.clinic_id,
      clinicName: inv.clinic_name,
      clinicAddress: inv.clinic_address,
      clinicMobile: inv.clinic_mobile,
      clinicAltMobile: inv.clinic_alt_mobile,
      gstNo: inv.gst_no,
      logoFileId: inv.logo_file_id,
      branchId: inv.branch_id,
      branchName: inv.branch_name,
      branchAddress: inv.branch_address,
      branchMobile: inv.branch_mobile,
      branchAltMobile: inv.branch_alt_mobile,
      invoiceType: inv.invoice_type,
      invoiceTypeDesc: inv.invoice_type_desc || "Unknown",
      invoiceNo: inv.invoice_no || "",
      invoiceDate: inv.invoice_date || null,
      patientId: inv.patient_id,
      patientName: inv.patient_name || "",
      patientMobile: inv.patient_mobile || null,
      patientFileNo: inv.patient_file_no || null,

      visitId: inv.visit_id ?? null,

      totalAmount: inv.total_amount ? parseFloat(inv.total_amount) : null,
      discount: inv.discount ? parseFloat(inv.discount) : null,
      cgstAmount: inv.cgst_amount ? parseFloat(inv.cgst_amount) : null,
      sgstAmount: inv.sgst_amount ? parseFloat(inv.sgst_amount) : null,
      netAmount: inv.net_amount ? parseFloat(inv.net_amount) : null,
      paidAmount: inv.PAID_AMOUNT ? parseFloat(inv.PAID_AMOUNT) : null,
      status: inv.status,
      statusDesc: inv.status_desc || "Unknown", 
      dateCreated: inv.date_created || null,
      dateModified: inv.date_modified || null
    }));
  } catch (error) {
    console.error("getInvoiceList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message:extractBackendError(error) || error.response?.data?.message || error.message || "Failed to fetch invoices"
    };

    throw err;
  }
};

export const updateInvoiceStatus = async (invoiceData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }
  
  // InvoiceID is mandatory for update
  if (!invoiceData?.invoiceId && invoiceData?.invoiceId !== 0) {
    const validationError = new Error("InvoiceID is required to update invoice status.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Status is required (and typically should be a valid number)
  if (invoiceData.status == null) {
    const validationError = new Error("Status is required to update invoice status.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is typically required for most operations
  if (!invoiceData?.clinicId && invoiceData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update invoice status.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional stricter validation in development
  if (PRODUCTION_MODE !== true) {
    if (invoiceData.clinicId < 0 || (invoiceData.clinicId !== 0 && isNaN(invoiceData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (invoiceData.clinicId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    InvoiceID: invoiceData.invoiceId || 0,
    Status: Number(invoiceData.status)
  };

  console.log("updateInvoiceStatus payload:", payload);

  try {
    const response = await API.post("/UpdateInvoiceStatus", payload);
    console.log("UpdateInvoiceStatus response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update invoice status");
    }

    return {
      success: true,
      invoiceId: result.IN_INVOICE_ID || invoiceData.invoiceId,
      message: "Invoice status updated successfully"
    };

  } catch (error) {
    console.error("updateInvoiceStatus error:", error);

    const errorMessage =
      extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update invoice status";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};

export const cancelInvoice = async (invoiceId, clinicId = 0, branchId = 0) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // InvoiceID is mandatory for cancellation
  if (!invoiceId && invoiceId !== 0) {
    const validationError = new Error("InvoiceID is required to cancel an invoice.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Determine final ClinicID / BranchID (same pattern as in other functions)
  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    InvoiceID: invoiceId
  };

  console.log("cancelInvoice payload:", payload);

  try {
    const response = await API.post("/CancelInvoice", payload);
    const result = response.data?.result;
    checkDbError(result);
    // Validate backend response
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to cancel invoice");
    }

    return {
      success: true,
      invoiceId: result.IN_INVOICE_ID || invoiceId,
      message: result.OUT_ERROR || "Invoice cancelled successfully",
      // Optional: you can parse the message if you want to show more detailed info
      backendMessage: result.OUT_ERROR
    };

  } catch (error) {
    console.error("cancelInvoice error:", error);

    const errorMsg =
      extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to cancel invoice";

    const enhancedError = new Error(errorMsg);
    enhancedError.status = error.response?.status || 500;
    enhancedError.code = error.response?.status || 500;

    throw enhancedError;
  }
};

export const getInvoicePaymentList = async (clinicId = 0, options = {}) => {
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
    PaymentID: options.PaymentID || 0,
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    InvoiceID: options.InvoiceID || 0,
    InvoiceNo: options.InvoiceNo || "",
    OrderID: options.OrderID || 0,
    PatientID: options.PatientID || 0,
    PatientName: options.PatientName || "",
    PaymentMode: options.PaymentMode ?? 0,    // 0 = all modes, or specific code
    FromDate: options.FromDate || "",
    ToDate: options.ToDate || ""
  };

  console.log("get Invoice Payment List:", payload);

  try {
    const response = await API.post("/GetInvoicePaymentList", payload);
    const result = response.data?.result;
    checkDbError(result);
    const results = Array.isArray(result) ? result : [];
    console.log("GetInvoicePaymentList response:", results);

    return results.map((payment) => ({
      id: payment.payment_id,
      uniqueSeq: payment.unique_seq,
      clinicId: payment.clinic_id,
      clinicName: payment.clinic_name,
      branchId: payment.branch_id,
      branchName: payment.branch_name,
      invoiceId: payment.invoice_id,
      invoiceNo: payment.invoice_no || "",
      invoiceDate: payment.invoice_date || null,
      invoiceType: payment.invoice_type,
      patientId: payment.patient_id ?? null,
      patientName: payment.patient_name || null,
      patientMobile: payment.patient_mobile || null,
      patientFileNo: payment.patient_file_no || null,
      paymentDate: payment.payment_date || null,
      paymentMode: payment.payment_mode,
      paymentModeDesc: payment.payment_mode_desc || "Unknown",
      amount: payment.amount ? parseFloat(payment.amount) : null,
      referenceNo: payment.reference_no || null,
      remarks: payment.remarks || null,
      status: payment.status,
      statusDesc: payment.status_desc || "Unknown",  
      dateCreated: payment.date_created || null,
      dateModified: payment.date_modified || null,
      paymentStatus: payment.payment_status,
    }));
  } catch (error) {
    console.error("getInvoicePaymentList failed:", error);

    const err = {
      ...error,
      status: error.response?.status || 500,
      message: extractBackendError(error) || error.response?.data?.message || error.message || "Failed to fetch invoice payments"
    };

    throw err;
  }
};

export const addInvoicePayment = async (paymentData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Required fields validation
  if (!paymentData?.invoiceId || paymentData.invoiceId <= 0) {
    const validationError = new Error("InvoiceID is required and must be a positive number");
    validationError.status = 400;
    throw validationError;
  }

  if (!paymentData?.amount || isNaN(Number(paymentData.amount)) || Number(paymentData.amount) <= 0) {
    const validationError = new Error("Amount is required and must be a positive number");
    validationError.status = 400;
    throw validationError;
  }

  if (!paymentData?.paymentMode) {
    const validationError = new Error("PaymentMode is required");
    validationError.status = 400;
    throw validationError;
  }

  // ClinicID is typically required
  if (!paymentData?.clinicId && paymentData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to add invoice payment");
    validationError.status = 400;
    throw validationError;
  }

  // Optional stricter validation in development
  if (PRODUCTION_MODE !== true) {
    if (paymentData.clinicId < 0 || (paymentData.clinicId !== 0 && isNaN(paymentData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  // Optional: basic date format check
  if (paymentData.paymentDate && !/^\d{4}-\d{2}-\d{2}$/.test(paymentData.paymentDate.trim())) {
    const validationError = new Error("PaymentDate should be in YYYY-MM-DD format if provided");
    validationError.status = 400;
    throw validationError;
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (paymentData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (paymentData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    InvoiceID: Number(paymentData.invoiceId),
    PaymentDate: paymentData.paymentDate?.trim() || "",   // backend may default to today
    PaymentMode: Number(paymentData.paymentMode),
    Amount: Number(paymentData.amount),
    ReferenceNo: paymentData.referenceNo?.trim() || "",
    Remarks: paymentData.remarks?.trim() || ""
  };

  console.log("Add Invoice Payment:", payload);

  try {
    const response = await API.post("/AddInvoicePayment", payload);

    console.log("AddInvoicePayment response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to add invoice payment");
    }

    return {
      success: true,
      paymentId: result.OUT_PAYMENT_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("addInvoicePayment failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to add invoice payment"
    };

    throw errorWithStatus;
  }
};

export const updateInvoicePayment = async (paymentData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // PaymentID is mandatory for update
  if (!paymentData?.paymentId && paymentData?.paymentId !== 0) {
    const validationError = new Error("PaymentID is required to update invoice payment.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Status is typically required when updating payment
  if (paymentData.status == null) {
    const validationError = new Error("Status is required to update invoice payment.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // ClinicID is usually required for most update operations
  if (!paymentData?.clinicId && paymentData?.clinicId !== 0) {
    const validationError = new Error("ClinicID is required to update invoice payment.");
    validationError.status = 400;
    validationError.code = 400;
    throw validationError;
  }

  // Optional: stricter validation in non-production
  if (PRODUCTION_MODE !== true) {
    if (paymentData.clinicId < 0 || (paymentData.clinicId !== 0 && isNaN(paymentData.clinicId))) {
      const error = new Error("Invalid Clinic ID");
      error.status = 400;
      throw error;
    }
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (paymentData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (paymentData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    PaymentID: paymentData.paymentId || 0,
    Status: Number(paymentData.status),
    Remarks: paymentData.remarks?.trim() || ""
  };

  console.log("updateInvoicePayment payload:", payload);

  try {
    const response = await API.post("/UpdateInvoicePayment", payload);
    console.log("UpdateInvoicePayment response:", response.data);

    const result = response.data?.result;
    checkDbError(result);
    if (!result || result.OUT_OK !== 1) {
      throw new Error(result?.OUT_ERROR || "Failed to update invoice payment");
    }

    return {
      success: true,
      paymentId: result.IN_PAYMENT_ID || paymentData.paymentId,
      message: "Invoice payment updated successfully"
    };

  } catch (error) {
    console.error("updateInvoicePayment error:", error);

    const errorMessage =
      extractBackendError(error) ||
      error.response?.data?.result?.OUT_ERROR ||
      error.response?.data?.message ||
      error.message ||
      "Failed to update invoice payment";

    const formattedError = new Error(errorMessage);
    formattedError.status = error.response?.status || 500;
    formattedError.code = error.response?.status || 500;

    throw formattedError;
  }
};