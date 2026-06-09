// Single source of truth for the customer-facing order stage.
// Both the customer Orders page and the admin screens derive their badge
// from this, so the two sides always agree.
//
// An order has two raw fields: `status` (pending/confirmed/shipped/delivered/
// cancelled/failed) and `deliveryStatus` (PENDING/SHIPMENT_CREATED/IN_TRANSIT/
// OUT_FOR_DELIVERY/DELIVERED/RTO/PRE_PICKUP_CANCEL). The admin list also exposes
// `status` as `orderStatus`. We collapse all of that into one clear stage.

const STAGES = {
  placed:           { label: 'Order Placed',     cls: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
  confirmed:        { label: 'Confirmed',         cls: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  out_for_delivery: { label: 'Out for Delivery',  cls: 'bg-indigo-100 text-indigo-700',   dot: 'bg-indigo-500' },
  shipped:          { label: 'Shipped',           cls: 'bg-purple-100 text-purple-700',   dot: 'bg-purple-500' },
  delivered:        { label: 'Delivered',         cls: 'bg-green-100 text-green-700',      dot: 'bg-green-500' },
  cancelled:        { label: 'Cancelled',         cls: 'bg-red-100 text-red-700',          dot: 'bg-red-500' },
  returned:         { label: 'Returned',          cls: 'bg-orange-100 text-orange-700',    dot: 'bg-orange-500' },
  failed:           { label: 'Failed',            cls: 'bg-red-100 text-red-700',          dot: 'bg-red-500' },
};

export const deriveOrderStatus = (order = {}) => {
  const s = String(order.status || order.orderStatus || '').toLowerCase();
  const ds = String(order.deliveryStatus || '').toUpperCase();

  let key = 'placed';
  if (s === 'cancelled' || ds === 'PRE_PICKUP_CANCEL') key = 'cancelled';
  else if (ds === 'RTO') key = 'returned';
  else if (s === 'delivered' || ds === 'DELIVERED') key = 'delivered';
  else if (ds === 'OUT_FOR_DELIVERY') key = 'out_for_delivery';
  else if (s === 'shipped' || ds === 'IN_TRANSIT' || ds === 'SHIPMENT_CREATED') key = 'shipped';
  else if (s === 'confirmed') key = 'confirmed';
  else if (s === 'failed') key = 'failed';

  return { key, ...STAGES[key] };
};

// Linear progress steps for the happy-path stepper (self/local delivery).
export const ORDER_STEPS = [
  { key: 'placed', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

// Index of the current stage within ORDER_STEPS (shipped maps onto out-for-delivery lane).
export const orderStepIndex = (key) => {
  if (key === 'shipped') return 2;
  const i = ORDER_STEPS.findIndex((s) => s.key === key);
  return i;
};
