import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Package, ChevronRight } from 'lucide-react';
import { useApi } from '../contexts/index.jsx';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'shipped'];
const STATUS_TEXT = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  PENDING: 'Order Placed',
  SHIPMENT_CREATED: 'Shipped',
  IN_TRANSIT: 'In Transit',
  OUT_FOR_DELIVERY: 'Out for Delivery',
};

/**
 * Blinkit-style sticky tracker for the shopper's latest active order.
 * Fixed bottom bar on mobile, floating card bottom-right on desktop.
 * Auto-hides when there is no active order; dismissible per order.
 */
const ActiveOrderBar = () => {
  const { getMyOrders } = useApi();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const uid = user._id || user.id;
      const token = localStorage.getItem('token');
      if (!uid || !token) {
        setOrder(null);
        return;
      }
      const orders = await getMyOrders(uid);
      const active = (Array.isArray(orders) ? orders : []).find(
        (o) =>
          ACTIVE_STATUSES.includes(o.status) &&
          !['DELIVERED', 'RTO', 'PRE_PICKUP_CANCEL'].includes(o.deliveryStatus)
      );
      setOrder(active || null);
    } catch {
      setOrder(null);
    }
  }, [getMyOrders]);

  useEffect(() => {
    load();
  }, [load, location.pathname]);

  const hideOn =
    location.pathname.startsWith('/admin') ||
    location.pathname === '/orders' ||
    location.pathname === '/checkout';

  if (!order || dismissed || hideOn) return null;
  if (sessionStorage.getItem(`ao_dismiss_${order._id}`)) return null;

  const label = STATUS_TEXT[order.deliveryStatus] || STATUS_TEXT[order.status] || 'In Progress';
  const deliveryDate = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : null;

  return (
    <div className="animate-fade-up fixed inset-x-0 bottom-0 z-[90] px-3 pb-3 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-sm sm:px-0 sm:pb-0">
      <div className="relative">
        <Link to="/orders" className="block">
          <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-white p-3 shadow-lg shadow-rose-100/70 sm:p-4">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d80a4e] to-[#8b1a3a] text-white">
              <Package className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-pulse rounded-full bg-amber-400 ring-2 ring-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display truncate text-sm font-semibold text-gray-900">
                Order #{order._id?.slice(-6)} · {label}
              </p>
              <p className="truncate text-xs text-gray-500">
                {deliveryDate ? `Delivery by ${deliveryDate}` : 'Delivery date will be confirmed soon'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
          </div>
        </Link>
        <button
          onClick={() => {
            sessionStorage.setItem(`ao_dismiss_${order._id}`, '1');
            setDismissed(true);
          }}
          className="absolute -top-2 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white shadow sm:-right-2"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ActiveOrderBar;
