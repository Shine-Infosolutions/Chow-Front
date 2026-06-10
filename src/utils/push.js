/**
 * Web Push client helpers.
 *
 * Cross-platform notes:
 *  - Android/Chrome/Edge: works in the browser tab once permission is granted.
 *  - iOS/Safari: web push ONLY works when the site is installed to the Home Screen
 *    (Add to Home Screen) and running standalone, on iOS 16.4+. In a normal Safari
 *    tab the PushManager is unavailable, so we guide the user to install first.
 */

export const isPushSupported = () =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof window !== 'undefined' &&
  'PushManager' in window &&
  'Notification' in window;

export const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent || '') ||
    // iPadOS 13+ reports as Mac; detect by touch points.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true);

// On iOS, push requires the installed (standalone) PWA.
export const iosNeedsInstall = () => isIOS() && !isStandalone();

export const getPermission = () =>
  'Notification' in window ? Notification.permission : 'unsupported';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.ready);
  } catch {
    return null;
  }
}

export async function getExistingSubscription() {
  const reg = await getRegistration();
  if (!reg) return null;
  try {
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Request permission, create a push subscription, and register it with the backend
 * for the logged-in user. Returns { ok, reason }.
 *  reason: 'unsupported' | 'ios-install' | 'denied' | 'default' | 'not-configured' | 'no-sw' | 'server'
 */
export async function enablePush(api) {
  if (!isPushSupported()) {
    return { ok: false, reason: iosNeedsInstall() ? 'ios-install' : 'unsupported' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: permission };

  const keyRes = await api.service.get('/api/push/vapid-public-key').catch(() => null);
  if (!keyRes || !keyRes.publicKey) return { ok: false, reason: 'not-configured' };

  const reg = await getRegistration();
  if (!reg) return { ok: false, reason: 'no-sw' };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyRes.publicKey),
    });
  }

  try {
    await api.service.post('/api/push/subscribe', { subscription: sub.toJSON() });
  } catch {
    return { ok: false, reason: 'server' };
  }
  return { ok: true };
}

export async function disablePush(api) {
  const sub = await getExistingSubscription();
  if (sub) {
    try {
      await api.service.post('/api/push/unsubscribe', { endpoint: sub.endpoint });
    } catch {
      /* best-effort */
    }
    try {
      await sub.unsubscribe();
    } catch {
      /* best-effort */
    }
  }
  return { ok: true };
}

/**
 * Re-register the existing subscription with the backend for the current user.
 * Run on app load / after login so the subscription's userId stays correct
 * (e.g. another account logging in on a shared device) and survives server pruning.
 */
export async function syncPush(api) {
  try {
    if (!isPushSupported() || Notification.permission !== 'granted') return;
    if (!localStorage.getItem('token')) return;
    const sub = await getExistingSubscription();
    if (sub) {
      await api.service.post('/api/push/subscribe', { subscription: sub.toJSON() });
    }
  } catch {
    /* best-effort */
  }
}

export async function sendTestPush(api) {
  try {
    return await api.service.post('/api/push/test', {});
  } catch {
    return null;
  }
}
