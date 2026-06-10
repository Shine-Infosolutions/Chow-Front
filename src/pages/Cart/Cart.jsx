import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight, ArrowLeft, ShoppingBag, ShieldCheck } from "lucide-react";
import { useCart } from "../../contexts/index.jsx";
import { getEffectivePrice, weightLabel } from "../../utils/index.js";
import ProductThumb from "../../components/ProductThumb.jsx";
import Breadcrumb from "../../components/Breadcrumb.jsx";
import { useSeo } from "../../hooks/useSeo.js";

const Cart = () => {
  useSeo({ title: 'Your Cart', path: '/cart', noindex: true });
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const navigate = useNavigate();

  const subtotal = getCartTotal();
  const taxRate = 0.05; // 5% tax
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const itemCount = cartItems.reduce((n, i) => n + i.quantity, 0);

  const handleCheckout = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user._id) {
      // Send guests to sign up, then bring them right back to the cart
      // (their guest cart is preserved and merged on sign-in).
      navigate('/account?redirect=/cart');
      return;
    }

    navigate('/checkout');
  };

  return (
    <div className="mithai-bg min-h-screen pb-12">
      <Breadcrumb currentPage="Product Cart" />

      {cartItems.length === 0 ? (
        /* EMPTY CART */
        <div className="flex items-center justify-center px-6 py-20">
          <div className="animate-fade-up max-w-lg rounded-2xl border border-amber-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-[#d80a4e]">
              <ShoppingBag className="h-9 w-9" />
            </div>
            <h2 className="font-display mb-3 text-2xl font-bold text-gray-900">Your Cart is Empty</h2>
            <p className="mb-8 text-gray-600">
              Your cart is missing some sweetness! Explore our collection of traditional mithai and add your favourites.
            </p>
            <Link
              to="/shop"
              className="shine-on-hover inline-flex items-center gap-2 rounded-xl bg-[#d80a4e] px-8 py-3 font-semibold text-white transition hover:bg-[#b8083e]"
            >
              Start Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* CART CONTENT */
        <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 sm:text-4xl">Shopping Cart</h1>
          <p className="mb-6 mt-1 text-sm text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart</p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">

            {/* LEFT – CART ITEMS */}
            <div className="space-y-4 lg:col-span-2">
              {cartItems.map((item, i) => (
                <div
                  key={item._id}
                  className="animate-fade-up flex items-center gap-4 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  style={{ animationDelay: `${(i % 10) * 60}ms` }}
                >
                  <Link to={`/product/${item._id}`}>
                    <ProductThumb product={item} className="h-20 w-20" />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item._id}`}>
                      <h3 className="font-display truncate font-semibold text-gray-900 transition-colors hover:text-[#d80a4e]">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="mt-0.5 text-sm text-gray-500">
                      ₹{getEffectivePrice(item)}
                      {weightLabel(item.weight) ? ` · ${weightLabel(item.weight)}` : ''}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="px-2.5 py-1.5 text-gray-600 transition-colors hover:bg-rose-50 hover:text-[#d80a4e]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2rem] px-2 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="px-2.5 py-1.5 text-gray-600 transition-colors hover:bg-rose-50 hover:text-[#d80a4e]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-gray-400 transition-colors hover:text-red-600"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-bold text-gray-900">₹{(getEffectivePrice(item) * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}

              <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-[#d80a4e] hover:underline">
                <ArrowLeft className="h-4 w-4" /> Continue shopping
              </Link>
            </div>

            {/* RIGHT – ORDER SUMMARY */}
            <div className="h-fit lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-[#d80a4e] to-[#8b1a3a] px-5 py-4 text-white">
                  <h3 className="font-display text-lg font-semibold">Order Summary</h3>
                </div>
                <div className="space-y-3 p-5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">GST (5%)</span>
                    <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Delivery</span>
                    <span className="text-xs">Calculated at checkout</span>
                  </div>
                  <p className="text-xs font-medium text-green-600">🛵 Free delivery within 5 km</p>
                  <div className="flex justify-between border-t border-dashed border-gray-200 pt-3 text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span className="text-[#d80a4e]">₹{total.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="shine-on-hover mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d80a4e] py-3 font-semibold text-white transition hover:bg-[#b8083e]"
                  >
                    Proceed to Checkout <ArrowRight className="h-4 w-4" />
                  </button>

                  <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-gray-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> Secure prepaid checkout
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
