import React from 'react';

/** Generic shimmer block. Pass width/height via className. */
export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton rounded-md ${className}`} />
);

/** Placeholder that mirrors a ProductCard while data loads. */
export const ProductCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl border border-amber-100/70 bg-white shadow-sm">
    <div className="skeleton aspect-square w-full" />
    <div className="space-y-3 p-4">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="flex items-center justify-between pt-1">
        <div className="skeleton h-5 w-16 rounded" />
        <div className="skeleton h-5 w-12 rounded-full" />
      </div>
      <div className="skeleton h-9 w-full rounded-xl" />
    </div>
  </div>
);

/** A responsive grid of product-card skeletons. */
export const ProductGridSkeleton = ({ count = 8, className = '' }) => (
  <div className={className || 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-6 lg:grid-cols-4'}>
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export default Skeleton;
