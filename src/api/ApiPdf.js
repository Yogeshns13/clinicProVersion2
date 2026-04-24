import {getSessionRef, generateRefKey, getUserId, getClinicId, getBranchId} from "./Api.js"
import { PDF_API, checkDbError, extractBackendError} from "./ApiConfiguration";
import { getStoredClinicId, getStoredBranchId, getStoredFileAccessToken } from '../Utils/Cryptoutils.js';
import axios from "axios";

const CHANNEL_ID = 1;
const PRODUCTION_MODE = 0;

export const PDF_ENDPOINTS = {
  PRESCRIPTION: "/CreatePrescriptionFile",
  LAB_ORDER: "/CreateLabOrderFile",
};

const buildPayload = async ({
  clinicId,
  branchId,
  fileAccessToken,
  extraFieldName,
  extraFieldValue,
}) => {
  const resolvedClinicId = clinicId ?? await getStoredClinicId();
  const resolvedBranchId = branchId ?? await getStoredbranchId();
  const resolvedFileAccessToken = fileAccessToken ?? await getStoredFileAccessToken();

  return {
    ClinicID: resolvedClinicId,
    BranchID: Number(resolvedBranchId),
    FileAccessToken: resolvedFileAccessToken,
    [extraFieldName]: Number(extraFieldValue),
  };
};

export const createLabReportFile = async (labReportData) => {
  const userId = getUserId();
  if (!userId) {
    const authError = new Error("User ID is missing. Please log in again.");
    authError.status = 401;
    authError.code = 401;
    throw authError;
  }

  // Basic required-field validation
  if (!labReportData?.labOrderId || !labReportData?.fileAccessToken) {
    const validationError = new Error("Lab Order ID and File Access Token are required");
    validationError.status = 400;
    throw validationError;
  }

  const finalClinicId = PRODUCTION_MODE ? getClinicId() : (labReportData.clinicId || 0);
  const finalBranchId = PRODUCTION_MODE ? getBranchId() : (labReportData.branchId || 0);

  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(userId),
    ClinicID: finalClinicId,
    BranchID: finalBranchId,
    LabOrderID: labReportData.labOrderId,
    FileAccessToken: labReportData.fileAccessToken,
  };

  console.log("Create Lab Report File", payload);

  try {
    const response = await PDF_API.post("/CreateLabReportFile", payload);

    console.log("CreateLabReportFile response:", response.data);

    const result = response.data;

    checkDbError(result);

    if (!result || typeof result.OUT_OK === "undefined") {
      throw new Error("Invalid response from server");
    }

    if (result.OUT_OK !== 1) {
      throw new Error(result.OUT_ERROR || "Failed to create lab report file");
    }

    // Return success with new file ID
    return {
      success: true,
      fileId: result.OUT_FILE_ID,
      message: result.OUT_ERROR || "OK"
    };

  } catch (error) {
    console.error("createLabReportFile failed:", error);

    const errorWithStatus = {
      ...error,
      status: error.response?.status || 500,
      code: error.response?.status || 500,
      message:
        extractBackendError(error) ||
        error.response?.data?.message ||
        error.response?.data?.result?.OUT_ERROR ||
        error.message ||
        "Failed to create lab report file"
    };

    throw errorWithStatus;
  }
};

export const createPrescriptionFile = async (
  branchId,
  prescriptionId,
  clinicId,
  fileAccessToken
) => {
  try {
    if (!prescriptionId) {
      throw new Error("PrescriptionID is required");
    }

    const payload = await buildPayload({
      clinicId,
      branchId,
      fileAccessToken,
      extraFieldName: "PrescriptionID",
      extraFieldValue: prescriptionId,
    });

    console.log("Prescription Request:", payload);

    const response = await PDF_API.post(
      PDF_ENDPOINTS.PRESCRIPTION,
      payload,
      {
        headers: {
          ...(PRODUCTION_MODE === 1 ? { "API-Key": API_KEY } : {}),
        },
        responseType: "blob",
      }
    );

    const pdfBlob = response.data;
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return {
      url: pdfUrl,
      blob: pdfBlob,
      prescriptionId,
    };

  } catch (error) {
    console.error("Prescription Error:", error);

    if (error.response?.status === 404) {
      throw new Error("Prescription not found");
    }
    if ([401, 403].includes(error.response?.status)) {
      throw new Error("Access denied - invalid or expired token");
    }

    throw error;
  }
};

export const createLabOrderFile = async (
  branchId,
  labOrderId,
  clinicId,
  fileAccessToken
) => {
  try {
    if (!labOrderId) {
      throw new Error("LabOrderID is required");
    }

    const payload = await buildPayload({
      clinicId,
      branchId,
      fileAccessToken,
      extraFieldName: "LabOrderID",
      extraFieldValue: labOrderId,
    });

    console.log("Lab Order Request:", payload);

    const response = await PDF_API.post(
      PDF_ENDPOINTS.LAB_ORDER,
      payload,
      {
        headers: {
          ...(PRODUCTION_MODE === 1 ? { "API-Key": API_KEY } : {}),
        },
        responseType: "blob",
      }
    );

    const pdfBlob = response.data;
    const pdfUrl = URL.createObjectURL(pdfBlob);

    console.log("Lab order file created successfully.");

    return {
      url: pdfUrl,
      blob: pdfBlob,
      labOrderId,
    };

  } catch (error) {
    console.error("Lab Order Error:", error);

    if (error.response?.status === 404) {
      throw new Error("Lab order not found");
    }
    if ([401, 403].includes(error.response?.status)) {
      throw new Error("Access denied - invalid or expired token");
    }

    throw error;
  }
};

export const createInvoiceBillFile = async (
  branchId,
  invoiceId,
  clinicId,
  fileAccessToken,
  invoiceType,
  docType,
  paymentId
) => {
  try {
    if (!invoiceId) throw new Error("InvoiceID is required");
    if (invoiceType == null) throw new Error("InvoiceType is required");
    if (docType === 2 && !paymentId) throw new Error("PaymentID is required when DocType is 2");

    const payload = {
      ClinicID:        clinicId,
      BranchID:        branchId,
      FileAccessToken: fileAccessToken,
      InvoiceID:       invoiceId,
      InvoiceType:     invoiceType,
      DocType:         docType,
      PaymentID:       docType === 2 ? paymentId : 0,
    };

    console.log("Correct Payload:", payload);

    const response = await PDF_API.post(
      "/CreateInvoiceBillFile",
      payload,
      {
        headers: {
          ...(PRODUCTION_MODE === 1 ? { "API-Key": API_KEY } : {}),
        },
        responseType: "blob",
      }
    );

    const pdfBlob = response.data;
    const pdfUrl = URL.createObjectURL(pdfBlob);

    return {
      url: pdfUrl,
      blob: pdfBlob,
      invoiceId,
    };

  } catch (error) {
    console.error("Invoice Bill Error:", error);

    if (error.response?.status === 404) {
      throw new Error("Invoice not found");
    }
    if ([401, 403].includes(error.response?.status)) {
      throw new Error("Access denied - invalid or expired token");
    }

    throw error;
  }
};

