import React, { useEffect, useState } from "react";
import {
  ShoppingCart, Users, CheckCircle, IndianRupee, XCircle,
  Package, FolderOpen, Layers, ClipboardList, BadgePercent, ArrowRight,
} from "lucide-react";
import { useApi } from "../../contexts/index.jsx";

const Dashboard = ({ onNavigate }) => {
  const {
    getDashboardStats, fetchItems, fetchCategories, getAllSubcategories,
    items, categories, loading, dashboardRefreshTrigger,
  } = useApi();
  const [stats, setStats] = useState({
    newOrders: 0,
    totalCustomers: 0,
    ticketsResolved: 0,
    revenueToday: 0,
    failedOrders: 0,
  });

  useEffect(() => {
    loadDashboardStats();
  }, [items, categories, dashboardRefreshTrigger]);

  const loadDashboardStats = async () => {
    try {
      const data = await getDashboardStats();
      if (data && Object.keys(data).length > 0) {
        setStats({
          newOrders: data.newOrders || 0,
          totalCustomers: data.totalCustomers || 0,
          ticketsResolved: data.ticketsResolved || 0,
          revenueToday: data.revenueToday || 0,
          failedOrders: data.failedOrders || 0,
        });
      } else {
        await loadFallbackStats();
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      await loadFallbackStats();
    }
  };

  const loadFallbackStats = async () => {
    try {
      await fetchItems();
      await fetchCategories();
      await getAllSubcategories();
    } catch (error) {
      console.error('Error loading fallback stats:', error);
    }
  };

  const statCards = [
    { key: 'newOrders', label: 'New Orders', value: stats.newOrders, icon: ShoppingCart, tint: 'bg-rose-50 text-[#d80a4e]', tab: 'orders' },
    { key: 'revenueToday', label: 'Revenue Today', value: `₹${Number(stats.revenueToday || 0).toLocaleString('en-IN')}`, icon: IndianRupee, tint: 'bg-amber-50 text-amber-600', tab: 'orders' },
    { key: 'totalCustomers', label: 'Customers', value: stats.totalCustomers, icon: Users, tint: 'bg-blue-50 text-blue-600' },
    { key: 'ticketsResolved', label: 'Tickets Resolved', value: stats.ticketsResolved, icon: CheckCircle, tint: 'bg-emerald-50 text-emerald-600', tab: 'tickets' },
    { key: 'failedOrders', label: 'Failed Orders', value: stats.failedOrders, icon: XCircle, tint: 'bg-red-50 text-red-600', tab: 'failed-orders' },
  ];

  const quickLinks = [
    { label: 'Products', sub: `${items?.length || 0} items`, icon: Package, tab: 'products' },
    { label: 'Categories', sub: `${categories?.length || 0} groups`, icon: FolderOpen, tab: 'categories' },
    { label: 'Subcategories', sub: 'Organize menu', icon: Layers, tab: 'subcategories' },
    { label: 'Orders', sub: 'View & manage', icon: ClipboardList, tab: 'orders' },
    { label: 'Sweet Deal', sub: 'Promotions', icon: BadgePercent, tab: 'sweetdeal' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-rose-100 border-t-[#d80a4e]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-gray-900 sm:text-3xl">Welcome back 👋</h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening at your shop today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map(({ key, label, value, icon: Icon, tint, tab }) => (
          <button
            key={key}
            onClick={() => tab && onNavigate?.(tab)}
            disabled={!tab}
            className={`flex flex-col items-start rounded-2xl border border-amber-100 bg-white p-4 text-left shadow-sm transition-all ${
              tab ? 'hover:-translate-y-0.5 hover:shadow-md' : 'cursor-default'
            }`}
          >
            <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
            </span>
            <span className="mt-0.5 text-xs font-medium text-gray-500">{label}</span>
          </button>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-400">Manage</h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        {quickLinks.map(({ label, sub, icon: Icon, tab }) => (
          <button
            key={label}
            onClick={() => onNavigate?.(tab)}
            className="group flex items-center gap-3 rounded-2xl border border-amber-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#d80a4e] transition-colors group-hover:bg-[#d80a4e] group-hover:text-white">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-gray-900">{label}</span>
              <span className="block truncate text-xs text-gray-400">{sub}</span>
            </span>
            <ArrowRight className="ml-auto hidden h-4 w-4 text-gray-300 transition-colors group-hover:text-[#d80a4e] sm:block" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
