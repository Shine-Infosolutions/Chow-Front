import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi, useNotification } from '../../contexts/index.jsx';
import { deriveOrderStatus, ORDER_STEPS, orderStepIndex } from '../../utils/orderStatus.js';
import { ArrowLeft, FileText, Mail, MessageCircle } from 'lucide-react';

const OrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { service, updateOrderStatus, updatePaymentStatus, updateDeliveryStatus, updateOrderDeliveryDate, cancelOrder, markOrderDelayed, updateOrderNotes, invoiceUrl, sendOrderConfirmation } = useApi();
  const { showNotification, confirm } = useNotification();
  const [order, setOrder] = useState(null);
  const [emailing, setEmailing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundChoice, setRefundChoice] = useState('auto');
  const [delayReason, setDelayReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await service.get(`/api/orders/${orderId}`);
      setOrder(response.order);
      setAdminNotes(response.order?.adminNotes || '');
      setDelayReason(response.order?.delayReason || '');
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrder(prev => ({ ...prev, status: newStatus }));
      showNotification(`Order status: ${newStatus}`, 'success');
    } catch (error) {
      showNotification('Failed to update order status', 'error');
    }
  };

  const handlePaymentStatusUpdate = async (newStatus) => {
    try {
      await updatePaymentStatus(orderId, newStatus);
      setOrder(prev => ({ ...prev, paymentStatus: newStatus }));
      showNotification(`Payment status: ${newStatus}`, 'success');
    } catch (error) {
      showNotification('Failed to update payment status', 'error');
    }
  };

  const handleDeliveryStatusUpdate = async (newStatus) => {
    try {
      await updateDeliveryStatus(orderId, newStatus);
      setOrder(prev => ({ ...prev, deliveryStatus: newStatus }));
      showNotification(`Delivery status: ${newStatus}`, 'success');
    } catch (error) {
      showNotification('Failed to update delivery status', 'error');
    }
  };

  const handleDeliveryDateUpdate = async (date) => {
    try {
      await updateOrderDeliveryDate(orderId, date || null);
      setOrder(prev => ({ ...prev, deliveryDate: date || null }));
      showNotification(date ? 'Delivery date set' : 'Delivery date cleared', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to set delivery date', 'error');
    }
  };

  const handleCancel = async () => {
    const ok = await confirm({
      title: 'Cancel this order?',
      message: 'Paid orders will be restocked and flagged for refund.',
      confirmText: 'Cancel order',
      cancelText: 'Keep order',
    });
    if (!ok) return;
    try {
      const res = await cancelOrder(orderId, { reason: cancelReason, refund: refundChoice });
      setOrder(prev => ({
        ...prev,
        status: 'cancelled',
        deliveryStatus: 'PRE_PICKUP_CANCEL',
        cancelReason,
        refundStatus: res.order?.refundStatus || refundChoice,
        stockRestored: res.order?.stockRestored,
      }));
      setShowCancel(false);
      showNotification('Order cancelled' + (res.order?.stockRestored ? ' — items restocked' : ''), 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to cancel order', 'error');
    }
  };

  const handleMarkDelayed = async () => {
    try {
      await markOrderDelayed(orderId, { isDelayed: true, delayReason, deliveryDate: order.deliveryDate || undefined });
      setOrder(prev => ({ ...prev, isDelayed: true, delayReason }));
      showNotification('Order marked as delayed — the customer will see this', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to mark delayed', 'error');
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateOrderNotes(orderId, adminNotes);
      setOrder(prev => ({ ...prev, adminNotes }));
      showNotification('Notes saved', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to save notes', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCreateShipment = async () => {
    try {
      const response = await service.post('/api/delhivery/create-shipment', { orderId });
      if (response.success) {
        await loadOrderDetails();
        showNotification('Shipment created', 'success');
      } else {
        showNotification(response.message || 'Failed to create shipment', 'error');
      }
    } catch (error) {
      showNotification('Failed to create shipment', 'error');
    }
  };

  const handleTrackOrder = async () => {
    try {
      const response = await service.get(`/api/delhivery/track-order/${orderId}`);
      if (response.success) {
        showNotification(`Tracking: ${response.status} · ${response.location}`, 'info', 5000);
      } else {
        showNotification('Failed to track order', 'error');
      }
    } catch (error) {
      showNotification('Failed to track order', 'error');
    }
  };

  const handleEmailConfirmation = async () => {
    setEmailing(true);
    try {
      const res = await sendOrderConfirmation(order._id);
      showNotification(res?.message || 'Confirmation email sent', 'success');
    } catch (e) {
      showNotification(e.message || 'Failed to send email', 'error');
    } finally {
      setEmailing(false);
    }
  };

  const buildWhatsappLink = () => {
    const raw = String(order.contactPhone || order.deliveryAddress?.phone || order.userId?.phone || '').replace(/\D/g, '');
    const phone = raw.length === 10 ? `91${raw}` : raw;
    const name = order.deliveryAddress?.firstName || order.userId?.name || 'there';
    const text = encodeURIComponent(
      `Hi ${name}, your Chowdhry Sweet House order #${order._id?.slice(-8).toUpperCase()} ` +
      `(₹${Number(order.totalAmount || 0).toFixed(2)}) is confirmed. ` +
      `View your invoice: ${invoiceUrl(order._id)}`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const handleBack = () => {
    navigate('/admin/orders');
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-100 border-t-[#d80a4e]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Order not found</h2>
        <button onClick={handleBack} className="rounded-xl bg-[#d80a4e] px-6 py-2.5 font-semibold text-white hover:bg-[#b8083e]">
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#d80a4e] to-[#8b1a3a] p-4 text-white sm:p-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
            >
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold sm:text-2xl">Order Details</h1>
              <p className="truncate text-sm text-pink-100">#{order._id?.slice(-8)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        {/* Canonical status + stepper (matches what the customer sees) */}
        <div className="mb-6 rounded-2xl border border-amber-100 bg-white shadow-sm p-5">
          {(() => {
            const st = deriveOrderStatus(order);
            const stepIdx = orderStepIndex(st.key);
            const terminal = ['cancelled', 'failed', 'returned'].includes(st.key);
            return (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-gray-900">Order #{order._id?.slice(-8)}</h2>
                  <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                </div>
                {!terminal && (
                  <div className="flex items-center">
                    {ORDER_STEPS.map((step, i) => (
                      <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= stepIdx ? 'bg-[#d80a4e] text-white' : 'bg-gray-200 text-gray-500'}`}>
                            {i < stepIdx ? '✓' : i + 1}
                          </div>
                          <span className={`mt-1 text-[11px] ${i <= stepIdx ? 'font-medium text-gray-800' : 'text-gray-400'}`}>{step.label}</span>
                        </div>
                        {i < ORDER_STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < stepIdx ? 'bg-[#d80a4e]' : 'bg-gray-200'}`} />}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>
        {/* Share & Invoice */}
        <div className="mb-6 rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Share &amp; Invoice</h2>
          <div className="flex flex-wrap gap-2">
            <a
              href={invoiceUrl(order._id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#d80a4e]"
            >
              <FileText className="h-4 w-4" /> View / Download Invoice
            </a>
            <button
              onClick={handleEmailConfirmation}
              disabled={emailing}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d80a4e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8083e] disabled:opacity-50"
            >
              <Mail className="h-4 w-4" /> {emailing ? 'Sending…' : 'Email Customer'}
            </button>
            <a
              href={buildWhatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
          <p className="mt-2 text-xs text-gray-400">The invoice link is public and shareable. "Email Customer" sends the order confirmation with invoice.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-blue-900">Order Info</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">Order ID</span>
                <span className="text-blue-900 font-mono text-sm bg-white px-2 py-1 rounded">#{order._id?.slice(-8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  order.status === 'delivered' ? 'bg-green-500 text-white' :
                  order.status === 'shipped' ? 'bg-purple-500 text-white' :
                  order.status === 'confirmed' ? 'bg-blue-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>
                  {order.status?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">Payment Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  order.paymentStatus === 'paid' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {order.paymentStatus?.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">Total Amount</span>
                <span className="text-blue-900 font-bold text-lg">₹{order.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-medium">Created</span>
                <span className="text-blue-900 text-sm">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              {order.confirmedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium">Confirmed</span>
                  <span className="text-blue-900 text-sm">{new Date(order.confirmedAt).toLocaleString()}</span>
                </div>
              )}
              {order.isDelayed && (
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium">Delayed</span>
                  <span className="text-amber-700 text-sm font-semibold text-right">Yes{order.delayReason ? ` · ${order.delayReason}` : ''}</span>
                </div>
              )}
              {order.status === 'cancelled' && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700 font-medium">Cancel reason</span>
                    <span className="text-red-700 text-sm text-right">{order.cancelReason || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700 font-medium">Refund</span>
                    <span className="text-blue-900 text-sm font-semibold capitalize">{order.refundStatus || 'none'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Delivery Information */}
          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-indigo-900">Delivery</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-medium">Provider</span>
                <span className="text-indigo-900 capitalize">{order.deliveryProviderDisplay || 'Local Delivery'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-medium">Pincode</span>
                <span className="text-indigo-900">{order.deliveryPincode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-medium">Distance</span>
                <span className="text-indigo-900">{order.distance} km</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-medium">Delivery Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  order.deliveryStatus === 'DELIVERED' ? 'bg-green-500 text-white' :
                  order.deliveryStatus === 'IN_TRANSIT' ? 'bg-blue-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {order.deliveryStatus || 'PENDING'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-medium">Shipping Cost</span>
                <span className="text-indigo-900 font-bold">{(order.shipping?.total || 0) > 0 ? `₹${(order.shipping.total).toFixed(2)}` : 'FREE'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-indigo-700 font-medium">Delivery Date</span>
                <span className="text-indigo-900 text-sm">
                  {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}
                </span>
              </div>
              {order.waybill && (
                <div>
                  <span className="text-indigo-700 font-medium block">Waybill</span>
                  <span className="text-indigo-900 font-mono text-xs bg-white px-2 py-1 rounded">{order.waybill}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-orange-900">Items</h2>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {order.items?.map((item, index) => (
                <div key={index} className="bg-white p-3 rounded-lg border border-orange-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-orange-900">{item.itemId?.name || 'Unknown Item'}</div>
                      <div className="text-orange-700 text-sm">Qty: {item.quantity} | Weight: {item.weight}g</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-900">₹{item.price}</div>
                      <div className="text-orange-700 text-sm">₹{(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details */}
          {order.razorpayData?.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-emerald-900">Payments</h2>
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {order.razorpayData.map((payment, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-emerald-200">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-emerald-700">Payment ID:</span>
                        <span className="text-emerald-900 font-mono text-xs">{payment.paymentId?.slice(-8) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-emerald-700">Amount:</span>
                        <span className="text-emerald-900 font-bold">₹{((payment.amount || 0) / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-emerald-700">Method:</span>
                        <span className="text-emerald-900">{payment.method || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-emerald-700">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          payment.status === 'paid' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-purple-900">Summary</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-purple-700 font-medium">Subtotal</span>
                <span className="text-purple-900">₹{(order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700 font-medium">GST (5%)</span>
                <span className="text-purple-900">₹{((order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0) * 0.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700 font-medium">Delivery</span>
                <span className="text-purple-900">{(order.shipping?.total || 0) > 0 ? `₹${(order.shipping.total).toFixed(2)}` : 'FREE'}</span>
              </div>
              {order.platformFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-purple-700 font-medium">Platform fee</span>
                  <span className="text-purple-900">₹{order.platformFee.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-purple-300 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-purple-900 font-bold text-lg">Total</span>
                  <span className="text-purple-900 font-bold text-xl">₹{order.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Actions</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Order Status</label>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Payment Status</label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => handlePaymentStatusUpdate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Delivery Date</label>
                <input
                  type="date"
                  value={order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDeliveryDateUpdate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d80a4e] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Shown to the customer once set.</p>
              </div>

              {order.deliveryProvider?.toUpperCase() === 'SELF' && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Delivery Status</label>
                  <select
                    value={order.deliveryStatus || 'PENDING'}
                    onChange={(e) => handleDeliveryStatusUpdate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </div>
              )}

              {order.deliveryProvider?.toUpperCase() === 'DELHIVERY' && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Delhivery Status</label>
                  <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                    Auto-managed via webhook<br />
                    Status: {order.deliveryStatus || 'PENDING'}
                  </div>
                </div>
              )}

              {order.waybill && (
                <button
                  onClick={handleTrackOrder}
                  className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  Track Order
                </button>
              )}

              {/* ---- Delay / reschedule ---- */}
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-gray-700 font-medium mb-2">Mark Delayed {order.isDelayed && <span className="text-amber-600 text-xs">(currently delayed)</span>}</label>
                  <input
                    type="text"
                    value={delayReason}
                    onChange={(e) => setDelayReason(e.target.value)}
                    placeholder="Reason (e.g. high demand, ingredient delay)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent mb-2"
                  />
                  <button onClick={handleMarkDelayed} className="w-full bg-amber-500 text-white p-2.5 rounded-lg hover:bg-amber-600 transition-colors font-medium">
                    Mark as Delayed
                  </button>
                  <p className="text-xs text-gray-400 mt-1">Tip: update the Delivery Date above to reschedule.</p>
                </div>
              )}

              {/* ---- Internal notes ---- */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-gray-700 font-medium mb-2">Internal Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  placeholder="Notes for staff (not shown to customer)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button onClick={handleSaveNotes} disabled={savingNotes} className="w-full bg-gray-700 text-white p-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 mt-1">
                  {savingNotes ? 'Saving…' : 'Save Notes'}
                </button>
              </div>

              {/* ---- Cancel ---- */}
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <div className="border-t border-gray-200 pt-4">
                  {!showCancel ? (
                    <button onClick={() => setShowCancel(true)} className="w-full border border-red-300 text-red-600 p-2.5 rounded-lg hover:bg-red-50 transition-colors font-medium">
                      Cancel Order
                    </button>
                  ) : (
                    <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
                      <label className="block text-sm font-medium text-red-700">Cancellation reason</label>
                      <input
                        type="text"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="e.g. out of stock, customer request"
                        className="w-full p-2.5 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm"
                      />
                      <label className="block text-sm font-medium text-red-700">Refund</label>
                      <select
                        value={refundChoice}
                        onChange={(e) => setRefundChoice(e.target.value)}
                        className="w-full p-2.5 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm"
                      >
                        <option value="auto">Auto-refund via Razorpay</option>
                        <option value="manual">Mark refunded (manual)</option>
                        <option value="none">No refund</option>
                      </select>
                      <div className="flex gap-2 pt-1">
                        <button onClick={handleCancel} className="flex-1 bg-red-600 text-white p-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
                          Confirm Cancel
                        </button>
                        <button onClick={() => setShowCancel(false)} className="flex-1 border border-gray-300 text-gray-600 p-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          Keep Order
                        </button>
                      </div>
                      <p className="text-xs text-red-500">Paid orders are automatically restocked on cancel.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;