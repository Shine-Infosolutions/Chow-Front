import React, { useEffect, useState } from 'react';
import { X, Download, Share, Plus, Bell, Loader2 } from 'lucide-react';
import { useApi, useNotification } from '../contexts/index.jsx';
import logo from '../assets/logo.png';
import {
  isIOS, isStandalone, isPushSupported, iosNeedsInstall, getPermission,
  getExistingSubscription, enablePush, sendTestPush,
} from '../utils/push.js';

const INSTALL_DISMISS = 'pwa_install_dismissed';
const NOTIF_DISMISS = 'push_prompt_dismissed';

const REASON_MESSAGES = {
  'ios-install': 'Add the app to your Home Screen first, then turn on notifications.',
  denied: 'Notifications are blocked. Allow them in your browser settings to turn this on.',
  default: 'Permission was dismissed — tap Enable and choose “Allow”.',
  'not-configured': 'Notifications aren’t available right now. Please try again later.',
  unsupported: 'This browser doesn’t support notifications.',
  'no-sw': 'Still setting up — please refresh and try again.',
  server: 'Couldn’t save your subscription. Please try again.',
};

// Watch login state from localStorage (updated by login/logout, possibly in another tab).
const readAuth = () => {
  try {
    return { token: localStorage.getItem('token'), user: JSON.parse(localStorage.getItem('user') || 'null') };
  } catch {
    return { token: null, user: null };
  }
};

/**
 * Coordinated floating prompts (bottom of screen), at most two stacked cards:
 *   1. Enable order-update notifications  — for logged-in customers who haven't opted in.
 *   2. Install the app                    — for anyone not running the installed PWA.
 * Both are dismissible and never overlap. Notifications sit on top (primary CTA).
 */
const EngagementPrompts = () => {
  const api = useApi();
  const { showNotification } = useNotification();
  const [{ token, user }, setAuth] = useState(readAuth);
  const loggedIn = Boolean(token && user);

  // ---- Install state ----
  const [deferred, setDeferred] = useState(null);
  const [iosInstallHint, setIosInstallHint] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(() => {
    try { return Boolean(localStorage.getItem(INSTALL_DISMISS)); } catch { return false; }
  });

  // ---- Notification state ----
  const [permission, setPermission] = useState(getPermission());
  const [subscribed, setSubscribed] = useState(true); // optimistic until checked (avoids a flash)
  const [notifDismissed, setNotifDismissed] = useState(() => {
    try { return Boolean(sessionStorage.getItem(NOTIF_DISMISS)); } catch { return false; }
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onAuth = () => setAuth(readAuth());
    window.addEventListener('storage', onAuth);
    window.addEventListener('focus', onAuth);
    return () => {
      window.removeEventListener('storage', onAuth);
      window.removeEventListener('focus', onAuth);
    };
  }, []);

  useEffect(() => {
    if (isStandalone()) return undefined;
    const onBIP = (e) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', onBIP);
    let timer;
    if (isIOS() && !isStandalone()) {
      timer = setTimeout(() => setIosInstallHint(true), 2500);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Re-check subscription whenever auth changes.
  useEffect(() => {
    let active = true;
    getExistingSubscription().then((s) => { if (active) setSubscribed(Boolean(s)); });
    return () => { active = false; };
  }, [loggedIn, token]);

  const installable = !isStandalone() && !installDismissed && (Boolean(deferred) || iosInstallHint);
  const canNotify =
    loggedIn && isPushSupported() && !iosNeedsInstall() &&
    permission === 'default' && !subscribed && !notifDismissed;

  const dismissInstall = () => {
    setInstallDismissed(true);
    try { localStorage.setItem(INSTALL_DISMISS, '1'); } catch { /* ignore */ }
  };
  const doInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    setDeferred(null);
    dismissInstall();
  };

  const dismissNotif = () => {
    setNotifDismissed(true);
    try { sessionStorage.setItem(NOTIF_DISMISS, '1'); } catch { /* ignore */ }
  };
  const doEnable = async () => {
    setBusy(true);
    try {
      const res = await enablePush(api);
      if (res.ok) {
        setSubscribed(true);
        setPermission('granted');
        showNotification('Notifications enabled! 🔔', 'success');
        sendTestPush(api);
      } else {
        setPermission(getPermission());
        showNotification(REASON_MESSAGES[res.reason] || 'Could not enable notifications.', 'error', 5000);
        if (res.reason === 'denied') dismissNotif();
      }
    } catch {
      showNotification('Could not enable notifications.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!installable && !canNotify) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[90] mx-auto flex w-[min(94vw,30rem)] flex-col gap-2 lg:bottom-5">
      {/* Notifications — primary, on top */}
      {canNotify && (
        <div className="animate-toast-in flex items-start gap-3 rounded-2xl border border-rose-100 bg-white p-3.5 shadow-xl shadow-black/10">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#d80a4e]">
            <Bell className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900">Get order updates</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              Turn on alerts for confirmation, delivery &amp; order changes — even when the app is closed.
            </p>
            <button
              onClick={doEnable}
              disabled={busy}
              className="mt-2.5 inline-flex items-center gap-2 rounded-xl bg-[#d80a4e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8083e] disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              {busy ? 'Enabling…' : 'Enable notifications'}
            </button>
          </div>
          <button onClick={dismissNotif} aria-label="Dismiss" className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Install */}
      {installable && (
        <div className="animate-toast-in flex items-start gap-3 rounded-2xl border border-amber-100 bg-white p-3.5 shadow-xl shadow-black/10">
          <img src={logo} alt="" className="h-11 w-11 shrink-0 rounded-xl object-contain" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900">Install Chowdhry Sweet House</h3>
            {iosInstallHint && !deferred ? (
              <p className="mt-0.5 flex flex-wrap items-center gap-1 text-sm text-gray-500">
                Tap <Share className="inline h-4 w-4 text-[#d80a4e]" /> then
                <span className="font-medium text-gray-700">Add to Home Screen</span>
                <Plus className="inline h-4 w-4 text-[#d80a4e]" />
              </p>
            ) : (
              <>
                <p className="mt-0.5 text-sm text-gray-500">
                  Add it to your home screen for a faster, app-like experience.
                </p>
                <button
                  onClick={doInstall}
                  className="mt-2.5 inline-flex items-center gap-2 rounded-xl bg-[#d80a4e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8083e]"
                >
                  <Download className="h-4 w-4" /> Install app
                </button>
              </>
            )}
          </div>
          <button onClick={dismissInstall} aria-label="Dismiss" className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EngagementPrompts;
