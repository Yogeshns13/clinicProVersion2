
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