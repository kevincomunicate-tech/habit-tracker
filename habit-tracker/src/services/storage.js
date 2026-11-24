/**
 * Persistent storage for Pulse.
 * - In Tauri: writes data.json under appDataDir via @tauri-apps/plugin-fs
 * - In browser: falls back to localStorage (dev without Tauri)
 */

const STORAGE_KEY = 'pulse_data_v2';
const DATA_FILE = 'data.json';

function isTauri() {
  return typeof window !== 'undefined' && !!(window.__TAURI_INTERNALS__ || window.__TAURI__);
}

async function getAppDataPath() {
  const { appDataDir, join } = await import('@tauri-apps/api/path');
  const base = await appDataDir();
  return join(base, DATA_FILE);
}

async function readFromFs() {
  const { readTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');
  const { appDataDir } = await import('@tauri-apps/api/path');
  const dir = await appDataDir();
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // already exists
  }
  const path = await getAppDataPath();
  if (!(await exists(path))) {
    return null;
  }
  const text = await readTextFile(path);
  return JSON.parse(text);
}

async function writeToFs(data) {
  const { writeTextFile, mkdir } = await import('@tauri-apps/plugin-fs');
  const { appDataDir } = await import('@tauri-apps/api/path');
  const dir = await appDataDir();
  try {
    await mkdir(dir, { recursive: true });
  } catch {
    // ok
  }
  const path = await getAppDataPath();
  await writeTextFile(path, JSON.stringify(data, null, 2));
}

function readFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeToLocalStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Load full app state */
export async function loadData() {
  if (isTauri()) {
    try {
      const data = await readFromFs();
      if (data) return data;
    } catch (e) {
      console.warn('[Pulse] FS read failed, trying localStorage', e);
    }
  }
  return readFromLocalStorage();
}

/** Save full app state */
export async function saveData(data) {
  if (isTauri()) {
    try {
      await writeToFs(data);
      return;
    } catch (e) {
      console.warn('[Pulse] FS write failed, falling back to localStorage', e);
    }
  }
  writeToLocalStorage(data);
}

/** Resolve where data lives (for UI) */
export async function getStorageLocation() {
  if (!isTauri()) return 'localStorage (navegador)';
  try {
    const path = await getAppDataPath();
    return path;
  } catch {
    return 'AppData/data.json';
  }
}

export { isTauri, DATA_FILE };
