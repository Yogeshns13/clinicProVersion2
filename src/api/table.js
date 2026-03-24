import { getUserId, CHANNEL_ID, generateRefKey, getSessionRef, API } from './Api';

let tableData = [];

const CACHED_TABLE_IDS = [1, 2, 6];

const CACHE_PREFIX = 'tableData_';

//This is for dummy

/**
 * Load cached data from memory storage for specific TABLE_IDs
 * @param {number} tableId - The table ID to load
 * @returns {Array|null} - Cached data or null
 */
const loadCachedData = async (tableId) => {
  if (!CACHED_TABLE_IDS.includes(tableId)) {
    return null;
  }

  try {
    const cacheKey = `${CACHE_PREFIX}${tableId}`;
    const result = await window.storage.get(cacheKey);
    
    if (result && result.value) {
      const parsedData = JSON.parse(result.value);
      console.log(`Loaded cached table id: ${tableId}`, parsedData);
      return parsedData;
    }
  } catch (error) {
    console.error(`Error loading cached data for TABLE_ID ${tableId}:`, error);
    // Clear corrupted cache
    try {
      await window.storage.delete(`${CACHE_PREFIX}${tableId}`);
    } catch (deleteError) {
      console.error(`Error deleting corrupted cache:`, deleteError);
    }
  }
  
  return null;
};

/**
 * Save data to storage for specific TABLE_IDs
 * @param {number} tableId - The table ID
 * @param {Array} data - The data to cache
 * @returns {boolean} - Success status
 */
const saveToCache = async (tableId, data) => {
  if (!CACHED_TABLE_IDS.includes(tableId)) {
    return false;
  }

  try {
    // Filter and transform data to store only essential fields
    const cacheData = data.map(item => ({
      TABLE_ID: item.TABLE_ID,
      TEXT_ID: item.TEXT_ID,
      TEXT_VALUE: item.TEXT_VALUE,
      TABLE_DESC: item.TABLE_DESC
    }));
    
    const cacheKey = `${CACHE_PREFIX}${tableId}`;
    await window.storage.set(cacheKey, JSON.stringify(cacheData));
    console.log(`Saved to cache for TABLE_ID: ${tableId}`, cacheData);
    return true;
  } catch (error) {
    console.error(`Error saving cache for TABLE_ID ${tableId}:`, error);
    return false;
  }
};

/**
 * Validate if cached data is complete and valid
 * @param {Array} data - Data to validate
 * @param {Array} expectedKeys - Required keys
 * @returns {boolean} - Validation result
 */
const isValidCachedData = (data, expectedKeys = ['TEXT_ID', 'TEXT_VALUE']) => {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }
  
  // Check if all items have required fields
  return data.every(item => {
    return expectedKeys.every(key => 
      Object.prototype.hasOwnProperty.call(item, key) && 
      item[key] !== null && 
      item[key] !== undefined
    );
  });
};

/**
 * Fetch table list from API with retry logic
 * @param {number} tableId - The table ID to fetch (0 for all tables)
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Array} - Fetched table data
 */
export const fetchTableList = async (tableId, maxRetries = 2) => {
  // Check cache first for specific TABLE_IDs
  if (tableId !== 0) {
    const cachedData = await loadCachedData(tableId);
    
    if (cachedData && isValidCachedData(cachedData)) {
      console.log(`Using cached data for TABLE_ID: ${tableId}`);
      tableData = [...tableData.filter(item => item.TABLE_ID !== tableId), ...cachedData];
      return cachedData.map(item => ({
        id: item.ID || item.TEXT_ID,
        tableId: item.TABLE_ID,
        textId: item.TEXT_ID,
        textValue: item.TEXT_VALUE,
        tableDesc: item.TABLE_DESC,
      }));
    }
  }

  // If no valid cache, fetch from API
  const userId = getUserId();
  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: userId ? parseInt(userId) : 2000000,
    TableID: tableId,
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching TABLE_ID ${tableId}, attempt ${attempt}/${maxRetries}`);
      const response = await API.post("/GetTextTableList", payload);
      const results = Array.isArray(response.data?.result) ? response.data.result : [];
      console.log("GetTextTableList response for TABLE_ID:", tableId, results);
     
      if (results.length > 0) {
        // Update tableData
        if (tableId === 0) {
          // Replace all data if fetching all tables
          tableData = results;
        } else {
          // Update specific table data
          tableData = [...tableData.filter(item => item.TABLE_ID !== tableId), ...results];
        }
       
        // Save to cache if applicable and not fetching all tables
        if (tableId !== 0) {
          const saveSuccess = await saveToCache(tableId, results);
          if (!saveSuccess) {
            console.warn(`Failed to save cache for TABLE_ID ${tableId} on attempt ${attempt}`);
          }
        }
        
        return results.map(item => ({
          id: item.ID,
          tableId: item.TABLE_ID,
          textId: item.TEXT_ID,
          textValue: item.TEXT_VALUE,
          tableDesc: item.TABLE_DESC,
        }));
      } else {
        console.warn(`Empty response for TABLE_ID ${tableId} on attempt ${attempt}`);
        if (attempt === maxRetries) {
          // Clear any invalid cache on final attempt
          if (tableId !== 0 && CACHED_TABLE_IDS.includes(tableId)) {
            try {
              await window.storage.delete(`${CACHE_PREFIX}${tableId}`);
            } catch (error) {
              console.error(`Error clearing cache:`, error);
            }
          }
          return [];
        }
      }
    } catch (error) {
      console.error(`GetTextTableList failed for TABLE_ID: ${tableId}, attempt ${attempt}:`, error);
      if (attempt === maxRetries) {
        // Clear cache on final failure
        if (tableId !== 0 && CACHED_TABLE_IDS.includes(tableId)) {
          try {
            await window.storage.delete(`${CACHE_PREFIX}${tableId}`);
          } catch (deleteError) {
            console.error(`Error clearing cache:`, deleteError);
          }
        }
        return [];
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return [];
};

/**
 * Ensure table data is loaded with validation
 * @param {number} tableId - The table ID to ensure
 * @returns {Array} - The table data
 */
export const ensureTableData = async (tableId) => {
  console.log(`Ensuring table data for TABLE_ID: ${tableId}`);
  
  // First check if we have valid data in memory
  const existingData = tableData.filter(item => item.TABLE_ID === tableId);
  if (existingData.length > 0 && isValidCachedData(existingData)) {
    console.log(`Using existing memory data for TABLE_ID: ${tableId}`);
    return existingData;
  }

  // Check cache
  const cachedData = await loadCachedData(tableId);
  if (cachedData && isValidCachedData(cachedData)) {
    console.log(`Using cached data for TABLE_ID: ${tableId}`);
    tableData = [...tableData.filter(item => item.TABLE_ID !== tableId), ...cachedData];
    return cachedData;
  }

  // No valid data, fetch it
  console.log(`No valid data found, fetching TABLE_ID: ${tableId}`);
  const fetchedData = await fetchTableList(tableId);
  
  if (fetchedData.length > 0) {
    const rawData = tableData.filter(item => item.TABLE_ID === tableId);
    return rawData;
  }
  
  return [];
};

/**
 * Get all table data (cached or in-memory)
 * @returns {Array} - All table data
 */
export const getAllTables = () => {
  return tableData;
};

/**
 * Get specific table by TABLE_ID
 * @param {number} tableId - The table ID
 * @returns {Array} - Filtered table data
 */
export const getTableById = (tableId) => {
  return tableData.filter(item => item.TABLE_ID === tableId);
};

/**
 * Get text value by TABLE_ID and TEXT_ID
 * @param {number} tableId - The table ID
 * @param {number} textId - The text ID
 * @returns {string|null} - The text value or null
 */
export const getTextValue = (tableId, textId) => {
  const item = tableData.find(item => item.TABLE_ID === tableId && item.TEXT_ID === textId);
  return item ? item.TEXT_VALUE : null;
};

/**
 * Get all text values for a specific table
 * @param {number} tableId - The table ID
 * @returns {Array} - Array of text values
 */
export const getTableValues = (tableId) => {
  return tableData
    .filter(item => item.TABLE_ID === tableId)
    .map(item => item.TEXT_VALUE)
    .filter(value => value && value.trim() !== '');
};

/**
 * Get table description by TABLE_ID
 * @param {number} tableId - The table ID
 * @returns {string|null} - The table description or null
 */
export const getTableDescription = (tableId) => {
  const item = tableData.find(item => item.TABLE_ID === tableId);
  return item ? item.TABLE_DESC : null;
};

/**
 * Initialize table data for a specific TABLE_ID with validation
 * @param {number} tableId - The table ID to initialize
 */
export const initTableData = async (tableId) => {
  // Only initialize if we don't have valid data
  const existingData = tableData.filter(item => item.TABLE_ID === tableId);
  if (existingData.length > 0 && isValidCachedData(existingData)) {
    console.log(`Table data already loaded for TABLE_ID: ${tableId}`);
    return;
  }

  await ensureTableData(tableId);
};

/**
 * Initialize all cached tables at once
 */
export const initAllCachedTables = async () => {
  console.log('Initializing all cached tables...');
  const promises = CACHED_TABLE_IDS.map(tableId => initTableData(tableId));
  await Promise.all(promises);
  console.log('All cached tables initialized');
};

/**
 * Clear cache for specific TABLE_ID
 * @param {number} tableId - The table ID to clear
 */
export const clearTableCache = async (tableId) => {
  if (CACHED_TABLE_IDS.includes(tableId)) {
    try {
      await window.storage.delete(`${CACHE_PREFIX}${tableId}`);
      // Also clear from memory
      tableData = tableData.filter(item => item.TABLE_ID !== tableId);
      console.log(`Cleared cache and memory for TABLE_ID: ${tableId}`);
    } catch (error) {
      console.error(`Error clearing cache for TABLE_ID ${tableId}:`, error);
    }
  }
};

/**
 * Clear all cached tables
 */
export const clearAllTableCache = async () => {
  console.log('Clearing all table caches...');
  const promises = CACHED_TABLE_IDS.map(tableId => clearTableCache(tableId));
  await Promise.all(promises);
  tableData = [];
  console.log('All table caches cleared');
};

/**
 * Validate if table data exists and is ready
 * @param {number} tableId - The table ID to check
 * @returns {boolean} - Ready status
 */
export const isTableDataReady = (tableId) => {
  const data = tableData.filter(item => item.TABLE_ID === tableId);
  return data.length > 0 && isValidCachedData(data);
};

/**
 * Get options for dropdown/select from a table
 * @param {number} tableId - The table ID
 * @returns {Array} - Array of {value, label} objects
 */
export const getTableOptions = (tableId) => {
  return tableData
    .filter(item => item.TABLE_ID === tableId)
    .map(item => ({
      value: item.TEXT_ID,
      label: item.TEXT_VALUE,
      id: item.ID,
      tableDesc: item.TABLE_DESC
    }));
};

/**
 * Refresh specific table data (force refetch)
 * @param {number} tableId - The table ID to refresh
 * @returns {Array} - Fresh table data
 */
export const refreshTableData = async (tableId) => {
  console.log(`Refreshing table data for TABLE_ID: ${tableId}`);
  
  // Clear from memory
  tableData = tableData.filter(item => item.TABLE_ID !== tableId);
  
  // Clear from cache
  if (CACHED_TABLE_IDS.includes(tableId)) {
    try {
      await window.storage.delete(`${CACHE_PREFIX}${tableId}`);
    } catch (error) {
      console.error(`Error clearing cache during refresh:`, error);
    }
  }
  
  // Fetch fresh data
  return await fetchTableList(tableId);
};