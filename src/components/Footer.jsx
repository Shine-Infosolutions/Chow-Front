import React from "react";
import { Link } from "react-router-dom";
import { Phone, MapPin, Clock, Navigation } from "lucide-react";
import logo from '../assets/logo.png';

const PHONE = "+91 7525025100";
const MAPS_URL = "https://maps.google.com/?q=Chowdhry+Sweet+House+Vijay+Chowk+Gorakhpur";

const Footer = () => {
  return (
    <footer className="border-t border-amber-100 bg-[#fdf6ee] text-gray-700">
      {/* Top accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#d80a4e] via-amber-400 to-[#d80a4e]" />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">

          {/* Brand */}
          <div>
            <img src={logo} alt="Chowdhry Sweet House" className="mb-4 w-36 sm:w-44" />
            <p className="max-w-xs text-sm leading-relaxed text-gray-600">
              Handcrafted traditional mithai &amp; namkeen from the heart of Gorakhpur —
              serving sweetness since 1970.
            </p>
            <a
              href={`tel:${PHONE.replace(/\s/g, '')}`}
              className="mt-4 inline-flex items-center gap-2 font-semibold text-[#d80a4e] hover:underline"
            >
              <Phone className="h-4 w-4" /> {PHONE}
            </a>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display mb-4 text-lg font-semibold text-gray-900">Shop</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="text-gray-600 transition-colors hover:text-[#d80a4e]">Home</Link></li>
              <li><Link to="/shop" className="text-gray-600 transition-colors hover:text-[#d80a4e]">All Sweets</Link></li>
              <li><Link to="/specials" className="text-gray-600 transition-colors hover:text-[#d80a4e]">Our Specials</Link></li>
              <li><Link to="/cart" className="text-gray-600 transition-colors hover:text-[#d80a4e]">Cart</Link></li>
            </ul>
          </div>

          {/* Account & Help */}
          <div>
            <h4 className="font-display mb-4 text-lg font-semibold text-gray-900">Account &amp; Help</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/account" className="text-gray-600 transition-colors hover:text-[#d80a4e]">My Account</Link></li>
              <li><Link to="/orders" className="text-gray-600 transition-colors hover:text-[#d80a4e]">Track My Orders</Link></li>
              <li><Link to="/contact" className="text-gray-600 transition-colors hover:text-[#d80a4e]">Contact Us</Link></li>
              <li><Link to="/about" className="text-gray-600 transition-colors hover:text-[#d80a4e]">About Us</Link></li>
            </ul>
          </div>

          {/* Visit Us */}
          <div>
            <h4 className="font-display mb-4 text-lg font-semibold text-gray-900">Visit Us</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#d80a4e]" />
                <span>Vijay Chowk, in front of Vijay Talkies, Golghar, Gorakhpur, UP 273001</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#d80a4e]" />
                <span>8:00 AM – 11:30 PM · All week</span>
              </li>
              <li>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-medium text-[#d80a4e] hover:underline"
                >
                  <Navigation className="h-4 w-4" /> Get Directions
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-amber-100 pt-6 text-sm sm:flex-row">
          <p className="text-center text-gray-500 sm:text-left">
            © 2025 <strong className="text-gray-700">Chowdhry Sweet House</strong>. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 font-medium text-green-600">🛵 Free delivery within 5 km in Gorakhpur</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
