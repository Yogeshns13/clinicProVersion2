const SECRET_KEY = "your_super_secret_key_32chars!!"; // store in .env as VITE_SECRET_KEY

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const getKey = async () => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET_KEY.padEnd(32, "!").slice(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  return keyMaterial;
};

export const encryptData = async (value) => {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(String(value))
  );
  const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
  return btoa(String.fromCharCode(...combined));
};

export const decryptData = async (cipherText) => {
  const key = await getKey();
  const combined = Uint8Array.from(atob(cipherText), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  return decoder.decode(decrypted);
};

export const setEncrypted = async (key, value) => {
  const encrypted = await encryptData(value);
  localStorage.setItem(key, encrypted);
};

export const getDecrypted = async (key) => {
  const encrypted = localStorage.getItem(key);
  if (!encrypted) return null;
  return await decryptData(encrypted);
};


export const getStoredClinicId = async () => {
  const clinicId = await getDecrypted('clinicID');
  return clinicId ? parseInt(clinicId, 10) : null;
};

export const getStoredBranchId = async () => {
  const branchId = await getDecrypted('branchID');
  return branchId ? parseInt(branchId, 10) : null;
};

export const getStoredUserId = async () => {
  const userId = await getDecrypted('userID');
  return userId ? parseInt(userId, 10) : null;
};

export const getStoredClinicName = async () => {
  const clincName = await getDecrypted('clinicName');
  return clincName || null;   
};

export const getStoredFileAccessToken = async () => {
  const fileAccessToken = await getDecrypted('fileAccessToken');
  return fileAccessToken || null;
};

export const getStoredInPharmacy = async () => {
  const inPharmacyAvailable = await getDecrypted('yxyz');
  return inPharmacyAvailable ? parseInt(inPharmacyAvailable, 10) : null;
};

export const getStoredInLab = async () => {
  const inLabAvailable = await getDecrypted('bxyz');
  return inLabAvailable ? parseInt(inLabAvailable, 10) : null;
};