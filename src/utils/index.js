// ============================================================================
// RAZORPAY UTILITIES
// ============================================================================
export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// ============================================================================
// COMMON UTILITIES
// ============================================================================

// Returns the price a customer actually pays: the discounted price when a valid
// discount exists, otherwise the regular price. Guards against products that
// have no discountPrice set (which previously rendered as ₹undefined / NaN).
export const getEffectivePrice = (product = {}) => {
  const price = Number(product.price) || 0;
  const discountPrice = Number(product.discountPrice);
  return discountPrice > 0 && discountPrice < price ? discountPrice : price;
};

// Warm "mithai" gradients for products that don't have a real photo yet.
export const PRODUCT_GRADIENTS = [
  'linear-gradient(135deg, #d80a4e 0%, #8b1a3a 100%)', // rose → maroon
  'linear-gradient(135deg, #f6a623 0%, #e8590c 100%)', // saffron → orange
  'linear-gradient(135deg, #e8a317 0%, #a8741a 100%)', // gold → bronze
  'linear-gradient(135deg, #6aa84f 0%, #2f7a32 100%)', // pista → green
  'linear-gradient(135deg, #ec4f7c 0%, #b3094a 100%)', // pink → deep rose
  'linear-gradient(135deg, #c98b2e 0%, #7a4a12 100%)', // kesar → brown
];

// A placeholder image is one that isn't a real uploaded photo.
export const isPlaceholderImage = (url) => !url || url.includes('placehold.co');

// Pick a stable gradient for a product based on its name.
export const productGradient = (name = '') => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PRODUCT_GRADIENTS[h % PRODUCT_GRADIENTS.length];
};

// Human-friendly weight label: 500 -> "500 g", 1000 -> "1 kg".
export const weightLabel = (weight) =>
  !weight ? null : weight >= 1000 ? `${weight / 1000} kg` : `${weight} g`;

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// ============================================================================
// ADMIN UTILITIES
// ============================================================================
export const formatObjectValue = (val, key = '', options = {}) => {
  if (val === null || val === undefined) return 'N/A';
  
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      if (key === 'items' && options.formatItems) {
        return val.map(item => `${item.itemId?.name || 'Item'} (Qty: ${item.quantity})`).join(', ');
      }
      return val.length > 0 ? `${val.length} entries` : 'Empty';
    }
    
    if (key === 'shipping' && options.formatShipping) {
      return `Provider: ${val.provider || 'N/A'}, Total: ₹${val.total || 0}, Charged: ${val.charged ? 'Yes' : 'No'}`;
    }
    
    return JSON.stringify(val, null, 2);
  }
  
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'number' && key.toLowerCase().includes('price')) return `₹${val}`;
  if (key.toLowerCase().includes('date')) {
    try {
      return new Date(val).toLocaleString();
    } catch {
      return String(val);
    }
  }
  
  return String(val);
};