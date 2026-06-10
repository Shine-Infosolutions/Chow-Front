import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingBag } from 'lucide-react';
import { useSeo } from '../../hooks/useSeo.js';

const NotFound = () => {
  useSeo({ title: 'Page Not Found', path: '/404', noindex: true });

  return (
    <div className="mithai-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="animate-fade-up w-full max-w-md rounded-3xl border border-amber-100 bg-white p-8 text-center shadow-xl">
        <p className="font-display text-7xl font-bold text-[#d80a4e]">404</p>
        <h1 className="font-display mt-2 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-gray-600">
          Looks like this page melted away. Let's get you back to something sweet.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d80a4e] py-3 text-sm font-semibold text-white transition hover:bg-[#b8083e]"
          >
            <Home className="h-4 w-4" /> Go Home
          </Link>
          <Link
            to="/shop"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            <ShoppingBag className="h-4 w-4" /> Browse Sweets
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
