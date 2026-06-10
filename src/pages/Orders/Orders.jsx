import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, CreditCard, MapPin, Phone, Pencil, Check, X, CalendarClock, ShoppingBag, MessageCircle, FileText,
} from 'lucide-react';
import { useApi, useNotification } from '../../contexts/index.jsx';
import ProductThumb from '../../components/ProductThumb.jsx';
import Breadcrumb from '../../components/Breadcrumb';
import { useSeo } from '../../hooks/useSeo.js';
import { deriveOrderStatus, ORDER_STEPS, orderStepIndex } from '../../utils/orderStatus.js';

const canEditContact = (order) =>
  !['delivered', 'cancelled', 'failed'].includes(order.status) &&
  !['DELIVERED', 'RTO', 'PRE_PICKUP_CANCEL'].includes(order.deliveryStatus);

const Orders = () => {
  useSeo({ title: 'My Orders', path: '/orders', noindex: true });
  const { getMyOrders, getUserAddresses, updateOrderContact, invoiceUrl } = useApi();
  const { showNotification } = useNotification();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState({});
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ contactPhone: '', altPhone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id || user.id;
        if (userId) {
          const [userOrders, userAddresses] = await Promise.all([
            getMyOrders(userId),
            getUserAddresses(userId),
          ]);
          setOrders(Array.isArray(userOrders) ? userOrders : []);
          const list = userAddresses.addresses || userAddresses.address || [];
          const map = {};
          list.forEach((a) => { map[a._id] = a; });
          setAddresses(map);
        }
      } catch (e) {
        console.error('Error fetching orders:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [getMyOrders, getUserAddresses]);

  const startEdit = (order, addr) => {
    setEditingId(order._id);
    setEditForm({
      contactPhone: order.contactPhone || addr?.phone || '',
      altPhone: order.altPhone || addr?.altPhone || '',
    });
  };

  const saveContact = async (orderId) => {
    setSaving(true);
    try {
      await updateOrderContact(orderId, {
        contactPhone: editForm.contactPhone.trim(),
        altPhone: editForm.altPhone.trim(),
      });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? { ...o, contactPhone: editForm.contactPhone.trim(), altPhone: editForm.altPhone.trim() }
            : o
        )
      );
      showNotification('Contact number updated!');
      setEditingId(null);
    } catch (err) {
      showNotification(err.message || 'Could not update contact number', 'error');
    } finally {
      setSaving(false);
    }
  };

  const itemsSubtotal = (order) =>
    order.items?.reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;

  if (loading) {
    return (
      <div className="mithai-bg flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-b-2 border-[#d80a4e]"></div>
          <p className="font-display mt-4 text-gray-600">Loading your orders…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mithai-bg min-h-screen pb-16">
      <Breadcrumb currentPage="My Orders" />

      <div className="mx-auto max-w-5xl px-4 pt-2 sm:px-6">
        <h1 className="font-display mb-6 text-3xl font-bold text-gray-900 sm:text-4xl">My Orders</h1>

        {orders.length === 0 ? (
          <div className="animate-fade-up rounded-2xl border border-amber-100 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-[#d80a4e]">
              <ShoppingBag className="h-9 w-9" />
            </div>
            <p className="mb-1 text-lg font-medium text-gray-700">No orders yet</p>
            <p className="mb-6 text-gray-400">Start shopping to see your orders here.</p>
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-[#d80a4e] px-6 py-3 font-semibold text-white transition hover:bg-[#b8083e]">
              Browse Sweets
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order, idx) => {
              const addr = addresses[order.addressId];
              const st = deriveOrderStatus(order);
              const stepIdx = orderStepIndex(st.key);
              const subtotal = itemsSubtotal(order);
              const gst = subtotal * 0.05;
              const contact = order.contactPhone || addr?.phone;
              const alt = order.altPhone || addr?.altPhone;
              const isEditing = editingId === order._id;

              return (
                <div
                  key={order._id}
                  className="animate-fade-up overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm"
                  style={{ animationDelay: `${(idx % 8) * 60}ms` }}
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 bg-gradient-to-r from-rose-50 to-amber-50 px-5 py-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-gray-900">Order #{order._id?.slice(-6)}</h3>
                      <p className="text-xs text-gray-500">
                        Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.isDelayed && order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Delayed</span>
                      )}
                      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>

                  {order.status === 'cancelled' && (
                    <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
                      Order cancelled{order.cancelReason ? `: ${order.cancelReason}` : ''}.
                      {order.refundStatus === 'processed' ? ' Refund processed.' : order.refundStatus === 'pending' ? ' Refund is being processed.' : ''}
                    </div>
                  )}
                  {order.isDelayed && order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <div className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-700">
                      Your order is delayed{order.delayReason ? `: ${order.delayReason}` : ''}.
                      {order.deliveryDate ? ` New delivery by ${new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.` : ''}
                    </div>
                  )}

                  <div className="p-5">
                    {/* Status stepper */}
                    {!['cancelled', 'failed', 'returned'].includes(st.key) && (
                      <div className="mb-5 flex items-center">
                        {ORDER_STEPS.map((step, i) => (
                          <React.Fragment key={step.key}>
                            <div className="flex flex-col items-center">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${i <= stepIdx ? 'bg-[#d80a4e] text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {i < stepIdx ? '✓' : i + 1}
                              </div>
                              <span className={`mt-1 text-[10px] ${i <= stepIdx ? 'font-medium text-gray-800' : 'text-gray-400'}`}>{step.label}</span>
                            </div>
                            {i < ORDER_STEPS.length - 1 && (
                              <div className={`mx-1 h-0.5 flex-1 ${i < stepIdx ? 'bg-[#d80a4e]' : 'bg-gray-200'}`} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {/* Items */}
                    <div className="mb-5 space-y-3">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <ProductThumb
                              product={{ name: item.itemId?.name || item.name, images: item.itemId?.images }}
                              className="h-12 w-12"
                              rounded="rounded-lg"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-800">{item.itemId?.name || item.name || 'Item'}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity} · ₹{item.price} each</p>
                            </div>
                          </div>
                          <p className="shrink-0 font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Payment */}
                      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                        <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <CreditCard className="h-4 w-4 text-[#d80a4e]" /> Payment
                        </h5>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">GST (5%)</span><span>₹{gst.toFixed(2)}</span></div>
                          {(order.shipping?.total || 0) > 0 && (
                            <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span>₹{order.shipping.total.toFixed(2)}</span></div>
                          )}
                          {order.platformFee > 0 && (
                            <div className="flex justify-between"><span className="text-gray-500">Platform fee</span><span>₹{order.platformFee.toFixed(2)}</span></div>
                          )}
                          <div className="flex justify-between border-t border-dashed border-gray-200 pt-1.5 font-bold text-gray-900">
                            <span>Total</span><span className="text-[#d80a4e]">₹{(order.totalAmount || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pt-1 text-xs">
                            <span className="text-gray-500">Payment</span>
                            <span className={order.paymentStatus === 'paid' ? 'font-medium text-green-600' : 'font-medium text-amber-600'}>
                              {order.paymentStatus === 'paid' ? 'Paid' : (order.paymentStatus || 'Pending')}
                              {order.paymentMode ? ` · ${order.paymentMode}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery */}
                      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                        <h5 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <MapPin className="h-4 w-4 text-[#d80a4e]" /> Delivery
                        </h5>
                        {addr ? (
                          <div className="space-y-0.5 text-sm text-gray-600">
                            <p className="font-medium text-gray-800">{addr.firstName} {addr.lastName}</p>
                            <p>{addr.street}{addr.apartment ? `, ${addr.apartment}` : ''}</p>
                            <p>{addr.city}, {addr.state} {addr.postcode}</p>
                          </div>
                        ) : (
                          <p className="text-sm italic text-gray-400">Address not available</p>
                        )}

                        {/* Delivery date */}
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs">
                          <CalendarClock className="h-4 w-4 text-[#d80a4e]" />
                          {order.deliveryDate ? (
                            <span className="font-medium text-gray-700">
                              Delivery by {new Date(order.deliveryDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                          ) : (
                            <span className="text-gray-500">Delivery date confirmed after your order is accepted.</span>
                          )}
                        </div>

                        {/* Contact + edit */}
                        <div className="mt-3 border-t border-gray-200 pt-3">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="tel"
                                value={editForm.contactPhone}
                                onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                                placeholder="Primary contact number"
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40"
                              />
                              <input
                                type="tel"
                                value={editForm.altPhone}
                                onChange={(e) => setEditForm({ ...editForm, altPhone: e.target.value })}
                                placeholder="Alternate number (optional)"
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveContact(order._id)}
                                  disabled={saving}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#d80a4e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#b8083e] disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                >
                                  <X className="h-3.5 w-3.5" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{contact || '—'}{alt ? ` · ${alt}` : ''}</span>
                              </div>
                              {canEditContact(order) && (
                                <button
                                  onClick={() => startEdit(order, addr)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-[#d80a4e] hover:underline"
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Edit
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {addr?.orderNotes && (
                      <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm text-gray-700">
                        <span className="font-medium text-gray-800">Note:</span> {addr.orderNotes}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                      <a
                        href={invoiceUrl(order._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#d80a4e]"
                      >
                        <FileText className="h-4 w-4" /> Download Invoice
                      </a>
                      <Link to={`/support?order=${order._id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#d80a4e] hover:underline">
                        <MessageCircle className="h-4 w-4" /> Get help with this order
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
