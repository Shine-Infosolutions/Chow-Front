import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../contexts/index.jsx';
import { getEffectivePrice, isPlaceholderImage, productGradient, weightLabel } from '../utils/index.js';

const ProductCard = ({ product, showSpecialTag = false, index = 0 }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const price = getEffectivePrice(product);
  const hasDiscount =
    Number(product.discountPrice) > 0 && Number(product.discountPrice) < Number(product.price);
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const image = product.images?.[0];
  const usePlaceholder = isPlaceholderImage(image);
  const grad = productGradient(product.name || '');
  const cleanName = (product.name || '').replace(/\s*\(.*?\)\s*/g, '').trim();

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-amber-100/70 shadow-sm hover:shadow-xl hover:shadow-rose-100 hover:-translate-y-1.5 transition-all duration-300 animate-fade-up"
      style={{ animationDelay: `${(index % 12) * 70}ms` }}
    >
      {/* Media */}
      <Link to={`/product/${product._id}`} className="relative block aspect-square overflow-hidden">
        {usePlaceholder ? (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: grad }}
          >
            {/* faint decorative motif */}
            <svg
              viewBox="0 0 100 100"
              className="absolute -right-6 -bottom-8 h-40 w-40 opacity-10 text-white"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="50" cy="50" r="34" />
              <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
            <span className="font-display px-5 text-center text-lg font-semibold text-white drop-shadow-sm sm:text-xl">
              {cleanName || product.name}
            </span>
          </div>
        ) : (
          <>
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {hasDiscount && (
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950 shadow">
              {discountPct}% OFF
            </span>
          )}
          {(showSpecialTag || product.isBestSeller) && (
            <span className="rounded-full bg-[#d80a4e] px-2.5 py-1 text-[11px] font-semibold text-white shadow">
              {product.isBestSeller ? 'Bestseller' : 'Special'}
            </span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <Link to={`/product/${product._id}`}>
          <h4 className="font-display line-clamp-1 text-base font-semibold text-gray-900 transition-colors group-hover:text-[#d80a4e]">
            {product.name}
          </h4>
        </Link>

        {product.shortDesc && (
          <p className="mt-1 line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed text-gray-500">
            {product.shortDesc}
          </p>
        )}

        <div className="mt-3 flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#d80a4e]">₹{price}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">₹{product.price}</span>
            )}
          </div>
          {weightLabel(product.weight) && (
            <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              {weightLabel(product.weight)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className={`shine-on-hover mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-[#d80a4e] text-white hover:bg-[#b8083e]'
          }`}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> Added to Cart
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
