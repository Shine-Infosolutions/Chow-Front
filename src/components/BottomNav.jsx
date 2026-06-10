import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Store, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../contexts/index.jsx';

/**
 * App-like bottom tab bar for the storefront on mobile.
 * Hidden on desktop (lg+) where the header nav is shown.
 */
const BottomNav = () => {
  const location = useLocation();
  const { getCartItemsCount } = useCart();
  const count = getCartItemsCount();

  const items = [
    { to: '/', label: 'Home', icon: Home, match: (p) => p === '/' },
    { to: '/shop', label: 'Shop', icon: Store, match: (p) => p.startsWith('/shop') },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, match: (p) => p.startsWith('/cart'), badge: count },
    { to: '/account', label: 'Account', icon: User, match: (p) => p.startsWith('/account') || p.startsWith('/profile') || p.startsWith('/orders') },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[80] flex items-stretch border-t border-amber-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {items.map(({ to, label, icon: Icon, match, badge }) => {
        const active = match(location.pathname);
        return (
          <Link
            key={to}
            to={to}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
              active ? 'text-[#d80a4e]' : 'text-gray-400'
            }`}
          >
            <span className="relative">
              <Icon className="h-[22px] w-[22px]" />
              {badge > 0 && (
                <span
                  key={badge}
                  className="animate-badge-pop absolute -right-2 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[#d80a4e] px-1 text-[10px] font-bold text-white"
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
