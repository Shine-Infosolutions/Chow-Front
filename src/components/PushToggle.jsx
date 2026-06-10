import React, { useEffect, useState } from 'react';
import { Bell, BellRing, BellOff, Check, Loader2, Share } from 'lucide-react';
import { useApi, useNotification } from '../contexts/index.jsx';
import {
  isPushSupported, iosNeedsInstall, getPermission,
  getExistingSubscription, enablePush, disablePush, sendTestPush,
} from '../utils/push.js';

const REASON_MESSAGES = {
  'ios-install': 'On iPhone/iPad, add the app to your Home Screen first, then turn on notifications.',
  denied: 'Notifications are blocked. Allow them in your browser settings to turn this on.',
  default: 'Permission was dismissed — tap Enable and choose “Allow”.',
  'not-configured': 'Notifications aren’t available right now. Please try again later.',
  unsupported: 'This browser doesn’t support notifications.',
  'no-sw': 'Still setting up — please refresh and try again.',
  server: 'Couldn’t save your subscription. Please try again.',
};

/**
 * Enable/disable web-push for the signed-in user. Used on the customer profile and
 * in the admin panel. iOS-aware: shows an "install to Home Screen" hint when push
 * isn't available in a Safari tab.
 */
const PushToggle = ({ audience = 'customer', compact = false }) => {
  const api = useApi();
  const { showNotification } = useNotification();
  const [permission, setPermission] = useState(getPermission());
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const supported = isPushSupported();
  const needsInstall = iosNeedsInstall();

  useEffect(() => {
    let active = true;
    getExistingSubscription().then((sub) => {
      if (active) setSubscribed(Boolean(sub));
    });
    return () => { active = false; };
  }, []);

  const handleEnable = async () => {
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
      }
    } catch {
      showNotification('Could not enable notifications.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    try {
      await disablePush(api);
      setSubscribed(false);
      showNotification('Notifications turned off.', 'info');
    } finally {
      setBusy(false);
    }
  };

  // Nothing actionable on an unsupported, non-iOS browser → render nothing.
  if (!supported && !needsInstall) return null;

  const isOn = supported && permission === 'granted' && subscribed;
  const blocked = supported && permission === 'denied';
  const lead = audience === 'admin' ? 'New order alerts' : 'Order updates';
  const sub = audience === 'admin'
    ? 'Get a notification the moment a customer places an order, even when this tab is closed.'
    : 'Get notified about confirmations, delivery and order changes — even when the app is closed.';

  // iOS Safari tab: must install first.
  const installHint = (
    <div className="flex items-start gap-1.5 text-xs text-gray-500">
      <Share className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>Tap the Share button, then <span className="font-medium text-gray-700">“Add to Home Screen”</span>. Open the app from there and turn this on.</span>
    </div>
  );

  const Icon = isOn ? BellRing : blocked ? BellOff : Bell;
  const iconWrap = isOn
    ? 'bg-emerald-50 text-emerald-600'
    : blocked
      ? 'bg-gray-100 text-gray-400'
      : 'bg-rose-50 text-[#d80a4e]';

  return (
    <div className={`rounded-2xl border ${isOn ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-100 bg-white'} ${compact ? 'p-3' : 'p-4 sm:p-5'} shadow-sm`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconWrap}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{lead}</h3>
            {isOn && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <Check className="h-3 w-3" /> On
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">{sub}</p>

          <div className="mt-3">
            {needsInstall ? (
              installHint
            ) : blocked ? (
              <p className="text-xs text-gray-500">
                Notifications are blocked for this site. Enable them in your browser’s site settings, then refresh.
              </p>
            ) : isOn ? (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => sendTestPush(api).then(() => showNotification('Test notification sent.', 'info'))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Send test
                </button>
                <button
                  onClick={handleDisable}
                  disabled={busy}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-[#d80a4e] disabled:opacity-50"
                >
                  {busy ? 'Turning off…' : 'Turn off'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleEnable}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-[#d80a4e] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#b8083e] disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                {busy ? 'Enabling…' : 'Enable notifications'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PushToggle;
