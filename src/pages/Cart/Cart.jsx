import React from 'react';
import { Link } from 'react-router-dom';

const Cart = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-100 py-8 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center text-sm mb-4">
            <Link to="/" className="text-gray-600 hover:text-[#d80a4e]">Home</Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-800">Cart</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800">Product Cart</h1>
        </div>
        <div className="absolute top-8 right-16 hidden lg:block">
          <div className="bg-[#d80a4e] text-white px-8 py-4 rounded-full">
            <span className="text-2xl font-bold">Chowdhry</span>
            <div className="text-xs">Love at First Bite</div>
          </div>
        </div>
      </div>

      {/* Empty Cart Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Your Cart is Empty! 🍬
          </h2>
          <p className="text-gray-600 mb-8">
            It looks like your cart is missing some sweetness! Explore our delightful collection of traditional Indian sweets, from melt-in-the-mouth Besan Laddoo to rich and creamy Rajbhog. Add your favorites now and indulge in the authentic taste of pure joy. 🎂 🍰 Start Shopping & Savor the Sweetness! 🍭 😋
          </p>
          <Link 
            to="/shop" 
            className="bg-[#d80a4e] text-white px-8 py-3 rounded-lg hover:bg-[#b8083e] transition-colors font-semibold"
          >
            Start Shopping
          </Link>
        </div>
      </div>


    </div>
  );
};

export default Cart;