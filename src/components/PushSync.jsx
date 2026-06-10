import { useEffect } from 'react';
import { useApi } from '../contexts/index.jsx';
import { syncPush } from '../utils/push.js';

/**
 * Invisible helper. Re-registers the device's existing push subscription with the
 * backend on load and whenever auth changes (login/logout in another tab), so the
 * subscription always points at the currently logged-in user.
 */
const PushSync = () => {
  const api = useApi();

  useEffect(() => {
    const run = () => syncPush(api);
    run();
    window.addEventListener('storage', run);
    window.addEventListener('focus', run);
    return () => {
      window.removeEventListener('storage', run);
      window.removeEventListener('focus', run);
    };
  }, [api]);

  return null;
};

export default PushSync;
