import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Layers, Package, BadgePercent,
  ClipboardList, AlertTriangle, MessageSquare, LogOut, Menu, X,
  MoreHorizontal, ChevronRight,
} from 'lucide-react';
import Dashboard from './Dashboard.jsx';
import Products from './Products.jsx';
import Categories from './Categories.jsx';
import Subcategories from './Subcategories.jsx';
import AdminOrders from './AdminOrders.jsx';
import Tickets from './Tickets.jsx';
import FailedOrders from './FailedOrders.jsx';
import SweetDeal from './SweetDeal.jsx';
import logo from '../../assets/logo.png';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'subcategories', label: 'Subcategories', icon: Layers },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'sweetdeal', label: 'Sweet Deal', icon: BadgePercent },
  { id: 'orders', label: 'Orders', icon: ClipboardList },
  { id: 'failed-orders', label: 'Failed Orders', icon: AlertTriangle },
  { id: 'tickets', label: 'Messages', icon: MessageSquare },
];

// Primary destinations shown in the mobile bottom bar (rest live under "More")
const MOBILE_PRIMARY = ['dashboard', 'orders', 'products', 'tickets'];

const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Set active tab based on URL
  useEffect(() => {
    if (location.pathname === '/admin/orders') {
      setActiveTab('orders');
    }
  }, [location.pathname]);

  const go = (id) => {
    setActiveTab(id);
    setDrawerOpen(false);
  };

  const activeMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={go} />;
      case 'products': return <Products />;
      case 'categories': return <Categories />;
      case 'subcategories': return <Subcategories />;
      case 'sweetdeal': return <SweetDeal />;
      case 'orders': return <AdminOrders />;
      case 'failed-orders': return <FailedOrders />;
      case 'tickets': return <Tickets />;
      default: return <Dashboard />;
    }
  };

  const NavItem = ({ tab, onClick }) => {
    const Icon = tab.icon;
    const active = activeTab === tab.id;
    return (
      <button
        onClick={onClick}
        className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
          active
            ? 'bg-[#d80a4e] text-white shadow-md shadow-rose-200'
            : 'text-gray-600 hover:bg-rose-50 hover:text-[#d80a4e]'
        }`}
      >
        <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-[#d80a4e]'}`} />
        <span className="truncate">{tab.label}</span>
        {active && <ChevronRight className="ml-auto h-4 w-4 opacity-80" />}
      </button>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#fdf6ee]">
      {/* ===================== Desktop Sidebar ===================== */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-amber-100 bg-white lg:flex">
        <div className="flex items-center justify-center border-b border-amber-100 px-4 py-5">
          <img src={logo} alt="Chowdhry Sweet House" className="h-16 w-auto object-contain" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Menu</p>
          {TABS.map((tab) => (
            <NavItem key={tab.id} tab={tab} onClick={() => go(tab.id)} />
          ))}
        </nav>
        <div className="border-t border-amber-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* ===================== Mobile Drawer ===================== */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[82%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-amber-100 px-4 py-4">
          <img src={logo} alt="Chowdhry Sweet House" className="h-12 w-auto object-contain" />
          <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {TABS.map((tab) => (
            <NavItem key={tab.id} tab={tab} onClick={() => go(tab.id)} />
          ))}
        </nav>
        <div className="border-t border-amber-100 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5 text-gray-400" />
            Logout
          </button>
        </div>
      </aside>

      {/* ===================== Main Column ===================== */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-amber-100 bg-white/90 px-3 py-3 backdrop-blur sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-rose-50 hover:text-[#d80a4e] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display truncate text-base font-bold text-gray-900 sm:text-lg">
                {activeMeta.label}
              </h1>
              <p className="hidden text-xs text-gray-400 sm:block">Chowdhry Sweet House · Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#d80a4e] to-[#8b1a3a] text-sm font-bold text-white">
              A
            </div>
            <button
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-[#d80a4e] sm:flex"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:pb-0">
          {renderContent()}
        </main>
      </div>

      {/* ===================== Mobile Bottom Nav ===================== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-amber-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {MOBILE_PRIMARY.map((id) => {
          const tab = TABS.find((t) => t.id === id);
          const Icon = tab.icon;
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => go(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                active ? 'text-[#d80a4e]' : 'text-gray-400'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-[#d80a4e]' : ''}`} />
              {tab.label}
            </button>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium text-gray-400"
        >
          <MoreHorizontal className="h-5 w-5" />
          More
        </button>
      </nav>
    </div>
  );
};

export default Admin;
