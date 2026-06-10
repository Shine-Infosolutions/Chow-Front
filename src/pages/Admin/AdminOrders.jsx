import React, { useState, useEffect } from 'react';
import { useApi } from '../../contexts/index.jsx';
import { useNavigate } from 'react-router-dom';
import { deriveOrderStatus } from '../../utils/orderStatus.js';
import {
  SlidersHorizontal, RefreshCw, ChevronLeft, ChevronRight,
  CreditCard, FileText, ExternalLink, ClipboardList,
} from 'lucide-react';

const AdminOrders = () => {
  const { getAllOrders, updateOrderStatus, updatePaymentStatus, createShipment, trackOrder, updateDeliveryStatus, service } = useApi();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [trackingData, setTrackingData] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    deliveryProvider: 'all', // all, delhivery, self
    orderStatus: 'all', // all, pending, confirmed, shipped, delivered, cancelled
    paymentStatus: 'all', // all, pending, paid, failed
    deliveryStatus: 'all', // all, PENDING, SHIPMENT_CREATED, IN_TRANSIT, DELIVERED, RTO
    dateRange: 'all', // all, today, week, month
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    delhivery: 0,
    self: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders(currentPage, itemsPerPage);
      const ordersData = response.orders || [];
      setOrders(ordersData);
      setTotalPages(response.pagination?.pages || 1);
      setTotalItems(response.pagination?.total || 0);
      calculateStats(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      alert('Error fetching orders. Please check your connection.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersData) => {
    const stats = {
      total: ordersData.length,
      delhivery: ordersData.filter(o => o.deliveryProvider === 'DELHIVERY' || o.shipping?.provider === 'DELHIVERY').length,
      self: ordersData.filter(o => o.deliveryProvider === 'SELF' || o.shipping?.provider === 'SELF').length,
      pending: ordersData.filter(o => o.orderStatus === 'pending').length,
      confirmed: ordersData.filter(o => o.orderStatus === 'confirmed').length,
      shipped: ordersData.filter(o => o.orderStatus === 'shipped').length,
      delivered: ordersData.filter(o => o.orderStatus === 'delivered').length
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Delivery Provider Filter
    if (filters.deliveryProvider !== 'all') {
      filtered = filtered.filter(order => {
        const provider = order.deliveryProvider || order.shipping?.provider;
        // Handle both old lowercase and new UPPERCASE values
        if (filters.deliveryProvider === 'delhivery') {
          return provider === 'DELHIVERY' || provider === 'delhivery';
        }
        if (filters.deliveryProvider === 'self') {
          return provider === 'SELF' || provider === 'self';
        }
        return provider === filters.deliveryProvider;
      });
    }

    // Order Status Filter
    if (filters.orderStatus !== 'all') {
      filtered = filtered.filter(order => order.orderStatus === filters.orderStatus);
    }

    // Payment Status Filter
    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === filters.paymentStatus);
    }

    // Delivery Status Filter
    if (filters.deliveryStatus !== 'all') {
      filtered = filtered.filter(order => order.deliveryStatus === filters.deliveryStatus);
    }

    // Date Range Filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        
        switch (filters.dateRange) {
          case 'today':
            return orderDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Search Filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderId?.toLowerCase().includes(searchLower) ||
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.customerEmail?.toLowerCase().includes(searchLower) ||
        order.customerPhone?.includes(searchLower) ||
        order.waybill?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredOrders(filtered);
  };

  const resetFilters = () => {
    setFilters({
      deliveryProvider: 'all',
      orderStatus: 'all',
      paymentStatus: 'all',
      deliveryStatus: 'all',
      dateRange: 'all',
      searchTerm: ''
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePaymentUpdate = async (orderId, paymentStatus) => {
    try {
      console.log('Updating payment status:', orderId, 'to:', paymentStatus);
      setUpdatingOrder(orderId);
      
      await updatePaymentStatus(orderId, paymentStatus);
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? { ...order, paymentStatus }
            : order
        )
      );
      
      alert(`Payment status updated to ${paymentStatus} successfully!`);
      
    } catch (error) {
      console.error('Error updating payment status:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      alert(`Error updating payment status: ${errorMessage}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      
      await updateOrderStatus(orderId, newStatus);
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? { ...order, orderStatus: newStatus }
            : order
        )
      );
      
      const message = newStatus === 'delivered' 
        ? 'Order marked as delivered and stock updated successfully!' 
        : `Order status updated to ${newStatus} successfully!`;
      alert(message);
      
    } catch (error) {
      console.error('Error updating order:', error);
      alert(`Error updating order status: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleCreateShipment = async (orderId) => {
    try {
      setUpdatingOrder(orderId);
      const result = await createShipment(orderId);
      
      if (result.success) {
        alert(`Shipment created successfully! Waybill: ${result.waybill}`);
        fetchOrders(); // Refresh orders to show updated status
      } else {
        alert(`Failed to create shipment: ${result.message}`);
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
      alert(`Error creating shipment: ${error.message}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleDeliveryStatusUpdate = async (orderId, deliveryStatus) => {
    try {
      setUpdatingOrder(orderId);
      
      await updateDeliveryStatus(orderId, deliveryStatus);
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? { ...order, deliveryStatus, orderStatus: deliveryStatus === 'DELIVERED' ? 'delivered' : deliveryStatus === 'OUT_FOR_DELIVERY' ? 'shipped' : order.orderStatus }
            : order
        )
      );
      
      alert(`Delivery status updated to ${deliveryStatus} successfully!`);
      
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert(`Error updating delivery status: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleTrackOrder = async (orderId) => {
    try {
      const result = await trackOrder(orderId);
      if (result.success) {
        setTrackingData(prev => ({ ...prev, [orderId]: result }));
        alert(`Tracking updated for order ${orderId}`);
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      alert(`Error tracking order: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'confirmed': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'delivered': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getProviderBadge = (order) => {
    const provider = order.deliveryProvider || order.shipping?.provider;
    if (provider === 'DELHIVERY' || provider === 'delhivery') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">🚚 Delhivery</span>;
    } else if (provider === 'SELF' || provider === 'self') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">🏠 Local</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">❓ Unknown</span>;
  };

  const PaymentBadge = ({ status }) => (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
      status === 'paid' ? 'bg-emerald-500' : status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
    }`}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending'}
    </span>
  );

  const DeliveryBadge = ({ status }) => (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
      status === 'DELIVERED' ? 'bg-emerald-500' :
      status === 'OUT_FOR_DELIVERY' ? 'bg-blue-500' :
      status === 'SHIPMENT_CREATED' ? 'bg-purple-500' :
      status === 'PENDING' ? 'bg-amber-500' :
      status === 'RTO' ? 'bg-red-500' : 'bg-gray-400'
    }`}>
      {status || 'N/A'}
    </span>
  );

  // Shared action buttons — used by both the desktop table and mobile cards
  const renderOrderActions = (order, provider) => (
    <div className="flex flex-col gap-1.5">
      {order.paymentStatus === 'pending' && (
        <button onClick={() => handlePaymentUpdate(order.orderId, 'paid')} disabled={updatingOrder === order.orderId}
          className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
          {updatingOrder === order.orderId ? 'Updating…' : 'Mark Paid'}
        </button>
      )}
      {order.orderStatus === 'pending' && (
        <button onClick={() => handleStatusUpdate(order.orderId, 'confirmed')} disabled={updatingOrder === order.orderId}
          className="rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50">
          {updatingOrder === order.orderId ? 'Updating…' : 'Confirm'}
        </button>
      )}
      {(provider === 'SELF' || provider === 'self') && order.orderStatus === 'confirmed' && order.paymentStatus === 'paid' && (
        <>
          <div className="text-xs font-medium text-emerald-600">🏠 Local Delivery</div>
          <button onClick={() => handleDeliveryStatusUpdate(order.orderId, 'OUT_FOR_DELIVERY')} disabled={updatingOrder === order.orderId}
            className="rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50">
            {updatingOrder === order.orderId ? 'Updating…' : 'Out for Delivery'}
          </button>
          <button onClick={() => handleDeliveryStatusUpdate(order.orderId, 'DELIVERED')} disabled={updatingOrder === order.orderId}
            className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
            {updatingOrder === order.orderId ? 'Updating…' : 'Mark Delivered'}
          </button>
        </>
      )}
      {(provider === 'SELF' || provider === 'self') && order.deliveryStatus === 'OUT_FOR_DELIVERY' && (
        <button onClick={() => handleDeliveryStatusUpdate(order.orderId, 'DELIVERED')} disabled={updatingOrder === order.orderId}
          className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50">
          {updatingOrder === order.orderId ? 'Updating…' : 'Mark Delivered'}
        </button>
      )}
      {(provider === 'DELHIVERY' || provider === 'delhivery') && order.orderStatus === 'confirmed' && order.paymentStatus === 'paid' && !order.waybill && (
        <>
          <div className="text-xs font-medium text-blue-600">🚚 Delhivery</div>
          <button onClick={() => handleCreateShipment(order.orderId)} disabled={updatingOrder === order.orderId}
            className="rounded-lg bg-blue-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50">
            {updatingOrder === order.orderId ? 'Creating…' : 'Create Shipment'}
          </button>
        </>
      )}
      {(provider === 'DELHIVERY' || provider === 'delhivery') && order.waybill && (
        <button onClick={() => handleTrackOrder(order.orderId)}
          className="rounded-lg bg-cyan-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-cyan-600">
          Track Shipment
        </button>
      )}
      <div className="mt-1 grid grid-cols-1 gap-1.5 border-t border-gray-100 pt-1.5">
        <button onClick={() => { setSelectedOrder(order); setShowPaymentModal(true); }}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          <CreditCard className="h-3.5 w-3.5" /> Payment
        </button>
        <button onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
          <FileText className="h-3.5 w-3.5" /> Details
        </button>
        <button onClick={() => navigate(`/admin/order/${order.orderId}`)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#d80a4e] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#b8083e]">
          <ExternalLink className="h-3.5 w-3.5" /> Full View
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-100 border-t-[#d80a4e]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Orders</h2>
          <p className="text-sm text-gray-500">{totalItems} total orders · {filteredOrders.length} shown</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
              showFilters ? 'border-[#d80a4e] bg-rose-50 text-[#d80a4e]' : 'border-gray-200 bg-white text-gray-700 hover:border-rose-200'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          <button
            onClick={fetchOrders}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d80a4e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8083e] sm:flex-none"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {[
          { label: 'Total', value: stats.total, tint: 'text-gray-900', bg: 'bg-white' },
          { label: '🚚 Delhivery', value: stats.delhivery, tint: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '🏠 Local', value: stats.self, tint: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pending', value: stats.pending, tint: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Confirmed', value: stats.confirmed, tint: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Shipped', value: stats.shipped, tint: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Delivered', value: stats.delivered, tint: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border border-amber-100 ${s.bg} p-3 text-center shadow-sm`}>
            <div className={`text-xl font-bold ${s.tint}`}>{s.value}</div>
            <div className="mt-0.5 text-xs font-medium text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-2xl border border-amber-100 bg-white shadow-sm">
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div className="xl:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Order ID, Customer, Phone, Waybill..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Delivery Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Provider</label>
                <select
                  value={filters.deliveryProvider}
                  onChange={(e) => handleFilterChange('deliveryProvider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Providers</option>
                  <option value="delhivery">🚚 Delhivery</option>
                  <option value="self">🏠 Local Delivery</option>
                </select>
              </div>
              
              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                <select
                  value={filters.orderStatus}
                  onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">
            {orders.length === 0 ? 'No orders found' : 'No orders match the current filters'}
          </p>
          {orders.length > 0 && (
            <button onClick={resetFilters} className="mt-2 text-sm font-medium text-[#d80a4e] hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className="space-y-3 lg:hidden">
          {filteredOrders.map((order) => {
            const provider = order.deliveryProvider || order.shipping?.provider;
            const st = deriveOrderStatus(order);
            return (
              <div key={order.orderId} className={`rounded-2xl border border-amber-100 bg-white p-4 shadow-sm border-l-4 ${(provider === 'DELHIVERY' || provider === 'delhivery') ? 'border-l-blue-400' : 'border-l-emerald-400'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">#{order.orderId?.slice(-8)}</p>
                    <p className="truncate text-sm text-gray-600">{order.customerName}</p>
                    <p className="truncate text-xs text-gray-400">{order.customerPhone}</p>
                  </div>
                  {getProviderBadge(order)}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-gray-500" title={order.itemsString}>{order.itemsString}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                  <PaymentBadge status={order.paymentStatus} />
                  <DeliveryBadge status={order.deliveryStatus} />
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900">₹{(order.totalAmount || 0).toFixed(2)}</span>
                  <span className="text-xs text-gray-400">{new Date(order.orderDate).toLocaleDateString()}</span>
                </div>
                <div className="mt-3">{renderOrderActions(order, provider)}</div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden rounded-2xl border border-amber-100 bg-white shadow-sm lg:block">
          <div className="overflow-auto">
            <table className="min-w-[2000px] w-full">
              <thead className="bg-[#d80a4e] text-white sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[100px]">Order ID</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[120px]">Provider</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[150px]">Customer</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[200px]">Address</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[300px]">Items</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[80px]">Subtotal</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[80px]">Tax (5%)</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[80px]">Delivery</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[80px]">Total</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[100px]">Order Status</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[100px]">Payment Status</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[100px]">Order Date</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[60px]">Distance</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[80px]">Weight</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[100px]">Delivery Status</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[100px]">Waybill</th>
                  <th className="px-2 py-3 text-left text-sm font-semibold uppercase min-w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order, index) => {
                  const provider = order.deliveryProvider || order.shipping?.provider;
                  return (
                    <tr key={order.orderId} className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 ${
                      (provider === 'DELHIVERY' || provider === 'delhivery') ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-green-400'
                    }`}>
                      <td className="px-2 py-2 text-sm font-medium text-gray-900">
                        #{order.orderId?.slice(-8)}
                      </td>
                      <td className="px-2 py-2 text-sm">
                        {getProviderBadge(order)}
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-xs text-gray-500">{order.customerEmail}</div>
                        <div className="text-xs text-gray-500">{order.customerPhone}</div>
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        <div className="max-w-[200px] truncate" title={order.deliveryAddress}>
                          {order.deliveryAddress || 'N/A'}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        <div className="max-w-[300px] truncate" title={order.itemsString}>
                          {order.itemsString}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        ₹{(() => {
                          const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                          return subtotal.toFixed(2);
                        })()}
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        ₹{(() => {
                          const subtotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                          return (subtotal * 0.05).toFixed(2);
                        })()}
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        ₹{(order.shipping?.total || 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700 font-semibold">
                        ₹{(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-sm">
                        {(() => {
                          const st = deriveOrderStatus(order);
                          return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>;
                        })()}
                      </td>
                      <td className="px-2 py-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${
                          order.paymentStatus === 'paid' ? 'bg-green-500' : 
                          order.paymentStatus === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}>
                          {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        {order.distance || 0} km
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        {order.totalWeight || 0}g
                      </td>
                      <td className="px-2 py-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${
                          order.deliveryStatus === 'DELIVERED' ? 'bg-green-500' :
                          order.deliveryStatus === 'OUT_FOR_DELIVERY' ? 'bg-blue-500' :
                          order.deliveryStatus === 'SHIPMENT_CREATED' ? 'bg-purple-500' :
                          order.deliveryStatus === 'PENDING' ? 'bg-yellow-500' :
                          order.deliveryStatus === 'RTO' ? 'bg-red-500' : 'bg-gray-500'
                        }`}>
                          {order.deliveryStatus || 'N/A'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-sm text-gray-700">
                        {order.waybill ? (
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {order.waybill}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">No waybill</span>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top text-sm">
                        {renderOrderActions(order, provider)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
      {/* Pagination */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-gray-500 sm:text-sm">
          {totalItems === 0 ? '0 of 0' : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {currentPage} / {totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage)))}
            disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Payment Details Modal */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#d80a4e] to-[#8b1a3a] text-white p-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display text-2xl font-bold">Payment Details</h3>
                  <p className="text-blue-100 mt-1">Order #{selectedOrder.orderId?.slice(-8)}</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Order Information */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-blue-900">Order Info</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">Order ID</span>
                      <span className="text-blue-900 font-mono text-sm bg-white px-2 py-1 rounded">{selectedOrder.orderId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">Date</span>
                      <span className="text-blue-900">{new Date(selectedOrder.orderDate).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedOrder.orderStatus === 'delivered' ? 'bg-green-500 text-white' :
                        selectedOrder.orderStatus === 'shipped' ? 'bg-purple-500 text-white' :
                        selectedOrder.orderStatus === 'confirmed' ? 'bg-blue-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {selectedOrder.orderStatus?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">Total Amount</span>
                      <span className="text-blue-900 font-bold text-lg">₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                    </div>
                    {selectedOrder.confirmedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700 font-medium">Confirmed At</span>
                        <span className="text-blue-900 text-sm">{new Date(selectedOrder.confirmedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-green-900">Customer</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-green-700 font-medium block">Name</span>
                      <span className="text-green-900">{selectedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium block">Email</span>
                      <span className="text-green-900 text-sm">{selectedOrder.customerEmail}</span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium block">Phone</span>
                      <span className="text-green-900">{selectedOrder.customerPhone}</span>
                    </div>
                    <div>
                      <span className="text-green-700 font-medium block">Address</span>
                      <span className="text-green-900 text-sm">{selectedOrder.deliveryAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-purple-900">Payment</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700 font-medium">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedOrder.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {selectedOrder.paymentStatus?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700 font-medium">Method</span>
                      <span className="text-purple-900 capitalize">{selectedOrder.paymentMethod || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700 font-medium">Mode</span>
                      <span className="text-purple-900">{selectedOrder.paymentMode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-700 font-medium">Amount</span>
                      <span className="text-purple-900 font-bold">₹{selectedOrder.paymentAmount?.toFixed(2) || selectedOrder.totalAmount?.toFixed(2)}</span>
                    </div>
                    {selectedOrder.razorpayPaymentId && (
                      <div>
                        <span className="text-purple-700 font-medium block">Payment ID</span>
                        <span className="text-purple-900 font-mono text-xs bg-white px-2 py-1 rounded">{selectedOrder.razorpayPaymentId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-orange-900">Items</h4>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-orange-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-orange-900">{item.itemId?.name || 'Unknown Item'}</div>
                            <div className="text-orange-700 text-sm">Qty: {item.quantity}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-orange-900">₹{item.price}</div>
                            <div className="text-orange-700 text-sm">₹{(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-orange-700">{selectedOrder.itemsString}</div>
                    )}
                  </div>
                </div>

                {/* Shipping */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border border-indigo-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-indigo-900">Shipping</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700 font-medium">Provider</span>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const provider = selectedOrder.deliveryProvider || selectedOrder.shipping?.provider;
                          if (provider === 'DELHIVERY' || provider === 'delhivery') {
                            return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">🚚 Delhivery</span>;
                          } else if (provider === 'SELF' || provider === 'self') {
                            return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">🏠 Local</span>;
                          }
                          return <span className="text-indigo-900 capitalize">{provider || 'N/A'}</span>;
                        })()} 
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700 font-medium">Status</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedOrder.deliveryStatus === 'DELIVERED' ? 'bg-green-500 text-white' :
                        selectedOrder.deliveryStatus === 'IN_TRANSIT' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {selectedOrder.deliveryStatus || 'PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700 font-medium">Cost</span>
                      <span className="text-indigo-900 font-bold">₹{selectedOrder.shipping?.total?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700 font-medium">Weight</span>
                      <span className="text-indigo-900">{selectedOrder.totalWeight || 0} grams</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-700 font-medium">Distance</span>
                      <span className="text-indigo-900">{selectedOrder.distance || 0} km</span>
                    </div>
                    {selectedOrder.waybill && (
                      <div>
                        <span className="text-indigo-700 font-medium block">Waybill</span>
                        <span className="text-indigo-900 font-mono text-xs bg-white px-2 py-1 rounded">{selectedOrder.waybill}</span>
                      </div>
                    )}
                    {!selectedOrder.waybill && (selectedOrder.deliveryProvider === 'SELF' || selectedOrder.deliveryProvider === 'self' || selectedOrder.shipping?.provider === 'SELF' || selectedOrder.shipping?.provider === 'self') && (
                      <div className="bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-green-700 text-xs font-medium">🏠 Local delivery - No waybill required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-emerald-900">Summary</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700 font-medium">Subtotal</span>
                      <span className="text-emerald-900">₹{(() => {
                        const subtotal = selectedOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || selectedOrder.subtotal || 0;
                        return subtotal.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700 font-medium">Tax</span>
                      <span className="text-emerald-900">₹{selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-700 font-medium">Delivery</span>
                      <span className="text-emerald-900">₹{(selectedOrder.shipping?.total || selectedOrder.deliveryCharge || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-emerald-300 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-900 font-bold text-lg">Total</span>
                        <span className="text-emerald-900 font-bold text-xl">₹{selectedOrder.totalAmount?.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="text-emerald-700 text-sm">
                      <span className="font-medium">Currency:</span> {selectedOrder.currency || 'INR'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-2 rounded-lg hover:from-gray-600 hover:to-gray-700 font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-4 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-lg font-bold text-gray-900">Order #{selectedOrder.orderId?.slice(-8)}</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column - Basic Info */}
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded">
                  <h4 className="font-medium text-blue-900 mb-2">Order Info</h4>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">ID:</span> #{selectedOrder.orderId?.slice(-8)}</div>
                    <div><span className="font-medium">Date:</span> {new Date(selectedOrder.orderDate).toLocaleDateString()}</div>
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-1 px-2 py-1 rounded text-xs ${
                        selectedOrder.orderStatus === 'delivered' ? 'bg-green-500 text-white' :
                        selectedOrder.orderStatus === 'shipped' ? 'bg-blue-500 text-white' :
                        selectedOrder.orderStatus === 'confirmed' ? 'bg-purple-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {selectedOrder.orderStatus}
                      </span>
                    </div>
                    <div><span className="font-medium">Total:</span> ₹{selectedOrder.totalAmount}</div>
                    <div><span className="font-medium">Weight:</span> {selectedOrder.totalWeight || 0}g</div>
                    <div><span className="font-medium">Distance:</span> {selectedOrder.distance || 0} km</div>
                    {selectedOrder.confirmedAt && (
                      <div><span className="font-medium">Confirmed:</span> {new Date(selectedOrder.confirmedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded">
                  <h4 className="font-medium text-green-900 mb-2">Customer</h4>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">Name:</span> {selectedOrder.customerName}</div>
                    <div><span className="font-medium">Phone:</span> {selectedOrder.customerPhone}</div>
                    <div><span className="font-medium">Email:</span> {selectedOrder.customerEmail}</div>
                    <div><span className="font-medium">Address:</span> {selectedOrder.deliveryAddress}</div>
                  </div>
                </div>
              </div>

              {/* Middle Column - Items & Status */}
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium text-gray-900 mb-2">Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.itemId?.name || 'Unknown Item'}</div>
                            <div className="text-xs text-gray-600">Qty: {item.quantity} | Weight: {item.weight || 0}g</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">₹{item.price}</div>
                            <div className="text-xs text-gray-600">₹{(item.price * item.quantity).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    )) || <div className="text-sm text-gray-500">{selectedOrder.itemsString}</div>}
                  </div>
                </div>

                <div className="bg-yellow-50 p-3 rounded">
                  <h4 className="font-medium text-yellow-900 mb-2">Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedOrder.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedOrder.deliveryStatus === 'DELIVERED' ? 'bg-green-500 text-white' :
                        selectedOrder.deliveryStatus === 'IN_TRANSIT' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {selectedOrder.deliveryStatus || 'PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Provider:</span>
                      <span className="text-xs">{selectedOrder.shipping?.provider || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className="text-xs">{selectedOrder.paymentMode || 'N/A'}</span>
                    </div>
                    {selectedOrder.waybill && (
                      <div className="flex justify-between">
                        <span>Waybill:</span>
                        <span className="text-xs font-mono">{selectedOrder.waybill}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Shipping & Transactions */}
              <div className="space-y-3">
                {selectedOrder.shipping && (
                  <div className="bg-indigo-50 p-3 rounded">
                    <h4 className="font-medium text-indigo-900 mb-2">Shipping</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Cost:</span>
                        <span className="font-medium">₹{selectedOrder.shipping.total}</span>
                      </div>
                      {selectedOrder.shipping.breakdown && (
                        <>
                          <div className="flex justify-between text-xs">
                            <span>Base:</span>
                            <span>₹{selectedOrder.shipping.breakdown.baseRate}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Weight:</span>
                            <span>₹{selectedOrder.shipping.breakdown.weightRate || 0}</span>
                          </div>
                          {selectedOrder.shipping.breakdown.fuelSurcharge && (
                            <div className="flex justify-between text-xs">
                              <span>Fuel:</span>
                              <span>₹{selectedOrder.shipping.breakdown.fuelSurcharge}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedOrder.razorpayData?.length > 0 && (
                  <div className="bg-emerald-50 p-3 rounded">
                    <h4 className="font-medium text-emerald-900 mb-2">Transactions</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedOrder.razorpayData.map((txn, idx) => (
                        <div key={idx} className="bg-white p-2 rounded border">
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="font-medium">Payment ID:</span>
                              <span className="font-mono text-xs">{txn.paymentId?.slice(-8) || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Amount:</span>
                              <span>₹{(txn.amount / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Method:</span>
                              <span>{txn.method || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Status:</span>
                              <span className={`px-1 rounded text-xs ${
                                txn.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {txn.status}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Verified:</span>
                              <span>{txn.signatureVerified ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(txn.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-purple-50 p-3 rounded">
                  <h4 className="font-medium text-purple-900 mb-2">Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{(() => {
                        const subtotal = selectedOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                        return subtotal.toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (5%):</span>
                      <span>₹{(() => {
                        const subtotal = selectedOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                        return (subtotal * 0.05).toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery:</span>
                      <span>₹{(selectedOrder.shipping?.total || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Total:</span>
                      <span>₹{(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowOrderModal(false)} className="bg-gray-500 text-white px-3 py-1 rounded text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
