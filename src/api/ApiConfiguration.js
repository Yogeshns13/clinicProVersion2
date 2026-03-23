
import axios from "axios";

export const baseURL = import.meta.env.PROD
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

export const UPLOAD_API_URL = import.meta.env.PROD
  ? `${import.meta.env.VITE_FTP_BASE_URL}/upload`
  : "/upload";

export const FILE_API_URL = import.meta.env.PROD
  ? `${import.meta.env.VITE_FTP_BASE_URL}/file`
  : "/file";

export const API = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const checkDbError = (result) => {
  if (result?.name === "DB_ERROR") {
    throw new Error(result.Description || "A database error occurred");
  }
};
 
export const extractBackendError = (error) => {
  const data = error.response?.data;
 
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const messages = data.errors.map((e) => `${e.path}: ${e.msg}`).join(", ");
    return messages;
  }
 
  if (data?.result?.name === "DB_ERROR") {
    return data.result.Description || "A database error occurred";
  }
  return null;
};
