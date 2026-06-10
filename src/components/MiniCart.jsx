import React from 'react';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/index.jsx';
import { getEffectivePrice, weightLabel } from '../utils/index.js';
import ProductThumb from './ProductThumb.jsx';

/**
 * Slide-out cart drawer, opened from the header cart icon.
 * Lets the shopper review/adjust items without leaving the page.
 */
const MiniCart = () => {
  const {
    cartItems, isMiniCartOpen, closeMiniCart, updateQuantity, removeFromCart, getCartTotal,
  } = useCart();

  const subtotal = getCartTotal();
  const itemCount = cartItems.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeMiniCart}
        className={`fixed inset-0 z-[115] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isMiniCartOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-[116] flex w-[min(92vw,26rem)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isMiniCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isMiniCartOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-100 px-5 py-4">
          <h3 className="font-display flex items-center gap-2 text-lg font-bold text-gray-900">
            <ShoppingBag className="h-5 w-5 text-[#d80a4e]" />
            Your Cart
            {itemCount > 0 && <span className="text-sm font-medium text-gray-400">({itemCount})</span>}
          </h3>
          <button onClick={closeMiniCart} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-[#d80a4e]">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <p className="font-display text-lg font-semibold text-gray-900">Your cart is empty</p>
            <p className="mt-1 text-sm text-gray-500">Add some sweetness to get started.</p>
            <Link
              to="/shop"
              onClick={closeMiniCart}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d80a4e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8083e]"
            >
              Browse sweets <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {cartItems.map((item) => (
                <div key={item._id} className="flex gap-3 rounded-2xl border border-amber-100 bg-white p-3">
                  <Link to={`/product/${item._id}`} onClick={closeMiniCart}>
                    <ProductThumb product={item} className="h-16 w-16" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to={`/product/${item._id}`} onClick={closeMiniCart}>
                      <h4 className="truncate text-sm font-semibold text-gray-900 hover:text-[#d80a4e]">{item.name}</h4>
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-500">
                      ₹{getEffectivePrice(item)}{weightLabel(item.weight) ? ` · ${weightLabel(item.weight)}` : ''}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200">
                        <button onClick={() => updateQuantity(item._id, item.quantity - 1)} className="px-2 py-1 text-gray-600 hover:bg-rose-50 hover:text-[#d80a4e]" aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[1.75rem] px-1 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item._id, item.quantity + 1)} className="px-2 py-1 text-gray-600 hover:bg-rose-50 hover:text-[#d80a4e]" aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-gray-900">₹{(getEffectivePrice(item) * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} className="self-start text-gray-300 hover:text-red-500" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-amber-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-lg font-bold text-[#d80a4e]">₹{subtotal.toFixed(2)}</span>
              </div>
              <p className="mb-3 text-center text-xs text-gray-400">Taxes &amp; delivery calculated at checkout</p>
              <div className="flex gap-2">
                <Link to="/cart" onClick={closeMiniCart} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                  View Cart
                </Link>
                <Link to="/checkout" onClick={closeMiniCart} className="flex-[1.4] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#d80a4e] py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8083e]">
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default MiniCart;
