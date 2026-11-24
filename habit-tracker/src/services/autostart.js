import { isTauri } from './storage';

export async function getAutostartEnabled() {
  if (!isTauri()) return false;
  try {
    const { isEnabled } = await import('@tauri-apps/plugin-autostart');
    return await isEnabled();
  } catch {
    return false;
  }
}

export async function setAutostartEnabled(enabled) {
  if (!isTauri()) return false;
  try {
    const { enable, disable } = await import('@tauri-apps/plugin-autostart');
    if (enabled) {
      await enable();
    } else {
      await disable();
    }
    return true;
  } catch (e) {
    console.error('[Pulse] autostart', e);
    return false;
  }
}
