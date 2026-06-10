import React, { useState, useEffect } from 'react';
import { useApi, useNotification } from '../../contexts/index.jsx';
import { RefreshCw, Trash2, ChevronLeft, ChevronRight, X, Eye, AlertTriangle } from 'lucide-react';

const FailedOrders = () => {
  const { getFailedOrders, cleanFailedOrders } = useApi();
  const { showNotification, confirm } = useNotification();
  const [failedOrders, setFailedOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadFailedOrders();
  }, [currentPage]);

  const loadFailedOrders = async () => {
    try {
      setLoading(true);
      const response = await getFailedOrders(currentPage, itemsPerPage);
      setFailedOrders(response.orders || []);
      setTotalPages(response.pagination?.pages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading failed orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanFailedOrders = async () => {
    const ok = await confirm({ title: 'Delete all failed orders?', message: 'This permanently removes every failed order and cannot be undone.', confirmText: 'Delete all' });
    if (!ok) return;
    try {
      const response = await cleanFailedOrders();
      if (response.success) {
        showNotification(response.message || 'Failed orders cleared', 'success');
        loadFailedOrders();
      }
    } catch (error) {
      console.error('Error cleaning failed orders:', error);
      showNotification('Failed to clean failed orders', 'error');
    }
  };

  const itemsLabel = (order) =>
    order.itemsString || order.items?.map((item) => `${item.itemId?.name || 'Item'} (${item.quantity})`).join(', ') || 'N/A';
  const errorOf = (order) => order.razorpayData?.[0]?.errorDescription || order.errorMessage || 'Unknown error';

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-100 border-t-[#d80a4e]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Failed Orders</h2>
          <p className="text-sm text-gray-500">{totalItems} failed or abandoned payment {totalItems === 1 ? 'attempt' : 'attempts'}.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadFailedOrders} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-rose-200 hover:text-[#d80a4e] sm:flex-none">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={handleCleanFailedOrders} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 sm:flex-none">
            <Trash2 className="h-4 w-4" /> Clean All
          </button>
        </div>
      </div>

      {failedOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white py-16 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No failed orders. 🎉</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {failedOrders.map((order) => (
              <div key={order._id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">#{order._id?.slice(-8) || 'N/A'}</p>
                    <p className="truncate text-sm text-gray-600">{order.customerName || order.userId?.name || 'N/A'}</p>
                    <p className="truncate text-xs text-gray-400">{order.customerEmail || order.userId?.email || 'N/A'}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                    {order.status || 'Failed'}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-gray-500">{itemsLabel(order)}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">₹{(order.totalAmount || 0).toFixed(2)}</span>
                  <span className="text-xs text-gray-400">{new Date(order.createdAt || order.orderDate).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 line-clamp-1 text-xs text-red-500" title={errorOf(order)}>{errorOf(order)}</p>
                <button onClick={() => { setSelectedOrder(order); setShowModal(true); }} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-[#d80a4e] hover:bg-rose-100">
                  <Eye className="h-4 w-4" /> View Details
                </button>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3.5">Order</th>
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Items</th>
                    <th className="px-4 py-3.5">Total</th>
                    <th className="px-4 py-3.5">Error</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {failedOrders.map((order) => (
                    <tr key={order._id} className="transition-colors hover:bg-red-50/40">
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-900">#{order._id?.slice(-8) || 'N/A'}</td>
                      <td className="px-4 py-3.5">
                        <div className="text-sm font-medium text-gray-900">{order.customerName || order.userId?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{order.customerEmail || order.userId?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3.5"><div className="max-w-[220px] truncate text-sm text-gray-600" title={itemsLabel(order)}>{itemsLabel(order)}</div></td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">₹{(order.totalAmount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3.5"><div className="max-w-[200px] truncate text-sm text-red-600" title={errorOf(order)}>{errorOf(order)}</div></td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">{new Date(order.createdAt || order.orderDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end">
                          <button onClick={() => { setSelectedOrder(order); setShowModal(true); }} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-rose-200 hover:bg-rose-50 hover:text-[#d80a4e]">
                            <Eye className="h-3.5 w-3.5" /> Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 sm:text-sm">
              {totalItems === 0 ? '0 of 0' : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-700">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setShowModal(false)}>
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="font-display text-lg font-bold text-gray-900 sm:text-xl">Failed Order Details</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(selectedOrder).filter(([key]) => key !== 'razorpayData').map(([key, value]) => {
                  if (value === null || value === undefined) return null;

                  const formatValue = (val) => {
                    if (typeof val === 'object' && val !== null) {
                      if (Array.isArray(val)) {
                        if (key === 'items') return val.map((item) => `${item.itemId?.name || 'Item'} (Qty: ${item.quantity})`).join(', ');
                        return val.length > 0 ? `${val.length} entries` : 'Empty';
                      }
                      if (key === 'shipping') return `Provider: ${val.provider || 'N/A'}, Total: ₹${val.total || 0}, Charged: ${val.charged ? 'Yes' : 'No'}`;
                      return JSON.stringify(val, null, 2);
                    }
                    if (key.includes('At') || key.includes('date') || key.includes('Date')) {
                      try {
                        return new Date(val).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      } catch {
                        return String(val);
                      }
                    }
                    if ((key.includes('amount') || key.includes('Amount') || key.includes('price') || key.includes('Price') || key.includes('fee') || key.includes('Fee')) && typeof val === 'number') {
                      return `₹${val.toFixed(2)}`;
                    }
                    return String(val);
                  };

                  return (
                    <div key={key} className={`rounded-xl border border-gray-100 bg-gray-50 p-3 ${typeof value === 'object' || String(value).length > 50 ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                      <span className="text-xs font-semibold capitalize text-gray-500">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</span>
                      <div className={`mt-1 ${typeof value === 'object' ? 'whitespace-pre-wrap break-all font-mono text-xs' : 'break-all'} text-gray-900`}>
                        {formatValue(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button onClick={() => setShowModal(false)} className="w-full rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 sm:w-auto sm:float-right">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FailedOrders;
