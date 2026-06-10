import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, Search, Menu, X } from "lucide-react";
import { useCart } from '../contexts/index.jsx';
import logo from '../assets/logo.png';

const Header = () => {
  const { getCartItemsCount, openMiniCart } = useCart();
  const cartCount = getCartItemsCount();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSearch = params.get('search');
    if (urlSearch) {
      setSearchQuery(urlSearch);
    } else {
      setSearchQuery('');
    }
  }, [location.search]);
  
  return (
    <header className="w-full bg-white fixed top-0 left-0 right-0 z-[100] shadow-sm">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-[#d80a4e] to-[#8b1a3a] text-white text-sm sm:text-base h-10 sm:h-12 flex items-center">
        <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex justify-between">
          <span className="hidden sm:block">About Us</span>
          <span className="text-center w-full sm:w-auto">🛵 Free delivery within 5 km in Gorakhpur</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo + wordmark */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt="Chowdhry Sweet House"
              className="h-12 sm:h-16 lg:h-20 object-contain"
            />
            <span className="leading-tight">
              <span className="font-display block text-base font-bold text-gray-900 sm:text-xl">Chowdhry</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d80a4e] sm:text-xs">Sweet House</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-4 lg:gap-8 font-medium text-gray-800 text-base lg:text-lg">
            <Link to="/" className="hover:text-[#d80a4e]">Home</Link>
            <Link to="/specials" className="hover:text-[#d80a4e]">Our Specials</Link>
            <Link to="/about" className="hover:text-[#d80a4e]">About</Link>
            <Link to="/contact" className="hover:text-[#d80a4e]">Contact</Link>
            <Link to="/shop" className="hover:text-[#d80a4e]">Shop Now</Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-visible mr-2">
            
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            {/* Cart → opens mini-cart drawer */}
            <button onClick={openMiniCart} className="relative z-20 flex-shrink-0 p-2" aria-label="Open cart">
              <ShoppingCart className="h-6 w-6 text-gray-700" />
              {cartCount > 0 && (
                <span key={cartCount} className="animate-badge-pop absolute right-0 top-0 z-30 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#d80a4e] px-1 text-xs font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* User */}
            <Link to="/account" className="flex-shrink-0">
              <User className="w-6 h-6 text-gray-700" />
            </Link>

            {/* Search */}
            <div className="relative hidden lg:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  if (!value.trim()) {
                    navigate('/shop');
                  }
                }}
                onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)}
                placeholder="Search products..."
                className="pl-8 pr-3 py-1.5 lg:py-2 border rounded-md w-40 lg:w-56 text-sm lg:text-base focus:outline-none"
              />
              <Search 
                className="absolute left-2 lg:left-3 top-1.5 lg:top-2.5 w-3 lg:w-4 h-3 lg:h-4 text-gray-400 cursor-pointer" 
                onClick={() => searchQuery.trim() && navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)}
              />
            </div>

          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <nav className="px-4 py-4 space-y-3 text-base">
            <Link to="/" className="block py-2 hover:text-[#d80a4e]" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/specials" className="block py-2 hover:text-[#d80a4e]" onClick={() => setMobileMenuOpen(false)}>Our Specials</Link>
            <Link to="/about" className="block py-2 hover:text-[#d80a4e]" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link to="/contact" className="block py-2 hover:text-[#d80a4e]" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <Link to="/shop" className="block py-2 hover:text-[#d80a4e]" onClick={() => setMobileMenuOpen(false)}>Shop Now</Link>
            
            {/* Mobile Search */}
            <div className="pt-3 border-t">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                      setMobileMenuOpen(false);
                    }
                  }}
                  placeholder="Search products..."
                  className="w-full pl-8 pr-3 py-2 border rounded-md text-base focus:outline-none"
                />
                <Search 
                  className="absolute left-2 top-2.5 w-4 h-4 text-gray-400 cursor-pointer" 
                  onClick={() => {
                    if (searchQuery.trim()) {
                      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                      setMobileMenuOpen(false);
                    }
                  }}
                />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
