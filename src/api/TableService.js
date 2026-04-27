import { openDB } from "idb";
import { generateRefKey, getSessionRef, getUserId } from "./Api.js";
import { API } from "./ApiConfiguration";

let memoryCache = {}; 

const DB_NAME = "TableDB";
const STORE_NAME = "tables";
const DB_VERSION = 1;
const CHANNEL_ID = 1;

// -------------------- DB INIT --------------------
const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

// -------------------- NORMALIZE --------------------
const normalizeData = (data) => {
  const map = {};

  data.forEach(item => {
    if (!map[item.TABLE_ID]) {
      map[item.TABLE_ID] = {
        desc: item.TABLE_DESC,
        values: {},
      };
    }

    map[item.TABLE_ID].values[item.TEXT_ID] = item.TEXT_VALUE;
  });

  return map;
};

// -------------------- SAVE TO DB --------------------
const saveToDB = async (data) => {
  const db = await getDB();
  await db.put(STORE_NAME, data, "ALL_TABLES");
};

// -------------------- LOAD FROM DB --------------------
const loadFromDB = async () => {
  const db = await getDB();
  return db.get(STORE_NAME, "ALL_TABLES");
};

// -------------------- FETCH FROM API --------------------
const fetchFromAPI = async () => {
  const payload = {
    CHANNEL_ID,
    REF_KEY: generateRefKey(),
    SESSION_REF: getSessionRef(),
    USER_ID: parseInt(getUserId() || 2000000),
    TableID: 0, 
  };

  const res = await API.post("/GetTextTableList", payload);
  return res.data?.result || [];
};

// -------------------- INIT --------------------
export const initTables = async () => {
  // 1. Try memory
  if (Object.keys(memoryCache).length > 0) return;

  // 2. Try IndexedDB
  const cached = await loadFromDB();
  if (cached) {
    memoryCache = cached;
    console.log("Loaded from IndexedDB");
  }

  // 3. Always fetch latest in background
  syncTables();
};

// -------------------- SYNC --------------------
export const syncTables = async () => {
  try {
    const apiData = await fetchFromAPI();
    const normalized = normalizeData(apiData);

    memoryCache = normalized;
    await saveToDB(normalized);

    console.log("Tables synced");
  } catch (err) {
    console.error("Table sync failed:", err);
  }
};

// -------------------- GETTERS --------------------
export const getText = (tableId, textId) => {
  return memoryCache?.[tableId]?.values?.[textId] || null;
};

export const getTable = (tableId) => {
  return memoryCache?.[tableId] || null;
};

export const getValues = (tableId) => {
  const table = memoryCache?.[tableId];
  if (!table) return [];

  return Object.entries(table.values).map(([id, value]) => ({
    textId: Number(id),
    textValue: value,
  }));
};

export const getDescription = (tableId) => {
  return memoryCache?.[tableId]?.desc || null;
};