import React, { useEffect, useState } from 'react';
import { X, Download, Share, Plus } from 'lucide-react';
import { isIOS, isStandalone } from '../utils/push.js';
import logo from '../assets/logo.png';

const DISMISS_KEY = 'pwa_install_dismissed';

/**
 * Dismissible "install this app" banner.
 *  - Android/Chromium: uses the captured beforeinstallprompt event → one-tap install.
 *  - iOS Safari: no install API exists, so we show the Share → Add to Home Screen steps
 *    (also the prerequisite for push notifications on iOS).
 */
const InstallPrompt = () => {
  const [deferred, setDeferred] = useState(null);
  const [iosHint, setIosHint] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return undefined;
    try {
      if (localStorage.getItem(DISMISS_KEY)) return undefined;
    } catch {
      /* ignore */
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    let timer;
    if (isIOS()) {
      // iOS never fires beforeinstallprompt — nudge with manual steps after a beat.
      timer = setTimeout(() => {
        setIosHint(true);
        setShow(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    setDeferred(null);
    dismiss();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-[90] mx-auto w-[min(94vw,30rem)] px-0 lg:bottom-5">
      <div className="animate-toast-in flex items-start gap-3 rounded-2xl border border-amber-100 bg-white p-3.5 shadow-xl shadow-black/10">
        <img src={logo} alt="" className="h-11 w-11 shrink-0 rounded-xl object-contain" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900">Install Chowdhry Sweet House</h3>
          {iosHint ? (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
              Tap <Share className="inline h-4 w-4 text-[#d80a4e]" /> then
              <span className="font-medium text-gray-700">Add to Home Screen</span>
              <Plus className="inline h-4 w-4 text-[#d80a4e]" />
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-gray-500">
              Add it to your home screen for a faster, app-like experience and order alerts.
            </p>
          )}

          {!iosHint && (
            <button
              onClick={install}
              className="mt-2.5 inline-flex items-center gap-2 rounded-xl bg-[#d80a4e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b8083e]"
            >
              <Download className="h-4 w-4" /> Install app
            </button>
          )}
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
