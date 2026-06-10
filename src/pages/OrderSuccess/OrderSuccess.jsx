import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { useSeo } from '../../hooks/useSeo.js';

/**
 * Post-payment confirmation. Reached from Checkout with order details in
 * router state. Visiting directly (no state) falls back to the orders list.
 */
const OrderSuccess = () => {
  useSeo({ title: 'Order Confirmed', path: '/order-success', noindex: true });
  const { state } = useLocation();

  if (!state?.orderId) return <Navigate to="/orders" replace />;

  const shortId = String(state.orderId).slice(-8).toUpperCase();

  return (
    <div className="mithai-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="animate-splash-pop h-12 w-12 text-emerald-500" />
        </div>

        <h1 className="font-display text-2xl font-bold text-gray-900 sm:text-3xl">Order Confirmed!</h1>
        <p className="mt-2 text-gray-600">
          {state.name ? `Thank you, ${state.name}. ` : 'Thank you! '}
          Your sweets are being prepared with love. 🍬
        </p>

        {/* Order summary chip */}
        <div className="mt-6 rounded-2xl border border-amber-100 bg-[#fdf6ee] p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Order ID</span>
            <span className="font-mono text-sm font-semibold text-gray-900">#{shortId}</span>
          </div>
          {state.total != null && (
            <div className="mt-2 flex items-center justify-between border-t border-dashed border-amber-200 pt-2">
              <span className="text-sm text-gray-500">Amount Paid</span>
              <span className="text-lg font-bold text-[#d80a4e]">₹{Number(state.total).toFixed(2)}</span>
            </div>
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <Package className="h-3.5 w-3.5" /> We'll confirm your delivery date shortly.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/orders"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d80a4e] py-3 text-sm font-semibold text-white transition hover:bg-[#b8083e]"
          >
            Track Order <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/shop"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ShoppingBag className="h-4 w-4" /> Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
