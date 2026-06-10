import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../../contexts/index.jsx';
import { useNavigate } from 'react-router-dom';
import { useApi, useNotification } from '../../contexts/index.jsx';
import { getEffectivePrice } from '../../utils/index.js';
import ProductThumb from '../../components/ProductThumb.jsx';
import { useSeo } from '../../hooks/useSeo.js';
import Breadcrumb from '../../components/Breadcrumb.jsx';

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const GST_RATE = 0.05;
const PLATFORM_FEE_PERCENT = 2; // covers payment-gateway charges; mirrors backend

const REQUIRED_FIELDS = [
  'addressType',
  'firstName',
  'lastName',
  'address',
  'city',
  'state',
  'postcode',
  'email',
  'phone'
];

const Checkout = () => {
  useSeo({ title: 'Checkout', path: '/checkout', noindex: true });
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { getUserAddresses, service, checkPincode, calculateShippingRate } = useApi();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isAddressSaved, setIsAddressSaved] = useState(false);
  const [isAddressSelected, setIsAddressSelected] = useState(false);

  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [pincodeError, setPincodeError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const [formData, setFormData] = useState({
    addressType: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    postcode: '',
    email: '',
    phone: '',
    altPhone: '',
    orderNotes: ''
  });

  /* ----------------------- helpers ----------------------- */

  const validatePincode = useCallback(
    (pincode) => /^[1-9][0-9]{5}$/.test(pincode),
    []
  );

  const getUserData = useCallback(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user?._id) {
      navigate('/account?redirect=/checkout');
      return null;
    }

    return { token, user };
  }, [navigate]);

  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();

      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT_URL;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }, []);

  /* -------------------- distance + fee -------------------- */

  const checkDeliveryOptions = useCallback(
    async (pincode) => {
      if (!pincode || pincode.length !== 6 || !validatePincode(pincode)) {
        setDeliveryInfo(null);
        setPincodeError('Invalid pincode');
        return;
      }

      try {
        // Calculate total weight from cart items
        const totalWeight = cartItems.reduce((sum, item) => {
          return sum + (item.weight || 500) * item.quantity;
        }, 0);

        // Check delivery options using the new API
        const response = await service.get(`/api/delivery/check/${pincode}?weight=${totalWeight}`);
        
        if (!response.success || !response.serviceable) {
          setDeliveryInfo(null);
          setPincodeError(response.message || 'Delivery not available to this pincode');
          return;
        }

        setDeliveryInfo({
          provider: response.provider,
          providerDisplay: response.providerDisplay || response.displayName,
          charge: response.charge,
          distance: response.distance,
          freeWithinKm: response.freeWithinKm,
          breakdown: response.breakdown
        });
        setPincodeError('');
      } catch (error) {
        setDeliveryInfo(null);
        setPincodeError('Failed to check delivery options');
      }
    },
    [service, cartItems, validatePincode]
  );

  useEffect(() => {
    if (formData.postcode) {
      checkDeliveryOptions(formData.postcode);
    }
  }, [formData.postcode, checkDeliveryOptions]);

  /* ---------------------- addresses ----------------------- */

  useEffect(() => {
    const userData = getUserData();
    if (!userData) return;

    (async () => {
      try {
        const res = await getUserAddresses(userData.user._id);
        setSavedAddresses(res.addresses || []);
      } catch {
        setSavedAddresses([]);
      }
    })();
  }, [getUserAddresses, getUserData]);

  const getOrCreateAddress = useCallback(
    async (userId) => {
      const res = await getUserAddresses(userId);
      const addresses = res.addresses || [];

      const match = addresses.find(
        (a) =>
          a.firstName === formData.firstName &&
          a.lastName === formData.lastName &&
          a.street === formData.address &&
          a.city === formData.city &&
          a.state === formData.state &&
          a.postcode === formData.postcode &&
          a.phone === formData.phone
      );

      if (match) return match._id;

      const payload = {
        addressType: formData.addressType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        street: formData.address,
        apartment: formData.apartment,
        city: formData.city,
        state: formData.state,
        postcode: formData.postcode,
        email: formData.email,
        phone: formData.phone,
        altPhone: formData.altPhone,
        orderNotes: formData.orderNotes
      };

      const created = await service.post(`/api/users/${userId}/addresses`, payload);
      return created.address?._id;
    },
    [formData, getUserAddresses, service]
  );

  /* ---------------------- payment ------------------------- */

  const handlePaymentFailure = useCallback(
    async (dbOrderId, razorpayOrderId, reason) => {
      try {
        await service.post('/api/payment/failure', {
          dbOrderId,
          razorpay_order_id: razorpayOrderId,
          error_reason: reason
        });
      } catch {}
    },
    [service]
  );

  const handlePlaceOrder = async () => {
    const userData = getUserData();
    if (!userData) return;

    if (REQUIRED_FIELDS.some((f) => !formData[f]?.trim())) {
      showNotification('Please fill all required fields', 'warning');
      return;
    }

    if (!deliveryInfo) {
      showNotification('Please enter a valid, serviceable delivery pincode.', 'warning');
      return;
    }

    if (placingOrder) return;
    setPlacingOrder(true);

    try {
      const addressId = await getOrCreateAddress(userData.user._id);
      if (!addressId) {
        showNotification('Could not save your delivery address. Please try again.', 'error');
        return;
      }

      const razorpayRes = await service.post('/api/payment/create-order', {
        orderData: {
          userId: userData.user._id,
          addressId,
          deliveryPincode: formData.postcode,
          items: cartItems.map((i) => ({
            itemId: i._id,
            quantity: i.quantity,
            price: getEffectivePrice(i),
            weight: i.weight || 500
          })),
          paymentMode: 'PREPAID'
        }
      });

      await loadRazorpayScript();

      if (!window.Razorpay) {
        showNotification('Unable to load the payment gateway. Please check your connection and try again.', 'error');
        return;
      }

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY,
        amount: razorpayRes.order.amount,
        currency: 'INR',
        name: 'Chowdhry',
        description: 'Order Payment',
        order_id: razorpayRes.order.id,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone
        },
        theme: { color: '#d80a4e' },
        handler: async (response) => {
          try {
            const verify = await service.post('/api/payment/verify', {
              dbOrderId: razorpayRes.dbOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            if (verify.success) {
              clearCart();
              navigate('/orders');
            } else {
              showNotification('Payment verification failed', 'error');
            }
          } catch {
            showNotification('Payment verification failed', 'error');
          }
        },
        modal: {
          ondismiss: async () => {
            await handlePaymentFailure(
              razorpayRes.dbOrderId,
              razorpayRes.order.id,
              'User cancelled payment'
            );
            showNotification('Payment cancelled', 'warning');
          }
        }
      });

      rzp.on('payment.failed', (res) => {
        handlePaymentFailure(
          razorpayRes.dbOrderId,
          razorpayRes.order.id,
          res.error.description
        );
        showNotification('Payment failed', 'error');
      });

      rzp.open();
    } catch (error) {
      showNotification(error.message || 'Something went wrong while placing your order. Please try again.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  const isOrderDisabled = () => {
    return (
      placingOrder ||
      REQUIRED_FIELDS.some((f) => !formData[f]?.trim()) ||
      !!pincodeError ||
      !deliveryInfo
    );
  };

  /* ----------------------- UI ----------------------------- */

  const subtotal = getCartTotal();
  const gst = subtotal * GST_RATE;
  const deliveryFee = deliveryInfo?.charge || 0;
  const platformFee = Math.ceil((subtotal + gst + deliveryFee) * PLATFORM_FEE_PERCENT / 100);
  const total = subtotal + gst + deliveryFee + platformFee;

  return (
    <div className="mithai-bg min-h-screen pb-40 lg:pb-12">
      <Breadcrumb currentPage="Checkout" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Checkout</h1>

        {/* Progress stepper */}
        <div className="mb-6 flex items-center gap-2 text-xs sm:text-sm">
          {[
            { n: 1, label: 'Cart', done: true },
            { n: 2, label: 'Delivery', active: true },
            { n: 3, label: 'Payment' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div className="flex items-center gap-2">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${s.done ? 'bg-emerald-500 text-white' : s.active ? 'bg-[#d80a4e] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {s.done ? '✓' : s.n}
                </span>
                <span className={s.active ? 'font-semibold text-gray-900' : 'text-gray-500'}>{s.label}</span>
              </div>
              {i < arr.length - 1 && <span className="h-px flex-1 bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

          {/* Billing Details */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 sm:p-6 space-y-5 animate-fade-up">
            <h2 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-sm text-[#d80a4e]">1</span>
              Billing Details
            </h2>
            
            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Saved Addresses</label>
                <div className="flex gap-2">
                  <select 
                    value={selectedAddressId}
                    disabled={isAddressSelected}
                    onChange={(e) => {
                      const addr = savedAddresses.find(a => a._id === e.target.value);
                      if (addr) {
                        setFormData({
                          addressType: addr.addressType || '',
                          firstName: addr.firstName || '',
                          lastName: addr.lastName || '',
                          address: addr.street || '',
                          apartment: addr.apartment || '',
                          city: addr.city || '',
                          state: addr.state || '',
                          postcode: addr.postcode || '',
                          email: addr.email || '',
                          phone: addr.phone || '',
                          altPhone: addr.altPhone || '',
                          orderNotes: ''
                        });
                        setIsAddressSelected(true);
                      }
                      setSelectedAddressId(e.target.value);
                    }}
                    className={`flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 ${
                      isAddressSelected ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50 focus:bg-white'
                    }`}
                  >
                    <option value="">Select saved address</option>
                    {savedAddresses.map(addr => (
                      <option key={addr._id} value={addr._id}>
                        {addr.firstName} {addr.lastName} - {addr.city}, {addr.postcode}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        addressType: '',
                        firstName: '',
                        lastName: '',
                        address: '',
                        apartment: '',
                        city: '',
                        state: '',
                        postcode: '',
                        email: '',
                        phone: '',
                        altPhone: '',
                        orderNotes: ''
                      });
                      setSelectedAddressId('');
                      setIsAddressSelected(false);
                      setDeliveryInfo(null);
                      setPincodeError('');
                    }}
                    className="px-4 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 whitespace-nowrap"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Type *</label>
                <select
                  value={formData.addressType}
                  onChange={(e) => setFormData({...formData, addressType: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                  required
                >
                  <option value="">Select type</option>
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alternate Phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.altPhone}
                  onChange={(e) => setFormData({...formData, altPhone: e.target.value})}
                  placeholder="Second number for delivery"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apartment (Optional)</label>
              <input
                type="text"
                value={formData.apartment}
                onChange={(e) => setFormData({...formData, apartment: e.target.value})}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                  required
                />
                {pincodeError ? (
                  <p className="text-red-500 text-sm mt-1">{pincodeError}</p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">Currently delivering within Gorakhpur only.</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes (Optional)</label>
              <textarea
                value={formData.orderNotes}
                onChange={(e) => setFormData({...formData, orderNotes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 transition-colors"
                placeholder="Notes about your order, e.g. special notes for delivery."
              />
            </div>
          </div>
          
          {/* Order Summary */}
          <div className="space-y-6 lg:sticky lg:top-24 h-fit animate-fade-up">
            <h2 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-sm text-[#d80a4e]">2</span>
              Your Order
            </h2>

            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 sm:p-6">
              {/* Cart Items */}
              <div className="space-y-4 mb-5">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProductThumb product={item} className="w-14 h-14" rounded="rounded-lg" />
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 shrink-0">
                      ₹{(getEffectivePrice(item) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Order Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">GST (5%)</span>
                  <span className="font-medium">₹{gst.toFixed(2)}</span>
                </div>
                
                {deliveryInfo && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery</span>
                      <span className="font-medium">
                        {deliveryInfo.charge > 0
                          ? `₹${deliveryInfo.charge.toFixed(2)}`
                          : <span className="font-semibold text-green-600">FREE</span>}
                      </span>
                    </div>
                    <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2 text-xs text-gray-600 space-y-0.5">
                      <div className="font-semibold text-[#d80a4e]">{deliveryInfo.providerDisplay}</div>
                      <div>Distance: {deliveryInfo.distance} km</div>
                      {deliveryInfo.charge === 0 && (
                        <div className="font-medium text-green-600">Free delivery within {deliveryInfo.freeWithinKm || 5} km 🎉</div>
                      )}
                      <div className="text-gray-400">Delivery date is confirmed after your order is accepted.</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Platform fee</span>
                  <span className="font-medium">₹{platformFee.toFixed(2)}</span>
                </div>

                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-[#d80a4e]">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isOrderDisabled()}
                className={`shine-on-hover w-full mt-6 py-3 px-4 rounded-xl font-semibold transition-colors ${
                  isOrderDisabled()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#d80a4e] text-white hover:bg-[#b8083e]'
                }`}
              >
                {placingOrder ? 'Processing…' : `Place Order · ₹${total.toFixed(2)}`}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <i className="fas fa-lock"></i> Payments secured by Razorpay
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile place-order bar (sits above the bottom nav) */}
      <div className="fixed inset-x-0 bottom-14 z-[85] border-t border-amber-100 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="leading-tight">
            <p className="text-[11px] text-gray-400">Total</p>
            <p className="text-lg font-bold text-[#d80a4e]">₹{total.toFixed(2)}</p>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={isOrderDisabled()}
            className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
              isOrderDisabled() ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-[#d80a4e] text-white hover:bg-[#b8083e]'
            }`}
          >
            {placingOrder ? 'Processing…' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
