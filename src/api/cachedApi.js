// cachedApi.js - Wrapper for all API functions with automatic caching
// Import this instead of the original api.js

import * as originalApi from './api';
import { apiCache, withCache, invalidateCache } from '../Utils/cacheManager';

// ══════════════════════════════════════════════════════════════
// READ OPERATIONS (GET) - These will be cached
// ══════════════════════════════════════════════════════════════

export const getClinicList = async (forceRefresh = false) => {
  return withCache(
    'GetClinicList',
    () => originalApi.getClinicList(),
    {},
    { forceRefresh }  
  );
};

export const getBranchList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetBranchList',
    () => originalApi.getBranchList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getDepartmentList = async (clinicId = 0, branchId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetDepartmentList',
    () => originalApi.getDepartmentList(clinicId, branchId, options),
    { clinicId, branchId, ...options },
    { forceRefresh }
  );
};

export const getEmployeeList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetEmployeeList',
    () => originalApi.getEmployeeList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getEmployeeProofList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetEmployeeProofList',
    () => originalApi.getEmployeeProofList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getEmployeeBeneficiaryAccountList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetEmployeeBeneficiaryAccountList',
    () => originalApi.getEmployeeBeneficiaryAccountList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getEmployeeShiftList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetEmployeeShiftList',
    () => originalApi.getEmployeeShiftList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getShiftList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetWorkShiftList',
    () => originalApi.getShiftList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getWorkDaysList = async (clinicId = 0, employeeId, forceRefresh = false) => {
  return withCache(
    'GetWorkDays',
    () => originalApi.getWorkDaysList(clinicId, employeeId),
    { clinicId, employeeId },
    { forceRefresh }
  );
};

export const getPatientsList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetPatientList',
    () => originalApi.getPatientsList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getSlotConfigList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetSlotConfigList',
    () => originalApi.getSlotConfigList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getSlotList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetSlotList',
    () => originalApi.getSlotList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getAppointmentList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetAppointmentList',
    () => originalApi.getAppointmentList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getPatientVisitList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetPatientVisitList',
    () => originalApi.getPatientVisitList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

export const getConsultationList = async (clinicId = 0, options = {}, forceRefresh = false) => {
  return withCache(
    'GetConsultationList',
    () => originalApi.getConsultationList(clinicId, options),
    { clinicId, ...options },
    { forceRefresh }
  );
};

// ══════════════════════════════════════════════════════════════
// NON-CACHEABLE OPERATIONS - Pass through without caching
// ══════════════════════════════════════════════════════════════
  
export const loginUser = originalApi.loginUser;
export const renewToken = originalApi.renewToken;
export const checkSession = originalApi.checkSession;
export const uploadPhoto = originalApi.uploadPhoto;
export const uploadIDProof = originalApi.uploadIDProof;
export const getFile = originalApi.getFile;
export const getUserId = originalApi.getUserId;
export const getClinicId = originalApi.getClinicId;
export const getBranchId = originalApi.getBranchId;
export const getFileAccessToken = originalApi.getFileAccessToken;

// ══════════════════════════════════════════════════════════════
// CACHE MANAGEMENT UTILITIES
// ══════════════════════════════════════════════════════════════

export const clearCache = () => {
  apiCache.clearAll();
  console.log('✓ All API cache cleared');
};

export const clearCacheByType = (type) => {
  invalidateCache(type);
  console.log(`✓ Cache cleared for: ${type}`);
};

// Export cache instance for advanced usage
export { apiCache };