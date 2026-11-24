/**
 * Notifications for Pulse.
 * - Tauri desktop: @tauri-apps/plugin-notification (native OS center)
 * - Browser fallback: Web Notifications API
 * + Web Audio chimes (always available in WebView)
 */

import { isTauri } from './storage';

let cachedPermission = null;

export function playChime(type = 'soft') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'soft') {
      osc.frequency.value = 660;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'focus-end') {
      osc.frequency.value = 523.25;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } else {
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // ignore
  }
}

export async function getNotificationPermission() {
  if (isTauri()) {
    try {
      const { isPermissionGranted } = await import('@tauri-apps/plugin-notification');
      const granted = await isPermissionGranted();
      cachedPermission = granted ? 'granted' : 'prompt';
      return cachedPermission;
    } catch {
      return 'unsupported';
    }
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission() {
  if (isTauri()) {
    try {
      const { isPermissionGranted, requestPermission } = await import(
        '@tauri-apps/plugin-notification'
      );
      let granted = await isPermissionGranted();
      if (!granted) {
        const result = await requestPermission();
        granted = result === 'granted';
      }
      cachedPermission = granted ? 'granted' : 'denied';
      return cachedPermission;
    } catch (e) {
      console.error(e);
      return 'denied';
    }
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export async function showNotification(title, options = {}) {
  if (isTauri()) {
    try {
      const { isPermissionGranted, sendNotification } = await import(
        '@tauri-apps/plugin-notification'
      );
      if (!(await isPermissionGranted())) return null;
      sendNotification({
        title,
        body: options.body || '',
      });
      return true;
    } catch (e) {
      console.error('[Pulse] tauri notify', e);
      return null;
    }
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return null;
  try {
    return new Notification(title, {
      icon: '/vite.svg',
      ...options,
    });
  } catch {
    return null;
  }
}

export async function testNotification() {
  playChime('soft');
  return showNotification('Pulse — Prueba', {
    body: 'Las notificaciones nativas funcionan correctamente.',
  });
}

const fired = new Set();

export async function checkScheduledAlerts({ habits, completions, timeBlocks }) {
  const perm = cachedPermission || (await getNotificationPermission());
  if (perm !== 'granted') return;

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const hour = now.getHours();
  const minute = now.getMinutes();
  const nowMin = hour * 60 + minute;

  const blocks = timeBlocks[todayKey] || [];
  for (const b of blocks) {
    const [sh, sm] = b.start.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const key = `block-start-${b.id}-${todayKey}`;
    if (Math.abs(nowMin - startMin) <= 1 && !fired.has(key)) {
      fired.add(key);
      playChime('soft');
      await showNotification('Bloque de tiempo', {
        body: `${b.title} · ${b.start}–${b.end}`,
      });
    }
  }

  const dayComp = completions[todayKey] || {};
  for (const h of habits || []) {
    if (h.type === 'break' || dayComp[h.id] || !h.intentionHour) continue;
    const [ih, im = 0] = String(h.intentionHour).split(':').map(Number);
    const target = ih * 60 + (im || 0);
    const key = `habit-${h.id}-${todayKey}`;
    if (Math.abs(nowMin - target) <= 1 && !fired.has(key)) {
      fired.add(key);
      playChime('soft');
      await showNotification(`Hábito: ${h.name}`, {
        body: h.intentionPlace
          ? `En ${h.intentionPlace}${h.anchorHabit ? ` · después de ${h.anchorHabit}` : ''}`
          : 'Es tu hora ancla',
      });
    }
  }
}

export async function notifyFocusEnd(label) {
  playChime('focus-end');
  await showNotification('Sesión de enfoque terminada', {
    body: label || 'Toma un descanso consciente.',
  });
}
