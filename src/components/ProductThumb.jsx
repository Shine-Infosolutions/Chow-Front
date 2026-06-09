import React from 'react';
import { isPlaceholderImage, productGradient } from '../utils/index.js';

/**
 * Compact product thumbnail used in cart / checkout / order rows.
 * Shows the real photo when available, otherwise a warm gradient tile
 * with the product name — so photo-less items still look intentional.
 */
const ProductThumb = ({ product = {}, className = 'w-16 h-16', rounded = 'rounded-xl' }) => {
  const image = product.images?.[0];
  const name = product.name || '';

  if (isPlaceholderImage(image)) {
    const clean = name.replace(/\s*\(.*?\)\s*/g, '').trim() || name;
    return (
      <div
        className={`${className} ${rounded} flex items-center justify-center overflow-hidden shrink-0`}
        style={{ background: productGradient(name) }}
      >
        <span className="font-display line-clamp-2 px-1 text-center text-[10px] font-semibold leading-tight text-white">
          {clean}
        </span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      loading="lazy"
      className={`${className} ${rounded} object-cover shrink-0`}
    />
  );
};

export default ProductThumb;
